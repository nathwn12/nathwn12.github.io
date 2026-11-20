#!/usr/bin/env node
/**
 * align-probe — alignment contract on the live preview.
 *
 * Four masters in the one dark sky. Mechanical edges come from getBoundingClientRect;
 * optical edges come from the painted pixels, because a sidebearing is invisible
 * to the layout box. Run against the dev server on 127.0.0.1:4334.
 *
 *   node scripts/align-probe.mjs
 *
 * Exit 1 when a delta breaks tolerance. Every line reports the delta in px, so
 * a failure is a number rather than a judgement.
 */
import { chromium } from "playwright";
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const URL = process.env.ALIGN_PROBE_URL ?? "http://127.0.0.1:4334/";
const OUT = process.env.ALIGN_PROBE_OUT ?? "C:/Users/nathan/AppData/Local/Temp/opencode/ledger-shots";
const VIEWS = [
  { name: "2560", w: 2560, h: 1440 },
  { name: "1440", w: 1440, h: 900 },
  { name: "768", w: 768, h: 1024 },
  { name: "390", w: 390, h: 844 },
];
const THEMES = ["dark"];
const MECH = 0.5; // mechanical tolerance, px
const INK = 1; // optical tolerance, px

// The intended system. Once the stylesheet declares these tokens the probe
// reads the cascade instead of the fallbacks.
const SYSTEM = { gutter: (w) => (w >= 900 ? 48 : 20), baseline: 8 };

const LEFT_BLOCKS = [
  ".stage-mark", ".hud-name .eyebrow", ".hud-name h1", ".hud-status",
  "#signal .cluster-corner", "#signal .signal-pair", "#signal .spark-bank",
  "#signal .signal-lower", "#signal .stamp",
  "#work .cluster-corner", "#work .featured-list", "#work .index-grid",
  "#proof .cluster-corner", "#proof .proof-table",
  "#method .cluster-corner", "#method .spec-grid", "#method .data-line",
  "#contact .cluster-corner", "#contact .contact-line", "#contact .mailto",
  ".colophon > :first-child",
];
const RIGHT_BLOCKS = [
  ".hud-role", "#method .data-line dd", ".featured-row > a",
];
const INK_TARGETS = [
  { sel: ".hud-name .eyebrow", check: "hero-left-ink" },
  { sel: ".hud-name h1", check: "hero-left-ink" },
  { sel: ".hud-role p", check: "hero-right-ink", all: true },
  { sel: ".hud-scroll", check: "scroll-cue" },
  { sel: ".featured-stats > span", check: "cell-right-ink", all: true },
  { sel: ".proof-figure", check: "figure", all: true },
  { sel: ".signal-figure", check: "figure", all: true },
  { sel: ".micro-number", check: "figure", all: true },
  { sel: ".featured-num", check: "figure", all: true },
];

/** Host, title and vertical reference for each centred numeric column. */
const FIGURE_GROUPS = {
  ".proof-figure": { host: ".proof-row", title: ".proof-text h3", table: ".proof-table" },
  ".signal-figure": { host: ".signal-pair > div", title: ".figure-label", table: ".signal-pair" },
  ".micro-number": { host: ".micro-figures > div", title: ".micro-label", table: ".micro-figures" },
  ".featured-num": { host: ".featured-row", title: ".featured-main h3", table: ".featured-list" },
};

const results = [];
const round = (n) => Number(n.toFixed(2));
const rgb = (s) => {
  const m = String(s).match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
  return m ? [+m[1], +m[2], +m[3]] : [0, 0, 0];
};
function check(id, tag, delta, tol, note = "") {
  const ok = delta !== null && Math.abs(delta) <= tol;
  results.push({
    ok,
    line: `${ok ? "PASS" : "FAIL"} ${tag} ${id}: ${delta === null ? "none" : `${delta > 0 ? "+" : ""}${delta}px`} (tol ${tol})${note ? " :: " + note : ""}`,
  });
}
function info(id, tag, text) {
  results.push({ ok: true, info: true, line: `HANG ${tag} ${id}: ${text}` });
}

