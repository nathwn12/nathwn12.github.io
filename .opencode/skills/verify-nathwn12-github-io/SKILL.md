---
name: verify-nathwn12-github-io
description: Use before claiming any visual, layout, contrast, keyboard or looks-right result for this portfolio. Wraps the existing visual driver that measures the built site. The driver measures and does not gate, with no threshold, no exit code tied to a metric and no way to pass or fail anything.
---

# Verify nathwn12.github.io

The proof for a visual claim here is the rendered `dist/` artefact, measured by
`scripts/visual-audit.mjs` and read back from `metrics.json` and the shots.
Nothing below substitutes for looking at the PNGs.

Five parts, in order: **Launch, Doctor, Drive, Evidence, Cleanup**. Stop at
Doctor if any fact it reports is false.

## 1. Launch

From the repo root, on bun 1.4.4 and node >= 20.19:

```pwsh
bun install --frozen-lockfile
bun run build
```

`bun run build` is `vite build && node scripts/copy-404.mjs && node scripts/prerender-routes.mjs`.
The driver reads `dist/` and needs these three files to exist:

- `dist/index.html`
- `dist/experience/index.html`
- `dist/projects/index.html`

Playwright is `1.64.x` and needs one Chromium download. `sharp` is a dependency
of this repo but is not on this path. Build duration is not measured here, so
quote no figure for it.

## 2. Doctor

One command, from the repo root. It reports the node version, whether each of the
three route files exists, and whether `chromium.executablePath()` exists and
which path it is:

```pwsh
node -e "const fs=require('node:fs'),p=require('node:path');const ok=(x)=>fs.existsSync(p.resolve(x));const [maj,min]=process.versions.node.split('.').map(Number);console.log('node',process.version,maj>20||(maj===20&&min>=19)?'satisfies >=20.19':'TOO OLD');for(const f of ['dist/index.html','dist/experience/index.html','dist/projects/index.html'])console.log(' ',f,ok(f)?'present':'MISSING');try{const{chromium}=require('playwright');const ex=chromium.executablePath();console.log(' chromium',fs.existsSync(ex)?'present':'MISSING',ex)}catch(e){console.log(' chromium UNKNOWN: playwright not installed (bun install --frozen-lockfile)')}"
```

If any fact is false, stop and run the named repair. Never continue to Drive on a
false fact, because the driver reports a page that never rendered as a page that
rendered badly. The driver and the build run serially, never together: the driver
serves `dist/`, and a concurrent `bun run build` replaces it mid-run, which fails
as a page that did not render.

| False fact | Repair |
|---|---|
| node too old | install node >= 20.19 |
| `playwright` will not import | `bun install --frozen-lockfile` |
| a route file is missing, or `dist/` is stale | `bun run build` |
| Chromium executable missing | `bunx playwright install chromium` |

## 3. Drive

From the repo root, with a fresh output directory each run:

```pwsh
node scripts/visual-audit.mjs "$env:TEMP\opencode\verify-portfolio"
```

A fresh directory matters: shots from an earlier build sitting beside this run's
`metrics.json` are evidence of a different page.

The driver serves `dist/` through Playwright request interception and needs no
HTTP server. Never start one for this, and never point the audit at `bun run dev`
or `bun run preview:live`.

What it drives:

- routes read from `src/lib/routes.ts`, not a literal array: currently `/`, `/experience`, `/projects`
- viewports 1440x900 and 390x844
- a home-only dark pass, with the OS colour scheme set to dark
- reduced motion on every context

## 4. Evidence

`<tag>` is `<slug>-<viewport>`, for example `home-1440` or `experience-390`.
Dark shots use `<viewport>` alone (`1440` or `390`), not `<tag>`.

