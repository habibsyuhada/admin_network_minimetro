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
  await page.getByRole("button", { name: "Mute sound" }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Enable sound" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Guide", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Operator guide" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ready to connect" }).click();
  await page.screenshot({
    path: `test-results/home-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Play NOC Flow" }).click();
  await page.getByRole("button", { name: "Start connecting" }).click();
  await expect(
    page.getByRole("button", { name: "Client 1", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "YouTube 2", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Facebook 3", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pause Flow" }).click();
  await page.getByRole("button", { name: "Game menu" }).click();
  await page.getByRole("button", { name: "End session & exit" }).click();
  await expect(
    page.getByRole("button", { name: "Play NOC Flow" }),
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
    page.getByText(/Progress, records, and settings could not be saved/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Play NOC Flow" }).click();
  await page.getByRole("button", { name: "Start connecting" }).click();
  await expect(
    page.getByRole("button", { name: "Client 1", exact: true }),
  ).toBeVisible();
});
