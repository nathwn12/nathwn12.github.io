# DESIGN — the record

The site is a **flight recorder for a career**. Not a portfolio of pictures: an
instrument panel that states what was shipped, when, and what changed when it
shipped. Every loud thing on the page is a measurement, and the one kinetic
moment on the page exists to make a measurement visible.

The audience is a hiring manager who has ninety seconds and has read a hundred
developer sites this week. The page has to make one claim credible — payment
backends that held up under production load — and then hand over the receipts:
1,182 commits recovered from 21 scanned repositories, 17 carrying the work, 11
published tools, 88 packages, −98% payment latency, −40%+ read latency, 0 high or
critical Snyk findings.

This file is the design system as it ships. It is a spec, not a plan: anything
described here is in the code, and anything in the code that contradicts this
file is a bug in one of them.

---

## 1. Art direction — "Recorder"

A near-black instrument panel, film grain, mono readouts, hairline rules, one
serif display face, a live flow field behind the cover, and exactly one piece of
theatre: the cover's load sequence.

- **One ground.** The page is dark, and only dark. There is no light block, no
  two theme blocks and one switch. `color-scheme` is declared per theme, and `data-theme` on `<html>` is the only selector that repoints the roles.
- **Radius 0 everywhere.** Enforced by a single `*` rule reading
  `--rec-radius`, so a component cannot quietly soften an edge and start a
  second visual language. No shadows, no cards, no glass.
- **Hairlines, not borders.** Structure is drawn with 1px (`--rec-rule`) or an
  active edge (`--rec-rule-strong`). A rule appears where it encodes structure —
  a panel edge, a table row, a section seam — never under a heading as
  decoration.
- **Grain, once.** One generated `feTurbulence` noise field, `fractalNoise`,
  `baseFrequency 0.82`, `numOctaves 3`, `stitchTiles=stitch`, saturate 0,
  `opacity 0.055`, `mix-blend-mode: overlay`, fixed over the page, jittered by a
  `steps()` transform at 6fps. The filter itself is never animated — only the
  transform.
- **Reticle.** Pointer-fine devices only: a 1px crosshair plus the pointer's
  `x/y` in mono in the corner, faded in on the first pointer move. It starts
  invisible, so a keyboard visitor never sees a mark parked at 0,0.
- **No imagery.** There are no screenshots, no portraits and no abstract art.
  The only pictures on the site are the two brand marks (`/brand/signature.svg`)
  and the icon.

---

## 2. Tokens

`src/styles/tokens.css` is the only place a colour, size, space, motion or layer
value is written. A component reads a token; it never writes a hex.

### Colour

| Token | Value | Role |
|---|---|---|
| `--rec-ground` | `#07090B` | the page ground |
| `--rec-panel` | `#0E1114` | a raised surface: inset readout, instrument panel |
| `--rec-panel-2` | `#151A1E` | the step above panel: hover, one inset row |
| `--rec-rule` | `#20262B` | hairline structure: table rows, panel edges, seams |
| `--rec-rule-strong` | `#39424A` | an active edge: underline, cap, scrollbar thumb |
| `--rec-ink` | `#F2F6F8` | primary text |
| `--rec-ink-muted` | `#8E9BA3` | secondary text only - never body |
| `--rec-signal` | `#4DD4E8` | structural accent: links, focus, active rules, marks |
| `--rec-measure` | `#F5A524` | **measured values only**: numerals, the live readout |
| `--rec-alarm` | `#FF5D5D` | exactly one use per page |
| `--rec-selection` | signal at 22% | `::selection` background |

The light theme is the same eleven roles, re-pointed: ground `#F1F2ED`, ink `#0D1013`,
signal `#1B2ED1`, measure `#9A4708`, alarm `#C81E1E`. One switching mechanism -
`data-theme` on `<html>`, seeded from the OS before first paint and persisted in
`nnl-theme`; F2 and the footer switch both write it.

The direction is **chroma × area**: the ground stays quiet and chroma is spent only on the
data, so the eye lands on the numbers. Warm measure against cold signal is deliberate
simultaneous contrast, and the alarm sits more than 45° away from the measure hue so it
never reads as a figure.

