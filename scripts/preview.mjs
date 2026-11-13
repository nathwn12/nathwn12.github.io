#!/usr/bin/env node
/**
 * Live preview. One long-lived Vite dev server on a fixed port, with the HMR
 * overlay off so a half-written save shows the last good render instead of a
 * red screen, and a status file any session can read to prove it is alive.
 *
 *   bun run preview:live            # http://127.0.0.1:5277
 *   bun run preview:live --port 5300
 *
 * Why this exists: a preview that is killed and restarted between edits is not
 * a preview, it is a screenshot with extra steps. This process stays up for the
 * session, prints every module it pushes to the browser, and never masks a save
 * behind an error overlay.
 */
import { createServer } from "vite";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
};

const port = Number(arg("port", 5277));
const host = arg("host", "127.0.0.1");
const statusPath = resolve(process.cwd(), "preview-status.json");

const server = await createServer({
  server: {
    host,
    port,
    strictPort: true,
    hmr: { overlay: false },
    watch: { usePolling: false, ignored: ["**/dist/**", "**/preview-status.json"] },
  },
  clearScreen: false,
});

const writeStatus = (state, extra = {}) => {
  writeFileSync(
    statusPath,
    JSON.stringify(
      { url: `http://${host}:${port}/`, state, pid: process.pid, at: new Date().toISOString(), ...extra },
      null,
      2,
    ),
  );
};

let updates = 0;
const stamp = () => new Date().toTimeString().slice(0, 8);

server.ws.on("connection", () => console.log(`${stamp()}  browser connected`));
server.watcher.on("change", (file) => {
  updates += 1;
  const short = file.replace(process.cwd(), "").replace(/\\/g, "/");
  console.log(`${stamp()}  hmr #${updates}  ${short}`);
  writeStatus("live", { updates });
});

await server.listen();
writeStatus("live", { updates });

const url = server.resolvedUrls?.local?.[0] ?? `http://${host}:${port}/`;
console.log(`\n  live preview  ${url}`);
console.log(`  overlay off · status ${statusPath}`);
console.log(`  leave this running; edits land in the browser without a reload\n`);

const shutdown = async () => {
  writeStatus("stopped", { updates });
  await server.close();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
