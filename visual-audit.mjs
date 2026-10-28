import { chromium } from "playwright";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Visual audit for the built site.
 *
 * Serves `dist/` through Playwright's request interception — no HTTP server is
 * started, and nothing is proxied to a dev server — so what is measured and
 * photographed is the artefact that ships (`vite build` → `dist`).
 *
 *   node visual-audit.mjs [outDir]
 *
 * Writes: one full-page shot per route and viewport, one shot per band, a
 * before/after pair for the measurement control, and `metrics.json` with the
 * page height, overflow, characters per line, band closings and the computed
 * contrast of every text element against its real background.
 */

const DIST = fileURLToPath(new URL("./dist/", import.meta.url));
const OUT = path.resolve(
  process.argv[2] ??
    path.join(process.env.TEMP ?? ".", "opencode", "polish-b"),
);
const ORIGIN = "http://portfolio.local";
const ROUTES = ["/", "/experience", "/projects"];
const VIEWPORTS = [
  { width: 1440, height: 900, tag: "1440" },
  { width: 390, height: 844, tag: "390" },
];

const MIME = {
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

const slug = (route) => (route === "/" ? "home" : route.slice(1));

/* --------------------------------------------------------------- measurements */

/** Served from the real build; a missing file is a real 404, not an empty page. */
async function serveDist(page) {
  await page.route(`${ORIGIN}/**`, async (route) => {
    const url = new URL(route.request().url());
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith("/")) pathname += "index.html";
    else if (!path.extname(pathname)) pathname += "/index.html";
    const file = path.join(DIST, pathname);
    try {
      const body = await readFile(file);
      await route.fulfill({
        status: 200,
        body,
        contentType: MIME[path.extname(file)] ?? "application/octet-stream",
      });
    } catch {
      await route.fulfill({ status: 404, body: "not found", contentType: "text/plain" });
    }
  });
}

/**
 * Everything measured in-page. Runs once per route and viewport.
 */
