import { useEffect, useRef } from "react";
import { THEME_CHANGE_EVENT } from "../lib/theme";

const FPS = 15;
const INTERVAL = 1000 / FPS;
const GLYPH_SIZE = 18;
/* Rain glyphs never render inside these bands from the canvas edges, so no
   full-width "glyph rows" appear as stray lines at the top of the viewport
   or just above the fixed status bar. The top band must clear the fixed
   header (85px) — the page content is padded there, so a rain row would
   read as a solid green line under the nav. */
const RAIN_TOP_MARGIN = 112;
const RAIN_BOTTOM_MARGIN = 56;

const CHARS =
  "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF<>/{}[]|&^%$#@!";

interface Drop {
  x: number;
  y: number;
  speed: number;
  len: number;
  chars: string[];
}

interface ThemeColors {
  bg: string;
  accent: string;
  gridLine: string;
}

function createDrops(width: number, height: number): Drop[] {
  const cols = Math.floor(width / GLYPH_SIZE);
  return Array.from({ length: cols }, (_, i) => ({
    x: i * GLYPH_SIZE,
    y: Math.random() * height * -1,
    speed: 0.3 + Math.random() * 1.8,
    len: 8 + Math.floor(Math.random() * 22),
    chars: Array.from(
      { length: 30 },
      () => CHARS[Math.floor(Math.random() * CHARS.length)],
    ),
  }));
}

/** Read theme colors from the live CSS variables so both palettes swap in. */
function readThemeColors(): ThemeColors {
  const styles = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) =>
    styles.getPropertyValue(name).trim() || fallback;
  return {
    bg: read("--color-bg", "#300a24"),
    accent: read("--color-accent", "#8ae234"),
    gridLine: read("--color-grid-line", "rgba(255, 255, 255, 0.02)"),
  };
}

/** CSS color at a given alpha, via color-mix so any token format keeps alpha. */
function withAlpha(color: string, alpha: number): string {
  if (alpha <= 0) return "transparent";
  if (alpha >= 1) return color;
  return `color-mix(in srgb, ${color} ${(alpha * 100).toFixed(1)}%, transparent)`;
}

export function BackgroundEffects() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dropsRef = useRef<Drop[]>([]);
  const mouseRef = useRef(0);
  const visibleRef = useRef(true);
  const colorsRef = useRef<ThemeColors | null>(null);
  const needsClearRef = useRef(true);

  useEffect(() => {
    colorsRef.current = readThemeColors();

    const onMouse = (e: MouseEvent) => {
      mouseRef.current = e.clientX;
    };
    window.addEventListener("mousemove", onMouse, { passive: true });

    const onVisibility = () => {
      visibleRef.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVisibility);

    /* Recalibrate palette when the theme changes (same tab or another tab).
       The accumulated paint must also be reset: the 6%-alpha trail fill never
       clears, so old theme pixels would otherwise linger for ~30-60s. */
    const onThemeChange = () => {
      colorsRef.current = readThemeColors();
      needsClearRef.current = true;
    };
    window.addEventListener(THEME_CHANGE_EVENT, onThemeChange);
    window.addEventListener("storage", onThemeChange);

    /* Backup channel: any code path that sets data-theme without dispatching
       the event (e.g. a future direct DOM write) still recolors the canvas. */
    const themeObserver = new MutationObserver(onThemeChange);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      window.removeEventListener("mousemove", onMouse);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener(THEME_CHANGE_EVENT, onThemeChange);
      window.removeEventListener("storage", onThemeChange);
      themeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    dropsRef.current = createDrops(canvas.width, canvas.height);

    let animId = 0;
    let lastTime = 0;
    let gridOffset = 0;
    let interferePhase = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      dropsRef.current = createDrops(canvas.width, canvas.height);
    };
    window.addEventListener("resize", resize);

    const tick = (time: number) => {
      const delta = time - lastTime;
      if (delta < INTERVAL) {
        animId = requestAnimationFrame(tick);
        return;
      }
      lastTime = time - (delta % INTERVAL);

      if (!visibleRef.current) {
        animId = requestAnimationFrame(tick);
        return;
      }

      const { bg, accent, gridLine } = colorsRef.current ?? readThemeColors();

      /* Theme flip: wipe the accumulated frame so nothing of the old theme
         survives; the page body (same token color) shows through until the
         6%-alpha trail fill rebuilds, keeping the swap visually clean. */
      if (needsClearRef.current) {
        needsClearRef.current = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      ctx.fillStyle = withAlpha(bg, 0.06);
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = "12px monospace";
      for (const drop of dropsRef.current) {
        const fadeIn = Math.min(1, (drop.y + 50) / 150);
        if (
          fadeIn <= 0 ||
          drop.y < RAIN_TOP_MARGIN ||
          drop.y > canvas.height - RAIN_BOTTOM_MARGIN
        ) {
          drop.y += drop.speed * 1.2;
          continue;
        }

        const headBright = Math.min(1, 0.2 + (drop.y / canvas.height) * 0.8);
        ctx.fillStyle = withAlpha(accent, headBright * 0.55);
        const headChar =
          drop.chars[Math.floor(Math.random() * drop.chars.length)];
        ctx.fillText(headChar, drop.x, drop.y);

        for (let j = 1; j < drop.len; j++) {
          const trailY = drop.y - j * 14;
          if (trailY < RAIN_TOP_MARGIN) break;
          const trailAlpha = Math.max(0, 0.5 - j / drop.len) * fadeIn * 0.4;
          ctx.fillStyle = withAlpha(accent, trailAlpha);
          const trailChar =
            drop.chars[Math.floor(Math.random() * drop.chars.length)];
          ctx.fillText(trailChar, drop.x, trailY);
        }

        drop.y += drop.speed * 1.2;
        if (drop.y - drop.len * 14 > canvas.height + 20) {
          drop.y = -20 - Math.random() * 100;
          drop.speed = 0.3 + Math.random() * 1.8;
          drop.len = 8 + Math.floor(Math.random() * 22);
        }
      }

      const gx = window.innerWidth / 2;
      const cursorOffset = ((mouseRef.current - gx) / gx) * 15;

      gridOffset = (gridOffset + 0.15) % 40;
      ctx.strokeStyle = gridLine;
      ctx.lineWidth = 1;
      const cx = canvas.width / 2 + cursorOffset;

      for (let i = -25; i <= 25; i += 2) {
        ctx.beginPath();
        const x = cx + i * 14;
        ctx.moveTo(cx, canvas.height * 0.35);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      for (let i = 0; i < 24; i++) {
        ctx.beginPath();
        const t = i / 24;
        const y = canvas.height * 0.35 + canvas.height * 0.65 * t;
        const spread = t * canvas.width * 0.6;
        ctx.moveTo(cx - spread, y);
        ctx.lineTo(cx + spread, y);
        ctx.stroke();
      }

      interferePhase = (interferePhase + 0.3) % 100;
      const waveY = (interferePhase / 100) * canvas.height;
      const waveGrad = ctx.createLinearGradient(0, waveY - 30, 0, waveY + 30);
      waveGrad.addColorStop(0, withAlpha(accent, 0));
      waveGrad.addColorStop(0.5, withAlpha(accent, 0.02));
      waveGrad.addColorStop(1, withAlpha(accent, 0));
      ctx.fillStyle = waveGrad;
      ctx.fillRect(0, waveY - 30, canvas.width, 60);

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[1] pointer-events-none"
      aria-hidden="true"
    />
  );
}
