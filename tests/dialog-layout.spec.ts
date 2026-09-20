import { test, expect, type Page } from "@playwright/test";
import { addTransit } from "./helpers";
async function check(page: Page, action?: string) {
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const heading = dialog.locator(".dialog-heading"),
    footer = dialog.locator(".dialog-footer"),
    body = dialog.locator(".dialog-body");
  const before = await heading.boundingBox(),
    bottom = await footer.boundingBox();
  await body.evaluate((el) => (el.scrollTop = el.scrollHeight));
  expect((await heading.boundingBox())!.y).toBeCloseTo(before!.y, 0);
  expect((await footer.boundingBox())!.y).toBeCloseTo(bottom!.y, 0);
  const view = await page.evaluate(() => innerHeight);
  expect(bottom!.y + bottom!.height).toBeLessThanOrEqual(view);
  expect(before!.y).toBeGreaterThanOrEqual(0);
  if (action)
    await expect(
      footer.getByRole("button", { name: action, exact: true }),
    ).toBeVisible();
}
test("headers and actions stay fixed across home and gameplay dialogs", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Guide", exact: true }).click();
  await check(page, "Ready to connect");
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await check(page);
  await page.getByRole("button", { name: "Mute music", exact: true }).click();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Enable music", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page
    .getByRole("button", { name: "Mission details", exact: true })
    .click();
  await check(page, "Play level 1");
  await page.getByRole("button", { name: "Play level 1", exact: true }).click();
  await page.getByRole("button", { name: "Next tip", exact: true }).click();
  await check(page, "Start connecting");
  await page.screenshot({
    path: `test-results/fixed-help-${test.info().project.name}.png`,
  });
  await page
    .getByRole("button", { name: "Start connecting", exact: true })
    .click();
  await page.getByRole("button", { name: "Pause Flow", exact: true }).click();
  for (const button of [
    "Build device",
    "Choose cable",
    "View finances and goals",
    "Game menu",
  ]) {
    await page.getByRole("button", { name: button, exact: true }).click();
    await check(page);
    await page
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
  }
  await addTransit(page);
  await page.locator('[data-node-id="3"]').click();
  await check(page, "Back to map");
  await page.getByRole("button", { name: "Back to map", exact: true }).click();
  await page.screenshot({
    path: `test-results/dark-map-${test.info().project.name}.png`,
  });
});
