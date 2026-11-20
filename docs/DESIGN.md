# DESIGN — the event horizon ledger

This is an **event horizon portfolio**. A procedural black hole holds the first
screen as one figure; beneath it the career is an open editorial ledger where
hairline rules, tabular numerals and monospace data are the composition.

It deliberately refuses the five-panel dossier, the bottom orbit rail, the
boxed copy, and any use of the shader as wallpaper behind cards. There are no
cards, no panels, no second navigation and no scroll interception. The old
"Recorder" stage is retired; this file describes what ships.

---

## 1. Art direction

- **Dark is the only sky.** Three recorded renders — A pixel-dither, B CRT/VHS,
  C high fidelity — fill the hero full-bleed, chosen by `?hero=a|b|c` with C as
  the default. The name and role sit in the corners as a HUD; grain and
  vignette are baked into every frame, so no runtime scrim or overlay is drawn.
- Radius is 0. Structure is drawn with one-pixel rules (`--rec-rule`,
  `--rec-rule-strong`). No shadows, glass, glow or decoration under a heading.
- Space is a material. The five chapters alternate a large numeral band with an
  open row list and a measured prose column.

## 2. Tokens

`src/styles/tokens.css` is the only place a colour is written. A component
reads a `--rec-*` token; it never writes a hex. The one dark `:root` block
declares every role; `index.html` fixes `data-theme="dark"` and the
`theme-color` mirror before first paint. There is no theme switch and no
`prefers-color-scheme` branch.

The palette keeps the earlier Phosphor values because they already clear the
floors. `scripts/contrast-audit.mjs` resolves the dark block and fails the build
on a pair below its floor: ink ≥ 7, muted ink ≥ 4.5, signal ≥ 4.5, measure ≥
4.5, alarm ≥ 4.5, on-signal ≥ 4.5. Rules are reported, not floored.

`--rec-measure` (gold) is spent only on measured figures. `--rec-signal` (green)
is spent on structure: section numbers, links, the active hairline.

## 3. Type

One committed pairing from the `ui-ux-pro-max` typography search, self-hosted
in `public/fonts` as latin subsets with `font-display: swap` and an OFL 1.1
licence (`OFL-Ledger.txt`).

| Role | Face | Where |
|---|---|---|
| Display | Playfair Display (variable 400–900) | the name, section labels, the statement, the mailto |
| Text | Source Serif 4 (variable 300–600) | running copy, row descriptions, HUD lines |
| Data | Space Mono (400, 700) | HUD labels, section numbers, all figures, metadata |

The display cut is the single preload. Mono figures are tabular and aligned on
the decimal; units stay with the number (`−98%`, `1,182`, `3 yrs 2 mos`). The
measure is 56ch for running copy; a full-bleed paragraph is never set.

## 4. Composition

- **One masthead**, sticky, with the mark and the five chapter links. On a
  phone the links wrap to a second row; they are never a second nav or a menu.
- **Hero**: `calc(100svh - header)`. Four HUD corners — name, role, status,
  scroll cue. The figure is the shader; the type never sits over a card.
- **01 The reduction**: the claim, then four open rows. Each row is a giant
  mono figure, a claim and its mechanism, separated by a hairline.
- **02 The method**: a measured prose column beside the practice as a *rule* —
  three mono terms divided by hairlines, no box — and the tenure/period/base
  as a ruled data list.
- **03 The work**: thirteen open rows. Name, description, kind/year and an
  arrow on one line at 1440, stacked at 390. Hover draws a 1px signal rule.
- **04 The record**: three giant commit/repository figures as a rule, the
  provenance sentence, then three experience rows with their measured result.
- **05 Contact**: the contact line, the address as a large display link, the
  one line about what a mailto does. No form.
- **Colophon**: the ways out and the shader credit. A `<p>` of links, not a
  landmark.

Every fact comes from `src/content/*`; nothing is retyped in a component.

## 5. Shader and the recorded loop

`src/lib/blackhole/` ports the four-pass pipeline from the MIT-licensed
`sayed1145/glsl-black-hole` viewer: MRT geodesic map (three float targets),
plasma emission, four separable bloom levels, and the tone-mapping composite.
The optical constants and radiance profiles are verbatim. `THIRD-PARTY-NOTICES.md`
carries the licence.

The port is the **renderer, not the shipped path**. A per-aspect `uFov` uniform
frames the same object for each master: `1` for the 16:9 camera, `0.42` for the
9:16 camera. Three treatments ship from the settled render: **A** pixel-dither,
**B** CRT/VHS, **C** high fidelity. Each has one eight-second seamless loop per
aspect at 30 fps, encoded as AV1 MP4 with an H.264 MP4 fallback. Both aspects
sample the same clock, so their phase is identical; the shader's modulo-eight
clock makes `t=0` and `t=8` pixel-identical.

The hero plays one recording as video. No WebGL context is created on the page,
no shader is compiled and no per-frame shader cost is paid. `?hero=a|b|c`
selects the treatment once, with C as the default; a change is a page load, not
a runtime source swap. Within a treatment the source is chosen by
`matchMedia("(max-aspect-ratio: 1/1)")`, not by width. Two `<source>` children
per aspect let the browser pick AV1 first and H.264 second. On an orientation
change the poster stays up while the other source decodes. The video pauses off
screen and on a hidden tab, plays at 0.7×, and yields to its poster under
reduced motion. The wrapper's pointer and scroll parallax give the moving image
depth without a scene graph; there is no runtime overlay. Grain and vignette are
drawn into each recording by the shader, so the encoder keeps its temporal
redundancy and the loop stays seamless. A alone sets `image-rendering:
pixelated` on the video so the dither stays crisp at scale.

`public/horizon-{a,b,c}-poster-{desktop,phone}.webp` are settled stills of each
master. The `<picture>` under the video selects the same treatment and aspect;
its `<img>` is the first paint, the reduced-motion document and the fallback
when autoplay is refused, notably under iOS low-power mode. The HUD uses
`100dvh` and the safe-area insets.

## 6. Motion and accessibility

- The recorded loop plays while the hero is on screen and the tab is visible.
  It yields to a settled still under `prefers-reduced-motion: reduce`.
- Copy reveals once on scroll. The hidden start exists only under
  `@media (prefers-reduced-motion: no-preference)` and `data-motion="on"`; a
  reduced-motion visitor gets a complete static document with nothing hidden.
- Native scroll only. No wheel, touch or key interception, no snap.
- One `<nav>`, one `<main>`, one `<header>`, five labelled sections and a skip
  link. Focus order follows reading order; the focus ring is never removed.
- 44px minimum on every nav link; no toggle chrome ships.

## 7. Performance

The hero is video decode, not shader work. The assets live in `public/`; the
video is never inlined and the JS bundle stays under 250 kB gzip. Playback
pauses off screen and on `document.hidden`; only transform and opacity move on
the main thread, and the parallax loop stops with the video. Fonts are local;
there is no runtime CSS-in-JS and no third-party script.

`scripts/frame-table.mjs` captures native-size screenshots and a frame table at
2560, 1440, 768, 390, 393 and 430 in the one dark sky, on the default C, and
verifies A and B playback once each at 1440 and 390. Its rAF deltas are 60 Hz
vsync-quantised: a
literal 16.7 ms is the quantisation step, not a claim that a frame took exactly
16.7 ms of work. The same run reports the settled window separately from the
warm-up window so a first-frame decode is not read as steady state.

`bun run check` runs the typecheck, the contrast audit, the production build
and the tests. The production build emits one JS chunk and one CSS file plus
redirect stubs for the retired paths; it pushes nothing.
