import { z } from "zod";

/**
 * Content module: Forward — the back of the document. AI, forward feats,
 * development, and learning, in that order.
 *
 * This is where the removed `experience` entry "06" (AI-assisted development
 * workflow) now lives, with the same substance: LM Studio, OpenCode, Codex,
 * local open-weight models, prompt libraries, investigative coding. The
 * "feats" and "learning" items follow strictly from the repo's own record —
 * the public repositories in src/content/projects.ts and the package notes in
 * src/content/skills.ts — with no new metrics and no hype.
 *
 * Validation choice: a local zod schema defined and checked here at module
 * load, the same fail-fast shape as the other content modules. No new model
 * was added to src/types/models.ts because no shared domain primitive is
 * involved — this module's items are page copy with a section tag, not a
 * cross-route entity — so a file-local schema keeps the projection valid
 * without forcing model work.
 */

export const ForwardItemSchema = z.object({
  /** Stable id, never rendered. */
  id: z.string(),
  /** Which back-of-document section the item belongs to. */
  section: z.enum(["workflow", "feat", "learning"]),
  /** Item heading, sentence case. */
  title: z.string(),
  /** One or two honest sentences, grounded in the repo's own record. */
  body: z.string(),
  /** Code-adjacent identifiers, real casing, rendered as Line-bordered chips. */
  tech: z.array(z.string()),
});

export type ForwardItem = z.infer<typeof ForwardItemSchema>;

export const forwardHeading = "Forward";

export const forward: ForwardItem[] = [
  {
    id: "fw-workflow",
    section: "workflow",
    title: "AI-assisted development workflow",
    body: "Uses LM Studio, OpenCode, and Codex daily for coding, refactoring, investigative development, and prompt engineering. Works with preferred local models including DeepSeek V4 Flash (9B, MTP), Gemma 4 (26B, A4B), and Qwen 3.8 (35B, A3B) for local LLM workflows, keeping prompts and code off hosted services. Investigation and refactoring happen without a network round trip, supported by reusable prompt libraries for review, migration, and test scaffolding.",
    tech: [
      "LM Studio",
      "OpenCode",
      "Codex",
      "DeepSeek V4 Flash (9B, MTP)",
      "Gemma 4 (26B, A4B)",
      "Qwen 3.8 (35B, A3B)",
    ],
  },
  {
    id: "fw-mcp",
    section: "feat",
    title: "MCP tool servers shipped",
    body: "Puppet drives Windows desktop control and Gladius drives headless Chrome, each served over MCP from a native binary. The rea-shim launcher serves the upstream rea reverse-engineering tools over MCP from one launch line.",
    tech: ["Puppet", "Gladius", "rea-shim", "MCP"],
  },
  {
    id: "fw-plugins",
    section: "feat",
    title: "OpenCode plugin builds",
    body: "Flight Deck renders live session telemetry as a configurable TUI sidebar, and Bifrost bridges V1-era plugin hooks onto the OpenCode V2 runtime.",
    tech: ["OpenCode plugin API", "TypeScript", "JSONC"],
  },
  {
    id: "fw-spec",
    section: "learning",
    title: "Spec-driven development",
    body: "Plan-first assisted builds: the change is specified before the agent writes it, the same discipline the contract tests enforce on the API side.",
    tech: ["Spec-Driven Development", "Prompt Libraries"],
  },
  {
    id: "fw-local",
    section: "learning",
    title: "Local-model workflows",
    body: "Investigative coding and refactoring against local open-weight models, with prompts evaluated against the real repository instead of a good-looking sample.",
    tech: ["Local LLM Workflows", "Investigative Coding"],
  },
];

const forwardValidation = ForwardItemSchema.array().safeParse(forward);
if (!forwardValidation.success) {
  throw new Error(
    "content/forward.ts: Forward data failed schema validation: " +
      forwardValidation.error.issues.map((issue) => issue.message).join("; "),
  );
}
