# Terminal Control Room Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge the Intro/Hero and About pages into one Home dossier (keeping `/about` as a legacy alias), redesign Skills as an interactive `systemctl --type=service --state=running` control room, strengthen Education and Footprint, and replace the Contact farewell filler — all without touching the current terminal palette, page-transition effects, or the route shell.

**Architecture:** Four independent worker tasks (Skills; Education+Footprint; Contact; route merge + Home dossier) each own their files and ship tests-first, then a leader integration task runs the full gate. The route merge is the only task that changes shared routing contracts; it resolves `/about` through a new `ROUTE_ALIASES` map so deep links render the Home dossier while navigation (`ROUTES`, header tabs, `ls`, arrow keys) sees a single 7-route app. Section components keep their route ids (`skills`, `education`, `contact`, `footprint`) so workers 2–4 never need to know about the merge.

**Tech Stack:** React 19.2.3, Vite 7.2.4, TypeScript 5.9.3, Tailwind CSS 4.1.17 (`@tailwindcss/vite`), Framer Motion 12.38.0, zod 4.4.3 (dormant models), vitest 4.1.8 (via `pnpm exec vitest`, already resolvable). No new dependencies.

**Spec:** Direction B (approved by user 2026-08-25): merge Intro/Hero and About into one Home dossier; preserve `/about` safely as a legacy alias; redesign Skills as an interactive `systemctl --type=service --state=running` control room using existing real package data; strengthen Education and Footprint; replace Contact filler; preserve current terminal palette/effects/route shell. No standalone spec file exists yet — this plan is the first artifact in `docs/superpowers/` and encodes that decision. Working tree is on branch `dev2` with unrelated in-flight bug-fix changes (see Global Constraints) that must remain untouched.

## Global Constraints

**Verification commands (must be run, output shown, for every task):**
- `npx tsc --noEmit` — must exit 0
- `pnpm exec vitest run <scoped-test-file> --environment node` — per-task test file must pass
- `pnpm run build` — must end with `OK: copied dist/index.html → dist/404.html`
- `pnpm run preview` — then browser E2E against `http://localhost:4173`; desktop viewport **first** (1440×900), then mobile (375×812). Never claim a section done on mobile before the desktop check passes.

