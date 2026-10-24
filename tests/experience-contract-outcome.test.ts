/**
 * API contract outcome — the one sentence the pull quote spends the page on.
 *
 * `Hero.tsx`'s pull quote renders experience entry `08`'s `outcome` verbatim at
 * display size in a 30ch measure, so this string is not body copy: it is the
 * landing's single display-size claim. The previous wording
 * ("Stabilized a public contract so downstream services upgraded without a
 * coordinated release.") ran to four display lines and led with release-process
 * jargon, which read as chaos rather than calm (owner review, 2026-10-24).
 *
 * The rewrite keeps BOTH claims and their strength — the public API contract
 * was stabilized, and downstream services did upgrade independently, which is
 * what "without a coordinated release" meant — and drops the jargon. Nothing
 * here may soften "upgraded" to "could upgrade": that would take an
 * accomplishment and turn it into a possibility.
 *
 * Every assertion below can go red:
 *
 *   pnpm vitest run tests/experience-contract-outcome.test.ts
 */
import { describe, expect, test } from "vitest";
import { experience } from "../src/content/experience";

const entry = experience.find((item) => item.id === "08");
const outcome = entry?.outcome ?? "";

/** The approved sentence: ten words, one clause pair, no release jargon. */
const approved =
  "Stabilized the public API contract so downstream services upgraded independently.";

describe("the API contract outcome holds the pull quote", () => {
  test("entry 08 still carries the accomplishment, not an empty or missing claim", () => {
    expect(entry, "the pull quote reads experience entry 08").toBeTruthy();
    expect(outcome.trim(), "the outcome sentence is blank").not.toBe("");
  });

  test("it renders the approved concise sentence", () => {
    expect(outcome, "the pull quote's sentence changed unexpectedly").toBe(
      approved,
    );
  });

  test("both claims survive, in the site's direct voice", () => {
    // Claim one: the public API contract was stabilized.
    expect(outcome).toMatch(/^Stabilized the public API contract\b/);
    // Claim two at full strength: downstream services DID upgrade...
    expect(outcome).toMatch(/\bdownstream services upgraded\b/);
    expect(
      outcome,
      "softening 'upgraded' to a possibility drops the accomplishment",
    ).not.toMatch(/\b(could|can|would)\b/);
    // ...independently — the plain-words form of "without a coordinated release".
    expect(outcome).toMatch(/\bindependently\.$/);
  });

  test("the release-management jargon is gone, not restated", () => {
    expect(outcome).not.toMatch(/coordinated release/i);
  });

  test("it fits three display lines of the pull quote's 30ch measure", () => {
    // 30ch measure at display size: 84 characters is the three-line ceiling.
    // The previous wording needed four lines there.
    expect(outcome.length).toBeLessThanOrEqual(84);
    expect(outcome.split(/\s+/).length).toBeLessThanOrEqual(12);
  });

  test("the mechanism that backs the claim stays adjacent in the entry", () => {
    const description = entry?.description ?? "";
    expect(
      description,
      "the outcome's evidence is the versioned-contract description",
    ).toMatch(/versioned/i);
    expect(description).toMatch(/compatibility policy/i);
  });
});
