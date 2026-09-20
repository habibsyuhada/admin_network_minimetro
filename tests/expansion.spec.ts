import { test, expect, type Page } from "@playwright/test";
import { addTransit, dragCable } from "./helpers";
async function unlock(page: Page) {
  await page.addInitScript(() =>
    localStorage.setItem(
      "noc-flow-profile-v1",
      JSON.stringify({
        sound: false,
        best: 0,
        progress: {
          neighborhood: 1,
          campus: 1,
          harbor: 1,
          downtown: 1,
          highlands: 1,
          metropolis: 1,
        },
      }),
    ),
  );
}
async function placeAt(page: Page, name: string, x: number, y: number) {
  await page.getByRole("button", { name: "Build device", exact: true }).click();
  await page.getByRole("button", { name: new RegExp(`Place ${name}`) }).click();
  const start = await page
    .getByRole("button", { name: `Move preview ${name}`, exact: true })
    .evaluate((el) => {
      const p = new DOMPoint(0, 0).matrixTransform(
        (el as SVGGraphicsElement).getScreenCTM()!,
      );
      return { x: p.x, y: p.y };
    });
  const end = await page.locator(".metro-map").evaluate(
    (el, p) => {
      const q = new DOMPoint(p.x, p.y).matrixTransform(
        (el as SVGSVGElement).getScreenCTM()!,
      );
      return { x: q.x, y: q.y };
    },
    { x, y },
  );
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 8 });
  await page.mouse.up();
  await page.getByRole("button", { name: "OK", exact: true }).click();
}
test("month-end items enter inventory and can be equipped and removed locally", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.clock.install({ time: new Date(42) });
  await page.goto("/");
  await page.clock.pauseAt(new Date(100000));
  await page.clock.setFixedTime(new Date(42));
  await page.getByRole("button", { name: "Play NOC Flow" }).click();
  await page.getByRole("button", { name: "Start connecting" }).click();
  await addTransit(page);
  await dragCable(page, 0, 3);
  await dragCable(page, 1, 3);
  await dragCable(page, 2, 3);
  await page
    .getByRole("button", { name: "Simulation speed", exact: true })
    .click();
  await page.clock.runFor(30100);
  const report = page.getByRole("dialog", { name: "Month 1 complete" });
  await expect(report).toBeVisible();
  await expect(
    report.getByRole("button", { name: /Increase speed/ }),
  ).toHaveCount(0);
  await report.getByRole("button", { name: "Buy Bandwidth Module" }).click();
  await expect(report).toContainText("Item added to Inventory");
  await expect(
    report.getByRole("button", { name: "Buy Buffer Module" }),
  ).toBeDisabled();
  await page.screenshot({
    path: `test-results/month-items-${test.info().project.name}.png`,
  });
  await report.getByRole("button", { name: "Continue to next month" }).click();
  await page.getByRole("button", { name: "Pause Flow" }).click();
  await page.locator('[data-node-id="3"]').click();
  await page
    .getByRole("button", { name: "Equip Bandwidth Module", exact: true })
    .click();
  await page.getByRole("button", { name: "Back to map" }).click();
  await expect(page.locator('[data-carrier="1"]')).toContainText("/6");
  await page.locator('[data-node-id="3"]').click();
  await page
    .getByRole("button", { name: "Unequip Bandwidth Module", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Equip Bandwidth Module", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Back to map" }).click();
  await expect(page.locator('[data-carrier="1"]')).toContainText("/4");
});
test("river map renders bridge limits and wireless devices create their own carrier", async ({
  page,
}) => {
  await unlock(page);
  await page.goto("/");
  await page.getByRole("button", { name: /Level 3:/ }).click();
  await page.getByRole("button", { name: "Play level 3", exact: true }).click();
  await page.getByRole("button", { name: "Start connecting" }).click();
  await page.getByRole("button", { name: "Pause Flow" }).click();
  await expect(page.locator('[data-terrain="river"]')).toHaveCount(1);
  await page.getByRole("button", { name: "Map controls", exact: true }).click();
  await page.getByRole("button", { name: "Show whole map" }).click();
  await placeAt(page, "wireless bridge", 350, 500);
  await placeAt(page, "wireless bridge", 650, 500);
  await dragCable(page, 3, 4);
  await expect(page.locator('[data-carrier="1"]')).toContainText("/2");
  await expect(page.locator('[data-route="0"]')).toHaveAttribute(
    "stroke-dasharray",
    "6 5",
  );
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.screenshot({
    path: `test-results/river-wireless-${test.info().project.name}.png`,
  });
});
test("gateway service changes in node details and level one has no environment", async ({
  page,
}) => {
  await unlock(page);
  await page.goto("/");
  await page.getByRole("button", { name: /Level 6:/ }).click();
  await page.getByRole("button", { name: "Play level 6", exact: true }).click();
  await page.getByRole("button", { name: "Start connecting" }).click();
  await page.getByRole("button", { name: "Pause Flow" }).click();
  await placeAt(page, "service gateway", 320, 335);
  await page.locator('[data-node-id="3"]').click();
  await page.getByLabel("Service icon", { exact: true }).selectOption("2");
  await expect(page.getByLabel("Service icon", { exact: true })).toHaveValue(
    "2",
  );
  await page.getByRole("button", { name: "Back to map" }).click();
  await page.getByRole("button", { name: "Game menu", exact: true }).click();
  await page.getByRole("button", { name: "End session & exit" }).click();
  await page.getByRole("button", { name: /Level 1:/ }).click();
  await page.getByRole("button", { name: "Play level 1", exact: true }).click();
  await page.getByRole("button", { name: "Start connecting" }).click();
  await expect(page.locator("[data-terrain]")).toHaveCount(0);
});
