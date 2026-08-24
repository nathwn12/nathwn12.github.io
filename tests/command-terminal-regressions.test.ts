import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("command terminal lifecycle", () => {
  test("re-arms delayed command work when the mount effect runs again", () => {
    const source = readFileSync(
      resolve(root, "src", "components", "CommandTerminal.tsx"),
      "utf8",
    );

    expect(source).toMatch(
      /useEffect\(\(\) => \{\s*activeRef\.current = true;\s*return \(\) => \{\s*activeRef\.current = false;/,
    );
  });
});
