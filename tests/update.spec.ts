import { test, expect } from "@playwright/test";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { resolve, sep, extname } from "node:path";
import type { AddressInfo } from "node:net";

test("subpath PWA update waits for old tabs and preserves saves across versions", async ({
  page,
  context,
  browserName,
}) => {
  test.skip(
    browserName === "webkit",
    "Service workers are checked on Chromium; physical Safari remains a release gate.",
  );
  // A real server is necessary: browser routing does not intercept SW update fetches.
  let updated = false;
  const root = resolve("dist");
  const server = createServer((req, res) => {
    const pathname = new URL(req.url!, "http://localhost").pathname;
    if (!pathname.startsWith("/game/")) {
      res.writeHead(404).end();
      return;
    }
    const file = resolve(root, pathname.slice(6) || "index.html");
    if (!file.startsWith(root + sep)) {
      res.writeHead(403).end();
      return;
    }
    try {
      let body = readFileSync(file);
      if (file.endsWith("sw.js") && updated)
        body = Buffer.from(
          body
            .toString()
            .replace(
              "const CACHE=PREFIX+",
              "const CACHE=PREFIX+'test-update-'+",
            ),
        );
      const types: Record<string, string> = {
        ".html": "text/html",
        ".js": "text/javascript",
        ".css": "text/css",
        ".png": "image/png",
        ".webmanifest": "application/manifest+json",
        ".txt": "text/plain",
      };
      res.writeHead(200, {
        "Content-Type": types[extname(file)] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      res.end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/game/`;
  try {
    await page.goto(url);
    await page
      .getByRole("button", { name: "Mulai shift baru", exact: true })
      .click();
    await page.getByRole("button", { name: "Mulai bertugas" }).click();
    await page.getByRole("button", { name: "Kantor HQ", exact: true }).click();
    await page.getByRole("button", { name: /Sambungkan ke node lain/ }).click();
    await page.getByRole("button", { name: "Router A", exact: true }).click();
    await page.getByRole("button", { name: "Jeda permainan" }).click();
    await page
      .getByRole("button", { name: "Simpan & kembali ke menu" })
      .click();
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload();
    updated = true;
    await page.evaluate(async () => {
      await (await navigator.serviceWorker.getRegistration())!.update();
    });
    await expect
      .poll(() =>
        page.evaluate(
          async () =>
            !!(await navigator.serviceWorker.getRegistration())?.waiting,
        ),
      )
      .toBe(true);
    await expect(page.getByText(/Pembaruan tersedia/)).toBeVisible({
      timeout: 10000,
    });
    expect(
      await page.evaluate(() => navigator.serviceWorker.controller?.state),
    ).toBe("activated");
    await page.close();
    const next = await context.newPage();
    await next.goto(url);
    await expect
      .poll(() =>
        next.evaluate(
          async () =>
            !!(await navigator.serviceWorker.getRegistration())?.waiting,
        ),
      )
      .toBe(false);
    await expect
      .poll(() =>
        next.evaluate(
          async () =>
            (await caches.keys()).filter((k) => k.includes("test-update-"))
              .length,
        ),
      )
      .toBe(1);
    await next.getByRole("button", { name: "Lanjutkan shift" }).click();
    await expect(next.getByText("1 koneksi", { exact: true })).toBeVisible();
    await context.setOffline(true);
    await next.reload();
    await next.getByRole("button", { name: "Lanjutkan shift" }).click();
    await expect(next.getByText("1 koneksi", { exact: true })).toBeVisible();
    await next.close();
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
