import { chromium } from "playwright";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * Review driver for the identity rebuild.
 *
 * Serves the shipped dist/ through request interception — no dev server, no
 * proxy — and writes exactly 18 screenshots: 3 widths x 2 themes x 3 hash
 * states. The same pass records geometry for every exit predicate and runs a
 * separate reduced-motion probe at each width without writing extra images.
 *
 *   node scripts/capture-review.mjs <outDir>
 */
const DIST = fileURLToPath(new URL("../dist/", import.meta.url));
const OUT = path.resolve(
  process.argv[2] ??
    path.join(process.env.TEMP ?? ".", "opencode", "nathwn12-review", "r1"),
);
const ORIGIN = "http://record.local";

const WIDTHS = [
  { width: 1440, height: 900, tag: "1440" },
  { width: 768, height: 1024, tag: "768" },
  { width: 390, height: 844, tag: "390" },
];
const THEMES = ["dark", "light"];
const STATES = [
  { url: "/", tag: "top" },
  { url: "/#work", tag: "work" },
  { url: "/#experience", tag: "experience" },
];
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
};

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

/** Everything the exit predicate needs, measured in the real browser. */
function geometry() {
  const de = document.documentElement;
  const navs = [...document.querySelectorAll("nav")];
  const headings = [...document.querySelectorAll(".stage-panel h1, .stage-panel h2")];
  const panels = [...document.querySelectorAll(".stage-panel")];
  const colophon = document.querySelector(".colophon");

  const textBoxes = [...document.querySelectorAll("body *")]
    .filter((el) => {
      if (!el.getClientRects().length) return false;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none" || cs.opacity === "0") return false;
      if (cs.clipPath === "inset(50%)") return false;
      return [...el.childNodes].some(
        (node) => node.nodeType === 3 && node.textContent.trim().length > 1,
      );
    })
    .map((el) => ({
      el,
      selector: el.tagName.toLowerCase() + (typeof el.className === "string" && el.className ? "." + el.className.trim().split(/\s+/).join(".") : ""),
      text: (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 48),
      rect: el.getBoundingClientRect(),
    }));

  const inColophon = (el) => Boolean(colophon && colophon.contains(el));
  const colo = textBoxes.filter((box) => inColophon(box.el));
  const other = textBoxes.filter((box) => !inColophon(box.el));
  const overlaps = [];
  for (const a of colo) {
    for (const b of other) {
      const ix = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left);
      const iy = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top);
      if (ix > 1 && iy > 1) {
        overlaps.push({ a: a.selector + ": " + a.text, b: b.selector + ": " + b.text, ix: Math.round(ix), iy: Math.round(iy) });
      }
    }
  }

  // A nav index must not overprint itself. This caught the 390px collision
  // that the colophon-only overlap check could not see.
  const navBoxes = textBoxes.filter((box) =>
    navs.some((nav) => nav.contains(box.el)),
  );
  const navOverlaps = [];
  for (let i = 0; i < navBoxes.length; i += 1) {
    for (let j = i + 1; j < navBoxes.length; j += 1) {
      const a = navBoxes[i];
      const b = navBoxes[j];
      const ix = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left);
      const iy = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top);
      if (ix > 1 && iy > 1) {
        navOverlaps.push({ a: a.selector + ": " + a.text, b: b.selector + ": " + b.text, ix: Math.round(ix), iy: Math.round(iy) });
      }
    }
  }

  const panelBoxes = panels.map((panel) => {
    const r = panel.getBoundingClientRect();
    return {
      id: panel.id,
      top: Math.round(r.top + window.scrollY),
      bottom: Math.round(r.bottom + window.scrollY),
      width: Math.round(r.width),
      height: Math.round(r.height),
      inert: panel.hasAttribute("inert"),
      ariaHidden: panel.getAttribute("aria-hidden"),
      animation: getComputedStyle(panel).animationName,
    };
  });
  const linear = panelBoxes.every((panel, index) =>
    index === 0 || panel.top >= panelBoxes[index - 1].bottom - 1,
  );

  return {
    viewport: { width: window.innerWidth, height: window.innerHeight, clientWidth: de.clientWidth, scrollWidth: de.scrollWidth },
    deepLink: (() => {
      const hash = window.location.hash.slice(1);
      const target = hash ? document.getElementById(hash) : null;
      return {
        hash,
        scrollY: Math.round(window.scrollY),
        targetTop: target ? Math.round(target.getBoundingClientRect().top) : null,
      };
    })(),
    overflowX: de.scrollWidth - de.clientWidth,
    theme: de.dataset.theme ?? null,
    motion: de.dataset.motion ?? null,
    navCount: navs.length,
    navLabels: navs.map((nav) => nav.getAttribute("aria-label")),
    navOverlaps,
    headings: headings.map((h) => h.textContent.replace(/\s+/g, " ").trim()),
    inertCount: document.querySelectorAll("[inert]").length,
    panels: panelBoxes,
    linear,
    allPanelsVisible: panelBoxes.length === 5 && panelBoxes.every((p) => p.height > 0),
    colophonTextBoxes: colo.length,
    colophonOverlaps: overlaps,
  };
}

