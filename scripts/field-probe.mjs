#!/usr/bin/env node
/**
 * field-probe — the singularity/horizon contract on the live preview.
 *
 * Opens the running dev server with agent-browser (MCP-backed CLI), at three
 * widths in both themes. It reads the horizon the fragment shader draws and
 * measures the DOM figure against it, then captures a viewport screenshot per
 * combination for the judge.
 *
 *   node scripts/field-probe.mjs [outDir]
 *
 * The shader publishes its geometry as window.__bhGeometry. Before that hook
 * exists, the probe falls back to the target constants declared in the brief
 * so the geometry defect is reproducible on the pre-fix commit.
 */
import { spawnSync } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";

const URL = process.env.FIELD_PROBE_URL ?? "http://127.0.0.1:4334/";
const OUT = path.resolve(
  process.argv[2] ?? path.join(process.env.TEMP ?? ".", "opencode", "c2-field"),
);
const SESSION = "field-probe";
const VIEWS = [
  { w: 2560, h: 1440 },
  { w: 1440, h: 900 },
  { w: 390, h: 844 },
];
const THEMES = ["dark", "light"];

function cliPath() {
  if (process.env.AGENT_BROWSER_CLI) return process.env.AGENT_BROWSER_CLI;
  const tail = ["share", "agent-browser", "node_modules", ".bin", "agent-browser.cmd"];
  const candidates = [
    path.join(process.env.USERPROFILE ?? "", ".local", ...tail),
    path.join(process.env.HOME ?? "", ".local", ...tail),
    path.join(process.env.LOCALAPPDATA ?? "", ...tail),
    "agent-browser",
  ];
  return candidates.find((candidate) => candidate === "agent-browser" || existsSync(candidate));
}
const CLI = cliPath();

