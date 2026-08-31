// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const root = resolve(import.meta.dirname, "..");
// Facts + derivation consts moved to the content module (Q2); the component
// keeps the JSX strings that render them.
const educationContent = readFileSync(
  resolve(root, "src", "content", "education.ts"),
  "utf8",
);
const education = readFileSync(
  resolve(root, "src", "components", "Education.tsx"),
  "utf8",
);
const footprint = readFileSync(
  resolve(root, "src", "components", "Footprint.tsx"),
  "utf8",
);

const dash = "\u2013";

describe("education and footprint invariants", () => {
  test("preserves the education timeline and certification facts", () => {
    const timelineFacts = [
      'year: "2017"',
      'label: "STEM STRAND"',
      'school: "La Consolacion University Philippines"',
      'desc: "Science, Technology, Engineering and Mathematics · 2017–2019"',
      'year: "2019"',
      'label: "BS INFORMATION TECHNOLOGY"',
      'desc: "Bachelor of Science in Information Technology · 2019–2023"',
      'year: "2023"',
      'label: "CERTIFICATIONS WAVE"',
      'school: "Coursera · APIsec University"',
      'desc: "Google IT Automation with Python · Google IT Support · API Security Fundamentals · OWASP API Security Top 10"',
    ];
    const certificationFacts = [
      [
        "Google IT Automation with Python",
        "Coursera",
        "RFS2G5ZT9GPK",
        "https://www.coursera.org/share/3ca99757aef54a931fa0ffdafd7e6a04",
      ],
      [
        "Google IT Support",
        "Coursera",
        "NEBB575RT5LU",
        "https://www.coursera.org/share/0ed5c57a2de3e858c4629cc9f209b99f",
      ],
      [
        "API Security Fundamentals",
        "FA69CEB39205E003",
        "Aug 2023",
        "https://www.credly.com/badges/66cf7672-0ef2-4f94-8e17-b3bc6263b364/public_url",
      ],
      [
        "OWASP API Security Top 10",
        "FC46A72A0806A19E",
        "Aug 2023",
        "https://www.credly.com/badges/8aeb5515-665f-4c0a-bfe6-640c314f1311/public_url",
      ],
    ];

    for (const fact of timelineFacts) {
      expect(educationContent).toContain(fact);
    }
    for (const [title, issuerOrId, idOrDate, url] of certificationFacts) {
      expect(educationContent).toContain(`title: "${title}"`);
      if (title.startsWith("API") || title.startsWith("OWASP")) {
        expect(educationContent).toContain(`id: "${issuerOrId}"`);
        expect(educationContent).toContain(`date: "${idOrDate}"`);
        expect(educationContent).toContain(`url: "${url}"`);
      } else {
        expect(educationContent).toContain(`issuer: "${issuerOrId}"`);
        expect(educationContent).toContain(`id: "${idOrDate}"`);
        expect(educationContent).toContain(`url: "${url}"`);
      }
    }
  });

  test("derives education aggregate labels from their arrays", () => {
    expect(educationContent).toMatch(
      /const milestoneCount = timeline\.length/,
    );
    expect(educationContent).toMatch(
      /const credentialCount = certifications\.length/,
    );
    expect(education).toMatch(
      /\{milestoneCount\} milestones \/ \{credentialCount\} credentials/,
    );
    expect(education).toContain("{milestoneCount} EVENTS");
    expect(education).toContain("{credentialCount} LINKS");
  });

  test("preserves footprint ledger facts and totals", () => {
    const yearlyCounts = [245, 495, 412, 30];
    const repositoryCounts = [844, 78, 68, 48, 144];

    for (const fact of [
      'year: "2023"',
      'year: "2024"',
      'year: "2025"',
      'year: "2026"',
      "First tracked backend delivery year.",
      "Highest output across core fintech services.",
      "Strong sustained delivery across payments and controls.",
      "Latest visible pushed work before portfolio handoff.",
    ]) {
      expect(footprint).toContain(fact);
    }
    for (const count of [...yearlyCounts, ...repositoryCounts]) {
      expect(footprint).toContain(`count: ${count}`);
    }
    expect(yearlyCounts.reduce((total, count) => total + count, 0)).toBe(1182);
    expect(repositoryCounts.reduce((total, count) => total + count, 0)).toBe(
      1182,
    );
    for (const fact of [
      "Payment Processing API",
      "Cash Management Service",
      "Teller Integration Platform",
      "Access Control Microservice",
      "Supporting Systems",
      "Jul 2023 – Mar 2026",
      "Dec 2023 – Dec 2025",
      "Dec 2024 – Sep 2025",
      "Mar 2024 – Dec 2025",
      "Merchant integrations, compliance, reporting",
    ]) {
      expect(footprint).toContain(fact);
    }
  });

  test("derives footprint summary values from factual sources", () => {
    expect(footprint).toMatch(/const totalCommitCount = yearCommits\.reduce\(/);
    expect(footprint).toMatch(/\{formatCount\(totalCommitCount\)\}/);
    expect(footprint).toMatch(/MAX \{formatCount\(largestYearCommitCount\)\}/);
    expect(footprint).toMatch(
      /MAX \{formatCount\(largestRepositoryCommitCount\)\}/,
    );
    expect(footprint).toMatch(/const matchedRepositoryCount = 17/);
    expect(footprint).toMatch(/\{formatCount\(matchedRepositoryCount\)\}/);
    expect(footprint).toMatch(new RegExp(`2023 ${dash} 2026`));
    expect(footprint).not.toContain("2023 - 2026");
    expect(footprint).not.toContain("1,182");
    expect(footprint).not.toContain("MAX 495");
    expect(footprint).not.toContain("MAX 844");
  });
});