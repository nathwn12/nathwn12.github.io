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
| **paper** — page ground | `--color-bg` `#ffffff` | `--color-bg` `#0e0e0d` (ink ground) |
| **ink** — text + structural rule | `--color-text` `#111110`, `--color-border-accent` `#111110` | `--color-text` `#f2f2ef`, `--color-border-accent` `#edede8` |
| **concrete** — muted text, hairline | `--color-text-muted` `#57574f`, `--color-border` `#c9c9c3` | `--color-text-muted` `#a3a39c`, `--color-border` `#2c2c29` |
| **accent** — one hue, signal orange | `--color-accent` `#e03c00` | `--color-accent` `#ff4d00` |

`paper` is **pure white** (`#ffffff`), the literal page rather than an off-white
approximation of one. It was previously `#fbfbfa` with a ~1% warm cast; the
operator read that ground as grey, so it and the two surfaces went to a
neutral white ramp (`#ffffff` / `#f7f7f6` / `#efefee`) with no hue cast at all.
This does not weaken the `[S1]` "Cream / beige palette" exemption the system
relies on — it removes the one attribute that needed it: white is not a
defaulted cream, it is the luminance ceiling of an ink/paper pair, and every
value is contrast-verified in §7 (each ratio rose, since the ground is now the
brightest element in the system). The layered order is unchanged: `--color-bg`
is the ground, and `--color-surface` / `--color-surface-2` are each a distinct
step below it.

### 2.2 Token name → value table (the whole token layer)

Every name below is **frozen** (§8). Values are the brutalist palette.

| Token | Light (`:root`) | Dark (`[data-theme="dark"]`) | Used for |
| --- | --- | --- | --- |
| `--color-bg` | `#ffffff` | `#0e0e0d` | page ground |
| `--color-surface` | `#f7f7f6` | `#171716` | one raised step |
| `--color-surface-2` | `#efefee` | `#1f1f1d` | two raised steps |
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
UI/graphic threshold **3:1**. Ratios below are for the pure-white light paper
(`#ffffff` / `#f7f7f6` / `#efefee`, §2.2); the dark rows are unchanged. Every
light ratio is higher than it was on the previous off-white ground (`#fbfbfa`
/ `#f4f4f1` / `#ebebe7`), because white is the luminance ceiling the other
colors are measured against.

| Token | Theme | vs bg | vs s | vs s2 | Verdict |
| --- | --- | --- | --- | --- | --- |
| `--color-text` | light | 18.89 | 17.62 | 16.42 | AAA |
| `--color-text-dim` | light | 10.91 | 10.18 | 9.48 | AAA |
| `--color-text-muted` | light | 7.29 | 6.80 | 6.33 | AA ✓ |
| `--color-accent` | light | 4.36 | 4.07 | 3.79 | ≥3:1 UI ✓ |
| `--color-accent-text` | light | 6.46 | 6.02 | 5.61 | AA ✓ |
| `--color-text` | dark | 16.84 | 15.62 | 14.37 | AAA |
| `--color-text-dim` | dark | 11.61 | 10.79 | 9.93 | AAA |
| `--color-text-muted` | dark | 7.61 | 7.07 | 6.51 | AA ✓ |
| `--color-accent` | dark | 5.81 | 5.39 | 4.96 | AA/UI ✓ |
| `--color-accent-text` | dark | 6.76 | 6.28 | 5.78 | AA ✓ |

Every pair still clears its threshold; the move to pure white raised each light
ratio by ~0.2–0.7 and changed no value. `--color-border` (`#c9c9c3`) is held
unchanged deliberately: it is a separation rule, not a text or control token,
and against the white ground its ink-vs-paper separation weight rises from
1.61:1 to **1.66:1** vs bg (**1.55:1** against `--color-surface`, **1.45:1**
against `--color-surface-2`) — lightening it would have made the concrete
hairline less legible, not more.

Discipline that keeps this true: **text uses `--color-accent*-text`; fills,
rules, and glyphs use `--color-accent*`.** The base accent is not text-safe in
light (4.36 ÷ surface-2 3.79), which is why the split exists.

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
- **`prefers-reduced-motion` is deliberately not honored.** This is an explicit
  product decision by the site owner, recorded here: the site always animates at
  full potential, and every `@media (prefers-reduced-motion: reduce)` gate has
  been removed from `src/index.css` so nothing is ever disabled by the setting.
  The tradeoff, stated plainly: motion-sensitive visitors receive full
  animation, so the vestibular-safety accommodation is intentionally absent.
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

---

## 13. TEMPORARY — film grain (operator-pending, NOT a system decision)

> **This section is an evaluation, not a spec.** It is the only place in this
> document that describes something the restyle has not committed to. If the
> operator declines it, §13 is deleted and §1–§12 are unchanged — no other rule,
> token, or table above is affected while it exists.

