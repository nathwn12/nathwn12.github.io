/**
 * Portfolio refresh content — the UX-spec–compliant featured set.
 *
 * Authority: `.config/harness-v9/_build/portfolio-ux-spec.md` § B (site
 * section order), card anatomy, install affordance, fork policy, copy to
 * write. Every install string below is copied verbatim from the owning
 * repo's README (see the `verifiedFrom` note) — never invented.
 */

export const HERO_SENTENCE =
  "I build tools that let AI agents operate real desktops, browsers, and developer workflows.";

export const HERO_INSTALL_HINT = "npx -y puppet-mcp@latest --doctor";

export interface FeaturedProject {
  id: string;
  name: string;
  /** 1. Name + one-line plain-words what-it-is */
  tagline: string;
  /** 2. Who-it-is-for */
  forWho: string;
  /** 3. Install line in code block (only if stranger-installable) */
  install: string | null;
  /** Honest non-install label for source-only work (spec wording, verbatim) */
  sourceLabel: string | null;
  /** 4. Built-with line */
  builtWith: string;
  /** 5. Two links max: repo, docs/demo */
  repoUrl: string;
  docsUrl: string;
  docsLabel: string;
  /** Terminal preview lines shown on the card */
  preview: readonly string[];
}

/**
 * Featured order (spec): puppet, gladius, oc-harness-setup, oc-bifrost,
 * oc-flight-deck, slowburn, Potflix.
 */
export const FEATURED: readonly FeaturedProject[] = [
  {
    id: "puppet",
    name: "puppet",
    tagline: "Windows desktop control for any MCP client.",
    forWho: "for: agent builders who need eyes and hands on Windows.",
    install: "npx -y puppet-mcp@latest --doctor",
    sourceLabel: null,
    builtWith: "Built with: Rust, MCP, Win32, DXGI.",
    repoUrl: "https://github.com/nathwn12/puppet",
    docsUrl: "https://github.com/nathwn12/puppet#use-it",
    docsLabel: "Usage docs",
    preview: ["$ npx -y puppet-mcp@latest --doctor", "ok · 6 tools · one binary"],
  },
  {
    id: "gladius",
    name: "gladius",
    tagline: "Browser automation for any MCP client over CDP.",
    forWho: "for: agent builders who need a browser they can drive.",
    install: "npx -y gladius-mcp@latest --doctor",
    sourceLabel: null,
    builtWith: "Built with: Rust, CDP, WebSocket, MCP.",
    repoUrl: "https://github.com/nathwn12/gladius",
    docsUrl: "https://github.com/nathwn12/gladius#use-it",
    docsLabel: "Usage docs",
    preview: ["$ npx -y gladius-mcp@latest --doctor", "ok · pinned browser · hash-verified"],
  },
  {
    id: "oc-harness-setup",
    name: "oc-harness-setup",
    tagline: "One-command OpenCode harness installer with a doctor gate.",
    forWho: "for: anyone setting up OpenCode on a fresh machine.",
    install: "npx --yes oc-harness-setup setup",
    sourceLabel: null,
    builtWith: "Built with: PowerShell, TypeScript, Node.js.",
    repoUrl: "https://github.com/nathwn12/oc-harness-setup",
    docsUrl: "https://github.com/nathwn12/oc-harness-setup#use-it",
    docsLabel: "Usage docs",
    preview: ["$ npx --yes oc-harness-setup setup", "manifest → consent → doctor gate"],
  },
  {
    id: "oc-bifrost",
    name: "oc-bifrost",
    tagline: "Run V1-era OpenCode plugins on the V2 runtime.",
    forWho: "for: OpenCode V2 users with V1 plugins to keep.",
    install: '{ "plugins": [{ "package": "@nathwn12/oc-bifrost@latest" }] }',
    sourceLabel: null,
    builtWith: "Built with: TypeScript, OpenCode plugin API, Node.js.",
    repoUrl: "https://github.com/nathwn12/oc-bifrost",
    docsUrl: "https://github.com/nathwn12/oc-bifrost/blob/main/INSTALL.md",
    docsLabel: "Setup guide",
    preview: ["$ opencode plugin check", "ok · 24 hooks · mount report"],
  },
  {
    id: "oc-flight-deck",
    name: "oc-flight-deck",
    tagline: "Live cost, tokens, and context rail for OpenCode sessions.",
    forWho: "for: OpenCode users watching spend and context.",
    install: '{ "plugins": ["oc-flight-deck@latest"] }',
    sourceLabel: null,
    builtWith: "Built with: TypeScript, OpenCode plugin API, Node.js.",
    repoUrl: "https://github.com/nathwn12/oc-flight-deck",
    docsUrl: "https://github.com/nathwn12/oc-flight-deck#use-it",
    docsLabel: "Usage docs",
    preview: ["$ opencode", "cost · tokens · context · live"],
  },
  {
    id: "slowburn",
    name: "slowburn",
    tagline: "a Windows player for slow + reverb, built for listening",
    forWho:
      "for: slowed + reverb fans who want their own library that way, offline — slow or speed any track, add reverb, A-B loop a passage.",
    install: null,
    sourceLabel: "Source only — no release yet.",
    builtWith: "Built with: TypeScript, Rust, Tauri, React, SQLite.",
    repoUrl: "https://github.com/nathwn12/slowburn",
    docsUrl: "https://github.com/nathwn12/slowburn#use-it",
    docsLabel: "Run docs",
    preview: ["$ vp run tauri build", "library → slow + reverb → listening"],
  },
  {
    id: "potflix",
    name: "Potflix",
    tagline: "Mirror PotPlayer playback as a Discord Rich Presence card.",
    forWho: "for: PotPlayer users who live on Discord.",
    install: null,
    sourceLabel:
      "Tagged release, no binaries yet. Build from source; see repo README.",
    builtWith: "Built with: Rust, Win32, Discord IPC, Cargo.",
    repoUrl: "https://github.com/nathwn12/Potflix",
    docsUrl: "https://github.com/nathwn12/Potflix#use-it",
    docsLabel: "Run docs",
    preview: ["$ .\\dist\\potflix.exe", "Watching <title> · never blank"],
  },
];

