import { test, expect, type Page } from "@playwright/test";
import {
  initial,
  connect,
  tick,
  upgrade,
  repair,
  type State,
} from "../src/game/engine";
import { KEY, freshProfile } from "../src/game/storage";
async function begin(page: Page) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Mulai shift baru", exact: true })
    .click();
  await page.getByRole("button", { name: "Mulai bertugas" }).click();
}
async function link(page: Page, from: string, to: string) {
  await page.getByRole("button", { name: from, exact: true }).click();
  await page.getByRole("button", { name: /Sambungkan ke node lain/ }).click();
  await page.getByRole("button", { name: to, exact: true }).click();
}
async function seed(page: Page, run: State) {
  await page.addInitScript(
    ({ key, profile }) => {
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify(profile));
    },
    { key: KEY, profile: { ...freshProfile(), version: 2, run } },
  );
}
function nearFinish(steps = 5990) {
  let s = connect(
    connect(initial(42, false), "hq", "router"),
    "router",
    "server",
  );
  for (let i = 0; i < steps; i++) {
    if (s.time === 90) s = connect(s, "branch", "router");
    if (s.time === 180) s = connect(s, "studio", "router");
    if (s.time === 230) s = upgrade(s);
    if (s.time === 392) s = repair(s);
    s = tick(s);
  }
  return s;
}
test("new shift, tap connections, pause, reload and resume", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await begin(page);
  await link(page, "Kantor HQ", "Router A");
  await link(page, "Router A", "App Server");
  await expect(page.getByText("2 koneksi", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Jeda permainan" }).click();
  const before = await page.getByTestId("clock").textContent();
  await page.waitForTimeout(350);
  await expect(page.getByTestId("clock")).toHaveText(before!);
  await page.getByRole("button", { name: "Simpan & kembali ke menu" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Lanjutkan shift" }).click();
  await expect(page.getByText("2 koneksi", { exact: true })).toBeVisible();
  await page.screenshot({
    path: `test-results/game-${test.info().project.name}.png`,
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("keyboard can build the entire first route", async ({ page }) => {
  await begin(page);
  for (const [a, b] of [
    ["Kantor HQ", "Router A"],
    ["Router A", "App Server"],
  ]) {
    await page.getByRole("button", { name: a, exact: true }).focus();
    await page.keyboard.press("Enter");
    await page.getByRole("button", { name: /Sambungkan ke node lain/ }).focus();
    await page.keyboard.press("Enter");
    await page.getByRole("button", { name: b, exact: true }).focus();
    await page.keyboard.press("Enter");
  }
  await expect(page.getByText("2 koneksi", { exact: true })).toBeVisible();
});
test("drag creates a connection and an invalid bypass reports its reason", async ({
  page,
}) => {
  await begin(page);
  const a = await page
    .getByRole("button", { name: "Kantor HQ", exact: true })
    .locator(".node-box")
    .boundingBox();
  const b = await page
    .getByRole("button", { name: "Router A", exact: true })
    .locator(".node-box")
    .boundingBox();
  await page.mouse.move(a!.x + a!.width / 2, a!.y + a!.height / 2);
  await page.mouse.down();
  await page.mouse.move(b!.x + b!.width / 2, b!.y + b!.height / 2, {
    steps: 8,
  });
  await expect(page.locator(".drag-line")).toHaveAttribute("x2", /[0-9]+/);
  await page.mouse.up();
  await expect(page.getByText("1 koneksi", { exact: true })).toBeVisible();
  await link(page, "Kantor HQ", "App Server");
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Koneksi harus melalui router" }),
  ).toBeVisible();
});
test("finish updates records once and restart requires confirmation", async ({
  page,
}) => {
  await seed(page, nearFinish());
  await page.goto("/");
  await page.getByRole("button", { name: "Lanjutkan shift" }).click();
  await expect(
    page.getByRole("dialog", { name: "Distrik tetap online." }),
  ).toBeVisible({ timeout: 10000 });
  await page.getByRole("button", { name: "Kembali ke menu" }).click();
  const profile = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    KEY,
  );
  expect(profile.wins).toBe(1);
  expect(profile.best).toBeGreaterThan(7000);
  await page.reload();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).wins,
      KEY,
    ),
  ).toBe(1);
  await page.getByRole("button", { name: "Main lagi", exact: true }).click();
  await page.getByRole("button", { name: "Jeda permainan" }).click();
  await page.getByRole("button", { name: "Ulangi shift", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Ulangi shift ini?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Batal", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Shift dijeda" }),
  ).toBeVisible();
});
test("storage failure remains playable with a visible warning", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error("quota");
    };
  });
  await begin(page);
  await expect(page.getByText(/Penyimpanan gagal/)).toBeVisible();
  await link(page, "Kantor HQ", "Router A");
  await expect(page.getByText("1 koneksi", { exact: true })).toBeVisible();
});
test("installed cache reloads offline with the saved shift", async ({
  page,
  context,
  browserName,
}) => {
  test.skip(
    browserName === "webkit",
    "Windows WebKit does not implement service workers; real Safari remains a release gate.",
  );
  await begin(page);
  await link(page, "Kantor HQ", "Router A");
  await page.getByRole("button", { name: "Jeda permainan" }).click();
  await page.getByRole("button", { name: "Simpan & kembali ke menu" }).click();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: "Lanjutkan shift" }).click();
  await expect(page.getByText("1 koneksi", { exact: true })).toBeVisible();
});
test("small portrait and landscape remain usable without horizontal overflow", async ({
  page,
  browser,
  browserName,
}) => {
  await page.goto("/");
  await page.screenshot({
    path: `test-results/home-${test.info().project.name}.png`,
    fullPage: true,
  });
  for (const size of [
    { width: 360, height: 640 },
    { width: 844, height: 390 },
  ]) {
    // Test responsive CSS with a fixed layout viewport. Separate device projects
    // exercise mobile input; real iPhone viewport/zoom remains a release gate.
    const context = await browser.newContext({
      viewport: size,
      screen: size,
      isMobile: false,
      hasTouch: true,
      deviceScaleFactor: 1,
      baseURL: "http://127.0.0.1:4173",
    });
    const small = await context.newPage();
    try {
      await begin(small);
      await small.screenshot({
        path: `test-results/small-${test.info().project.name}-${size.width}.png`,
        fullPage: true,
      });
      await expect
        .poll(() =>
          small.evaluate(
            () =>
              document.documentElement.scrollWidth -
              document.documentElement.clientWidth,
          ),
        )
        .toBeLessThanOrEqual(1);
      await small
        .getByRole("button", { name: "Router A", exact: true })
        .click();
      await expect(
        small.getByRole("button", { name: "Tutup dialog" }),
      ).toBeInViewport();
      await small.getByRole("button", { name: "Tutup dialog" }).click();
    } finally {
      await context.close();
    }
  }
});