Contrast is computed from these values by `src/test/theme.test.ts` and
`tests/contrast.test.ts`, so a palette edit flows into the numbers:

| Pair | Ratio | Floor |
|---|---|---|
| ink on ground | 16.8:1 | 13 |
| muted on ground | 6.6:1 | 5.2 |
| signal on ground | 7.5:1 | 6 |
| measure on ground | 11.1:1 | 9 |
| alarm on ground | 6.5:1 | 4.5 |
| ground on signal (the cover's filled action) | 7.5:1 | 4.5 |
| ink on panel-2 | 14.8:1 | 13 |

The floors above 4.5 are the palette's own: this direction sets type small and
muted, so every role clears AA with room to spare.

### Type scale

| Token | Value | Role |
|---|---|---|
| `--rec-text-display` | `clamp(3.5rem, 13vw, 15rem)` | display, hero scale |
| `--rec-leading-display` | `0.86` | |
| `--rec-tracking-display` | `-0.02em` | |
| `--rec-text-claim` | `clamp(1.75rem, 1rem + 3.2vw, 4rem)` | a section claim |
| `--rec-leading-claim` | `0.94` | |
| `--rec-tracking-claim` | `-0.018em` | |
| `--rec-text-title` | `clamp(1.375rem, 1.1rem + 0.9vw, 1.875rem)` | a title inside a band |
| `--rec-leading-title` | `1.12` | |
| `--rec-text-body` | `1.0625rem` (17px) | running copy |
| `--rec-leading-body` | `1.6` | |
| `--rec-text-lead` | `clamp(1.0625rem, 1rem + 0.4vw, 1.3125rem)` | standfirst, lede |
| `--rec-leading-lead` | `1.45` | |
| `--rec-prose-measure` | `62ch` | the reading measure (see §8) |
| `--rec-text-data` | `0.75rem` (12px) | mono data |
| `--rec-text-data-sm` | `0.6875rem` (11px) | mono labels, ticks |
| `--rec-text-data-lg` | `0.8125rem` (13px) | mono readouts |
| `--rec-leading-data` | `1.45` | |
| `--rec-tracking-data` | `0.06em` | mono is tracked open |

### Space and frame

One 4px base: `--rec-space-1` … `--rec-space-10` = 0.25 / 0.5 / 0.75 / 1 / 1.5 /
2 / 3 / 4 / 6 / 8 rem.

| Token | Value | Role |
|---|---|---|
| `--rec-frame` | `82rem` | the one container, `margin-inline: auto` |
| `--rec-gutter` | `1.25rem` (20px) | phone gutter |
| `--rec-gutter-lg` | `3rem` (48px) | desktop gutter, from 900px |
| `--rec-band` | `4rem` | band padding on the seamed pages |
| `--rec-band-lg` | `7rem` | the same, from 900px |
| `--rec-rhythm` | `var(--rec-space-6)` (32px) | the home record's band close |
| `--rec-rhythm-lg` | `var(--rec-space-7)` (48px) | the same, from 900px |

The home record deliberately uses the smaller rhythm: its bands are separated by
a drawn seam, not by air, so the record reads as one measured column instead of a
stack of slides.

### Structure, motion, layers

| Token | Value | Role |
|---|---|---|
| `--rec-rule-w` | `1px` | every hairline |
| `--rec-header-h` | `4.5rem` | the sticky bar's height; the scroll offset is derived from it |
| `--rec-radius` | `0` | the only radius |
| `--rec-ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | the house ease |
| `--rec-dur-quick` | `140ms` | hover, colour |
| `--rec-dur-base` | `280ms` | a moving indicator |
| `--rec-z-header` | `50` | masthead |
| `--rec-z-grain` | `60` | grain overlay |
| `--rec-z-reticle` | `70` | reticle |
| `--rec-z-curtain` | `80` | route curtain |
| `--rec-z-skip` | `100` | skip link |

`@theme static` in the same file exposes the families (`--font-display`,
`--font-sans`, `--font-mono`) and aliases the legacy `--color-*` / `--text-*` /
`--spacing-*` names onto the `--rec-*` values, so the shared rules in
`src/styles/legacy.css` (`.band`, `.prose`, `.button`, `.text-action`) paint on
the recorder palette without a second hex. `static` is deliberate: those plain
CSS rules read the variables directly, so every alias has to be emitted whether
or not a utility happens to use it.

---

## 3. Typefaces — three faces, three strict roles

All self-hosted latin subsets in `public/fonts/`, `font-display: swap`, no
runtime font request on any route. Each family ships its OFL 1.1 licence beside
it.

| Role | Face | Weights | File | Where it may be used |
|---|---|---|---|---|
| Display | Instrument Serif | 400, 400 italic | `InstrumentSerif-Regular.woff2`, `InstrumentSerif-Italic.woff2` | the cover claim and section headings only |
| Text | Archivo (variable) | 100–900 | `Archivo-Variable.woff2` | all running copy, UI labels, names |
| Data | JetBrains Mono | 400–500 (one slice) | `JetBrainsMono-Regular.woff2` | numbers, units, repo names, timestamps, ticks, keycaps |

- The cover is set in Instrument Serif at `clamp(3rem, 9.5vw, 11rem)`, leading
  `0.87`, tracking `-0.02em`, hand-broken into three lines. The break is
  structure: `Payment backends / that hold up under / production load.`
- Running copy is Archivo at 17px/1.6, never wider than the reading measure.
- Mono is **true data only**. A mono row of uppercase words over a heading is an
  eyebrow, and there are none: no ALL-CAPS kicker, no `·`-joined meta string, no
  `→` appended to a link.
- Inter ships as the metric-matched body fallback (`--font-sans` order: Archivo,
  Inter, Inter Fallback, Arial, system-ui). It is not a role; it exists so a
  browser that refuses the variable font still lands on a face whose average
  advance is within ~2% of the adjusted local fallback, and the swap moves
  letterforms rather than line breaks.
- The display cut is preloaded in `index.html`; nothing else is.

---

## 4. Layout

- `.frame` is the only container: `max-width: 82rem`, 20px gutters, 48px from
  900px, centred. Everything on every route sits inside one.
- The scroll offset lives on the scrolling root:
  `scroll-padding-top: calc(var(--rec-header-h) + var(--rec-space-3))`, so a band
  link, a heading hash and focus moving into `main` all land clear of the sticky
  bar, and padding and margin cannot stack into a double gap.
- `scrollbar-gutter: stable` always reserves the gutter, so a route that grows
  past the viewport and one that does not cannot shift the frame sideways.
- Bands are separated by a **seam**: a `.frame`-wide `.rule` drawn in from the
  left the first time it enters the viewport. The home record mounts seven bands
  in reading order — cover, proof, work, atlas, forward, credentials, contact —
  and each renders its own seam.
- The cover is a two-column row from 1024px: the claim, standfirst, stack,
  former-employment line, availability and two actions on the left; the latency
  instrument as a 20-23rem right-hand panel. All three display lines start on the
  frame's left edge. The cover is content-height (about 740px at 1440) - it is
  **not** a viewport tall and the instrument column is **not** sticky: the panel
  scrolls with the page and states the measurement once.
- Hairlines carry the atlas: the six group rows run the package names as
  comma-separated runs with the tier as a word at the head of each run
  (`Daily driver`, `Production shipped`, `Working knowledge`), so the tier costs
  a word instead of a column. All 88 packages render once each; below `md` the
  table folds into one block per group.
- The work ledger on the home page is **four** featured rows; the other nine live
  on `/projects`, where all thirteen render as one column. Each row is complete on
  its own - name, the year flush on the frame's right edge, the line about the
  project, then one mono run of kind, authorship and stack - so no two rows share
  state and the scroll has no opinion about what is being read. Hover and focus
  draw one 1px signal rule sweeping the row's width while the name steps one
  space left.
- The closed `footer.colophon` is the ways-out matrix: contact (mail), GitHub,
  LinkedIn, the two documents, the source, and the one setting. One surface per
  fact — no band repeats it.

---

## 5. Motion

Motion is a measurement aid, not decoration. It runs once, it resolves to a
finished state, and every part of it has a fallback that renders that finished
state immediately.

One preference gates everything: the OS setting, `prefers-reduced-motion: reduce`,
read by `motionAllowed()` in `src/lib/motion.ts`. There is no site switch and no
stored override — the site follows the machine. `data-motion="on|off"` mirrors
that answer onto `<html>` from a pre-paint script so a reduced-motion visitor
never sees a frame of animation, and `watchMotionPreference()` re-reads it if the
OS setting changes mid-visit.

| Where | With motion | Reduced / `data-motion="off"` |
|---|---|---|
| Cover load, once per session, ~1.4s | three display lines `yPercent 110→0` (0.9s, 90ms stagger, power3.out), then copy and actions fade `y 12→0` (0.6s, 60ms stagger from 0.34s) | nothing runs; the resting DOM is the final state — no CSS-hidden start, so a JS-less page paints the finished cover |
| Instrument | bars `scaleX 0→1` (0.9s, 150ms stagger, from 0.45s); `60 s` counts 0→60 from 0.55s; `−98%` counts 0→98 from 0.95s; one sweep crosses the plot and is erased | bars drawn at final width, every value is the final text in the markup, the grid draws once, the sweep never runs |
| Band seams | hairline `scaleX 0→1` from the left, 0.7s, on first intersection | `revealRule` writes `scaleX: 1` instantly; a JS-less page paints the rule |
| Proof figures | `countUp` once on the band's first intersection, formatted per figure | final values are already in the DOM and are never written to 0 |
| Marquee | `xPercent 0→−50`, linear, 42s, repeat −1; paused on hover and on focus; the duplicate list is `aria-hidden` | the tween never starts; the track sits at 0 and the first copy is the strip |
| Work rows | CSS only: a 1px `--rec-signal` scan sweeps the row (`scaleX` from the left), metadata shifts −4px, 200–300ms | the global kill switch collapses the transition to 0.01ms; the scan still lands at full width |
| Detail-page titles and rows | masked line reveal on the claim, connector `scaleX` draws, per-row figure counts, one batched `ScrollTrigger.batch`; `fire()` is idempotent per row | no split, no tween: final text and drawn connectors at first paint |
| Route change | `RouteCurtain`: the ground panel wipes up from the bottom (240ms, `power2.in`), the router swaps at the seam, the panel carries on up and out (420ms, `power3.inOut`), brand mark riding on it | the router commits synchronously — a correct page change, not an animated one |

There is **one** route-transition code path. The curtain is the transition in
every engine; there is no native `document.startViewTransition` branch, so a
Chrome visitor and a Firefox visitor see the same seam.

The global kill switch lives in `src/styles/base.css`: both
`@media (prefers-reduced-motion: reduce)` and `html[data-motion="off"]` collapse
every animation and transition to `0.01ms` with `scroll-behavior: auto`. The
scripts read the same preference and skip the tween, so the CSS is the belt to
the script's braces.

**No pins.** There are no ScrollTrigger pins anywhere: the cover's load sequence
is the only kinetic moment, and every other band resolves in place. A pin would
hold the LCP element against the performance floor, delay the proof band by a
viewport, and put a row list under a scroll-driven authority that keyboard focus
then fights.

---

## 6. Accessibility floor

- One focus ring, site-wide: `outline: 2px solid var(--rec-signal)` at a 3px
  offset, never removed. The single exception is `#main:focus`, which receives
  focus programmatically on a route change and must not paint a ring.
- 44px targets: every header link, the author mark (both axes), the footer's
  links, `.button` and `.text-action`.
- The skip link is the first tab stop, visible when focused, and moves focus to
  `main`.
- Landmarks: one `<main id="main" tabindex="-1">`, one `<header>`, one
  `<footer>`, and on the home record seven `<section>`s, each with
  `aria-labelledby` pointing at a real heading.
- Every control has an accessible name; the author mark is an image whose
  accessible name is the full person, not a three-letter monogram.
- The route curtain is `aria-hidden` and `pointer-events: none`; it traps
  nothing, holds nothing focusable, and never locks scrolling past its 660ms.
- The mobile menu is one nav, not a second copy: Escape closes it and returns
  focus to its trigger, and the page behind it does not scroll while it is open.
- Reduced motion is a first-class path, not a fallback that merely stops a loop
  (see §5).

---

## 7. Copy rules

- **Facts come from `src/content/*` verbatim.** No figure is retyped in a
  component, and a figure that cannot be derived is dropped, never rounded.
- Voice: plain, concrete, second person in UI, first person in copy. No hype
  words, no emoji, no "blazing".
- No middle-dot meta strings, no `→` appended to a link, no ALL-CAPS eyebrow
  above a heading.
- Mono labels are lowercase data (`before`, `after`, `commits`, `repositories`,
  `published`, `retired`, `Tenure`, `Location`, `404`).
- One surface per fact. The availability sentence is stated once, on the cover.
  The documents and the two profile links belong to the footer alone. The
  contact band states how to write, and nothing else.
- The cover states the former employment in the past tense with its period
  (`Formerly a Backend Developer at Xentra Infotech Solutions Inc.` ·
  `March 2023 to May 2026` · `The company closed in May 2026.`), because the
  record must never read as a current role.
- No sentence appears on both the home record and a detail route, and no
  ten-word run of home prose reappears in the delivered copy:
  `tests/record-structure.test.tsx` enforces both.

---

## 8. Performance floor

- Transform and opacity only. `will-change` is added and removed, never left on.
- The canvas DPR is capped at 2, and the plot redraws on resize and during its
  one sweep. The hero's flow field is the only frame loop on the site: one
  `IntersectionObserver` and `document.hidden` gate it, and it tiers itself down
  (particles, then DPR) when its own 30-frame average passes 22 ms.
- No runtime font request; latin subsets only; `font-display: swap`; the display
  cut is the single preload.
- No images to decode, no third-party script, no runtime CSS-in-JS. The bundle
  is one JS chunk and one CSS file (route components are imported eagerly, on
  purpose: splitting them cost a chunk waterfall and repainted a third of the
  viewport on a navigation the visitor had already asked for).

Measured at the time of writing (`bun run build`):

| Asset | Raw | Gzip |
|---|---|---|
| `index.html` | 6.49 kB | 2.00 kB |
| `index-*.css` | 46.5 kB | 9.85 kB |
| `index-*.js` | 490.7 kB | 156.5 kB |

**The reading measure.** `--rec-prose-measure` is 62ch, and
`tests/prose-measure.test.ts` loads the built page at 1440 and fails any block of
running copy whose rendered box is wider than that measure in its own font. Note
the arithmetic: 62ch of Archivo resolves to ~84 characters per line at 17px and
~79 at 15px — above the 45–80 range the previous type setting stayed inside, so
the measure is the token, not a character count.

**Not measured here:** LCP and INP are targets (< 2.5s, < 200ms) and are not
instrumented in CI. A claim about either needs a real field or lab trace, not a
build size.

---

## 9. Not doing

- **Two grounds, one system.** Light is the same eleven roles re-pointed, not a
  theme demo, and a second palette doubles every contrast number for a reader who
  arrived to judge one page.
- **No pins.** See §5.
- **No WebGL, no shaders, no video.** The grain is one SVG filter; the plot's
  canvas draws a grid, three ticks and one sweep, and the cover's field is raw
  2D canvas — short streaks, additive on the dark ground and plain ink at a third
  of the alpha on paper, so the display type stays the loudest thing in both
  themes.
- **No fake screenshots.** No image of a dashboard that does not exist. The
  evidence is numbers, repository names and dates.
- **No contact form.** A relay form is a third party, a key and a failure mode;
  the address is a `mailto:` with the subject and opening line already written.
- **No cards.** No border-radius, no elevation, no glow. Structure is hairlines.
- **No carousel, no accordion, no tab strip, no scroll-jacking.** The marquee is
  the only loop, and it stops on hover, on focus, and when motion is off.
