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
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

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
  return JSON.stringify({
    viewport: { w: innerWidth, h: innerHeight, cw: document.documentElement.clientWidth },
    theme: document.documentElement.dataset.theme,
    horizon: {
      cx: round(horizon.cx), cy: round(horizon.cy), radius: round(horizon.radius),
      source: horizon.source,
    },
    numeral: num, singularity: sing, label, checks,
  });
})()`;

function fmt(m) {
  const n = m.numeral;
  const l = m.label;
  return `horizon=(${m.horizon.cx},${m.horizon.cy}) r=${m.horizon.radius} [${m.horizon.source}] `
    + `num=(${n ? n.cx : "none"},${n ? n.cy : "none"}) w=${n ? n.w : "none"} `
    + `sing=${m.singularity ? m.singularity.w + "x" + m.singularity.h : "none"} `
    + `label=${l ? l.cx + "," + l.cy : "none"} `
    + `offset=${m.checks.offset} labelFar=${m.checks.labelFar}`;
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
      const tag = `${view.w}x${view.h} ${theme}`;
      if (reasons.length) {
        failures.push({ tag, reasons, measured: m });
        console.log(`FAIL ${tag} ${fmt(m)} :: ${reasons.join("; ")}`);
      } else {
        console.log(`PASS ${tag} ${fmt(m)}`);
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
