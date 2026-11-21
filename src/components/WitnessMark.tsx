/** The site's one ornament: five hairline rings in two counter-rotating
 *  groups. Pure SVG and CSS; no JS, no fill, no second source of motion. */
export default function WitnessMark({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      className={`witness ${className}`.trim()}
      viewBox="0 0 200 200"
      aria-hidden="true"
      focusable="false"
    >
      <g className="witness-outer">
        <circle cx="100" cy="100" r="88" />
        <circle cx="100" cy="100" r="70" />
        <circle cx="100" cy="100" r="52" />
      </g>
      <g className="witness-inner">
        <circle cx="100" cy="100" r="34" />
        <circle cx="100" cy="100" r="16" />
      </g>
    </svg>
  );
}
