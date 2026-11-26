#!/usr/bin/env node
/**
 * Publish the committed ai/ cards into dist/ai/ for the site. No network and
 * no rewriting of the committed source: vite build runs first, then this copy.
 * Stale dist files from a removed card are deleted in the same pass.
 */
import { copyFileSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const root = process.env.LEDGER_ROOT
  ? resolve(process.env.LEDGER_ROOT)
  : resolve(import.meta.dirname, "..");
const src = resolve(root, "ai");
const dest = resolve(root, "dist", "ai");
const names = readdirSync(src)
  .filter((name) => /\.(json|md)$/.test(name))
  .sort();

mkdirSync(dest, { recursive: true });
for (const existing of readdirSync(dest)) {
  if (!names.includes(existing)) rmSync(resolve(dest, existing), { force: true });
}
for (const name of names) copyFileSync(resolve(src, name), resolve(dest, name));
console.log("OK: prerendered dist/ai with " + names.length + " committed cards");
