/**
 * stage-motion — one scalar, five shells, no trapped input.
 *
 * Native scrolling owns the document. This module reads the scroll position and
 * writes compositor properties directly on the elements that move. It never
 * writes a custom property per frame: a custom property on a parent invalidates
 * style for every descendant, and on a five-chapter document that is hundreds
 * of milliseconds of recalc per descent.
 *
 * Layout is measured on mount and on resize only. Nothing in the scroll path
 * calls getBoundingClientRect, offsetHeight or innerHeight.
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
  /** Re-measure the document after a font swap or layout change. */
  sync(): void;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

interface Shell {
  panel: HTMLElement;
  frame: HTMLElement;
  content: HTMLElement;
}

export function mountStageMotion(root: HTMLElement): StageMotionHandle {
  if (!motionAllowed()) {
    emit(0);
    return { destroy() {}, sync() {} };
  }

  const shells: Shell[] = [...root.querySelectorAll<HTMLElement>(".stage-panel")]
    .map((panel) => {
      const frame = panel.querySelector<HTMLElement>(".stage-panel__frame");
      const content = panel.querySelector<HTMLElement>(".stage-panel__content");
      return frame && content ? { panel, frame, content } : null;
    })
    .filter((shell): shell is Shell => shell !== null);
  let top = 0;
  let travel = 1;
  let viewport = 1;
  let frame = 0;
  let visible = document.visibilityState !== "hidden";
  let onScreen = true;
  let last = -1;

  const measure = () => {
    top = root.getBoundingClientRect().top + window.scrollY;
    viewport = window.innerHeight;
    travel = Math.max(1, root.offsetHeight - viewport);
  };

  const update = () => {
    frame = 0;
    if (!visible || !onScreen) return;

    const raw = clamp((window.scrollY - top) / travel, 0, 1) * (shells.length - 1);
    if (Math.abs(raw - last) < 0.0004) return;
    last = raw;
    emit(raw);

    for (let i = 0; i < shells.length; i += 1) {
      const shell = shells[i]!;
      const local = raw - i;
      const distance = Math.min(1, Math.abs(local));
      // The arriving content locks inside the centre band and snaps to grid.
      const landing = clamp((Math.abs(local) - 0.12) / 0.88, 0, 1);
      const pass = Math.sign(local) * landing;
      shell.frame.style.transform =
        `translate3d(0,0,${(-distance * 220).toFixed(1)}px) scale(${(1 - distance * 0.055).toFixed(4)})`;
      shell.content.style.transform = `translate3d(0,${(pass * 38).toFixed(1)}px,0)`;
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
  window.addEventListener("resize", onResize, { passive: true });

  function onResize() {
    measure();
    last = -1;
    schedule();
  }

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

  let resizeObserver: ResizeObserver | null = null;
  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => {
      measure();
      last = -1;
      schedule();
    });
    resizeObserver.observe(root);
  }

  measure();
  schedule();

  return {
    destroy() {
      if (frame) cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onResize);
      observer?.disconnect();
      resizeObserver?.disconnect();
    },
    sync() {
      measure();
      last = -1;
      schedule();
    },
  };
}
