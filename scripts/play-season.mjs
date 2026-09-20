import { chromium } from "@playwright/test";
import fs from "node:fs";
import { play } from "./balance.mjs";
const campaign = process.argv[2] === "neighborhood";
const run = play(987, "adaptive", campaign ? "neighborhood" : undefined);
if (
  campaign
    ? run.phase !== "complete"
    : run.phase !== "reward" || run.month !== 12
)
  throw Error("Replay must reach month 12");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.setDefaultTimeout(15000);
await page.clock.install({ time: new Date(987) });
await page.goto("http://127.0.0.1:5173/");
await page.clock.pauseAt(new Date(100000));
await page.clock.setFixedTime(new Date(987));
await page
  .getByRole("button", {
    name: campaign ? "Main level 1" : "Main NOC Flow",
    exact: true,
  })
  .click();
await page.getByRole("button", { name: "Ayo hubungkan" }).click();
let now = 0,
  paused = false;
const btn = (name) => page.getByRole("button", { name, exact: true });
const pause = async () => {
  if (!paused) {
    await btn("Jeda mode Flow").click();
    paused = true;
  }
};
const resume = async () => {
  if (paused) {
    await btn("Lanjutkan Flow").click();
    paused = false;
  }
};
const point = async (x, y) =>
  page.locator(".metro-map").evaluate(
    (el, { x, y }) => {
      const p = new DOMPoint(x, y).matrixTransform(el.getScreenCTM());
      return { x: p.x, y: p.y };
    },
    { x, y },
  );
const drag = async (a, b) => {
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(b.x, b.y, { steps: 3 });
  await page.mouse.up();
};
const nodePoint = (id) =>
  page.locator(`[data-node-id="${id}"]`).evaluate((el) => {
    const p = new DOMPoint(0, 0).matrixTransform(el.getScreenCTM());
    return { x: p.x, y: p.y };
  });
const reports = [];
try {
  for (const action of run.actions) {
    if (action.time > now) {
      await resume();
      await page.clock.runFor(Math.round((action.time - now) * 1000));
      now = action.time;
    }
    if (action.type === "reward") {
      const report = page.getByRole("dialog", {
        name: new RegExp(`Bulan ${Math.round(now / 60)} selesai`),
      });
      await report.waitFor();
      const summary = await report.innerText();
      reports.push({ time: now, summary });
      console.log(
        `Month ${now / 60}: ${summary.split("\n").slice(0, 7).join(" ")}`,
      );
      if ([360, 720].includes(now))
        await page.screenshot({
          path: `docs/balance/season-month-${now / 60}.png`,
          fullPage: true,
        });
      const choice = action.args[0];
      if (choice === "continue") await btn("Lanjut bulan berikutnya").click();
      else
        await page
          .getByRole("button", {
            name:
              choice === "capacity"
                ? /^\+2 kapasitas/
                : /^Tingkatkan kecepatan/,
          })
          .click();
      continue;
    }
    await pause();
    if (action.type === "place") {
      await btn("Lihat seluruh area").click();
      await page.getByRole("button", { name: /Pasang router/ }).click();
      const preview = page.getByRole("button", {
        name: "Geser pratinjau router",
      });
      const start = await preview.evaluate((el) => {
        const p = new DOMPoint(0, 0).matrixTransform(el.getScreenCTM());
        return { x: p.x, y: p.y };
      });
      await drag(start, await point(action.args[0], action.args[1]));
      await btn("OK").click();
    } else if (action.type === "connect") {
      await btn("Lihat seluruh area").click();
      await btn(
        `Kabel ${["Ethernet", "Fiber", "Backbone"][action.args[0]]}`,
      ).click();
      await drag(
        await nodePoint(action.args[1]),
        await nodePoint(action.args[2]),
      );
    } else if (action.type === "change") {
      const id = action.args[0];
      await btn("Kelola kabel").click();
      // The cable manager labels provide an endpoint name; inspection uses its first node.
      const text = await page.getByRole("dialog").innerText();
      await btn("Selesai").click();
      const cable = run.actions.find(
        (a) =>
          a.type === "connect" &&
          run.actions.filter((b) => b.type === "connect").indexOf(a) + 1 === id,
      );
      await page.locator(`[data-node-id="${cable.args[1]}"]`).click();
      const card = page.locator(`[data-cable-detail="${id}"]`);
      await card.locator("summary").click();
      await btn(
        `Ganti kabel ${id} ke ${["Ethernet", "Fiber", "Backbone"][action.args[1]]}`,
      ).click();
      await btn("Kembali ke peta").click();
    }
    if (await page.getByRole("alert").count())
      throw Error(await page.getByRole("alert").innerText());
  }
  await resume();
  await page.clock.runFor(Math.round((run.time - now) * 1000));
  const end = page.getByRole("dialog", {
    name: campaign ? "Misi selesai!" : "Bulan 12 selesai",
  });
  await end.waitFor();
  reports.push({ time: run.time, summary: await end.innerText() });
  const delivered = Number(await page.getByTestId("delivered").innerText());
  const gold = await page.getByTestId("gold").innerText();
  await page.screenshot({
    path: campaign
      ? "docs/balance/campaign-win.png"
      : "docs/balance/season-month-12.png",
    fullPage: true,
  });
  fs.writeFileSync(
    campaign
      ? "docs/balance/campaign-browser.json"
      : "docs/balance/browser.json",
    JSON.stringify(
      {
        seed: 987,
        months: run.month,
        delivered,
        gold,
        reports,
        actions: run.actions.length,
      },
      null,
      2,
    ),
  );
  if (campaign) {
    await btn("Kembali ke peta misi").click();
    await page.reload();
    await page.getByRole("button", { name: /Level 2:/ }).click();
    if (!(await btn("Main level 2").isEnabled()))
      throw Error("Win did not persist or unlock map 2");
  }
  console.log(
    JSON.stringify({
      months: run.month,
      delivered,
      gold,
      expectedDelivered: run.delivered,
      expectedGold: run.gold,
    }),
  );
} catch (error) {
  await page.screenshot({
    path: "docs/balance/season-error.png",
    fullPage: true,
  });
  throw error;
} finally {
  await browser.close();
}