**Palette (matte terminal colors — copy, don't invent):** theme tokens in `src/index.css` `@theme` (dark = Ubuntu GNOME Terminal, light = Tango Light). Accent tokens used per section: `accent` (green), `accent-2` (cyan), `accent-3` (orange), `accent-4` (purple). **No glows**: no `text-shadow` glow, no `box-shadow` glow, no `blur()` entrance filters, ambient gradients ≤ ~0.08 alpha and desaturated. Hardcoded hex/rgba in components must map to token values (no raw `#22c55e`-style neon).

**Motion discipline:** Blinking is reserved for high-interest points only — CommandTerminal input caret, Home `$ whoami` cursor, PageShell transition overlay, Contact submit-pending `█`. Do not add `terminal-cursor`/`animate-pulse` anywhere else. Keep `MotionConfig reducedMotion="user"` (App.tsx) and the `@media (prefers-reduced-motion: reduce)` kill-switch in `index.css`. Marquee via `.marquee-track` only. New entrance animations must reuse the established `ease: [0.16, 1, 0.3, 1]` easing and opacity/y-only transforms (no scale/blur/filter).

**Route shell & routing invariants (do not break):**
- Page-per-viewport: body never scrolls; each page is 100dvh inside `PageShell` with internal scroll, keyed `AnimatePresence mode="wait"`.
- The `[data-terminal-panel]` and `[data-mobile-menu]` attributes are load-bearing (App.tsx arrow-key + Header F2 guards) — never rename.
- Focus/title management stays in PageShell's keyed mount effect — never move it to an App-level effect.
- Skip-link (`href="#main"`) behavior stays manual (preventDefault + focus/scroll).
- `navigate()` no-ops on unknown paths; `routeByPath` must keep resolving every path in `ROUTES` plus the alias.
- Route order in `ROUTES` is the navigation order (header tabs, `ls`, arrow keys) — `/` first, then `/experience`, `/footprint`, `/skills`, `/projects`, `/education`, `/contact`.

**Unrelated in-flight bug-fix worktree changes — NEVER touch, revert, or "improve":** `scripts/copy-404.mjs`, `src/components/BackgroundEffects.tsx`, `src/components/Header.tsx`, `src/components/PageShell.tsx`, `src/index.css`, `src/App.tsx`'s existing `#main` class (`relative z-10 outline-none flex-1 flex flex-col justify-center` — preserve that exact class string when editing App.tsx), and `tests/portfolio-regressions.test.ts`. `Header.tsx` is off-limits to every worker: its nav list derives from `ROUTES` automatically, so the merge needs zero Header edits. These files may be *read* but the diff vs `dev2` HEAD must not change for them except where a task's Files list explicitly says Modify.

**Code quality:** No `console.log`; files ≤ 800 lines; functions ≤ 50 lines; match the existing repo style (sections keep inline data — do not introduce a data-layer abstraction); surgical diffs only, every changed line traces to this plan; `prettier --write` before committing.

**Python-style data honesty:** all data shown is the existing real resume/package data (Skills `repos` array, Education timeline + certifications, Footprint delivery figures, Hero/About copy). Do not invent new skills, employers, certifications, or commit counts.

**Tests-first:** Every task starts by adding/extending a vitest file, running it to watch it FAIL, then implementing, then watching it PASS. Pre-existing RED: `tests/router-merge.test.ts` fails today (2 tests) — that is Task 4's bootstrapped red state; workers on Tasks 1–3 must ignore it (scoped test runs) and never edit that file.

---

## File Ownership & Interfaces

| File | Owned by | Task | Action |
|------|----------|------|--------|
| `src/components/Contact.tsx` | Worker → Task 1 | 1 | Modify (replace filler) |
| `tests/contact-filler.test.ts` | Task 1 | 1 | Create |
| `src/components/Education.tsx` | Worker → Task 2 | 2 | Modify (strengthen) |
| `src/components/Footprint.tsx` | Worker → Task 2 | 2 | Modify (strengthen) |
| `tests/education-footprint.test.ts` | Task 2 | 2 | Create |
| `src/components/Skills.tsx` | Worker → Task 3 | 3 | Modify (control room) |
| `tests/skills-control-room.test.ts` | Task 3 | 3 | Create |
| `src/lib/router.tsx` | Worker → Task 4 | 4 | Modify (alias map, remove `/about`) |
| `src/App.tsx` | Task 4 | 4 | Modify (PAGES map only; preserve `#main` class) |
| `src/components/Home.tsx` | Task 4 | 4 | Create (merged dossier) |
| `src/components/Hero.tsx` | Task 4 | 4 | Delete (content absorbed into Home) |
| `src/components/About.tsx` | Task 4 | 4 | Delete |
| `src/components/CommandTerminal.tsx` | Task 4 | 4 | Modify (SECTIONS 7 entries + `cd about` alias + uptime load line) |
| `tests/router-merge.test.ts` | Task 4 | 4 | Modify (extend; RED already exists) |
| `tests/route-integration.test.ts` | Task 4 | 4 | Create (static source invariants) |
| Everything else | — | — | Read-only / verify-only |

**Contract between Task 4 (route merge) and Tasks 1–3 (sections):**
- Section components keep their exported names (`Skills`, `Education`, `Footprint`, `Contact`) and the route table keeps their ids (`skills`, `education`, `footprint`, `contact`) and paths. Tasks 1–3 never touch `router.tsx`, `App.tsx`, `CommandTerminal.tsx`, `Header.tsx`, or any route file.
- The home route keeps id **`hero`** (asserted by `tests/router-merge.test.ts`); its component becomes `Home` (new file) and `/about` resolves to that same route def.
- Task 4 is the only task that may change navigation order/`ROUTES`; Tasks 1–3 must not depend on page-chrome behavior that Task 4 hasn't shipped yet (verify section visuals by direct route URL in the browser, or accept that `/skills` etc. keep working exactly as today until integration).
- Task 3 changes the Skills section-header command text to `systemctl --type=service --state=running` **in `Skills.tsx` only**; Task 4 syncs the matching `ROUTES.command` metadata for `/skills` to the same string (pure metadata — no rendering impact).

---

### Task 1: Replace Contact farewell filler with a mailer-status block

**Files:**
- Modify: `src/components/Contact.tsx` (bottom filler block only — lines ~353–371 today; form, address book, toolbar untouched)
- Test: `tests/contact-filler.test.ts`
- Do-not-touch: the FormSubmit form, submit handler, status state machine, address-book cards, MUA chrome, `input-glow` fields.

**Interfaces:**
- Consumes: existing `Contact` component export + current markup (read it first).
- Produces: nothing new for other tasks — this task owns only its own file and test.

- [ ] **Step 1: Write the failing test**

Create `tests/contact-filler.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const contactSource = readFileSync(
  resolve(import.meta.dirname, "../src/components/Contact.tsx"),
  "utf8",
);

describe("contact filler replacement", () => {
  test("removes the farewell filler lines", () => {
    expect(contactSource).not.toMatch(/goodbye\.world/);
    expect(contactSource).not.toMatch(/Thanks for visiting/);
  });

  test("adds the mailer status block", () => {
    expect(contactSource).toMatch(/systemctl status mailer/);
    expect(contactSource).toMatch(/replies within 24h/i);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run tests/contact-filler.test.ts --environment node`
Expected: both tests FAIL — source still contains `goodbye.world` / `Thanks for visiting`, and lacks the mailer-status strings.

- [ ] **Step 3: Replace the filler block**

In `src/components/Contact.tsx`, delete the final `motion.div` (the block containing `echo "Thanks for visiting. Let's connect."` and `cat /dev/null > goodbye.world`) and replace it with:

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.25, duration: 0.35 }}
  className="mt-6 border border-border-accent bg-surface p-4 md:p-6"
>
  <div className="flex items-center gap-2 mb-3">
    <span className="text-accent text-sm">$</span>
    <span className="text-sm text-text-dim">systemctl status mailer</span>
  </div>
  <div className="space-y-1.5 text-xs text-text-dim font-mono">
    <p>
      <span className="text-accent-2 font-bold">●</span> mailer: active
      (running) — replies within 24h on business days
    </p>
    <p>
      <span className="text-accent font-bold">●</span> status: open to
      backend &amp; fintech roles — email preferred
    </p>
  </div>
</motion.div>
```

Match the existing import style (`motion` already imported). Do not touch any other part of Contact.tsx.

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run tests/contact-filler.test.ts --environment node`
Expected: both tests PASS.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 6: Build**

Run: `pnpm run build`
Expected: build succeeds and prints `OK: copied dist/index.html → dist/404.html`.

- [ ] **Step 7: Browser check — desktop first, then mobile**

Run `pnpm run preview` then open `http://localhost:4173/contact`:
1. Desktop 1440×900 first: the farewell echoes are gone; the new `systemctl status mailer` block renders with `●` glyphs in the correct accent colors; submit button, pending `█`, and success/error status still behave (submit is optional — FormSubmit requires the live email; at minimum confirm the pending state appears and the form is not broken).
2. Then 375×812: block wraps cleanly, no horizontal scroll.

- [ ] **Step 8: Commit**

```bash
git add src/components/Contact.tsx tests/contact-filler.test.ts
git commit -m "feat: replace contact farewell filler with mailer status block"
```

---

### Task 2: Strengthen Education timeline and Footprint delivery data

