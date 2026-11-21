import type { ReactNode } from "react";
import { fmt, signal } from "../content/signal";

/** The final value lives in the markup. */
export function CountUp({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  const text = fmt(value);
  return (
    <span className={`count-up ${className}`.trim()}>{text}</span>
  );
}

export function Sparkline({
  values,
  tone = "signal",
  className = "",
}: {
  values: number[];
  tone?: "signal" | "measure";
  className?: string;
}) {
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? 100 / (values.length - 1) : 100;
  const points = values
    .map((value, index) => `${(index * step).toFixed(2)},${(24 - (value / max) * 22).toFixed(2)}`)
    .join(" ");
  return (
    <svg
      className={`spark ${tone} ${className}`.trim()}
      viewBox="0 0 100 24"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline points={points} />
    </svg>
  );
}

export function Heatmap() {
  return (
    <div className="heatmap" aria-hidden="true">
      {signal.cells.map((cell) => (
        <span key={cell.date} className="heat-cell" data-level={cell.level} title={cell.date} />
      ))}
    </div>
  );
}

/** Two identical runs make the 50% translate seamless. */
export function Ticker({ items }: { items: readonly string[] }) {
  const run = (key: string): ReactNode => (
    <div className="ticker-run" key={key}>
      {items.map((item, index) => (
        <span key={`${key}-${index}`}>
          {item}
          <span className="ticker-dot" aria-hidden="true">
            ·
          </span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-track">
        {run("a")}
        {run("b")}
      </div>
    </div>
  );
}
