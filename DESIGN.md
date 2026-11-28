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
  witness: "#C68E7414"
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

## V2 — the field law

The v1 arrangement below still holds for identity, palette, typefaces, stack
and constraints. V2 changes the structural layer: one field, one coordinate
line per chapter, one margin note, a second hero beat, a tier ledger, a seal,
a phone spine and one ornament. The goal remains a cold read with a margin.

## V3 — the weight law

This section supersedes the v2 chapter order below. The page is weighted by
consequence: production work first, shipped public work second, the method
third, the ask last. Four chapters carry that order, ids included:

| NN | Chapter | Id | Coordinate |
| --- | --- | --- | --- |
| 01 | Work | `work` | the engagement count |
| 02 | Open Source | `oss` | the public repositories |
| 03 | Approach | `method` | the spec steps |
| 04 | Contact | `contact` | open |

Numbers is evidence, not a chapter. Its all-time and last-30-day figures and
the per-package sparkline strip sit under the Open Source intro, and the GitHub
activity row (contributions and heat strip) closes that chapter as the public
record. Work opens with its one measured outcome, `60 seconds → under 1 second`,
parsed from the engagement's own outcome sentence, then one lede naming the
systems from the record. The commit band — 1,182 commits · 17 repos · 21
scanned — stays in Work beside the engagements. Every moved figure still
derives from `src/content/`; no claim is retyped.

Content law: no invented magnitude; flex with measured outcomes, team, tenure
and scope; estimates are rounded and marked approximate; NDA-derived aggregates
stay unnamed and unenumerated.

### Space law

One 4px scale only: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96. Proximity decides
the step: inside one group ≤16px, between groups 24–48px, between chapters
64–96px. No gap above 96px inside a chapter, except the hero's deliberate dark
bands. A gap must separate two real groups; a gap that separates nothing is
removed.

Applied through space tokens, never per-rule numerals: chapter top 64 and
bottom 48; head to first body block 32; body group to group 32; engagement row
12/16; tier rows 48 minimum with 12 padding; npm strip to ledger 48; Approach
spec rows 12; Contact statement to email 24, with the note's 32px step where it
folds below the body. The hero's dark bands, the 56–75ch measures, the 24px band
gap, the ≥44px touch targets and ≥24px between distinct text blocks all stay.
Type, chapters and copy are unchanged.

**Ink, not boxes, is the clearance bar.** Between two stacked text blocks the
ink-to-ink gap is the measure, never the box gap. Verify it by laying a
`Range` over each block's text nodes and reading `getClientRects()`: the gap
is the lower block's first rect top minus the upper block's last rect bottom.
Target ≥ 12px ink at ≥ 701px and ≥ 10px ink at ≤ 700px. The display faces
carry negative leading, so two touching boxes can put ink inside ink; a box
gap may be 0 only when the inks still clear by this bar. The Work head holds
tighter sub-bars at 1440 and 2560: coordinate→title ≥ 12px, title→consequence
≥ 16px, consequence→lede ≥ 12px. Its row gap scales with the type in vw, not a
fixed px, so the clearance survives every width.

### Fluid geometry (supersedes the 82/96/110rem field and the 32/64/96px rail)

The live law: no fixed layout sizing. Field, rail, gutter, gaps and component
widths are fluid — vw, % or ch — so the document adapts at any viewport. This
section outranks the fixed widths quoted in the field-law paragraphs below;
those numbers survive only as history. Identity, palette, type roles and
constraints are unchanged.

- `--gutter: 3vw` at every width. It is both a field's side pad and the gap
  between its tracks.
- `--index-rail: 5vw` above 700; `12vw` at <=700 to clear the phone spine,
  which sits at `6vw`. No 1600/2200 frame, gutter or rail overrides survive.
- `.field` is `width: 100%` with `padding-inline: var(--gutter)`, no max and no
  auto margin. The nav, cold beat, chapters and colophon all use that one box.
- `.hero-hud` is full width with the same gutter pad: name and status start at
  gutter + rail, role and scroll end at viewport − gutter, and the surname is
  still absolutely positioned off the full padding box.
- The chapter field keeps its twelve tracks and the `rail − gutter` first step;
  every right edge lands at viewport − gutter.
- Prose measure caps (ch), the type clamps (rem/vw), the nav height clamp and
  the 44px touch targets stay. They are not layout widths.

### One field, twelve tracks

