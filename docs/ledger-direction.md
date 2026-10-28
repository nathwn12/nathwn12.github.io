# The Ledger — direction lock and suspension ledger

Date: 2026-10-28. Status: **living direction**; supersedes
`docs/premium-direction.md` and the historical `DESIGN.md` as the description of
what ships. This file is not a build gate: the code is what ships, and where this
file and `src/` disagree, this file is the bug.

## Objective (one falsifiable sentence)

The production site, rebuilt in React + Vite, renders the owner-approved Ledger
design — five named bands on `/`, the nine-entry record on `/record`, the eleven
projects on `/work` — with every fact unchanged, all old URLs redirected, and no
horizontal overflow at 390, 768 or 1440.

## The decision, and what it replaces

The owner saw the single-file prototype at
`%TEMP%\opencode\design-review\proto\index.html` and approved it explicitly. This
pass implements that direction; it does not choose one. The alternatives
considered and rejected are recorded in that prototype's `DIRECTION.md`
§ "What I deliberately rejected from the current design" and § "The cost". The
strongest objection that lost is the cost stated there: a type-only page has no
photographs and the green cover reads as money before the copy corrects it. That
trade is accepted.

Exploration budget for this pass: **0 new directions**. The direction was
selected and approved upstream; spending budget on a second comparison here would
be proposal theatre. The budget is spent on fidelity and on the three fact-floor
corrections below.

## Suspended artifacts (what no longer binds)

| Path | What it required | Why it no longer binds |
| --- | --- | --- |
| `docs/premium-direction.md` (whole file) | Broadsheet: masthead, 12-col grid, folios, marginalia, command palette, expanded project views, per-route accents, dark theme | Superseded by the owner-approved Ledger direction. Kept as the record of the prior system, not as instruction. |
| `DESIGN.md` (whole file) | Brutalist ink/paper system, one signal-orange accent, zero radius, film grain | Already historical; now also superseded as a description of the live UI. |
| `src/index.css` token layer (`--color-*`, `--text-*`, `--sheet-gutter`, grain underlay) | Warm paper/ink palette, Inter + Newsreader, radius scale, theme blocks | Replaced by the Ledger's field palette and five-size scale. |
| `src/components/CommandPalette.tsx` | Control-K palette, slash entry, five page items, actions | Dropped: a UI to learn before a CV can be read. |
| `src/components/PageFoot.tsx`, `src/lib/keyboardNav.ts` | Prev/next pager, arrow-key page tour, scroll-stepping | Dropped: navigation is the three header links; the document scrolls normally. |
| `src/components/Hero.tsx` typing loop + `hero-typing`/`hero-ticker` | Rotating typed headline and infinite tech marquee | Dropped: the strongest sentence held hostage to an animation; the stack as texture. |
| `src/components/InstrumentBand.tsx` folios, `folio-numbering` | Per-section folio numerals, kickers, 3px rules | Dropped: costume instrumentation. |
| `src/components/Contact.tsx` Web3Forms relay + `/thanks` | Relay form, validation, confirmation route, `src/content/contact.ts` | Dropped: a relay between a recruiter and a one-line email; no server at runtime. Contact is mailto plus the two documents. |
| `src/components/Skills.tsx` five-route atlas, `src/content/skills.ts` | Five-route skills atlas page over 88 packages | The atlas does not bind; the 88 packages now render as a band on `/record`, so the content file is in use. |
| `src/components/ForwardBand.tsx`, `src/content/forward.ts` | Forward section on the landing | Dropped from the site; stays in the CV. The content file stays (unused). |
| `src/lib/theme.ts`, pre-paint theme script, dark palette | Light/dark theme pin, F2 toggle, OS following | Dropped: the approved direction is a printed sheet in fixed inks and defines no dark field pair. No OS theme toggle remains. |
| `src/lib/motionPreference.ts` | One always-animated intent; reduced motion deliberately ignored | Reversed by the brief: the site honours `prefers-reduced-motion` again, and every animation has a finished reduced state. |

The contact relay is a deliberate override, not drift: the form stays retired —
mailto plus the two documents — because the approved design has no form and the
Web3Forms key was never meant as a public runtime dependency.

Retirement is explicit: the two design documents above carry a superseded banner
pointing here, the removed components and their tests are deleted in this pass,
and no stylesheet rule from the old system remains.

## Immutable floor (restated verbatim for this pass)

- **Facts and claims.** Employer, dates, metrics, credentials, education,
  affiliations, and every claim about the owner's record stay exactly as they are
  in `src/content/**`. No fact is renamed, softened, re-dated, or invented.
  - Correction 1: the unconfirmed availability claim "Open to remote backend
    roles." is removed. The replacement is "Open to backend roles." everywhere it
    appears, and `public/llms.txt` carries the same claim.
  - Correction 2: every emitted muted-on-field pair is measured; body-size text
    below 4.5:1 is darkened until it passes.
  - Correction 3: Forward stays absent from the site; its content file remains
    on disk, unused. Skills was corrected the other way: the 88 packages render
    as a band on `/record`.
- **Custody and secrets.** No secret value is read, written, or moved. No new
  network endpoint is introduced.
- **Destructive/irreversible acts.** None in this pass: no commit, push, merge,
  tag, or deploy.
- **Accessibility floor.** Semantics, keyboard operability, visible focus, AA
  contrast, and reduced motion are not negotiable.
- **Performance floor.** The build must pass; no new runtime dependency; the
  font is self-hosted, preloaded, `font-display: optional`, and CLS is 0.
- **Verification independence.** This pass may not certify its own visual result;
  the author's screenshots are evidence, not the verdict.

## Named deltas and acceptance thresholds

| Delta | Threshold | Reader justification |
| --- | --- | --- |
| Home is one statement, not a locked viewport | Five bands in the approved order at 1440 and 390; document height 4.5–7.5 screens at 1440 | The argument fits under 800 words and no section exceeds two screens; a recruiter can read it as one document. |
| One typographic voice | No second webfont loads; every prose/heading/control element computes Newsreader; the single inline-code token uses the system mono as the prototype does | A serif for a backend engineer argues judgement over time, not a terminal. |
| Fixed field palette | No per-section hue; every emitted body-size text pair ≥ 4.5:1 and every UI pair ≥ 3:1 | The palette is a field and an action, not a code. |
| New IA | 3 routes `/`, `/record`, `/work`; 3 header destinations; five old 200-URLs redirect with meta refresh + canonical | No existing link dies; no UI to learn before a CV can be read. |
| Mobile measure | Body text averages 38–52 characters per line at 390 | Below ~38 the text reads as a ribbon; above ~52 the eye loses the next line on a phone. |
| No sideways scroll | `scrollWidth === innerWidth` at 390, 768 and 1440 | A horizontal scrollbar on a phone is a broken page. |
| Motion is a signature, not a gate | The masked name rise, section reveals, once-printed commit field, and route fade all resolve to the finished state under `prefers-reduced-motion` | Motion is a preference; the content is never hidden. |
| No CLS | Measured CLS 0 at 1440 and 390 with the font preloaded and `optional` | The page must not move under the reader. |

## Implementation record

Filled after the build: measurements, screenshots, and the contrast table live in
the pass report, not in this direction file.
