import { useEffect, useRef } from "react";
import { MOTION_CHANGE_EVENT, motionAllowed } from "../lib/motion";
import {
  createField,
  degradeCount,
  stepField,
  type Field,
  type Particle,
} from "../lib/flowfield";

/**
 * HeroField — the current behind the cover.
 *
 * A full-bleed `<canvas>` behind the cover's type and above the ground: a slow,
 * dense flow field in the two accents, drawn additively so crossings brighten
 * instead of muddying. It is decoration and says so — `aria-hidden`,
 * `pointer-events: none`, never in the accessibility tree, never focusable.
 *
 * The rules it lives inside:
 *
 *   - **DPR capped at 2.** A 3× phone buffer is four times the pixels for a
 *     difference nobody can see on a 2px mark.
 *   - **One frame loop, and only while it can be seen.** One
 *     `IntersectionObserver` on the canvas and `document.hidden` gate it; a
 *     field nobody is looking at costs nothing.
 *   - **A measured budget.** The loop keeps a 90-frame rolling average of its
 *     own frame time and sheds particles (via `degradeCount`) when that average
 *     passes 22 ms. The live count and average are published on
 *     `data-field-count` / `data-field-frame-ms` once a second, so the claim
 *     "it holds 60 fps" can be checked against the running page instead of
 *     believed.
 *   - **Reduced motion is a still frame, not a stopped loop.** Under
 *     `prefers-reduced-motion` or `data-motion="off"` the field is simulated
 *     once and painted once; `requestAnimationFrame` is never called. It is the
 *     same seed and the same picture the loop would start from.
 *
 * No dependency, no shader, no WebGL: one 2D context, short tails, and a
 * ground-coloured wash that turns them into a current.
 */

/** Density on a desktop viewport. A phone gets fewer, because it has fewer
 *  pixels and a smaller battery. */
const COUNT = 1500;
const COUNT_COMPACT = 720;

/** Px of tail per unit of velocity — the streak length. */
const TAIL = 9.5;

/** The per-frame ground wash: this is what makes a trail instead of a dot. */
const FADE = 0.075;

/** The rolling window the budget is judged on (~1.5 s at 60 fps). */
const WINDOW = 90;

interface Ink {
  ground: string;
  signal: string;
  measure: string;
}