/** Installed once per page: first baseline of an element from its font metrics. */
function installMetrics() {
  window.__align = {
    baseline(el) {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const top = r.top + parseFloat(cs.borderTopWidth || 0) + parseFloat(cs.paddingTop || 0);
      const size = parseFloat(cs.fontSize);
      const lh = parseFloat(cs.lineHeight) || size * 1.2;
      const ctx = document.createElement("canvas").getContext("2d");
      ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const m = ctx.measureText((el.textContent || "").trim());
      const asc = m.fontBoundingBoxAscent || m.actualBoundingBoxAscent || size * 0.8;
      const desc = m.fontBoundingBoxDescent || m.actualBoundingBoxDescent || size * 0.2;
      return top + (lh - (asc + desc)) / 2 + asc;
    },
    rect(el) {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const host = el.closest(".section-body, .frame, .stage-nav-wrap, .hero-hud") ?? document.body;
      const hcs = getComputedStyle(host);
      const hr = host.getBoundingClientRect();
      return {
        x: r.x, y: r.y, w: r.width, h: r.height, right: r.right, bottom: r.bottom,
        cx: r.x + r.width / 2, cy: r.y + r.height / 2,
        color: cs.color, text: (el.textContent || "").trim().slice(0, 40),
        align: cs.textAlign,
        hangL: parseFloat(cs.marginLeft) || 0,
        hangR: parseFloat(cs.marginRight) || 0,
        edgeL: hr.x + parseFloat(hcs.paddingLeft || 0),
        edgeR: hr.right - parseFloat(hcs.paddingRight || 0),
        baseline: window.__align.baseline(el),
      };
    },
  };
}

const LAYOUT_FN = (spec) => {
  const A = window.__align;
  // A token can be rem. Resolve it through the layout engine, not parseFloat.
  const px = (value) => {
    const probe = document.createElement("div");
    probe.style.cssText = `position:absolute;visibility:hidden;width:${value}`;
    document.body.appendChild(probe);
    const n = probe.getBoundingClientRect().width;
    probe.remove();
    return n;
  };
  const root = getComputedStyle(document.documentElement);
  const token = (name, fallback) => {
    const value = root.getPropertyValue(name).trim();
    if (!value) return fallback;
    const n = px(value);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };
  // The effective gutter is what a gutter-bearing container actually uses.
  const frame = document.querySelector(".frame");
  const gutterPx = frame ? parseFloat(getComputedStyle(frame).paddingLeft) : token("--rec-gutter", spec.gutter);
  const one = (sel) => {
    const r = A.rect(document.querySelector(sel));
    return r ? { sel, ...r } : null;
  };
  return {
    viewport: { w: innerWidth, h: innerHeight, cw: document.documentElement.clientWidth },
    theme: document.documentElement.dataset.theme,
    tokens: { gutter: gutterPx, baseline: token("--rec-baseline", spec.baseline) },
    left: spec.left.map(one).filter(Boolean),
    right: spec.right.map(one).filter(Boolean),
    video: one(".horizon-video-wrap"),
    hero: one(".hero"),
    eyebrow: one(".hud-name .eyebrow"),
    name: one(".hud-name h1"),
  };
};

/** Painted bounding box inside a locator screenshot, in viewport coordinates. */
async function inkBox(shot, box, fg, bg, mode) {
  const { data, info } = await sharp(shot).raw().toBuffer({ resolveWithObject: true });
  const C = info.channels;
  const f = rgb(fg);
  const b = rgb(bg);
  const d = [0, 1, 2].map((i) => f[i] - b[i]);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const i = (y * info.width + x) * C;
      const px = [data[i], data[i + 1], data[i + 2]];
      let hit;
      if (mode === "luma") {
        hit = 0.2126 * px[0] + 0.7152 * px[1] + 0.0722 * px[2] >= 90;
      } else {
        let acc = 0, n = 0;
        for (let c = 0; c < 3; c += 1) {
          if (Math.abs(d[c]) > 8) { acc += (px[c] - b[c]) / d[c]; n += 1; }
        }
        hit = n > 0 ? acc / n >= 0.2 : false;
      }
      if (hit) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  return {
    left: minX + box.x, top: minY + box.y, right: maxX + box.x, bottom: maxY + box.y,
    w: maxX - minX + 1, h: maxY - minY + 1,
    cx: (minX + maxX) / 2 + box.x, cy: (minY + maxY) / 2 + box.y,
  };
}

