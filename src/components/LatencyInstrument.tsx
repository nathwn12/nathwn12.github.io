import { useEffect, useRef, type CSSProperties } from "react";
import { gsap } from "gsap";
import { figures, measurement, queryFigure } from "../content/ledger";
import { MOTION_CHANGE_EVENT, countUp, motionAllowed } from "../lib/motion";

/**
 * LatencyInstrument — the one measurement the page exists to prove.
 *
 * The payment query before and after the provider change, drawn on one shared
 * log scale so both bars stay legible: laid out linearly, "under one second"
 * against "60 s" is a 1.7% sliver and the comparison reads as an empty track
 * rather than as sixty times the work. The axis spans 0.5 s to 100 s and says
 * so, because a log axis that does not announce itself is a misleading chart.
 *
 * Every number is DOM text. The canvas is decoration only — the decade grid,
 * the tick marks, and one sweep on load — so a visitor with no canvas, no
 * JavaScript, or a screen reader still gets the full fact from the `<dl>`:
 * `MySql.Data` before, `60 s`; `MySqlConnector` after, `under one second`; the
 * reduction, `−98%`. The `−98%` is the content's own 98% restated as a
 * reduction; it is not a second figure.
 *
 * Motion: the bars grow from zero, the readouts count up, and the sweep crosses
 * the plot once — then nothing runs again. There is no animation frame loop to
 * pause: the canvas is redrawn on resize and during that one sweep, and with
 * motion off (or an OS asking for less) it is drawn once in its final state.
 * The DPR is capped at 2, which is the difference between a crisp hairline and
 * a four-times-buffer on a phone.
 */

/** The axis, in seconds. Both values are plotted on it by log10 position. */
const AXIS = { min: 0.5, max: 100 } as const;
const BEFORE_SECONDS = 60;
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

const BEFORE_POSITION = axisPosition(BEFORE_SECONDS);
const AFTER_POSITION = axisPosition(AFTER_SECONDS);

/** The reduction, read off the content's one percentage. */
const REDUCTION = figures.paymentsPercent
  ? Number(figures.paymentsPercent.replace(/[^\d.]/g, ""))
  : null;

const tickLabel = (seconds: number): string => `${seconds} s`;

/** Flush right at the end of the track, left-aligned on its own gridline in
 *  between: every label's left edge is the position it names, and no two labels
 *  can collide on a narrow column. */
function tickStyle(seconds: number): CSSProperties {
  if (seconds === AXIS.max) return { right: 0 };
  return { left: `${axisPosition(seconds) * 100}%` };
}

export function LatencyInstrument() {
  const plotRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const beforeBarRef = useRef<HTMLDivElement>(null);
  const afterBarRef = useRef<HTMLDivElement>(null);
  const beforeValueRef = useRef<HTMLElement>(null);
  const reductionValueRef = useRef<HTMLSpanElement>(null);

  /* --- the decoration: grid, ticks, one sweep ---------------------------- */
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
    let sweepTween: gsap.core.Tween | null = null;

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

    const proxy = { at: 0 };
    if (motionAllowed()) {
      sweepTween = gsap.to(proxy, {
        at: 1,
        duration: 0.8,
        delay: 1.05,
        ease: "power2.inOut",
        onUpdate: () => {
          sweepAt = proxy.at;
          draw();
        },
        onComplete: () => {
          sweepAt = null;
          draw();
        },
      });
    }

    const onMotionChange = () => {
      if (motionAllowed()) return;
      sweepTween?.kill();
      sweepTween = null;
      sweepAt = null;
      draw();
    };
    window.addEventListener(MOTION_CHANGE_EVENT, onMotionChange);

    return () => {
      observer?.disconnect();
      sweepTween?.kill();
      window.removeEventListener(MOTION_CHANGE_EVENT, onMotionChange);
    };
  }, []);

  /* --- the measurement: bars grow, readouts count ------------------------ */
  useEffect(() => {
    if (!motionAllowed()) return;
    const bars = [beforeBarRef.current, afterBarRef.current].filter(
      (bar): bar is HTMLDivElement => bar !== null,
    );
    const pending: Array<{ kill: () => void }> = [];

    const growth = gsap.from(bars, {
      scaleX: 0,
      transformOrigin: "left center",
      duration: 0.9,
      delay: 0.45,
      stagger: 0.15,
      ease: "power3.out",
    });
    pending.push(growth);

    const before = beforeValueRef.current;
    if (before && queryFigure.before) {
      const count = gsap.delayedCall(0.55, () => {
        countUp(before, BEFORE_SECONDS, (value) => `${Math.round(value)} s`, {
          duration: 1.0,
        });
      });
      pending.push(count);
    }

    const reduction = reductionValueRef.current;
    if (reduction && REDUCTION !== null) {
      const count = gsap.delayedCall(0.95, () => {
        countUp(reduction, REDUCTION, (value) => `−${Math.round(value)}%`, {
          duration: 0.9,
        });
      });
      pending.push(count);
    }

    const onMotionChange = () => {
      if (motionAllowed()) return;
      for (const item of pending) item.kill();
      gsap.set(bars, { scaleX: 1 });
      if (before && queryFigure.before) before.textContent = queryFigure.before;
      if (reduction && REDUCTION !== null) {
        reduction.textContent = `−${REDUCTION}%`;
      }
    };
    window.addEventListener(MOTION_CHANGE_EVENT, onMotionChange);

    return () => {
      window.removeEventListener(MOTION_CHANGE_EVENT, onMotionChange);
      for (const item of pending) item.kill();
    };
  }, []);

  return (
    /* No border and no fill: the instrument is a region of the record, held by
       two hairlines that end on the frame's right edge, not a card laid on top
       of it. The top rule is the stronger of the two because it is the edge the
       column starts at. */
    <div
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
              <dd
                ref={beforeValueRef}
                className="data whitespace-nowrap tabular-nums text-[color:var(--rec-ink)]"
              >
                {queryFigure.before ?? "—"}
              </dd>
            </div>
            <div className="mt-2.5 h-[5px] w-full" aria-hidden="true">
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
            <div className="mt-2.5 h-[5px] w-full" aria-hidden="true">
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
        Log scale, 0.5 s to 100 s. Bars are drawn to those positions.
      </p>
    </div>
  );
}
