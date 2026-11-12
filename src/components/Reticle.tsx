import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { MOTION_CHANGE_EVENT, motionAllowed } from "../lib/motion";

/**
 * Reticle — the crosshair and its positional readout.
 *
 * On a pointer-fine device the cursor becomes an instrument: a 1px crosshair
 * with a mono `x,y` readout pinned bottom-right. The readout is `aria-hidden`
 * and non-interactive — it is a measurement of the pointer, not content, and a
 * screen reader has no pointer to report.
 *
 * Elements marked `[data-magnetic]` (the primary call to action, and nothing
 * else) pull toward the pointer by 30% of the offset, clamped to 18px, easing
 * back on `elastic.out(1, 0.4)`. That is the only magnet on the page.
 *
 * It is mounted only when all three hold: the pointer is fine, motion is on,
 * and the OS does not ask for less. It unbinds every listener the moment any of
 * them stops being true — a coarse pointer has no cursor to draw, and a
 * reduced-motion visitor gets no followers.
 */
export function Reticle() {
  const crossRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof window.matchMedia !== "function") return;

    let media: MediaQueryList;
    try {
      media = window.matchMedia("(pointer: fine)");
    } catch {
      return;
    }

    let teardown: (() => void) | null = null;

    const start = () => {
      if (teardown || !media.matches || !motionAllowed()) return;

      const cross = crossRef.current;
      const readout = readoutRef.current;
      if (!cross || !readout) return;

      const moveX = gsap.quickTo(cross, "x", {
        duration: 0.35,
        ease: "power3.out",
      });
      const moveY = gsap.quickTo(cross, "y", {
        duration: 0.35,
        ease: "power3.out",
      });

      let frame = 0;
      let shown = false;
      let magnetic: HTMLElement | null = null;
      let magnetX: ReturnType<typeof gsap.quickTo> | null = null;
      let magnetY: ReturnType<typeof gsap.quickTo> | null = null;

      const releaseMagnet = () => {
        if (!magnetic) return;
        gsap.to(magnetic, {
          x: 0,
          y: 0,
          duration: 0.6,
          ease: "elastic.out(1, 0.4)",
        });
        magnetic = null;
        magnetX = null;
        magnetY = null;
      };

      const onPointerMove = (event: PointerEvent) => {
        if (!shown) {
          shown = true;
          gsap.set([cross, readout], { opacity: 1 });
        }
        moveX(event.clientX);
        moveY(event.clientY);

        if (!frame) {
          const { clientX, clientY } = event;
          frame = window.requestAnimationFrame(() => {
            frame = 0;
            readout.textContent = `${Math.round(clientX)},${Math.round(clientY)}`;
          });
        }

        const target =
          event.target instanceof Element
            ? event.target.closest<HTMLElement>("[data-magnetic]")
            : null;

        if (target !== magnetic) {
          releaseMagnet();
          magnetic = target;
          if (target) {
            const ease = "elastic.out(1, 0.4)";
            magnetX = gsap.quickTo(target, "x", { duration: 0.6, ease });
            magnetY = gsap.quickTo(target, "y", { duration: 0.6, ease });
          }
        }

        if (magnetic && magnetX && magnetY) {
          const rect = magnetic.getBoundingClientRect();
          const clamp = (value: number) => Math.max(-18, Math.min(18, value));
          magnetX(clamp((event.clientX - (rect.left + rect.width / 2)) * 0.3));
          magnetY(clamp((event.clientY - (rect.top + rect.height / 2)) * 0.3));
        }
      };

      const onPointerLeave = () => {
        releaseMagnet();
      };

      window.addEventListener("pointermove", onPointerMove, { passive: true });
      document.addEventListener("pointerleave", onPointerLeave);

      teardown = () => {
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
        releaseMagnet();
        window.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerleave", onPointerLeave);
        teardown = null;
      };
    };

    const stop = () => {
      teardown?.();
      teardown = null;
    };

    const refresh = () => {
      if (media.matches && motionAllowed()) start();
      else stop();
    };

    refresh();
    media.addEventListener("change", refresh);
    window.addEventListener(MOTION_CHANGE_EVENT, refresh);

    return () => {
      stop();
      media.removeEventListener("change", refresh);
      window.removeEventListener(MOTION_CHANGE_EVENT, refresh);
    };
  }, []);

  return (
    <div className="reticle" aria-hidden="true">
      <div className="reticle__cross" ref={crossRef} />
      <div className="reticle__readout data" ref={readoutRef}>
        0,0
      </div>
    </div>
  );
}
