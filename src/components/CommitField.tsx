import { useEffect, useRef } from "react";
import { commitTotal } from "../content/experience";

/**
 * The one graphic: one mark per recovered commit, drawn once when the figure
 * enters the viewport. `aria-hidden` — the figcaption carries the fact, so the
 * meaning is never in the pixels. A reduced-motion visitor gets the finished
 * field immediately; a resize redraws it finished.
 */
export function CommitField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let progress = reduce.matches ? 1 : 0;
    let started = false;
    let frame = 0;

    function paint() {
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      if (
        canvas.width !== Math.round(width * dpr) ||
        canvas.height !== Math.round(height * dpr)
      ) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      let cell = 4;
      let gap = 2;
      let cols = 1;
      for (let candidate = 4; candidate <= 16; candidate += 1) {
        const candidateGap = Math.max(2, Math.round(candidate * 0.3));
        const across = Math.max(
          1,
          Math.floor((width + candidateGap) / (candidate + candidateGap)),
        );
        const rows = Math.ceil(commitTotal / across);
        if (rows * (candidate + candidateGap) - candidateGap <= height) {
          cell = candidate;
          gap = candidateGap;
          cols = across;
        }
      }

      ctx.fillStyle = "rgba(143, 190, 159, 0.62)";
      const shown = Math.floor(commitTotal * progress);
      for (let index = 0; index < shown; index += 1) {
        const x = (index % cols) * (cell + gap);
        const y = Math.floor(index / cols) * (cell + gap);
        ctx.fillRect(x, y, cell, cell);
      }
    }

    function tick(start: number) {
      return (now: number) => {
        const p = Math.min(1, (now - start) / 1400);
        progress = 1 - (1 - p) ** 3;
        paint();
        if (p < 1) frame = requestAnimationFrame(tick(start));
      };
    }

    if (typeof IntersectionObserver === "undefined") {
      progress = 1;
      paint();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || started) continue;
          started = true;
          observer.unobserve(canvas);
          if (reduce.matches) {
            progress = 1;
            paint();
          } else {
            frame = requestAnimationFrame(tick(performance.now()));
          }
        }
      },
      { threshold: 0.18 },
    );

    observer.observe(canvas);
    paint();

    const onResize = () => {
      cancelAnimationFrame(frame);
      if (started) progress = 1;
      paint();
    };
    window.addEventListener("resize", onResize);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="commit-canvas"
      width={1200}
      height={200}
      aria-hidden="true"
    />
  );
}
