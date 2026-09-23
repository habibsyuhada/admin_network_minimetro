import { test, expect } from "@playwright/test";
import { dragCable, addTransit } from "./helpers";

test("router preview moves before OK, rejects overlap, and Cancel spends nothing", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Play NOC Flow" }).click();
  await page.getByRole("button", { name: "Start connecting" }).click();
  await page.getByRole("button", { name: "Map controls" }).click();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const purchase = page.getByRole("button", { name: /Place router/ });
  await page.getByRole("button", { name: "Build device" }).click();
  await purchase.click();
  const draft = page.getByRole("button", { name: "Move preview router" });
  await expect(draft).toBeVisible();
  await expect(page.locator("[data-node-id]")).toHaveCount(3);
  await expect(page.getByTestId("gold")).toHaveText("1600 gold");
  const clock = await page.getByTestId("flow-clock").textContent();
  await page.waitForTimeout(1100);
  await expect(page.getByTestId("flow-clock")).toHaveText(clock!);
  const move = async (x: number, y: number) => {
    const start = await draft.evaluate((el) => {
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
    await page.mouse.move(end.x, end.y, { steps: 10 });
    await page.mouse.up();
  };
  await move(70, 90);
  await expect(
    page.getByRole("button", { name: "OK", exact: true }),
  ).toBeDisabled();
  await expect(page.getByText(/Too close/)).toBeVisible();
  await move(200, 300);
  await expect(
    page.getByRole("button", { name: "OK", exact: true }),
  ).toBeEnabled();
  await expect(page.locator("[data-node-id]")).toHaveCount(3);
  await page.screenshot({
    path: `test-results/router-preview-${test.info().project.name}.png`,
  });
  await page.getByRole("button", { name: "OK", exact: true }).click();
  await expect(draft).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Router 4", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("gold")).toHaveText("1450 gold");
  await dragCable(page, 0, 3);
  await dragCable(page, 3, 1);
  await expect(page.getByTestId("gold")).toHaveText("1250 gold");
  await page.getByRole("button", { name: "Router 4", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Details: Router 4" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Back to map" }).click();
  await page.getByRole("button", { name: "Build device" }).click();
  await purchase.click();
  await move(100, 350);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(draft).toHaveCount(0);
  await expect(page.locator("[data-node-id]")).toHaveCount(4);
  await expect(page.getByTestId("gold")).toHaveText("1250 gold");
  expect(errors).toEqual([]);
});

test("monthly report credits only profit minus maintenance and never pays twice", async ({
  page,
}) => {
  await page.clock.install({ time: new Date(42) });
  await page.goto("/");
  await page.clock.pauseAt(new Date(100000));
  await page.clock.setFixedTime(new Date(42));
  await page.getByRole("button", { name: "Play NOC Flow" }).click();
  await page.getByRole("button", { name: "Start connecting" }).click();
  await page.getByRole("button", { name: "Map controls" }).click();
  await addTransit(page);
  await page.getByRole("button", { name: "Map controls" }).click();
  await dragCable(page, 0, 3);
  await dragCable(page, 1, 3);
  await dragCable(page, 2, 3);
  await expect(page.getByTestId("gold")).toHaveText("1150 gold");
  await page.getByRole("button", { name: "Simulation speed" }).click();
  await page.clock.runFor(30100);
  const report = page.getByRole("dialog", { name: "Month 1 complete" });
  await expect(report).toBeVisible();
  const text = (await report.textContent())!;
  const profit = Number(text.match(/Profit:\s*(\d+) gold/)![1]);
  const maintenance = Number(text.match(/Maintenance:\s*(\d+) gold/)![1]);
  expect(profit).toBeGreaterThan(0);
  expect(maintenance).toBe(90);
  await expect(page.getByTestId("gold")).toHaveText(
    `${1150 + profit - maintenance} gold`,
  );
  await page.clock.runFor(3000);
  await expect(page.getByTestId("gold")).toHaveText(
    `${1150 + profit - maintenance} gold`,
  );
  await report.getByRole("button", { name: "Continue to next month" }).click();
  await expect(report).toHaveCount(0);
  await expect(page.getByTestId("gold")).toHaveText(
    `${1150 + profit - maintenance} gold`,
  );
});

test("switch preview has its own price, icon and transit specification", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Play NOC Flow" }).click();
  await page.getByRole("button", { name: "Start connecting" }).click();
  await page.getByRole("button", { name: "Map controls" }).click();
  await page.getByRole("button", { name: "Build device" }).click();
  await page.getByRole("button", { name: /Place switch/ }).click();
  await expect(
    page.getByRole("button", { name: "Move preview switch" }),
  ).toBeVisible();
  await expect(page.getByTestId("gold")).toHaveText("1600 gold");
  await page.getByRole("button", { name: "OK", exact: true }).click();
  await expect(page.getByTestId("gold")).toHaveText("1520 gold");
  await dragCable(page, 0, 3);
  await dragCable(page, 3, 1);
  await page.getByRole("button", { name: "Switch 4", exact: true }).click();
  const detail = page.getByRole("dialog", { name: "Details: Switch 4" });
  await expect(detail).toContainText("2/4 port");
  await expect(detail).toContainText("16 packets");
  await expect(detail).toContainText("15 gold/month");
  await page.screenshot({
    path: `test-results/switch-${test.info().project.name}.png`,
  });
});
