import { test, expect } from "@playwright/test";
test("quiet gameplay shows contextual tools without covering the world", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Play level 1", exact: true }).click();
  await page.getByRole("button", { name: "Start connecting" }).click();
  await page.getByRole("button", { name: "Pause Flow" }).click();
  await expect(
    page.getByRole("button", { name: "Cable Fiber", exact: true }),
  ).toBeHidden();
  await expect(page.getByText("Profit:", { exact: false })).toHaveCount(0);
  const map = await page.locator(".metro-map").boundingBox();
  const height = await page.evaluate(
    () => visualViewport?.height ?? innerHeight,
  );
  expect(map!.height / height).toBeGreaterThan(0.65);
  await page.screenshot({
    path: `test-results/quiet-play-${test.info().project.name}.png`,
  });
  await page.getByRole("button", { name: "Choose cable", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Choose a cable", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/cable-modal-${test.info().project.name}.png`,
  });
  await page.getByRole("button", { name: "Cable Fiber", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Choose cable", exact: true }),
  ).toContainText("Fiber");
  await expect(
    page.getByRole("button", { name: "Cable Ethernet", exact: true }),
  ).toBeHidden();
  await page.getByRole("button", { name: "Build device", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Build a device" }),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/build-modal-${test.info().project.name}.png`,
  });
  await page.getByRole("button", { name: /Place switch/ }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Move preview switch" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByTestId("gold")).toHaveText("1800 gold");
  await page.getByRole("button", { name: "View finances and goals" }).click();
  await expect(
    page.getByRole("dialog", { name: "Your network" }),
  ).toContainText("Maintenance: 0");
  await page.getByRole("button", { name: "Resume game" }).click();
  await expect(page.getByRole("button", { name: "Resume Flow" })).toBeVisible();
  await page.getByRole("button", { name: "Map controls" }).click();
  await page.getByRole("button", { name: "Show whole map" }).click();
  await page.getByRole("button", { name: "Game menu", exact: true }).click();
  await page.getByRole("button", { name: "End session & exit" }).click();
  await expect(page.getByRole("region", { name: "Journey map" })).toBeVisible();
});

test("picker modals pause the clock and close without spending gold", async ({
  page,
}) => {
  await page.clock.install({ time: new Date(42) });
  await page.goto("/");
  await page.clock.pauseAt(new Date(100000));
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.getByRole("button", { name: "Play NOC Flow" }).click();
  await page.getByRole("button", { name: "Start connecting" }).click();
  await page.clock.runFor(1000);
  const clock = await page.getByTestId("flow-clock").textContent();
  for (const name of ["Build device", "Choose cable"]) {
    await page.getByRole("button", { name, exact: true }).click();
    await page.clock.runFor(3000);
    await expect(page.getByTestId("flow-clock")).toHaveText(clock!);
    await page.getByRole("dialog").press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByTestId("gold")).toHaveText("1600 gold");
  }
  await page.clock.runFor(1000);
  await expect(page.getByTestId("flow-clock")).toHaveText("00:02");
});
