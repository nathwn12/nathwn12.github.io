import { employer, experience, spineDate, tenureSpan } from "./experience";
import { availability, recordOpener } from "./hero";
import { contactBlock, standfirst } from "./ledger";
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
  /** The fuller form, shown only where it holds one line. */
  marginLong?: string;
  /** The measured cron, kept whole in its own nowrap span. */
  cron?: string;
}

const date = signal.snapshotDate;
const periodYears = employer.period.match(/\d{4}/g) ?? [];

/** The hero's second beat: the opening claim, then the standfirst's two
 *  sentences. All three lines come from existing copy; nothing is new prose. */
export const coldRead = [recordOpener, ...standfirst.split(/(?<=\.)\s+/)];

export const coordinates: Record<CoordinateKey, Coordinate> = {
  work: {
    value: `${experience.length} ENGAGEMENTS`,
    date,
    margin: `${employer.shortName} · ${periodYears.join(" – ")}`,
    marginLong: `${employer.shortName} · ${spineDate(tenureSpan)}`,
  },
  oss: {
    value: `${featuredRows.length + indexRows.length} REPOS`,
    date,
    // Display-only: non-breaking hyphens keep the snapshot date whole in the
    // narrow margin. The underlying coordinate `date` stays the raw ISO value.
    margin: `measured ${date.replace(/-/g, "\u2011")} · npm weekly cron`,
    cron: "0 6 * * 1",
  },
  method: {
    value: `${specLines.length} STEPS`,
    date,
    // Intentionally bare: the facts line below the prose already says this.
    margin: "",
  },
  contact: {
    value: availability.split(" ")[0]!.toUpperCase(),
    date,
    margin: contactBlock.nextStep,
  },
};