async function measure() {
  const luminance = (rgb) => {
    const [r, g, b] = rgb.map((channel) => {
      const v = channel / 255;
      return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const parse = (value) => {
    const match = String(value).match(/rgba?\(([^)]+)\)/);
    if (!match) return null;
    const parts = match[1].split(/[,/ ]+/).filter(Boolean).map(Number);
    if (parts.length < 3) return null;
    return { rgb: parts.slice(0, 3), alpha: parts.length > 3 ? parts[3] : 1 };
  };
  const ratio = (fg, bg) => {
    const [a, b] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
    return (a + 0.05) / (b + 0.05);
  };
  /** The first opaque ancestor ground, composited over white if translucent. */
  const groundOf = (element) => {
    let node = element;
    const stack = [];
    while (node && node !== document.documentElement) {
      const style = getComputedStyle(node);
      const colour = parse(style.backgroundColor);
      if (colour && colour.alpha > 0.95) return colour.rgb;
      if (colour && colour.alpha > 0) stack.push(colour);
      node = node.parentElement;
    }
    const body = parse(getComputedStyle(document.body).backgroundColor);
    return stack.length ? body?.rgb ?? [255, 255, 255] : body?.rgb ?? [255, 255, 255];
  };

  /* Characters per line: the real advance of the element's own text in its own
     font, measured on a canvas, divided into the content width. */
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  const charsPerLine = (element) => {
    const text = (element.textContent ?? "").replace(/\s+/g, " ").trim();
    if (text.length < 40) return null;
    const style = getComputedStyle(element);
    context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const sample = text.slice(0, 220);
    const width = context.measureText(sample).width;
    if (!width) return null;
    const advance = width / sample.length;
    const contentWidth =
      element.getBoundingClientRect().width -
      parseFloat(style.paddingLeft) -
      parseFloat(style.paddingRight);
    return Math.round(contentWidth / advance);
  };

  const rect = (element) => {
    const r = element.getBoundingClientRect();
    return {
      top: Math.round(r.top + window.scrollY),
      bottom: Math.round(r.bottom + window.scrollY),
      left: Math.round(r.left),
      width: Math.round(r.width),
    };
  };

  const bands = [...document.querySelectorAll("main section.band")].map(
    (section, index) => {
      const style = getComputedStyle(section);
      const box = section.getBoundingClientRect();
      const children = [...section.querySelectorAll("*")].filter(
        (node) => node.getClientRects().length > 0,
      );
      const lastBottom = children.length
        ? Math.max(...children.map((node) => node.getBoundingClientRect().bottom))
        : box.bottom;
      const heading = section.querySelector("h1, h2");
      return {
        index,
        id: section.id || "(first screen)",
        heading: heading?.textContent?.trim() ?? null,
        top: Math.round(box.top + window.scrollY),
        height: Math.round(box.height),
        paddingTop: Math.round(parseFloat(style.paddingTop)),
        paddingBottom: Math.round(parseFloat(style.paddingBottom)),
        /** Distance from the last child's bottom edge to the band's own end. */
        closing: Math.round(box.bottom - lastBottom),
      };
    },
  );

  /* Contrast of every element that paints text, against its real background. */
  const contrast = [];
  const textElements = [...document.querySelectorAll("body *")].filter((el) => {
    if (!el.getClientRects().length) return false;
    const style = getComputedStyle(el);
    if (style.visibility === "hidden" || style.display === "none") return false;
    if (style.opacity === "0") return false;
    return [...el.childNodes].some(
      (node) => node.nodeType === 3 && node.textContent.trim().length > 1,
    );
  });

  for (const element of textElements) {
    const style = getComputedStyle(element);
    const fg = parse(style.color);
    if (!fg) continue;
    const bg = groundOf(element);
    const value = ratio(fg.rgb, bg);
    const size = parseFloat(style.fontSize);
    const bold = Number(style.fontWeight) >= 700;
    const large = size >= 24 || (bold && size >= 18.66);
    const min = large ? 3 : 4.5;
    if (value < min) {
      contrast.push({
        selector:
          element.tagName.toLowerCase() +
          (element.className && typeof element.className === "string"
            ? "." + element.className.split(/\s+/).slice(0, 2).join(".")
            : ""),
        text: (element.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 60),
        ratio: Number(value.toFixed(2)),
        min,
        size,
      });
    }
  }
  contrast.sort((a, b) => a.ratio - b.ratio);

  /* The claim-plus-figure rows: is the figure's baseline on the claim's? */
  const recordRows = [...document.querySelectorAll(".record-row")].map((row) => {
    const claim = row.querySelector(".record-row__claim");
    const figure = row.querySelector(".record-row__figure");
    if (!claim || !figure) return null;
    const baseline = (element) => {
      const box = element.getBoundingClientRect();
      const probe = document.createElement("span");
      probe.textContent = "x";
      probe.style.cssText = `position:absolute;visibility:hidden;font:${getComputedStyle(element).font};`;
      element.appendChild(probe);
      const probeBox = probe.getBoundingClientRect();
      const offset = probeBox.bottom - box.top - probeBox.height * 0.2;
      probe.remove();
      return Math.round(box.top + offset);
    };
    return {
      claim: claim.textContent?.trim().slice(0, 40),
      claimBaseline: baseline(claim),
      figureBaseline: baseline(figure),
      delta: baseline(figure) - baseline(claim),
      figureRight: Math.round(figure.getBoundingClientRect().right),
      rowRight: Math.round(row.getBoundingClientRect().right),
    };
  });

  /* The measurement control, as rendered in its "after" state. */
  const measurePanel = document.querySelector(".measure");
  const measureState = measurePanel
    ? {
        figure: measurePanel.querySelector(".figure")?.textContent?.trim(),
        figureSize: measurePanel.querySelector(".figure")
          ? parseFloat(getComputedStyle(measurePanel.querySelector(".figure")).fontSize)
          : null,
        trackWidth: Math.round(
          measurePanel.querySelector(".measure__track")?.getBoundingClientRect().width ?? 0,
        ),
        barScale: (() => {
          const bar = measurePanel.querySelector(".measure__bar--accent");
          const track = measurePanel.querySelector(".measure__track");
          if (!bar || !track) return null;
          return Number(
            (bar.getBoundingClientRect().width / track.getBoundingClientRect().width).toFixed(4),
          );
        })(),
        pressed: [...measurePanel.querySelectorAll("button")].map((b) => ({
          label: b.textContent,
          pressed: b.getAttribute("aria-pressed"),
        })),
        beforeButton: (() => {
          const b = measurePanel.querySelector(".measure__switch button");
          if (!b) return null;
          const r = b.getBoundingClientRect();
          return { width: Math.round(r.width), height: Math.round(r.height) };
        })(),
      }
    : null;

  const prose = [...document.querySelectorAll(".prose, .lede")]
    .map((element) => ({
      tag: element.tagName.toLowerCase(),
      className: typeof element.className === "string" ? element.className : "",
      text: (element.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 70),
      charsPerLine: charsPerLine(element),
      width: Math.round(element.getBoundingClientRect().width),
    }))
    .filter((entry) => entry.charsPerLine !== null);

  return {
    title: document.title,
    height: Math.round(document.documentElement.scrollHeight),
    viewport: { width: window.innerWidth, height: window.innerHeight },
    overflowX:
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
    bands,
    contrast,
    recordRows,
    measureState,
    prose,
    h1: {
      text: document.querySelector("h1")?.textContent?.trim(),
      size: document.querySelector("h1")
        ? getComputedStyle(document.querySelector("h1")).fontSize
        : null,
      lines: (() => {
        const h1 = document.querySelector("h1");
        if (!h1) return null;
        const style = getComputedStyle(h1);
        return Math.round(
          h1.getBoundingClientRect().height / parseFloat(style.lineHeight),
        );
      })(),
    },
  };
}

/* ------------------------------------------------------------------- the run */

/** A clipped shot from one full-page capture: no sticky-header overlay. */
async function shotClip(page, selector, file) {
  const box = await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return {
      x: Math.round(rect.left + window.scrollX),
      y: Math.round(rect.top + window.scrollY),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    };
  }, selector);
  if (!box) return false;
  await page.screenshot({ path: file, fullPage: true, clip: box });
  return true;
}

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const report = { out: OUT, origin: ORIGIN, pages: [], errors: [] };