function run(args) {
  const result = spawnSync(CLI, [...args, "--session", SESSION, "--json"], {
    encoding: "utf8",
    shell: process.platform === "win32",
    maxBuffer: 8 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  const text = (result.stdout ?? "").trim();
  const start = text.indexOf("{");
  if (start < 0) {
    throw new Error(`agent-browser produced no JSON: ${text.slice(0, 400)} ${result.stderr ?? ""}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(text.slice(start));
  } catch {
    throw new Error(`agent-browser JSON parse failed: ${text.slice(start, start + 400)}`);
  }
  if (parsed.success === false || parsed.error) {
    throw new Error(`agent-browser error: ${JSON.stringify(parsed.error ?? parsed)}`);
  }
  return parsed.data ?? parsed;
}

function evaluate(script) {
  const encoded = Buffer.from(script, "utf8").toString("base64");
  const data = run(["eval", "-b", encoded]);
  const raw = data.result;
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

const MEASURE = `(() => {
  const target = {
    narrowAt: 900, cxDesktop: 0.46, cxNarrow: 0.0,
    cyDesktop: 0.02, cyNarrow: -0.04,
    rDesktop: 0.122, rNarrow: 0.17,
    drift: 0.010, driftRate: 1.05,
  };
  const live = window.__bhGeometry;
  let horizon;
  if (live && [live.cx, live.cy, live.radius].every(Number.isFinite)) {
    horizon = { cx: live.cx, cy: live.cy, radius: live.radius, source: "shader-uniform" };
  } else {
    const canvas = document.querySelector("canvas.bh-canvas");
    const W = canvas.clientWidth, H = canvas.clientHeight;
    const narrow = W <= target.narrowAt ? 1 : 0;
    const mix = (a, b, t) => a + (b - a) * t;
    const prog = Number.isFinite(window.__bhProgress) ? window.__bhProgress : 0;
    const ur = mix(target.rDesktop, target.rNarrow, narrow)
      + target.drift * Math.sin(prog * target.driftRate);
    horizon = {
      cx: W / 2 + mix(target.cxDesktop, target.cxNarrow, narrow) * H,
      cy: H / 2 - mix(target.cyDesktop, target.cyNarrow, narrow) * H,
      radius: ur * H,
      source: "shader-constants",
    };
  }
  const round = (n) => Number(n.toFixed(2));
  const rect = (selector) => {
    const el = document.querySelector(selector);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return null;
    return {
      x: round(r.x), y: round(r.y), w: round(r.width), h: round(r.height),
      cx: round(r.x + r.width / 2), cy: round(r.y + r.height / 2),
    };
  };
  const num = rect(".singularity__num");
  const sing = rect(".singularity");
  const label = rect(".singularity__label");
  const checks = {};
  if (num) {
    const dx = num.cx - horizon.cx, dy = num.cy - horizon.cy;
    checks.centred = Math.hypot(dx, dy) <= 1;
    checks.width = num.w <= 2 * horizon.radius;
    checks.offset = round(Math.hypot(dx, dy));
  } else {
    checks.centred = false; checks.width = false; checks.offset = null;
  }
  if (label) {
    const corners = [
      [label.x, label.y], [label.x + label.w, label.y],
      [label.x, label.y + label.h], [label.x + label.w, label.y + label.h],
    ];
    let far = 0;
    for (const [x, y] of corners) far = Math.max(far, Math.hypot(x - horizon.cx, y - horizon.cy));
    checks.labelInside = far <= horizon.radius;
    checks.labelFar = round(far);
  } else {
    checks.labelInside = false; checks.labelFar = null;
  }

  // The shadow must be a clear object, not a decal under opaque cards.
  const shadow = { x: horizon.cx - horizon.radius, y: horizon.cy - horizon.radius,
                   w: horizon.radius * 2, h: horizon.radius * 2 };
  const structural = /^(HTML|BODY|CANVAS)$/;
  const ignore = ".stage, .stage-shell, .stage-traverse, .stage-panel, .stage-panel__frame, .stage-panel__content, .singularity, .bh-still, .bh-canvas";
  const opaque = (el) => {
    if (structural.test(el.tagName) || el.matches(ignore) || el.closest(".singularity") || el.closest(".bh-still")) return false;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none" || Number(cs.opacity) < 0.05) return false;
    const m = cs.backgroundColor.match(/rgba?\\(([^)]+)\\)/);
    const alpha = m ? (m[1].split(",")[3] !== undefined ? parseFloat(m[1].split(",")[3]) : 1) : 0;
    return alpha > 0.01 || cs.backgroundImage !== "none";
  };
  const blockerNames = (box) => {
    const hits = [];
    for (const el of document.querySelectorAll("body *")) {
      if (!opaque(el)) continue;
      const q = el.getBoundingClientRect();
      const ix = Math.min(q.right, box.x + box.w) - Math.max(q.left, box.x);
      const iy = Math.min(q.bottom, box.y + box.h) - Math.max(q.top, box.y);
      if (ix > 1 && iy > 1) hits.push({ cls: el.className || el.tagName, area: Math.round(ix * iy),
        rect: [Math.round(q.x), Math.round(q.y), Math.round(q.width), Math.round(q.height)] });
    }
    return hits;
  };
  const blockers = blockerNames(shadow);
  checks.shadowClear = blockers.length === 0;
  checks.shadowBlockers = blockers;

  const labelEl = document.querySelector(".singularity__label");
  checks.labelNotClipped = labelEl ? labelEl.scrollHeight <= labelEl.clientHeight : false;
  checks.labelScroll = labelEl ? [labelEl.scrollHeight, labelEl.clientHeight] : null;
  let labelCover = [];
  if (labelEl) {
    const q = labelEl.getBoundingClientRect();
    labelCover = blockerNames({ x: q.x, y: q.y, w: q.width, h: q.height });
  }
  checks.labelUncovered = labelCover.length === 0;
  checks.labelCovers = labelCover;

  return JSON.stringify({
    viewport: { w: innerWidth, h: innerHeight, cw: document.documentElement.clientWidth },
    theme: document.documentElement.dataset.theme,
    horizon: {
      cx: round(horizon.cx), cy: round(horizon.cy), radius: round(horizon.radius),
      source: horizon.source,
    },
    numeral: num, singularity: sing, label, shadow: {
      x: round(shadow.x), y: round(shadow.y), w: round(shadow.w), h: round(shadow.h),
    }, checks,
  });
})()`;

async function analyseImage(shot, m) {
  const { data, info } = await sharp(shot).raw().toBuffer({ resolveWithObject: true });
  const C = info.channels;
  const W = info.width;
  const luma = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const px = (x, y) => {
    const i = (y * W + x) * C;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const { cx, cy, radius: R } = m.horizon;
  const light = m.theme === "light";
  const x0 = Math.max(0, Math.round(cx - 3 * R));
  const x1 = Math.min(W - 1, Math.round(cx - 1.05 * R));
  const y0 = Math.max(0, Math.round(cy - 0.8 * R));
  const y1 = Math.min(info.height - 1, Math.round(cy + 0.8 * R));
  let max = -1;
  let sum = 0;
  let n = 0;
  let clipped = 0;
  const values = [];
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      const [r, g, b] = px(x, y);
      const L = luma(r, g, b);
      max = Math.max(max, L);
      sum += L;
      n += 1;
      if (L >= 250) clipped += 1;
      values.push(L);
    }
  }
  const mean = sum / Math.max(1, n);
  const sd = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / Math.max(1, n));

  let left = W;
  let right = -1;
  const by = Math.max(0, Math.round(cy - R));
  const ty = Math.min(info.height - 1, Math.round(cy + R));
  for (let y = by; y <= ty; y += 1) {
    let run = 0;
    let start = 0;
    for (let x = 0; x < W; x += 1) {
      const [r, g, b] = px(x, y);
      const L = luma(r, g, b);
      const sat = Math.max(r, g, b) - Math.min(r, g, b);
      const hit = light ? sat > 10 || L > 250 : (sat > 10 && L > 18) || L > 45;
      if (hit) {
        if (run === 0) start = x;
        run += 1;
        if (run >= 5) {
          left = Math.min(left, start);
          right = Math.max(right, x);
        }
      } else run = 0;
    }
  }
  return {
    maxLuma: Number(max.toFixed(1)),
    clippedPct: Number((100 * clipped / Math.max(1, n)).toFixed(1)),
    sd: Number(sd.toFixed(1)),
    discLeft: left,
    discRight: right,
    marginL: left,
    marginR: m.viewport.cw - 1 - right,
  };
}

function fmt(m, img) {
  const n = m.numeral;
  const l = m.label;
  return `horizon=(${m.horizon.cx},${m.horizon.cy}) r=${m.horizon.radius} [${m.horizon.source}] `
    + `num=(${n ? n.cx : "none"},${n ? n.cy : "none"}) w=${n ? n.w : "none"} `
    + `sing=${m.singularity ? m.singularity.w + "x" + m.singularity.h : "none"} `
    + `label=${l ? l.cx + "," + l.cy : "none"} `
    + `offset=${m.checks.offset} labelFar=${m.checks.labelFar} `
    + `shadowClear=${m.checks.shadowClear} labelScroll=${m.checks.labelScroll} labelUncovered=${m.checks.labelUncovered} `
    + `maxLuma=${img.maxLuma} clipped=${img.clippedPct}% cuspSD=${img.sd} `
    + `discX=${img.discLeft}-${img.discRight} margin=${img.marginL}/${img.marginR}`;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  run(["open", URL]);
  const failures = [];
  for (const view of VIEWS) {
    for (const theme of THEMES) {
      run(["set", "viewport", String(view.w), String(view.h)]);
      run(["set", "media", theme]);
      const m = evaluate(MEASURE);
      const shot = path.join(OUT, `field-${view.w}-${theme}.png`);
      run(["screenshot", shot]);
      const img = await analyseImage(shot, m);
      const reasons = [];
      if (!m.checks.centred) {
        reasons.push(`numeral not centred (offset ${m.checks.offset}px > 1px)`);
      }
      if (!m.checks.width) {
        reasons.push(`numeral width ${m.numeral?.w} > diameter ${Number((2 * m.horizon.radius).toFixed(2))}`);
      }
      if (!m.checks.labelInside) {
        reasons.push(`label outside horizon (far ${m.checks.labelFar} > ${m.horizon.radius})`);
      }
      if (view.w === 390) {
        if (!m.checks.shadowClear) {
          const names = [...new Set(m.checks.shadowBlockers.map((b) => b.cls))].join(", ");
          reasons.push(`shadow covered by [${names}]`);
        }
        if (!m.checks.labelNotClipped) {
          reasons.push(`label clipped (scroll ${m.checks.labelScroll[0]} > client ${m.checks.labelScroll[1]})`);
        }
        if (!m.checks.labelUncovered) {
          const names = [...new Set(m.checks.labelCovers.map((b) => b.cls))].join(", ");
          reasons.push(`label covered by [${names}]`);
        }
      }
      if (theme === "light" && view.w >= 1440) {
        if (img.maxLuma >= 250) {
          reasons.push(`light cusp clipped (max luma ${img.maxLuma}, ${img.clippedPct}% >= 250)`);
        }
        if (img.sd <= 8) reasons.push(`cusp lost structure (sd ${img.sd})`);
      }
      if (view.w === 1440 || view.w === 390) {
        if (img.marginL < 16 || img.marginR < 16) {
          reasons.push(`disc clipped (margins ${img.marginL}/${img.marginR} < 16)`);
        }
      }
      const tag = `${view.w}x${view.h} ${theme}`;
      if (reasons.length) {
        failures.push({ tag, reasons, measured: m, image: img });
        console.log(`FAIL ${tag} ${fmt(m, img)} :: ${reasons.join("; ")}`);
      } else {
        console.log(`PASS ${tag} ${fmt(m, img)}`);
      }
      console.log(`  shot: ${shot}`);
    }
  }
  run(["close"]);
  console.log(`result: ${failures.length ? "FAIL" : "PASS"} (${failures.length}/${VIEWS.length * THEMES.length} failed)`);
  process.exitCode = failures.length ? 1 : 0;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  await main();
}
