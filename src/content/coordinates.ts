import { employer } from "./experience";
import { availability } from "./hero";
import { aiPractice, contactBlock, figures } from "./ledger";
import { signal, specLines } from "./signal";
import { featuredRows, indexRows } from "./showcase";

/**
 * The chapter stamps. One owner for each coordinate value and the one margin
 * note that qualifies it. Both are derived from the committed content modules;
 * nothing here is retyped, and no component formats a figure for display.
 */

export type CoordinateKey = "signal" | "work" | "proof" | "method" | "contact";

export interface Coordinate {
  /** The chapter's one figure, already formatted for display. */
  value: string;
  /** The measured date every chapter shares. */
  date: string;
  /** The single caveat that sits beside the claim. */
  margin: string;
}

const date = signal.snapshotDate;

export const coordinates: Record<CoordinateKey, Coordinate> = {
  signal: {
    value: signal.allTime.toLocaleString("en-US"),
    date,
    margin: `measured ${date} · npm weekly cron 0 6 * * 1`,
  },
  work: {
    value: `${featuredRows.length + indexRows.length} REPOS`,
    date,
    margin: "lifetime counts, not 30-day",
  },
  proof: {
    value: figures.commits ?? "",
    date,
    margin: `${employer.shortName}, ${employer.period}`,
  },
  method: {
    value: `${specLines.length} STEPS`,
    date,
    margin: aiPractice.facts.join(" · "),
  },
  contact: {
    value: availability.split(" ")[0]!.toUpperCase(),
    date,
    margin: contactBlock.nextStep,
  },
};
