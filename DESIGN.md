# DESIGN.md — brutalist system for nathwn12-portfolio

Single source of truth for the ultra-minimalist / brutalist restyle. The token
layer in `src/index.css` implements exactly what is written here; if the two
disagree, this file wins and `index.css` is the bug.

Scope of this document: palette, type scale, spacing scale, radius scale,
border rule, motion policy, the banned-pattern list, and the content contract.
It is a **system** spec — not a component inventory. Component-level rewrites
belong to later passes and must obey every rule below.

Sources (treated as data, cited inline as `[S1]`…`[S4]`):

| Tag | Source | What we take from it |
| --- | --- | --- |
| `[S1]` | impeccable.style/slop catalog (Paul Bakaus, `pbakaus/impeccable`) | The "AI slop" and "Quality" pattern names, the `DESIGN.md` design-system check, and the detector's naming of each tell |
| `[S2]` | github.com/funboy322/avoid-ai-design (`references/ai-tells-catalog.md`) | The T1–T5 / C1–C6 / L1–L8 / K1–K9 / S1 / M1–M3 / I1–I3 / CP1–CP3 / IM1–IM4 catalog and the **P0 / P1 / P2** severity tiers |
| `[S3]` | github.com/LeoStehlik/no-slop-ui (`references/banned-patterns.md` + `examples/review-checklist.md`) | The hard-ban table and the PASS / REVISE / ESCALATE review verdict |
| `[S4]` | Brainy Papers, "Confident vs lazy brutalism" (as summarised in the brief) | The four confident-brutalist moves: tight grid · one accent used in exactly 3 places · designed hover/focus states · asymmetry that resolves |

---

## 1. Direction

**Committed move:** ink and paper, one signal-orange accent, 1px rules, a tight
4px grid, zero radius, and type that is legible at 10px instead of decorative
at 60px. Restraint is the design decision — per `[S2]`, "a confident, intentional
design that happens to be minimal is not 'timid'. Restraint executed well is a
decision. Reward it."

**Anti-goal:** "lazy brutalism" `[S4]` — thick borders as a costume, no grid,
decoration standing in for hierarchy, motion for its own sake.

---

## 2. Palette

Three neutrals (ink / paper / concrete) plus **exactly one accent**. No second
hue, no gradient, no glow.

### 2.1 Roles

| Role | Light (`:root`, default) | Dark (`[data-theme="dark"]`) |
| --- | --- | --- |
| **paper** — page ground | `--color-bg` `#fbfbfa` | `--color-bg` `#0e0e0d` (ink ground) |
| **ink** — text + structural rule | `--color-text` `#111110`, `--color-border-accent` `#111110` | `--color-text` `#f2f2ef`, `--color-border-accent` `#edede8` |
| **concrete** — muted text, hairline | `--color-text-muted` `#57574f`, `--color-border` `#c9c9c3` | `--color-text-muted` `#a3a39c`, `--color-border` `#2c2c29` |
| **accent** — one hue, signal orange | `--color-accent` `#e03c00` | `--color-accent` `#ff4d00` |

`paper` is a neutral off-white with ~1% warm cast, not a cream/beige default;
it is chosen with its ink and concrete counterparts as a documented system,
which is the exemption `[S1]`'s "Cream / beige palette" rule carves out
("Keep them when they belong to the product"). It exists to serve the "paper"
half of a brutalist ink/paper pair, and every value is contrast-verified in §7.
The ground was brightened from `#f2f2ef` to `#fbfbfa` (with `--color-surface`
and `--color-surface-2` lifted in step) because the original paper read grey,
not white; the warm cast, the layered order, and every threshold in §7 are
unchanged by the move — each pair's ratio rose.

### 2.2 Token name → value table (the whole token layer)

Every name below is **frozen** (§8). Values are the brutalist palette.

