import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { credentials } from "../src/content/credentials";
import { employer, experience, provenance } from "../src/content/experience";
import { availability } from "../src/content/hero";
import { figures, proofRows } from "../src/content/ledger";
import { projects } from "../src/content/projects";
import { repos } from "../src/content/skills";
import { CV_PATH, RESUME_PATH } from "../src/lib/contact";

/**
 * The fact floor — the numbers, dates, names and documents this site is not
 * allowed to get wrong, pinned at the source and at the emitted build.
 *
 * Every value here comes from the delivered record. The redesign rewrites
 * voice; it never moves a figure. If a rewrite drifts one of these, the page is
 * wrong in the way that costs an interview, so the check is a hard equality
 * rather than a substring match on rendered prose.
 */

const root = resolve(import.meta.dirname, "..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

describe("the availability sentence", () => {
  const EXPECTED = "Open to backend roles \u2014 remote.";

  test("is the confirmed string, with an em dash", () => {
    expect(availability).toBe(EXPECTED);
    expect(availability).toContain("\u2014");
    expect(availability).not.toContain(" - ");
  });

  test("appears byte-identically in llms.txt", () => {
    expect(read("public/llms.txt")).toContain(EXPECTED);
  });

  test("appears byte-identically in the Person JSON-LD", () => {
    const html = read("index.html");
    const block = html.match(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
    )?.[1];
    expect(block).toBeDefined();
    const person = JSON.parse(block!) as {
      seeks: { description: string };
    };
    expect(person.seeks.description).toBe(EXPECTED);
  });

  test("no surface still says open to work", () => {
    for (const file of [
      "public/llms.txt",
      "index.html",
      "src/content/hero.ts",
      "src/content/ledger.ts",
      "src/components/Contact.tsx",
      "src/components/FirstScreen.tsx",
    ]) {
      expect(read(file).toLowerCase(), file).not.toMatch(/open to work/);
    }
  });
});

describe("employment", () => {
  test("the company, role and period are exact", () => {
    expect(employer.company).toBe("Xentra Infotech Solutions Inc.");
    expect(employer.role).toBe("Backend Developer");
    expect(employer.location).toBe("Remote");
    expect(employer.period).toBe("March 2023 to May 2026");
  });

  test("the nine dated records are unchanged, newest first", () => {
    expect(experience).toHaveLength(9);
    expect(experience[0].date).toBe("November 2025");
    expect(experience.map((entry) => entry.date)).toEqual([
      "November 2025",
      "September 2025",
      "March 2025",
      "January 2025",
      "November 2024",
      "August 2024",
      "May 2024",
      "January 2024",
      "April 2023",
    ]);
  });

  test("the closure is stated in the past", () => {
    expect(provenance).toContain("after Xentra closed in May 2026");
    expect(provenance).toContain("1,182 commits across 17 repositories");
  });
});

describe("the figures", () => {
  test("60 seconds to under 1 second", () => {
    expect(figures.queryBefore).toBe("60 s");
    expect(figures.queryAfter).toMatch(/under (one|1) second/);
  });

  test("98% payments, over 40% reads", () => {
    expect(figures.paymentsPercent).toBe("98%");
    expect(figures.readLatency).toBe("over 40%");
  });

  test("1,182 commits, 17 repositories, 21 scanned", () => {
    expect(figures.commits).toBe("1,182");
    expect(figures.repositories).toBe("17");
    expect(figures.scanned).toBe("21");
  });

  test("eleven projects and 88 packages", () => {
    expect(projects).toHaveLength(11);
    expect(figures.projectCount).toBe(11);
    expect(repos).toHaveLength(6);
    expect(figures.packageCount).toBe(88);
  });

  test("the four proof rows state only derived figures", () => {
    expect(proofRows).toHaveLength(4);
    expect(proofRows.map((row) => row.figure)).toEqual([
      "over 40%",
      "0",
      "1,182",
      "3 yrs 2 mos",
    ]);
  });
});

describe("credentials and education", () => {
  test("the four credential IDs are exact", () => {
    expect(credentials.map((credential) => credential.id).sort()).toEqual([
      "FA69CEB39205E003",
      "FC46A72A0806A19E",
      "NEBB575RT5LU",
      "RFS2G5ZT9GPK",
    ]);
  });

  test("the degree and school are exact", () => {
    const html = read("index.html");
    expect(html).toContain("La Consolacion University Philippines");
    expect(read("public/llms.txt")).toContain(
      "La Consolacion University Philippines — BS Information Technology, 2019 to 2023.",
    );
  });
});

describe("the two documents", () => {
  test("their URLs are the site-root PDFs", () => {
    expect(RESUME_PATH).toBe("/Nathaniel-Nikolai-Ladero-Resume.pdf");
    expect(CV_PATH).toBe("/Nathaniel-Nikolai-Ladero-CV.pdf");
  });

  test("both ship in the build and are linked from llms.txt", () => {
    expect(existsSync(resolve(root, "dist", RESUME_PATH.slice(1)))).toBe(true);
    expect(existsSync(resolve(root, "dist", CV_PATH.slice(1)))).toBe(true);
    const llms = read("public/llms.txt");
    expect(llms).toContain(`https://nathwn12.github.io${RESUME_PATH}`);
    expect(llms).toContain(`https://nathwn12.github.io${CV_PATH}`);
  });
});

describe("the contact relay stays retired", () => {
  const sources = [
    "src/components/Contact.tsx",
    "src/lib/contact.ts",
    "src/lib/routes.ts",
    "src/components/Record.tsx",
    "index.html",
  ];

  test("no Web3Forms endpoint, key or form anywhere in the shipped sources", () => {
    for (const file of sources) {
      const source = read(file).toLowerCase();
      expect(source, file).not.toContain("web3forms");
      expect(source, file).not.toContain("20dbb29b");
    }
  });

  test("the contact band offers mailto, no form, and no repeated documents", () => {
    const contact = read("src/components/Contact.tsx");
    expect(contact).toContain("mailto:");
    expect(contact).not.toContain("<form");
    expect(contact).not.toContain("<input");
    expect(contact).not.toContain("<textarea");
    // The pair lives on the cover (`/`) and in the footer on the detail routes;
    // the closing viewport used to carry a third copy.
    expect(contact).not.toContain("RESUME_PATH");
    expect(contact).not.toContain("CV_PATH");
    expect(contact).not.toContain("documentBlock");
  });

  test("the relay's confirmation route is retired, not a live page", () => {
    expect(read("src/App.tsx")).not.toContain("Thanks");
    expect(existsSync(resolve(root, "src", "components", "Thanks.tsx"))).toBe(
      false,
    );
    expect(read("src/lib/routes.ts")).toContain('path: "/thanks"');
  });
});
