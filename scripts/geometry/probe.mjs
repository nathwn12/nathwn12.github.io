// Read-only geometry contract probe for the ledger dist build.
// Run from the repo root against a served dist (the check:geometry runner does both).
// Usage: node scripts/geometry/probe.mjs <url> [--width=N] [--mode=reduce|no-preference]
//                                        [--inject=overlap|edge|occlude|all]
//                                        [--contract=file.yaml] [--out=file.json]
// Exit 0 when clean, 1 on any violation or dead exemption, 2 on bad usage.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('@playwright/test');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const url = argv.find((a) => !a.startsWith('--'));
if (!url) {
  console.error('usage: node scripts/geometry/probe.mjs <url> [--width=N] [--mode=...] [--inject=...] [--contract=...] [--out=...]');
  process.exit(2);
}
const opt = (k, d) => {
  const a = argv.find((x) => x.startsWith(`--${k}=`));
  return a ? a.slice(k.length + 3) : d;
};
const onlyWidth = Number(opt('width', '0')) || null;
const onlyMode = opt('mode', null);
const inject = opt('inject', '');
const contractFile = path.resolve(opt('contract', path.join(HERE, 'contract.yaml')));
const outFile = path.resolve(opt('out', path.join(os.tmpdir(), 'geometry-probe-violations.json')));

