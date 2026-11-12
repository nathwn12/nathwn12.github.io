import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { MOTION_CHANGE_EVENT, motionAllowed } from "../lib/motion";

/**
 * MarqueeFigures — the measured strip, moving.
 *
 * One linear loop: the figures travel left by exactly half the track, which is
 * the width of one copy, so the join is invisible and the second copy is the
 * first. The duplicate is `aria-hidden` — a screen reader hears seven figures,
 * once — and the whole strip stops when a pointer or a focus lands on it, and
 * does not start at all when motion is off. With motion off the track sits at
 * its origin and the first copy is the strip.
 *
 * This is the only looping motion on the site. Everything else resolves once.
 */

interface MarqueeItem {
  value: string;
  label: string;
}

const DURATION = 42;

export function MarqueeFigures({ items }: { items: MarqueeItem[] }) {
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
    <div className="overflow-hidden border-y border-[color:var(--rec-rule)]">
      <div ref={trackRef} className="flex w-max">
        {[0, 1].map((copy) => (
          <ul
            key={copy}
            aria-hidden={copy === 1 ? "true" : undefined}
            className="flex items-center"
          >
            {items.map((item) => (
              <li
                key={`${copy}-${item.label}`}
                className="flex shrink-0 items-center gap-3 py-3 pr-0 pl-6 whitespace-nowrap"
              >
                <span className="font-mono text-[0.9375rem] leading-none tracking-[-0.01em] tabular-nums text-[color:var(--rec-measure)]">
                  {item.value}
                </span>
                <span className="text-[0.8125rem] leading-[1.3] text-[color:var(--rec-ink-muted)]">
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
  );
}
