/**
 * Prose measure — no running copy may exceed 78 characters per line at 1440.
 *
 * The home record sets its running copy against the `--rec-*` measure through
 * utilities (`max-w-[62ch]`, `max-w-[52ch]`), and the detail routes still use
 * the shared `.prose` / `.lede` classes, so a class list is no longer the set of
 * prose blocks. This test loads the built artefact at the desktop width the
 * design targets and measures every paragraph in `main` whose text is long
 * enough to have a measure at all: it reads each block's rendered content box
 * and its own computed font, and measures the character capacity of that box. A
 * block wider than 78 characters is a magazine measure, not a reading measure,
 * and fails.
 *
 * The measurement is the same one `visual-audit.mjs` records: content width from
 * the rendered rect divided by the canvas advance of the element's own text in
 * its own font. Narrow atlas columns are legitimate; this is a ceiling, not a
 * floor.
 *
 *   bun run build && bunx vitest run tests/prose-measure.test.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

const DIST = path.resolve(import.meta.dirname, "..", "dist");
const ORIGIN = "http://portfolio.local";
const ROUTES = ["/", "/experience", "/projects"] as const;

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

/**
 * Playwright's Chromium download is not part of this repository, and CI never
 * installs it, so `chromium.launch()` would fail on setup there. The executable
 * is resolved at module load: present, the measurement runs and asserts;
 * absent, the suite reports as skipped instead of red. Locally, install it with
 * `pnpm exec playwright install chromium`.
 */
const CHROMIUM_AVAILABLE = (() => {
  try {
    return existsSync(chromium.executablePath());
  } catch {
    return false;
  }
})();

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

/**
 * The reading measure of every prose block, from its rendered box.
 *
 * The block is judged against the design's own measure: `--rec-prose-measure`
 * (62ch), resolved in the block's own font and size, with 2% of slack for
 * sub-pixel rounding. `charsPerLine` is reported with each block so a failure
 * says what a reader would actually see.
 */
async function measure(
  page: Awaited<ReturnType<typeof browser.newPage>>,
  ch: number,
): Promise<
  { charsPerLine: number; overMeasure: number; className: string; text: string }[]
> {
  return page.evaluate((measureCh: number) => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("canvas 2d context unavailable");

    const measured: {
      charsPerLine: number;
      overMeasure: number;
      className: string;
      text: string;
    }[] = [];

    for (const element of document.querySelectorAll("main p")) {
      const text = (element.textContent ?? "").replace(/\s+/g, " ").trim();
      if (text.length < 40) continue;

      const style = getComputedStyle(element);
      /* Data rows are not prose. A single line of mono facts — the cover's
         former-employment line is one row of three — is read as a row, and its
         character count is the count of what it states, not a measure. */
      if (/mono/.test(style.fontFamily.toLowerCase())) continue;

      context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const sample = text.slice(0, 220);
      const width = context.measureText(sample).width;
      if (!width) continue;

      const advance = width / sample.length;
      const contentWidth =
        element.getBoundingClientRect().width -
        parseFloat(style.paddingLeft) -
        parseFloat(style.paddingRight);
      /* One `ch` is the advance of "0" in the block's own face, which is the
         unit the stylesheet's max-width is written in. */
      const chWidth = context.measureText("0").width * measureCh;
      measured.push({
        charsPerLine: Math.round(contentWidth / advance),
        overMeasure: Math.round((contentWidth / chWidth) * 10) / 10,
        className:
          typeof element.className === "string" ? element.className : "",
        text: text.slice(0, 70),
      });
    }

    return measured;
  }, ch);
}

/** The design's reading measure, in `ch`, read from the shipped tokens. */
const MEASURE_CH = Number(
  readFileSync(
    path.resolve(import.meta.dirname, "..", "src", "styles", "tokens.css"),
    "utf8",
  ).match(/--rec-prose-measure:\s*(\d+)ch/)?.[1] ?? 0,
);

describe.skipIf(!CHROMIUM_AVAILABLE)("the prose ceiling at 1440", () => {
  beforeAll(async () => {
    browser = await chromium.launch();
  });

  afterAll(async () => {
    await browser?.close();
  });

  test(
    "no prose block is set wider than the reading measure",
    async () => {
      expect(MEASURE_CH, "tokens.css declares no --rec-prose-measure").toBe(62);

      for (const route of ROUTES) {
        const context = await browser.newContext({
          viewport: { width: 1440, height: 900 },
          reducedMotion: "reduce",
          colorScheme: "dark",
        });
        const page = await context.newPage();
        await serve(page);
        await page.goto(`${ORIGIN}${route}`, { waitUntil: "load" });
        await page.waitForSelector("main h1", { timeout: 10_000 });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(150);

        const blocks = await measure(page, MEASURE_CH);
        expect(blocks.length, `no prose measured on ${route}`).toBeGreaterThan(
          0,
        );

        for (const block of blocks) {
          expect(
            block.overMeasure,
            `${route} · ${block.className} · ${block.charsPerLine} chars/line · ${block.text}`,
          ).toBeLessThanOrEqual(1.02);
        }

        await context.close();
      }
    },
    120_000,
  );
});
