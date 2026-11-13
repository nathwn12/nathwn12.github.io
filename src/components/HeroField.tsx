import { useEffect, useRef } from "react";
import { MOTION_CHANGE_EVENT, motionAllowed } from "../lib/motion";
import {
  TIERS,
  createField,
  nextTier,
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
 *   - **A measured budget, with tiers.** Every 30 frames the loop reads its own
 *     rolling average frame time and asks `nextTier()` for the next tier: over
 *     22 ms it drops one (particles first, then the backing buffer's DPR, 2 →
 *     1.5 → 1), and under 12 ms sustained it steps back up — never sooner than
 *     two seconds after the last switch, so it cannot oscillate. The live tier,
 *     count, average frame time and average paint cost are published on
 *     `data-field-*` once a second, so "it holds 60 fps" can be checked against
 *     the running page instead of believed.
 *   - **One frame loop, and only while it can be seen.** One
 *     `IntersectionObserver` on the canvas and `document.hidden` gate it; a
 *     field nobody is looking at costs nothing, and unmount cancels the frame.
 *   - **Reduced motion is a still frame, not a stopped loop.** Under
 *     `prefers-reduced-motion` or `data-motion="off"` the field is simulated
 *     once and painted once; `requestAnimationFrame` is never called. It is the
 *     same seed and the same picture the loop would start from.
 *
 * No dependency, no shader, no WebGL: one 2D context, short tails, and a
 * ground-coloured wash that turns them into a current.
 */

/** Px of tail per unit of velocity — the streak length. */
const TAIL = 9.5;

/** The per-frame ground wash: this is what makes a trail instead of a dot. */
const FADE = 0.075;

/** The rolling window the budget is judged on (30 frames ≈ half a second). */
const WINDOW = 30;

/** Load is not performance: the first two seconds are fonts, first paints and
 *  the cover's own sequence, and a window taken there would ratchet the field
 *  down a tier for the rest of the visit. */
const WARMUP_MS = 2000;

interface Ink {
  ground: string;
  /** The two accents, in the order a particle's `band` selects them. */
  accents: [string, string];
  /** The alpha each band is drawn at. */
  alphas: [number, number];
  /** Additive on the dark ground; normal compositing on paper, where adding
   *  light to an almost-white ground draws nothing at all. */
  blend: GlobalCompositeOperation;
}

/** The dark field: the measurement added over the structure, which is what
 *  makes a crossing read as a bright current rather than as two overlapping
 *  lines — amber over black, with the cyan as the quieter second voice. */
const DARK_ALPHAS: [number, number] = [0.055, 0.042];

/** On paper the same strokes are ink at a third of the alpha, and the second
 *  voice is the rule colour: a cyan measurement is a highlight on a black
 *  ground and a scribble on paper, so paper draws ink-blue over a faint rule. */
const LIGHT_ALPHAS: [number, number] = [0.018, 0.012];

export function HeroField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    /* A phone starts two tiers down: it has fewer pixels, a smaller battery and
       no pointer to react to. The tier machine can still promote it. */
    const compact = window.matchMedia?.("(max-width: 767px)").matches ?? false;
    let tier = compact ? 2 : 0;

    /* The palette is read off the element, not typed here: the canvas is the
       one place on the site that paints a colour, and it still reads a token.
       It is re-read whenever `<html data-theme>` changes, because the field is
       the only thing on the page whose ink is not a CSS rule.

       There is deliberately no hex fallback. A fallback colour in this file
       would be a second palette that the theme switch cannot see; `transparent`
       is the honest empty value, so a missing token draws nothing rather than
       the wrong colour. */
    let ink: Ink = {
      ground: "transparent",
      accents: ["transparent", "transparent"],
      alphas: DARK_ALPHAS,
      blend: "lighter",
    };

    const readInk = () => {
      const styles = getComputedStyle(canvas);
      const token = (name: string) => styles.getPropertyValue(name).trim();
      const light = document.documentElement.dataset.theme === "light";
      const signal = token("--rec-signal");
      const measure = token("--rec-measure");
      const rule = token("--rec-rule");

      ink = light
        ? {
            ground: token("--rec-ground"),
            accents: [signal, rule],
            alphas: LIGHT_ALPHAS,
            blend: "source-over",
          }
        : {
            ground: token("--rec-ground"),
            accents: [measure, signal],
            alphas: DARK_ALPHAS,
            blend: "lighter",
          };
    };
    readInk();

    let width = 0;
    let height = 0;
    let field: Field = createField(1, 1, TIERS[tier].count);
    let frame = 0;
    let last = 0;
    let startedAt = 0;
    let lastSwitch = 0;
    let visible = true;
    let pointer: { x: number; y: number } | null = null;
    let scroll = 0;
    let lastScrollY = window.scrollY;
    const frames: number[] = [];
    const paints: number[] = [];
    let reported = 0;

    const size = () => {
      const box = canvas.getBoundingClientRect();
      const dpr = Math.min(TIERS[tier].dpr, window.devicePixelRatio || 1);
      width = Math.max(1, Math.round(box.width));
      height = Math.max(1, Math.round(box.height));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      field = createField(width, height, TIERS[tier].count);
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
      context.strokeStyle = ink.accents[particle.band];
      context.beginPath();
      context.moveTo(particle.x, particle.y);
      context.lineTo(particle.x + vx * length, particle.y + vy * length);
      context.stroke();
    };

    const paint = () => {
      /* The wash is the trail: the ground at 7.5% a frame, so a streak survives
         about a second and the field reads as a current with direction. */
      context.globalCompositeOperation = "source-over";
      context.globalAlpha = FADE;
      context.fillStyle = ink.ground;
      context.fillRect(0, 0, width, height);
      context.globalAlpha = 1;

      context.globalCompositeOperation = ink.blend;
      context.lineWidth = 1.1;
      context.lineCap = "round";
      for (const particle of field.particles) {
        streak(particle, ink.alphas[particle.band], TAIL);
      }
      context.globalAlpha = 1;
      context.globalCompositeOperation = "source-over";
    };

    /** The reduced-motion frame: one simulation step, drawn once, no wash.
     *  Nested rays along each particle's own velocity give the still picture the
     *  same direction the loop's trails would have — a single dash per particle
     *  read as rain, not as a current. */
    const paintStill = () => {
      context.globalCompositeOperation = "source-over";
      context.globalAlpha = 1;
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = ink.blend;
      context.lineWidth = 1.1;
      context.lineCap = "round";
      for (const particle of field.particles) {
        const alpha = ink.alphas[particle.band] * 0.9;
        for (let step = 5; step >= 1; step -= 1) {
          streak(particle, alpha, TAIL * step * 1.1);
        }
      }
      context.globalAlpha = 1;
      context.globalCompositeOperation = "source-over";
    };

    const tick = (now: number) => {
      frame = window.requestAnimationFrame(tick);
      if (!startedAt) startedAt = now;
      const delta = last ? now - last : 16.7;
      last = now;
      /* A tab that was parked must not teleport the field: one frame's worth of
         motion, whatever the gap says. */
      const dt = Math.min(1 / 30, Math.max(1 / 240, delta / 1000));

      stepField(field, { dt, pointer, scroll });
      scroll *= 0.9;

      const started = performance.now();
      paint();
      paints.push(performance.now() - started);
      if (paints.length > WINDOW) paints.shift();

      frames.push(delta);
      if (frames.length < WINDOW) return;
      if (frames.length > WINDOW) frames.shift();

      if (now - startedAt < WARMUP_MS) {
        frames.length = 0;
        paints.length = 0;
        return;
      }

      const average =
        frames.reduce((total, value) => total + value, 0) / frames.length;
      const next = nextTier(tier, average, now - lastSwitch);
      if (next !== tier) {
        tier = next;
        lastSwitch = now;
        frames.length = 0;
        paints.length = 0;
        /* A new tier is a new buffer and a new count; the field is rebuilt from
           the same seed, so the change is a change of cost, not of character. */
        size();
        return;
      }

      if (now - reported > 1000) {
        reported = now;
        const paintAverage =
          paints.reduce((total, value) => total + value, 0) /
          Math.max(1, paints.length);
        canvas.dataset.fieldTier = String(tier);
        canvas.dataset.fieldCount = String(field.particles.length);
        canvas.dataset.fieldFrameMs = average.toFixed(1);
        canvas.dataset.fieldPaintMs = paintAverage.toFixed(2);
        canvas.dataset.fieldDpr = String(
          Math.min(TIERS[tier].dpr, window.devicePixelRatio || 1),
        );
      }
    };

    const stop = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      startedAt = 0;
      frames.length = 0;
      paints.length = 0;
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

    /* The field's ink is the one thing on the page that is not a CSS rule, so a
       theme switch has to be handed to it: re-read the tokens, wipe the old
       ground's trails and repaint. */
    const themeObserver =
      typeof MutationObserver === "function"
        ? new MutationObserver(() => {
            readInk();
            context.clearRect(0, 0, width, height);
            if (!motionAllowed()) paintStill();
          })
        : null;
    themeObserver?.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

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
      themeObserver?.disconnect();
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
      /* The field is bounded by the cover's own box, so without a mask its
         current stops on a hard horizontal line across the page where the next
         band begins. The mask dissolves the last third into the ground instead:
         an edge nobody can see, rather than a cut nobody asked for. */
      style={{
        maskImage: "linear-gradient(to bottom, black 62%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, black 62%, transparent 100%)",
      }}
    />
  );
}