Every full-bleed strip — nav, hero beats, chapters, footer — centres the same
`width: min(100% - 2·gutter, field)`. Inside it, twelve tracks share four named
lines: `field-start`, `measure-start`, `aside-start`, `band-start`, `field-end`.
The fixed rail track is `index-rail − gutter`, so content begins exactly at the
old rail offset (32/64/96px). Heads, bodies and margins span the field and ride
`subgrid`; gutter 24/48/64, field 82/96/110rem unchanged.

Tracks: rail col 1; measure cols 2–6; aside cols 7–8; band cols 9–12; full
cols 2–12. Data bands end flush at `field-end`; prose may end short. The nav's
mark starts at `field-start` and the ticker ends at `field-end`, so the two old
left axes become one. The footer's colophon sits at `field-start / aside-start`,
its links at `band-start / field-end`.

Deviation recorded: the source design proposed aside 3 / band 3. At 1440 a
three-column track is ~309px and the 8rem figure "35,143" needs ~363px, so
aside 2 / band 4 is the geometry that holds. No content sits outside the field.

### Coordinate line and margin note

One mono data line at measure left, above each title, exactly
`NN / LABEL / VALUE / DATE`: Work 3 ENGAGEMENTS; Open Source the account's own
public repo count from `repos.probe.json` (`16 REPOS` today, never the curated
row count); Approach 5 STEPS; Contact OPEN. Every value is derived in
`src/content/coordinates.ts` from committed data; its date is that value's
measured date — the npm snapshot (2026-11-19) for three chapters, the repo
probe date for Open Source — never a fresh date. The `NN` lights signal on the
active chapter. One margin note maximum per chapter, at aside beside the head
and folding below the body at ≤1100. The Open Source note names the committed
cron `0 */6 * * *` from `.github/workflows/open-source-stats.yml` and the curated
coverage gap (`<public> public, <rows> shown`), so the short shelf is never
read as the whole account.

Deviation recorded: the all-time npm figure stays as evidence in Open Source's
figure band while the coordinate counts repositories; it is no longer a chapter
of its own. Dates derive from each value's own snapshot; the four chapters no
longer share one date. The
Contact margin note is `contactBlock.nextStep`, printed once. Approach is
intentionally bare: its facts line below the prose already carries what a
margin note would repeat.

### Per-repository AI cards

`ai/` is the account's machine-reading shelf: one `ai/<repo>.json` and one
`ai/<repo>.md` per public, non-archived repository, plus `ai/index.json`.
Every card derives from committed snapshots — `repos.probe.json` for identity,
language and dates, `ai-summaries.json` for each repository's own one-liner,
`projects.ts` for the declared topics and npm name, and
`open-source-stats.json` for the npm counts. The generator writes only changed
files; a six-hour workflow commits them, and the build copies them to
`dist/ai/`. No card invents a figure; `ai/llms.txt` keeps the site's own summary and
carries one generated card index listing each card once.

### Two-beat hero, still-first

`#horizon` is a wrapper. Beat one is 100vh with the singularity and HUD; beat
two is 100vh with three cold-read lines at measure from existing copy. The
hero display name is `Nathaniel` over `Ladero`: one stacked block at gutter +
rail, in normal flow, with no absolute offset at any width. The still poster is
the base paint, LCP and no-JS path. The recorded loop attaches only on
`(pointer: fine)`, `(min-width: 1100px)`, reduced-motion no-preference and
`saveData` off; it has no poster, `preload="none"`, and fades in over 280ms only
while playing. The inactive master never plays.

Deviation recorded: the earlier 53% absolute surname and its 900/2200 offsets
are gone; the name is one block so the surname never detaches from the given
name. The full legal name `Nathaniel Nikolai Ladero` stays in the title,
og/twitter metadata, JSON-LD and the mailto. The phone keeps labels-only in the
top nav because four full labels and numerals do not fit 390.

### Sections

Work opens with its measured outcome as the headline and the one system lede,
then the engagement record; its `1,182` sits at band left and a hollow zero
seal at band right, the only outline figure, with `−98%` as a real text node in
its counter. Open Source carries the npm evidence first — the
monthly figure at band right, the per-package sparkline strip at measure, the
GitHub activity row at the end — then one ruled tier ledger: tier A's three
rows are whole-row links with name, claim, detail, tech, lifetime and language;
tier B's eleven rows are one mono line each with the name as the only link.
Each carries one meta cell: exact npm installs where a package exists,
otherwise language plus up to two technology tokens from the repo's own
summary. Hairlines only, no boxes. Approach places prose at measure, the
five-rule table flush right at
`aside-start / field-end`, facts and data full. Contact asks and mails at
measure; the band stays void.

