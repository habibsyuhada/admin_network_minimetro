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
