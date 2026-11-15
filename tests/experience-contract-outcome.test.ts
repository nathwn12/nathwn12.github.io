import { describe, expect, test } from "vitest";
import { experience } from "../src/content/experience";

describe("experience entries follow the supported role periods", () => {
  test("the three entries map to the three employment stages", () => {
    expect(experience.map(({ date, status }) => [date, status])).toEqual([
      ["June 2024 – May 2026", "Backend Developer"],
      ["June 2023 – May 2024", "Junior Backend Developer"],
      ["March 2023 – June 2023", "Backend Developer Intern"],
    ]);
  });

  test("payment improvement and authentication remain attached to the senior role", () => {
    const senior = experience[0];
    expect(senior.outcome).toMatch(/60 seconds to under one second/);
    expect(senior.highlights.join(" ")).toMatch(/JWT.*OAuth 2\.0.*OpenID Connect/);
  });

  test("no entry asserts unsupported release, observability, or mentoring detail", () => {
    const content = JSON.stringify(experience).toLowerCase();
    expect(content).not.toMatch(/dry.?run|nginx|let's encrypt|ufw|serilog|runbook|mentoring/);
    expect(content).not.toContain("coordinated release");
  });
});