### Phone spine, witness mark, motion

At ≤700 a fixed left spine carries 01–04 with a 44px tap height at 24px from
the left edge, and `--index-rail` becomes 44px. It is the only persistent phone
chrome. The witness is one inline SVG with five hairline rings in two
counter-rotating groups, 240s linear, at the 8% `--witness` tint; it sits behind
beat one, beat two, Contact and the footer and stills under reduced motion.
The cold read reveals once over 280ms on first intersection; the coordinate
line fades over 140ms on first activation. Nothing else loops.

Deviation recorded: the witness is inline rather than a separate SVG asset so
the stamp stays a real text node and the ring groups can rotate independently.

### V2 constraints

Field law is normative: no component may place content outside the twelve
tracks. Every chapter has exactly one coordinate line and at most one margin
note. The zero seal is the only permitted outline figure; the witness is the
only non-video perpetual motion; the still is the hero's base path and the
video is a premium. The phone spine is the phone's only chrome. Reduced motion
is a complete static document. V1's rules below remain in force where they do
not conflict with this section.

## Idea

An event-horizon ledger: grand by figure, exact by ledger. The hero holds
one full-viewport stellar singularity on true black — a recorded seamless
loop, rendered by the optical renderer that draws it, decoded as video, no
runtime shader cost. Beneath it the career is a deep-field catalog: the
record as resolved figures, sparklines and ruled rows, chapters as
constellations, one burnt-orange accent marking the live signal, the sky's
deep-field material as art direction. The singularity is the awe; the
ledger is the truth.

It refuses wallpaper nebulae behind text, cropped focal heroes, boxed panels
and plates, second navigations, and decoration where the record should
speak.

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
| --- | --- | --- |
| Display | Libre Bodoni (variable 400–700) | the name, the statement, chapter titles |
| Text | Newsreader (variable, opsz 6–72) | running copy, row descriptions, prose columns |
| Data | IBM Plex Mono (400–600) | all figures, catalog labels, coordinates, meta |

No sans-serif anywhere: the catalog is set entirely in serif and mono.
Figures are tabular and aligned on the decimal; units stay with the number.
The measure is 56ch; a full-bleed paragraph is never set. Newsreader runs at
text optical sizes; display scale only through the display role.

## Space

One masthead: the author mark at width 120 once — the glyph variant
`public/brand/signature-glyph.svg`, surgically derived from the canonical
tiled `signature.svg` by removing the ground tile and tightening the
viewBox to the glyph, with the strokes untouched; the canonical tiled file
stays in the brand kit. The owned mark keeps its own file, format and
palette; site tokens bind site surfaces, never the brand mark. The site
renders it as a quiet imprint at 0.6 opacity — a CSS treatment only; the
SVG file is untouched. Then the four chapter links on one hairline — the
constellation line; the active chapter carries the signal tint. The hero is one full-viewport singularity — a recorded loop
with its plate content in the corners. Chapters alternate dense catalog
blocks — figures, sparklines,
ruled rows — with open register rows; hairline rules separate rows, never
boxes. Rhythm: dense, open, dense; never four equal bands.

One system, four arrangements: 2560x1440 is the primary canvas — the sky
spans edge to edge, the content field widens with the viewport (82rem on
desktop, up to 110rem at native 1440p), and display scale is tuned at
native. All four chapters share that field, an index rail, one type scale,
hairline rules and the same padding rhythm; only the inner arrangement
changes. 390-430 keeps compact art direction — condensed numeral navigation
on one hairline, stacked catalog rows, touch-first targets. Never a squeezed
desktop, never four unrelated blocks.

## Motion

One kinetic moment: the hero's recorded loop. It plays while on screen and
the tab is visible, pauses offscreen and on a hidden tab, and under
`prefers-reduced-motion: reduce` yields to its settled still — a complete
static document, nothing hidden, nothing inert. Everything else is state
motion only: hover hairlines, focus rings, the 140/280ms tokens. Native
scroll; no interception, no snap, no scroll-driven choreography.

## Rules

- The void is the only ground; no panel, plate, card or fill behind text; a
  hairline is a rule, not a box. Every chapter is one system: a shared content
  field and index rail, one type scale, the same rhythm. Open Source carries
  the ruled data bands — the npm evidence and the repository ledger; its three
  featured entries are a three-column band with a top hairline and vertical
  separators, never boxed cards.
- Each tier-B row's one meta cell is installs when a package exists, otherwise
  language plus up to two verbatim technology tokens from the repo's own
  summary, capped at two, never a placeholder.
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
