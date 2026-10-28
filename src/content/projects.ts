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
 * notes. Every repo below is public and re-verified against its local source on
 * 2026-10-24; forks state their upstream in `role`, and no star count is stored
 * or rendered anywhere here (anti-flex). The flex is honest instead: recency
 * (what shipped, and when), the technology actually used, and own-brand
 * authorship where the work is the owner's.
 *
 * Language order is a fact, not a flavour: `tech[0]` is the repository's
 * primary language as GitHub reports it (inventory read 2026-10-24), and any
 * further language named belongs to the source. oc-collections leads Rust
 * because GitHub primary is Rust and the two imported MCP crates carry the
 * larger share of the code (about 42k Rust lines across 59 files, against
 * about 30k TypeScript lines across 81 files in the seven packages); TypeScript
 * stays named because the packages are TypeScript.
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
// one public and re-verified against the local source on 2026-10-24. Forks
// say so in `role`; no star counts, because the signal is what each one does.
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
      "Windows desktop control for any MCP client: screenshot, windows, input, and cursor, for automation that needs the real screen.",
    tech: ["Rust", "MCP", "JSON-RPC 2.0", "Win32", "UIA"],
    highlights: [
      "Six tools only: screenshot, list_windows, window, do, cursor, and elements.",
      "Every call is target-locked: the window is revalidated before each action, with no focus stealing and no foreground fallback.",
      "Clipboard writes are deny-by-default and need `allow_clipboard:true`; a refused write touches nothing.",
    ],
    accent: "accent-2",
    stats: [
      { label: "last shipped", value: "2026", accent: "accent-2" },
      { label: "runtime", value: "one native Rust binary", accent: "accent-2" },
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
      "Headless Chrome driven over CDP for any MCP client: browser automation with no Node.js or Playwright in the runtime path.",
    tech: ["Rust", "CDP", "WebSocket", "MCP", "chrome-headless-shell"],
    highlights: [
      "25 tools over the active page, from accessibility snapshots with stable refs to frames, network, storage, and layout proofs.",
      "Pinned chrome-headless-shell is hash-verified and provisioned on the first serve run; the browser starts only when a tool needs it.",
      "No OS input: clicks, typing, and keys ride CDP, so no cursor moves and no window is focused or raised.",
    ],
    accent: "accent-3",
    stats: [
      { label: "last shipped", value: "2026", accent: "accent-3" },
      { label: "runtime", value: "native Rust binary", accent: "accent-3" },
      { label: "tools", value: "25", accent: "accent-3" },
    ],
  },
  {
    id: "02",
    name: "OC Collections",
    dir: "oc-collections",
    url: "https://github.com/nathwn12/oc-collections",
    kind: "Collection",
    role: "Own brand",
    year: "2026",
    description:
      "The nathwn12 OpenCode family in one place: plugins, harness setup, and MCP launchers, each installable on its own.",
    tech: ["Rust", "TypeScript", "npm workspaces", "OpenCode plugin API", "MCP"],
    highlights: [
      "Six installable packages plus the index: oc-bifrost, oc-flight-deck, oc-harness-setup, rea-shim, gladius-mcp, and puppet-mcp.",
      "Plugins install from npm; the two MCP servers keep their own engine release lanes.",
      "One npm-workspaces monorepo develops the TypeScript packages and the Rust crates together.",
    ],
    accent: "accent-2",
    stats: [
      { label: "last shipped", value: "2026", accent: "accent-2" },
      { label: "packages", value: "six plus the index", accent: "accent-2" },
      { label: "install", value: "npm and npx", accent: "accent-2" },
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
      "Whatever plays in PotPlayer mirrored on your Discord card, for listeners who want the card to show the real title.",
    tech: ["Rust", "Win32", "Discord IPC", "TVmaze", "AniList"],
    highlights: [
      "Cleans codecs, tags, and release groups out of filenames, parenthesizes years, and parses SxxEyy episode tags.",
      "Resolves series and episode titles from keyless TVmaze, AniList, Jikan, and iTunes through an on-disk cache whose hits and misses both expire after 30 days.",
      "Carries a parity oracle: the Rust title cleaner must reproduce the frozen Go output byte-for-byte.",
    ],
    accent: "accent-2",
    stats: [
      { label: "last shipped", value: "2026", accent: "accent-2" },
      { label: "surface", value: "Windows tray", accent: "accent-2" },
      { label: "implementation", value: "Rust port", accent: "accent-2" },
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
      "Music practice on Windows with studio-grade Slow + Reverb and A-B loop, for practicing musicians, offline with no account.",
    tech: ["TypeScript", "Rust", "Tauri", "React", "TanStack Router"],
    highlights: [
      "A-B loop points live on the seek bar and save per track, auto-applying when the track reopens.",
      "Slow and reverb stay set per track, with a one-click reset to dry.",
      "A fork of Museeks; the Slow and Reverb UX, A-B repeat, queue, skins, and mini mode are this fork's own work.",
    ],
    accent: "accent-3",
    stats: [
      { label: "last shipped", value: "2026", accent: "accent-3" },
      { label: "surface", value: "Windows desktop", accent: "accent-3" },
      { label: "base", value: "fork of Museeks", accent: "accent-3" },
    ],
  },
  {
    id: "18",
    name: "AIMP Discord Presence",
    dir: "aimp-discord-presence2",
    url: "https://github.com/nathwn12/aimp-discord-presence2",
    kind: "Plugin",
    role: "Fork of Exle",
    year: "2026",
    description:
      "AIMP playback as a Discord Rich Presence: track, artist, and cover art on your profile, the way Spotify does it.",
    tech: ["C++", "AIMP SDK", "Discord IPC", "Win32"],
    highlights: [
      "Fork of Exle's aimp-discord-presence; this fork adds the multi-layer cover-art chain and the presence card.",
      "Publishes local and looked-up covers through keyless hosts by default, with an optional GitHub host behind a token.",
      "Ini-only configuration keeps the plugin to one DLL, and updates throttle under Discord's rate cap.",
    ],
    accent: "accent-4",
    stats: [
      { label: "last shipped", value: "2026", accent: "accent-4" },
      { label: "surface", value: "AIMP on Windows x64", accent: "accent-4" },
      { label: "base", value: "fork of Exle", accent: "accent-4" },
    ],
  },
  {
    id: "19",
    name: "Pear Desktop",
    dir: "pear-desktop",
    url: "https://github.com/nathwn12/pear-desktop",
    kind: "App",
    role: "Fork of pear-devs",
    year: "2026",
    description:
      "A nathwn12-maintained build of Pear Desktop with its own update channel and installer identity, carrying the Slowed Reverb and Section Repeat player plugins ahead of upstream.",
    tech: ["TypeScript", "Electron", "SolidJS", "Vite"],
    highlights: [
      "Fork of pear-devs/pear-desktop; all upstream credit stays with pear-devs.",
      "Updater, installer, and Discord links point at nathwn12/pear-desktop, so the build updates from its own channel.",
      "Carries the Slowed Reverb and Section Repeat player plugins ahead of upstream.",
    ],
    accent: "accent",
    stats: [
      { label: "last shipped", value: "2026", accent: "accent" },
      { label: "surface", value: "desktop app", accent: "accent" },
      { label: "base", value: "fork of pear-devs", accent: "accent" },
    ],
  },
  {
    id: "20",
    name: "Installer2",
    dir: "Installer2",
    url: "https://github.com/nathwn12/Installer2",
    kind: "Tool",
    role: "Fork of Vencord/Installer",
    year: "2026",
    description:
      "Vencord installed or repaired on every Discord install with one line: an unofficial driver around the official installer engine.",
    tech: ["PowerShell", "Vencord Installer", "Windows"],
    highlights: [
      "Detects stable, PTB, Canary, and Development installs and installs or repairs each one.",
      "Pulls the officially released installer engine at run time, so the driver never pins a stale copy.",
      "Flags for OpenAsar, one branch, one location, no-launch, and a dry run that prints the plan.",
    ],
    accent: "accent-2",
    stats: [
      { label: "last shipped", value: "2026", accent: "accent-2" },
      { label: "surface", value: "Windows PowerShell", accent: "accent-2" },
      { label: "install", value: "one line", accent: "accent-2" },
    ],
  },
  {
    id: "06",
    name: "Tab Audio Normalizer",
    dir: "tab-audio-normalizer",
    url: "https://github.com/nathwn12/tab-audio-normalizer",
    kind: "App",
    role: "Own brand",
    year: "2026",
    description:
      "Every site at one comfortable loudness in Chrome and Brave, with per-site levelling toward a fixed program target.",
    tech: ["JavaScript", "Web Audio API", "Chrome Extensions", "ITU-R BS.1770-4"],
    highlights: [
      "One Active toggle and gain trim per site, remembered across tabs.",
      "Levels toward a -20 LUFS program target, with a true-peak limiter at or below -1 dBTP.",
      "Processes audio locally in the browser; nothing leaves the machine.",
    ],
    accent: "accent-2",
    stats: [
      { label: "last shipped", value: "2026", accent: "accent-2" },
      { label: "surface", value: "browser", accent: "accent-2" },
      { label: "scope", value: "per site", accent: "accent-2" },
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
      "The ARC icon theme applied, repaired, and reverted from one window, for Windows themers who want a clean round trip.",
    tech: ["PowerShell", "C#", "Windows"],
    highlights: [
      "Four ARC variants in one self-contained exe, with apply, repair, revert, refresh, and status actions.",
      "Merge, not swap: stock resources stay and only icon images change; originals are captured before the first write.",
      "Optional auto-repair task reapplies the theme when Windows replaces a payload.",
    ],
    accent: "accent-4",
    stats: [
      { label: "last shipped", value: "2026", accent: "accent-4" },
      { label: "surface", value: "Windows installer", accent: "accent-4" },
      { label: "operations", value: "apply, repair, revert", accent: "accent-4" },
    ],
  },
  {
    id: "07",
    name: "Slowed + Reverb Audio",
    dir: "slowed-reverb-audio",
    url: "https://github.com/nathwn12/slowed-reverb-audio",
    kind: "App",
    role: "Own brand",
    year: "2026",
    description:
      "YouTube audio slowed and washed in plate reverb entirely in the browser, with settings per site and the clip never leaving the machine.",
    tech: ["JavaScript", "Web Audio API", "AudioWorklet", "Chrome Extensions"],
    highlights: [
      "Speed from 0.7x to 1.3x in 0.01 steps without pitch distortion.",
      "Dattorro plate reverb from 0 to 100 percent, with per-site speed, reverb, and Active state remembered.",
      "Runs locally in the tab; the source audio never leaves the browser.",
    ],
    accent: "accent-3",
    stats: [
      { label: "last shipped", value: "2026", accent: "accent-3" },
      { label: "surface", value: "browser extension", accent: "accent-3" },
      { label: "output", value: "live audio", accent: "accent-3" },
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
      "Deprecated 2026-10-21: OpenCode 2.1 restored the built-in todowrite. See EOL.md.",
  },
];

/** Route lede: selection criteria (public repos under the owner) and reading
    order (featured first). Never restates the title, and counts the projects
    the page actually renders. */
export const projectsLede = `${cap(countWords(projects.length))} projects published under github.com/nathwn12: featured work first, then the supporting tools.`;

/** Route support line: what each band carries, and the two rules that keep it
    honest (no star counts, retired work separated). */
export const projectsSupport =
  "Each band pairs what the project does with the facts behind it: stack, role, and ship year. No star counts; retired work sits at the foot of the page.";

/** Landing teaser lede: what the three rows are and where a title leads. */
export const workTeaserLede =
  "A first look at the current work: each title opens its full case notes.";

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