| Family | Files |
|---|---|
| full page | `<tag>-full.png`, one per route and viewport: 6 files |
| band crops | `<tag>-band-NN-<id>.png`, one per `main section.band`: 8 files, experience and projects only |
| contact band | `<tag>-band-contact.png`, home only: 2 files |
| phone closings | `closing-390-NN-<id>.png`, from the home route's `main section.band` at 390; none written because home has no bands |
| dark pass | `home-dark-<viewport>-full.png`, one per viewport: 2 files, `1440` and `390` |
| the record | `metrics.json` |

The six measured pages are `/`, `/experience` and `/projects` at 1440 and 390.
Their fields are `route`, `viewport` (which carries `width` and `height`),
`tag`, `title`, `height`, `overflowX`, `bands`, `contrast`, `recordRows`,
`prose`, `h1` and `consoleErrors`. The nested shapes are:

- `bands[]` carries `index`, `id`, `heading`, `top`, `height`, `paddingTop`,
  `paddingBottom`, `closing`.
- `contrast[]` carries `selector`, `text`, `ratio`, `min`, `size`, and holds
  only failures.
- `recordRows[]` carries `claim`, `claimBaseline`, `figureBaseline`, `delta`,
  `figureRight`, `rowRight`.
- `prose[]` carries `tag`, `className`, `text`, `charsPerLine`, `width`.
- `h1` carries `text`, `size`, `lines`.

The two dark home entries carry only `route`, `viewport` (a string such as
`1440`) and `theme`. `metrics.json` also holds `out`, `origin` and `errors[]`.
The removed panel's `measureState` and `control` fields are no longer present.

Phone-closing crops come from the home route alone: the driver counts
`main section.band` on home at 390, so with none there the family is absent,
even though experience and projects each report two bands. Dark band crops use
the same home selector, so none is written either.

The two-state measurement panel was removed in `1e7d2c0`, so its before/after
shots and keyboard-operability record are no longer emitted. The driver
measures the shipped DOM only; the removal evidence and its Unverified reason
are stated in the driver header.

### Measured, not passed

The driver stores measurements and compares none of them. It has no
`process.exit` anywhere, so its exit code reports whether the Node process ran,
never whether the page is right. It cannot confer a pass, and "the audit is
green" is not a sentence this repo can produce.

The gates live elsewhere, and they are the only things here that exit 1 on a
visual fact:

- `node scripts/contrast-audit.mjs` reads the shipped `src/styles/tokens.css`,
  measures every required token pair with the WCAG 2.2 relative-luminance
  formula, and exits 1 on one failing pair.
- `tests/prose-measure.test.ts` renders `dist/` at 1440 and asserts every prose
  block stays inside the design measure: **56ch** resolved in the block's own
  font, with 1.02 of slack. It skips rather than fails when Chromium is absent.

A visual claim resting on the driver alone is **Unverified**. To be measured it
needs a number read from `metrics.json` or a gate that exited 0; to be accepted
as design it needs the PNG looked at. The reading measure is 56ch: cite 56ch.

## 5. Cleanup

1. Delete the output directory this run created.
2. If a preview was started, stop the pid in `preview-status.json`, then delete
   that file.
3. `git status --short` must be empty.

`dist/`, `*.tsbuildinfo` and `preview-status.json` are ignored, so a line here is
a file the run left behind that it should not have.

## What this driver cannot prove

- no threshold: it computes numbers and compares none of them
- no baseline diff: nothing is compared against an earlier run
- no exit code tied to a metric
- no accessibility gate: contrast is recorded, focus order and semantics are not audited
- no console-error gate: errors are collected in `errors[]` and the run still completes
- no motion proof: reduced motion is the only mode driven, so no animation is ever seen
- a crash mid-run leaves shots and no `metrics.json`, because the file is written once at the end

## Interview a repo before writing its skill

Five questions, answered from that repo's own source and never copied from another
repo's skill:

1. What does the build produce, and exactly which files does the driver read out of it?
2. Which command builds it, on which toolchain versions, and which browser download does it need?
3. Does the driver need a server, or does it serve the build itself?
4. Which files and fields are the evidence, and what can the driver not decide?
5. Which commands actually gate, and what makes each one exit non-zero?
