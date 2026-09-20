import { dragCable } from "./helpers";
import { test, expect } from "@playwright/test";

test("node details show service icon destinations and pause the simulation", async ({
  page,
}) => {
  await page.clock.install({ time: new Date(42) });
  await page.goto("/");
  await page.clock.pauseAt(new Date(100000));
  await page.clock.setFixedTime(new Date(42));
  await page.getByRole("button", { name: "Play NOC Flow" }).click();
  await page.getByRole("button", { name: "Start connecting" }).click();
  await page.clock.runFor(3200);
  await page.getByRole("button", { name: "Client 1", exact: true }).click();
  const detail = page.getByRole("dialog", {
    name: "Details: Client 1",
    exact: true,
  });
  await expect(detail).toBeVisible();
  const destination = detail.locator('[data-destination="1"]');
  await expect(destination).toContainText("To YouTube");
  await expect(destination).toContainText("1 packets");
  await expect(destination).toContainText("No route to destination");
  const clock = await page.getByTestId("flow-clock").textContent();
  await page.clock.runFor(6000);
  await expect(page.getByTestId("flow-clock")).toHaveText(clock!);
  await detail.getByRole("button", { name: "Back to map" }).click();
  await dragCable(page, 0, 1);
  await page
    .getByRole("button", { name: "View mission and statistics" })
    .click();
  await page.getByRole("button", { name: "Node details", exact: true }).click();
  await page.getByRole("button", { name: /Client 1.*packets/ }).click();
  await expect(destination).toContainText("Via YouTube 2");
  await detail.getByRole("button", { name: "All nodes" }).click();
  await page.getByRole("button", { name: /Facebook 3.*packets/ }).click();
  await expect(
    page.getByRole("dialog", { name: "Details: Facebook 3" }),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/node-details-${test.info().project.name}.png`,
  });
  await page.getByRole("button", { name: "Back to map" }).click();
  await expect(page.getByTestId("cable-count")).toHaveText("1 active cables");
});
