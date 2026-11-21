import { useEffect, useRef, useState } from "react";

/** The hero's one kinetic moment: a recorded singularity loop, decoded as
 *  video — no runtime shader cost. AV1 first, H.264 fallback, poster first. */
export default function HorizonVideo() {
  const desktopRef = useRef<HTMLVideoElement>(null);
  const phoneRef = useRef<HTMLVideoElement>(null);
  // Resolve the aspect before first paint so only the right master is ever
  // selected. Guarded for the static-markup test, where matchMedia is absent.
  const matches = (query: string): boolean =>
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(query).matches;
  const [phone, setPhone] = useState(() => matches("(max-aspect-ratio: 3/4)"));
  const [reduce, setReduce] = useState(() =>
    matches("(prefers-reduced-motion: reduce)"),
  );

  useEffect(() => {
    const aspect = window.matchMedia("(max-aspect-ratio: 3/4)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = (): void => {
      setPhone(aspect.matches);
      setReduce(motion.matches);
    };
    sync();
    aspect.addEventListener("change", sync);
    motion.addEventListener("change", sync);
    return () => {
      aspect.removeEventListener("change", sync);
      motion.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    const active = (phone ? phoneRef : desktopRef).current;
    const inactive = (phone ? desktopRef : phoneRef).current;
    // The inactive master never decodes: no autoPlay in the markup, so this
    // is the only place a stream can start or stop.
    inactive?.pause();
    if (!active || reduce) {
      active?.pause();
      return;
    }
    const play = (): void => {
      if (!document.hidden && active.getBoundingClientRect().bottom > 0) {
        void active.play().catch(() => {});
      } else {
        active.pause();
      }
    };
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) play();
      else active.pause();
    });
    observer.observe(active);
    document.addEventListener("visibilitychange", play);
    play();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", play);
      active.pause();
      inactive?.pause();
    };
  }, [phone, reduce]);

  /** The settled still is always in the markup. CSS picks it before paint
   *  under reduced motion — no hydration flash, and it works with JS off. */
  return (
    <>
      <img
        className="horizon-media horizon-still"
        src={phone ? "/horizon-poster-phone.webp" : "/horizon-poster-desktop.webp"}
        alt="A stellar singularity on true black, with a thin photon ring and a resolved accretion disc"
      />
      <video
        ref={desktopRef}
        className="horizon-media horizon-desktop"
        poster="/horizon-poster-desktop.webp"
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      >
        <source src="/horizon-desktop.webm" type="video/webm; codecs=av1" />
        <source src="/horizon-desktop.mp4" type="video/mp4; codecs=avc1.42E01E" />
      </video>
      <video
        ref={phoneRef}
        className="horizon-media horizon-phone"
        poster="/horizon-poster-phone.webp"
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      >
        <source src="/horizon-phone.webm" type="video/webm; codecs=av1" />
        <source src="/horizon-phone.mp4" type="video/mp4; codecs=avc1.42E01E" />
      </video>
    </>
  );
}
