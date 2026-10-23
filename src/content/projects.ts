import { ProjectSchema } from "../types/models";

/**
 * Content module: Projects section data, moved verbatim out of
 * src/components/Projects.tsx. Validated against the (formerly dormant)
 * zod models at module load.
 *
 * Fields are the premium presentation contract (docs/premium-direction.md
 * § Per-route application, Projects): `name` and `dir` head the band,
 * `description` is the outcome sentence carrying its measured number, `tech`
 * renders as inline chips, and `stats` render as labeled sentences inside the
 * band's expanded notes. `token` feeds only the dormant-schema projection
 * below — no route paints a per-project hue.
 *
 * Senior-flex pass (fleet brief): the band is now driven by the real public
 * repositories on github.com/nathwn12, each carrying its canonical `url`, plus
 * case-study fields (`kind`, `role`, `year`, `highlights`) for the expanded
 * notes. Every repo below is public and freshly verified (2026-10-20) — but popularity
 * is not the signal, so NO star count is stored or rendered anywhere here
 * (anti-flex). The flex is honest instead: recency (what shipped, and when),
 * the technology actually used, and own-brand authorship.
 */

export type Token = "accent" | "accent-2" | "accent-3" | "accent-4";

/** Small-count words, so a numeral never sits beside a folio or rank numeral.
    Falls back to the digits for counts outside the table. */
const COUNT_WORDS: Record<number, string> = {
  0: "zero",
  1: "one",
  2: "two",
  3: "three",
  4: "four",
  5: "five",
  6: "six",
  7: "seven",
  8: "eight",
  9: "nine",
  10: "ten",
  11: "eleven",
  12: "twelve",
  13: "thirteen",
  14: "fourteen",
  15: "fifteen",
  16: "sixteen",
  17: "seventeen",
  18: "eighteen",
  19: "nineteen",
  20: "twenty",
};

export function countWords(n: number): string {
  return COUNT_WORDS[n] ?? String(n);
}

