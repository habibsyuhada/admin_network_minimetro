import { test, expect } from "@playwright/test";
import { addTransit, dragCable } from "./helpers";
test("construction feedback stays visible when muted and sound preference persists", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  await page
    .getByRole("button", { name: "Play NOC Flow", exact: true })
    .click();
  await page.getByRole("button", { name: "Start connecting" }).click();
  await page.getByRole("button", { name: "Pause Flow", exact: true }).click();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await addTransit(page);
  await expect(page.locator(".node-feedback.build")).toHaveCount(1);
  await dragCable(page, 0, 3);
  await expect(page.locator(".node-feedback.build")).toHaveCount(2);
  await page.screenshot({
    path: `test-results/feedback-${test.info().project.name}.png`,
  });
  await page.getByRole("button", { name: "Game menu", exact: true }).click();
  await page.getByRole("button", { name: "Mute sound", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Enable sound", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Resume game", exact: true }).click();
  await dragCable(page, 1, 3);
  await expect(page.locator(".node-feedback.build")).toHaveCount(2);
  await page.clock.runFor(750);
  await expect(page.locator(".node-feedback")).toHaveCount(0);
  await page.getByRole("button", { name: "Game menu", exact: true }).click();
  await page
    .getByRole("button", { name: "End session & exit", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Enable sound", exact: true }),
  ).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page
    .getByRole("button", { name: "Play NOC Flow", exact: true })
    .click();
  await page.getByRole("button", { name: "Start connecting" }).click();
  await addTransit(page);
  await expect(page.locator(".node-feedback")).toHaveCSS(
    "animation-name",
    "none",
  );
});
