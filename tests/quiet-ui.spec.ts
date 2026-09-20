import { test, expect } from "@playwright/test";
test("quiet gameplay shows contextual tools without covering the world", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Main level 1", exact: true }).click();
  await page.getByRole("button", { name: "Ayo hubungkan" }).click();
  await page.getByRole("button", { name: "Jeda mode Flow" }).click();
  await expect(
    page.getByRole("button", { name: "Kabel Fiber", exact: true }),
  ).toBeHidden();
  await expect(page.getByText("Profit:", { exact: false })).toHaveCount(0);
  const map = await page.locator(".metro-map").boundingBox();
  const height = await page.evaluate(
    () => visualViewport?.height ?? innerHeight,
  );
  expect(map!.height / height).toBeGreaterThan(0.65);
  await page.screenshot({
    path: `test-results/quiet-play-${test.info().project.name}.png`,
  });
  await page.getByRole("button", { name: "Pilih kabel", exact: true }).click();
  await page.getByRole("button", { name: "Kabel Fiber", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Pilih kabel", exact: true }),
  ).toContainText("Fiber");
  await expect(
    page.getByRole("button", { name: "Kabel Ethernet", exact: true }),
  ).toBeHidden();
  await page
    .getByRole("button", { name: "Bangun perangkat", exact: true })
    .click();
  await page.getByRole("button", { name: /Pasang switch/ }).click();
  await expect(
    page.getByRole("button", { name: "Geser pratinjau switch" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByTestId("gold")).toHaveText("1800 gold");
  await page.getByRole("button", { name: "Lihat keuangan dan target" }).click();
  await expect(page.getByRole("dialog", { name: "Jaringanmu" })).toContainText(
    "Maintenance: 0",
  );
  await page.getByRole("button", { name: "Kembali bermain" }).click();
  await expect(
    page.getByRole("button", { name: "Lanjutkan Flow" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Atur tampilan peta" }).click();
  await page.getByRole("button", { name: "Lihat seluruh area" }).click();
  await page
    .getByRole("button", { name: "Menu permainan", exact: true })
    .click();
  await page.getByRole("button", { name: "Akhiri sesi & ke menu" }).click();
  await expect(
    page.getByRole("region", { name: "Peta perjalanan" }),
  ).toBeVisible();
});
