/** Bake the real first paint into dist/index.html: hydrate once at build
 *  time and write the resulting DOM back, so CLS reaches literal 0. Content
 *  still comes from src/content through the shipped JS bundle. */
import { chromium } from "playwright";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const file = path.join(dist, "index.html");
const source = await readFile(file, "utf8");

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.route("http://prerender.local/**", async (route) => {
    const name = new URL(route.request().url()).pathname.slice(1);
    const type = name.endsWith(".js")
      ? "text/javascript"
      : name.endsWith(".css")
        ? "text/css"
        : name.endsWith(".woff2")
          ? "font/woff2"
          : "text/html";
    try {
      await route.fulfill({
        status: 200,
        body: await readFile(path.join(dist, name)),
        contentType: type,
      });
    } catch {
      await route.fulfill({ status: 404, body: "no" });
    }
  });
  await page.goto("http://prerender.local/index.html", { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const dom = await page.evaluate(() => {
    const clone = document.documentElement.cloneNode(true);
    const root = clone.querySelector("#root");
    const rendered = document.querySelector("#root");
    if (root && rendered) root.innerHTML = rendered.innerHTML;
    // Keep the module script: React must re-evaluate matchMedia on mount so a
    // reduced-motion visitor gets the settled still, not the baked-in videos.
    return `<!DOCTYPE html>\n${clone.outerHTML}`;
  });
  await writeFile(file, `${dom}\n`);
  await writeFile(path.join(dist, "404.html"), `${dom}\n`);
  console.log("OK: prerendered dist/index.html and dist/404.html");
} finally {
  await browser.close();
}
