import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

/**
 * The JSON-LD Person block and the head's canonical/Open Graph URLs.
 *
 * Malformed structured data is worse than none — a parser that hits a syntax
 * error drops the whole node — so the block is parsed here exactly as a
 * crawler would parse it, and the fields are checked against the published
 * facts rather than against the page's own markup.
 */

const root = resolve(import.meta.dirname, "..");
const html = readFileSync(resolve(root, "index.html"), "utf8");

function jsonLdBlocks(): unknown[] {
  const blocks = [
    ...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g),
  ];
  return blocks.map((block) => JSON.parse(block[1]));
}

const person = jsonLdBlocks().find(
  (node): node is Record<string, unknown> =>
    typeof node === "object" &&
    node !== null &&
    (node as { "@type"?: unknown })["@type"] === "Person",
);

describe("JSON-LD Person", () => {
  test("index.html carries exactly one well-formed Person block", () => {
    const blocks = jsonLdBlocks();
    expect(blocks).toHaveLength(1);
    expect(person, "no @type: Person node found").toBeDefined();
    expect(person?.["@context"]).toBe("https://schema.org");
  });

  test("identity, contact, and location fields are exact", () => {
    expect(person?.name).toBe("Nathaniel Nikolai Ladero");
    expect(person?.url).toBe("https://nathwn12.github.io/");
    expect(person?.jobTitle).toBe("Backend Developer");
    expect(person?.email).toBe("mailto:nathanielnikolai.ladero@gmail.com");
    expect(person?.image).toBe(
      "https://nathwn12.github.io/og-image-2026-10-28.png",
    );
    expect(person?.address).toMatchObject({
      "@type": "PostalAddress",
      addressLocality: "Hagonoy",
      addressRegion: "Bulacan",
      addressCountry: "Philippines",
    });
    expect(person?.sameAs).toEqual([
      "https://github.com/nathwn12",
      "https://www.linkedin.com/in/nathaniel-nikolai-l-184181261/",
    ]);
  });

  test("states the confirmed availability as a Demand, without commercial stock vocabulary", () => {
    /* `InStock` is stock availability for goods, not a person's availability
       for work. It must never appear on this node again, and the description is
       the confirmed remote sentence verbatim (em dash included). */
    expect(person?.seeks).toMatchObject({ "@type": "Demand" });
    expect(person?.seeks).not.toHaveProperty("availability");
    const seeks = person?.seeks as { description?: string };
    expect(seeks.description).toBe("Open to backend roles \u2014 remote.");
  });

  test("does not claim current employment at the closed company", () => {
    /* schema.org `worksFor` means the organization the person works for NOW.
       Xentra closed in May 2026, so any worksFor node would assert present
       employment at a defunct company. The true history lives in prose. */
    expect(person).not.toHaveProperty("worksFor");

    const description = String(person?.description);
    expect(description).toContain(
      "was a Backend Developer at Xentra Infotech Solutions Inc. from March 2023 to May 2026",
    );
    expect(description).toContain("closed in May 2026");

    // Occupation only — no employer is attached to it.
    expect(person?.hasOccupation).toEqual({
      "@type": "Occupation",
      name: "Backend Developer",
    });

    expect(person?.alumniOf).toMatchObject({
      "@type": "CollegeOrUniversity",
      name: "La Consolacion University Philippines",
    });
  });

  test("carries all four credential names and IDs", () => {
    const credentials = person?.hasCredential as Array<{
      name: string;
      identifier: string;
    }>;
    expect(credentials).toHaveLength(4);
    expect(credentials.map((c) => c.identifier).sort()).toEqual([
      "FA69CEB39205E003",
      "FC46A72A0806A19E",
      "NEBB575RT5LU",
      "RFS2G5ZT9GPK",
    ]);
    for (const credential of credentials) {
      expect(credential.name.length).toBeGreaterThan(3);
    }
  });

  test("lists the real stack and both spoken languages", () => {
    const knowsAbout = person?.knowsAbout as string[];
    for (const skill of [
      "C#",
      "ASP.NET Core",
      ".NET",
      "REST",
      "microservices",
      "EF Core",
      "MySQL",
      "MariaDB",
      "Redis",
      "RabbitMQ",
      "AWS",
      "Docker",
      "JWT",
      "OAuth 2.0",
      "OpenID Connect",
      "RBAC",
      "ABAC",
    ]) {
      expect(knowsAbout, skill).toContain(skill);
    }
    expect(person?.knowsLanguage).toEqual([
      { "@type": "Language", name: "English" },
      { "@type": "Language", name: "Filipino" },
    ]);
  });
});

describe("canonical and Open Graph URLs", () => {
  test("canonical and og:url agree, with the trailing slash", () => {
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    const ogUrl = html.match(/<meta property="og:url" content="([^"]+)"/)?.[1];
    expect(canonical).toBe("https://nathwn12.github.io/");
    expect(ogUrl).toBe(canonical);
  });

  test("the structured-data image and the Open Graph image are one card", () => {
    /* A link preview and a rich result must not advertise two different
       pictures; the dated file is the only social card emitted now. */
    const ogImage = html.match(
      /<meta property="og:image" content="([^"]+)"/,
    )?.[1];
    expect(ogImage).toBe("https://nathwn12.github.io/og-image-2026-10-28.png");
    expect(person?.image).toBe(ogImage);
  });
});