for (const viewport of VIEWPORTS) {
  for (const route of ROUTES) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
      colorScheme: "light",
    });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text().slice(0, 300));
    });
    page.on("pageerror", (error) => consoleErrors.push(String(error).slice(0, 300)));
    await serveDist(page);

    await page.goto(`${ORIGIN}${route}`, { waitUntil: "load" });
    console.log(`· ${route} @ ${viewport.tag}`);
    await page.waitForSelector("main h1", { timeout: 10000 }).catch(async (error) => {
      console.log("  FAILED:", error.message.split("\n")[0]);
      console.log("  root:", (await page.locator("#root").innerHTML()).slice(0, 400));
      for (const entry of consoleErrors) console.log("  console:", entry);
      throw error;
    });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);

    const tag = `${slug(route)}-${viewport.tag}`;
    await page.screenshot({
      path: path.join(OUT, `${tag}-full.png`),
      fullPage: true,
    });

    const bandRects = await page.evaluate(() =>
      [...document.querySelectorAll("main section.band")].map((section, index) => ({
        index,
        id: section.id || `band-${index + 1}`,
        top: Math.round(section.getBoundingClientRect().top + window.scrollY),
        height: Math.round(section.getBoundingClientRect().height),
      })),
    );
    /* Clipped from one full-page capture, never an element screenshot: a sticky
       header paints itself into an element shot and hides the band's heading. */
    for (const band of bandRects) {
      await page.screenshot({
        path: path.join(
          OUT,
          `${tag}-band-${String(band.index + 1).padStart(2, "0")}-${band.id}.png`,
        ),
        fullPage: true,
        clip: {
          x: 0,
          y: band.top,
          width: viewport.width,
          height: Math.max(1, band.height),
        },
      });
    }

    const metrics = await page.evaluate(measure);
    report.pages.push({ route, viewport: viewport.tag, tag, ...metrics, consoleErrors });

    /* The measurement control, in both states, plus a keyboard operability
       check with no mouse involved. */
    if (route === "/") {
      const before = page.locator(".measure__switch button").first();
      const after = page.locator(".measure__switch button").nth(1);
      const panel = page.locator(".measure");

      await shotClip(page, ".measure", path.join(OUT, `${tag}-measure-after.png`));
      const afterFigure = await page.locator(".measure .figure").innerText();

      await before.focus();
      await page.keyboard.press("Enter");
      await page.waitForTimeout(120);
      const beforeFigure = await page.locator(".measure .figure").innerText();
      const beforePressed = await before.getAttribute("aria-pressed");
      await page.waitForTimeout(400);
      await shotClip(page, ".measure", path.join(OUT, `${tag}-measure-before.png`));

      await page.keyboard.press("Tab");
      const focusedAfterTab = await page.evaluate(
        () => document.activeElement?.textContent?.trim() ?? null,
      );
      await page.keyboard.press("Enter");
      await page.waitForTimeout(400);

      report.pages.at(-1).control = {
        afterFigure,
        beforeFigure,
        beforePressed,
        focusedAfterTab,
        restoredPressed: await after.getAttribute("aria-pressed"),
        keyboardOnly:
          beforePressed === "true" &&
          (focusedAfterTab ?? "").startsWith("After"),
      };
      await shotClip(page, "#contact", path.join(OUT, `${tag}-band-contact.png`));
    }

    for (const error of consoleErrors) {
      report.errors.push({ route, viewport: viewport.tag, error });
    }
    await context.close();
  }
}

