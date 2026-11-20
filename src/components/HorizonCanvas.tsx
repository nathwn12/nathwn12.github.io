import { useEffect, useRef, useState } from "react";
import {
  BlackHoleRenderer,
  type Quality,
} from "../lib/blackhole/renderer";

const STILL_TIME = 2.4;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true ||
    document.documentElement.dataset.motion === "off"
  );
}

/** Pick a starting ladder rung from the viewport; the DPR cap applies on top. */
function autoQuality(width: number): Quality {
  if (width < 600) return "low";
  if (width < 1600) return "medium";
  return "high";
}

export interface HorizonCanvasProps {
  /** Force a render rung. By default it follows the viewport width. */
  quality?: Quality;
  /** A composed moment used for the reduced-motion and fallback stills. */
  stillTime?: number;
  className?: string;
}

/**
 * The full-bleed event horizon. The canvas paints only when it is on screen,
 * the tab is visible, and motion is allowed; otherwise it holds a settled
 * frame. A still of the same shader sits underneath as the no-WebGL fallback.
 */
export default function HorizonCanvas({
  quality,
  stillTime = STILL_TIME,
  className = "",
}: HorizonCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [failed, setFailed] = useState(false);
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: BlackHoleRenderer;
    try {
      renderer = new BlackHoleRenderer(canvas, quality ?? autoQuality(window.innerWidth));
    } catch {
      setFailed(true);
      return;
    }

    let raf = 0;
    let elapsed = stillTime;
    let last = performance.now();
    let onScreen = true;
    let reduced = prefersReducedMotion();

    const renderStill = () => renderer.render(stillTime);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        renderer.resize(rect.width, rect.height, window.devicePixelRatio || 1);
        if (reduced) renderStill();
      }
    };

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.15);
      last = now;
      if (!document.hidden && onScreen && !reduced) {
        elapsed = (elapsed + dt) % 8;
        renderer.render(elapsed);
      }
      raf = requestAnimationFrame(frame);
    };

    const loop = () => {
      cancelAnimationFrame(raf);
      if (reduced) {
        renderStill();
      } else {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    const onVisibility = () => {
      last = performance.now();
    };
    const onMotionChange = () => {
      reduced = prefersReducedMotion();
      loop();
    };
    const onLost = (event: Event) => {
      event.preventDefault();
      cancelAnimationFrame(raf);
    };
    const onRestored = () => setGeneration((n) => n + 1);

    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        last = performance.now();
      },
      { rootMargin: "120px" },
    );
    observer.observe(canvas);
    const motionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    motionQuery?.addEventListener?.("change", onMotionChange);
    document.addEventListener("visibilitychange", onVisibility);
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    resize();
    loop();

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      resizeObserver.disconnect();
      motionQuery?.removeEventListener?.("change", onMotionChange);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      renderer.dispose();
    };
  }, [quality, stillTime, generation]);

  return (
    <div className={`horizon-field ${className}`} aria-hidden="true">
      <img className="horizon-still" src="/horizon-still.png" alt="" />
      <canvas
        ref={canvasRef}
        className={`horizon-canvas${failed ? " is-hidden" : ""}`}
      />
    </div>
  );
}
