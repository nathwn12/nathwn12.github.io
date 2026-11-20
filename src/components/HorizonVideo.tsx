import { useEffect, useRef, useState } from "react";

const RATE = 0.7;
const PORTRAIT_QUERY = "(max-aspect-ratio: 1/1)";
const MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const AV1 = 'video/mp4; codecs="av01.0.05M.08"';
const H264 = 'video/mp4; codecs="avc1.640028"';

export type HeroVariant = "a" | "b" | "c";

/** The owner's picking lever. Anything unrecognised is the default C. */
export function heroVariantFromSearch(search: string): HeroVariant {
  const raw = new URLSearchParams(search).get("hero");
  return raw === "a" || raw === "b" || raw === "c" ? raw : "c";
}

function matches(query: string): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.(query).matches === true;
}

const smooth = (a: number, b: number, t: number) => {
  const v = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return v * v * (3 - 2 * v);
};

/**
 * The recorded loop is the page's void: one fixed full-viewport layer. As the
 * page descends it recedes to an off-centre presence and dims; near the close
 * it swells back. One rAF loop writes transform and opacity only. Scroll is
 * read from a passive listener; the document height is cached on resize, so
 * the loop never forces layout.
 */
export default function HorizonVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const layerRef = useRef<HTMLDivElement | null>(null);
  const [variant] = useState(() =>
    heroVariantFromSearch(typeof window === "undefined" ? "" : window.location.search),
  );
  const [portrait, setPortrait] = useState(() => matches(PORTRAIT_QUERY));
  const [reduced, setReduced] = useState(
    () =>
      matches(MOTION_QUERY) ||
      document.documentElement.dataset.motion === "off",
  );

  useEffect(() => {
    const aspect = window.matchMedia?.(PORTRAIT_QUERY);
    const motion = window.matchMedia?.(MOTION_QUERY);
    const onAspect = () => setPortrait(aspect?.matches ?? false);
    const onMotion = () =>
      setReduced(
        (motion?.matches ?? false) ||
          document.documentElement.dataset.motion === "off",
      );
    aspect?.addEventListener?.("change", onAspect);
    motion?.addEventListener?.("change", onMotion);
    return () => {
      aspect?.removeEventListener?.("change", onAspect);
      motion?.removeEventListener?.("change", onMotion);
    };
  }, []);

  const master = portrait ? "phone" : "desktop";
  const source = `/horizon-${variant}-${master}`;
  const poster = `/horizon-${variant}-poster-${master}.webp`;

  useEffect(() => {
    const video = videoRef.current;
    const layer = layerRef.current;
    if (!video || !layer) return;

    if (reduced) {
      video.pause();
      video.classList.add("is-still");
      return;
    }

    video.classList.remove("is-still");
    let scrolled = 0;
    let max = 1;
    let depth = -1;
    let raf = 0;
    let pausedByDepth = false;

    const play = () => {
      if (document.hidden) return;
      video.playbackRate = RATE;
      void video.play().catch(() => {
        /* low-power iOS may refuse; the poster stays legible */
      });
    };
    const onReady = () => {
      video.classList.remove("is-swapping");
      play();
    };
    video.classList.add("is-swapping");
    video.addEventListener("canplay", onReady, { once: true });
    video.load();

    const measure = () => {
      max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      depth = -1;
    };
    const onScroll = () => {
      scrolled = window.scrollY;
    };
    const onVisibility = () => {
      if (document.hidden) video.pause();
      else if (!pausedByDepth) play();
    };
    const tick = () => {
      const next = Math.min(1, Math.max(0, scrolled / max));
      if (Math.abs(next - depth) > 0.0004) {
        depth = next;
        const dive = smooth(0, 0.72, depth);
        const swell = smooth(0.86, 1, depth);
        const scale = 1 - 0.88 * dive + 0.48 * swell;
        const opacity = 1 - 0.88 * dive + 0.38 * swell;
        const x = 0.3 * dive * window.innerWidth;
        const y = -0.18 * dive * window.innerHeight;
        layer.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
        layer.style.opacity = opacity.toFixed(4);
        layer.dataset.depth = depth.toFixed(4);
        if (depth > 0.3 && !pausedByDepth) {
          pausedByDepth = true;
          video.pause();
        } else if (depth < 0.2 && pausedByDepth) {
          pausedByDepth = false;
          play();
        }
      }
      raf = requestAnimationFrame(tick);
    };

    measure();
    raf = requestAnimationFrame(tick);
    window.addEventListener("resize", measure, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      video.removeEventListener("canplay", onReady);
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      video.pause();
    };
  }, [source, reduced]);

  return (
    <div
      className="horizon-layer"
      data-static={reduced ? "true" : "false"}
      ref={layerRef}
      aria-hidden="true"
    >
      <video
        ref={videoRef}
        className={`horizon-video horizon-video--${variant}`}
        autoPlay={!reduced}
        muted
        loop
        playsInline
        preload="metadata"
        poster={poster}
      >
        <source src={`${source}-av1.mp4`} type={AV1} />
        <source src={`${source}.mp4`} type={H264} />
      </video>
      <picture className="horizon-poster">
        <source
          media="(max-aspect-ratio: 1/1)"
          srcSet={`/horizon-${variant}-poster-phone.webp`}
        />
        <img src={`/horizon-${variant}-poster-desktop.webp`} alt="" />
      </picture>
    </div>
  );
}
