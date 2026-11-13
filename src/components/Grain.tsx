/**
 * Grain — the film grain over the whole instrument.
 *
 * A single inline `feTurbulence` (fractalNoise, baseFrequency 0.52, 2 octaves,
 * stitchTiles=stitch) desaturated by `feColorMatrix`, painted at 85% under
 * `mix-blend-mode: soft-light`. The SVG is generated once by the browser and
 * never re-rendered: only its `transform` moves, on a `steps()` keyframe at
 * 6fps, which is what stops the grain from reading as static snow. Animating
 * the filter itself would re-run the turbulence every frame and cost more than
 * the whole rest of the page.
 *
 * The values are measured, not guessed. At `overlay` and 5.5% the grain was
 * invisible on this ground — an empty patch of the page varied by one single
 * luminance level (spread 0.18), because overlay multiplies the base and a
 * near-black ground is almost nothing to multiply. Soft-light at 85% with a coarser
 * field gives that same patch a spread of ~2.1 levels (mean 17.5, range 12–27)
 * — visible as texture at 1:1 — while the ink's peak moves from 238 to 241, so
 * the type keeps its edge and the ground stays a dark ground. Both numbers are
 * in the W5 report; the recipe is not tuned by eye alone.
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
            baseFrequency="0.52"
            numOctaves="2"
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