**Files:**
- Modify: `src/components/Education.tsx` (add 4th timeline node, export data arrays)
- Modify: `src/components/Footprint.tsx` (export data arrays, add per-year commit bars + reconciliation line)
- Test: `tests/education-footprint.test.ts`
- Do-not-touch: certification URLs/ids (verified real links — the test pins them), the `ls certs/` grid, route metadata, `src/types/models.ts`.

**Interfaces:**
- Consumes: existing `Education`/`Footprint` components and their inline data.
- Produces — **exported data contracts other tasks/tests rely on** (add `export` to the existing module-level consts and add the new Footprint exports):
  - `Education.tsx`: `export const timeline: TimelineItem[]` and `export const certifications: Certification[]`
  - `Footprint.tsx`: `export const DELIVERY_BY_YEAR: ReadonlyArray<{ year: string; count: number; desc: string }>` and `export const REPOS_BY_COMMITS: ReadonlyArray<{ name: string; count: number; period: string }>`
  - Invariant pinned by tests: sum of `DELIVERY_BY_YEAR` counts === 1182 AND sum of `REPOS_BY_COMMITS` counts === 1182 (the real `1,182 TOTAL COMMITS` claim).

- [ ] **Step 1: Write the failing test**

Create `tests/education-footprint.test.ts`:

```ts
import { describe, expect, test } from "vitest";

const { timeline, certifications } = await import("../src/components/Education");
const { DELIVERY_BY_YEAR, REPOS_BY_COMMITS } = await import(
  "../src/components/Footprint"
);

describe("education strengthening", () => {
  test("timeline has four milestones ending at production deployment", () => {
    expect(timeline).toHaveLength(4);
    expect(timeline.map((t) => t.year)).toEqual(["2017", "2019", "2023", "2026"]);
    expect(timeline[3].label).toContain("PRODUCTION");
    for (const entry of timeline) {
      expect(entry.school).not.toBe("");
      expect(entry.desc).not.toBe("");
    }
  });

  test("certifications stay verified and linkable", () => {
    expect(certifications).toHaveLength(4);
    for (const cert of certifications) {
      expect(cert.url.startsWith("https://")).toBe(true);
      expect(cert.id.length).toBeGreaterThan(0);
    }
  });
});

describe("footprint strengthening", () => {
  test("yearly delivery reconciles to the claimed total", () => {
    const sum = DELIVERY_BY_YEAR.reduce((n, y) => n + y.count, 0);
    expect(sum).toBe(1182);
    expect(DELIVERY_BY_YEAR.map((y) => y.year)).toEqual(["2023", "2024", "2025", "2026"]);
  });

  test("repository breakdown also reconciles to the total", () => {
    expect(REPOS_BY_COMMITS.reduce((n, r) => n + r.count, 0)).toBe(1182);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run tests/education-footprint.test.ts --environment node`
Expected: FAIL — `timeline` has 3 entries (not 4), `DELIVERY_BY_YEAR`/`REPOS_BY_COMMITS` are not exported (import resolves `undefined`).

- [ ] **Step 3: Export the existing data + add the 4th Education node**

In `Education.tsx`: add `export` to `const timeline: TimelineItem[]` and `const certifications: Certification[]`. Then append the fourth milestone to the `timeline` array (use the existing key-by-year pattern; year `"2026"` keeps keys unique against 2017/2019/2023):

```ts
{
  year: "2026",
  label: "PRODUCTION FINTECH DEPLOYMENT",
  school: "Xentra · internal systems",
  desc: "Payment processing, cash management, teller integration — Jul 2023 → Mar 2026",
  dotClass: "bg-accent-3",
  textClass: "text-accent-3",
},
```

- [ ] **Step 4: Export Footprint data + add per-year bars and reconciliation**

In `Footprint.tsx`:
1. Extract the two inline arrays at module scope and export them (replace the inline array literals inside the JSX with references to these consts):
```ts
export const DELIVERY_BY_YEAR = [
  { year: "2023", count: 245, desc: "First tracked backend delivery year." },
  { year: "2024", count: 495, desc: "Highest output across core fintech services." },
  { year: "2025", count: 412, desc: "Strong sustained delivery across payments and controls." },
  { year: "2026", count: 30, desc: "Latest visible pushed work before portfolio handoff." },
] as const;

export const REPOS_BY_COMMITS = [
  { name: "Payment Processing API", count: 844, period: "Jul 2023 – Mar 2026" },
  { name: "Cash Management Service", count: 78, period: "Dec 2023 – Dec 2025" },
  { name: "Teller Integration Platform", count: 68, period: "Dec 2024 – Sep 2025" },
  { name: "Access Control Microservice", count: 48, period: "Mar 2024 – Dec 2025" },
  { name: "Supporting Systems", count: 144, period: "Merchant integrations, compliance, reporting" },
] as const;
```
2. In the "Delivery by year" card, add a commit bar under each year row's description: a `h-1 w-full bg-border` track containing a `bg-accent/60` fill whose width is `(count / 495) * 100`% (495 = max count, real data) using a `style={{ width: ... }}` — no glow, no animation, matte palette token only.
3. In the same card header, under the total badge, add the reconciliation line as plain text using the real numbers:
```
<span className="block text-[9px] text-text-muted mt-1">
  245 + 495 + 412 + 30 = 1,182
</span>
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm exec vitest run tests/education-footprint.test.ts --environment node`
Expected: all 4 tests PASS (timeline length/order, certificate smoke checks, both sums === 1182).

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 7: Build**

Run: `pnpm run build`
Expected: build succeeds and prints `OK: copied dist/index.html → dist/404.html`.

- [ ] **Step 8: Browser check — desktop first, then mobile**

