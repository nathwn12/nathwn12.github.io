/**
 * Chapter registry — the ordered spine of the stage.
 *
 * One const table owns each chapter's id and label. There are no booleans and
 * no switch: the row order here is the order the observer reports and the order
 * the stage nav renders. Add a chapter by adding one row; `ChapterId` and `IDS`
 * follow from it.
 */

export const CHAPTERS = [
  { id: "person", label: "Person" },
  { id: "method", label: "Method" },
  { id: "work", label: "Work" },
  { id: "experience", label: "Experience" },
  { id: "contact", label: "Contact" },
] as const;

export type ChapterId = (typeof CHAPTERS)[number]["id"];

/** Derived observer targets and nav keys — never typed by hand. */
export const IDS: readonly ChapterId[] = CHAPTERS.map((chapter) => chapter.id);
