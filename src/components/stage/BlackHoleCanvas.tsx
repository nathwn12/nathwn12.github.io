import { useEffect, useRef } from "react";
import { createBlackHole, type BlackHoleHandle } from "../../lib/blackhole";
import { motionAllowed } from "../../lib/motion";
import { onStageFlash, onStageProgress } from "../../lib/stage-motion";

interface Props {
  /** Reports whether the live shader is up, so the shell can hide the still. */
  onStatus(live: boolean): void;
}

/**
 * BlackHoleCanvas — the one moving surface on the page.
 *
 * With motion off, or without a GL context, nothing is drawn and
 * the CSS still underneath is the composition. The field carries no meaning;
 * it is aria-hidden and the chapters carry the words.
 */
export function BlackHoleCanvas({ onStatus }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !motionAllowed()) {
      onStatus(false);
      return;
    }

    let handle: BlackHoleHandle | null = null;
    try {
      handle = createBlackHole(canvas);
    } catch {
      handle = null;
    }
    const live = Boolean(handle?.live);
    onStatus(live);

    const unsubscribe = onStageProgress((position) => {
      handle?.setProgress(position);
    });
    const unflash = onStageFlash(() => handle?.flash());

    return () => {
      unsubscribe();
      unflash();
      handle?.destroy();
      onStatus(false);
    };
  }, [onStatus]);

  return <canvas ref={ref} className="bh-canvas" aria-hidden="true" />;
}

export default BlackHoleCanvas;
