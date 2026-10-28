import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import { describe, expect, test } from "vitest";
import { ROUTES } from "../src/lib/routes";

/**
 * The social card: one dark, cache-busted artefact, emitted by every route.
 *
 * The card is cache-busted by its date in the filename, so a crawler that
 * already holds the October light card is pointed at a new URL instead of the
 * same URL with different pixels. The file is committed under public/ and
 * copied into dist/ by Vite; the prerender script copies index.html's head to
 * every route, so the assertions below check the source document, every emitted
 * live route, the 404, and the bytes of the image itself.
 *
 * The pixel checks read the card's real ground and accent through sharp, so a
 * card generated from the wrong palette (the retired light tokens, an invented
 * hex) fails here even though its dimensions are right. The sampled points sit
 * on solid rectangles, not on antialiased text.
 */

const root = resolve(import.meta.dirname, "..");
const CARD_URL = "https://nathwn12.github.io/og-image-2026-10-28.png";
const CARD_FILE = "og-image-2026-10-28.png";
const LEGACY_FILE = "og-image-2026-10.png";
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const DARK = {
  bg: [16, 19, 21], // #101315
  text: [236, 235, 229], // #ecebe5
  accent: [142, 230, 216], // #8ee6d8
  surface2: [35, 40, 43], // #23282b
} as const;

const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

function distHtml(routePath: string): string {
  const file =
    routePath === "/"
      ? resolve(root, "dist", "index.html")
      : resolve(root, "dist", routePath.slice(1), "index.html");
  return readFileSync(file, "utf8");
}

function attr(html: string, pattern: RegExp): string | null {
  return html.match(pattern)?.[1] ?? null;
}

const metaName = (html: string, name: string) =>
  attr(html, new RegExp(`<meta name="${name}" content="([^"]*)"`));
const metaProperty = (html: string, property: string) =>
  attr(html, new RegExp(`<meta property="${property}" content="([^"]*)"`));

/** A PNG's exact pixel dimensions, read from the IHDR chunk. */
function pngSize(file: string): { width: number; height: number } {
  const bytes = readFileSync(file);
  expect(bytes.subarray(0, 8).equals(PNG_SIGNATURE), `${file} is not a PNG`).toBe(
    true,
  );
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

async function pixel(file: string, x: number, y: number) {
  const { data, info } = await sharp(file)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const at = (y * info.width + x) * info.channels;
  return [data[at], data[at + 1], data[at + 2]];
}

describe("the card source document", () => {
  const html = read("index.html");

  test("both social images are the dated dark card", () => {
    expect(metaProperty(html, "og:image")).toBe(CARD_URL);
    expect(metaName(html, "twitter:image")).toBe(CARD_URL);
  });

  test("carries the alt text, the exact size, and the large-card type", () => {
    const alt = metaProperty(html, "og:image:alt");
    expect(alt).toContain("Nathaniel Nikolai Ladero");
    expect(alt!.length).toBeGreaterThan(80);
    expect(metaName(html, "twitter:image:alt")).toBe(alt);
    expect(metaProperty(html, "og:image:width")).toBe("1200");
    expect(metaProperty(html, "og:image:height")).toBe("630");
    expect(metaName(html, "twitter:card")).toBe("summary_large_image");
  });

  test("the Person JSON-LD image is the same card", () => {
    const block = html.match(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
    )?.[1];
    const person = JSON.parse(block!) as { image: string };
    expect(person.image).toBe(CARD_URL);
  });
});

describe("every emitted route head points at the dated card", () => {
  test.each(ROUTES.map((route) => [route.path] as const))(
    "dist%s carries the card with alt, size, and type",
    (routePath) => {
      const html = distHtml(routePath);
      expect(metaProperty(html, "og:image"), routePath).toBe(CARD_URL);
      expect(metaName(html, "twitter:image"), routePath).toBe(CARD_URL);
      expect(metaProperty(html, "og:image:alt"), routePath).toContain(
        "Nathaniel Nikolai Ladero",
      );
      expect(metaName(html, "twitter:image:alt"), routePath).toBe(
        metaProperty(html, "og:image:alt"),
      );
      expect(metaProperty(html, "og:image:width"), routePath).toBe("1200");
      expect(metaProperty(html, "og:image:height"), routePath).toBe("630");
      expect(metaName(html, "twitter:card"), routePath).toBe(
        "summary_large_image",
      );
    },
  );

  test("the 404 keeps the card but the retired stubs do not advertise one", () => {
    expect(metaProperty(read("dist/404.html"), "og:image")).toBe(CARD_URL);
    for (const retired of ["skills", "contact", "thanks"]) {
      const html = read(`dist/${retired}/index.html`);
      expect(html, `${retired} has an og:image`).not.toContain("og:image");
    }
  });

  test("no emitted head still points at the legacy October card", () => {
    for (const file of [
      "dist/index.html",
      "dist/experience/index.html",
      "dist/projects/index.html",
      "dist/404.html",
    ]) {
      expect(read(file), file).not.toContain(LEGACY_FILE);
      expect(read(file), file).not.toContain("og-image-2026-10.png");
    }
  });
});

describe("the card file", () => {
  test("ships in public/ and in the built dist/ at exactly 1200x630", () => {
    for (const file of [
      resolve(root, "public", CARD_FILE),
      resolve(root, "dist", CARD_FILE),
    ]) {
      expect(existsSync(file), file).toBe(true);
      expect(pngSize(file), file).toEqual({ width: 1200, height: 630 });
    }
  });

  test("is drawn from the actual dark and petrol tokens", async () => {
    const file = resolve(root, "public", CARD_FILE);
    /* Solid fills, sampled away from type: the ground, the structural rule,
       the 60-second track, and the 1/60 accent sliver. */
    expect(await pixel(file, 10, 10)).toEqual(DARK.bg);
    expect(await pixel(file, 100, 65)).toEqual(DARK.text);
    expect(await pixel(file, 600, 455)).toEqual(DARK.surface2);
    expect(await pixel(file, 85, 455)).toEqual(DARK.accent);
  });
});