Run `pnpm run preview` then open `http://localhost:4173/education` and `http://localhost:4173/footprint`:
1. Desktop 1440×900 first: Education shows 4 timeline nodes (2017 → 2019 → 2023 → 2026) with the orange accent-3 node last and no overlapping dot/connector; Footprint shows the per-year bars scaled to 2024 (widest), the `= 1,182` reconciliation, and the existing cert/evidence panels unchanged.
2. Then 375×812: timeline dots/connectors align vertically, bars don't cause horizontal overflow.

- [ ] **Step 9: Commit**

```bash
git add src/components/Education.tsx src/components/Footprint.tsx tests/education-footprint.test.ts
git commit -m "feat: strengthen education timeline and footprint delivery data"
```

---

### Task 3: Redesign Skills as a systemctl service control room

**Files:**
- Modify: `src/components/Skills.tsx` (six-unit `systemctl --type=service --state=running` capability board + selected accessible inspector; the real `repos` package data stays untouched)
- Test: `tests/skills-control-room.test.ts` (focused static source regression — reads `Skills.tsx` and pins the shipped contract)
- Do-not-touch: `src/lib/router.tsx` route metadata for `/skills` (Task 4 syncs the `ROUTES.command` string), `TerminalWindow`, `cn`, `TIER_STYLES`, `PackageInfo`/`RepoGroup`/`Tier` types, `src/index.css` (palette/motion tokens).

**Interfaces:**
- Consumes: existing `repos: RepoGroup[]` real package data (6 groups / 60 package records — all real, nothing invented), `Tier`, `TIER_STYLES`, `TerminalWindow`, `cn`, `motion`, `useState`.
- Produces — **the approved control-room contract** (only the `Skills` component export remains; helpers stay private and the contract is pinned by the static test):
  - `capabilityUnits`: six capability units, each bound to one real `repos` group — ids `api`, `data`, `delivery`, `security`, `ai`, `tooling` — each with a `repo: RepoGroup` reference, a one-line `role` blurb, and a palette `accent` (`accent`, `accent-2`, `accent-3`, `accent-4`) resolved through `UNIT_ACCENTS`.
  - `UNIT_ACCENTS`: per-accent `{ text, border, background }` token map (`border-l-{accent}` + `bg-{accent}/5`) — matte palette tokens only, no glow, no fake metrics.
  - Selected-inspector state: `useState<CapabilityId>("api")`; board buttons drive it; the inspector re-renders per selection (`key={selectedView.unit.id}`).
  - Rendering contract: section header command `systemctl --type=service --state=running`; `TerminalWindow title="capability-control-room"`; board + inspector in a desktop two-column / mobile one-column grid; tier legend strip retained; no filter/search/restart/journal/marquee machinery.

- [ ] **Step 1: Write the focused static regression test**

Create `tests/skills-control-room.test.ts` (static source invariants — same convention as `tests/route-integration.test.ts` / `portfolio-regressions.test.ts`; the shipped board has no runtime helper exports to import):

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const skillsSource = readFileSync(
  resolve(import.meta.dirname, "../src/components/Skills.tsx"),
  "utf8",
);

const block = (re: RegExp) => skillsSource.match(re)?.[0] ?? "";