export interface SecondTierEntry {
  name: string;
  line: string;
  url: string;
}

/** Second tier: one-line list, linked, no cards (8). */
export const SECOND_TIER: readonly SecondTierEntry[] = [
  {
    name: "bridge",
    line: "Local dashboard for solo Windows devs — git state, PRs, agent sessions.",
    url: "https://github.com/nathwn12/bridge",
  },
  {
    name: "oc-unified",
    line: "One OpenCode plugin: fleet watcher, lifeline, title renamer.",
    url: "https://github.com/nathwn12/oc-unified",
  },
  {
    name: "oc-collections",
    line: "Manifest-backed collections for loose project material.",
    url: "https://github.com/nathwn12/oc-collections",
  },
  {
    name: "oc-todo",
    line: "Terminal-first task list beside a coding session.",
    url: "https://github.com/nathwn12/oc-todo",
  },
  {
    name: "tab-audio-normalizer",
    line: "Per-tab loudness leveling in the browser.",
    url: "https://github.com/nathwn12/tab-audio-normalizer",
  },
  {
    name: "slowed-reverb-audio",
    line: "Web playground rendering slowed and reverb-laden mixes.",
    url: "https://github.com/nathwn12/slowed-reverb-audio",
  },
  {
    name: "just-fps",
    line: "Minimal FPS and frame-time overlay.",
    url: "https://github.com/nathwn12/just-fps",
  },
  {
    name: "rea-shim",
    line: "Thin compatibility wrapper that lets existing REA scripts keep running unmodified.",
    url: "https://github.com/nathwn12/rea-shim",
  },
];

export interface ForkEntry {
  name: string;
  badge: "[fork · maintained]" | "[fork · upstream link]";
  line: string;
  repoUrl: string;
  upstreamUrl: string;
}

/** Forks sit below own work; never imply ownership. */
export const FORKS: readonly ForkEntry[] = [
  {
    name: "aimp-discord-presence2",
    badge: "[fork · maintained]",
    line: "Maintained fork of the AIMP→Discord presence plugin with fixes noted in the repo.",
    repoUrl: "https://github.com/nathwn12/aimp-discord-presence2",
    upstreamUrl: "https://github.com/Exle/aimp-discord-presence",
  },
  {
    name: "Installer2",
    badge: "[fork · upstream link]",
    line: "Fork kept for reference; use upstream unless noted in the repo.",
    repoUrl: "https://github.com/nathwn12/Installer2",
    upstreamUrl: "https://github.com/Vencord/Installer",
  },
  {
    name: "pear-desktop",
    badge: "[fork · upstream link]",
    line: "Fork of the large upstream Pear desktop client, kept for study; all credit to upstream.",
    repoUrl: "https://github.com/nathwn12/pear-desktop",
    upstreamUrl: "https://github.com/pear-devs/pear-desktop",
  },
];

export const VENUE_NOTE =
  "This site itself — a terminal-themed Vite build; not a product, venue only.";
