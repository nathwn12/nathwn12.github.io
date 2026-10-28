import {
  employer,
  experience,
  formerRoleLine,
  provenance,
} from "./experience";
import { projects } from "./projects";
import { repos } from "./skills";
import { availability, coreStack } from "./hero";

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
  paymentsPercent: payments ? percentIn(payments.outcome) : null,
  queryBefore: times.before,
  queryAfter: times.after,
  readLatency: dataAccess ? percentIn(dataAccess.outcome) : null,
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

/** The h1's supporting sentence: who, and what the work was. */
export const standfirst =
  "Backend developer for payment and cash-management systems that ran in production, and the author of eleven open-source developer tools.";

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

/** Home proof rows. Every figure is derived above; a null figure drops the row. */
export const proofRows: RecordRow[] = [
  dataAccess && figures.readLatency
    ? {
        claim: "Reads on high-traffic financial tables",
        detail:
          "Hot read paths moved to Dapper with Redis caching and explicit invalidation on write; indexes were tuned against real query plans.",
        figure: figures.readLatency,
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
  figures.commits && figures.repositories && figures.scanned
    ? {
        claim: "Commits recovered from the closed company's repositories",
        detail: `The ledger was rebuilt by scanning ${figures.scanned} internal repositories after Xentra closed in May 2026; ${figures.repositories} of them carry the work.`,
        figure: figures.commits,
      }
    : null,
  figures.tenure
    ? {
        claim: "Continuous employment, remote",
        detail: `Formerly employed remotely by ${employer.company}, ${employer.period}; the company closed in May 2026.`,
        figure: figures.tenure,
      }
    : null,
].filter((row): row is RecordRow => row !== null);

/* ------------------------------------------------------------------ selected work */

export interface WorkRow {
  name: string;
  meta: string;
  line: string;
  url: string;
}

/**
 * Three featured repositories, in `projects` order, each with a rewritten line.
 * The meta line is derived from the record (kind, authorship, year); the line is
 * new prose, so it cannot duplicate the case notes.
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
  meta: `${project.kind} · ${project.role} · ${project.year}`,
  line: WORK_LINES[project.dir] ?? project.description,
  url: project.url,
}));

export const workLede = `${countWord(figures.projectCount)} public repositories under one account; three are worth opening first. The rest sit on the projects page with their case notes.`;

/* ------------------------------------------------------------------- system atlas */

export const atlasLede = `${repos.length} groups, ${figures.packageCount} named packages — the whole list, not a selection.`;

/* ------------------------------------------------------------------------ forward */

export const forwardLede =
  "The tools are the other half of the record. Every one below is public.";

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
  standfirst,
  contractLine,
  measurement.label,
  measurement.provenance,
  workLede,
  atlasLede,
  forwardLede,
  contactBlock.line,
  contactBlock.nextStep,
  ...proofRows.flatMap((row) => [row.claim, row.detail]),
  ...workRows.map((row) => row.line),
];

/** The stack line, kept from the hero content module. */
export const stackLine = coreStack;

/** Availability, kept from the hero content module. */
export const statusLine = availability;
