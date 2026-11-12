import { useEffect, useState } from "react";
import {
  MOTION_CHANGE_EVENT,
  prefersReducedMotion,
  readMotionEnabled,
  setMotionEnabled,
} from "../lib/motion";

/**
 * MotionToggle — the site's one setting, as a real switch.
 *
 * Not a link, not a checkbox pretending: `role="switch"` on a button, with
 * `aria-checked` carrying the state, so a screen reader announces "Motion,
 * switch, on" and a keyboard reaches it with Tab and flips it with Space or
 * Enter. The visible state is the knob's position and the track's rule colour;
 * the announced state is echoed in a polite live region, because a switch that
 * changes a page's behaviour should say so once, audibly.
 *
 * The OS preference is not a choice this control can override: if the visitor's
 * system asks for less motion, the switch shows off and stays off until the OS
 * preference changes. It is persisted under `nnl-motion` by
 * `setMotionEnabled()`.
 */
export function MotionToggle() {
  const [stored, setStored] = useState(readMotionEnabled);
  /* Reduced preference can change at runtime (an OS setting, or a laptop
     entering power-saving); re-read it when the query changes. */
  const [reduced, setReduced] = useState(prefersReducedMotion);

  useEffect(() => {
    const sync = () => setStored(readMotionEnabled());
    window.addEventListener(MOTION_CHANGE_EVENT, sync);

    let detach = () => {};
    try {
      const media = window.matchMedia("(prefers-reduced-motion: reduce)");
      const onChange = () => setReduced(media.matches);
      media.addEventListener("change", onChange);
      detach = () => media.removeEventListener("change", onChange);
    } catch {
      /* No media query support — `prefersReducedMotion()` already said reduce. */
    }

    return () => {
      window.removeEventListener(MOTION_CHANGE_EVENT, sync);
      detach();
    };
  }, []);

  const on = stored && !reduced;

  return (
    <div className="motion-toggle">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        className="motion-toggle__switch"
        onClick={() => setMotionEnabled(!on)}
      >
        <span className="data motion-toggle__label">Motion</span>
        <span className="motion-toggle__track" aria-hidden="true">
          <span className="motion-toggle__knob" />
        </span>
      </button>
      <span role="status" aria-live="polite" className="motion-toggle__status">
        {on ? "Motion on" : "Motion off"}
      </span>
    </div>
  );
}
