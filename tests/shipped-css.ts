import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

/**
 * The stylesheet the build actually ships.
 *
 * `src/index.css` is a barrel: one `@import` per layer, in cascade order. A
 * test that reads only the barrel reads six file names, so this resolves the
 * imports into one string — the same source order Vite composes — and every
 * assertion about a rule then matches where the rule really lives.
 */

const root = resolve(import.meta.dirname, "..");

function inline(source: string, from: string): string {
  return source.replace(
    /@import\s+"([^"]+)";/g,
    (whole, request: string) => {
      if (!request.startsWith(".")) return whole; // a package, not a layer
      const file = resolve(from, request);
      return inline(readFileSync(file, "utf8"), dirname(file));
    },
  );
}

export const SHIPPED_CSS = inline(
  readFileSync(resolve(root, "src", "index.css"), "utf8"),
  resolve(root, "src"),
);

/** The declared value of a custom property, as written. */
export function cssVar(name: string): string {
  const match = SHIPPED_CSS.match(new RegExp(`${name}:\\s*([^;]+);`));
  if (!match) throw new Error(`no declaration for ${name}`);
  return match[1].trim();
}

/** A rem length in px, at the 16px root. */
export function remToPx(value: string): number {
  const match = value.match(/(-?[\d.]+)rem/);
  if (!match) throw new Error(`not a rem length: ${value}`);
  return Number(match[1]) * 16;
}