/* The 48px a phone sees at the close of each band, cropped for inspection. */
{
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await serveDist(page);
  await page.goto(`${ORIGIN}/`, { waitUntil: "load" });
  await page.waitForSelector("main h1");
  await page.evaluate(() => document.fonts.ready);
  const count = await page.locator("main section.band").count();
  for (let index = 0; index < count; index += 1) {
    const band = page.locator("main section.band").nth(index);
    const box = await band.boundingBox();
    if (!box) continue;
    const id = (await band.getAttribute("id")) || `band-${index + 1}`;
    const height = 140;
    const y = Math.max(0, box.y + box.height - height);
    await page.screenshot({
      path: path.join(OUT, `closing-390-${String(index + 1).padStart(2, "0")}-${id}.png`),
      clip: { x: 0, y, width: 390, height: Math.min(height, box.height) },
      fullPage: true,
    });
  }
  await context.close();
}

/* The same record with the OS in dark mode: the pre-paint script resolves it,
   so this is the page a dark-OS visitor actually gets. */
for (const viewport of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
    colorScheme: "dark",
  });
  const page = await context.newPage();
  await serveDist(page);
  await page.goto(`${ORIGIN}/`, { waitUntil: "load" });
  await page.waitForSelector("main h1");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(200);
  const theme = await page.evaluate(() => document.documentElement.dataset.theme);
  await page.screenshot({
    path: path.join(OUT, `home-dark-${viewport.tag}-full.png`),
    fullPage: true,
  });
  await shotClip(
    page,
    "main section.band",
    path.join(OUT, `home-dark-${viewport.tag}-band-01.png`),
  );
  report.pages.push({ route: "/ (dark)", viewport: viewport.tag, theme });
  await context.close();
}

await writeFile(path.join(OUT, "metrics.json"), JSON.stringify(report, null, 2));
await browser.close();

for (const page of report.pages) {
  console.log(
    `${String(page.tag ?? "dark").padEnd(22)} ${String(page.height ?? "-").padStart(5)}px  overflowX=${page.overflowX ?? "-"}  h1=${page.h1?.lines ?? "-"} line(s) @ ${page.h1?.size ?? "-"}  contrastFailures=${page.contrast?.length ?? "-"}`,
  );
}
console.log(`wrote ${report.pages.length} page reports → ${OUT}`);
if (report.errors.length) {
  console.log(`console errors: ${report.errors.length}`);
  for (const entry of report.errors.slice(0, 10)) console.log(" ", JSON.stringify(entry));
}
