import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import sharp from "sharp";

const DEV = "http://127.0.0.1:4336/capture.html";
const FPS = Number(process.env.FPS ?? 30);
const SECONDS = 8;
const FRAMES = FPS * SECONDS;
const STILL_TIME = 2.4;

const out = (name) => fileURLToPath(new URL(`../public/${name}`, import.meta.url));
await mkdir(fileURLToPath(new URL("../public/", import.meta.url)), {
  recursive: true,
});

/** Desktop keeps the reference camera. Phone zooms out so the disc's wings
    fit a 9:16 frame with a safe margin, leaving the ends of the frame clear. */
const MASTERS = [
  { name: "desktop", width: 2560, height: 1440, fov: 1 },
  { name: "phone", width: 1080, height: 1920, fov: 0.42 },
];

const browser = await chromium.launch({ headless: true });

async function openCapture(master) {
  const page = await browser.newPage({
    viewport: { width: master.width, height: master.height },
    deviceScaleFactor: 1,
  });
  await page.goto(
    `${DEV}?quality=ultra&fov=${master.fov}`,
    { waitUntil: "networkidle" },
  );
  await page.waitForFunction(() => window.__horizon?.ready === true, null, {
    timeout: 60000,
  });
  return page;
}

function png(dataUrl) {
  return Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64");
}

/** Render a time and read the frame in one round trip. */
const frameAt = (page, t) =>
  page.evaluate((time) => {
    window.__horizon.renderAt(time);
    return window.__horizon.frame();
  }, t);

async function validateSeam(page, master) {
  const first = await sharp(png(await frameAt(page, 0))).raw().toBuffer();
  const last = await sharp(png(await frameAt(page, SECONDS))).raw().toBuffer();
  let differing = 0;
  let maxDelta = 0;
  for (let i = 0; i < first.length; i++) {
    const delta = Math.abs(first[i] - last[i]);
    if (delta) differing++;
    if (delta > maxDelta) maxDelta = delta;
  }
  const pass = differing === 0;
  console.log(
    JSON.stringify({
      master: master.name,
      seam: { pixelsCompared: first.length, differing, maxDelta, pass },
    }),
  );
  if (!pass) throw new Error(`${master.name}: t=0 and t=8 differ`);
}

function encoders(master) {
  return [
    {
      name: "mp4",
      args: [
        "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS),
        "-vcodec", "png", "-i", "-", "-an", "-c:v", "libx264", "-preset", "medium",
        "-crf", "16", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
        out(`horizon-${master.name}.mp4`),
      ],
    },
    {
      // AV1 first: SVT-AV1 preset 6 at CRF 34, the measured prior-wave choice.
      name: "webm",
      args: [
        "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS),
        "-vcodec", "png", "-i", "-", "-an", "-c:v", "libsvtav1", "-preset", "6",
        "-crf", "34", "-pix_fmt", "yuv420p", out(`horizon-${master.name}.webm`),
      ],
    },
  ].map((encoder) => {
    const child = spawn("ffmpeg", encoder.args, { stdio: ["pipe", "inherit", "inherit"] });
    child.on("error", (error) => console.error(`ffmpeg ${encoder.name}: ${error}`));
    return { ...encoder, child };
  });
}

const POSTER_ONLY = process.env.POSTER_ONLY === "1";

for (const master of MASTERS) {
  const page = await openCapture(master);
  await validateSeam(page, master);

  if (!POSTER_ONLY) {
  const jobs = encoders(master);
  const started = performance.now();
  for (let i = 0; i < FRAMES; i++) {
    // Both masters sample the same clock, so the loop phase is identical.
    const t = (i / FRAMES) * SECONDS;
    const buffer = png(await frameAt(page, t));
    for (const job of jobs) {
      if (!job.child.stdin.write(buffer)) {
        await new Promise((resolve) => job.child.stdin.once("drain", resolve));
      }
    }
    if ((i + 1) % 60 === 0) {
      console.log(
        `${master.name} frame ${i + 1}/${FRAMES} elapsed ${((performance.now() - started) / 1000).toFixed(1)}s`,
      );
    }
  }
  for (const job of jobs) job.child.stdin.end();
  for (const job of jobs) {
    await new Promise((resolve, reject) => {
      job.child.on("close", (code) =>
        code === 0 ? resolve() : reject(new Error(`${job.name} exited ${code}`)),
      );
    });
  }
  }

  const still = png(await frameAt(page, STILL_TIME));
  await sharp(still)
    .webp({ quality: 84 })
    .toFile(out(`horizon-poster-${master.name}.webp`));
  console.log(`${master.name} poster written`);
  await page.close();
}

await browser.close();
console.log("RECORD_DONE");