`src/index.css` carries a delimited **temporary** block at the end of the file:
a page-wide **animated** film grain, one `html::after` pseudo-element at
`position: fixed; inset: 0`, `pointer-events: none`, filled with **three**
self-contained inline `feTurbulence` SVGs (`type="fractalNoise"`,
`baseFrequency="0.85"`, `numOctaves="3"`, `stitchTiles="stitch"`, 160px tile,
differing only in `seed` — 7 / 41 / 113) as `background-image` data-URIs,
repeated, composited with **`mix-blend-mode: multiply`**, no JS, no asset, no
dependency. Its intensity is the additive temporary token
**`--grain-opacity`** — `0.16` light (`:root`), `0.20` dark
(`html[data-theme="dark"]`), the values after the **2026-09-20 revert**
recorded below. `--grain-opacity: 0` remains the single kill
switch, and it now stops the paint **and** the frames: the animation's duration
is derived from the same token, so `0` collapses it — `calc(0 / 0 * 0.3s)` is
NaN, invalid at computed-value time, and Chrome clamps the duration to `0s`
with no animation scheduled at all (measured: `getAnimations()` empty, painted
frame never changes); an engine that instead invalidates the shorthand falls
back to `animation-name: none`, which also schedules nothing. Either way the
layer renders nothing to blend and nothing animates.

**Two tuning knobs — strength and grain size.** The effect is tuned by exactly
two additive temporary tokens, and they are independent:

- **`--grain-opacity`** — *strength*, per theme (light `:root` `0.16`, dark
  `html[data-theme="dark"]` `0.20`) and therefore the average-luminance cost,
  since `multiply` darkens in proportion to it. `0` remains the kill switch
  (above). Its comment in `src/index.css` owns strength only.
- **`--grain-scale`** — *grain size / sharpness*. Declared **once** in `:root`,
  because it is **theme-independent** — deliberately *not* repeated in the dark
  block. Default **`1`**; **below 1 = finer/sharper, above 1 = fatter**. It works
  by scaling the drawn tile: `background-size: calc(160px * var(--grain-scale))`
  alongside the existing `background-repeat: repeat`, so at the default `1` the
  tile is exactly **160px** and the change is a **visual no-op**. The source is a
  **vector** `feTurbulence` SVG, so a non-default scale redraws the noise at the
  new size **crisply** rather than resampling pixels, and the filter region still
  pins to exactly the tile, so `stitchTiles="stitch"` keeps the repeat seamless
  at any scale. One number, one knob — not a data-URI edit.

**`baseFrequency` is the fixed base recipe, not a knob.** All four data-URI
strings (the three frames plus the base `background-image`) keep
`baseFrequency="0.85"` unchanged. It is never edited to change grain size: the
coarse `0.3` retune recorded below is exactly that mistake — rejected as "too
fat"/"sloppy" — and editing those four long strings is also how the block got
broken before. Grain size is revisited through `--grain-scale` only.

**The reshuffle — 3 frames, 0.3s loop, `steps(1, end)`, ≈10 fps.** The three
data-URIs are three genuinely different noise fields (same filter recipe, three
`seed`s) — not one image slid around, which would be drift, not film. The
keyframes swap `background-image` itself, a discrete-typed property: adjacent
frames can therefore only hard-cut, never cross-blend. Each frame holds one
third of the 0.3s loop (≈0.1s, ≈10 fps) and `steps(1, end)` pins each cut to
its segment's end; hairline keyframe pairs (`33.332%`/`33.333%`,
`66.665%`/`66.666%`) hold the same frame on both sides of every boundary so the
cut stays hard even if an engine resolves the discrete step at 50% of a segment
instead. Nothing translates, scales, or resizes — the noise field is replaced,
so it reads as reshuffle rather than motion. `background-repeat: repeat` and the
160px tile are unchanged.

**Ungated — and the name mismatch that used to kill it.** The loop is no longer
gated: `src/index.css` carries no `@media (prefers-reduced-motion: reduce)`
block for it, or for anything else, under the operator decision recorded in §10.
Before that change the animation **never ran at all**: the `html::after` rule
referenced a keyframes name (`grainFrames`) that did not exist — the real block
is `@keyframes grain-reshuffle` — so no animation was ever scheduled. Measured
live in the browser: `document.getAnimations().length` was `0` against the rule
as written, and `1` once the rule referenced `grain-reshuffle`. The rule now
points at the existing `grain-reshuffle` keyframes; the three frames, the `0.3s`
duration, `steps(1, end)`, `infinite`, the `multiply` blend and the opacity
values are unchanged.

