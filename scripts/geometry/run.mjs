#!/usr/bin/env node
/**
 * Geometry gate. Self-contained: builds a stale dist, serves it on an ephemeral
 * loopback port, runs the contract probe over every width/mode config, and always
 * closes the listener (also when the probe fails).
 *
 *   bun run check:geometry
 *   bun run check:geometry --inject=overlap   # red proof
 *
 * Flags after the script name are passed to the probe. No fixed ports, no status
 * files, no repository temp files: the JSON report lives in a temp dir removed
 * in the same finally block that closes the server.
 */
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const DIST = path.join(ROOT, 'dist');
const extra = process.argv.slice(2).filter((a) =>
  a.startsWith('--') && !a.startsWith('--out=') && !a.startsWith('--contract='));

const run = (cmd, args) => spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit' });

const walk = (dir) => !fs.existsSync(dir) ? [] : fs.readdirSync(dir, { withFileTypes: true })
  .flatMap((e) => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);

const INPUTS = [
  ...walk(path.join(ROOT, 'src')),
  ...walk(path.join(ROOT, 'public')),
  ...['index.html', 'capture.html', 'vite.config.ts', 'package.json', 'bun.lock',
    'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json',
    'scripts/refresh-repos.mjs', 'scripts/prerender-home.mjs', 'scripts/prerender-routes.mjs']
    .map((f) => path.join(ROOT, f)).filter((f) => fs.existsSync(f)),
];
const index = path.join(DIST, 'index.html');
if (!fs.existsSync(index) || INPUTS.some((f) => fs.statSync(f).mtimeMs > fs.statSync(index).mtimeMs)) {
  console.log('dist stale or missing; building');
  const built = run('bun', ['run', 'build']);
  if (built.status !== 0) process.exit(built.status ?? 1);
} else {
  console.log('dist fresh; skipping build');
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png',
  '.webm': 'video/webm', '.mp4': 'video/mp4', '.pdf': 'application/pdf',
  '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
};
const server = createServer((req, res) => {
  let rel;
  try {
    rel = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400).end('bad request');
    return;
  }
  const requested = path.resolve(DIST, '.' + (rel === '/' ? '/index.html' : rel));
  if (requested !== DIST && !requested.startsWith(DIST + path.sep)) {
    res.writeHead(403).end('forbidden');
    return;
  }
  let target = requested;
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
    target = path.join(requested, 'index.html');
    if (!fs.existsSync(target)) target = path.join(DIST, '404.html');
  }
  if (!fs.existsSync(target)) {
    res.writeHead(404).end('not found');
    return;
  }
  res.writeHead(200, {
    'content-type': MIME[path.extname(target).toLowerCase()] || 'application/octet-stream',
    'cache-control': 'no-store',
  });
  fs.createReadStream(target).pipe(res);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const url = `http://127.0.0.1:${port}/`;
console.log(`GEOMETRY PORT=${port} URL=${url}`);

const stop = () => {
  server.closeAllConnections?.();
  server.close();
};
process.on('SIGINT', () => { stop(); process.exit(130); });
process.on('SIGTERM', () => { stop(); process.exit(143); });

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'geometry-gate-'));
let code = 1;
try {
  // Async spawn: the server lives in this process, so a blocking spawnSync here
  // would leave every probe request unanswered.
  code = await new Promise((resolve) => {
    const child = spawn('node', [
      path.join(HERE, 'probe.mjs'), url, `--out=${path.join(tmp, 'violations.json')}`,
      `--contract=${path.join(HERE, 'contract.yaml')}`, ...extra,
    ], { cwd: ROOT, stdio: 'inherit' });
    child.on('error', () => resolve(1));
    child.on('close', (status) => resolve(status ?? 1));
  });
} finally {
  stop();
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(tmp, { recursive: true, force: true });
}
console.log(`GEOMETRY PORT=${port} STOPPED`);
process.exit(code);
