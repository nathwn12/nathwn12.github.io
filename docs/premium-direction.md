# Premium direction

Grounds the rewrite so all routes converge on one quiet, editorial, proof-led
system. Replaces the prior brutalist pass. Implementation must match this file.
Where code and this file disagree, this file wins and the code is the bug.

## Ground

Audience: recruiters deciding in under a minute, and users who will actually
read the project notes. Both arrive skeptical of portfolio spectacle.

Job to be done: proof of craft. Every route must answer what was shipped, what
it changed in measurable terms, and what it was built with. Nothing here
persuades through decoration. Confidence comes from specific claims with
adjacent evidence.

Reading of the current site: content is strong (production fintech systems,
measured latency wins, verifiable credentials) but the system spends its
boldness everywhere, so no single claim lands. The rewrite spends boldness
once per page and keeps everything else quiet.

## Mode

Read mode first, operate mode second. Pages read like well-set documents:
generous measure, clear hierarchy, one entry point, linear flow. Interactive
elements (navigation, filters, terminal, expanded project views) operate like
tools: immediate, keyboard reachable, state always visible, no surprise motion.

This rules out persuade spectacle: no animated hero, no metric wall, no
scroll choreography, no playfulness that delays the first verifiable claim.

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
- Muted on Claret and Line on Claret are forbidden. Gray on color never passes.

Usage budget: Claret appears at most three times above the fold per route
(one primary action phrase, one proof marker, one active nav state). Every
other emphasis is weight or position, not color. Accent color applies to full
phrases of two or more words, never to a lone word inside a sentence.

Dark theme is a true inversion (ink ground, paper text), not a tinted overlay.
Surfaces step down from the ground in luminance only; no hue shift between
surface levels.

## Type

Two families, loaded locally, no system fallback stack as a design choice:

- Display: Fraunces, headings and page titles only. Roles: page title,
  section heading. Never body, never labels, never code.
- Body: Public Sans, everything else. Roles: body copy, supporting detail,
  navigation, form controls, code-adjacent identifiers.

Scale (all rem, base 16):

| Role | Size and leading | Weight | Use |
| --- | --- | --- | --- |
| Page title | 2.5rem, 1.1 | 600 | One per route |
| Section heading | 1.5rem, 1.25 | 600 | Major divisions |
| Subheading | 1.125rem, 1.4 | 600 | Entry titles, group names |
| Body | 1rem, 1.65 | 400 | Prose, descriptions |
| Detail | 0.875rem, 1.55 | 400 | Timestamps, metadata, tech lists |
| Label | 0.8125rem, 1.4 | 500 | Form labels, nav items, buttons, sentence case |

Labels are always sentence case, always visible next to their control or icon.
Icons are inline vector only, one stroke weight, and never carry meaning alone.

Measure: prose blocks cap at 65 to 75 characters. Code-adjacent strings
(unit names, paths, versions) set in Body family at Detail size with
letterspacing 0, distinguished by Line-bordered chips rather than a third
family.

## Layout

One column, one container, one rhythm. Container max 68ch centered, page
gutters 24px at 375px widening to 40px by 1024px. Vertical rhythm on an 8px
base: section gaps 64px, entry gaps 32px, text gaps 16px. Rules are 1px Line
color; Ink rules appear only under the page title.

Structure per route is sequence, not grid: title block, then entries in
reverse chronological or ranked order, each entry a full-width band separated
by a 1px rule. Supporting facts sit inline within the entry (timestamp,
status, tech) rather than in side cards. Nothing nests inside anything else.
Each route has exactly one primary action phrase placed at the end of the
title block.

Asymmetry resolves: the title block is left aligned with the proof marker
offset into the left gutter at wide widths; entries align to the same left
edge so the eye travels one line down the page.

Wireframes (ASCII, all routes share the container):

Landing:

```
+------------------------------------------------+
| Nav: wordmark   Experience Skills Projects     |
|         Contact                      [Cmd input]|
+================================================+
| Page title, one claim sentence                 |
| Primary action phrase (claret, full phrase)    |
+------------------------------------------------+
| Current role, employer, period, location       |
| Proof marker: one measured outcome             |
+------------------------------------------------+
| Selected work, three entries, title plus one   |
| line each with inline tech                     |
+------------------------------------------------+
| Credentials strip, four items inline           |
+------------------------------------------------+
| Footer: colophon, theme control, safe-area pad |
+------------------------------------------------+
```

