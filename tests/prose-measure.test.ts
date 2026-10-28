/**
 * Prose measure — no prose block may run past 78 characters per line at 1440.
 *
 * The retired responsive-sheet test was the only line-length guard, and it
 * checked component source strings rather than the rendered page. This one
 * loads the built artefact at the desktop width the design targets, then reads
 * each `.prose` and `.lede` block's rendered content box and its own computed
 * font, and measures the character capacity of that box. A block wider than 78
 * characters is a magazine measure, not a reading measure, and fails.
 *
 * The measurement is the same one `visual-audit.mjs` records: content width
 * from the rendered rect divided by the canvas advance of the element's own
 * text in its own font. Narrow atlas columns are legitimate; this is a ceiling,
 * not a floor.
 *
 *   pnpm run build && pnpm vitest run tests/prose-measure.test.ts
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

const DIST = path.resolve(import.meta.dirname, "..", "dist");
const ORIGIN = "http://portfolio.local";
const ROUTES = ["/", "/experience", "/projects"] as const;
const LIMIT = 78;

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".pdf": "application/pdf",
};

let browser: Awaited<ReturnType<typeof chromium.launch>>;

beforeAll(async () => {
  browser = await chromium.launch();
});

afterAll(async () => {
  await browser?.close();
});

/** Serve the real build; a missing file is a real 404, not an empty page. */
async function serve(page: Awaited<ReturnType<typeof browser.newPage>>) {
  await page.route(`${ORIGIN}/**`, async (route) => {
    const url = new URL(route.request().url());
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith("/")) pathname += "index.html";
    else if (!path.extname(pathname)) pathname += "/index.html";

    try {
      const body = await readFile(path.join(DIST, pathname));
      await route.fulfill({
        status: 200,
        body,
        contentType:
          MIME[path.extname(pathname)] ?? "application/octet-stream",
      });
    } catch {
      await route.fulfill({
        status: 404,
        body: "not found",
        contentType: "text/plain",
      });
    }
  });
}

/** Character capacity of every prose block, from its rendered box. */
async function measure(
  page: Awaited<ReturnType<typeof browser.newPage>>,
): Promise<{ charsPerLine: number; className: string; text: string }[]> {
  return page.evaluate(() => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("canvas 2d context unavailable");

    const measured: {
      charsPerLine: number;
      className: string;
      text: string;
    }[] = [];

    for (const element of document.querySelectorAll(".prose, .lede")) {
      const text = (element.textContent ?? "").replace(/\s+/g, " ").trim();
      if (text.length < 40) continue;

      const style = getComputedStyle(element);
      context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const sample = text.slice(0, 220);
      const width = context.measureText(sample).width;
      if (!width) continue;

      const advance = width / sample.length;
      const contentWidth =
        element.getBoundingClientRect().width -
        parseFloat(style.paddingLeft) -
        parseFloat(style.paddingRight);
      measured.push({
        charsPerLine: Math.round(contentWidth / advance),
        className:
          typeof element.className === "string" ? element.className : "",
        text: text.slice(0, 70),
      });
    }

    return measured;
  });
}

describe("the prose ceiling at 1440", () => {
  test(
    "no prose block exceeds 78 characters per line",
    async () => {
      for (const route of ROUTES) {
        const context = await browser.newContext({
          viewport: { width: 1440, height: 900 },
          reducedMotion: "reduce",
          colorScheme: "light",
        });
        const page = await context.newPage();
        await serve(page);
        await page.goto(`${ORIGIN}${route}`, { waitUntil: "load" });
        await page.waitForSelector("main h1", { timeout: 10_000 });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(150);

        const blocks = await measure(page);
        expect(blocks.length, `no prose measured on ${route}`).toBeGreaterThan(
          0,
        );

        for (const block of blocks) {
          expect(
            block.charsPerLine,
            `${route} · ${block.className} · ${block.text}`,
          ).toBeLessThanOrEqual(LIMIT);
        }

        await context.close();
      }
    },
    120_000,
  );
});