export function HeroField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const compact = window.matchMedia?.("(max-width: 767px)").matches ?? false;
    let count = compact ? COUNT_COMPACT : COUNT;

    /* The palette is read off the element, not typed here: the canvas is the
       one place on the site that paints a colour, and it still reads a token. */
    const styles = getComputedStyle(canvas);
    const ink: Ink = {
      ground: styles.getPropertyValue("--rec-ground").trim() || "#0a0c0e",
      signal: styles.getPropertyValue("--rec-signal").trim() || "#7c9cff",
      measure: styles.getPropertyValue("--rec-measure").trim() || "#4dd4e8",
    };

    let width = 0;
    let height = 0;
    let field: Field = createField(1, 1, count);
    let frame = 0;
    let last = 0;
    let visible = true;
    let pointer: { x: number; y: number } | null = null;
    let scroll = 0;
    let lastScrollY = window.scrollY;
    const samples: number[] = [];
    let reported = 0;

    const size = () => {
      const box = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      width = Math.max(1, Math.round(box.width));
      height = Math.max(1, Math.round(box.height));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      field = createField(width, height, count);
    };

    /** One particle's streak, at its own accent and its own faint alpha. */
    const streak = (particle: Particle, alpha: number, length: number) => {
      const nx = particle.x / width;
      const ny = particle.y / height;
      const vx =
        Math.cos(ny * 6.2 + field.time * 0.22) +
        Math.cos((nx + ny) * 4.1 - field.time * 0.13) * 0.6;
      const vy =
        Math.sin(nx * 5.4 - field.time * 0.19) +
        Math.sin((nx - ny) * 3.3 + field.time * 0.11) * 0.6;
      context.globalAlpha = alpha;
      context.strokeStyle = particle.band === 0 ? ink.signal : ink.measure;
      context.beginPath();
      context.moveTo(particle.x, particle.y);
      context.lineTo(particle.x + vx * length, particle.y + vy * length);
      context.stroke();
    };

    const paint = () => {
      /* The wash is the trail: the ground at 14% a frame, so a streak survives
         about a second and the field reads as a current with direction. */
      context.globalCompositeOperation = "source-over";
      context.globalAlpha = FADE;
      context.fillStyle = ink.ground;
      context.fillRect(0, 0, width, height);
      context.globalAlpha = 1;

      context.globalCompositeOperation = "lighter";
      context.lineWidth = 1.1;
      context.lineCap = "round";
      for (const particle of field.particles) {
        streak(particle, particle.band === 0 ? 0.055 : 0.042, TAIL);
      }
      context.globalAlpha = 1;
      context.globalCompositeOperation = "source-over";
    };

    /** The reduced-motion frame: one simulation step, drawn once, no wash. */
    const paintStill = () => {
      context.globalCompositeOperation = "source-over";
      context.globalAlpha = 1;
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = "lighter";
      context.lineWidth = 1.1;
      context.lineCap = "round";
      for (const particle of field.particles) {
        streak(particle, particle.band === 0 ? 0.16 : 0.12, TAIL * 1.6);
      }
      context.globalAlpha = 1;
      context.globalCompositeOperation = "source-over";
    };

    const tick = (now: number) => {
      frame = window.requestAnimationFrame(tick);
      const delta = last ? now - last : 16.7;
      last = now;
      /* A tab that was parked must not teleport the field: one frame's worth of
         motion, whatever the gap says. */
      const dt = Math.min(1 / 30, Math.max(1 / 240, delta / 1000));

      stepField(field, { dt, pointer, scroll });
      scroll *= 0.9;
      paint();

      samples.push(delta);
      if (samples.length > WINDOW) samples.shift();
      if (samples.length === WINDOW) {
        const average =
          samples.reduce((total, value) => total + value, 0) / samples.length;
        const next = degradeCount(count, average);
        if (next !== count) {
          count = next;
          field.particles.length = Math.min(field.particles.length, count);
        }
        if (now - reported > 1000) {
          reported = now;
          canvas.dataset.fieldCount = String(count);
          canvas.dataset.fieldFrameMs = average.toFixed(1);
        }
      }
    };

    const stop = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
    };

    const start = () => {
      if (frame || !visible || document.hidden) return;
      if (!motionAllowed()) {
        paintStill();
        return;
      }
      last = 0;
      frame = window.requestAnimationFrame(tick);
    };

    const refresh = () => {
      stop();
      if (!motionAllowed()) {
        paintStill();
        return;
      }
      start();
    };

    /* --- the loop's two gates ------------------------------------------- */
    const observer =
      typeof IntersectionObserver === "function"
        ? new IntersectionObserver((entries) => {
            visible = entries.some((entry) => entry.isIntersecting);
            if (visible) start();
            else stop();
          })
        : null;
    observer?.observe(canvas);

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    /* --- the two reactions ---------------------------------------------- */
    const onPointerMove = (event: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      pointer = { x: event.clientX - box.left, y: event.clientY - box.top };
    };
    const onPointerLeave = () => {
      pointer = null;
    };
    const onScroll = () => {
      scroll = window.scrollY - lastScrollY;
      lastScrollY = window.scrollY;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("scroll", onScroll, { passive: true });

    const onMotionChange = () => {
      refresh();
    };
    window.addEventListener(MOTION_CHANGE_EVENT, onMotionChange);

    const resize =
      typeof ResizeObserver === "function"
        ? new ResizeObserver(() => {
            size();
            if (!motionAllowed()) paintStill();
          })
        : null;
    resize?.observe(canvas);

    size();
    if (motionAllowed()) start();
    else paintStill();

    return () => {
      stop();
      observer?.disconnect();
      resize?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener(MOTION_CHANGE_EVENT, onMotionChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-hero-field
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
    />
  );
}