test("outage can be repaired from the HUD and loss recovers", async ({
  page,
}) => {
  await seed(page, nearFinish(3900));
  await page.goto("/");
  await page.getByRole("button", { name: "Lanjutkan shift" }).click();
  await expect(page.getByText(/Pulihkan layanan dalam/)).toBeVisible();
  await page.getByRole("button", { name: /Perbaiki jalur/ }).click();
  await expect(page.getByText(/Pulihkan layanan dalam/)).toHaveCount(0);
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: /Jalur Router A.*Server pulih/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Jeda permainan" }).click();
  await page.getByRole("button", { name: "Simpan & kembali ke menu" }).click();
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!).run,
    KEY,
  );
  expect(saved.repaired).toBe(true);
  expect(saved.badTime).toBe(0);
});

test("visibility lifecycle pauses and persists without advancing during absence", async ({
  page,
}) => {
  await begin(page);
  await link(page, "Kantor HQ", "Router A");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(
    page.getByRole("dialog", { name: "Shift dijeda" }),
  ).toBeVisible();
  const time = await page.getByTestId("clock").textContent();
  await page.waitForTimeout(300);
  await expect(page.getByTestId("clock")).toHaveText(time!);
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).run.links.length,
      KEY,
    ),
  ).toBe(1);
  await page.evaluate(() => {
    delete (document as unknown as { hidden?: boolean }).hidden;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(
    page.getByRole("dialog", { name: "Shift dijeda" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Lanjutkan", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
