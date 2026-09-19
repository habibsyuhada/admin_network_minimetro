import { test, expect } from "@playwright/test";

test("Flow builds routes, pauses, resets and fits mobile", async ({
  page,
  browser,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  // Windows WebKit mobile emulation has a baseline visual/layout viewport
  // discrepancy, also present on the unchanged home page. Check no regression
  // here; assert actual responsive layout in fixed viewport contexts below.
  const baselineOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - innerWidth,
  );
  await page.getByRole("button", { name: "Main NOC Flow" }).click();
  await page.getByRole("button", { name: "Ayo hubungkan" }).click();
  for (const n of ["Simpul 1 ●", "Simpul 2 ▲", "Simpul 3 ■"]) {
    await page.getByRole("button", { name: n, exact: true }).click();
  }
  await expect(
    page.getByRole("button", { name: "Jalur 1", exact: true }),
  ).toContainText("3 simpul");
  await page.getByRole("button", { name: "Jeda mode Flow" }).click();
  const clock = await page.getByTestId("flow-clock").textContent();
  await page.waitForTimeout(1200);
  await expect(page.getByTestId("flow-clock")).toHaveText(clock!);
  await page.getByRole("button", { name: "Lanjutkan Flow" }).click();
  await page.getByRole("button", { name: "Atur ulang jalur terpilih" }).click();
  await page
    .getByRole("button", { name: "Atur ulang jalur", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Jalur 1", exact: true }),
  ).toContainText("0 simpul");
  for (const n of ["Simpul 1 ●", "Simpul 2 ▲", "Simpul 3 ■"]) {
    await page.getByRole("button", { name: n, exact: true }).click();
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    ),
  ).toBeLessThanOrEqual(baselineOverflow + 1);
  await page.screenshot({
    path: `test-results/flow-${test.info().project.name}.png`,
    fullPage: true,
  });
  expect(errors).toEqual([]);
  for (const viewport of [
    { width: 360, height: 640 },
    { width: 844, height: 390 },
  ]) {
    const context = await browser.newContext({
      viewport,
      screen: viewport,
      isMobile: false,
      hasTouch: true,
      deviceScaleFactor: 1,
      baseURL: "http://127.0.0.1:4173",
    });
    try {
      const small = await context.newPage();
      await small.goto("/");
      await small.getByRole("button", { name: "Main NOC Flow" }).click();
      await small.getByRole("button", { name: "Ayo hubungkan" }).click();
      expect(
        await small.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        ),
      ).toBeLessThanOrEqual(1);
      await expect(
        small.getByRole("button", { name: "Jalur 1", exact: true }),
      ).toBeInViewport();
      await expect(
        small.getByRole("button", { name: "Simpul 3 ■", exact: true }),
      ).toBeInViewport();
      await small.screenshot({
        path: `test-results/flow-layout-${test.info().project.name}-${viewport.width}.png`,
      });
    } finally {
      await context.close();
    }
  }
});

test("drag joins nodes and pointer cancellation leaves the route unchanged", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Main NOC Flow" }).click();
  await page.getByRole("button", { name: "Ayo hubungkan" }).click();
  const a = await page
    .getByRole("button", { name: "Simpul 1 ●", exact: true })
    .boundingBox();
  const b = await page
    .getByRole("button", { name: "Simpul 2 ▲", exact: true })
    .boundingBox();
  await page.mouse.move(a!.x + a!.width / 2, a!.y + a!.height / 2);
  await page.mouse.down();
  await page.mouse.move(b!.x + b!.width / 2, b!.y + b!.height / 2, {
    steps: 8,
  });
  await page.mouse.up();
  await expect(
    page.getByRole("button", { name: "Jalur 1", exact: true }),
  ).toContainText("2 simpul");
  await page
    .getByRole("group", { name: "Peta Flow interaktif" })
    .dispatchEvent("pointercancel");
  await expect(
    page.getByRole("button", { name: "Jalur 1", exact: true }),
  ).toContainText("2 simpul");
});
