import { test, expect } from "@playwright/test";
import { dragCable } from "./helpers";

for (const kind of ["router", "switch"])
  test(`${kind} can move or cancel, and sale refunds the node and cables`, async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.clock.install({ time: new Date(42) });
    await page.goto("/");
    await page.clock.pauseAt(new Date(100000));
    await page.clock.setFixedTime(new Date(42));
    await page.getByRole("button", { name: "Main NOC Flow" }).click();
    await page.getByRole("button", { name: "Ayo hubungkan" }).click();
    await page
      .getByRole("button", { name: new RegExp(`Pasang ${kind}`) })
      .click();
    await page.getByRole("button", { name: "OK", exact: true }).click();
    await dragCable(page, 0, 3);
    await dragCable(page, 3, 1);
    const node = page.locator('[data-node-id="3"]');
    const original = await node.getAttribute("transform");
    const path = await page.locator('[data-route="0"]').getAttribute("d");
    const gold = await page.getByTestId("gold").textContent();
    await node.click();
    await page.getByRole("button", { name: "Pindahkan", exact: true }).click();
    const preview = page.getByRole("button", {
      name: `Geser pratinjau ${kind}`,
    });
    await preview.focus();
    await preview.press("ArrowRight");
    await preview.press("ArrowRight");
    await expect(page.locator('[data-route="0"]')).not.toHaveAttribute(
      "d",
      path!,
    );
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(node).toHaveAttribute("transform", original!);
    await expect(page.locator('[data-route="0"]')).toHaveAttribute("d", path!);
    await node.click();
    await page.getByRole("button", { name: "Pindahkan", exact: true }).click();
    const start = await preview.evaluate((el) => {
      const p = new DOMPoint(0, 0).matrixTransform(
        (el as SVGGraphicsElement).getScreenCTM()!,
      );
      return { x: p.x, y: p.y };
    });
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + 35, start.y + 10, { steps: 8 });
    await page.mouse.up();
    await page.getByRole("button", { name: "OK", exact: true }).click();
    await expect(node).not.toHaveAttribute("transform", original!);
    await expect(page.getByTestId("gold")).toHaveText(gold!);
    await expect(page.getByTestId("cable-count")).toHaveText("2 kabel aktif");
    await node.click();
    await page.getByRole("button", { name: "Jual node", exact: true }).click();
    const confirm = page.getByRole("dialog", { name: /Jual/ });
    await expect(confirm).toContainText(
      kind === "router" ? "350 gold" : "280 gold",
    );
    await confirm.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(node).toBeVisible();
    await node.click();
    await page.getByRole("button", { name: "Jual node", exact: true }).click();
    await confirm
      .getByRole("button", { name: "Jual node", exact: true })
      .click();
    await expect(page.getByTestId("gold")).toHaveText("1000 gold");
    await expect(page.locator("[data-node-id]")).toHaveCount(3);
    await expect(page.getByTestId("cable-count")).toHaveText("0 kabel aktif");
  });

test("all sixteen client icons are available in the guide", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Panduan", exact: true }).click();
  await page.getByText("16 variasi client", { exact: true }).click();
  await expect(page.locator(".client-gallery > div")).toHaveCount(16);
  await expect(page.locator(".client-gallery")).toContainText("Headset VR");
  await page.locator(".client-gallery").screenshot({
    path: `test-results/client-icons-${test.info().project.name}.png`,
  });
});