| Token | Light (`:root`) | Dark (`[data-theme="dark"]`) | Used for |
| --- | --- | --- | --- |
| `--color-bg` | `#fbfbfa` | `#0e0e0d` | page ground |
| `--color-surface` | `#f4f4f1` | `#171716` | one raised step |
| `--color-surface-2` | `#ebebe7` | `#1f1f1d` | two raised steps |
| `--color-border` | `#c9c9c3` | `#2c2c29` | concrete hairline (inner separation) |
| `--color-border-accent` | `#111110` | `#edede8` | ink/paper structural rule (see §6) |
| `--color-text` | `#111110` | `#f2f2ef` | body + headings |
| `--color-text-dim` | `#3d3d39` | `#c9c9c3` | secondary text |
| `--color-text-muted` | `#57574f` | `#a3a39c` | tertiary/labels — AA in both themes |
| `--color-accent` | `#e03c00` | `#ff4d00` | the one accent (rules, fills, focus ring) |
| `--color-accent-2` | `#e03c00` | `#ff4d00` | **alias of accent** |
| `--color-accent-3` | `#e03c00` | `#ff4d00` | **alias of accent** |
| `--color-accent-4` | `#e03c00` | `#ff4d00` | **alias of accent** |
| `--color-accent-text` | `#b02f00` | `#ff6a2b` | accent as text (≥4.5:1) |
| `--color-accent-2-text` | `#b02f00` | `#ff6a2b` | alias of `--color-accent-text` |
| `--color-accent-3-text` | `#b02f00` | `#ff6a2b` | alias of `--color-accent-text` |
| `--color-accent-4-text` | `#b02f00` | `#ff6a2b` | alias of `--color-accent-text` |
| `--color-accent-glow` | `rgba(224, 60, 0, 0)` | `rgba(255, 77, 0, 0)` | **alpha 0** — glow banned (`[S1]`, `[S2] C5`, `[S3]`) |
| `--color-grid-line` | `rgba(0, 0, 0, 0)` | `rgba(255, 255, 255, 0)` | **alpha 0** — decorative grid banned (`[S1]`) |
| `--color-selection` | `rgba(224, 60, 0, 0.18)` | `rgba(255, 77, 0, 0.22)` | `::selection` background |
| `--font-mono` | `'Hack', 'Cascadia Mono', 'IBM Plex Mono', monospace` | same | the only typeface |

### 2.3 One accent, three places

`[S4]`: one accent, used in exactly **three** places on any given screen. The
accent is a punctuation mark, not a theme. The three sanctioned roles:

1. **The active cue** — the current route/section indicator and the current
   focus ring (`:focus-visible`).
2. **The primary action** — the one control that advances the page (submit,
   primary `cd`).
