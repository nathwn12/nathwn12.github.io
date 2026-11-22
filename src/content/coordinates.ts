import { employer, experience } from "./experience";
import { availability, recordOpener } from "./hero";
import { aiPractice, contactBlock, standfirst } from "./ledger";
import { signal, specLines } from "./signal";
import { featuredRows, indexRows } from "./showcase";

/**
 * The chapter stamps. One owner for each coordinate value and the one margin
 * note that qualifies it. Both are derived from the committed content modules;
 * nothing here is retyped, and no component formats a figure for display.
 */

export type CoordinateKey = "work" | "oss" | "method" | "contact";

export interface Coordinate {
  /** The chapter's one figure, already formatted for display. */
  value: string;
  /** The measured date every chapter shares. */
  date: string;
  /** The single caveat that sits beside the claim. */
  margin: string;
}

const date = signal.snapshotDate;

/** The hero's second beat: the opening claim, then the standfirst's two
 *  sentences. All three lines come from existing copy; nothing is new prose. */
export const coldRead = [recordOpener, ...standfirst.split(/(?<=\.)\s+/)];

export const coordinates: Record<CoordinateKey, Coordinate> = {
  work: {
    value: `${experience.length} ENGAGEMENTS`,
    date,
    margin: `${employer.shortName}, ${employer.period}`,
  },
  oss: {
    value: `${featuredRows.length + indexRows.length} REPOS`,
    date,
    // Display-only: non-breaking hyphens keep the snapshot date whole in the
    // narrow margin. The underlying coordinate `date` stays the raw ISO value.
    margin: `measured ${date.replace(/-/g, "\u2011")} · npm weekly cron 0 6 * * 1`,
  },
  method: {
    value: `${specLines.length} STEPS`,
    date,
    // The note is the short tag; the facts line keeps the full noun forms.
    margin: aiPractice.facts
      .map((fact) => fact.replace(/\s+(servers|builds)$/, ""))
      .join(" · "),
  },
  contact: {
    value: availability.split(" ")[0]!.toUpperCase(),
    date,
    margin: contactBlock.nextStep,
  },
};
