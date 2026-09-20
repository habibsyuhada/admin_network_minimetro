import { dragCable, addTransit } from "./helpers";
import { test, expect } from "@playwright/test";
test("camera stops at map edges and centers when zoomed out", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.goto("/");
  await page.getByRole("button", { name: "Play NOC Flow" }).click();
  await page.getByRole("button", { name: "Start connecting" }).click();
  await page.getByRole("button", { name: "Map controls" }).click();
  await page.getByRole("button", { name: "Zoom in" }).click();
  const map = page.getByRole("group", { name: "Interactive Flow map" });
  const bounds = (await map.boundingBox())!;
  const read = async () =>
    (await map.getAttribute("viewBox"))!.split(" ").map(Number);
  const drag = async (delta: number) => {
    // The emulated visual viewport can clip the SVG edge. Start inside the visible map.
    const x = Math.max(12, bounds.x + 8);
    const y = Math.max(12, bounds.y + 8);
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + delta, y + delta, {
      steps: 5,
    });
    await page.mouse.up();
  };
  await drag(1800);
  await expect.poll(async () => (await read()).slice(0, 2)).toEqual([0, 0]);
  await drag(-1800);
  await expect
    .poll(async () => {
      const [x, y, w, h] = await read();
      return [x + w, y + h];
    })
    .toEqual([1000, 1200]);
  for (let i = 0; i < 6; i++)
    await page.getByRole("button", { name: "Zoom out" }).click();
  await expect(page.getByRole("button", { name: "Reset map view" })).toHaveText(
    "40%",
  );
  await page.getByRole("button", { name: "Show whole map" }).click();
  const centered = await map.getAttribute("viewBox");
  await drag(1800);
  await expect(map).toHaveAttribute("viewBox", centered!);
  const [x, y, w, h] = await read();
  expect(w * h).toBe(400 * 600 * 5);
  expect(x + w / 2).toBeCloseTo(500);
  expect(y + h / 2).toBeCloseTo(600);
});
test("pan, zoom, reset and parallel cable lanes remain usable", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.goto("/");
  await page.getByRole("button", { name: "Play NOC Flow" }).click();
  await page.getByRole("button", { name: "Start connecting" }).click();
  await page.getByRole("button", { name: "Map controls" }).click();
  const map = page.getByRole("group", { name: "Interactive Flow map" });
  const initial = await map.getAttribute("viewBox");
  await page.getByRole("button", { name: "Zoom in" }).click();
  await expect(page.getByRole("button", { name: "Reset map view" })).toHaveText(
    "125%",
  );
  const zoomed = await map.getAttribute("viewBox");
  const bounds = (await map.boundingBox())!;
  await page.mouse.move(bounds.x + 12, bounds.y + 50);
  await page.mouse.down();
  await page.mouse.move(bounds.x + 62, bounds.y + 95, { steps: 6 });
  await page.mouse.up();
  await expect(map).not.toHaveAttribute("viewBox", zoomed!);
  await expect(page.getByTestId("cable-count")).toHaveText("0 active cables");
  // Restore the wider starting view so both distant endpoints are visible.
  await page.getByRole("button", { name: "Reset map view" }).click();
  await addTransit(page);
  await addTransit(page, "switch", 10);
  await dragCable(page, 3, 4);
  await expect(map).toHaveAttribute("viewBox", initial!);
  await page.getByRole("button", { name: "Choose cable" }).click();
  await page.getByRole("button", { name: "Cable Fiber", exact: true }).click();
  await dragCable(page, 4, 3);
  const a = await page.locator('[data-route="0"]').getAttribute("d");
  const b = await page.locator('[data-route="1"]').getAttribute("d");
  expect(a).not.toEqual(b);
  await expect(page.getByTestId("cable-count")).toHaveText("2 active cables");
  await page.screenshot({
    path: `test-results/parallel-map-${test.info().project.name}.png`,
  });
});

test("two-finger pinch cancels cable drawing and never commits a route", async ({
  page,
  context,
}, info) => {
  test.skip(
    info.project.name !== "mobile",
    "Native multi-touch injection uses Chromium's mobile protocol.",
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Play NOC Flow" }).click();
  await page.getByRole("button", { name: "Start connecting" }).click();
  await page.getByRole("button", { name: "Map controls" }).click();
  const map = page.getByRole("group", { name: "Interactive Flow map" });
  const client = (await page
    .getByRole("button", { name: "Client 1", exact: true })
    .boundingBox())!;
  const x = client.x + client.width / 2,
    y = client.y + client.height / 2;
  const session = await context.newCDPSession(page);
  const point = (id: number, px: number, py: number) => ({
    id,
    x: px,
    y: py,
    radiusX: 5,
    radiusY: 5,
  });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [point(1, x, y)],
  });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [point(1, x, y), point(2, x + 90, y + 80)],
  });
  const before = await map.getAttribute("viewBox");
  await session.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [point(1, x - 20, y - 10), point(2, x + 120, y + 110)],
  });
  await expect(map).not.toHaveAttribute("viewBox", before!);
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [point(1, x - 20, y - 10)],
  });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(page.getByTestId("cable-count")).toHaveText("0 active cables");
  await page.getByRole("button", { name: "Reset map view" }).click();
  await page.getByRole("button", { name: "Client 1", exact: true }).tap();
  await expect(page.getByTestId("cable-count")).toHaveText("0 active cables");
  await session.detach();
});

test("new distant nodes stay in the large map and can be located through details", async ({
  page,
}) => {
  await page.clock.install({ time: new Date(42) });
  await page.goto("/");
  await page.clock.pauseAt(new Date(100000));
  await page.clock.setFixedTime(new Date(42));
  await page.getByRole("button", { name: "Play NOC Flow" }).click();
  await page.getByRole("button", { name: "Start connecting" }).click();
  await page.getByRole("button", { name: "Map controls" }).click();
  const map = page.getByRole("group", { name: "Interactive Flow map" });
  const initial = await map.getAttribute("viewBox");
  await page.clock.runFor(45200);
  expect(await page.locator("[data-node-id]").count()).toBeGreaterThanOrEqual(
    4,
  );
  await expect(map).toHaveAttribute("viewBox", initial!);
  await page
    .getByRole("button", { name: "View mission and statistics" })
    .click();
  await page.getByRole("button", { name: "Node details", exact: true }).click();
  await page.locator(".node-directory button").nth(3).click();
  await page.getByRole("button", { name: "Locate node on map" }).click();
  await expect(page.locator('[data-node-id="3"]')).toBeInViewport();
  await page.locator('[data-node-id="3"]').click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByTestId("cable-count")).toHaveText("0 active cables");
});
