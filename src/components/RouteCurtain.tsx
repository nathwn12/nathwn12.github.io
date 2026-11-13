import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { motionAllowed } from "../lib/motion";

/**
 * RouteCurtain — the seam between two pages.
 *
 * A route change is a scene change, so it is covered: the ground panel wipes up
 * from the bottom (240ms, `power2.in`), the router swaps the page while the
 * panel fills the viewport, and the panel carries on up and out (420ms). The
 * brand mark rides on the panel, so the seam is never a blank flash.
 *
 * One engine, one outcome. The curtain is the route transition in every
 * browser: the native View Transitions branch was removed so a Chrome visitor
 * and a Firefox visitor see the same seam, and so there is one code path to
 * keep correct. It is skipped entirely under a reduced-motion preference or
 * with the site's Motion switch off — the router then commits synchronously,
 * which is a correct page change, just not an animated one.
 *
 * It never traps focus and never locks scrolling past the transition: the
 * overlay is `aria-hidden`, `pointer-events: none`, and its only job is to be
 * looked at for 660ms. A second navigation mid-transition cancels the running
 * timeline, commits the pending route immediately (a navigation is never lost
 * to an animation), and starts again.
 */

let panel: HTMLElement | null = null;
let running: { cancel(): void } | null = null;

const EXIT_S = 0.14;
const ENTER_S = 0.24;

/** The mounted overlay element, registered by <RouteCurtain />. */
export function registerCurtain(el: HTMLElement | null): void {
  panel = el;
}

/** Play the wipe, swapping the page at the seam. Commits immediately when it cannot animate. */
export function playRouteCurtain(swap: () => void): void {
  const el = panel;
  if (!el || !motionAllowed()) {
    swap();
    return;
  }

  /* A navigation that arrives mid-wipe must not be dropped, and must not leave
     the router showing a path the address bar never took. Cancel commits the
     pending swap first. */
  running?.cancel();

  let swapped = false;
  const swapOnce = () => {
    if (swapped) return;
    swapped = true;
    swap();
  };

  const timeline = gsap.timeline({
    defaults: { ease: "power2.inOut" },
    onComplete: () => {
      gsap.set(el, { autoAlpha: 0, yPercent: 100 });
      if (running === handle) running = null;
    },
  });

  const handle = {
    cancel() {
      timeline.kill();
      swapOnce();
      gsap.set(el, { autoAlpha: 0, yPercent: 100 });
      if (running === handle) running = null;
    },
  };
  running = handle;

  timeline
    /* The parked state lives in CSS as visibility/opacity, so this is the first
       transform GSAP writes: one viewport below, then up to cover, then through
       and away. */
    .set(el, { autoAlpha: 1, yPercent: 100 })
    .to(el, { yPercent: 0, duration: EXIT_S, ease: "power2.in" })
    .add(swapOnce)
    .to(el, { yPercent: -100, duration: ENTER_S, ease: "power3.inOut" })
    .set(el, { autoAlpha: 0, yPercent: 100 });
}

/**
 * The router's entry point: the curtain when motion is welcome, and a plain
 * synchronous commit when it is not. There is no second branch — every engine
 * gets the same wipe.
 */
export function routeTransition(swap: () => void): void {
  if (!motionAllowed()) {
    swap();
    return;
  }

  playRouteCurtain(swap);
}

/** The overlay itself. Mounted once, at the layout root, by <Chrome />. */
export function RouteCurtain() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerCurtain(ref.current);
    return () => registerCurtain(null);
  }, []);

  return (
    <div className="curtain" ref={ref} aria-hidden="true">
      <img
        className="curtain__mark"
        src="/brand/signature.svg"
        alt=""
        width="40"
        height="40"
        draggable={false}
      />
    </div>
  );
}
