import { countWords, projects } from "./projects";
import probe from "./repos.probe.json";
import downloads from "./npm-downloads.json";

/**
 * The work is the open-source record: what each tool does, why it exists, and
 * what the build says about the builder. Claims and details are new copy in
 * the owner's register; every concrete move below is grounded in the case
 * notes in projects.ts. No download figure is repeated here — those live in
 * the signal chapter, and the commit/repo totals live in proof.
 */
const CLAIMS: Readonly<Record<string, string>> = {
  hand: "A browser and a Windows desktop in one Rust binary.",
  puppet: "The real Windows screen, under agent control.",
  gladius: "Headless Chrome without the Node runtime.",
  "oc-collections": "The OpenCode family, installable one at a time.",
  "oc-templates": "A plugin and an MCP server in one package.",
  "my-chromium-extensions": "Extensions that live unpacked, close to the browser.",
  slowburn: "Practice loops that remember where you stopped.",
  "spotify-playlist-to-youtube": "A public playlist, moved without an API key.",
  potflix: "What plays locally, shown on the card.",
  "arc-installer": "Theme, repair, revert — one clean round trip.",
  "aimp-discord-presence": "Local playback, published as presence.",
  "vencord-bootstrap": "One line to install, repair, or dry-run.",
  bytefry: "Offline image crush, entirely on the machine.",
};

/** A second line per row: the technical texture behind the claim. Specific,
 *  warm on the work itself, and free of any figure another chapter owns. */
const DETAILS: Readonly<Record<string, string>> = {
  hand:
    "Published this week. The browser engine drives Chromium over CDP and the desktop engine works in the background without moving the pointer or stealing focus — 35 MCP tools his own harness calls every day.",
  puppet:
    "Six narrow tools, each target-locked to a window revalidated before every call. Clipboard writes are refused unless explicitly allowed.",
  gladius:
    "One native binary drives the active page over CDP; clicks and keys ride the protocol, so no cursor moves and no window is raised.",
  "oc-collections":
    "Six packages plus the index, developed together as one workspaces monorepo across Rust and TypeScript — installed one at a time.",
  "oc-templates":
    "A v2 plugin and a stdio entry in one package, completing the protocol handshake with no SDK in the dependency tree.",
  "my-chromium-extensions":
    "Four manifests in one workspace; the presence reporters hand watch state to a native host because a browser cannot open the Discord pipe itself.",
  slowburn:
    "A-B points and slow/reverb settings persist per track. It is a Tauri desktop build of a fork he maintains, not a wrapper around someone else's release.",
  "spotify-playlist-to-youtube":
    "A portable executable over a loopback backend. Each track gets a ledger row with its reason, and the landed count is read back from the new playlist.",
  potflix:
    "Filenames resolve to series and episode titles through keyless sources, with a frozen Go oracle the Rust port has to match byte for byte.",
  "arc-installer":
    "Four variants in one self-contained executable that merges icon images rather than swapping resources, and captures the originals before the first write.",
  "aimp-discord-presence":
    "A multi-layer cover-art chain behind one DLL; ini-only configuration keeps the plugin to a single file on disk.",
  "vencord-bootstrap":
    "Detects stable, PTB, Canary and Development installs, then pulls the official engine at run time so the driver never pins a stale copy.",
  bytefry:
    "A WinForms window around WebView2 with the page's network policy closed; save and copy refuse while a render is still in flight.",
};

/** The open-source thread, in the owner's register. It names the work and the
 *  habit behind it without restating counts that signal and proof already own. */
export const workIntro =
  "The public repositories are the argument. A driver published this week gives an agent a bounded way into a browser and a Windows desktop. The OpenCode packages in that family are the ones he runs daily — the harness is his own, opened up rather than demonstrated. Every tool below ships publicly, with its case notes attached.";

export interface ShowcaseRow {
  num: string;
  name: string;
  dir: string;
  url: string;
  claim: string;
  detail: string;
  tech: string[];
  language: string;
  pushed: string;
  lifetime: number | null;
}

/** Honesty label for the lifetime figure: it comes from the weekly snapshot. */
export const lifetimeNote = "refreshed weekly";

/** One npm name per published package; collections sum their members. Used
 *  only for lifetime downloads, never for the daily windows signal owns. */
const NAMES: Readonly<Record<string, readonly string[]>> = {
  hand: ["hand-mcp"],
  puppet: ["puppet-mcp"],
  gladius: ["gladius-mcp"],
  "oc-collections": [
    "@nathwn12/oc-bifrost",
    "oc-harness-setup",
    "oc-flight-deck",
    "oc-plugin-view",
    "oc-talk",
    "rea-shim",
    "@nathwn12/janua",
  ],
};

const byRepo = new Map(probe.repos.map((repo) => [repo.name, repo]));
const byPackage = new Map(downloads.packages.map((item) => [item.name, item.downloads]));

const rows: ShowcaseRow[] = projects.map((project, index) => {
  const repo = byRepo.get(project.dir);
  const names = NAMES[project.dir] ?? [];
  const lifetime = names.reduce(
    (sum, name) => sum + (byPackage.get(name) ?? 0),
    0,
  );
  return {
    num: String(index + 1).padStart(2, "0"),
    name: project.name,
    dir: project.dir,
    url: project.url,
    claim: CLAIMS[project.dir] ?? project.description,
    detail: DETAILS[project.dir] ?? project.description,
    tech: project.tech.slice(0, 3),
    language: repo?.primaryLanguage ?? project.tech[0] ?? "—",
    pushed: repo ? repo.pushedAt.slice(5).replace("-", ".") : "—",
    lifetime: names.length > 0 ? lifetime : null,
  };
});

/** Lead addition, for the owner's veto: the public harness he drives daily.
 *  Grounded in the harness atlas, not in repos.probe.json — so it carries no
 *  probe-derived language or pushed date and no npm lifetime figure. */
const harnessRow: ShowcaseRow = {
  num: String(rows.length + 1).padStart(2, "0"),
  name: "OpenCode Harness",
  dir: "opencode-harness",
  url: "https://github.com/nathwn12/opencode-harness",
  claim: "The public harness he drives every day.",
  detail:
    "Doctrine-guarded and self-policing: nine seats, a verify allowlist, and the Atlas as the only channel into live configuration. The rules are written down because the loop is the asset.",
  tech: ["OpenCode"],
  language: "—",
  pushed: "—",
  lifetime: null,
};

const allRows: ShowcaseRow[] = [...rows, harnessRow];

/** Derived from the rows actually rendered, so the count cannot drift. */
const rowCountWord = countWords(allRows.length);
export const workIndexLede =
  `${rowCountWord.charAt(0).toUpperCase()}${rowCountWord.slice(1)} projects ` +
  "published under github.com/nathwn12 — featured work first, then the " +
  "supporting tools, forks last.";

export const featuredRows = allRows.slice(0, 3);
export const indexRows = allRows.slice(3);
