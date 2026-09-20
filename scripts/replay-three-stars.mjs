import { chromium } from "@playwright/test";
import fs from "node:fs";
const campaign = true;
const run = JSON.parse(fs.readFileSync("docs/balance/level1-three-stars-plan.json", "utf8"));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 600, height: 900 } });
page.setDefaultTimeout(15000);
await page.clock.install({ time: new Date(987) });
await page.goto("http://127.0.0.1:5173/");
await page.clock.pauseAt(new Date(100000));
await page.clock.setFixedTime(new Date(987));
await page
  .getByRole("button", {
    name: campaign ? "Play level 1" : "Play NOC Flow",
    exact: true,
  })
  .click();
await page.getByRole("button", { name: "Start connecting" }).click();
let now = 0,
  paused = false;
const btn = (name) => page.getByRole("button", { name, exact: true });
const pause = async () => {
  if (!paused) {
    await btn("Pause Flow").click();
    paused = true;
  }
};
const resume = async () => {
  if (paused) {
    await btn("Resume Flow").click();
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
      if (now === 0 || now === 180) await page.screenshot({path:`docs/balance/three-stars-topology-${now}.png`});
      await resume();
      await page.clock.runFor(Math.round((action.time - now) * 1000));
      now = action.time;
    }
    if (action.type === "buy") {
      const names = {
        bandwidth: "Bandwidth Module",
        buffer: "Buffer Module",
        transfer: "Transfer Accelerator",
      };
      await btn(`Buy ${names[action.args[0]]}`).click();
      continue;
    }
    if (action.type === "reward") {
      const report = page.getByRole("dialog", {
        name: new RegExp(`Month ${Math.round(now / 60)} complete`),
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
      if (choice === "continue") await btn("Continue to next month").click();
      else
        await page
          .getByRole("button", {
            name: choice === "capacity" ? /^\+2 capacity/ : /^Increase speed/,
          })
          .click();
      continue;
    }
    await pause();
    if (action.type === "equip") {
      await page.locator(`[data-node-id="${action.args[0]}"]`).click();
      await btn("Equip Bandwidth Module").click();
      await btn("Back to map").click();
    } else if (action.type === "place") {
      if (!(await btn("Show whole map").isVisible()))
        await btn("Map controls").click();
      await btn("Show whole map").click();
      await btn("Build device").click();
      await page.getByRole("button", { name: /Place router/ }).click();
      const preview = page.getByRole("button", {
        name: "Move preview router",
      });
      const start = await preview.evaluate((el) => {
        const p = new DOMPoint(0, 0).matrixTransform(el.getScreenCTM());
        return { x: p.x, y: p.y };
      });
      await drag(start, await point(action.args[0], action.args[1]));
      await btn("OK").click();
    } else if (action.type === "connect") {
      if (!(await btn("Show whole map").isVisible()))
        await btn("Map controls").click();
      await btn("Show whole map").click();
      await btn("Choose cable").click();
      await btn(
        `Cable ${["Ethernet", "Fiber", "Backbone"][action.args[0]]}`,
      ).click();
      await drag(
        await nodePoint(action.args[1]),
        await nodePoint(action.args[2]),
      );
    } else if (action.type === "change") {
      const id = action.args[0];
      await btn("Choose cable").click();
      await btn("Manage cables").click();
      // The cable manager labels provide an endpoint name; inspection uses its first node.
      const text = await page.getByRole("dialog").innerText();
      await btn("Done").click();
      const cable = run.actions.find(
        (a) =>
          a.type === "connect" &&
          run.actions.filter((b) => b.type === "connect").indexOf(a) + 1 === id,
      );
      await page.locator(`[data-node-id="${cable.args[1]}"]`).click();
      const card = page.locator(`[data-cable-detail="${id}"]`);
      await card.locator("summary").click();
      await btn(
        `Change cable ${id} to ${["Ethernet", "Fiber", "Backbone"][action.args[1]]}`,
      ).click();
      await btn("Back to map").click();
    }
    if (await page.getByRole("alert").count())
      throw Error(await page.getByRole("alert").innerText());
  }
  await resume();
  await page.clock.runFor(Math.round((run.time - now) * 1000));
  const end = page.getByRole("dialog", {
    name: campaign ? "Mission complete!" : "Month 12 complete",
  });
  await end.waitFor();
  reports.push({ time: run.time, summary: await end.innerText() });
  const summary = await end.innerText();
  if (!(await end.getByLabel("3 stars",{exact:true}).count())) throw Error("Did not earn three stars: "+summary);
  await page.screenshot({path:"docs/balance/three-stars-victory.png",fullPage:true});
  fs.writeFileSync("docs/balance/three-stars-browser.json",JSON.stringify({summary,reports,actions:run.actions},null,2));
  console.log(summary);
} catch (error) {
  await page.screenshot({
    path: "docs/balance/three-stars-error.png",
    fullPage: true,
  });
  throw error;
} finally {
  await browser.close();
}
