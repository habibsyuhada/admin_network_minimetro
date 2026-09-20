import { test, expect } from "@playwright/test";
import { dragCable } from "./helpers";

test("node inspector replaces a full-port cable and shows its peer icon and price difference", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.goto("/");
  await page.getByRole("button", { name: "Play NOC Flow" }).click();
  await page.getByRole("button", { name: "Start connecting" }).click();
  await page.getByRole("button", { name: "Pause Flow" }).click();
  await dragCable(page, 0, 1);
  await page.locator('[data-node-id="0"]').click();
  const card = page.locator('[data-cable-detail="1"]');
  await expect(card.getByRole("img", { name: "YouTube 2" })).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("1/1 ports used");
  await card.locator("summary").click();
  await expect(card).toContainText("Pay 100 gold");
  await page
    .getByRole("button", { name: "Change cable 1 to Fiber", exact: true })
    .click();
  await expect(page.getByTestId("gold")).toHaveText("1400 gold");
  await expect(card).toContainText("Fiber #1");
  await expect(card).toContainText("Refund 100 gold");
  await expect(page.getByTestId("cable-count")).toHaveText("1 active cables");
  await page.screenshot({
    path: `test-results/cable-upgrade-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Change cable 1 to Ethernet", exact: true })
    .click();
  await expect(page.getByTestId("gold")).toHaveText("1500 gold");
  await page
    .getByRole("button", { name: "Remove cable 1", exact: true })
    .click();
  await expect(page.getByTestId("gold")).toHaveText("1600 gold");
  await expect(page.getByTestId("cable-count")).toHaveText("0 active cables");
});
