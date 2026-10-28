import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const root = resolve(import.meta.dirname, "..");
const resumeName = "Nathaniel-Nikolai-Ladero-Resume.pdf";
const cvName = "Nathaniel-Nikolai-Ladero-CV.pdf";

describe("portfolio regressions", () => {
  test("production build ships the resume and CV downloads", () => {
    expect(existsSync(resolve(root, "dist", resumeName))).toBe(true);
    expect(existsSync(resolve(root, "dist", cvName))).toBe(true);
  });

  test("programmatically focused main landmark does not paint a chrome outline", () => {
    const css = readFileSync(resolve(root, "src", "index.css"), "utf8");
    expect(css).toMatch(/#main:focus\s*\{[\s\S]*?outline:\s*none/);
  });
});
