import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { MOTION_CHANGE_EVENT, motionAllowed } from "../lib/motion";

/**
 * Marquee — one set of facts, moving as ambient evidence.
 *
 * One linear loop: the items travel left by exactly half the track, which is the
 * width of one copy, so the join is invisible and the second copy is the first.
 * The duplicate is `aria-hidden` — a screen reader hears the set once — and the
 * whole strip stops when a pointer or a focus lands on it, and does not start at
 * all when motion is off. With motion off the track sits at its origin and the
 * first copy is the strip.
 *
 * The band decides what it carries. On the record it is the public work's
 * repository names: the same list the rows above state, running past as
 * evidence that there is more than three of them, without restating a figure
 * the band above already counted.
 *
 * This is the only looping motion on the site. Everything else resolves once.
 */

interface MarqueeItem {
  value: string;
  label: string;
}

const DURATION = 42;

export function Marquee({ items }: { items: MarqueeItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !motionAllowed()) return;

    const tween = gsap.to(track, {
      xPercent: -50,
      duration: DURATION,
      ease: "none",
      repeat: -1,
    });

    const holder = track.parentElement;
    const pause = () => tween.pause();
    const resume = () => tween.play();

    holder?.addEventListener("mouseenter", pause);
    holder?.addEventListener("mouseleave", resume);
    holder?.addEventListener("focusin", pause);
    holder?.addEventListener("focusout", resume);

    const onMotionChange = () => {
      if (motionAllowed()) {
        tween.play();
        return;
      }
      tween.kill();
      gsap.set(track, { xPercent: 0 });
    };
    window.addEventListener(MOTION_CHANGE_EVENT, onMotionChange);

    return () => {
      holder?.removeEventListener("mouseenter", pause);
      holder?.removeEventListener("mouseleave", resume);
      holder?.removeEventListener("focusin", pause);
      holder?.removeEventListener("focusout", resume);
      window.removeEventListener(MOTION_CHANGE_EVENT, onMotionChange);
      tween.kill();
    };
  }, []);

  return (
    /* Inside the frame, so the strip's own rules end on the same two edges as
       every seam and every table on the page. One copy of the track is wider
       than the frame at every width the frame allows, which is what makes the
       loop's join invisible: the window never reaches the end of a copy.

       The last 48px at each end are an alpha mask, not painted decoration —
       nothing is drawn there. Without it the window guillotines a word at the
       frame's rule on every frame, which is the "cut mid-word" defect: a ticker
       has to end somewhere, and a mask ends it without leaving half a letter.
       The track carries a 48px left margin so that at rest the first item sits
       inside the solid part of the mask, and `xPercent: -50` is measured on the
       track's own box, so the margin cannot drift the loop. */
    <div className="frame">
      <div className="overflow-hidden border-y border-[color:var(--rec-rule)]">
        <div
          className="overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(to right, transparent 0, #000 48px, #000 calc(100% - 48px), transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0, #000 48px, #000 calc(100% - 48px), transparent 100%)",
          }}
        >
          <div ref={trackRef} className="ml-12 flex w-max">
            {[0, 1].map((copy) => (
              <ul
                key={copy}
                aria-hidden={copy === 1 ? "true" : undefined}
                className="flex items-center"
              >
                {items.map((item) => (
                  <li
                    key={`${copy}-${item.value}`}
                    className="flex shrink-0 items-center gap-3 py-5 pr-8 whitespace-nowrap"
                  >
                    <span className="font-mono text-[0.9375rem] leading-none tracking-[-0.01em] text-[color:var(--rec-measure)]">
                      {item.value}
                    </span>
                    <span className="text-[0.8125rem] leading-none text-[color:var(--rec-ink-muted)]">
                      {item.label}
                    </span>
                    <span
                      aria-hidden="true"
                      className="ml-3 inline-block h-3 w-px bg-[color:var(--rec-rule-strong)]"
                    />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
