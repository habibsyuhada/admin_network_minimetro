import { test, expect } from "@playwright/test";

test("mobile game menu opens only Flow and keeps sound preferences", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "NOC FLOW." })).toBeVisible();
  await expect(page.getByText("Shift pagi pertama")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Mulai shift baru" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Matikan suara" }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Aktifkan suara" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Panduan", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Panduan operator" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Siap menghubungkan" }).click();
  await page.screenshot({
    path: `test-results/home-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Main NOC Flow" }).click();
  await page.getByRole("button", { name: "Ayo hubungkan" }).click();
  await expect(
    page.getByRole("button", { name: "Client 1", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "YouTube 2", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Facebook 3", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Jeda mode Flow" }).click();
  await page.getByRole("button", { name: "Akhiri sesi & ke menu" }).click();
  await expect(
    page.getByRole("button", { name: "Main NOC Flow" }),
  ).toBeVisible();
});

test("blocked storage does not prevent starting Flow", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error("blocked");
    };
  });
  await page.goto("/");
  await expect(
    page.getByText(/Progres, rekor, dan pengaturan belum bisa disimpan/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Main NOC Flow" }).click();
  await page.getByRole("button", { name: "Ayo hubungkan" }).click();
  await expect(
    page.getByRole("button", { name: "Client 1", exact: true }),
  ).toBeVisible();
});
