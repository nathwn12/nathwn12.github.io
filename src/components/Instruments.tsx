import { useEffect, type ReactNode } from "react";
import { fmt, signal } from "../content/signal";

/** One shared motion driver: reveals, count-ups and sparkline draws. */
export function useInstrumentMotion() {
  useEffect(() => {
    const nodes = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const counts = document.querySelectorAll<HTMLElement>("[data-count-to]");
    const sparks = document.querySelectorAll<SVGPolylineElement>("[data-spark]");
    if (document.documentElement.dataset.motion === "off") {
      nodes.forEach((node) => node.classList.add("is-in"));
      return;
    }

    const reveal = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          reveal.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.04 },
    );
    nodes.forEach((node) => reveal.observe(node));

    const draw = (element: SVGPolylineElement) => {
      element.style.strokeDashoffset = "0";
    };
    const count = (element: HTMLElement) => {
      const target = Number(element.dataset.countTo ?? "0");
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / 800);
        const eased = 1 - Math.pow(1 - t, 3);
        element.textContent = fmt(Math.round(target * eased));
        if (t < 1) requestAnimationFrame(step);
        else element.textContent = fmt(target);
      };
      requestAnimationFrame(step);
    };

    const instrument = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target;
          if (el instanceof SVGPolylineElement) draw(el);
          else if (el instanceof HTMLElement) count(el);
          instrument.unobserve(el);
        }
      },
      { threshold: 0.12 },
    );
    counts.forEach((node) => instrument.observe(node));
    sparks.forEach((node) => instrument.observe(node));

    return () => {
      reveal.disconnect();
      instrument.disconnect();
    };
  }, []);
}

/** The final value is in the markup; the animation only starts on entry. */
export function CountUp({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  const text = fmt(value);
  return (
    <span
      className={`count-up ${className}`.trim()}
      data-count-to={value}
      style={{ minWidth: `${text.length}ch` }}
    >
      {text}
    </span>
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
      <polyline data-spark points={points} />
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