**Capability tier — `data-perf`, and it throttles rather than disables.** The
one gate the grain *does* carry is not a preference gate: `index.html` sets
`html[data-perf]` **pre-paint** from a WebGL probe, with two values — **`full`**
(hardware acceleration present) and **`lite`** (no acceleration; this machine
reports *"Microsoft Basic Render Driver"*, i.e. a software renderer). On the
lite tier `src/index.css` adds one rule,
`html[data-perf="lite"]::after { animation-duration: 1s; }` — selector
specificity `(0,1,2)` against the base rule's `(0,0,2)`, and later in source
order, so no `!important` is needed. Same three frames, same `steps(1, end)`,
same `infinite`, same `multiply`, same `--grain-opacity` values: only the loop
lengthens `0.3s → 1s`, dropping the reshuffle from **≈10 fps to ≈3 fps**. It is
**throttled, never disabled** — the operator's call: a software renderer pays
the full per-frame composite cost of a viewport-sized blended repaint, so it
gets the cheap floor rather than no texture.

**Capability ≠ preference — the distinction is explicit.** §10's decision is
that a *preference* is never honoured: no `@media (prefers-reduced-motion)`
block exists for the grain or for anything else, and the ungated rule above
stays ungated. The lite tier is the opposite case: it is a statement about what
the **machine can afford**, not what the **user wants**, so it *is* honoured.
The two are not interchangeable — a preference gate would suppress the effect on
a capable machine, and a capability gate is not a motion preference. Both may
coexist on one machine without contradiction.

**Documented exemption from §10's "No loops" rule.** §10 bans loops outright
("No blinking, no pulsing, no marquee, no auto-scroll"). This effect is the
**single recorded exemption**, and it is deliberately narrow: the texture is
**operator-requested**, **zero-information** (a uniform field that cannot signal
activity, hierarchy, or state — the thing §10's motion budget exists to
protect), **cut at ≈10 fps** so it never reads as continuous motion, and
**ungated** — no motion-preference media query disables it (see below). §1–§12 are otherwise
unchanged; §10 is read as unqualified for everything that is not this block.
Keeping the texture without the exemption means dropping the `animation`
declaration (and the keyframes) and keeping frame 1 — the loop, not the grain,
is what §10 forbids.

**Cost — honest.** Each step repaints one **full-viewport** layer and
`mix-blend-mode: multiply` re-blends it against the root stacking context every
time: roughly **ten viewport-sized blended repaints per second**, plus the
per-frame style recalc. The source is a 160px tile repeated, so raster work per
frame is small, and only `background-image` animates — **no layout, no reflow,
no CLS**. `will-change` is deliberately not set: promoting a full-viewport
blended layer to its own compositor texture would trade a cheap paint for a
viewport-sized composite. No motion-preference media query removes the loop —
under the operator decision in §10 it always runs.

**Why `multiply` — visible, and honestly darkening.** The block's second form
used `overlay`, chosen because it is luminance-neutral. Measurement retired that
choice: `overlay`'s upper branch is `B = 1 − 2(1 − b)(1 − s)`, which at `b = 1`
collapses to exactly `1` for every noise sample `s` — on the pure-white ground
`#ffffff` the grain is a **mathematical no-op**. Measured in the browser: grain
std-dev **0.00** on `#ffffff` and **0.47** on the previous `#fbfbfa` — invisible
either way. Mean-neutrality is the wrong goal against a highlight: a blend that
preserves the mean necessarily multiplies the noise by ~0 there. `multiply`
(`B = b·s`) scales the noise by the backdrop itself and therefore lands:
measured at the original `0.07` on `#ffffff`, mean luminance **252.7** (a
**0.9% average drop**), grain std-dev **0.9**, range **249–255**. The cost is
explicit and bounded: `multiply` is **not** mean-neutral, and the ground darkens
by ~0.9% on white at that opacity. That is accepted as the price of a texture
that is actually visible — the alternative was a blend mode that provably
painted nothing. Both tokens were re-tuned for the new mode (`0.95 → 0.07`
light, `0.46 → 0.10` dark); the dark value is deliberately low because multiply
darkens the near-black ink ground too, and a large value would crush it. Nothing
clips: `b·s ∈ [0, 1]` for every backdrop and noise sample.

**2026-09-20 retune, then REVERT — coarse grain REJECTED, sharpness restored.** The first `multiply` tuning (`baseFrequency="0.85"`, sub-pixel ~1.2px features) was judged *technically* visible but *perceptually* flat: at `0.07` the grain's luminance variation was a standard deviation of only **~0.9 out of 255** (range **249–255** on white). The retune that followed changed the **lever to grain size** — `baseFrequency` **`0.85 → 0.3`** (~3–5px features) with opacity raised `0.07 → 0.14` light / `0.10 → 0.18` dark. **The operator rejected that result as too fat and sloppy:** the coarse field reads as blotchy texture rather than premium film grain. The coarse approach is therefore **reverted**: sharpness is restored at the original **`baseFrequency="0.85"`** on all three frames, and visibility is now carried by the **opacity, not the feature size** — `0.07 → 0.16` light, `0.10 → 0.20` dark, a modest raise that stops short of the rejected coarse amplitude.

