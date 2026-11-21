---
name: Deep Field Ledger
colors:
  ground: "#000000"
  ink: "#E9E6E1"
  ink-muted: "#9A968E"
  signal: "#C68E74"
  on-signal: "#1A1512"
  measure: "#627AC2"
  selection: "#C68E7428"
typography:
  display:
    fontFamily: "Libre Bodoni"
    fontSize: "clamp(3.25rem, 12vw, 14rem)"
    lineHeight: "0.92"
    letterSpacing: "-0.01em"
  text:
    fontFamily: "Newsreader"
    fontSize: "1.0625rem"
    lineHeight: "1.6"
  data:
    fontFamily: "IBM Plex Mono"
    fontSize: "0.75rem"
    lineHeight: "1.45"
    letterSpacing: "0.06em"
spacing:
  unit: "4px"
  scale: [0, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128]
radius:
  none: "0"
motion:
  quick: "140ms"
  base: "280ms"
  easing: "cubic-bezier(0.25, 0.8, 0.35, 1)"
---

# Deep Field Ledger

## Idea

A deep-field catalog: quiet but lush. The career is a mapped sky on true
black — the work and the record are resolved points of light, the chapters
are constellations, and one burnt-orange accent marks the live signal. The
hero is a rendered deep field: the sky's material — star populations, warm
galaxy smudges, a dust lane, a faint lensing band — is deterministic
decorative render, never claimed as data; within it the record points stand
apart, spiked and data-mapped, each a shipped package or a worked repo,
sized by its own numbers. The sky is the record, set in its sky.

It refuses wallpaper nebulae behind text, cropped focal heroes, boxed panels
and plates, second navigations, and the retired black hole.

## Color

`src/styles/tokens.css` is the only place a color is written; a component
reads a token, never a hex. The void is the only ground; there is no light
mode and no `prefers-color-scheme` branch.

- `ground` `#000000` — AMOLED true black, page and hero alike: one void,
  nothing lit but the sky.
- `ink` `#E9E6E1` — warm paper starlight: headings and body.
- `ink-muted` `#9A968E` — dim points: descriptions, meta lines.
- `signal` `#C68E74` — the burnt-orange lensed arcs, the one hot accent:
  section numerals, links, the active hairline, live stat points. Live =
  the three packages with the most downloads in the last 30 days, read
  from the committed content, never hardcoded.
- `measure` `#627AC2` — the steel-blue diffraction spikes: giant figures and
  point art only, never body text.
- `on-signal` `#1A1512` and `selection` — ink on signal fills, and the
  text-selection tint.

Floors, asserted by `tests/design-floors.test.ts` computed from the live
token values: ink ≥ 7:1, ink-muted ≥ 4.5:1 and signal ≥ 4.5:1 against
ground; on-signal ≥ 4.5:1 on its signal fill; measure ≥ 3:1, non-text and
large text only. On true black every measured value exceeds its floor by a
wide margin; the floors stay the floors. A mismatch between this file and
the test is a defect in both.

## Type

Three OFL faces, self-hosted as latin-subset woff2 with their licence files
in `public/fonts/`, `font-display: swap`, no runtime font CDN:

| Role | Face | Where |
|---|---|---|
| Display | Libre Bodoni (variable 400–700) | the name, the statement, chapter titles |
| Text | Newsreader (variable, opsz 6–72) | running copy, row descriptions, prose columns |
| Data | IBM Plex Mono (400–600) | all figures, catalog labels, coordinates, meta |

No sans-serif anywhere: the catalog is set entirely in serif and mono.
Figures are tabular and aligned on the decimal; units stay with the number.
The measure is 56ch; a full-bleed paragraph is never set. Newsreader runs at
text optical sizes; display scale only through the display role.

## Space

One masthead: the author mark `public/brand/signature.svg` at width 120
once — the owned mark keeps its own file, format and palette; site tokens
bind site surfaces, never the brand mark — then the five chapter links on
one hairline — the constellation line; the active chapter carries the
signal tint. The hero is one full-viewport field; its plate content sits in the
corners. Chapters alternate dense catalog blocks — figures, sparklines,
ruled rows — with open register rows; hairline rules separate rows, never
boxes. Rhythm: dense, open, dense; never five equal bands.

Two compositions, not one reflowed: 2560x1440 is the primary canvas — the
sky spans edge to edge, the content frame widens with the viewport (82rem
on desktop, up to 110rem at native 1440p, never dead margins), display
scale tuned at native. 390-430 gets a recreated compact UI — condensed
numeral navigation on one hairline, stacked catalog rows, touch-first
targets. Per-class art direction, never a squeezed desktop.

## Motion

One kinetic moment: the hero points settle once, then hold. Under
`prefers-reduced-motion: reduce` the field renders settled and the document
is complete and static — nothing hidden, nothing inert. Everything else is
state motion only: hover hairlines, focus rings, the 140/280ms tokens.
Native scroll; no interception, no snap, no scroll-driven choreography.

## Rules

- The void is the only ground; no panel, plate, card or fill behind text; a
  hairline is a rule, not a box.
- Tokens are normative; prose explains and never overrides.
- One navigation; every chapter reachable from it.
- Reduced motion is a complete document, not a frozen animation.
- Content truth only: every figure and every claimed point comes from
  `src/content/`; the sky's backdrop material is decorative render, never
  presented as data; nothing retyped in a component; a caveat beside the
  claim it qualifies.
- The OG card regenerates from this law when the look changes.
- Dark-only by concept: a daylight catalog is a different product, not a
  mode of this one.
