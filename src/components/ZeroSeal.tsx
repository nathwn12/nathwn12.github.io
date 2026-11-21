import { spineStamp } from "../content/ledger";

/**
 * The Work chapter's one hollow figure. The zero keeps the figure scale; the
 * measured reduction is a real text node set inside its counter, so the seal
 * reads as "zero findings, −98% latency" in one object.
 */
export default function ZeroSeal({
  figure,
  label,
}: {
  figure: string;
  label: string;
}) {
  const stamp = spineStamp("03");
  return (
    <span
      className="zero-seal"
      role="img"
      aria-label={stamp ? `Zero ${label}; ${stamp}` : `Zero ${label}`}
    >
      <span className="seal-counter" aria-hidden="true">
        <span className="seal-zero">{figure}</span>
        {stamp && <span className="seal-stamp">{stamp}</span>}
      </span>
      <span className="seal-label" aria-hidden="true">
        {label}
      </span>
    </span>
  );
}
