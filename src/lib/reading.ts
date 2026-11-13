/**
 * The reading line — one definition of "where the eye is".
 *
 * Two bands read the scroll position the same way: the projects band names the
 * row at the reading line, and the experience band names the year of the entry
 * at it. Both answers are a pure function of the rows' current viewport
 * positions, recomputed from the live layout on every frame, so neither can
 * show a row that has already gone past — the defect that removed the earlier
 * sticky panel, which latched on a pointer crossing a row and then kept naming
 * it while nine others went by.
 */

/** Where the eye is, as a fraction of the viewport height. */
export const READING_LINE = 0.42;

/**
 * The row currently at the reading line: the last row whose top has passed it.
 * Above the list that is the first row; below it, the last. An empty list has
 * no active row, and returns -1.
 */
export function activeIndexAt(tops: number[], readingLine: number): number {
  if (tops.length === 0) return -1;
  let index = 0;
  for (let position = 0; position < tops.length; position += 1) {
    if (tops[position] <= readingLine) index = position;
  }
  return index;
}
