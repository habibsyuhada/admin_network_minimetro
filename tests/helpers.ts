import { type Page } from "@playwright/test";
export async function dragCable(page: Page, a: number, b: number) {
  const center = async (id: number) =>
    page.locator(`[data-node-id="${id}"]`).evaluate((el) => {
      const point = new DOMPoint(0, 0).matrixTransform(
        (el as SVGGraphicsElement).getScreenCTM()!,
      );
      return { x: point.x, y: point.y };
    });
  const start = await center(a),
    end = await center(b);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 10 });
  await page.mouse.up();
}

export async function addTransit(
  page: Page,
  kind: "router" | "switch" = "router",
  offset = 0,
) {
  await page.getByRole("button", { name: "Bangun perangkat" }).click();
  await page
    .getByRole("button", { name: new RegExp(`Pasang ${kind}`) })
    .click();
  const preview = page.getByRole("button", { name: `Geser pratinjau ${kind}` });
  await preview.focus();
  for (let i = 0; i < offset; i++) await preview.press("ArrowRight");
  await page.getByRole("button", { name: "OK", exact: true }).click();
}
