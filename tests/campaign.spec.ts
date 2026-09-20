import { test, expect } from "@playwright/test";
test("campaign map selects missions, locks progression, and fits a phone", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "NOC FLOW." })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Level \d/ })).toHaveCount(6);
  await page.getByRole("button", { name: /Level 2:/ }).click();
  await expect(
    page.getByRole("button", { name: "Play level 2", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("region", { name: "Selected mission" }),
  ).toContainText("Campus");
  await page.getByRole("button", { name: /Level 1:/ }).click();
  expect(
    await page.evaluate(
      () =>
        document.querySelector("main")!.scrollWidth -
        document.querySelector("main")!.clientWidth,
    ),
  ).toBeLessThanOrEqual(1);
  expect(
    await page
      .locator("main")
      .evaluate((el) => el.getBoundingClientRect().right),
  ).toBeLessThanOrEqual(
    await page.evaluate(() => document.documentElement.clientWidth + 1),
  );
  await page.screenshot({
    path: `test-results/campaign-home-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Play level 1", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Target: survive 3 months and deliver 60 packets",
  );
  await page.getByRole("button", { name: "Start connecting" }).click();
  await expect(page.getByTestId("gold")).toHaveText("1800 gold");
  await page.getByRole("button", { name: "Pause Flow" }).click();
  await page.screenshot({
    path: `test-results/campaign-game-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Game menu" }).click();
  await page.getByRole("button", { name: "End session & exit" }).click();
  await page.getByRole("button", { name: /Level 2:/ }).click();
  await expect(
    page.getByRole("button", { name: "Play level 2", exact: true }),
  ).toBeDisabled();
});
test("saved mission progress unlocks the next map after reload", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "noc-flow-profile-v1",
      JSON.stringify({ sound: false, best: 80, progress: { neighborhood: 2 } }),
    ),
  );
  await page.goto("/");
  await page.getByRole("button", { name: /Level 2:/ }).click();
  await expect(
    page.getByRole("button", { name: "Play level 2", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Play level 2", exact: true }).click();
  await page.getByRole("button", { name: "Start connecting" }).click();
  await expect(page.getByTestId("gold")).toHaveText("1700 gold");
});
