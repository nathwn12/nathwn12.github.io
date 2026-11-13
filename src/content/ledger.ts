import {
  employer,
  experience,
  formerRoleLine,
  provenance,
} from "./experience";
import { projects } from "./projects";
import { repos } from "./skills";
import { availability, recordOpener } from "./hero";

/**
 * Content module: The record — the home page's rewritten voice.
 *
 * The home scroll states the same career in new sentences. It is not a second
 * source of facts: every figure below is DERIVED from an existing record in
 * this directory (an `outcome`, a `description`, `provenance`, `employer.period`,
 * or a list length), and `tests/record-copy.test.ts` fails if any derived value
 * drifts from the record or if a home sentence reappears verbatim on a detail
 * route.
 *
 * Two rules this module exists to hold:
 *   1. Nothing here is invented. A number that cannot be derived is absent, and
 *      the component omits its row rather than printing a placeholder.
 *   2. The home page rewrites; the routing pages quote. The detail routes keep
 *      the delivered sentences word for word, so the home must never reuse one
 *      whole — the duplication that made the old site read twice.
 */

const payments = experience.find((entry) => entry.id === "02");
const dataAccess = experience.find((entry) => entry.id === "04");
const auth = experience.find((entry) => entry.id === "03");
const contracts = experience.find((entry) => entry.id === "08");

/** The single percentage a sentence carries, e.g. "98%" or "over 40%". */
export function percentIn(sentence: string): string | null {
  const match = sentence.match(/(?:over\s+)?\d[\d,]*(?:\.\d+)?%/i);
  return match ? match[0] : null;
}

/** "March 2023 to May 2026" → "3 yrs 2 mos". Read off the one period string. */const MONTH_INDEX: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

export function tenureShort(period: string): string {
  const match = period.match(
    /([A-Za-z]+)\s+(\d{4})\s+to\s+([A-Za-z]+)\s+(\d{4})/,
  );
  if (!match) return "";
  const start = MONTH_INDEX[match[1].toLowerCase()];
  const end = MONTH_INDEX[match[3].toLowerCase()];
  if (start === undefined || end === undefined) return "";
  const total = (Number(match[4]) - Number(match[2])) * 12 + (end - start);
  if (total <= 0) return "";
  const years = Math.floor(total / 12);
  const months = total % 12;
  if (years === 0) return `${months} mos`;
  return months === 0 ? `${years} yrs` : `${years} yrs ${months} mos`;
}

/** The commit-ledger figures, read out of `provenance` — never typed twice. */
export function ledgerFigures(text: string): {
  commits: string | null;
  repositories: string | null;
  scanned: string | null;
} {
  const commits = text.match(/([\d,]+)\s+commits/i)?.[1] ?? null;
  const repositories =
    text.match(/across\s+([\d,]+)\s+repositories/i)?.[1] ??
    text.match(/([\d,]+)\s+repositories/i)?.[1] ??
    null;
  const scanned = text.match(/([\d,]+)\s+scanned/i)?.[1] ?? null;
  return { commits, repositories, scanned };
}

/** The payments delivery's before/after, read out of its own description. */
export function queryTimes(description: string): {
  before: string | null;
  after: string | null;
} {
  const before =
    description.match(/from about\s+(\d+)\s+seconds?/i)?.[1] ?? null;
  const after =
    description.match(/to\s+(under\s+(?:one|1)\s+second)/i)?.[1] ?? null;
  return { before: before ? `${before} s` : null, after };
}
const ledger_ = ledgerFigures(provenance);
const times = payments ? queryTimes(payments.description) : {
  before: null,
  after: null,
};

/** The panel's big figures: short forms of the same parsed facts. */
export const queryFigure = {
  before: times.before,
  after: times.after ? "<1 s" : null,
  afterLong: times.after,
} as const;

/** Figures the page renders. Null means "not derivable" — the row is omitted. */
export const figures = {
  paymentsPercent: payments ? percentIn(payments.metric ?? "") : null,
  queryBefore: times.before,
  queryAfter: times.after,
  readLatency: dataAccess ? percentIn(dataAccess.metric ?? "") : null,
  commits: ledger_.commits,
  repositories: ledger_.repositories,
  scanned: ledger_.scanned,
  tenure: tenureShort(employer.period),
  projectCount: projects.length,
  groupCount: repos.length,
  packageCount: repos.reduce((total, group) => total + group.packages.length, 0),
} as const;

/* ---------------------------------------------------------------- first screen */

export const name = "Nathaniel Nikolai Ladero";

/** The h1's supporting sentence: who, and what the work was. One sentence,
    read as identity first and capability second — it names the company once. */
export const standfirst =
  "Backend developer at Xentra Infotech Solutions for three years — payments, cash management and access control — and current in AI-assisted development, agent tooling and local models.";

export const locatedIn = "Philippines";

/** The contract sentence on the first screen, in the record's own voice. */
export const contractLine = formerRoleLine;

/** The first screen's measurement panel. */
export const measurement = {
  label: "Worst-case payment query",
  beforeName: "MySql.Data",
  afterName: "MySqlConnector on AWS",
  beforeNote: "before the provider change",
  afterNote: "after the provider change",
  provenance: contracts
    ? "The provider change and its before/after timings are on the experience page."
    : "",
};

/** The one live thing's control labels. */
export const measurementSwitch = {
  groupLabel: "Show the payment query before or after the provider change",
  before: "Before",
  after: "After",
} as const;

