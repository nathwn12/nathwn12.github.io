# Broadsheet direction

The site is set as a large-format printed broadsheet in Newsreader — a
masthead, a 12-column grid, folios, heavy rules, marginalia, and one loud
move per screen. Calm where it is dense, enormous where it matters.

Living snapshot of the current UI, as of 2026-10-24. It is not a frozen
spec and not an approval gate: personal design is never permanently
locked, and a newer explicit owner direction supersedes any line here
without ceremony. Where this file and the code disagree, the code is what
ships and this file is the bug — update it in the same pass as the change.
(The prior charter's supremacy clause is retired with it.)

## Ground

Audience: recruiters deciding in under a minute, and users who will
actually read the project notes.

Job to be done: proof of craft. Every route answers what was shipped,
what it changed in measurable terms, and what it was built with.

Reading of the current site: the content is strong (production fintech
systems, measured latency wins, verifiable credentials). The system now
spends its boldness the way a front page does — one enormous masthead,
one oversized folio per section — and keeps everything around those moves
quiet.

## Mode

Read mode first, operate mode second. Pages read like well-set documents;
interactive elements (navigation, command palette, form, expanded project
views) operate like tools: immediate, keyboard reachable, state always
visible.

Motion has intent: a line-mask reveal on the masthead (clip-path,
90ms stagger), band entrances at 0.98 → 1 scale with opacity, and the
scroll progress line. Compositor-only work except the mask wipe, which
is the reveal itself. No entrance is gated behind animation — content is
visible by default. The OS `prefers-reduced-motion` query no longer gates
the site (owner order 2026-10-14): `src/lib/motionPreference.ts` pins one
always-animated intent, `<MotionConfig>` is `never`, and every in-tree gate
reads `false`. The one `prefers-reduced-motion` rule left in `src/index.css`
only clears the masthead mask's clip-path, transform, and opacity as a
safety net; it is not a site-wide static mode.

## Token plan

Five named tokens. Two themes. No other hues in product UI. Values below are
`src/index.css` as of 2026-10-24; names are frozen, values are not.

| Token | Role | Light `:root` | Dark `html[data-theme="dark"]` |
| --- | --- | --- | --- |
| Paper | page ground (dark: warm ink ground) | #FAF6EC | #14120F |
| Ink | primary text and rules | #191914 | #F4F0E5 |
| Line | hairlines and dividers | #8B8577 | #6D6757 |
| Muted | secondary text only, never below 14px | #4E4C43 | #B5AE9D |
| Claret | sole accent, actions and proof markers | #7A1E1E | #E9A38E |

The dark theme is a true inversion: the light ground becomes the dark text,
and the dark ground is a warm near-black, not pure black. `--color-surface`
and `--color-surface-2` are not a sixth token — they step the ground in
luminance only (#F2ECDE / #E9E2D1 light, #1D1A16 / #26221C dark).

Contrast pairs, as measured in source (rechecked in the checks below):

- Ink on Paper: 16.3 light, 16.4 dark. Body, headings, rules.
- Muted on Paper: 8.0 light, 8.5 dark. Secondary text only, never under 14px.
- Claret on Paper: 9.6 light; dark Claret on the dark ground: 9.0. Links,
  proof markers, active states.
- Paper on Claret: 9.6. The only text permitted on the accent ground.
- Line on Paper: 3.4 light, 3.3 dark. Hairlines and dividers (UI, 3:1 floor).

Claret appears at most three times above the fold per route. Every other
emphasis is weight, size, or position — never color.

## Type

Two families, both local and OFL 1.1: Newsreader (display — page titles and
section headings only, never body, labels, or code; variable weight 300–700
with an optical-size axis 6–72) and Inter (body — everything else including
navigation and controls; variable weight 400–700). Both WOFF2s and their
licences ship in `public/fonts` and are preloaded from `index.html`; there is
no remote font request and no package dependency. `--font-mono` is an alias
of Inter, not a third face.

| Role | Size and leading | Use |
| --- | --- | --- |
| Masthead | clamp(3rem, 8vw, 7.5rem), 0.98, −0.02em tracking | site nameplate |
| Route title | clamp(2.5rem, 6vw, 4.75rem), 0.98, −0.025em | inner-route nameplate, one per route |
| Folio | clamp(4rem, 10vw, 12rem), 0.9 | section numerals, clipped by the margin |
| Printed strip | clamp(2rem, 4vw, 3.5rem), 1.1, uppercase | the full-bleed marquee band |
| Page title | 2.75rem, 1.06 | `--text-display`, reserved — the masthead carries the scale |
| Section heading | 1.75rem, 1.18 | band headings under the folio |
| Subheading | 1.25rem, 1.55 | route and band intros |
| Entry title | 1.125rem, 1.35 | entry titles, group names |
| Body | 1rem, 1.7 | prose, descriptions |
| Detail | 0.875rem, 1.55 | timestamps, metadata, tech lists |
| Label | 0.875rem, 1.4 | form labels, nav items, buttons, sentence case |
| Micro | 0.8125rem, 1.4 | uppercase micro-labels, running head, marginalia — the 13px floor |

Below `lg` the masthead clamp drops to `clamp(2.5rem, 8vw, 7.5rem)` so three
lines of the name cannot push the printed strip off the first screen.

The typing loop is the deck/standfirst under the masthead — never a
headline. Prose measure stays 60–72ch inside its own grid column.

Muted text is never set below 14px, with one recorded exception: the
colophon sentence in `PageFoot.tsx` is 12px `text-text-muted` on purpose —
the owner asked for it demoted, with its wording retained, so it reads as an
imprint rather than body copy. That is the only 12px muted copy; it is not a
licence to set secondary text at 12px elsewhere.

## Layout: the sheet

One sheet container (`max-w-[80rem]`), a real 12-column grid at `lg`.
Content spans rotate per band — 7, 8, 5 — so no two consecutive bands
share a measure; the folio margin takes 2 columns and marginalia takes
the remainder. Below `lg` the grid collapses to one column and the kicker
alone carries the number — no separate inline folio renders, so the numeral
prints exactly once at narrow widths.

Each band opens on a 1px ink hairline at exactly the container width —
never viewport-bleed — so consecutive bands read as one sheet instead of
competing bars. The 3px ink bars stay frame and edge marks only: masthead
top and under-name, the printed strip's edges, route nameplates, and the
end-of-page foot. They are never repeated as section dividers. 1px
hairlines also carry in-band furniture, such as the rule under a heading.
No rule runs under text at a different width than the text column.

Per-section furniture:

1. Masthead hero: 3px rules above and below, name at masthead scale,
   typing loop as deck, role/status/CTA in the 12-column band beneath.
2. Running head: a 32px bar inside the fixed header, under the nav row —
   `<SECTION> — <FOLIO>` in Inter micro caps, 0.18em tracking, live per
   route. Static chrome, no motion.
3. Folio numerals: 01…09 at folio scale in the margin, low opacity,
   clipped by the column edge. Each folio is derived from its own band's
   kicker (the leading number before the slash) — never a separate index,
   count, or hardcode — so the margin numeral and the kicker cannot diverge.
4. The marquee is a band: full-bleed printed strip, uppercase ink on
   cream, claret bar separators, mask and hover-hold kept.
5. The experience band closes on the API-contract outcome sentence as
   ordinary body copy: body size at the band's 65ch measure, in the band's
   own prose column (columns 3–9). No display size, no rule, no accent.
6. Marginalia: small Inter micro notes in the outer margin beside two or
   three entries — real facts only, hidden below `lg`.
7. End-of-page band (`PageFoot`, inside the page measure): a 1px Line rule
   above, then one row — the résumé download on the left, the Previous/Next
   adjacent-page pager on the right. Below it the colophon sentence:
   “Colophon — © <year> Nathaniel Nikolai Ladero. Set in Newsreader and
   Inter.” and its source link. The persistent `Footer` is separate chrome: a
   3px ink rule above one row — © NNL, then Email, GitHub, LinkedIn, and the
   theme control. Page destinations live in the header and the pager; the
   footer never repeats them.

Wireframe (landing):

```
+================================================================+
| wordmark   pages                         [command]             |
| SECTION — FOLIO (running head, 32px micro caps)                |
+================================================================+
| 3px rule                                                       |
| dateline                                                       |
| NATHANIEL NIKOLAI                                              |
| LADERO                          (masthead, clamp to 7.5rem)    |
| 3px rule                                                       |
| deck: the typing loop as standfirst                            |
| role/status/CTA (7 cols) | profile readings (5 cols)            |
+================================================================+
| THE PRINTED STRIP — FULL-BLEED, UPPERCASE, CLARET BARS         |
+================================================================+
| 01 | Backend experience (7)              | marginalia (3)        |
|    |   closing claim: body copy, no rule or accent              |
+----------------------------------------------------------------+
| 02 | Selected work (8)                  | marginalia (2)        |
+----------------------------------------------------------------+
| 03 | System atlas (5)                   | marginalia (5)        |
+----------------------------------------------------------------+
| 04 | Forward (7)                        |                       |
+----------------------------------------------------------------+
| 05 | Credentials (8)                    |                       |
+================================================================+
| chrome footer: © NNL · Email · GitHub · LinkedIn · theme        |
+================================================================+
```

## Routes

`/experience`, `/projects`, `/skills`, `/contact` adopt the masthead +
running head + folio system with their own asymmetric spans (8, 7, 8, 7
content columns respectively). Their content and rails survive; only the
composition changes. `/thanks` and 404 stay untouched.

## Principles

1. One loud move per screen. The masthead, the folio, the strip — each
   screen gets its moment; everything else is quiet.
2. Claims ship with evidence. Every outcome sentence keeps its number,
   scope, or verifier adjacent.
3. Position carries hierarchy. Asymmetric spans and rules do the work
   color and cards used to do.
4. Motion answers intent. Reveals mark arrival; the hold marks reading.
   Nothing moves for decoration, and no entrance gates visibility.
5. Respect the reader. Keyboard only, visible focus, 44pt targets,
   390px to 1440px with no horizontal scroll, safe-area insets honored.

## Checks run on each change

Working checks, not an approval gate — the owner may change direction at any
time, and every check is re-derived from the code rather than from this file.

Run on each affected route:

- Contrast: body ≥ 4.5, large ≥ 3 on the real grounds.
- Keyboard: full task completion without a pointer, visible focus, skip
  link working, palette trigger and hint intact.
- Widths: `scrollWidth == innerWidth` at 390, 768, 1280, 1440.
- Motion: entrances never gate visibility; nothing loops.
- Measure: prose lines within 60–72ch inside their grid column.
- Content: strings and factual claims verbatim; typing loop, marquee,
  atlas pulse, palette, and five routes working.
