import { test, expect } from "@playwright/test";
import { addTransit } from "./helpers";
test("automatic nodes pulse and edge indicators focus hidden devices", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Play NOC Flow", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Start connecting", exact: true })
    .click();
  await page.getByRole("button", { name: "Pause Flow", exact: true }).click();
  await expect(page.locator(".automatic-node-pulse")).toHaveCount(3);
  await addTransit(page);
  await expect(
    page.locator('[data-node-id="3"] .automatic-node-pulse'),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Map controls", exact: true }).click();
  const zoom = page.locator(".map-camera-controls button").last();
  await zoom.click();
  await zoom.click();
  await zoom.click();
  const marker = page.locator(".offscreen-node").first();
  await expect(marker).toBeVisible();
  const name = await marker.getAttribute("aria-label");
  await page.screenshot({
    path: `test-results/offscreen-${test.info().project.name}.png`,
  });
  await marker.click();
  await expect(
    page.getByRole("button", { name: name!, exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Show whole map", exact: true })
    .click();
  await expect(page.locator(".offscreen-node")).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".automatic-node-pulse circle").first()).toHaveCSS(
    "animation-name",
    "none",
  );
});
