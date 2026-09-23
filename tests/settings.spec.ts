import { test, expect } from "@playwright/test";
test("game settings persist sound and orientation with an honest unsupported fallback", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(screen.orientation, "lock", {
      configurable: true,
      value: undefined,
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const modal = page.getByRole("dialog", { name: "Settings", exact: true });
  await expect(
    modal.getByRole("radio", { name: "Auto", exact: true }),
  ).toHaveAttribute("aria-checked", "true");
  await modal.getByRole("button", { name: "Mute sound", exact: true }).click();
  await modal.getByRole("radio", { name: "Landscape", exact: true }).click();
  await expect(
    modal.getByRole("radio", { name: "Landscape", exact: true }),
  ).toHaveAttribute("aria-checked", "true");
  await expect(modal.locator(".orientation-hint")).toContainText(
    /cannot lock|lock is unavailable/,
  );
  await page.screenshot({
    path: `test-results/settings-${test.info().project.name}.png`,
  });
  await page.reload();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(
    modal.getByRole("button", { name: "Enable sound", exact: true }),
  ).toBeVisible();
  await expect(
    modal.getByRole("radio", { name: "Landscape", exact: true }),
  ).toHaveAttribute("aria-checked", "true");
  await modal.getByRole("button", { name: "Done", exact: true }).click();
  await page
    .getByRole("button", { name: "Play NOC Flow", exact: true })
    .click();
  await page.getByRole("button", { name: "Start connecting" }).click();
  await page.getByRole("button", { name: "Game menu", exact: true }).click();
  await expect(
    page.getByRole("radio", { name: "Landscape", exact: true }),
  ).toHaveAttribute("aria-checked", "true");
  await page.getByRole("radio", { name: "Auto", exact: true }).click();
  await expect(
    page.getByRole("radio", { name: "Auto", exact: true }),
  ).toHaveAttribute("aria-checked", "true");
  await page.getByRole("button", { name: "Resume game", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("supported orientation locks and auto releases the lock", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(document, "fullscreenEnabled", {
      configurable: true,
      value: false,
    });
    Object.defineProperty(screen, "orientation", {
      configurable: true,
      value: {
        lock: async (mode: string) => {
          document.documentElement.dataset.testLock = mode;
        },
        unlock: () => {
          document.documentElement.dataset.testLock = "auto";
        },
      },
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  for (const name of ["Portrait", "Landscape", "Auto"]) {
    await page.getByRole("radio", { name, exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-test-lock",
      name.toLowerCase(),
    );
  }
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(
    page.getByRole("button", { name: "Done", exact: true }),
  ).toBeInViewport();
  await page.screenshot({
    path: `test-results/settings-landscape-${test.info().project.name}.png`,
  });
});
