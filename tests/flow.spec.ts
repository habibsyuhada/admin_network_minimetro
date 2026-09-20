import { dragCable } from "./helpers";
import { test, expect } from "@playwright/test";

test("point-to-point cables have separate carriers and can be removed individually", async ({
  page,
}) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Main NOC Flow" }).click();
  await page.getByRole("button", { name: "Ayo hubungkan" }).click();
  const tap = async (name: string) =>
    page.getByRole("button", { name, exact: true }).click();
  await dragCable(page, 0, 1);
  await expect(page.getByTestId("cable-count")).toHaveText("1 kabel aktif");
  // Tapping inspects a node and never extends or creates a cable.
  await tap("Database 3");
  await expect(page.getByTestId("cable-count")).toHaveText("1 kabel aktif");
  await expect(
    page.getByRole("dialog", { name: "Detail Database 3" }),
  ).toBeVisible();
  await tap("Kembali ke peta");
  await dragCable(page, 2, 1);
  await expect(page.getByTestId("cable-count")).toHaveText("2 kabel aktif");
  await expect(page.locator("[data-carrier]")).toHaveCount(2);
  await expect(page.locator('[data-carrier="1"]')).toContainText("/4");
  await tap("Kabel Fiber");
  await dragCable(page, 0, 1);
  await expect(page.locator('[data-carrier="3"]')).toContainText("/3");
  const colors = await page
    .locator("[data-route]")
    .evaluateAll((paths) => paths.map((p) => p.getAttribute("stroke")));
  expect(colors[0]).toBe(colors[1]);
  expect(colors[2]).not.toBe(colors[0]);
  await dragCable(page, 0, 1);
  await expect(
    page.getByText("Kabel jenis ini sudah menghubungkan kedua perangkat."),
  ).toBeVisible();
  await expect(page.getByTestId("cable-count")).toHaveText("3 kabel aktif");
  await tap("Jeda mode Flow");
  const clock = await page.getByTestId("flow-clock").textContent();
  await page.waitForTimeout(1100);
  await expect(page.getByTestId("flow-clock")).toHaveText(clock!);
  await tap("Lanjutkan Flow");
  await tap("Kelola kabel");
  await tap("Hapus kabel 1");
  await tap("Selesai");
  await expect(page.getByTestId("cable-count")).toHaveText("2 kabel aktif");
  await expect(page.locator('[data-carrier="1"]')).toHaveCount(0);
  await expect(page.locator('[data-carrier="2"]')).toHaveCount(1);
  await expect(page.getByTestId("gold")).toHaveText("650 gold");
  await page.screenshot({
    path: `test-results/cables-${test.info().project.name}.png`,
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("drag makes one cable and mobile layouts remain usable", async ({
  page,
  browser,
}) => {
  test.setTimeout(60000);
  await page.goto("/");
  await page.getByRole("button", { name: "Main NOC Flow" }).click();
  await page.getByRole("button", { name: "Ayo hubungkan" }).click();
  const a = (await page
    .getByRole("button", { name: "Client 1", exact: true })
    .boundingBox())!;
  const b = (await page
    .getByRole("button", { name: "Server 2", exact: true })
    .boundingBox())!;
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByTestId("cable-count")).toHaveText("1 kabel aktif");
  await page
    .getByRole("group", { name: "Peta Flow interaktif" })
    .dispatchEvent("pointercancel");
  await expect(page.getByTestId("cable-count")).toHaveText("1 kabel aktif");
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
        small.getByRole("button", { name: "Kabel Ethernet", exact: true }),
      ).toBeInViewport();
      await expect(
        small.getByRole("button", { name: "Database 3", exact: true }),
      ).toBeInViewport();
      await small.screenshot({
        path: `test-results/cable-layout-${test.info().project.name}-${viewport.width}.png`,
      });
    } finally {
      await context.close();
    }
  }
});
