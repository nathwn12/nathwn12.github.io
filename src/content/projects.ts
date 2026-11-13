import { ProjectSchema } from "../types/models";

/**
 * Content module: Projects section data.
 *
 * Fields are the presentation contract: `name` and `dir` head the band,
 * `description` is the outcome sentence, `tech` renders as inline chips, and
 * `stats` are labelled facts kept for the expanded notes. `token` feeds only
 * the schema projection below — no route paints a per-project hue.
 *
 * The list is a measurement, not a memory. It was written from
 * `src/content/repos.probe.json`, measured on 2026-11-13 by
 * `node scripts/probe-repos.mjs`, which reads the live account:
 * `gh repo list nathwn12 --limit 200` filtered to public and non-archived.
 * Fifteen repositories are public; thirteen are tools and are listed here, and
 * the two that are the record itself (the profile README and this site) sit in
 * `metaRepos` below. `node scripts/probe-repos.mjs --check` fails when the
 * account and this file disagree, so a repository that appears, leaves, or
 * changes its primary language cannot go unnoticed.
 *
 * Language order is a fact: `tech[0]` is the repository's primary language as
 * GitHub reports it. Any further language named belongs to the source.
 * oc-collections leads Rust because GitHub's primary is Rust, and the two
 * imported MCP crates carry the larger share of the code; TypeScript stays
 * named because the packages are TypeScript.
 *
 * Forks state their upstream in `role` as `Fork of <owner>/<name>`, and the
 * route renders that upstream beside the kind. No star count is stored or
 * rendered: the signal is what each one does.
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
  /** Repository name, shown beside the title and used in the link text */
  dir: string;
  /** Canonical public repository */
  url: string;
  /** Artifact kind: plugin, tool, app, harness, or site */
  kind: string;
  /** Authorship line: "Own brand", or "Fork of <owner>/<name>" */
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