async function open(browser, viewport, colorScheme, reducedMotion) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    colorScheme,
    reducedMotion,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error).slice(0, 200)));
  await serveDist(page);
  return { context, page, errors };
}

async function run() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const report = { out: OUT, shots: [], geometry: [], reducedMotion: [], errors: [] };

  for (const viewport of WIDTHS) {
    for (const theme of THEMES) {
      for (const state of STATES) {
        const { context, page, errors } = await open(browser, viewport, theme, "no-preference");
        await page.goto(`${ORIGIN}${state.url}`, { waitUntil: "load" });
        await page.waitForSelector("main h1", { timeout: 10000 });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(200);

        const name = `${viewport.tag}-${theme}-${state.tag}.png`;
        const file = path.join(OUT, name);
        await page.screenshot({ path: file, fullPage: true });
        const g = await page.evaluate(geometry);
        report.shots.push({ file, width: viewport.tag, theme, state: state.url });
        report.geometry.push({ file, width: viewport.tag, theme, state: state.url, ...g });
        if (errors.length) report.errors.push({ file, errors });
        await context.close();
      }
    }
  }

  // Reduced motion: no images, only the semantic and geometric verdict.
  for (const viewport of WIDTHS) {
    const { context, page, errors } = await open(browser, viewport, "dark", "reduce");
    await page.goto(ORIGIN, { waitUntil: "load" });
    await page.waitForSelector("main h1", { timeout: 10000 });
    await page.evaluate(() => document.fonts.ready);
    const g = await page.evaluate(geometry);
    report.reducedMotion.push({ width: viewport.tag, ...g });
    if (errors.length) report.errors.push({ width: viewport.tag, errors });
    await context.close();
  }
  await browser.close();

  const all = report.geometry;
  const rm = report.reducedMotion;
  const predicates = {
    "1_one_nav": all.every((g) => g.navCount === 1),
    "2_five_headings": all.every((g) => g.headings.length === 5),
    "3_no_overflow": all.every((g) => g.overflowX <= 0),
    "3b_no_nav_overlap": all.every((g) => g.navOverlaps.length === 0),
    "4_no_colophon_overlap": all.every((g) => g.colophonOverlaps.length === 0),
    "5_deep_link_lands": all
      .filter((g) => g.state.includes("#"))
      .every((g) => g.deepLink.hash && g.deepLink.targetTop !== null && g.deepLink.targetTop > -20 && g.deepLink.targetTop < 200),
    "6_reduced_motion_static": rm.every(
      (g) => g.motion === "off" && g.inertCount === 0 && g.allPanelsVisible && g.linear && g.panels.every((p) => !p.inert && p.ariaHidden === null && p.animation === "none"),
    ),
    "7_eighteen_shots": report.shots.length === 18,
  };
  report.predicates = predicates;
  await writeFile(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));

  console.log(`screenshots: ${report.shots.length} -> ${OUT}`);
  for (const [name, pass] of Object.entries(predicates)) {
    console.log(`${pass ? "PASS" : "FAIL"}  ${name}`);
  }
  for (const g of all) {
    console.log(
      `  ${g.width} ${g.theme} ${g.state.padEnd(13)} nav=${g.navCount} headings=${g.headings.length} overflow=${g.overflowX} coloOverlap=${g.colophonOverlaps.length} navOverlap=${g.navOverlaps.length} hash=${g.deepLink.hash || "-"}@${g.deepLink.targetTop}`,
    );
  }
  for (const g of rm) {
    console.log(`  reduced ${g.width} motion=${g.motion} inert=${g.inertCount} visible=${g.allPanelsVisible} linear=${g.linear}`);
  }
  if (report.errors.length) console.log(`page errors: ${JSON.stringify(report.errors.slice(0, 3))}`);
  const failed = Object.values(predicates).some((pass) => !pass);
  process.exitCode = failed ? 1 : 0;
}

if (
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
) {
  await run();
}
