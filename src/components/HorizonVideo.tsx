import { useEffect, useRef, useState } from "react";

const RATE = 0.7;
const PORTRAIT_QUERY = "(max-aspect-ratio: 1/1)";
const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function matches(query: string): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.(query).matches === true;
}

/** The recorded shader loop. No WebGL context is created on this page. */
export default function HorizonVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
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
    const codec = video.canPlayType('video/webm; codecs="vp9"')
      ? "webm"
      : "mp4";
    const source = `/horizon-${master}.${codec}`;
    const poster = `/horizon-poster-${master}.webp`;
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

    if (video.getAttribute("src") !== source) {
      video.classList.add("is-swapping");
      video.poster = poster;
      video.src = source;
      video.load();
      video.addEventListener("canplay", onReady, { once: true });
    } else {
      video.poster = poster;
      play();
    }

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
  }, [master, reduced]);

  return (
    <div className="horizon-video-wrap" ref={wrapRef} aria-hidden="true">
      <video
        ref={videoRef}
        className="horizon-video"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/horizon-poster-desktop.webp"
      />
      <picture className="horizon-poster">
        <source
          media="(max-aspect-ratio: 1/1)"
          srcSet="/horizon-poster-phone.webp"
        />
        <img src="/horizon-poster-desktop.webp" alt="" />
      </picture>
      <div className="horizon-fade" />
    </div>
  );
}
