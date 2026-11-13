import { useEffect, useRef, type CSSProperties } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { figures, measurement, queryFigure } from "../content/ledger";
import { MOTION_CHANGE_EVENT, motionAllowed } from "../lib/motion";

/**
 * LatencyInstrument — the one measurement the page exists to prove.
 *
 * The payment query before and after the provider change, drawn on one shared
 * log scale so both bars stay legible: laid out linearly, "under one second"
 * against "60 s" is a 1.7% sliver and the comparison reads as an empty track
 * rather than as sixty times the work. The axis spans 0.5 s to 100 s and says
 * so, because a log axis that does not announce itself is a misleading chart.
 *
 * The scrub. One ScrollTrigger on the cover, `scrub: true` and no pin, drives a
 * single proxy from 0 to 1 as the hero crosses the viewport. Both bar lengths
 * are computed from the value the plot has reached — the log position of that
 * value on the stated 0.5–100 s axis — so a bar is never a fraction of a
 * pre-computed width, and once the hero has crossed, the bar is 60 s, the after
 * bar is 1 s, and the pair implies the recorded 98%. A tween that grew a bar to
 * a fixed length while a separate tween counted a number was two descriptions of
 * one measurement, and the axis was the thing that lied whenever they drifted.
 *
 * The two printed values are the delivered facts and never move: the replay
 * draws the plot the numbers name, it does not restate the numbers. At rest the
 * plot is undrawn and the derived reduction reads as an em dash — there is
 * nothing yet to derive it from — so the cover never claims a zero. The range
 * closes while the instrument is still on screen, so a reader who scrolls at all
 * sees the measurement complete rather than scroll it away unfinished.
 *
 * There is no pin. A pin holds the cover against the performance floor and
 * delays everything after it by a viewport; scrubbing needs none of that.
 *
 * With motion off — the OS preference or the footer's switch — no trigger is
 * created at all: the markup already carries the final frame (the bars at their
 * log positions, `60 s`, `−98%`), so a visitor with no JavaScript, no motion or
 * a screen reader gets the full fact from the `<dl>` and never sees a zero.
 *
 * The canvas is decoration only: the decade grid and the scrub's playhead. The
 * DPR is capped at 2, which is the difference between a crisp hairline and a
 * four-times-buffer on a phone.
 */

/** The scrub needs the plugin; a DOM without media queries cannot have a
 *  scroller to read, so registration is gated the same way `lib/smooth.ts`
 *  gates Lenis. */
if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
  gsap.registerPlugin(ScrollTrigger);
}

/** The axis, in seconds. Both values are plotted on it by log10 position. */
const AXIS = { min: 0.5, max: 100 } as const;const BEFORE_SECONDS = 60;
const AFTER_SECONDS = 1;
/**
 * The ticks that are drawn AND labelled — the same list, so a label can never
 * describe a position the grid does not hold. The origin is the plot's own left
 * edge: the axis starts at 0.5 s because that is where the track starts, and the
 * caption says so. 100 s ends the track and is set flush right.
 */
const TICKS = [1, 10, 100] as const;

/** Where a value sits on the log axis, 0 (left) to 1 (right). */
function axisPosition(seconds: number): number {
  const low = Math.log10(AXIS.min);
  const high = Math.log10(AXIS.max);
  return (Math.log10(seconds) - low) / (high - low);
}

/** The value at scrub progress `t`, interpolated in log space between the axis
 *  floor and the recorded value — so a bar's length is always the position of
 *  the value the plot has reached. */
function secondsAt(t: number, target: number): number {
  const low = Math.log10(AXIS.min);
  const high = Math.log10(target);
  return 10 ** (low + (high - low) * t);
}

const BEFORE_POSITION = axisPosition(BEFORE_SECONDS);
const AFTER_POSITION = axisPosition(AFTER_SECONDS);

/** The reduction, read off the content's one percentage. */
const REDUCTION = figures.paymentsPercent
  ? Number(figures.paymentsPercent.replace(/[^\d.]/g, ""))
  : null;

const tickLabel = (seconds: number): string => `${seconds} s`;

/** Centred on its own gridline, so the label's optical centre is the position it
 *  names; the last tick is set flush right against the track's end. Without the
 *  translate a label began at its tick and every one of them read 12–16px to the
 *  right of the line it labelled. */
function tickStyle(seconds: number): CSSProperties {
  if (seconds === AXIS.max) return { right: 0 };
  return { left: `${axisPosition(seconds) * 100}%`, transform: "translateX(-50%)" };
}