// Own work first, forks last, and within each group the harness and desktop
// tools before the media work. The order is editorial; the membership is the
// probe's. No star counts, because the signal is what each one does.
export const projects: ProjectLore[] = [
  {
    id: "01",
    name: "Puppet",
    dir: "puppet",
    url: "https://github.com/nathwn12/puppet",
    kind: "Tool",
    role: "Own brand",
    year: "2026",
    description:
      "Windows desktop control for any MCP client — screenshot, windows, input, and cursor — for automation that needs the real screen.",
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
    id: "02",
    name: "Gladius",
    dir: "gladius",
    url: "https://github.com/nathwn12/gladius",
    kind: "Tool",
    role: "Own brand",
    year: "2026",
    description:
      "Headless Chrome driven over CDP for any MCP client — browser automation with no Node.js or Playwright in the runtime path.",
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
    id: "03",
    name: "OC Collections",
    dir: "oc-collections",
    url: "https://github.com/nathwn12/oc-collections",
    kind: "Collection",
    role: "Own brand",
    year: "2026",
    description:
      "The nathwn12 OpenCode family in one place — plugins, harness setup, and MCP launchers, each installable on its own.",
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
    id: "04",
    name: "OC Superpowers",
    dir: "oc-superpowers",
    url: "https://github.com/nathwn12/oc-superpowers",
    kind: "Plugin",
    role: "Fork of obra/superpowers",
    year: "2026",
    description:
      "An OpenCode plugin that makes a session run itself — the skill for the job is loaded before the answer, and multi-step work gets its own agents.",
    tech: ["JavaScript", "OpenCode plugin API", "Skills", "Agents"],
    highlights: [
      "Registers 22 skills and 5 agents, then injects the harness identity into every session.",
      "Multi-step jobs go to a coordinating agent, which dispatches implementer and reviewer subagents and reconciles what they report.",
      "Four hard stops are the only waits: an irreversible act, a security-sensitive act, an outward side effect, and a request where every path is a guess.",
    ],
    accent: "accent-4",
    stats: [
      { label: "last shipped", value: "2026", accent: "accent-4" },
      { label: "surface", value: "OpenCode 2.0.4 or later", accent: "accent-4" },
      { label: "registers", value: "22 skills and 5 agents", accent: "accent-4" },
    ],
  },
  {
    id: "05",
    name: "OC Templates",
    dir: "oc-templates",
    url: "https://github.com/nathwn12/oc-templates",
    kind: "Tool",
    role: "Own brand",
    year: "2026",
    description:
      "A scaffold for an OpenCode v2 plugin that is also a stdio MCP server — one package, no SDK in the dependency tree.",
    tech: ["TypeScript", "MCP", "stdio", "OpenCode plugin API", "Node.js"],
    highlights: [
      "Both halves in one package: a plugin registering a command and an `execute.before` hook, plus a stdio entry to wire into `mcp.servers`.",
      "Implements the MCP handshake through revision `2025-11-25` with no SDK dependency.",
      "Its own README calls it experimental: interfaces move, and a release can break the one before it.",
    ],
    accent: "accent-2",
    stats: [
      { label: "last shipped", value: "2026", accent: "accent-2" },
      { label: "runtime", value: "Node.js 22 or later", accent: "accent-2" },
      { label: "packages", value: "one", accent: "accent-2" },
    ],
  },
  {
    id: "06",
    name: "Chromium Extensions",
    dir: "my-chromium-extensions",
    url: "https://github.com/nathwn12/my-chromium-extensions",
    kind: "Collection",
    role: "Own brand",
    year: "2026",
    description:
      "Four Chromium extensions in one workspace — per-site loudness, slowed reverb, and two Discord presence reporters — loaded unpacked, nothing published to a store.",
    tech: [
      "JavaScript",
      "Chrome Extensions",
      "Web Audio API",
      "Native messaging",
      "Discord IPC",
    ],
    highlights: [
      "Audio Normalizer, Slowed Reverb, Crunchy Presence, and YouTube Presence: four package folders, each with its own manifest and no build step.",
      "Crunchy Presence hands watch state to a native messaging host, because a browser cannot open the Discord pipe itself.",
      "Checks run in Node with no Playwright, and pushing a `v*` tag attaches the four extension zips to the release.",
    ],
    accent: "accent-3",
    stats: [
      { label: "last shipped", value: "2026", accent: "accent-3" },
      { label: "surface", value: "Chrome and Brave, unpacked", accent: "accent-3" },
      { label: "packages", value: "four extensions", accent: "accent-3" },
    ],
  },
  {
    id: "07",
    name: "Slowburn",
    dir: "slowburn",
    url: "https://github.com/nathwn12/slowburn",
    kind: "App",
    role: "Own brand",
    year: "2026",
    description:
      "Music practice on Windows with studio-grade Slow + Reverb and A-B loop — for practicing musicians, offline with no account.",
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
    id: "08",
    name: "sp2yt",
    dir: "spotify-playlist-to-youtube",
    url: "https://github.com/nathwn12/spotify-playlist-to-youtube",
    kind: "App",
    role: "Own brand",
    year: "2026",
    description:
      "A public Spotify playlist rebuilt in YouTube Music without an API key — one portable exe over a local backend bound to 127.0.0.1.",
    tech: ["Python", "WebView2", "YouTube Music", "Spotify"],
    highlights: [
      "Reads the track list from Spotify's own public endpoints, matches each track in YouTube Music, and builds the new playlist on the account.",
      "Writes a ledger row per track with its reason, then reads the landed count back from the new playlist instead of trusting its own counter.",
      "Resumes rather than duplicating on a second run, keeps repeats, and holds the YouTube Music cookie DPAPI-encrypted on the machine.",
    ],
    accent: "accent-2",
    stats: [
      { label: "last shipped", value: "2026", accent: "accent-2" },
      { label: "packaging", value: "one portable exe", accent: "accent-2" },
      { label: "server", value: "127.0.0.1:8787", accent: "accent-2" },
    ],
  },
  {
    id: "09",
    name: "Potflix",
    dir: "potflix",
    url: "https://github.com/nathwn12/potflix",
    kind: "App",
    role: "Own brand",
    year: "2026",
    description:
      "Whatever plays in PotPlayer mirrored on your Discord card — for listeners who want the card to show the real title.",
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
    id: "10",
    name: "ArcInstaller",
    dir: "arc-installer",
    url: "https://github.com/nathwn12/arc-installer",
    kind: "Tool",
    role: "Own brand",
    year: "2026",
    description:
      "The ARC icon theme applied, repaired, and reverted from one window — for Windows themers who want a clean round trip.",
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
    id: "11",
    name: "AIMP Discord Presence",
    dir: "aimp-discord-presence",
    url: "https://github.com/nathwn12/aimp-discord-presence",
    kind: "Plugin",
    role: "Fork of Exle/aimp-discord-presence",
    year: "2026",
    description:
      "AIMP playback as a Discord Rich Presence — track, artist, and cover art on your profile, the way Spotify does it.",
    tech: ["C++", "AIMP SDK", "Discord IPC", "Win32"],
    highlights: [
      "Fork of Exle/aimp-discord-presence; this fork adds the multi-layer cover-art chain and the presence card.",
      "Publishes local and looked-up covers through keyless hosts by default, with an optional GitHub host behind a token.",
      "Ini-only configuration keeps the plugin to one DLL, and updates throttle under Discord's rate cap.",
    ],
    accent: "accent-4",
    stats: [
      { label: "last shipped", value: "2026", accent: "accent-4" },
      { label: "surface", value: "AIMP on Windows x64", accent: "accent-4" },
      { label: "base", value: "Exle/aimp-discord-presence", accent: "accent-4" },
    ],
  },
  {
    id: "12",
    name: "Pear Slowed + Reverb",
    dir: "pear-slowed-reverb",
    url: "https://github.com/nathwn12/pear-slowed-reverb",
    kind: "App",
    role: "Fork of pear-devs/pear-desktop",
    year: "2026",
    description:
      "A nathwn12-maintained build of Pear Desktop — its own update channel and installer identity, with the Slowed Reverb and Section Repeat player plugins ahead of upstream.",
    tech: ["TypeScript", "Electron", "SolidJS", "Vite"],
    highlights: [
      "Fork of pear-devs/pear-desktop; all upstream credit stays with pear-devs.",
      "Updater, installer, and Discord links point at nathwn12/pear-slowed-reverb, so the build updates from its own channel.",
      "Carries the Slowed Reverb and Section Repeat player plugins ahead of upstream.",
    ],
    accent: "accent",
    stats: [
      { label: "last shipped", value: "2026", accent: "accent" },
      { label: "surface", value: "desktop app", accent: "accent" },
      { label: "base", value: "pear-devs/pear-desktop", accent: "accent" },
    ],
  },
  {
    id: "13",
    name: "Vencord Bootstrap",
    dir: "vencord-bootstrap",
    url: "https://github.com/nathwn12/vencord-bootstrap",
    kind: "Tool",
    role: "Fork of Vencord/Installer",
    year: "2026",
    description:
      "Vencord installed or repaired on every Discord install with one line — an unofficial driver around the official installer engine.",
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
];

/**
 * The two public repositories that are the record itself rather than a tool:
 * the account's profile README and this site. They are not case notes, so they
 * are not project rows, and they are not counted in the tool total. They stay
 * declared here because the account is public in exactly this shape — the probe
 * check compares this list and `projects` together against the live account.
 */
export interface MetaRepo {
  name: string;
  dir: string;
  url: string;
  note: string;
}

export const metaRepos: MetaRepo[] = [
  {
    name: "Profile README",
    dir: "nathwn12",
    url: "https://github.com/nathwn12/nathwn12",
    note: "The account's front page; the work is linked from it.",
  },
  {
    name: "This site",
    dir: "nathwn12.github.io",
    url: "https://github.com/nathwn12/nathwn12.github.io",
    note: "The portfolio you are reading, built with Vite and React.",
  },
];

/* Archived, private and retired repositories are NOT listed here. The list is
 * exactly what the live account publishes: public, non-archived. A repository
 * that goes private or gets archived disappears from this page on the next
 * probe, because `scripts/probe-repos.mjs --check` fails on the difference.
 * History is not current work, and a dead link on a portfolio is a lie. */

/** Route lede: selection criteria (public repos under the owner) and reading
    order (featured first). Never restates the title, and counts the projects
    the page actually renders. */
export const projectsLede = `${cap(countWords(projects.length))} projects published under github.com/nathwn12 — featured work first, then the supporting tools, forks last.`;

/** Route support line: what each band carries, and the rules that keep it
    honest (no star counts, and only what the account publishes today). */
export const projectsSupport =
  "Each band pairs what the project does with the facts behind it: stack, role, and ship year. No star counts, and only what the account publishes today.";

/** Landing teaser lede: what the three rows are and where a title leads. */
export const workTeaserLede =
  "A first look at the current work — each title opens its full case notes.";

/** Landing marginalia: authorship, stated once. */
export const projectsMarginalia = "Built and maintained solo";

/** Landing link to the route page: the count in words. */
export const allProjectsLabel = `All ${countWords(projects.length)} projects`;

/* Dormant zod models wired in: the real data is validated against
   ProjectSchema at module load. No colour is projected — the schema no longer
   demands one and no route paints a per-project hue. */
const projectsProjection = projects.map((project) => ({
  id: project.id,
  name: project.name,
  description: project.description,
  tech: project.tech,
  status: "PRODUCTION" as const,
  url: project.url,
  stats: project.stats.map((stat) => ({
    label: stat.label,
    value: stat.value,
  })),
}));

const projectsValidation = ProjectSchema.array().safeParse(projectsProjection);
if (!projectsValidation.success) {
  throw new Error(
    "content/projects.ts: Project data failed schema validation: " +
      projectsValidation.error.issues.map((issue) => issue.message).join("; "),
  );
}