async function inkFor(page, spec, theme, ground, wide) {
  const figures = [];
  // Only HUD type sits over the moving field; every other ink box is measured
  // against the solid ground with the element's own colour.
  const lumaMode = theme === "dark";

  for (const target of spec.ink) {
    // The hero type is measured over the moving field. Every other ink box is
    // measured on the true-black ground: the object's bright rim would widen
    // a numeral's painted box and read as type it is not.
    if (!target.sel.startsWith(".hud-")) {
      await page.evaluate(() => {
        document.querySelectorAll(".horizon-layer, .ticker, .stage-nav-wrap")
          .forEach((node) => (node.style.visibility = "hidden"));
      });
    }
    const locator = page.locator(target.sel);
    const count = target.all ? await locator.count() : Math.min(1, await locator.count());
    for (let i = 0; i < count; i += 1) {
      const el = locator.nth(i);
      // Locator screenshots auto-scroll and clip to the element's own box.
      const shot = await el.screenshot({ animations: "disabled" });
      const rawBox = await el.boundingBox();
      const box = await el.evaluate((node) => window.__align.rect(node));
      if (!box || !rawBox) continue;
      const useMode = target.sel.startsWith(".hud-") && lumaMode ? "luma" : "color";
      const ink = await inkBox(shot, rawBox, box.color, ground, useMode);
      if (!ink) { check(`${target.check} ${target.sel}[${i}] ink`, spec.tag, null, INK); continue; }

      if (target.check === "hero-left-ink") {
        check(`left ink ${target.sel}`, spec.tag, round(ink.left - box.edgeL), INK);
      } else if (target.check === "hero-right-ink") {
        if (wide && box.align === "right") check(`right ink ${box.text}`, spec.tag, round(ink.right - box.edgeR), INK);
      } else if (target.check === "cell-right-ink") {
        if (spec.cellWide) {
          check(`cell right ink ${box.text}`, spec.tag, round(ink.right - (box.right + box.hangR)), INK);
        }
      } else if (target.check === "scroll-cue") {
        const parts = await page.evaluate(() => {
          const pick = (s) => window.__align.rect(document.querySelector(s));
          return { rule: pick(".hud-scroll .scroll-line"), word: pick(".hud-scroll span:nth-of-type(2)"), arrow: pick(".hud-scroll span:nth-of-type(3)") };
        });
        check("scroll cue rule/word centre", spec.tag, round(parts.rule.cy - parts.word.cy), INK);
        check("scroll cue word/arrow centre", spec.tag, round(parts.arrow.cy - parts.word.cy), INK);
        if (wide) check("scroll cue right ink", spec.tag, round(ink.right - box.edgeR), INK);
      } else if (target.check === "figure") {
        const detail = await page.evaluate(({ sel, idx, map }) => {
          const rule = map[sel];
          const fig = [...document.querySelectorAll(sel)].filter(Boolean)[idx];
          const host = fig?.closest(rule.host);
          const title = host?.querySelector(rule.title);
          const table = document.querySelector(rule.table);
          const f = window.__align.rect(fig);
          return {
            colCx: f?.cx, figL: f?.x, figW: f?.w,
            ruleX: window.__align.rect(table)?.x,
            titleBase: title ? window.__align.baseline(title) : null,
            figBase: fig ? window.__align.baseline(fig) : null,
          };
        }, { sel: target.sel, idx: i, map: FIGURE_GROUPS });
        figures.push({ sel: target.sel, text: box.text, ink, detail });
      }
    }
  }

  // Binding rule: the painted ink centre owns the fixed column. The painted
  // left edge then sits one centred inset in from the rule; narrow glyphs hang
  // further in, and the raw rule delta is reported for each one.
  for (const table of Object.keys(FIGURE_GROUPS)) {
    const group = figures.filter((f) => f.sel === table);
    if (!group.length) continue;
    for (const f of group) {
      const raw = round(f.ink.left - f.detail.ruleX);
      // Expected painted left = column centre minus half the painted width:
      // the exact consequence of the ink-centre rule, with no box rounding.
      const expectedLeft = f.detail.colCx - (f.ink.w - 1) / 2;
      const inset = f.detail.figL === null ? 0 : expectedLeft - f.detail.figL;
      check(`figure ink left ${f.text}`, spec.tag, round(f.ink.left - expectedLeft), INK, `raw rule delta ${raw}px, planned inset ${round(inset)}px`);
      check(`figure ink centre ${f.text}`, spec.tag, round(f.ink.cx - f.detail.colCx), INK);
      info(`figure hang ${f.text}`, spec.tag, `painted left ${raw}px from rule; glyph "${f.text}" is ${round(f.ink.w)}px wide in a ${round(f.detail.figW)}px column`);
    }
    const bases = group.map((f) => f.detail.figBase).filter((n) => n !== null);
    if (spec.figureWide && bases.length > 1 && (table === ".micro-number" || table === ".signal-figure")) {
      check(`${table} share one baseline`, spec.tag, round(Math.max(...bases) - Math.min(...bases)), INK);
    }
    // Only the proof pairs set figure and claim on one shared baseline. The
    // other clusters label beneath or beside their numerals by design.
    if (table === ".proof-figure") {
      if (!spec.figureWide) {
        info("proof baseline", spec.tag, "phone row stacks the figure above the claim; no shared baseline by design");
      } else {
        for (const f of group) {
          if (f.detail.titleBase !== null) check(`proof baseline ${f.text}`, spec.tag, round(f.detail.figBase - f.detail.titleBase), INK);
        }
      }
    }
  }
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true, args: ["--use-gl=angle", "--use-angle=d3d11", "--ignore-gpu-blocklist"] });

  for (const view of VIEWS) {
    for (const theme of THEMES) {
      const page = await browser.newPage({
        viewport: { width: view.w, height: view.h },
        deviceScaleFactor: 1,
        reducedMotion: "no-preference",
      });
      await page.addInitScript(installMetrics);
      await page.goto(URL, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      // Freeze reveals at their settled state; a mid-transition transform
      // would move the measured type out of its true alignment.
      await page.addStyleTag({ content: "[data-reveal]{opacity:1!important;transform:none!important}" });
      // Count-ups start on intersection. Settle every one before measuring,
      // or a locator screenshot can scroll a figure into view and catch it
      // mid-count with a painted width that no longer matches its column.
      await page.evaluate(async () => {
        const step = Math.max(280, Math.round(innerHeight * 0.5));
        for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
          scrollTo({ top: y, behavior: "instant" });
          await new Promise((done) => setTimeout(done, 60));
        }
        scrollTo({ top: 0, behavior: "instant" });
        await new Promise((done) => setTimeout(done, 900));
      });
      await page.waitForTimeout(1100);

      const tag = `${view.name}/${theme}`;
      const spec = {
        tag, gutter: SYSTEM.gutter(view.w), baseline: SYSTEM.baseline,
        recordWide: view.w >= 900, figureWide: view.w >= 761, cellWide: view.w > 900,
        left: LEFT_BLOCKS, right: RIGHT_BLOCKS, ink: INK_TARGETS,
      };
      const m = await page.evaluate(LAYOUT_FN, spec);
      const gutter = m.tokens.gutter;
      const step = m.tokens.baseline;
      const right = m.viewport.cw - gutter;
      for (const b of m.left) check(`left ${b.sel}`, tag, round(b.x - (b.edgeL + b.hangL)), MECH);
      for (const b of m.right) {
        // The phone HUD turns the role block into a left-aligned stack row.
        if (b.sel === ".hud-role" && view.w <= 620) continue;
        check(`right ${b.sel}`, tag, round(b.right - b.edgeR), MECH);
      }

      if (m.video && m.hero) {
        // The wrap is deliberately overscanned 3% for parallax. The contract is
        // that the overscan covers the hero on both sides and stays symmetric.
        const bleedL = m.hero.x - m.video.x;
        const bleedR = m.video.right - m.hero.right;
        check("object covers hero L", tag, round(Math.min(0, bleedL)), MECH);
        check("object covers hero R", tag, round(Math.min(0, bleedR)), MECH);
        check("object overscan symmetric", tag, round(bleedL - bleedR), MECH);
      }

      // The eyebrow baseline leads. Name and object snap to its rhythm grid.
      if (m.eyebrow && m.name) {
        const dName = m.name.baseline - m.eyebrow.baseline;
        const nName = Math.round(dName / step);
        check("name baseline on lead grid", tag, round(dName - nName * step), MECH, `lead+${nName} steps`);
      }

      const ground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      await inkFor(page, spec, theme, ground, view.w > 620);
      await page.close();
    }
  }
  await browser.close();

  for (const r of results) console.log(r.line);
  const fails = results.filter((r) => !r.ok);
  console.log(`\nRESULT ${fails.length ? "FAIL" : "PASS"} ${results.filter((r) => !r.info).length - fails.length}/${results.filter((r) => !r.info).length} checks green`);
  if (fails.length) {
    console.log("RED LINES:");
    for (const r of fails) console.log("  " + r.line);
  }
  process.exitCode = fails.length ? 1 : 0;
}

await main();
