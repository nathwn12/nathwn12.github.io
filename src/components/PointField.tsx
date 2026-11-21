import { useEffect, useRef } from "react";
import { fieldPoints } from "../content/field";

/** One settle pass, then hold. No loop after the points reach their place. */
const SETTLE_MS = 640;

export default function PointField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let dims = { w: 1, h: 1 };
    let raf = 0;
    let elapsed = 0;
    let last = 0;
    let settled = false;
    let onscreen = true;

    const resize = (): void => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = host.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dims = { w, h };
      if (settled) draw(1);
    };

    const draw = (progress: number): void => {
      const { w, h } = dims;
      ctx.clearRect(0, 0, w, h);
      const root = getComputedStyle(document.documentElement);
      const ink = root.getPropertyValue("--color-ink").trim();
      const signal = root.getPropertyValue("--color-signal").trim();
      const measure = root.getPropertyValue("--color-measure").trim();

      for (const point of fieldPoints) {
        const x = w / 2 + (point.x * w - w / 2) * progress;
        const y = h / 2 + (point.y * h - h / 2) * progress;
        const radius = 0.6 + point.size * 2.6;
        ctx.globalAlpha = point.brightness * (0.55 + 0.45 * progress);
        ctx.fillStyle = point.live ? signal : ink;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        if (point.spike) {
          const ray = radius * 6;
          ctx.globalAlpha = 0.45 * point.brightness;
          ctx.strokeStyle = measure;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x - ray, y);
          ctx.lineTo(x + ray, y);
          ctx.moveTo(x, y - ray);
          ctx.lineTo(x, y + ray);
          ctx.moveTo(x - ray * 0.7, y - ray * 0.7);
          ctx.lineTo(x + ray * 0.7, y + ray * 0.7);
          ctx.moveTo(x - ray * 0.7, y + ray * 0.7);
          ctx.lineTo(x + ray * 0.7, y - ray * 0.7);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    };

    const canRun = (): boolean => onscreen && !document.hidden;

    const tick = (now: number): void => {
      if (last) elapsed += now - last;
      last = now;
      const t = Math.min(1, elapsed / SETTLE_MS);
      draw(1 - (1 - t) ** 3);
      if (t < 1 && canRun()) {
        raf = requestAnimationFrame(tick);
      } else if (t < 1) {
        cancelAnimationFrame(raf);
        raf = 0;
        last = 0;
      } else {
        raf = 0;
        last = 0;
        settled = true;
      }
    };

    const play = (): void => {
      if (settled || reduce) return;
      if (!canRun()) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        last = 0;
        return;
      }
      if (!raf) raf = requestAnimationFrame(tick);
    };

    resize();
    if (reduce) {
      draw(1);
      settled = true;
    } else {
      play();
    }

    const observer = new IntersectionObserver((entries) => {
      onscreen = entries.some((entry) => entry.isIntersecting);
      play();
    });
    observer.observe(host);

    const onVisibility = (): void => play();
    const onResize = (): void => resize();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", onResize);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="field-canvas"
      aria-hidden="true"
      data-point-count={fieldPoints.length}
    />
  );
}
