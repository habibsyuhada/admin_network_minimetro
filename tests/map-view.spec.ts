import { test, expect } from "@playwright/test";
test("camera stops at map edges and centers when zoomed out", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.goto("/");
  await page.getByRole("button", { name: "Main NOC Flow" }).click();
  await page.getByRole("button", { name: "Ayo hubungkan" }).click();
  await page.getByRole("button", { name: "Perbesar peta" }).click();
  const map = page.getByRole("group", { name: "Peta Flow interaktif" });
  const bounds = (await map.boundingBox())!;
  const read = async () =>
    (await map.getAttribute("viewBox"))!.split(" ").map(Number);
  const drag = async (delta: number) => {
    await page.mouse.move(bounds.x + 8, bounds.y + 8);
    await page.mouse.down();
    await page.mouse.move(bounds.x + 8 + delta, bounds.y + 8 + delta, {
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
    .toEqual([400, 600]);
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "Perkecil peta" }).click();
  await expect(
    page.getByRole("button", { name: "Tampilkan seluruh peta" }),
  ).toHaveText("65%");
  const centered = await map.getAttribute("viewBox");
  await drag(1800);
  await expect(map).toHaveAttribute("viewBox", centered!);
  const [x, y, w, h] = await read();
  expect(x + w / 2).toBeCloseTo(200);
  expect(y + h / 2).toBeCloseTo(300);
});
test("pan, zoom, reset and parallel cable lanes remain usable", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.goto("/");
  await page.getByRole("button", { name: "Main NOC Flow" }).click();
  await page.getByRole("button", { name: "Ayo hubungkan" }).click();
  const map = page.getByRole("group", { name: "Peta Flow interaktif" });
  const initial = await map.getAttribute("viewBox");
  await page.getByRole("button", { name: "Perbesar peta" }).click();
  await expect(
    page.getByRole("button", { name: "Tampilkan seluruh peta" }),
  ).toHaveText("125%");
  const zoomed = await map.getAttribute("viewBox");
  const bounds = (await map.boundingBox())!;
  await page.mouse.move(bounds.x + 12, bounds.y + 50);
  await page.mouse.down();
  await page.mouse.move(bounds.x + 62, bounds.y + 95, { steps: 6 });
  await page.mouse.up();
  await expect(map).not.toHaveAttribute("viewBox", zoomed!);
  await expect(
    page.getByRole("button", { name: "Jalur 1", exact: true }),
  ).toContainText("0 perangkat");
  // Construction must still hit the right devices after camera movement.
  await page.getByRole("button", { name: "Client 1", exact: true }).click();
  await page.getByRole("button", { name: "Server 2", exact: true }).click();
  await page.getByRole("button", { name: "Tampilkan seluruh peta" }).click();
  await expect(map).toHaveAttribute("viewBox", initial!);
  await page.getByRole("button", { name: "Jalur 2", exact: true }).click();
  await page.getByRole("button", { name: "Server 2", exact: true }).click();
  await page.getByRole("button", { name: "Client 1", exact: true }).click();
  const a = await page.locator('[data-route="0"]').getAttribute("d");
  const b = await page.locator('[data-route="1"]').getAttribute("d");
  expect(a).not.toEqual(b);
  await expect(
    page.getByRole("button", { name: "Jalur 2", exact: true }),
  ).toContainText("2 perangkat");
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
  await page.getByRole("button", { name: "Main NOC Flow" }).click();
  await page.getByRole("button", { name: "Ayo hubungkan" }).click();
  const map = page.getByRole("group", { name: "Peta Flow interaktif" });
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
  await expect(
    page.getByRole("button", { name: "Jalur 1", exact: true }),
  ).toContainText("0 perangkat");
  await page.getByRole("button", { name: "Tampilkan seluruh peta" }).click();
  await page.getByRole("button", { name: "Client 1", exact: true }).tap();
  await expect(
    page.getByRole("button", { name: "Jalur 1", exact: true }),
  ).toContainText("1 perangkat");
  await session.detach();
});