Experience:

```
+------------------------------------------------+
| Page title plus one claim sentence             |
+------------------------------------------------+
| Entry band: role, employer, period             |
|   Outcome sentence with measured result        |
|   Detail: timestamp, status, tech inline       |
+------------------------------------------------+
| Entry band (repeats, reverse chronological)    |
+------------------------------------------------+
```

Skills:

```
+------------------------------------------------+
| Page title plus one claim sentence             |
+------------------------------------------------+
| Group heading, sentence case                   |
|   Package rows: name, version, one-line note   |
|   Tier stated in words per row, no color key   |
+------------------------------------------------+
| Group heading (repeats per group)              |
+------------------------------------------------+
```

Projects:

```
+------------------------------------------------+
| Page title plus one claim sentence             |
+------------------------------------------------+
| Project band: name, directory path             |
|   Two sentence outcome plus measured result    |
|   Detail: tech inline, expanded view control   |
+------------------------------------------------+
| Project band (repeats, ranked by evidence)     |
+------------------------------------------------+
```

Contact:

```
+------------------------------------------------+
| Page title plus one claim sentence             |
+------------------------------------------------+
| Address block: email link phrase, location     |
+------------------------------------------------+
| Form: labeled inputs, stacked, full width      |
|   Primary action phrase submits                |
+------------------------------------------------+
| Credentials strip, four items inline           |
+------------------------------------------------+
```

Not found:

```
+------------------------------------------------+
| Title: this page does not exist                |
| One sentence: what happened, in plain words    |
| Primary action phrase returning home           |
+------------------------------------------------+
```

## Principles

1. One bold move per page. The title block carries the page's single moment
   of character (weight, size, resolved asymmetry). Everything below it is
   quiet bands and rules.
2. Claims ship with evidence. Every outcome sentence keeps its number, scope,
   or verifier adjacent. A claim without adjacent evidence is cut.
3. Sequence over simultaneity. Reverse chronological or ranked order, full
   width bands, one after another. Position carries hierarchy so color and
   cards do not have to.
4. Operate, do not perform. Controls respond within one frame using opacity
   or color only, each with its own short duration. State changes are never
   instant and never slow enough to notice as animation.
5. Respect the reader. Reduced motion disables all nonessential movement.
   Touch targets meet 44pt. Content survives 375px to 1440px, keyboard only,
   and safe-area insets without overlap or loss.

## Adversarial review

What we challenged and what changed as a result:

- First draft kept the mono-everywhere terminal voice. Cut: it made prose
  harder to read and pushed the system toward a costume. Body is now a true
  text face; code-adjacent strings keep their character through bordered
  chips, not a third family.
- First draft used a two-accent token plan (claret plus pine). Cut to one:
  two accents split attention and invited color-coded tiers, which fail the
  no-color-alone rule. Tier is now stated in words per row.
- First draft placed a metric band in the landing title block. Cut: it was a
  hero metric wall under a new name. Proof now lives inside entries, adjacent
  to the claim it supports.
- First draft numbered entries with bare numerals. Changed: numerals appear
  only where they mark a real sequence (chronology, rank) with adjacent
  dates or rank rationale, never as decoration.
- First draft specified a shared fade and rise entrance. Replaced with
  per-element short transitions on opacity and color only, each with its own
  duration, all disabled under reduced motion.
- First draft allowed icon-only terminal affordances. Changed: every icon
  keeps a visible text label; terminal keeps its prompt string visible.

## Per-route application

Landing: title states role and domain in one sentence. One measured outcome
as the page proof marker. Three selected work entries, title plus one line
each, linking to full project bands. Primary action phrase opens contact.
Credentials strip closes the page as plain inline items with verify links
phrased as full phrases.

Experience: entries in reverse chronological order with adjacent timestamps.
Each entry carries one outcome sentence with its measured result, then tech
stated inline. No tier colors, no status dots alone; status stated in words.