// Minimal reader for the frozen contract. No YAML dependency. A missing or
// malformed contract fails the gate instead of silently falling back to code.
function loadContract(file) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  const top = (key) => new RegExp(`^${key}:\\s*(.*)$`);
  const list = (key) => {
    const line = lines.find((l) => top(key).test(l));
    const m = line && line.match(top(key));
    if (!m || !m[1].startsWith('[')) throw new Error(`${key} missing in ${file}`);
    return m[1].replace(/^\[|\]$/g, '').split(',')
      .map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
  };
  const block = (key) => {
    const out = [];
    let inside = false;
    for (const raw of lines) {
      if (top(key).test(raw)) { inside = true; continue; }
      if (inside && /^[a-z_]+:/.test(raw)) break;
      if (inside) out.push(raw);
    }
    return out;
  };
  const widths = list('widths').map(Number);
  const modes = list('modes');
  if (!widths.length || widths.some(Number.isNaN) || !modes.length)
    throw new Error(`bad widths/modes in ${file}`);
  const heights = block('height_by_width').map((raw) => raw.match(/\{\s*max:\s*(null|\d+)\s*,\s*height:\s*(\d+)\s*\}/))
    .filter(Boolean).map((m) => ({ max: m[1] === 'null' ? null : Number(m[1]), height: Number(m[2]) }));
  const tolerances = {};
  for (const raw of block('tolerances')) {
    const m = raw.match(/^\s+([a-z_]+):\s*([\d.]+)/);
    if (m) tolerances[m[1]] = Number(m[2]);
  }
  for (const key of ['ink_overlap_px', 'box_px', 'divergence_px', 'clearance_large_px', 'clearance_small_px', 'stack_overlap_ratio'])
    if (!(key in tolerances)) throw new Error(`${key} missing in ${file}`);
  const anchors = block('anchor_targets').map((raw) => raw.match(/^\s+-\s+['"](.+?)['"]\s*$/))
    .filter(Boolean).map((m) => m[1]);
  if (!heights.length || !anchors.length) throw new Error(`bad heights/anchors in ${file}`);
  const exempt = [];
  let current = null;
  for (const raw of block('exempt')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const item = line.match(/^-\s+selectors:\s*\[(.*?)\]\s*$/);
    if (item) {
      current = {
        selectors: item[1].split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')),
        reason: '',
      };
      exempt.push(current);
      continue;
    }
    const reason = line.match(/^reason:\s*(.*?)\s*$/);
    if (reason && current) current.reason = reason[1].replace(/^['"]|['"]$/g, '');
  }
  for (const e of exempt)
    if (e.selectors.length !== 2 || !e.reason) throw new Error(`bad exemption in ${file}: ${JSON.stringify(e)}`);
  return { widths, modes, heights, tolerances, anchors, exempt };
}

const contract = loadContract(contractFile);
const WIDTHS = contract.widths;
const MODES = contract.modes;
const ANCHOR_GROUPS = contract.anchors;
const TOL = contract.tolerances;
const heightFor = (w) => (contract.heights.find((h) => h.max === null || w <= h.max) || {}).height;
const exempt = contract.exempt;
const exemptHits = exempt.map(() => 0);

// In-page helpers, installed before page scripts.
function installHelpers() {
  const canvas = document.createElement('canvas');
  const cx = canvas.getContext('2d');
  const pathOf = (e) => {
    const seg = [];
    let n = e;
    while (n && n.nodeType === 1 && n !== document.body) {
      let s = n.tagName.toLowerCase();
      if (n.id) s += '#' + n.id;
      else if (typeof n.className === 'string' && n.className.trim())
        s += '.' + n.className.trim().split(/\s+/).join('.');
      seg.unshift(s);
      n = n.parentElement;
    }
    return seg.join(' > ');
  };
  const visible = (e) => {
    const cs = getComputedStyle(e);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0';
  };
  // Glyph ink per line box: Range rect for width/position, canvas font metrics for vertical extent.
  const inkOf = (e) => {
    const cs = getComputedStyle(e);
    cx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const out = [];
    for (const n of e.childNodes) {
      if (n.nodeType !== 3 || !n.textContent.trim()) continue;
      const m = cx.measureText(n.textContent);
      const asc = m.actualBoundingBoxAscent || parseFloat(cs.fontSize) * 0.75;
      const desc = m.actualBoundingBoxDescent || 0;
      const fontAsc = m.fontBoundingBoxAscent || parseFloat(cs.fontSize) * 0.9;
      const rg = document.createRange();
      rg.selectNodeContents(n);
      for (const r of rg.getClientRects()) {
        if (r.width <= 0.5 || r.height <= 0.5) continue;
        const baseline = r.top + fontAsc;
        out.push({ t: baseline - asc, b: baseline + desc, l: r.left, r: r.right,
                   text: n.textContent.trim().slice(0, 28) });
      }
    }
    return out;
  };
  const leavesOf = () => [...document.querySelectorAll('body *')].filter((e) => {
    if (e.closest('script,style,noscript,svg')) return false;
    if (!visible(e)) return false;
    const r = e.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    return [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 0);
  });
  // Visible box = layout box clipped by every overflow:hidden|clip ancestor (padding box).
  const visibleBoxOf = (e) => {
    const r = e.getBoundingClientRect();
    const box = { l: r.left, t: r.top, r: r.right, b: r.bottom };
    let p = e.parentElement;
    while (p) {
      const cs = getComputedStyle(p);
      if (['hidden', 'clip'].includes(cs.overflowX) || ['hidden', 'clip'].includes(cs.overflowY)) {
        const pr = p.getBoundingClientRect();
        const bl = parseFloat(cs.borderLeftWidth) || 0, br = parseFloat(cs.borderRightWidth) || 0;
        const bt = parseFloat(cs.borderTopWidth) || 0, bb = parseFloat(cs.borderBottomWidth) || 0;
        box.l = Math.max(box.l, pr.left + bl); box.r = Math.min(box.r, pr.right - br);
        box.t = Math.max(box.t, pr.top + bt); box.b = Math.min(box.b, pr.bottom - bb);
      }
      p = p.parentElement;
    }
    return box;
  };
  window.__gh = { pathOf, visible, inkOf, leavesOf, visibleBoxOf };
}

// INV1-INV4 at scroll 0. Returns hits alongside violations so the caller can
// prove every documented exemption still matches a real INV1 candidate.
function checkStatic({ width, mode, exemptions, tol }) {
  const { pathOf, visible, inkOf, leavesOf, visibleBoxOf } = window.__gh;
  const { INK, XTOL, BOX, DIV, STACK, CLEAR_LARGE, CLEAR_SMALL } = tol;
  const ownSelector = (e) => pathOf(e).split(' > ').pop();
  const exemptionFor = (a, b) => exemptions.findIndex(({ selectors }) =>
    (selectors[0] === ownSelector(a) && selectors[1] === ownSelector(b)) ||
    (selectors[1] === ownSelector(a) && selectors[0] === ownSelector(b)));
  const V = [], hits = [];
  const f1 = (n) => Number(n.toFixed(1));
  const push = (inv, els, measured, expected) => V.push({ invariant: inv, elements: els, width, mode, measured, expected });
  const leaves = leavesOf();
  const leafInk = new Map(leaves.map((e) => [e, inkOf(e)]));

  // INV1 - no overlap of glyph ink.
  for (let i = 0; i < leaves.length; i++) {
    const a = leaves[i];
    for (let j = i + 1; j < leaves.length; j++) {
      const b = leaves[j];
      if (a.contains(b) || b.contains(a)) continue;
      const ex = exemptionFor(a, b);
      if (ex >= 0) {
        const hit = leafInk.get(a).some((ra) => leafInk.get(b).some((rb) =>
          (Math.min(ra.b, rb.b) - Math.max(ra.t, rb.t)) > INK &&
          (Math.min(ra.r, rb.r) - Math.max(ra.l, rb.l)) > XTOL));
        if (hit) hits.push(ex);
        continue;
      }
      for (const ra of leafInk.get(a)) {
        for (const rb of leafInk.get(b)) {
          const ox = Math.min(ra.r, rb.r) - Math.max(ra.l, rb.l);
          const oy = Math.min(ra.b, rb.b) - Math.max(ra.t, rb.t);
          if (oy > INK && ox > XTOL)
            push('INV1', [`${pathOf(a)} "${ra.text}"`, `${pathOf(b)} "${rb.text}"`],
              `${f1(Math.min(ox, oy))}px ink overlap`, '0 ink overlap (vertical tol 1px)');
        }
      }
    }
  }

  // INV2 - no visible overshoot.
  for (const e of document.querySelectorAll('body *')) {
    if (e === document.documentElement || e === document.body || !visible(e)) continue;
    const r = e.getBoundingClientRect();
    if (r.width < 1 && r.height < 1) continue;
    const box = visibleBoxOf(e);
    const host = { l: 0, t: 0, r: document.documentElement.scrollWidth, b: document.documentElement.scrollHeight };
    // A box fully outside the document (e.g. a focus-only skip link) is not visible at all.
    const intersects = box.l < host.r && box.r > host.l && box.t < host.b && box.b > host.t;
    const issues = [];
    if (intersects) {
      if (box.l < host.l - BOX) issues.push(`left ${f1(host.l - box.l)}px`);
      if (box.r > host.r + BOX) issues.push(`right ${f1(box.r - host.r)}px`);
      if (box.t < host.t - BOX) issues.push(`top ${f1(host.t - box.t)}px`);
      if (box.b > host.b + BOX) issues.push(`bottom ${f1(box.b - host.b)}px`);
    }
    if (issues.length) push('INV2', [pathOf(e)], issues.join(', '), 'visible box inside document (tol 1px)');
    const cs = getComputedStyle(e);
    if (cs.overflowX === 'visible' && e.scrollWidth > e.clientWidth + BOX)
      push('INV2', [pathOf(e)], `scrollWidth ${e.scrollWidth} > clientWidth ${e.clientWidth}`,
        'scrollWidth <= clientWidth + 1');
  }
  for (const f of document.querySelectorAll('.chapter .field')) {
    const cs = getComputedStyle(f);
    const box = visibleBoxOf(f);
    const cb = {
      l: box.l + (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.borderLeftWidth) || 0),
      r: box.r - (parseFloat(cs.paddingRight) || 0) - (parseFloat(cs.borderRightWidth) || 0),
      t: box.t + (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.borderTopWidth) || 0),
      b: box.b - (parseFloat(cs.paddingBottom) || 0) - (parseFloat(cs.borderBottomWidth) || 0),
    };
    const pr = visibleBoxOf(f.parentElement);
    const issues = [];
    if (cb.l < pr.l - BOX) issues.push(`left ${f1(pr.l - cb.l)}px`);
    if (cb.r > pr.r + BOX) issues.push(`right ${f1(cb.r - pr.r)}px`);
    if (cb.t < pr.t - BOX) issues.push(`top ${f1(pr.t - cb.t)}px`);
    if (cb.b > pr.b + BOX) issues.push(`bottom ${f1(cb.b - pr.b)}px`);
    if (issues.length) push('INV2', [pathOf(f)], `field content ${issues.join(', ')}`, 'inside parent (tol 1px)');
  }

  // INV3 - no divergence.
  const leftEls = ['.lab-nav .mark', '#horizon h1', '.ch-coordinate', '.ch-name']
    .flatMap((s) => [...document.querySelectorAll(s)]);
  const lefts = leftEls.map((e) => ({ e, x: e.getBoundingClientRect().left }));
  if (lefts.length > 1) {
    const xs = lefts.map((o) => o.x);
    const spread = Math.max(...xs) - Math.min(...xs);
    if (spread > DIV) {
      const lo = lefts.reduce((p, c) => (c.x < p.x ? c : p));
      const hi = lefts.reduce((p, c) => (c.x > p.x ? c : p));
      push('INV3', [pathOf(lo.e), pathOf(hi.e)],
        `${f1(spread)}px left spread (${f1(lo.x)}..${f1(hi.x)})`, '<= 1.5px');
    }
  }
  const field = document.querySelector('.chapter .field');
  if (field) {
    const fcs = getComputedStyle(field);
    const fr = field.getBoundingClientRect();
    const contentRight = fr.right - (parseFloat(fcs.paddingRight) || 0) - (parseFloat(fcs.borderRightWidth) || 0);
    for (const s of ['.band', '.ledger', '.spec', '.colophon-links', '.nav-ticker', '.hud-role p']) {
      for (const e of document.querySelectorAll(s)) {
        const r = e.getBoundingClientRect();
        if (r.width < 1 || !visible(e)) continue;
        const d = Math.abs(r.right - contentRight);
        if (d > DIV)
          push('INV3', [pathOf(e)],
            `right ${f1(r.right)} vs field content right ${f1(contentRight)} (delta ${f1(d)})`, '<= 1.5px');
      }
    }
  }

  // INV4 - no mixing, restricted to true vertical stacking of glyph ink.
  const threshold = width >= 701 ? CLEAR_LARGE : CLEAR_SMALL;
  const nearest = new Map();
  for (const a of leaves) {
    for (const b of leaves) {
      if (a === b || a.contains(b) || b.contains(a)) continue;
      let best = Infinity;
      for (const ra of leafInk.get(a)) {
        for (const rb of leafInk.get(b)) {
          const ox = Math.min(ra.r, rb.r) - Math.max(ra.l, rb.l);
          const narrow = Math.min(ra.r - ra.l, rb.r - rb.l);
          if (narrow <= 0 || ox / narrow < STACK) continue;
          const gap = rb.t - ra.b;
          if (gap > XTOL && gap < best) best = gap;
        }
      }
      if (best < Infinity && (!nearest.has(a) || best < nearest.get(a).gap))
        nearest.set(a, { b, gap: best });
    }
  }
  for (const [a, n] of nearest) {
    if (n.gap < threshold)
      push('INV4', [pathOf(a), pathOf(n.b)], `${f1(n.gap)}px ink clearance`, `>= ${threshold}px`);
  }
  return { violations: V, hits };
}

// INV5 after a landed anchor click.
function checkAnchor({ href, group, index, width, mode }) {
  const { pathOf, inkOf } = window.__gh;
  const V = [];
  const obstacles = [];
  for (const [sel, el] of [
    ['.lab-nav', document.querySelector('.lab-nav')],
    ['nav.spine', document.querySelector('nav.spine')],
  ]) {
    if (!el) continue;
    const b = el.getBoundingClientRect();
    if (b.width > 0 && b.height > 0) obstacles.push({ sel, t: b.top, l: b.left, b: b.bottom, r: b.right });
  }
  const sec = href && href.startsWith('#') ? document.querySelector(href) : null;
  if (!sec) return [{ invariant: 'INV5', elements: [`${group}[${index}] ${href}`, 'missing target'],
                     width, mode, anchor: href, measured: 'target missing', expected: 'target exists' }];
  const heading = sec.querySelector('.ch-name') || sec.querySelector('h1,h2,h3') || sec;
  for (const r of inkOf(heading)) {
    for (const o of obstacles) {
      const ox = Math.min(r.r, o.r) - Math.max(r.l, o.l);
      const oy = Math.min(r.b, o.b) - Math.max(r.t, o.t);
      if (ox > 0.5 && oy > 0.5)
        V.push({ invariant: 'INV5', elements: [`${pathOf(heading)} "${r.text}"`, `${group}[${index}] ${href} -> ${o.sel}`],
                 width, mode, anchor: href, measured: `${Number(Math.min(ox, oy).toFixed(1))}px ink overlap`,
                 expected: '0 ink overlap (tol 0.5px)' });
    }
  }
  return V;
}

// Deliberate faults for the red proof.
const CSS_INJECTS = { edge: '.band{transform:translateX(20px)!important}' };
function injectOverlap() {
  const p = [...document.querySelectorAll('.hud-role p')].find((e) => !e.className);
  if (p) p.style.setProperty('transform', 'translateY(20px)', 'important');
}
function injectOcclude() {
  const s = document.querySelector('#work');
  const h = document.querySelector('#work-title');
  if (s) s.style.setProperty('scroll-margin-top', '-100px', 'important');
  if (h) h.style.setProperty('transform', 'translateY(-20px)', 'important');
}

const browser = await chromium.launch();
const allViolations = [];
const configs = WIDTHS.filter((w) => !onlyWidth || w === onlyWidth)
  .flatMap((w) => MODES.filter((m) => !onlyMode || m === onlyMode).map((m) => ({ w, m })));

try {
  for (const { w, m } of configs) {
    const ctx = await browser.newContext({
      viewport: { width: w, height: heightFor(w) }, reducedMotion: m, deviceScaleFactor: 1,
    });
    await ctx.addInitScript(installHelpers);
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForSelector('.lab-nav', { timeout: 10000 });
    await page.waitForTimeout(350);
    if (inject === 'edge' || inject === 'all') await page.addStyleTag({ content: CSS_INJECTS.edge });
    if (inject === 'overlap' || inject === 'all') await page.evaluate(injectOverlap);
    if (inject === 'occlude' || inject === 'all') await page.evaluate(injectOcclude);
    if (inject) await page.waitForTimeout(200);

    const res = await page.evaluate(checkStatic, {
      width: w, mode: m, exemptions: exempt,
      tol: {
        INK: TOL.ink_overlap_px, XTOL: 0.5, BOX: TOL.box_px, DIV: TOL.divergence_px,
        STACK: TOL.stack_overlap_ratio, CLEAR_LARGE: TOL.clearance_large_px, CLEAR_SMALL: TOL.clearance_small_px,
      },
    });
    allViolations.push(...res.violations);
    for (const i of res.hits) exemptHits[i]++;

    for (const group of ANCHOR_GROUPS) {
      const count = await page.locator(group).count();
      for (let i = 0; i < count; i++) {
        const loc = page.locator(group).nth(i);
        if (!await loc.isVisible().catch(() => false)) continue;
        const href = await loc.getAttribute('href');
        await page.evaluate(() => scrollTo(0, 0));
        await loc.click({ timeout: 5000 });
        let y = -1, stable = 0;
        for (let k = 0; k < 18; k++) {
          const ny = await page.evaluate(() => scrollY);
          if (ny === y) { if (++stable >= 2) break; } else stable = 0;
          y = ny;
          await page.waitForTimeout(90);
        }
        allViolations.push(...await page.evaluate(checkAnchor, { href, group, index: i, width: w, mode: m }));
      }
    }
    await ctx.close();
  }
} finally {
  await browser.close();
}

for (const v of allViolations) v.elements = Array.isArray(v.elements) ? v.elements : [String(v.elements)];
const dead = exempt.filter((_, i) => exemptHits[i] === 0);

fs.writeFileSync(outFile, JSON.stringify({
  url, inject: inject || 'none', widths: WIDTHS.filter((w) => !onlyWidth || w === onlyWidth),
  modes: MODES.filter((m) => !onlyMode || m === onlyMode),
  generated: new Date().toISOString(), count: allViolations.length,
  exemptHits, deadExemptions: dead, violations: allViolations,
}, null, 2));

const order = ['INV1', 'INV2', 'INV3', 'INV4', 'INV5'];
const counts = Object.fromEntries(order.map((k) => [k, allViolations.filter((v) => v.invariant === k).length]));
console.log(`URL: ${url}  inject=${inject || 'none'}  configs=${configs.length}`);
for (const e of dead)
  console.log(`DEAD EXEMPTION | ${e.selectors.join(' <> ')} | matched no INV1 candidate | ${e.reason}`);
console.log('INVARIANT | ELEMENT(S) | WIDTH | MODE | MEASURED | EXPECTED');
const DISPLAY_CAP = 200;
for (const v of allViolations.slice(0, DISPLAY_CAP))
  console.log([v.invariant, v.elements.join(' <> '), v.width, v.mode, v.measured, v.expected].join(' | '));
if (allViolations.length > DISPLAY_CAP) console.log(`... ${allViolations.length - DISPLAY_CAP} more rows in ${outFile}`);
console.log('SUMMARY ' + order.map((k) => `${k}=${counts[k]}`).join(' ') + ` TOTAL=${allViolations.length}` +
  (dead.length ? ` DEAD_EXEMPTIONS=${dead.length}` : ''));
console.log(`JSON: ${outFile}`);
process.exit(allViolations.length || dead.length ? 1 : 0);