**Why the earlier "invisible" reading is not trustworthy.** The evidence that led to coarsening came from sampling the ~1px grain on a **2-pixel stride**, which aliases against features at or below the sampling period: it understated the true pixel-to-pixel variation of the fine field. The real variation at `0.85` is therefore not the `~0.9` std-dev the 2px sample reported, which means opacity is the **honest lever** the fine grain always had. The exact std-dev and mean-luminance drop at `0.16` / `0.20` are re-measured by the lead **at 1:1 (one sample per device pixel)** rather than by strided sampling; that measurement is the open item, and the change recorded here is only the `baseFrequency` restore and the two opacity values.

The **honest cost**: `multiply` darkens in proportion to the opacity, so the uniform average-luminance drop on white rises with it — roughly **2% at `0.16`** against the **0.9% measured at `0.07`**. The paper stays essentially pure white (the shift is a fraction of one percent of the ground, with no cast — §2's hue is untouched), but the drop is real and is recorded here rather than waved away. The dark token rises `0.10 → 0.20` on the same reasoning and stays deliberately low because multiply darkens the near-black ink ground too. **Nothing else changed** in the revert: same three frames, same `seed`s (7 / 41 / 113), same `type="fractalNoise"`, same `numOctaves="3"`, same `stitchTiles="stitch"`, same 160px tile, same `background-repeat: repeat`, same `steps(1, end)` 3-frame 0.3s loop, same `multiply`, same `lite`/`full` `data-perf` throttle, same `--grain-opacity: 0` kill switch. The filter region stays pinned to exactly the tile, which is what keeps the stitch seamless.

**Why it is not slop.** The banned-pattern catalogs target decoration reached
for without reason, and specifically decoration standing in for hierarchy
(§9 P1 "Decorative grid-line background" is the nearest neighbour). They carve
out the case where the texture **belongs to the design** `[S1]`/`[S3]` — the
same exemption this document already uses for its deliberately chosen paper (§2.1) and
its monospace-only system (§9 "Survives the ban"). The grain is that arm:
operator-requested for an ink/paper brutalist surface, information-free, and
explicitly time-boxed below. That exemption covers *having* the texture; the
loop on top of it is a separate carve-out, recorded above, from §10.

**Conformance while it exists.** It adds no DOM node and no role, so it is not
in the accessibility tree and cannot take keyboard focus; `pointer-events: none`
means it captures nothing; `position: fixed` keeps it out of flow (no CLS, no
scrollbar). The blend changes none of that, and it cannot re-order the stack:
`mix-blend-mode` makes the pseudo-element a stacking context of its own, but it
already paints at `z-index: 10002` (above the CommandTerminal panel's `9999` and
the skip link's `10001`), so nothing is lifted over or hidden under anything, and
it has no children to isolate. It blends against the root stacking context —
`body`'s `--color-bg` paper plus every layer below it — because nothing sets
`isolation`, so the paper's real value is still what the backdrop contributes.
Compositing touches pixels, as `opacity` already did, so no token and no text
colour declaration changes. It introduces no hue (§2), no radius (§5), no border
(§6), no raw hex, and no motion beyond the single §10 exemption recorded above
— its animation is never gated by a motion-preference media query, per §10. It
does not trip the §11 checklist's "no P0/P1 pattern" item on
those grounds.

**Revert.** Delete the delimited block in `src/index.css` (it owns both
`--grain-opacity` tokens, the theme-independent `--grain-scale` token, the three
frame data-URIs, the `grain-reshuffle` keyframes and the `data-perf="lite"`
throttle rule, so nothing dangles) and this section —
or, to keep the CSS and switch the effect off, set `--grain-opacity: 0` in both
themes, which disables the paint and the animation together: the base
`html::after` shorthand's duration collapses to NaN and invalid at
computed-value time, which resolves `animation-name` to its initial `none`, so
the later `html[data-perf="lite"]::after` duration has no animation left to
re-time. Dropping only the
grain *additions* means deleting the three `background-image` data-URIs, the
`@keyframes grain-reshuffle` rule and the `animation` declaration, leaving one
static frame. To undo only the blend change
and go back to the mean-neutral `overlay` film, set `mix-blend-mode: overlay`
and restore its parity tokens (`0.95` light, `0.46` dark) — with the §13
measurement recorded above: that film is a no-op on the pure-white ground.

**Status: operator-pending.** Awaiting a keep / drop decision — and, if kept, a
decision on whether the ~10fps reshuffle stays or reverts to the static frame.
Not a deferral — there is no later pass scheduled to resolve it.