Skills: groups in the existing order (backend, data, devops, security, AI
tooling, testing). Each package row states name, version, one-line note, and
tier in words (daily driver, production shipped, working knowledge).
No color key, no bars, no proficiency numerals.

Projects: bands ranked by strength of evidence. Each band holds name,
directory path, two-sentence outcome with measured result, inline tech, and
one expanded-view control with a visible label. Expanded view is inline
disclosure, not a dialog. Stats appear inside the band as labeled sentences,
never as standalone tiles.

Contact: address block first (email link phrased as a full phrase, location
in words), then the form with every input labeled above the field, then the
four verified credentials inline with verify links. Submit control is a full
phrase. Validation messages appear adjacent to their field in text.

Not found: plain title, one explanatory sentence, one primary action phrase
returning home. No terminal styling, no stack trace costume.

## Gate checklist

Run on every route before signoff:

- Contrast: Ink, Muted, and Claret pairs meet 4.5 minimum light and dark,
  verified by measured values, not by eye.
- Keyboard: full task completion without a pointer, visible focus on every
  control, no trapped focus, skip link present and working.
- Widths: no overlap or loss at 375, 768, 1024, and 1440px.
- Reduced motion: all nonessential movement off, content and state complete.
- Touch: targets meet 44pt with safe-area insets respected on mobile.
- Measure: prose lines fall within 65 to 75 characters at body size.
- Tokens: only the five named tokens in product UI, referenced semantically.
- Icons: vector only, uniform stroke, every icon paired with a visible label.
- Parity: light and dark themes carry identical content, order, and states.

## Hard-ban list with comply notes

Each banned pattern, and how this direction complies:

- Eyebrow and kicker lines: no small pre-title labels anywhere; routes open
  directly on the page title.
- Card grid as structure: entries are full-width sequenced bands with 1px
  rules, never a grid of tiles.
- Nested cards: nothing nests; chips and disclosures sit inline in the band.
- Hero metric walls: no stat band in any title block; numbers live adjacent
  to their claim inside entries.
- Bare numerals without sequence: numerals only mark real order with dates
  or rank rationale beside them.
- Lone-word accent styling: Claret applies to full phrases, never one word.
- All caps labels: all labels sentence case, including nav and buttons.
- Middot metadata: tech and facts joined by commas and words, no dot
  separators.
- Spaced dash labels: labels use colons or plain position, never dash
  framing.
- Arrows on links: link affordance is color, weight, and underline on hover;
  no arrow glyphs.
- Gradient text: no gradients on text or anywhere in product UI.
- Glass and blur decoration: no translucency layers; surfaces are solid.
- Side stripes over 1px: the only vertical accent is the 1px gutter marker
  at wide widths.
- Offset shadows: no shadows as decoration; depth shown by rules and weight.
- Ghost cards: no border-only tiles standing in for content; bands carry
  full sentences.
- AI clusters (cream with serif and terracotta; near-black with acid; hairline
  broadsheet with zero radius; tinted near-black): palette is paper, ink,
  line, muted, and claret; none of the four cluster combinations appear.
- Arial, Inter, and system default faces: Fraunces plus Public Sans only.
- Gray text on color grounds: only Paper text on Claret, verified at 9.2.
- Emoji and unicode icons: words and vector icons only.
- Raster icons: inline vector only, uniform stroke.
- Mixed families beyond two: exactly two families with fixed roles.
- Blanket fade and rise entrances: per-element short transitions, opacity
  and color only.
- Hover on every card: hover states only on true controls, designed singly.
- Bounce and elastic easing: standard ease-out curves only.
- One shared duration: each transition names its own short duration.
- Width and height animation: layout properties never animate; disclosure
  opens without dimensional tweening.
- Instant state changes: every state change carries a short transition.
- Dialog by reflex: project detail is inline disclosure; dialogs only for
  true interruptions, none specified here.
- Decorative sparklines, rings, and soft-shadow rectangles: no data
  decoration without data; stats are labeled sentences.
- Sketch-style SVG flourishes: no hand-drawn or wobbly vector decoration.
- Stripe and grid overlays: no background pattern layers; ground is flat.
