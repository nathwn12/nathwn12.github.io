import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const OUT = "C:/Users/nathan/AppData/Local/Temp/opencode/ledger-shots";
const URL = process.env.FRAME_TABLE_URL ?? "http://127.0.0.1:4334/";
const ALL_VIEWPORTS = [
  { name: "2560", width: 2560, height: 1440 },
  { name: "1440", width: 1440, height: 900 },
  { name: "768", width: 768, height: 1024 },
  { name: "390", width: 390, height: 844 },
  { name: "393", width: 393, height: 852 },
  { name: "430", width: 430, height: 932 },
];
const only = process.env.SIZES?.split(",").filter(Boolean);
const VIEWPORTS = only
  ? ALL_VIEWPORTS.filter((vp) => only.includes(vp.name))
  : ALL_VIEWPORTS;

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });

const quantile = (values, q) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(q * sorted.length) - 1)];
};

for (const vp of VIEWPORTS) {
  for (const mode of ["dark"]) {
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      reducedMotion: "no-preference",
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(1600);

    const stats = await page.evaluate(async () => {
      const sample = async () => {
        // Counters start with the window, not the page load.
        const shifts = [];
        const longTasks = [];
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) shifts.push(entry.value);
          }
        }).observe({ type: "layout-shift" });
        try {
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) longTasks.push(entry.duration);
          }).observe({ type: "longtask" });
        } catch {}

        const frames = await new Promise((resolve) => {
          const times = [];
          const step = (t) => {
            times.push(t);
            if (times.length < 120) requestAnimationFrame(step);
            else resolve(times);
          };
          requestAnimationFrame(step);
        });
        return {
          deltas: frames.slice(1).map((t, i) => t - frames[i]),
          cls: shifts.reduce((a, b) => a + b, 0),
          long: longTasks.length,
        };
      };

      const warm = await sample();
      const settled = await sample();
      const video = document.querySelector("video");
      return {
        viewport: [innerWidth, innerHeight],
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        video: video
          ? {
              time: +video.currentTime.toFixed(2),
              paused: video.paused,
              rate: video.playbackRate,
              size: [video.videoWidth, video.videoHeight],
            }
          : null,
        navs: document.querySelectorAll("nav").length,
        sections: document.querySelectorAll("main section").length,
        warm,
        settled,
      };
    });

    const heroFits = await page.evaluate(() => {
      const cue = document.querySelector(".hud-scroll");
      return cue ? cue.getBoundingClientRect().bottom <= innerHeight + 1 : false;
    });
    const row = (label, sample) => ({
      size: vp.name,
      mode,
      window: label,
      viewport: stats.viewport.join("x"),
      render: stats.video ? stats.video.size.join("x") : "none",
      videoPaused: stats.video?.paused ?? null,
      videoRate: stats.video?.rate ?? null,
      overflowPx: stats.scrollWidth - stats.clientWidth,
      navs: stats.navs,
      sections: stats.sections,
      plate: stats.plate,
      heroFits,
      p50: +quantile(sample.deltas, 0.5).toFixed(1),
      p95: +quantile(sample.deltas, 0.95).toFixed(1),
      max: +Math.max(...sample.deltas).toFixed(1),
      over20: sample.deltas.filter((d) => d > 20).length,
      long: sample.long,
      cls: +sample.cls.toFixed(4),
      errors,
    });
    console.log(JSON.stringify(row("warm", stats.warm)));
    console.log(JSON.stringify(row("settled", stats.settled)));

    await page.screenshot({ path: `${OUT}/${vp.name}-${mode}-hero.png` });

    // Walk the page with native scroll so the reveals resolve, then capture.
    await page.evaluate(async () => {
      const step = Math.max(280, Math.round(innerHeight * 0.5));
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        scrollTo({ top: y, behavior: "instant" });
        await new Promise((resolve) => setTimeout(resolve, 120));
      }
      scrollTo({ top: 0, behavior: "instant" });
      await new Promise((resolve) => setTimeout(resolve, 900));
    });
    const revealed = await page.evaluate(
      () => document.querySelectorAll("[data-reveal].is-in").length,
    );
    console.log(JSON.stringify({ size: vp.name, mode, revealed }));
    await page.screenshot({ path: `${OUT}/${vp.name}-${mode}-full.png`, fullPage: true });
    if (vp.name === "1440") {
      for (const id of ["reduction", "method", "work", "record", "contact"]) {
        await page.locator(`#${id}`).screenshot({ path: `${OUT}/1440-${mode}-${id}.png` });
      }
    }
    await page.close();
  }
}

