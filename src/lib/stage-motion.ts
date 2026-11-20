/**
 * stage-motion — one scalar, five shells, no trapped input.
 *
 * Native scrolling owns the document. This module only reads where the reader
 * is and writes compositor-friendly transforms: one continuous position from
 * 0 to 4 drives the camera through the orbital shells, the dust parallax, the
 * chapter marker, and the shader. Nothing here calls preventDefault, and there
 * is no scroll snap and no wheel, touch or key handler.
 *
 * The loop is event-driven: a scroll or resize schedules one frame, and the
 * frame is skipped while the tab is hidden or the stage is off screen. When
 * motion is off the module never starts at all; the resting layout in CSS is
 * the whole experience.
 */

import { motionAllowed } from "./motion";

type Listener = (position: number) => void;
const listeners = new Set<Listener>();

/** Subscribe to the continuous chapter position (0 .. chapters - 1). */
export function onStageProgress(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit(position: number): void {
  for (const listener of listeners) listener(position);
}

const flashListeners = new Set<() => void>();

/** Subscribe to the chapter flash used when View Transitions are absent. */
export function onStageFlash(listener: () => void): () => void {
  flashListeners.add(listener);
  return () => flashListeners.delete(listener);
}

/** Fire the lens flash on a chapter change. */
export function emitStageFlash(): void {
  for (const listener of flashListeners) listener();
}

export interface StageMotionHandle {
  destroy(): void;
  /** Jump the camera to a chapter position without a scroll animation. */
  sync(): void;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function mountStageMotion(root: HTMLElement): StageMotionHandle {
  if (!motionAllowed()) {
    // A static document still needs a definite position for the still frame.
    root.style.setProperty("--stage-pos", "0");
    emit(0);
    return { destroy() {}, sync() {} };
  }

  const panels = [...root.querySelectorAll<HTMLElement>(".stage-panel")];
  let frame = 0;
  let visible = document.visibilityState !== "hidden";
  let onScreen = true;
  let last = -1;

  const update = () => {
    frame = 0;
    if (!visible || !onScreen) return;

    const top = root.getBoundingClientRect().top + window.scrollY;
    const travel = Math.max(1, root.offsetHeight - window.innerHeight);
    const raw = clamp((window.scrollY - top) / travel, 0, 1) * (panels.length - 1);
    if (Math.abs(raw - last) < 0.0004) return;
    last = raw;

    root.style.setProperty("--stage-pos", raw.toFixed(4));
    emit(raw);

    for (let i = 0; i < panels.length; i += 1) {
      const local = raw - i;
      const distance = Math.min(1, Math.abs(local));
      const panel = panels[i];
      if (!panel) continue;
      // Depth is a real Z translation: the active shell is nearest, its
      // neighbours recede. Scale and blur are the same recession, never a
      // second effect. Type itself is never blurred.
      const z = -distance * 220;
      const scale = 1 - distance * 0.055;
      const front = clamp(1 - Math.abs(local), 0, 1);
      panel.style.setProperty("--shell-z", `${z.toFixed(1)}px`);
      panel.style.setProperty("--shell-scale", scale.toFixed(4));
      panel.style.setProperty("--shell-front", front.toFixed(3));
      // The arriving content locks to its grid position inside the centre
      // band instead of drifting through it: the eye sees it snap into place.
      const landing = clamp((Math.abs(local) - 0.12) / 0.88, 0, 1);
      panel.style.setProperty(
        "--shell-pass",
        (Math.sign(local) * landing).toFixed(3),
      );
    }
  };

  const schedule = () => {
    if (!frame && visible && onScreen) frame = requestAnimationFrame(update);
  };

  const onVisibility = () => {
    visible = document.visibilityState !== "hidden";
    if (visible) schedule();
  };
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });

  let observer: IntersectionObserver | null = null;
  if (typeof IntersectionObserver !== "undefined") {
    observer = new IntersectionObserver(
      (entries) => {
        onScreen = entries.some((entry) => entry.isIntersecting);
        if (onScreen) schedule();
      },
      { threshold: 0 },
    );
    observer.observe(root);
  }

  schedule();
  update();

  return {
    destroy() {
      if (frame) cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer?.disconnect();
    },
    sync() {
      last = -1;
      schedule();
    },
  };
}