function cap(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export interface ProjectLore {
  id: string;
  /** Entry title of the project band */
  name: string;
  /** Directory path shown beside the title, as a bordered chip */
  dir: string;
  /** Canonical public repository */
  url: string;
  /** Artifact kind: plugin, tool, app, harness, or site */
  kind: string;
  /** Authorship line — this is own-brand work, built and maintained solo */
  role: string;
  /** Year of the most recent shipped work — the recency flex */
  year: string;
  description: string;
  tech: string[];
  /** Concrete moves behind the outcome, in the case-study notes */
  highlights: string[];
  accent: Token;
  stats: { label: string; value: string; accent: Token }[];
}

// Open-source work published under github.com/nathwn12: featured work first
// in the stated order, then the supporting tools. Eleven live entries, every
// one public and verified 2026-10-20. Descriptions follow the current GitHub
// repository descriptions. No star counts: the signal is what each one does.
// Retired work lives separately in `archived` below — history, not current work.
export const projects: ProjectLore[] = [
  {
    id: "10",
    name: "Puppet",
    dir: "puppet",
    url: "https://github.com/nathwn12/puppet",
    kind: "Tool",
    role: "Own brand",
    year: "2026",
    description:
      "Windows desktop control for any MCP client — screenshot, window, input, and cursor — for automation that needs the real screen.",
    tech: ["Rust", "MCP", "JSON-RPC 2.0", "Win32", "DXGI"],
    highlights: [
      "Six tools only: screenshot, list_windows, window, do, cursor, and elements.",
      "Capture runs on the native DXGI path with a GDI fallback in a single shipped binary.",
      "An opt-in hidden-desktop mode drives a target through PostMessage without moving the cursor or stealing focus.",
    ],
    accent: "accent-2",
    stats: [
      { label: "last shipped", value: "2026", accent: "accent-2" },
      { label: "runtime", value: "one Rust binary", accent: "accent-2" },
      { label: "tools", value: "six", accent: "accent-2" },
    ],
  },
  {
    id: "11",
    name: "Gladius",
    dir: "gladius",
    url: "https://github.com/nathwn12/gladius",
    kind: "Tool",
    role: "Own brand",
    year: "2026",
    description:
      "Headless Chrome driven over CDP for any MCP client — browser automation with no Node.js or Playwright in the runtime path.",
    tech: ["Rust", "CDP", "WebSocket", "MCP", "JSON-RPC 2.0"],
    highlights: [
      "Fifteen tools over the active page, from AX snapshots with stable refs to tabs, uploads, and console capture.",
      "Drives the owned Obscura engine over CDP; the browser lifecycle is spawned and reaped inside the binary.",
      "Every owned spawn is RAII-guarded, so a startup failure kills the whole process tree instead of leaving survivors.",
    ],
    accent: "accent-3",
    stats: [
      { label: "last shipped", value: "2026", accent: "accent-3" },
      { label: "runtime", value: "native Rust binary", accent: "accent-3" },
      { label: "tools", value: "fifteen", accent: "accent-3" },
    ],
  },
  {
    id: "02",
    name: "OC Harness Setup",
    dir: "oc-harness-setup",
    url: "https://github.com/nathwn12/oc-harness-setup",
    kind: "Tool",
    role: "Own brand",
    year: "2026",
    description:
      "The whole OpenCode harness installed and orchestrated in one command — for a fresh machine that should start in the same working environment every time.",
    tech: ["PowerShell", "TypeScript", "Node.js", "Git"],
    highlights: [
      "One command reproduces the full harness layout on a clean machine.",
      "Idempotent: re-running repairs drift instead of duplicating files.",
      "Versioned with the harness, so setup and config never diverge.",
    ],
    accent: "accent-2",
    stats: [
      { label: "last shipped", value: "2026", accent: "accent-2" },
      { label: "scope", value: "full harness", accent: "accent-2" },
      { label: "run count", value: "one", accent: "accent-2" },
    ],
  },
  {
    id: "03",
    name: "OC Bifrost",
    dir: "oc-bifrost",
    url: "https://github.com/nathwn12/oc-bifrost",
    kind: "Plugin",
    role: "Own brand",
    year: "2026",
    description:
      "V1-era OpenCode plugin hooks running on the OpenCode V2 runtime — for plugin authors bridging the version gap.",
    tech: ["TypeScript", "OpenCode plugin API", "Node.js"],
    highlights: [
      "Bounded challenge, repair, and re-challenge rounds.",
      "Every round produces a concrete case, not a vague opinion.",
      "Stops on a stable finding set instead of looping forever.",
    ],
    accent: "accent-3",
    stats: [
      { label: "last shipped", value: "2026", accent: "accent-3" },
      { label: "mode", value: "compatibility bridge", accent: "accent-3" },
      { label: "surface", value: "OpenCode plugin", accent: "accent-3" },
    ],
  },
  {
    id: "01",
    name: "OC Flight Deck",
    dir: "oc-flight-deck",
    url: "https://github.com/nathwn12/oc-flight-deck",
    kind: "Plugin",
    role: "Own brand",
    year: "2026",
    description:
      "Live session telemetry for OpenCode users — a configurable TUI sidebar driven by one JSONC file.",
    tech: ["TypeScript", "OpenCode plugin API", "JSONC", "Node.js"],
    highlights: [
      "Schema-checked JSONC config with per-row visibility and ordering.",
      "Hot reload: edits land in the running TUI without a restart.",
      "Caution thresholds let a row change state instead of shouting in colour.",
    ],
    accent: "accent",
    stats: [
      { label: "last shipped", value: "2026", accent: "accent" },
      { label: "runtime", value: "OpenCode TUI", accent: "accent" },
      { label: "config", value: "one JSONC file", accent: "accent" },
    ],
  },
  {
    id: "15",
    name: "Slowburn",
    dir: "slowburn",
    url: "https://github.com/nathwn12/slowburn",
    kind: "App",
    role: "Own brand",
    year: "2026",
    description:
      "Music practice on Windows with studio-grade Slow + Reverb and A-B loop — for practicing musicians, offline with no account.",
    tech: ["TypeScript", "Rust", "Tauri", "React", "SQLite"],
    highlights: [
      "A-B loop points live on the seek bar and save per track, auto-applying when the track reopens.",
      "Slow and reverb are fine-stepped with per-track memory and a one-click reset to dry.",
      "A fork of Museeks; the Slow and Reverb UX, A-B repeat, skins, mini mode, and queue are this fork's own work.",
    ],
    accent: "accent-3",
    stats: [
      { label: "last shipped", value: "2026", accent: "accent-3" },
      { label: "surface", value: "Windows desktop", accent: "accent-3" },
      { label: "base", value: "fork of Museeks", accent: "accent-3" },
    ],
  },
  {
    id: "14",
    name: "Potflix",
    dir: "Potflix",
    url: "https://github.com/nathwn12/Potflix",
    kind: "App",
    role: "Own brand",
    year: "2026",
    description:
      "Whatever plays in PotPlayer mirrored on your Discord card — for listeners who want the card to show the real title.",
    tech: ["Rust", "Go", "Win32", "Discord IPC", "Cargo"],
    highlights: [
      "Cleans codecs, tags, and release groups out of filenames, parenthesizes years, and parses SxxEyy episode tags; the cleaner logic derives from the upstream PotPlayer-DiscordRPC project.",
      "Resolves series and episode names from keyless sources: TVmaze, AniList, Jikan, and iTunes, under a permanent on-disk cache.",
      "Carries a parity oracle: the Rust title cleaner must reproduce the frozen Go output byte-for-byte, hashed per corpus.",
    ],
    accent: "accent-2",
    stats: [
      { label: "last shipped", value: "2026", accent: "accent-2" },
      { label: "surface", value: "Windows tray", accent: "accent-2" },
      { label: "implementation", value: "Rust port", accent: "accent-2" },
    ],
  },
  {
    id: "06",
    name: "Tab Audio Normalizer",
    dir: "tab-audio-normalizer",
    url: "https://github.com/nathwn12/tab-audio-normalizer",
    kind: "App",
    role: "Own brand",
    year: "2025",
    description:
      "Per-site audio loudness normalized in Chrome and Brave — for listeners tired of a background tab blasting past the active one.",
    tech: ["TypeScript", "Web Audio API", "Chrome Extensions"],
    highlights: [
      "Per-tab gain rather than one global volume.",
      "Live adjustment without reloading the page.",
      "Runs entirely client-side, with no audio leaving the browser.",
    ],
    accent: "accent-2",
    stats: [
      { label: "last shipped", value: "2025", accent: "accent-2" },
      { label: "surface", value: "browser", accent: "accent-2" },
      { label: "scope", value: "per tab", accent: "accent-2" },
    ],
  },
  {
    id: "16",
    name: "ArcInstaller",
    dir: "ArcInstaller",
    url: "https://github.com/nathwn12/ArcInstaller",
    kind: "Tool",
    role: "Own brand",
    year: "2026",
    description:
      "The ARC icon theme installed, repaired, and reverted in one step — for Windows themers who want a clean round trip.",
    tech: ["C#", "PowerShell", "Windows"],
    highlights: [
      "One driver for install, repair, and revert instead of by-hand steps.",
      "Repairs drift instead of duplicating files on re-run.",
      "Ships the theme payload alongside the installer.",
    ],
    accent: "accent-4",
    stats: [
      { label: "last shipped", value: "2026", accent: "accent-4" },
      { label: "surface", value: "Windows installer", accent: "accent-4" },
      { label: "operations", value: "install, repair, revert", accent: "accent-4" },
    ],
  },
  {
    id: "07",
    name: "Slowed + Reverb Audio",
    dir: "slowed-reverb-audio",
    url: "https://github.com/nathwn12/slowed-reverb-audio",
    kind: "App",
    role: "Own brand",
    year: "2025",
    description:
      "YouTube audio slowed with local reverb entirely in the browser — for practice and listening, with the clip never leaving the machine.",
    tech: ["TypeScript", "Web Audio API", "AudioWorklet"],
    highlights: [
      "Live audio graph for tempo, pitch, and reverb.",
      "Export path that renders the mix to a finished file.",
      "Runs locally — the source clip never leaves the machine.",
    ],
    accent: "accent-3",
    stats: [
      { label: "last shipped", value: "2025", accent: "accent-3" },
      { label: "surface", value: "web audio", accent: "accent-3" },
      { label: "output", value: "rendered track", accent: "accent-3" },
    ],
  },
  {
    id: "17",
    name: "rea-shim",
    dir: "rea-shim",
    url: "https://github.com/nathwn12/rea-shim",
    kind: "Tool",
    role: "Own brand",
    year: "2026",
    description:
      "Upstream rea reverse-engineering tools served over MCP from one launch line — resolves your JDK and Ghidra first, for agents (unofficial wrapper).",
    tech: ["JavaScript", "MCP", "Ghidra", "JDK"],
    highlights: [
      "One-line launcher: resolves the JDK and Ghidra paths before serving.",
      "Serves the upstream rea tool surface to an MCP client unchanged.",
      "Unofficial wrapper around morluto/rea — upstream owns the analysis.",
    ],
    accent: "accent",
    stats: [
      { label: "last shipped", value: "2026", accent: "accent" },
      { label: "surface", value: "MCP launcher", accent: "accent" },
      { label: "upstream", value: "morluto/rea", accent: "accent" },
    ],
  },
];

/**
 * Retired work — history, never current work. `oc-todo` was archived on
 * 2026-10-21 and stays listed here so the record is complete without reading
 * as live. Typed plainly, not projected through ProjectSchema: that schema
 * describes live production entries (it demands a description, tech, stats,
 * and a PRODUCTION/SHIPPED status), and forcing a retired one-line record
 * through it would be model work for no validation gain.
 */
export interface ArchivedProject {
  name: string;
  dir: string;
  url: string;
  year: string;
  reason: string;
}

export const archived: ArchivedProject[] = [
  {
    name: "OC Todo",
    dir: "oc-todo",
    url: "https://github.com/nathwn12/oc-todo",
    year: "2025",
    reason:
      "Deprecated 2026-10-21 — OpenCode 2.1 restored the built-in todowrite. See EOL.md.",
  },
];

/** Route lede: selection criteria (public repos under the owner) and reading
    order (featured first). Never restates the title. */
export const projectsLede = `${cap(countWords(projects.length))} public repositories under github.com/nathwn12 — featured work first, then the supporting tools.`;

/** Route support line: what each band carries, and the two rules that keep it
    honest (no star counts, retired work separated). */
export const projectsSupport =
  "Each band pairs what the project does with the facts behind it: stack, role, and ship year. No star counts; retired work sits at the foot of the page.";

/** Landing teaser lede: what the three rows are and where a title leads. */
export const workTeaserLede =
  "A first look at the current work — each title opens its full case notes.";

/** Landing marginalia: authorship, stated once. */
export const projectsMarginalia = "Built and maintained solo";

/** Landing link to the route page: the count in words. */
export const allProjectsLabel = `All ${countWords(projects.length)} projects`;

/* Dormant zod models wired in: token → palette hex (dark theme) so the real
   data can be validated against ProjectSchema at module load. */
const TOKEN_HEX: Record<Token, string> = {
  accent: "#8ae234",
  "accent-2": "#729fcf",
  "accent-3": "#f57900",
  "accent-4": "#ad7fa8",
};

const projectsProjection = projects.map((project) => ({
  id: project.id,
  name: project.name,
  description: project.description,
  tech: project.tech,
  status: "PRODUCTION" as const,
  color: TOKEN_HEX[project.accent],
  url: project.url,
  stats: project.stats.map((stat) => ({
    label: stat.label,
    value: stat.value,
    color: TOKEN_HEX[stat.accent],
  })),
}));

const projectsValidation = ProjectSchema.array().safeParse(projectsProjection);
if (!projectsValidation.success) {
  throw new Error(
    "content/projects.ts: Project data failed schema validation: " +
      projectsValidation.error.issues.map((issue) => issue.message).join("; "),
  );
}
