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
 * notes. Every repo is public and freshly verified (2026-10-13) — but every one
 * carries zero stars, so NO star count is stored or rendered anywhere here
 * (anti-flex). The flex is honest instead: recency (what shipped, and when),
 * the technology actually used, and own-brand authorship.
 */

export type Token = "accent" | "accent-2" | "accent-3" | "accent-4";

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

// Open-source work published under github.com/nathwn12, newest and most
// distinctive first. No star counts: the signal is what each one does.
export const projects: ProjectLore[] = [
  {
    id: "01",
    name: "OC Flight Deck",
    dir: "oc-flight-deck",
    url: "https://github.com/nathwn12/oc-flight-deck",
    kind: "Plugin",
    role: "Own brand",
    year: "2026",
    description:
      "A configurable sidebar for the OpenCode terminal UI: one JSONC file drives rows, ordering, visibility, glyphs, and caution thresholds, hot-reloaded without restarting the session.",
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
    id: "02",
    name: "OC Harness Setup",
    dir: "oc-harness-setup",
    url: "https://github.com/nathwn12/oc-harness-setup",
    kind: "Tool",
    role: "Own brand",
    year: "2026",
    description:
      "Bootstraps a complete OpenCode harness onto a fresh machine in one run: agents, commands, skills, references, and scripts, wired so a new session starts with the same working environment every time.",
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
      "An OpenCode plugin that runs the adversarial loop: one agent challenges a plugin's behaviour with concrete cases while another repairs it, re-challenging until the findings stop moving.",
    tech: ["TypeScript", "OpenCode plugin API", "Node.js"],
    highlights: [
      "Bounded challenge, repair, and re-challenge rounds.",
      "Every round produces a concrete case, not a vague opinion.",
      "Stops on a stable finding set instead of looping forever.",
    ],
    accent: "accent-3",
    stats: [
      { label: "last shipped", value: "2026", accent: "accent-3" },
      { label: "mode", value: "adversarial loop", accent: "accent-3" },
      { label: "surface", value: "OpenCode plugin", accent: "accent-3" },
    ],
  },
  {
    id: "04",
    name: "OC Collections",
    dir: "oc-collections",
    url: "https://github.com/nathwn12/oc-collections",
    kind: "Tool",
    role: "Own brand",
    year: "2026",
    description:
      "Turns loose project material into curated, manifest-backed collections: a single source of truth for what belongs together, so a set can be listed, checked, and moved as one unit instead of by hand.",
    tech: ["TypeScript", "Node.js", "JSON", "CLI"],
    highlights: [
      "Manifest as the single source of truth for collection membership.",
      "List and verify operations answer what a collection contains.",
      "Moves a whole set atomically instead of file by file.",
    ],
    accent: "accent-4",
    stats: [
      { label: "last shipped", value: "2026", accent: "accent-4" },
      { label: "model", value: "manifest-backed", accent: "accent-4" },
      { label: "interface", value: "CLI", accent: "accent-4" },
    ],
  },
  {
    id: "05",
    name: "OC Todo",
    dir: "oc-todo",
    url: "https://github.com/nathwn12/oc-todo",
    kind: "App",
    role: "Own brand",
    year: "2025",
    description:
      "A terminal-first task list built to sit beside a coding session: capture, prioritize, and clear tasks without leaving the editor, with state kept in a plain file that survives restarts.",
    tech: ["TypeScript", "Node.js", "CLI", "OpenCode"],
    highlights: [
      "Terminal-first: no context switch away from the session.",
      "Plain-file storage that is readable and diffable.",
      "Capture and close flows designed for one-keystroke use.",
    ],
    accent: "accent",
    stats: [
      { label: "last shipped", value: "2025", accent: "accent" },
      { label: "surface", value: "terminal", accent: "accent" },
      { label: "storage", value: "plain file", accent: "accent" },
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
      "Normalizes per-tab audio loudness in the browser so a background tab can no longer blast past the one being listened to — gain is applied per tab, live, without reloading the page.",
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
    id: "07",
    name: "Slowed + Reverb Audio",
    dir: "slowed-reverb-audio",
    url: "https://github.com/nathwn12/slowed-reverb-audio",
    kind: "App",
    role: "Own brand",
    year: "2025",
    description:
      "A web audio playground that renders a slowed, reverb-laden mix from a source clip: tempo, pitch, and reverb are applied through a live audio graph and exported as a finished track.",
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
    id: "08",
    name: "Just FPS",
    dir: "just-fps",
    url: "https://github.com/nathwn12/just-fps",
    kind: "Tool",
    role: "Own brand",
    year: "2025",
    description:
      "A minimal frame-rate overlay that does one thing: show current FPS and frame time without a game engine, a launcher, or a pile of settings.",
    tech: ["TypeScript", "Node.js", "Overlay"],
    highlights: [
      "Single purpose: FPS and frame time, nothing else.",
      "Lightweight overlay with no engine dependency.",
      "Readable at a glance while something else has focus.",
    ],
    accent: "accent-4",
    stats: [
      { label: "last shipped", value: "2025", accent: "accent-4" },
      { label: "surface", value: "overlay", accent: "accent-4" },
      { label: "metrics", value: "FPS + frame time", accent: "accent-4" },
    ],
  },
  {
    id: "09",
    name: "nathwn12.github.io",
    dir: "nathwn12.github.io",
    url: "https://github.com/nathwn12/nathwn12.github.io",
    kind: "Site",
    role: "Own brand",
    year: "2024",
    description:
      "The GitHub Pages home base: a hand-built static site published straight from the repository, with no framework and no build step between a commit and the live page.",
    tech: ["HTML", "CSS", "JavaScript", "GitHub Pages"],
    highlights: [
      "Published directly from the repository with no build step.",
      "Hand-written, dependency-free front end.",
      "Serves as the stable landing point for the account's projects.",
    ],
    accent: "accent",
    stats: [
      { label: "last shipped", value: "2024", accent: "accent" },
      { label: "host", value: "GitHub Pages", accent: "accent" },
      { label: "build step", value: "none", accent: "accent" },
    ],
  },
];

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
