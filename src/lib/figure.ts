/**
 * Figures — a delivered figure string, taken apart so it can be counted.
 *
 * The record band counts its four figures from one scroll-driven tween. To do
 * that it needs each figure as a number plus the marks that make it a fact
 * ("−98%" is a sign, a count and a unit), and it needs to be able to render a
 * count in progress without ever printing a bare "−" or "−0%". The parts are
 * parsed from the delivered string, never typed into a component, so the count
 * cannot drift from the fact it is counting.
 */

export interface FigureParts {
  /** Everything before the number: the minus sign, usually nothing. */
  prefix: string;
  /** The number itself, as a value. */
  value: number;
  /** Everything after the number: the unit and any qualifier. */
  suffix: string;
  /** Whether the delivered figure groups its thousands with commas. */
  grouped: boolean;
}

/** "−98%" → sign, 98, "%". "1,182" → 1182, grouped. */
export function figureParts(figure: string): FigureParts {
  const match = /^([^\d]*)([\d,]+)(.*)$/.exec(figure);
  if (!match) return { prefix: "", value: 0, suffix: figure, grouped: false };
  const [, prefix, digits, suffix] = match;
  return {
    prefix,
    value: Number(digits.replace(/,/g, "")),
    suffix,
    grouped: digits.includes(","),
  };
}

/**
 * The figure at some point of its count. A count that has not started renders
 * as a plain "0" rather than "−0%": a sign in front of a zero is not a smaller
 * number, it is a wrong one.
 */
export function renderFigure(parts: FigureParts, value: number): string {
  const rounded = Math.round(value);
  if (rounded === 0) return "0";
  const digits = parts.grouped
    ? rounded.toLocaleString("en-US")
    : String(rounded);
  return `${parts.prefix}${digits}${parts.suffix}`;
}
