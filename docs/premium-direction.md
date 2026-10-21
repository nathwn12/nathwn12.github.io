# Broadsheet direction

The site is set as a large-format printed broadsheet in Fraunces — a
masthead, a 12-column grid, folios, heavy rules, marginalia, and one loud
move per screen. Calm where it is dense, enormous where it matters.

This document describes the system. It does not overrule code by fiat:
where this file and the code disagree, the code is what ships, and this
file is the bug — update it in the same pass as the change. (The prior
charter's supremacy clause is retired with it.)

## Ground

Audience: recruiters deciding in under a minute, and users who will
actually read the project notes.

Job to be done: proof of craft. Every route answers what was shipped,
what it changed in measurable terms, and what it was built with.

Reading of the current site: the content is strong (production fintech
systems, measured latency wins, verifiable credentials). The system now
spends its boldness the way a front page does — one enormous masthead,
one oversized folio per section, one pull quote — and keeps everything
around those moves quiet.

## Mode

Read mode first, operate mode second. Pages read like well-set documents;
interactive elements (navigation, command palette, form, expanded project
views) operate like tools: immediate, keyboard reachable, state always
visible.

Motion has intent: a line-mask reveal on the masthead (clip-path,
90ms stagger), band entrances at 0.98 → 1 scale with opacity, and the
scroll progress line. Compositor-only work except the mask wipe, which
is the reveal itself. Under `prefers-reduced-motion: reduce` everything
is static and fully visible — no timer, no loop, no entrance is gated
behind animation.

## Token plan

Five named tokens. Two themes. No other hues in product UI.

| Token | Role | Light value | Dark value |
| --- | --- | --- | --- |
| Paper | page ground | #FCFCF9 | #141310 |
| Ink | primary text and rules | #191914 | #F4F3EC |
| Line | hairlines and dividers | #DDDCCF | #2E2D26 |
| Muted | secondary text only | #55564E | #A6A69A |
| Claret | sole accent, actions and proof markers | #7A1E1E | #E8A0A0 |

Contrast pairs (verified before build, rechecked in gate):

- Ink on Paper: 16.4 light, 15.1 dark. Body, headings, rules.
- Muted on Paper: 7.1 light, 7.3 dark. Secondary text only, never under 14px.
- Paper on Claret: 9.2 light. The only text permitted on the accent ground.
- Claret on Paper: 8.1 light; dark-theme Claret on dark Paper: 7.4. Links,
  proof markers, active states.

Claret appears at most three times above the fold per route. Every other
emphasis is weight, size, or position — never color.

## Type

Two families, loaded locally: Fraunces (display) and Public Sans (body).

| Role | Size and leading | Use |
| --- | --- | --- |
| Masthead | clamp(3rem, 8vw, 7.5rem), 0.98, −0.03em tracking | site nameplate, route nameplates |
| Folio | clamp(4rem, 10vw, 12rem), 0.9 | section numerals, clipped by the margin |
| Pull quote | clamp(1.75rem, 3.5vw, 2.75rem), 1.2 | the page's single display claim |
| Printed strip | clamp(2rem, 4vw, 3.5rem), 1.1, uppercase | the full-bleed marquee band |
| Page title | 2.5rem, 1.1 | reserved — superseded by the masthead scale |
| Section heading | 1.5rem, 1.25 | band headings under the folio |
| Subheading | 1.125rem, 1.4 | entry titles, group names |
| Body | 1rem, 1.65 | prose, descriptions |
| Detail | 0.875rem, 1.55 | timestamps, metadata, tech lists |
| Label | 0.8125rem, 1.4 | form labels, nav items, buttons, sentence case |

The typing loop is the deck/standfirst under the masthead — never a
headline. Prose measure stays 60–72ch inside its own grid column.

## Layout: the sheet

One sheet container (`max-w-[80rem]`), a real 12-column grid at `lg`.
Content spans rotate per band — 7, 8, 5 — so no two consecutive bands
share a measure; the folio margin takes 2 columns and marginalia takes
the remainder. Below `lg` the grid collapses to one column and the kicker
alone carries the number — no separate inline folio renders, so the numeral
prints exactly once at narrow widths.

Heavy 3px ink bars separate major bands and sit exactly at the container
width — never viewport-bleed. 1px hairlines live only inside a band.
No rule runs under text at a different width than the text column.

Per-section furniture:

1. Masthead hero: 3px rules above and below, name at masthead scale,
   typing loop as deck, role/status/CTA in the 12-column band beneath.
2. Running head: a sticky 32px mono bar under the header —
   `NATHWN12 — <SECTION> — <FOLIO>`, tracking wide, live per route.
3. Folio numerals: 01…09 at folio scale in the margin, low opacity,
   clipped by the column edge. Each folio is derived from its own band's
   kicker (the leading number before the slash) — never a separate index,
   count, or hardcode — so the margin numeral and the kicker cannot diverge.
4. The marquee is a band: full-bleed printed strip, uppercase ink on
   cream, claret bar separators, mask and hover-hold kept.
5. One pull quote between the experience and work bands, with a claret
   rule, drawn from a real content claim.
6. Marginalia: small mono notes in the outer margin beside two or three
   entries — real facts only, hidden below `lg`.
7. Colophon footer: heavy rule above; built in <year>, the two faces,
   the stack, the source, and the route list.

Wireframe (landing):

```
+================================================================+
| wordmark   pages                         [command]             |
| NATHWN12 — SECTION — FOLIO (running head, 32px mono)           |
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
+----------------------------------------------------------------+
|        "payments outcome" (pull quote, claret rule)             |
+----------------------------------------------------------------+
| 02 | Selected work (8)                  | marginalia (2)        |
+----------------------------------------------------------------+
| 03 | System atlas (5)                   | marginalia (5)        |
+----------------------------------------------------------------+
| 04 | Forward (7)                        |                       |
+----------------------------------------------------------------+
| 05 | Credentials (8)                    |                       |
+================================================================+
| colophon footer: built <year>, faces, stack, source, routes     |
+================================================================+
```

## Routes

`/experience`, `/projects`, `/skills`, `/contact` adopt the masthead +
running head + folio system with their own asymmetric spans (8, 7, 8, 7
content columns respectively). Their content and rails survive; only the
composition changes. `/thanks` and 404 stay untouched.

## Principles

1. One loud move per screen. The masthead, the folio, the strip, the
   pull quote — each screen gets its moment; everything else is quiet.
2. Claims ship with evidence. Every outcome sentence keeps its number,
   scope, or verifier adjacent.
3. Position carries hierarchy. Asymmetric spans and rules do the work
   color and cards used to do.
4. Motion answers intent. Reveals mark arrival; the hold marks reading.
   Nothing moves for decoration, and reduced motion means static.
5. Respect the reader. Keyboard only, visible focus, 44pt targets,
   390px to 1440px with no horizontal scroll, safe-area insets honored.

## Gate checklist

Run on every route before signoff:

- Contrast: body ≥ 4.5, large ≥ 3 on the real grounds.
- Keyboard: full task completion without a pointer, visible focus, skip
  link working, palette trigger and hint intact.
- Widths: `scrollWidth == innerWidth` at 390, 768, 1280, 1440.
- Reduced motion: static and complete.
- Measure: prose lines within 60–72ch inside their grid column.
- Content: strings and factual claims verbatim; typing loop, marquee,
  atlas pulse, palette, and five routes working.
