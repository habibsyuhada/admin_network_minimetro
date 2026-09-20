import { test, expect } from "@playwright/test";
import { dragCable } from "./helpers";

test("place routers, reject overlap, drag cables and inspect the new transit node", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Main NOC Flow" }).click();
  await page.getByRole("button", { name: "Ayo hubungkan" }).click();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page
    .getByRole("button", { name: "+ Pasang router (2)", exact: true })
    .click();
  await page.getByRole("button", { name: "Client 1", exact: true }).click();
  await expect(
    page.getByText(
      "Terlalu dekat dengan perangkat lain. Pilih area yang lebih kosong.",
    ),
  ).toBeVisible();
  await expect(page.locator("[data-node-id]")).toHaveCount(3);
  const point = await page.locator(".metro-map").evaluate((el) => {
    const p = new DOMPoint(200, 300).matrixTransform(
      (el as SVGSVGElement).getScreenCTM()!,
    );
    return { x: p.x, y: p.y };
  });
  await page.mouse.click(point.x, point.y);
  await expect(
    page.getByRole("button", { name: "Router 4", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "+ Pasang router (1)", exact: true }),
  ).toBeVisible();
  await dragCable(page, 0, 3);
  await dragCable(page, 3, 1);
  await expect(page.getByTestId("cable-count")).toHaveText("2 kabel aktif");
  await page.getByRole("button", { name: "Router 4", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Detail Router 4", exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/Router buatanmu/)).toBeVisible();
  await page.screenshot({
    path: `test-results/router-detail-${test.info().project.name}.png`,
  });
  await page.getByRole("button", { name: "Kembali ke peta" }).click();
  await page.screenshot({
    path: `test-results/router-map-${test.info().project.name}.png`,
  });
  await page
    .getByRole("button", { name: "+ Pasang router (1)", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Batal pasang router", exact: true })
    .click();
  await expect(page.locator("[data-node-id]")).toHaveCount(4);
  expect(errors).toEqual([]);
});
