import { projects } from "./projects";
import { signal, fmt } from "./signal";
import probe from "./repos.probe.json";

/**
 * The work splits into two forms: three number-led showcases carrying a live
 * sparkline, and a compact catalogue for the rest. Claims are new copy in the
 * owner's register; every figure beside them comes from a committed snapshot.
 */
const CLAIMS: Readonly<Record<string, string>> = {
  hand: "Browser and desktop, one binary, one connection.",
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

/** One npm name per package-bearing project; collections sum their members. */
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

export interface ShowcaseRow {
  num: string;
  name: string;
  dir: string;
  url: string;
  claim: string;
  tech: string[];
  language: string;
  pushed: string;
  month: number | null;
  monthLabel: string;
  daily: number[] | null;
}

const byRepo = new Map(probe.repos.map((repo) => [repo.name, repo]));
const byPackage = new Map(signal.packages.map((item) => [item.name, item]));

const rows: ShowcaseRow[] = projects.map((project, index) => {
  const repo = byRepo.get(project.dir);
  const names = NAMES[project.dir] ?? [];
  const measured = names.map((name) => byPackage.get(name)).filter(Boolean);
  const daily =
    measured.length > 0
      ? measured[0]!.daily.map((_, day) =>
          measured.reduce((sum, item) => sum + (item!.daily[day] ?? 0), 0),
        )
      : null;
  const month = measured.length > 0 ? measured.reduce((sum, item) => sum + item!.month, 0) : null;
  return {
    num: String(index + 1).padStart(2, "0"),
    name: project.name,
    dir: project.dir,
    url: project.url,
    claim: CLAIMS[project.dir] ?? project.description,
    tech: project.tech.slice(0, 3),
    language: repo?.primaryLanguage ?? project.tech[0] ?? "—",
    pushed: repo ? repo.pushedAt.slice(5).replace("-", ".") : "—",
    month,
    monthLabel: month === null ? "no package" : `${fmt(month)} / 30d`,
    daily,
  };
});

export const featuredRows = rows.slice(0, 3);
export const indexRows = rows.slice(3);
