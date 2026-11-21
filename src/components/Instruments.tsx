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

/** One clipped line of live readouts; no marquee loop, no per-item boxes. */
export function Ticker({ items }: { items: readonly string[] }) {
  return (
    <div className="ticker" aria-hidden="true">
      <span className="ticker-track">{items.join(" · ")}</span>
    </div>
  );
}
