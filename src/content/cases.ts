/**
 * Selected-work cases — the hiring surface.
 *
 * Each entry follows the portfolio guideline's field list: what it is,
 * who it was for, what was hard, what shipped (numbered outcomes),
 * what it took. No stack badges, no install lines, no versions.
 */

export interface WorkCase {
  id: string;
  /** Outcome-first title; first two words carry meaning. */
  title: string;
  whatItIs: string;
  whoFor: string;
  hardPart: string;
  shipped: readonly [string, string] | readonly [string, string, string];
  took: string;
  linkLabel: string;
  linkUrl: string;
}

export const CASES: readonly WorkCase[] = [
  {
    id: "puppet",
    title: "Desktop control for AI agents",
    whatItIs:
      "Puppet is a Windows desktop-control server for MCP clients, speaking stdio JSON-RPC in one native binary.",
    whoFor:
      "Built for agent builders; used by AI agents driving real Windows desktops.",
    hardPart:
      "Capture and input had to stay reliable without stealing focus or moving the owner's cursor.",
    shipped: [
      "Six tools cover capture, windows, input, and cursor in one single binary.",
      "Native capture path with a fallback keeps screen reads working across hosts.",
      "Hidden-desktop drive posts input without disturbing the visible session.",
    ],
    took: "Solo builder, one engineer, designed and shipped end to end.",
    linkLabel: "Case study on GitHub",
    linkUrl: "https://github.com/nathwn12/puppet",
  },
  {
    id: "gladius",
    title: "Browser automation agents drive",
    whatItIs:
      "Gladius is a browser-automation server that MCP clients drive directly over CDP via WebSocket.",
    whoFor:
      "Built for agent builders; used by agents that need a real browser they can operate.",
    hardPart:
      "Browser lifecycle and failure cleanup had to be airtight so a bad spawn never leaves survivors.",
    shipped: [
      "Fifteen tools cover pages, snapshots, tabs, uploads, and console capture.",
      "Owned engine lifecycle is spawned and reaped inside the binary.",
      "Guarded teardown kills the whole process tree on startup failure.",
    ],
    took: "Solo builder, one engineer, designed and shipped end to end.",
    linkLabel: "Case study on GitHub",
    linkUrl: "https://github.com/nathwn12/gladius",
  },
  {
    id: "harness-setup",
    title: "Setup agents trust once",
    whatItIs:
      "oc-harness-setup reproduces a full OpenCode harness on a fresh machine in one run.",
    whoFor:
      "Built for developers onboarding to OpenCode; used on first-day machines.",
    hardPart:
      "Re-runs had to repair drift instead of duplicating files, or fresh machines diverge on day two.",
    shipped: [
      "One command lays down agents, commands, skills, and references.",
      "Idempotent re-runs converge instead of duplicating.",
      "A doctor gate blocks a half-wired setup before it starts.",
    ],
    took: "Solo builder, one engineer, designed and shipped end to end.",
    linkLabel: "Case study on GitHub",
    linkUrl: "https://github.com/nathwn12/oc-harness-setup",
  },
  {
    id: "slowburn",
    title: "Practice sessions players keep",
    whatItIs:
      "Slowburn is a Windows music player for slowed and reverb practice with a per-track A-B loop.",
    whoFor:
      "Built for slowed and reverb listeners; used by players looping passages offline.",
    hardPart:
      "Loop points and effect settings had to survive reopening the track, or practice flow breaks.",
    shipped: [
      "A-B loop points live on the seek bar and reapply per track.",
      "Fine-stepped slow and reverb recall per track with one-click reset.",
      "Multi-folder offline library with skins and a mini mode.",
    ],
    took: "Solo builder, one engineer, designed and shipped end to end.",
    linkLabel: "Case study on GitHub",
    linkUrl: "https://github.com/nathwn12/slowburn",
  },
];
