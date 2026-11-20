import { useEffect, useRef, useState } from "react";

const RATE = 0.7;
const PORTRAIT_QUERY = "(max-aspect-ratio: 1/1)";
const MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const AV1 = 'video/mp4; codecs="av01.0.05M.08"';
const H264 = 'video/mp4; codecs="avc1.640028"';

export type HeroVariant = "a" | "b" | "c";

/**
 * The owner's picking lever. Only a, b and c are real; a missing or
 * unrecognised value is the default C. Read once — a change is a page load,
 * never a runtime source swap.
 */
export function heroVariantFromSearch(search: string): HeroVariant {
  const raw = new URLSearchParams(search).get("hero");
  return raw === "a" || raw === "b" || raw === "c" ? raw : "c";
}

function matches(query: string): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.(query).matches === true;
}

/**
 * The recorded shader loop. No WebGL context and no overlay layers: grain and
 * vignette are baked into every frame. One video, two sources per aspect — AV1
 * first, H.264 second — chosen by the browser.
 */
export default function HorizonVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
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
    const wrap = wrapRef.current;
    if (!video || !wrap) return;

    if (reduced) {
      video.pause();
      video.classList.add("is-still");
      return;
    }

    video.classList.remove("is-still");
    let onScreen = true;

    const play = () => {
      if (!onScreen || document.hidden || reduced) return;
      video.playbackRate = RATE;
      void video.play().catch(() => {
        /* low-power iOS may refuse; the poster stays legible */
      });
    };

    const onReady = () => {
      video.classList.remove("is-swapping");
      play();
    };

    // A new aspect means new <source> children. Re-run selection so the browser
    // picks the right master, and hold the poster until the first frame is up.
    video.classList.add("is-swapping");
    video.addEventListener("canplay", onReady, { once: true });
    video.load();

    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen) play();
        else video.pause();
      },
      { rootMargin: "120px" },
    );
    observer.observe(wrap);

    const onVisibility = () => {
      if (document.hidden) video.pause();
      else play();
    };

    const target = { x: 0, y: 0, scale: 1, rotate: 0 };
    const current = { ...target };
    let pointerX = 0;
    let pointerY = 0;
    let scrolled = 0;
    let raf = 0;

    const onPointer = (event: PointerEvent) => {
      pointerX = event.clientX / window.innerWidth - 0.5;
      pointerY = event.clientY / window.innerHeight - 0.5;
    };
    const onScroll = () => {
      scrolled = Math.min(window.scrollY / window.innerHeight, 1);
    };
    const tick = () => {
      target.x = pointerX * 14;
      target.y = pointerY * 10 - scrolled * 26;
      target.scale = 1.015 + scrolled * 0.05;
      target.rotate = pointerX * 0.35;
      current.x += (target.x - current.x) * 0.07;
      current.y += (target.y - current.y) * 0.07;
      current.scale += (target.scale - current.scale) * 0.07;
      current.rotate += (target.rotate - current.rotate) * 0.07;
      wrap.style.transform = `translate3d(${current.x.toFixed(2)}px, ${current.y.toFixed(2)}px, 0) scale(${current.scale.toFixed(4)}) rotate(${current.rotate.toFixed(3)}deg)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      video.removeEventListener("canplay", onReady);
      observer.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      video.pause();
    };
  }, [source, reduced]);

  return (
    <div className="horizon-video-wrap" ref={wrapRef} aria-hidden="true">
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