describe("skills control room", () => {
  test("six capability units bind to the six real repo groups", () => {
    const units = block(
      /const capabilityUnits: CapabilityUnit\[\] = \[[\s\S]*?\n\];/,
    );
    expect(units).toContain('id: "api"');
    expect(units).toContain('id: "data"');
    expect(units).toContain('id: "delivery"');
    expect(units).toContain('id: "security"');
    expect(units).toContain('id: "ai"');
    expect(units).toContain('id: "tooling"');
    expect((units.match(/repo: repos\[\d\]/g) ?? []).length).toBe(6);
    expect(units).toContain("repo: repos[5]");
  });

  test("real package data is preserved, nothing invented", () => {
    const repos = block(/const repos: RepoGroup\[\] = \[[\s\S]*?\n\];/);
    expect(repos).toContain('fork: "core"');
    expect(repos).toContain('fork: "extra"');
    expect(repos).toContain('fork: "community"');
    expect((repos.match(/fork: /g) ?? []).length).toBe(6);
    expect((repos.match(/slug: /g) ?? []).length).toBe(60);
    expect(skillsSource).toMatch(/totalPackages = repos\.reduce/);
  });

  test("board buttons are native and drive the accessible inspector", () => {
    expect(skillsSource).toMatch(/type="button"/);
    expect(skillsSource).toMatch(/aria-pressed=\{selected\}/);
    expect(skillsSource).toMatch(/aria-controls="skills-inspector"/);
    expect(skillsSource).toMatch(/id="skills-inspector"/);
    expect(skillsSource).toMatch(/aria-live="polite"/);
  });

  test("no stale machinery or glow effects survive", () => {
    expect(skillsSource).not.toMatch(
      /buildUnits|filterUnits|TIER_TO_SUB|ServiceUnit|StateFilter|SubState/,
    );
    expect(skillsSource).not.toMatch(/marquee|restart|journalctl|type="search"/);
    expect(skillsSource).not.toMatch(/animate-pulse|terminal-cursor/);
    expect(skillsSource).not.toMatch(/text-shadow|glow|blur\(/);
  });
});
```

- [ ] **Step 2: Run the test — it pins the shipped contract (no RED phase)**

Run: `pnpm exec vitest run tests/skills-control-room.test.ts --environment node`
Expected: all 4 tests PASS against the implemented `Skills.tsx` — the approved six-unit board is already in `src/components/Skills.tsx`, so this test is the regression guard, not a RED bootstrap.

- [ ] **Step 3: Confirm the six-unit board contract in Skills.tsx**

The component keeps `PackageInfo`, `Tier`, `RepoGroup`, `TIER_STYLES`, `repos` (private), and the exported `Skills` component. Below `TIER_STYLES`, the module owns the board model:

```ts
type CapabilityId = "api" | "data" | "delivery" | "security" | "ai" | "tooling";
type UnitAccent = "accent" | "accent-2" | "accent-3" | "accent-4";

interface CapabilityUnit {
  id: CapabilityId;
  name: string;
  repo: RepoGroup;
  role: string;
  accent: UnitAccent;
}

const capabilityUnits: CapabilityUnit[] = [
  { id: "api", name: "API", repo: repos[0], role: "…", accent: "accent" },
  { id: "data", name: "data", repo: repos[1], role: "…", accent: "accent-2" },
  { id: "delivery", name: "delivery", repo: repos[2], role: "…", accent: "accent-3" },
  { id: "security", name: "security", repo: repos[3], role: "…", accent: "accent-4" },
  { id: "ai", name: "AI", repo: repos[4], role: "…", accent: "accent" },
  { id: "tooling", name: "tooling", repo: repos[5], role: "…", accent: "accent-2" },
];
```

plus `UNIT_ACCENTS` mapping each `UnitAccent` to `{ text, border: "border-l-{accent}", background: "bg-{accent}/5" }`. Every unit reads its packages from the real `repos[i]` group — no invented skills or counts. Derived per-unit info (computed inside `Skills`): `counts` per tier, `status` (`RUNNING` when `DAILY > 0`, else `PROD` when `PROD > 0`, else `WORKING`), `statusColor` from `TIER_STYLES`, `tierSummary` (`${D}D / ${P}P / ${W}W`), and `load` (`${n} pkgs / ${d} daily`).

- [ ] **Step 4: Confirm the render contract — board, inspector, layout, legend**

Inside `Skills.tsx` (state: `const [selectedId, setSelectedId] = useState<CapabilityId>("api")`; `totalPackages` derived from `repos`; `selectedView` = the unit whose id matches, falling back to `unitViews[0]`; render `null` only if no view exists):

1. **Header** (unchanged motion pattern): `$` (text-accent-3) + `systemctl --type=service --state=running` (text-xs tracking-[0.25em] text-text-dim), followed by the `flex-1 h-[1px] bg-border` rule.
2. **TerminalWindow** `title="capability-control-room"` with a meta strip: `{totalPackages} package records` (60, accent), `{capabilityUnits.length} running units` (6, accent-2), `selected {name}` — all real derived counts.
3. **Board + inspector grid**: `grid min-w-0 lg:grid-cols-[minmax(0,1.18fr)_minmax(18rem,0.82fr)]` — two columns at `lg` and up (board left, inspector right); a single stacked column below (board, then inspector with `border-t … lg:border-l lg:border-t-0`).
4. **Board**: `<section aria-labelledby="skills-board-heading">` with a `process board` heading; a `<div role="group" aria-label="Capability units" className="grid min-w-0 grid-cols-1 sm:grid-cols-2 gap-px bg-border-accent border border-border-accent">` containing six `motion.button` cells (`type="button"`, `aria-label={`Inspect ${name} capability unit`}`, `aria-pressed={selected}`, `aria-controls="skills-inspector"`, `onClick` sets `selectedId`). Selected cell: `border-l-{accent}` + `bg-{accent}/5` (+ `focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent focus-visible:outline-offset-[-2px]`); unselected: `border-l-transparent hover:bg-surface hover:border-l-border-accent`. Cell content: index (`01`–`06`), unit name in its accent, `[selected]`/`[inspect]` hint, `repo` tag, and a 3-col `status / tier mix / load` row. Native `<button>`s give Tab focus + Enter/Space activation for free — no custom key handling.
5. **Inspector**: `<section id="skills-inspector" aria-labelledby="skills-inspector-heading" aria-live="polite">`; prompt `systemctl status {id}.service`; a `motion.div key={selectedView.unit.id}` (opacity/y, 0.2s) containing the selected-unit card (name heading in accent, `[{status}]` badge, role blurb, 3-col `status / tier mix / load` dl, `[{fork}] / repo / label` line) and the package list under a `ls {repo}/` prompt — desktop 4-col header (`package version description tier`, `hidden md:grid`), rows `role="listitem"` with `aria-label={`${name}, version ${version}, ${tier}, ${description}`}`, mobile collapses to name + `slug / description` / version / tier.
6. **Legend strip** (final block inside `TerminalWindow`): `DAILY`/`PROD`/`WORKING` → `TIER_STYLES` colors + notes, unchanged pattern.
7. **No stale machinery**: no filter chips (`--all`/`--state=…`), no search input, no `[restart]` button, no journal panel, no marquee — the board is static-select only. `repos` is not exported; every visible number is derived from real data (no fake metrics).

Motion/easing: entrance animations stay opacity/y(x)-only with the repo's standard easing and short staggered durations (board cells `delay: index * 0.035, duration: 0.24`; inspector `duration: 0.2`; rows `delay: index * 0.015, duration: 0.18`) — no scale/blur/filter, no new blinking (`terminal-cursor`/`animate-pulse` are banned here), reduced-motion respected via `MotionConfig`. Hover uses `transition-colors duration-200`. No glows anywhere: accent tints are `bg-{accent}/5` only, palette tokens only.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 6: Build**

Run: `pnpm run build`
Expected: build succeeds and prints `OK: copied dist/index.html → dist/404.html`.

- [ ] **Step 7: Browser check — desktop first, then mobile**

Run `pnpm run preview` then open `http://localhost:4173/skills`:
1. Desktop 1440×900 first: header shows `systemctl --type=service --state=running`; `TerminalWindow` title `capability-control-room` with meta `60 package records · 6 running units · selected API`; two-column layout — six unit cells on the left (API, data, delivery, security, AI, tooling), inspector on the right; API starts selected (`[selected]` hint, accent `border-l` + tinted bg); clicking a cell — or Tab + Enter/Space on it (native button, `focus-visible` accent outline) — flips `aria-pressed` and swaps the inspector (`systemctl status api.service` → name/status badge/tier mix/load/role/fork+repo label + real package rows for that group); board cells live in a `role="group"`, inspector announces via `aria-live="polite"`. No filter chips, no search box, no `[restart]`, no journal, no marquee, no glow anywhere.
2. Then 375×812: board on top (single column below `sm`, two columns at `sm`), inspector stacked below with the `border-t` divider; tap a cell → `aria-pressed` + inspector update; no horizontal scroll, nothing overlaps.

- [ ] **Step 8: Commit**

```bash
git add src/components/Skills.tsx tests/skills-control-room.test.ts
git commit -m "feat: redesign skills as systemctl service control room"
```

---

### Task 4: Merge Hero + About into a Home dossier with a legacy `/about` alias

**Files:**
- Modify: `src/lib/router.tsx` (remove `/about` route def; add `ROUTE_ALIASES`; update `routeByPath`; update file doc comment)
- Modify: `src/App.tsx` (PAGES map + imports only — preserve the existing `#main` class string)
- Create: `src/components/Home.tsx` (merged dossier)
- Delete: `src/components/Hero.tsx`, `src/components/About.tsx`
- Modify: `src/components/CommandTerminal.tsx` (SECTIONS to 7 entries + `cd about` alias + uptime load line)
- Modify: `tests/router-merge.test.ts` (extend — already RED today)
- Create: `tests/route-integration.test.ts` (static source invariants for App/CommandTerminal)
- Do-not-touch: `Header.tsx`, `PageShell.tsx`, `Footer.tsx`, `index.css`, `BackgroundEffects.tsx` (all have unrelated in-flight work; Header derives tabs from `ROUTES` with zero edits).

**Interfaces:**
- Consumes: `Home` (new), `CommandTerminal` SECTIONS shape with optional `aliases`, the 6 remaining section exports, and the bootstrap RED test contract: `routeByPath("/about")?.path === "/"`, `routeByPath("/about")?.id === "hero"`, `ROUTES` = 7 entries `["/", "/experience", "/footprint", "/skills", "/projects", "/education", "/contact"]`.
- Produces:
  - `router.tsx`: `export const ROUTE_ALIASES: Readonly<Record<string, string>>` (maps `"/about"` → `"/"`); `routeByPath` resolves direct routes first, then alias targets; `routeIndex`/`routeAtOffset`/`navigate`/`useRoute` behavior for `/about` degrades to the home route (arrow keys treat it as index 0, `goPrev` stays home, `goNext` → `/experience`).
  - `App.tsx` PAGES: `{ hero: Home, experience: Experience, footprint: Footprint, skills: Skills, projects: Projects, education: Education, contact: Contact }` — home route id stays **`hero`**, component is now `Home`.
  - `CommandTerminal.tsx` SECTIONS: 7 entries; hero entry `{ id: "hero", path: "/", name: "whoami", desc: "Identity & access", aliases: ["about", "home"] }`; `cd about`/`cd home` navigate to `/`; `uptime` prints `Load: 7 sections, 0 failures`; `ls` lists 7 rows (unchanged mapping).
  - `Home.tsx`: single-viewport-scrolling dossier (PageShell scrolls it), `<section id="home" className="relative min-h-full py-8 md:py-12 px-4 lg:px-8">` combining the Hero identity block and the About `cat about.md` system-info block (content below).

- [ ] **Step 1: Confirm the bootstrapped RED state**

Run: `pnpm exec vitest run tests/router-merge.test.ts --environment node`
Expected: exactly 2 FAILURES (`resolves the legacy about path to home`, `keeps only the surviving routes in navigation order`). Do not edit `tests/router-merge.test.ts` yet — it is the contract the implementation must satisfy.

- [ ] **Step 2: Create the merged Home dossier**

Create `src/components/Home.tsx` with `export function Home()`. It is a vertical dossier — PageShell scrolls it internally, so no fixed-height tricks. Content, top to bottom (all copy/values are the existing real text from Hero.tsx and About.tsx — do not reword facts):
1. `$ whoami` prompt line (keep `terminal-cursor` block — this is an approved blinking point), name block `NATHANIEL` / `NIKOLAI LADERO`, role line `BACKEND DEVELOPER — 3 YRS PRODUCTION FINTECH`, and the summary paragraph.
2. The profile stats grid from Hero (LOCATION / EXPERIENCE / ROLE / STATUS values) — keep the `terminal-titlebar` + `profile` label and the 4-cell `grid-cols-2 md:grid-cols-4` hover grid verbatim.
3. The About `TerminalWindow title="about.md"` block: the `$ neofetch` panel (8 key/value rows), the "Crafting reliable systems that scale under pressure." heading + 3 narrative paragraphs, and the 2×2 CERTIFICATIONS/LANGUAGES/STACK/REPOS stats grid — moved verbatim from `About.tsx`.
4. Resume download `$ wget ./resume.pdf` (keep the `motion.a` download link).
5. Prev/Next hints: keep the disabled Prev button; change the NEXT button's `navigate("/about")` to `navigate("/experience")`.
6. The vertical sidebar `BACKEND.DEVELOPER.RESUME — BUILD 2026 — C# .NET FINTECH` (keep `hidden lg:block`).
Use the existing entrance variants pattern: container stagger + child fade/slide (`ease: [0.16, 1, 0.3, 1]`, opacity/y only). Preserve `section-ambient` + grid overlay markup from Hero.

- [ ] **Step 3: Update App.tsx PAGES and imports**

Replace the Hero/About imports and map entries:

```tsx
import { Home } from "./components/Home";
...
const PAGES: Record<string, ComponentType> = {
  hero: Home,
  experience: Experience,
  footprint: Footprint,
  skills: Skills,
  projects: Projects,
  education: Education,
  contact: Contact,
};
```

Delete the `import { Hero } ...` and `import { About } ...` lines. **Do not touch** the `#main` className string (`relative z-10 outline-none flex-1 flex flex-col justify-center`) or any other line in App.tsx.

- [ ] **Step 4: Delete Hero.tsx and About.tsx**

```bash
git rm src/components/Hero.tsx src/components/About.tsx
```

- [ ] **Step 5: Update router.tsx — alias map + routeByPath**

1. Remove the `/about` entry from `ROUTES` (12 lines: path/id/label/command/description/accent/title). Keep `/` as the only home entry.
2. Add after `ROUTES`:

```ts
/** Deep-link aliases: legacy URLs that render an existing route's page. */
export const ROUTE_ALIASES: Readonly<Record<string, string>> = {
  "/about": "/",
};
```

3. Replace `routeByPath` body:

```ts
export function routeByPath(path: string): RouteDef | undefined {
  const normalized = normalizePath(path);
  const direct = ROUTES.find((r) => r.path === normalized);
  if (direct) return direct;
  const target = ROUTE_ALIASES[normalized];
  return target ? ROUTES.find((r) => r.path === target) : undefined;
}
```

4. Update the file's doc comment: "Each section is a real path (`/`, `/experience`, …)" and note `/about` resolves via `ROUTE_ALIASES` to the home route so legacy deep links keep rendering.
No other router function changes: `navigate("/about")` pushes real `/about` history (works — `routeByPath` resolves it), `routeIndex`/`routeAtOffset` already fall back to index 0 for unknown paths, `routeIndex("/about") === 0`, `useAdjacentNavigation` from `/about` goes next to `/experience` and stays on `/` going back.

- [ ] **Step 6: Update CommandTerminal.tsx**

1. In `SECTIONS`, remove the `about` entry and add `aliases` to the hero entry:

```ts
const SECTIONS = [
  {
    id: "hero",
    path: "/",
    name: "whoami",
    desc: "Identity & access",
    aliases: ["about", "home"],
  },
  { id: "experience", path: "/experience", name: "experience.log", desc: "Service journal" },
  { id: "footprint", path: "/footprint", name: "footprint/", desc: "Delivery stats" },
  { id: "skills", path: "/skills", name: "systemctl", desc: "Service control room" },
  { id: "projects", path: "/projects", name: "projects/", desc: "Production highlights" },
  { id: "education", path: "/education", name: "education.md", desc: "Education history" },
  { id: "contact", path: "/contact", name: "inbox", desc: "Mail user agent" },
] as const;
```

2. In the `cd` case, extend the finder to match aliases (TypeScript narrows via `"aliases" in s`):

```ts
const target = SECTIONS.find(
  (s) =>
    s.id === args[0] ||
    s.name.replace(/\.|\//g, "") === args[0].replace(/\.|\//g, "") ||
    ("aliases" in s && s.aliases.includes(args[0].toLowerCase())),
);
```

3. In the `uptime` case change `Load:    8 sections, 0 failures` → `Load:    7 sections, 0 failures`.
4. Leave `whoami`/`neofetch`/`ls`/help text as-is (`ls` maps SECTIONS, so it now lists 7 rows automatically).

- [ ] **Step 7: Extend tests/router-merge.test.ts + create tests/route-integration.test.ts**

Append two tests to the existing describe block in `tests/router-merge.test.ts` (after `keeps only the surviving routes in navigation order`):

```ts
test("legacy about path behaves as home for arrow navigation", () => {
  expect(routeIndex("/about")).toBe(0);
  expect(routeAtOffset("/about", 1).path).toBe("/experience");
});

test("header nav derives six tabs from ROUTES", () => {
  const tabs = ROUTES.filter((route) => route.path !== "/");
  expect(tabs.map((route) => route.path)).toEqual([
    "/experience",
    "/footprint",
    "/skills",
    "/projects",
    "/education",
    "/contact",
  ]);
});
```

The test file already stubs `globalThis.window` before the dynamic import — keep that. Note `routeAtOffset`/`routeIndex` come from the same `await import("../src/lib/router")` — destructure them in the existing import line.

Create `tests/route-integration.test.ts` (static source invariants — matches the repo's existing `portfolio-regressions.test.ts` convention; App/CommandTerminal are not node-importable safely):

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const read = (p: string) => readFileSync(resolve(import.meta.dirname, "..", p), "utf8");

const appSource = read("src/App.tsx");
const terminalSource = read("src/components/CommandTerminal.tsx");
const homeSource = read("src/components/Home.tsx");

describe("route merge integration", () => {
  test("App renders the merged Home dossier for the home route", () => {
    expect(appSource).toMatch(/hero:\s*Home/);
    expect(appSource).not.toMatch(/about:\s*About/);
    expect(appSource).not.toMatch(/components\/Hero/);
    expect(appSource).not.toMatch(/components\/About/);
  });

  test("CommandTerminal lists seven sections with a home alias", () => {
    expect(terminalSource).toMatch(/aliases:\s*\["about",\s*"home"\]/);
    expect(terminalSource).toMatch(/7 sections, 0 failures/);
    expect(terminalSource).not.toMatch(/id: "about"/);
  });

  test("Home dossier carries both identity and system info", () => {
    expect(homeSource).toMatch(/whoami/);
    expect(homeSource).toMatch(/about\.md/);
    expect(homeSource).toMatch(/navigate\("\/experience"\)/);
  });
});
```

- [ ] **Step 8: Run the router tests to verify they pass**

Run: `pnpm exec vitest run tests/router-merge.test.ts tests/route-integration.test.ts --environment node`
Expected: all 5 router-merge assertions + 3 integration tests PASS.

- [ ] **Step 9: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0 (this catches the deleted Hero/About references — App and PAGES updated by Step 3, nothing else imported them: verified by grep for `Hero`/`About` imports being confined to App.tsx today).

- [ ] **Step 10: Build**

Run: `pnpm run build`
Expected: build succeeds and prints `OK: copied dist/index.html → dist/404.html`.

- [ ] **Step 11: Browser check — desktop first, then mobile**

Run `pnpm run preview` then:
1. Desktop 1440×900 first:
   - `http://localhost:4173/` renders the merged dossier: `$ whoami` name block AND the `about.md` neofetch/narrative in one scrollable page; NEXT button goes to `/experience`; skipping between sections with `←`/`→` lands on `/experience` then `/footprint` (no `/about` stop).
   - `http://localhost:4173/about` (deep link + refresh) renders the same dossier, address bar keeps `/about`, `document.title` is `NNL — Backend Developer`, and `navigate("/about")` from the terminal works.
   - Header shows 6 tabs (`^1` EXP … `^6` CONTACT), no ABOUT; clicking each tab navigates.
   - Terminal (`Ctrl+K`): `ls` lists 7 rows; `cd about` and `cd home` both navigate to `/`; `uptime` shows `Load: 7 sections, 0 failures`; `cd skills` opens the control room.
2. Then 375×812: hamburger lists the same 6 tabs; home dossier scrolls internally with no body scroll or horizontal overflow; `/about` deep link still renders.

- [ ] **Step 12: Commit**

```bash
git add src/lib/router.tsx src/App.tsx src/components/Home.tsx src/components/CommandTerminal.tsx tests/router-merge.test.ts tests/route-integration.test.ts
git rm --cached src/components/Hero.tsx src/components/About.tsx 2>/dev/null
git commit -m "feat: merge hero/about into home dossier with legacy /about alias"
```

---

### Task 5: Integration gate — full verification, review, and handoff

**Files:**
- Modify: none (verification only; apply minimal fixes only if a gate fails, and attribute each fix to its owning task)
- Run on the integrated working tree after Tasks 1–4 land.

**Interfaces:**
- Consumes: all four task outputs and their test files.
- Produces: the green full-suite evidence + review verdict the leader reports.

- [ ] **Step 1: Full test suite**

Run: `pnpm exec vitest run tests --environment node`
Expected: ALL tests pass (portfolio-regressions 2 + router-merge 5 + route-integration 3 + skills-control-room 4 + education-footprint 4 + contact-filler 2 = 20). Zero failures.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Production build**

Run: `pnpm run build`
Expected: build succeeds and prints `OK: copied dist/index.html → dist/404.html`.

- [ ] **Step 4: Full browser pass — desktop first, then mobile**

Run `pnpm run preview`; walk the whole app at 1440×900, then repeat at 375×812:
- `/` home dossier (identity + about.md blocks, resume link, NEXT → `/experience`)
- `/about` legacy alias deep link + refresh
- `/experience`, `/footprint` (bars + reconciliation), `/skills` (control room interactivity), `/projects`, `/education` (4 nodes), `/contact` (mailer status block; pending `█` on submit)
- Chrome: header 6 tabs + active highlight, `F2` theme flip both palettes, `Ctrl+K` terminal (`ls` 7 rows, `cd about`, `cd skills`, `uptime`), arrow keys skip `/about`, footer `$ cd ~/home`
- No horizontal scroll anywhere; blinking appears only at the 4 approved points; no new glows.

- [ ] **Step 5: Review gate**

Dispatch `code-reviewer` over the integrated diff (`git diff dev2...HEAD` minus the untouched bug-fix files) and `security-reviewer` if any form/input code changed. Checklist must pass:
- No new dependencies in `package.json`/lockfile.
- Palette tokens only; no raw neon hex; no new glows/animations; reduced-motion respected.
- `[data-terminal-panel]`/`[data-mobile-menu]` attributes intact; PageShell focus/title effect untouched; `#main` class string preserved.
- The 7 bug-fix worktree files (copy-404.mjs, BackgroundEffects, Header, PageShell, index.css, portfolio-regressions.test.ts, plus App.tsx's pre-existing `#main` change) show no unintended diff vs the pre-task state.
- All deleted-file references cleaned (no dangling `Hero`/`About` imports).
- No `console.log`, no TODO/TBD, files within size limits.

- [ ] **Step 6: Report verdict**

Report to the user: the created plan path, the green evidence from Steps 1–4, the review verdict, and the remaining decision (promote `dev2` → `main` only with explicit user go-ahead — never push `main` unprompted per AGENTS.md).

---

## Self-Review

- **Spec coverage:** Direction B's five requirements map to Tasks 1–4 (Contact filler → Task 1; Education+Footprint → Task 2; Skills control room → Task 3; Home merge + `/about` alias → Task 4) with the palette/effects/route-shell preservation enforced by Global Constraints and Task 5's review gate. "No new dependencies" held everywhere (only in-file React state + vitest, already resolvable). Desktop-first → mobile verification is an explicit step in every task and the integration pass.
- **Placeholder scan:** No TBD/TODO/"appropriate handling" phrasing; every code step contains the exact declarations, exports, JSX structure, or copy to use.
- **Type consistency:** Task 3's six-unit board + inspector contract (`capabilityUnits` bound to the six real `repos` groups, `UNIT_ACCENTS` token map, `aria-pressed`/`aria-controls`/`aria-live` hooks) is pinned by its focused static source test; `ROUTE_ALIASES` defined in Task 4 and consumed by `routeByPath`; `timeline`/`certifications`/`DELIVERY_BY_YEAR`/`REPOS_BY_COMMITS` exports match the Task 2 test imports; hero id kept as `"hero"` everywhere (route def, PAGES map, CommandTerminal SECTIONS, router-merge test) per the bootstrapped RED contract.
- **Interfaces honored:** The contract block (section ids unchanged; only Task 4 touches navigation) means workers 1–3 never cross into route files, and the pre-existing failing `router-merge.test.ts` is the executable spec Task 4 must satisfy.