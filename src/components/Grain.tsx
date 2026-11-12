/**
 * Grain — the film grain over the whole instrument.
 *
 * A single inline `feTurbulence` (fractalNoise, baseFrequency 0.82, 3 octaves,
 * stitchTiles=stitch) desaturated by `feColorMatrix`, painted at 5.5% under
 * `mix-blend-mode: overlay` so it reads as noise on the ground rather than as a
 * texture pasted over the type. The SVG is generated once by the browser and
 * never re-rendered: only its `transform` moves, on a `steps()` keyframe at
 * 6fps, which is what stops the grain from reading as static snow. Animating
 * the filter itself would re-run the turbulence every frame and cost more than
 * the whole rest of the page.
 *
 * It is decorative and inert: `aria-hidden`, `pointer-events: none`, and below
 * the reticle in the layer order (see tokens.css). Off entirely when the
 * visitor asks for less motion.
 */
export function Grain() {
  return (
    <div className="grain" aria-hidden="true">
      <svg
        className="grain__noise"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
        focusable="false"
        preserveAspectRatio="none"
      >
        <filter id="rec-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.82"
            numOctaves="3"
            stitchTiles="stitch"
            result="noise"
          />
          <feColorMatrix type="saturate" values="0" in="noise" />
        </filter>
        <rect width="100%" height="100%" filter="url(#rec-grain)" />
      </svg>
    </div>
  );
}