const selection = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  reducedMotion: "no-preference",
});
await selection.goto(URL, { waitUntil: "networkidle" });
await selection.waitForTimeout(1200);
const readSource = () =>
  selection.evaluate(() => {
    const v = document.querySelector("video");
    return v ? { src: v.currentSrc.split("/").pop(), size: [v.videoWidth, v.videoHeight] } : null;
  });
const portraitSource = await readSource();
await selection.setViewportSize({ width: 844, height: 390 });
await selection.waitForTimeout(1200);
const landscapeSource = await readSource();
await selection.setViewportSize({ width: 390, height: 844 });
await selection.waitForTimeout(1200);
const backToPortrait = await readSource();
console.log(
  JSON.stringify({
    sourceSelection: { portraitSource, landscapeSource, backToPortrait },
  }),
);
await selection.close();

const playback = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  reducedMotion: "no-preference",
});
await playback.goto(URL, { waitUntil: "networkidle" });
await playback.waitForTimeout(1200);
const readVideo = () =>
  playback.evaluate(() => {
    const v = document.querySelector("video");
    return v ? { t: +v.currentTime.toFixed(2), paused: v.paused, rate: v.playbackRate } : null;
  });
const playing1 = await readVideo();
await playback.waitForTimeout(1000);
const playing2 = await readVideo();
await playback.evaluate(() =>
  scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }),
);
await playback.waitForTimeout(700);
const offscreen = await readVideo();
await playback.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
await playback.waitForTimeout(700);
const back = await readVideo();
console.log(
  JSON.stringify({
    playback: {
      advanced: playing2 && playing1 ? +(playing2.t - playing1.t).toFixed(2) : null,
      rate: playing2?.rate,
      offscreenPaused: offscreen?.paused,
      resumed: back?.paused === false,
    },
  }),
);
await playback.close();

const reduced = await browser.newPage({
  viewport: { width: 390, height: 844 },
  reducedMotion: "reduce",
});
await reduced.goto(URL, { waitUntil: "networkidle" });
await reduced.waitForTimeout(900);
console.log(
  JSON.stringify({
    reducedMotion: await reduced.evaluate(() => ({
      motion: document.documentElement.dataset.motion,
      hidden: [...document.querySelectorAll("[data-reveal]")].filter(
        (node) => getComputedStyle(node).opacity === "0",
      ).length,
      revealed: document.querySelectorAll("[data-reveal].is-in").length,
      posterOnly: document.querySelector("video")?.classList.contains("is-still"),
      posterVisible: !!document.querySelector(".horizon-poster img"),
    })),
  }),
);
await reduced.close();

// The picking lever: verify A and B once each at both aspects. C is the
// default and is covered by the main table above.
for (const variant of ["a", "b"]) {
  for (const vp of [
    { name: "1440", width: 1440, height: 900 },
    { name: "390", width: 390, height: 844 },
  ]) {
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      reducedMotion: "no-preference",
    });
    await page.goto(`${URL}?hero=${variant}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1400);
    const state = await page.evaluate(() => {
      const v = document.querySelector("video");
      return v
        ? {
            source: v.currentSrc.split("/").pop(),
            paused: v.paused,
            rate: v.playbackRate,
            rendering: getComputedStyle(v).imageRendering,
            pixelated: v.classList.contains("horizon-video--a"),
          }
        : null;
    });
    console.log(
      JSON.stringify({ variantVerify: { variant, size: vp.name, ...state } }),
    );
    await page.close();
  }
}

await browser.close();