export function LatencyInstrument() {
  const rootRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const beforeBarRef = useRef<HTMLDivElement>(null);
  const afterBarRef = useRef<HTMLDivElement>(null);
  const reductionValueRef = useRef<HTMLSpanElement>(null);
  /** The canvas owns the playhead; the scrub only says where it is. */
  const playheadRef = useRef<((at: number | null) => void) | null>(null);

  /* --- the decoration: grid and the scrub's playhead ---------------------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    const plot = plotRef.current;
    if (!canvas || !plot) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let width = 0;
    let height = 0;
    let grid = "rgba(57, 66, 74, 0.45)";
    let sweep = "rgba(124, 156, 255, 0.65)";
    let sweepAt: number | null = null;

    const draw = () => {
      context.clearRect(0, 0, width, height);
      context.lineWidth = 1;
      context.strokeStyle = grid;
      /* The gridlines cross the label rows as well as the bars — that is what
         makes two lengths readable against one scale — so they are drawn at 45%
         of the strong rule. At full strength the line lands across a repo name
         and reads as a strikethrough. */
      context.globalAlpha = 0.45;
      for (const tick of TICKS) {
        /* Half-pixel offset so a 1px line lands on a device pixel, not across
           two of them. */
        const x = Math.round(axisPosition(tick) * width) + 0.5;
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, height);
        context.stroke();
      }
      context.globalAlpha = 1;
      if (sweepAt !== null) {
        context.strokeStyle = sweep;
        context.globalAlpha = 0.65;
        const x = Math.round(sweepAt * width) + 0.5;
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, height);
        context.stroke();
        context.globalAlpha = 1;
      }
    };

    const measure = () => {
      const box = plot.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      width = Math.max(1, Math.round(box.width));
      height = Math.max(1, Math.round(box.height));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const styles = getComputedStyle(plot);
      const rule = styles.getPropertyValue("--rec-rule-strong").trim();
      const signal = styles.getPropertyValue("--rec-signal").trim();
      if (rule) grid = rule;
      if (signal) sweep = signal;
      draw();
    };

    const observer =
      typeof ResizeObserver === "function"
        ? new ResizeObserver(measure)
        : null;
    observer?.observe(plot);
    measure();

    playheadRef.current = (at: number | null) => {
      sweepAt = at;
      draw();
    };

    return () => {
      observer?.disconnect();
      playheadRef.current = null;
    };
  }, []);

  /* --- the measurement: one scroll-scrubbed readout ---------------------- */
  useGSAP(
    () => {
      /* No motion, no trigger, no zero: the markup is already the final frame. */
      if (!motionAllowed()) return;

      const beforeBar = beforeBarRef.current;
      const afterBar = afterBarRef.current;
      const reductionValue = reductionValueRef.current;
      if (!beforeBar || !afterBar) return;

      /* The trigger is the cover, not the instrument: the measurement is driven
         by how far the hero has travelled through the viewport. */
      const hero =
        beforeBar.closest<HTMLElement>("[data-band=cover]") ?? beforeBar;

      const apply = (t: number) => {
        const before = secondsAt(t, BEFORE_SECONDS);
        const after = secondsAt(t, AFTER_SECONDS);
        const reduction = Math.round((1 - after / before) * 100);

        beforeBar.style.width = `${axisPosition(before) * 100}%`;
        afterBar.style.width = `${axisPosition(after) * 100}%`;
        /* The printed values are the facts and never move; only the derived
           reduction scrubs, and at rest it is a dash rather than a zero. */
        if (reductionValue) {
          reductionValue.textContent = t > 0 ? `−${reduction}%` : "—";
        }
        /* The playhead marks where the plot has reached; at rest and at the end
           of the range the drawing is the bars alone. */
        playheadRef.current?.(
          t > 0 && t < 1 ? axisPosition(before) : null,
        );
      };

      const proxy = { t: 0 };
      const tween = gsap.to(proxy, {
        t: 1,
        ease: "none",
        onUpdate: () => apply(proxy.t),
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          /* The range closes while the instrument is still on screen: the hero's
             centre reaching the top of the viewport. A reader who scrolls at all
             sees the measurement finish. */
          end: "center top",
          scrub: true,
          /* No pin: the cover is never held. */
        },
      });

      /* Land on the frame the scroll position actually implies before paint. */
      apply(tween.scrollTrigger?.progress ?? 0);

      const onMotionChange = () => {
        if (motionAllowed()) return;
        tween.scrollTrigger?.kill();
        tween.kill();
        beforeBar.style.width = `${BEFORE_POSITION * 100}%`;
        afterBar.style.width = `${AFTER_POSITION * 100}%`;
        if (reductionValue && REDUCTION !== null) {
          reductionValue.textContent = `−${REDUCTION}%`;
        }
        playheadRef.current?.(null);
      };
      window.addEventListener(MOTION_CHANGE_EVENT, onMotionChange);

      return () => {
        window.removeEventListener(MOTION_CHANGE_EVENT, onMotionChange);
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    },
    { scope: rootRef, dependencies: [] },
  );

  return (
    /* No border and no fill: the instrument is a region of the record, held by
       two hairlines that end on the frame's right edge, not a card laid on top
       of it. The top rule is the stronger of the two because it is the edge the
       column starts at. */
    <div
      ref={rootRef}
      data-instrument
      className="border-t border-[color:var(--rec-rule-strong)] pt-4"
    >
      <div className="flex items-baseline justify-between gap-4">
        <p className="data data--sm text-[color:var(--rec-ink-muted)]">
          {measurement.label}
        </p>
        {REDUCTION !== null ? (
          <p className="flex items-baseline gap-2 whitespace-nowrap">
            <span
              ref={reductionValueRef}
              className="data data--lg tabular-nums text-[color:var(--rec-measure)]"
            >
              −{REDUCTION}%
            </span>
            <span className="data data--sm text-[color:var(--rec-ink-muted)]">
              latency
            </span>
          </p>
        ) : null}
      </div>

      {/* Each fact is its own definition list, with its bar directly under the
          value it measures: the mapping between a colour and a row is then
          structural and needs no key. The canvas of decade gridlines sits
          behind both, so the two lengths are read against one scale. Both rows
          are built from the same elements in the same order, so the value
          column and the bar's left edge line up rather than ranking by eye. */}
      <div ref={plotRef} className="relative mt-6">
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
        />

        <div className="relative flex flex-col gap-5">
          <dl>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="data data--sm text-[color:var(--rec-ink)]">
                <span className="text-[color:var(--rec-ink-muted)]">
                  before{" "}
                </span>
                {measurement.beforeName}
              </dt>
              <dd className="data whitespace-nowrap tabular-nums text-[color:var(--rec-ink)]">
                {queryFigure.before ?? "—"}
              </dd>
            </div>
            {/* The track is the axis itself: a 5px rule spanning the full
                measured range, so an undrawn plot reads as a scale awaiting its
                value rather than as a missing element. The bar fills the part
                of that range the value occupies. */}
            <div
              className="mt-2.5 h-[5px] w-full bg-[color:var(--rec-rule)]"
              aria-hidden="true"
            >
              <div
                ref={beforeBarRef}
                className="h-full origin-left bg-[color:var(--rec-alarm)]"
                style={{ width: `${BEFORE_POSITION * 100}%` }}
              />
            </div>
          </dl>

          <dl>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="data data--sm text-[color:var(--rec-ink)]">
                <span className="text-[color:var(--rec-ink-muted)]">after </span>
                {measurement.afterName}
              </dt>
              <dd className="data whitespace-nowrap tabular-nums text-[color:var(--rec-ink)]">
                {queryFigure.afterLong ?? queryFigure.after ?? "—"}
              </dd>
            </div>
            <div
              className="mt-2.5 h-[5px] w-full bg-[color:var(--rec-rule)]"
              aria-hidden="true"
            >
              <div
                ref={afterBarRef}
                className="h-full origin-left bg-[color:var(--rec-measure)]"
                style={{ width: `${AFTER_POSITION * 100}%` }}
              />
            </div>
          </dl>
        </div>
      </div>

      {/* The axis, stated. Every drawn gridline carries its own label — the
          origin included — so the caption and the picture are the same claim: a
          log scale that does not announce its own ends is a misleading chart,
          and one whose ticks do not correspond to its labels is worse than
          none. Same positions the canvas draws at. */}
      <div className="relative mt-2 h-[16px]" aria-hidden="true">
        {TICKS.map((tick) => (
          <span
            key={tick}
            className="data absolute top-0 text-[0.625rem] text-[color:var(--rec-ink-muted)]"
            style={tickStyle(tick)}
          >
            {tickLabel(tick)}
          </span>
        ))}
      </div>

      <p className="data data--sm mt-3 border-b border-[color:var(--rec-rule)] pb-3 text-[color:var(--rec-ink-muted)]">
        Log scale, 0.5 s to 100 s.
      </p>
    </div>
  );
}
