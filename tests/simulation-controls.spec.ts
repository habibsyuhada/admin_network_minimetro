import { test, expect } from "@playwright/test";
import { dragCable, addTransit } from "./helpers";

test("pause permits topology edits and speed scales simulation time", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.clock.install({ time: new Date(42) });
  await page.goto("/");
  await page.clock.pauseAt(new Date(100000));
  await page.getByRole("button", { name: "Play NOC Flow" }).click();
  await page.getByRole("button", { name: "Start connecting" }).click();
  await dragCable(page, 0, 1);
  await page.clock.runFor(1000);
  await expect(page.getByTestId("flow-clock")).toHaveText("00:01");
  await page.getByRole("button", { name: "Pause Flow" }).click();
  const carrier = await page
    .locator("[data-carrier]")
    .getAttribute("transform");
  await page.clock.runFor(4000);
  await expect(page.getByTestId("flow-clock")).toHaveText("00:01");
  await expect(page.locator("[data-carrier]")).toHaveAttribute(
    "transform",
    carrier!,
  );
  await page.getByRole("button", { name: "Build device" }).click();
  await page.getByRole("button", { name: /Place switch/ }).click();
  await page.getByRole("button", { name: "OK", exact: true }).click();
  await dragCable(page, 2, 3);
  await expect(page.getByTestId("cable-count")).toHaveText("2 active cables");
  await page.locator('[data-node-id="0"]').click();
  await page
    .getByRole("button", { name: "Remove cable 1", exact: true })
    .click();
  await expect(page.getByTestId("gold")).toHaveText("1420 gold");
  await page.getByRole("button", { name: "Back to map" }).click();
  await page.clock.runFor(2000);
  await expect(page.getByTestId("flow-clock")).toHaveText("00:01");
  await page.getByRole("button", { name: "Simulation speed" }).click();
  await page.getByRole("button", { name: "Resume Flow" }).click();
  await page.clock.runFor(1000);
  await expect(page.getByTestId("flow-clock")).toHaveText("00:03");
  await page.getByRole("button", { name: "Simulation speed" }).click();
  await page.clock.runFor(1000);
  await expect(page.getByTestId("flow-clock")).toHaveText("00:06");
  await page.getByRole("button", { name: "Simulation speed" }).click();
  await expect(
    page.getByRole("button", { name: "Simulation speed" }),
  ).toHaveText("1x");
});

test("full switch reports its identity and deleting a cable frees a port", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.goto("/");
  await page.getByRole("button", { name: "Play NOC Flow" }).click();
  await page.getByRole("button", { name: "Start connecting" }).click();
  await page.getByRole("button", { name: "Pause Flow" }).click();
  await addTransit(page, "switch");
  await addTransit(page, "router", 10);
  for (let i = 0; i < 4; i++) await dragCable(page, 3, 4);
  await dragCable(page, 3, 4);
  await expect(page.getByRole("alert")).toContainText(
    "Port Switch 4 full (4/4)",
  );
  await expect(page.getByTestId("gold")).toHaveText("970 gold");
  const paths = await page
    .locator("[data-route]")
    .evaluateAll((es) => es.map((e) => e.getAttribute("d")));
  expect(new Set(paths).size).toBe(4);
  await page.getByRole("button", { name: "Dismiss error" }).click();
  await page.locator('[data-node-id="3"]').click();
  await page
    .getByRole("button", { name: "Remove cable 1", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("3/4 ports used");
  await page.getByRole("button", { name: "Back to map" }).click();
  await dragCable(page, 3, 4);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByTestId("cable-count")).toHaveText("4 active cables");
  await expect(page.getByTestId("gold")).toHaveText("970 gold");
  await page.screenshot({
    path: `test-results/parallel-${test.info().project.name}.png`,
    fullPage: true,
  });
});