3. **One live data glyph** — at most one number/state per view (e.g. the
   monotonic counter or the active row's rule).

Anything else that wants color gets **ink or concrete**. If a fourth accent
usage appears on one screen, one of the first three is wrong — cut it.

> **Consequence to manage in the component pass.** `--color-accent-2/3/4` are
> aliases, so the old per-section color-coding (Experience cyan, Skills orange,
> Projects purple) and the `[ERROR]` tone in `Contact.tsx` collapse to the same
> orange. Tone is now carried by the string and the border, not by hue: an
> error state must read as ink + `[ERROR]` + a `--border-width-rule` rule, never
> as "a different color". The aliases exist so `projects.ts` and the token→class
> maps keep rendering while the palette reads as one accent.

---

## 3. Type scale

One family (`--font-mono`, Hack/Cascadia/IBM Plex Mono). Monospace is the
product's voice, not a garnish; no second face, no italic-serif accent word
(`[S2] T3`) and no mixed serif/sans (`[S3]`).

| Token | Size | Line-height | Role |
| --- | --- | --- | --- |
| `--text-micro` | 10px / `0.625rem` | 1.4 | hard floor — nothing ships smaller |
| `--text-label` | 11px / `0.6875rem` | 1.4 | uppercase micro-labels (short only) |
| `--text-body` | 13px / `0.8125rem` | 1.5 | default body |
| `--text-body-lg` | 14px / `0.875rem` | 1.5 | lead-in body |
| `--text-lead` | 16px / `1rem` | 1.6 | hero subhead (readable floor per `[S1]` "Tiny body text") |
| `--text-title` | 20px / `1.25rem` | 1.3 | section titles |
| `--text-headline` | 24px / `1.5rem` | 1.2 | page h1 |
| `--text-display` | 40px / `2.5rem` | 1.1 | **ceiling.** Display type exists but must not fill a screen (`[S1]` "Oversized hero headline", `[S2]` L1) |

Rules:

- **Letter-spacing.** Body text sits at the font's default spacing; wide
  tracking (≥`0.2em`) is allowed only on ≤`--text-label` uppercase labels, and
  crushed/negative tracking is banned outright (`[S1]` "Crushed letter spacing",
  "Wide letter spacing on body text").
- **Hierarchy is size + weight + space**, never color alone; a flat hierarchy
  where heading and body look alike is a defect (`[S1]` "Flat type hierarchy").
- **Uppercase is a label treatment**, never a paragraph treatment (`[S1]`
  "All-caps body text").
- Micro-labels are not eyebrows: see the banned list §9 (`[S1]` "Label above a
  heading", `[S2]` T5, `[S3]`).

## 4. Spacing scale

Tight grid `[S4]`. Every gap is a multiple of 4px; the named steps are the only
sanctioned ones.

| Token | Value | Role |
| --- | --- | --- |
| `--spacing-hairline` | `1px` | rule-adjacent optical gaps |
| `--spacing-quarter` | `0.25rem` / 4px | grid unit |
| `--spacing-half` | `0.5rem` / 8px | inside a row |
| `--spacing-gutter` | `1rem` / 16px | page gutter, cell padding |
| `--spacing-block` | `1.5rem` / 24px | between rows in a block |
| `--spacing-section` | `3rem` / 48px | between sections |
| `--spacing-page` | `4.5rem` / 72px | above/below a page's content |

Rhythm is deliberate, not uniform: related things sit at `--spacing-half`,
unrelated groups at `--spacing-section`. Equal gaps everywhere is
**monotonous spacing** (`[S1]`, `[S2] S1`) and is banned. Cramped padding
(text against a container edge) and dead space used "to look expensive" are
both banned (`[S1]` "Cramped padding", `[S3]`).

## 5. Radius scale: zero

**`--radius-*` = `0px`, without exception.** `--radius-xs|sm|md|lg|xl|2xl|3xl|4xl`
and the semantic `--radius-none` all resolve to zero. They live in a
`@theme static` block so Tailwind emits them even while unused — a later
`rounded-*` class cannot resurrect a curve. Sharp corners are the system (`[S2] K8`: "sharp (0) for brutalist"; `[S3]`: pill buttons and large
card radius banned; `[S1]` "Extreme border-radius on cards").

The single carve-out: Tailwind's static `rounded-full` still rounds, and is
reserved for **1–2px indicator dots only** (status/traffic dots and cursor
glyphs). It must never appear on a card, button, badge, chip, input, or panel.
Replacing those dots with square marks is a scheduled follow-up (§10).

## 6. Border rule

**One rule system, in ink or paper, at 1px — never a decorative stripe.**

| Width token | Value | Use |
| --- | --- | --- |
| `--border-width-hairline` | `1px` | the default border: every divider, cell edge, control outline |
| `--border-width-rule` | `2px` | one emphasis per view: the active row, the primary action |
| `--border-width-heavy` | `4px` | reserved for page-scale framing |

Rules:

- Borders are **structural**: they express table/list structure, focus, or the
  active item. `--color-border` (concrete) is for inner separation;
  `--color-border-accent` (ink in light, paper in dark) is the hard rule.
- **No colored side/top stripe** on a card (`[S2] K4`, `[S1]` "Side-tab accent
  border"), and specifically **no accent border on a rounded element** (`[S1]`
  "Border accent on rounded element") — moot at radius 0, and still banned if
  radius ever returns.
- **No border + wide shadow on the same surface**: pick the edge or the shadow
  (`[S1]` "Hairline border with wide shadow"). Shadows are not part of this
  system; the edge is.
- **No gradient borders**, no repeating-gradient stripes (`[S1]`, `[S3]`).
- Borders never decorate; if a rule is not separating content, indicating
  state, or framing the page, it is deleted.

## 7. Contrast evidence

Measured with WCAG 2.1 relative-luminance math against `--color-bg` (bg),
`--color-surface` (s), `--color-surface-2` (s2). Body threshold **4.5:1**,
UI/graphic threshold **3:1**. Ratios below are for the brightened light paper
(`#fbfbfa` / `#f4f4f1` / `#ebebe7`, §2.2); the dark rows are unchanged.

| Token | Theme | vs bg | vs s | vs s2 | Verdict |
| --- | --- | --- | --- | --- | --- |
| `--color-text` | light | 18.25 | 17.15 | 15.81 | AAA |
| `--color-text-dim` | light | 10.54 | 9.90 | 9.13 | AAA |
| `--color-text-muted` | light | 7.04 | 6.61 | 6.10 | AA ✓ |
| `--color-accent` | light | 4.21 | 3.96 | 3.65 | ≥3:1 UI ✓ |
| `--color-accent-text` | light | 6.24 | 5.86 | 5.40 | AA ✓ |
| `--color-text` | dark | 16.84 | 15.62 | 14.37 | AAA |
| `--color-text-dim` | dark | 11.61 | 10.79 | 9.93 | AAA |
| `--color-text-muted` | dark | 7.61 | 7.07 | 6.51 | AA ✓ |
| `--color-accent` | dark | 5.81 | 5.39 | 4.96 | AA/UI ✓ |
| `--color-accent-text` | dark | 6.76 | 6.28 | 5.78 | AA ✓ |

Every light pair cleared its threshold on the old paper and gained headroom on
the new one; no value had to be re-chosen to pass. `--color-border` (`#c9c9c3`)
is held unchanged deliberately: it is a separation rule, not a text or control
token, and against the brighter ground its ink-vs-paper separation weight rises
from 1.48:1 to 1.61:1 (1.39:1 against `--color-surface-2`) — lightening it would
have made the concrete hairline less legible, not more.

Discipline that keeps this true: **text uses `--color-accent*-text`; fills,
rules, and glyphs use `--color-accent*`.** The base accent is not text-safe in
light (4.21 ÷ surface-2 3.65), which is why the split exists.

## 8. CONTENT CONTRACT (frozen token names)

These names are **consumed by content/runtime code and must never be renamed**.
Values are ours to change; names are not.

- `src/content/projects.ts:9` — `export type Token = "accent" | "accent-2" |
  "accent-3" | "accent-4"`. Each token is resolved to a Tailwind class
  (`text-accent-text`, `border-accent-2/30`, `bg-accent-4/5`, …) in
  `src/components/Projects.tsx` and validated against `ProjectSchema` through a
  token→hex map. **Renaming or dropping any of `--color-accent`,
  `--color-accent-2`, `--color-accent-3`, `--color-accent-4` (or the matching
  `--color-accent*-text`) breaks the Projects listing and the load-time zod
  projection.**
- Same contract for `src/content/skills.ts` (`TIER_STYLES` → `text-accent-text`,
  `text-accent-2-text`, `text-accent-4-text`) and `src/lib/router.tsx` (route
  `accent: "accent-2" | "accent-3" | "accent-4"`).
- The former runtime canvas consumer — `src/components/BackgroundEffects.tsx`,
  which read `--color-bg`, `--color-accent`, and `--color-grid-line` via
  `getComputedStyle` — **has been deleted**. No runtime JS reads the token layer
  today; the names stay frozen for the content/router consumers above and for a
  later component pass.

Therefore the restyle **collapses accent-2/3/4 into the single accent** rather
than deleting them. Deleting a token would be a behavior change; aliasing is a
palette change. That is the whole reason the four names survive a one-accent
system.

Also frozen for the same reason: `--color-bg`, `--color-surface`,
`--color-surface-2`, `--color-border`, `--color-border-accent`, `--color-text`,
`--color-text-dim`, `--color-text-muted`, `--color-accent-glow`,
`--color-grid-line`, `--color-selection`, `--font-mono`.

## 9. Banned-pattern list

A pattern is a tell when it is a **default reached for without reason**
(`[S2]`, "What not to over-flag"). The list is enforced per tier: **P0 = blocks
the change, P1 = must be fixed before done, P2 = fix or state why not**
(`[S2]` severity tiers: P0 "screams AI on sight", P1 "obvious smell", P2
"cosmetic"). `[S3]`'s verdict applies on top: two failed checklist sections, or
any hard visual ban → **REVISE**; a conflict with accessibility/product
requirements → **ESCALATE** and document the tradeoff.

### P0 — hard bans

| Banned | Why | Source |
| --- | --- | --- |
| Purple / indigo→violet→blue gradient (anywhere) | The canonical tell; an unchosen default | `[S1]` "AI color palette"; `[S2]` C1; `[S3]` |
| Gradient text / `bg-clip-text` headings | Decoration that weakens legibility | `[S1]` "Gradient text"; `[S2]` C6; `[S3]` |
| Generic AI dark palette (blue-black + cyan/purple accent) | Unchosen, low-contrast, generic | `[S1]` "AI color palette"; `[S3]` "Cyan accents on dark blue" |
| Centered hero + pill badge + three identical icon cards | The template skeleton | `[S2]` L1, L2; `[S1]` "Identical card grids"; `[S3]` "Hero section inside an internal dashboard" |
| Icon-tile stacked above heading | Feature-card reflex (`rounded-xl` icon chip) | `[S1]` "Icon tile stacked above heading"; `[S2]` K6; `[S3]` |
| Badge / pill above the headline | Adds a clickable-looking ornament that says nothing | `[S1]` "Badge above the main headline"; `[S2]` K5 |
| Oversized hero headline (type that fills the first screen) | No room left to explain anything | `[S1]` "Oversized hero headline"; `[S2]` L1 |
| Hero metric layout (huge number + tiny label + stats) | Landing-page template; hollow proof | `[S1]` "Hero metric layout"; `[S2]` L4 |
| Untouched component-library defaults (radius, zinc/slate, base Button/Card) | The framework-level tell | `[S2]` K1; `[S1]` "Extreme border-radius on cards" |
| Systemic low contrast | Fails the system's own §7 thresholds | `[S1]` "Low-contrast text", "Gray text on colored background" |

### P1 — must be fixed before done

| Banned | Why | Source |
| --- | --- | --- |
| Gradient / soft-gradient backgrounds as decoration | Fills space without meaning | `[S1]` "Soft spotlight behind content"; `[S2]` C1; `[S3]` |
| Radial-gradient halo / soft spotlight behind content | Familiar AI background effect competing with content | `[S1]` "Radial-gradient background halo", "Soft spotlight behind content" |
| Glassmorphism / `backdrop-blur` panels | Glass on glass, usually fake layering | `[S1]` "Glassmorphism everywhere"; `[S2]` K3; `[S3]` |
| Nested cards | Depth noise; flatten with spacing/typography/dividers | `[S1]` "Nested cards"; `[S3]` "No card is nested inside another card" |
| Decorative grid-line background | Lines that measure nothing | `[S1]` "Decorative grid-line background" |
| Dark-mode glowing accents / colored glow shadows | Neon wall; decoration mistaken for signal | `[S1]` "Dark mode with glowing accents"; `[S2]` C5; `[S3]` "Coloured glows on cards or buttons" |
| Identical card grids (same size, padding, icon) | Every point weighted the same | `[S1]` "Identical card grids"; `[S2]` L2; `[S3]` |
| Monotonous spacing (one gap everywhere) | Nothing is emphasized because everything breathes alike | `[S1]` "Monotonous spacing"; `[S2]` S1 |
| Tiny interface text (nav/controls below the type floor) | Unusable without zooming | `[S1]` "Tiny interface text"; `[S3]` (see also `[S2]` — the floor here is `--text-micro` 10px, controls must use ≥`--text-label`) |
| Icon in a rounded-square chip above a heading | Stock feature-card treatment | `[S2]` K6; `[S1]` "Icon tile stacked above heading" |
| Uppercase + wide letter-spacing label above **every** section | The "dark SaaS" eyebrow, unconsidered | `[S2]` T5; `[S1]` "Label above a heading"; `[S3]` "Eyebrow label + h2" |
| Colored left/top border-accent stripe on a card | "Almost as reliable a sign of AI design as em-dashes are for text" | `[S2]` K4; `[S1]` "Side-tab accent border" |
| Emoji as system iconography or feature bullets | A lazy stand-in for real marks | `[S2]` I2 |
| Vague aspirational copy ("Elevate…", "seamless", "supercharge", "command center") | Brand-agnostic filler | `[S2]` CP1/CP2; `[S1]` "Generic marketing claims"; `[S3]` |
| Placeholder metrics / invented stats / filler rows | Space filled with numbers that mean nothing | `[S2]` L4; `[S3]` "Fake metric grids that fill space" |

### P2 — fix, or state why not

| Banned | Why | Source |
| --- | --- | --- |
| Decorative blinking cursor | Makes static text look editable; terminal cosplay | `[S1]` "Decorative blinking cursor" |
| Pulsing status dot | Draws attention when nothing changes | `[S1]` "Pulsing status dot" |
| Auto-scrolling marquee | Forces the page's reading pace | `[S1]` "Auto-scrolling marquee"; `[S3]` |
| Bounce / elastic / spring easing | Fussy for routine actions | `[S1]` "Bounce or elastic easing"; `[S3]` |
| The same fade-up-on-scroll on every block | Reflexive, not choreographed | `[S2]` M1 |
| Scattered micro-interactions with no motion language | Motion sprinkled on | `[S2]` M2 |
| Images that zoom/rotate on hover | Movement with no purpose | `[S1]` "Images that move on hover" |
| Hover glow / lift / scale on cards | Decoration mistaken for feedback | `[S3]` "Scale on card hover" |
| Crushed letter spacing | Harms legibility at small sizes | `[S1]` "Crushed letter spacing" |
| Wide letter spacing on body text | Same, in the other direction | `[S1]` "Wide letter spacing on body text" |
| Justified body text | Word gaps; align to the start | `[S1]` "Justified text" |
| Line length beyond 65–75 characters | Hard to find the next line | `[S1]` "Line length too long" |
| Nested/decorative containers and chrome for their own sake | Adds reading, adds no decision | `[S3]` "Dead space to look expensive" |

### Survives the ban (documented exemptions)

Restraint executed well is not slop (`[S2]`). The following stay, deliberately:

- A monospace-only system — a **single committed family** with a real voice,
  not an unchosen Inter/Geist default (`[S2]` T1/T2/T4 are about *defaults*).
- Uppercase + tracking on **short categorical labels** only (`[S3]`: "Reserve
  for truly categorical labels").
- The `prompt: command` section-header convention: it is the product's
  information architecture (each section *is* a command), not an eyebrow
  garnish — but it must not carry an extra micro-label above an existing
  heading, and it must not be paired with a second kicker line.
- One accent, used in exactly three places per screen (§2.3).

## 10. Motion policy

**Motion is functional, brief, and rare.** Default is no motion.

- **Budget:** at most one orchestrated entrance per page and one state change
  per interaction. Motion signals *activity that matters* — a page becoming a
  different page, a control acknowledging a press, a request in flight.
- **Durations:** 100–200ms for state changes; ≤300ms for a page transition.
- **Easing:** one shared `ease` (no bounce, no spring, no elastic) `[S1]`,
  `[S3]`.
- **Properties:** `opacity` and `color`/`background`/`border-color` only for
  state. `transform` is allowed for a whole-page transition, never for card
  lift/scale/zoom `[S3]` "No transform, bounce, spring, scale, slide, or
  parallax effects unless the product domain truly needs them".
- **No loops.** No blinking, no pulsing, no marquee, no auto-scroll `[S1]`.
  A blinking glyph survives **only** where a person can actually type (the
  command input caret) or where a request is genuinely in flight; every static
  copy of it is removed by the component pass. The caret is a functional
  affordance, not decoration — and it carries the `[S1]`
  "Decorative blinking cursor" exemption only under that test.
- **`prefers-reduced-motion: reduce` removes motion entirely**, including the
  functional caret blink; Framer Motion honors it via `MotionConfig
  reducedMotion="user"`. This is a hard requirement, not polish.
- Entrance animations must never gate visibility: content is visible by
  default so a failed animation cannot hide it (`[S1]` "Content stuck waiting
  to appear").

## 11. Review checklist (definition of done)

Run before any change in this restyle is called done. Adapted from `[S3]`'s
review checklist and `[S1]`'s detector set.

- [ ] No P0 pattern from §9 exists.
- [ ] All P1 patterns are fixed, or an ESCALATE note in this file explains the
      accessibility/product conflict.
- [ ] Every color on screen is one of the §2.2 tokens (or a documented
      `color-mix` of one). No raw hex in components.
- [ ] One accent, ≤3 usages per screen (§2.3).
- [ ] Every radius is 0 except 1–2px indicator dots.
- [ ] Every border is 1–4px, structural, and either concrete or ink/paper —
      no stripe, no gradient, no border+shadow pair.
- [ ] Type uses named scale steps; nothing below `--text-micro`; controls at
      ≥ `--text-label`; body ≥ `--text-body`.
- [ ] Spacing uses the named scale; related things close, groups separated.
- [ ] Contrast: ≥4.5:1 body, ≥3:1 UI, both themes (§7), verified with the
      accent*-text split.
- [ ] Hover, focus-visible, active, disabled, loading, empty, and error states
      are all designed and stable-sized `[S2]` K7.
- [ ] Keyboard nav still works: `←/→` pages, `↑/↓` section scroll, `Home/End`,
      and the editable/overlay guard (`[data-terminal-panel]`,
      `[data-mobile-menu]`).
- [ ] `npx tsc -b` passes; `pnpm run build` prints both `OK:` copy lines.

## 12. Known deferrals (owned by later passes)

Token-layer-only scope means these are documented, not fixed here:

1. `rounded-full` dots in `Header.tsx`, `Footer.tsx`, `Hero.tsx`,
   `Experience.tsx`, `CommandTerminal.tsx`, `TerminalWindow.tsx` (via
   `.terminal-dot`) — replace with square marks.
2. Per-section accent coding and the `[ERROR]` hue in `Contact.tsx` — collapse
   to ink/label-based tone (§2.3 consequence).
3. `active:translate-*` micro-interactions in `Header.tsx`/`Footer.tsx`/
   `Hero.tsx` — replace with colour/border state per the motion policy.
4. `src/content/projects.ts:90-93` `TOKEN_HEX` is now dead data —
   `Projects.tsx` no longer reads `project.color`, so the token→hex map has no
   consumer. Deferred because content files are frozen this pass.
5. Framer Motion's full bundle is still in the entry chunk (~39.6 kB gz);
   migrating to `LazyMotion` + `m` is a follow-up.
6. Google Fonts CSS is render-blocking (pre-existing at baseline).
7. Heading order is `h3`-only on some pages — no `h1`/`h2` above it
   (pre-existing at baseline).

**Resolved since this list was written.** The decorative canvas ambience
(`src/components/BackgroundEffects.tsx` — matrix rain + animated perspective
grid) has been deleted, so the old canvas deferral no longer applies; and
`.bg-grid`, `.input-glow`, and `.section-ambient` had zero remaining consumers
after that deletion and were removed from `src/index.css`. `.terminal-cursor`
survives as the one sanctioned blink (§10).