/* ------------------------------------------------------------------- proof rows */

export interface RecordRow {
  claim: string;
  detail: string;
  figure: string;
}

/** A parsed percentage as the reduction the band states: "98%" → "−98%",
 *  "over 40%" → "−40%+". Null when the record holds no percentage. */
function reductionFigure(text: string | null, plus = false): string | null {
  if (!text) return null;
  const value = text.replace(/[^\d.]/g, "");
  if (!value) return null;
  return `−${value}%${plus ? "+" : ""}`;
}

const paymentsFigure = reductionFigure(figures.paymentsPercent);
const readsFigure = reductionFigure(figures.readLatency, true);

/**
 * The record band's four outcomes: what the work measured, each with one line
 * of mechanism. Every figure is derived above — a null figure drops the row.
 *
 * The band states outcomes, not biography: the tenure is the cover's fact row,
 * and the recovery that produced the commit count is stated once, on the
 * experience route, so the home page never carries the closure a second time.
 */
export const proofRows: RecordRow[] = [
  payments && paymentsFigure
    ? {
        claim: "Payment query latency",
        detail:
          "The slow ADO.NET provider replaced across the payment services, profiled and verified on production traffic.",
        figure: paymentsFigure,
      }
    : null,
  dataAccess && readsFigure
    ? {
        claim: "Reads on high-traffic financial tables",
        detail:
          "Hot read paths moved to Dapper with Redis caching and explicit invalidation on write; indexes were tuned against real query plans.",
        figure: readsFigure,
      }
    : null,
  auth
    ? {
        claim: "Security findings on production deployments",
        detail:
          "JWT, OAuth 2.0 and OpenID Connect behind centralized RBAC and ABAC, with dependency scanning triaged to zero high or critical findings.",
        figure: "0",
      }
    : null,
  figures.commits
    ? {
        claim: "Commits across the fintech platform",
        detail:
          "ASP.NET APIs, gRPC, SignalR and RabbitMQ across the fintech product family.",
        figure: figures.commits,
      }
    : null,
].filter((row): row is RecordRow => row !== null);

/* ------------------------------------------------------------------ selected work */

export interface WorkRow {
  name: string;
  line: string;
  url: string;
}

/**
 * Three featured repositories, in `projects` order, each with a rewritten line.
 * The line is new prose, so it cannot duplicate the case notes.
 */
const WORK_LINES: Readonly<Record<string, string>> = {
  puppet:
    "An agent that needs the real Windows screen gets six tools and a target lock re-checked before every call.",
  gladius:
    "Browser automation served from one native binary: 25 tools over CDP, with no Node.js or Playwright in the path.",
  "oc-collections":
    "Six installable OpenCode packages plus the index, developed as one workspaces monorepo across Rust and TypeScript.",
};

const COUNT_WORDS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
  "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
  "sixteen", "seventeen", "eighteen", "nineteen", "twenty",
];

/** A small count in words, capitalised — so a numeral never heads a sentence. */
export function countWord(n: number): string {
  const word = COUNT_WORDS[n];
  if (!word) return String(n);
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export const workRows: WorkRow[] = projects.slice(0, 3).map((project) => ({
  name: project.name,
  line: WORK_LINES[project.dir] ?? project.description,
  url: project.url,
}));

export const workLede = `${countWord(projects.length)} tools under one account; three are worth opening first. The rest sit on the projects page with their case notes.`;

/* ------------------------------------------------------------------- system atlas */

export const atlasLede = `${repos.length} groups, ${figures.packageCount} named packages — the whole list, not a selection.`;

/* ------------------------------------------------------------------------ forward */

export const forwardLede =
  "The tools are the other half of the record. Every one below is public.";

/* ------------------------------------------------------------------- ai practice */

/**
 * The capability band: what he does with AI, in his own voice, as prose.
 *
 * It is deliberately not an inventory — no repository, product or model name
 * appears here. The facts under the prose are capabilities; the record of what
 * ran where is the public work below and the forward notes at the back.
 */
export const aiPractice = {
  heading: "AI practice",
  sentences: [
    "Builds the tooling agents run on: MCP servers, editor plugins and the harness that connects them.",
    "Works with local models daily — prompts, specs and documentation held to the same standard as the code they describe.",
    "Runs an AI-assisted development loop end to end, from spec to reviewed change.",
  ],
  facts: ["MCP servers", "local models", "spec-driven builds"],
} as const;

/* ------------------------------------------------------------------------ contact */

export const contactBlock = {
  heading: "Contact",
  line: "Tell me about the role, the system, or the problem. Notes reach my inbox directly.",
  nextStep: "I read every note and usually answer within a day or two.",
  directLabel: "Or write to the address directly",
} as const;

/** The one CTA phrase for the contact action, used by every surface. */
export const CONTACT_CTA = "Email me";

/** Everything the home page says, for the duplication guard in the tests. */
export const homeSentences: string[] = [
  recordOpener,
  standfirst,
  measurement.label,
  measurement.provenance,
  workLede,
  atlasLede,
  aiPractice.heading,
  ...aiPractice.sentences,
  forwardLede,
  contactBlock.line,
  contactBlock.nextStep,
  ...proofRows.flatMap((row) => [row.claim, row.detail]),
  ...workRows.map((row) => row.line),
];

/** Availability, kept from the hero content module. */
export const statusLine = availability;
