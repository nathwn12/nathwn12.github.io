import { useEffect, useRef, useState } from "react";

type SaveDataNavigator = Navigator & { connection?: { saveData?: boolean } };

/** The still is the base paint and the LCP. The recorded loop is an opt-in
 *  premium: it attaches only on a fine pointer at desktop width with motion
 *  allowed and saveData off, and fades in only while it is actually playing. */
export default function HorizonVideo() {
  const desktopRef = useRef<HTMLVideoElement>(null);
  const phoneRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const eligible =
      window.matchMedia("(pointer: fine)").matches &&
      window.matchMedia("(min-width: 1100px)").matches &&
      window.matchMedia("(prefers-reduced-motion: no-preference)").matches &&
      (navigator as SaveDataNavigator).connection?.saveData !== true;
    if (!eligible) return;

    const active = desktopRef.current;
    const inactive = phoneRef.current;
    if (!active) return;
    inactive?.pause();
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    active.addEventListener("play", onPlay);
    active.addEventListener("pause", onPause);

    const play = (): void => {
      if (!document.hidden && active.getBoundingClientRect().bottom > 0) {
        void active.play().catch(() => setPlaying(false));
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
      active.removeEventListener("play", onPlay);
      active.removeEventListener("pause", onPause);
      active.pause();
      inactive?.pause();
    };
  }, []);

  return (
    <>
      <img
        className="horizon-media horizon-still horizon-desktop"
        src="/horizon-poster-desktop.webp"
        alt="A stellar singularity on true black, with a thin photon ring and a resolved accretion disc"
        loading="eager"
        fetchPriority="high"
      />
      <img
        className="horizon-media horizon-still horizon-phone"
        src="/horizon-poster-phone.webp"
        alt=""
        loading="eager"
        fetchPriority="high"
      />
      <video
        ref={desktopRef}
        className={`horizon-media horizon-desktop${playing ? " is-playing" : ""}`}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
      >
        <source src="/horizon-desktop.webm" type="video/webm; codecs=av1" />
        <source src="/horizon-desktop.mp4" type="video/mp4; codecs=avc1.42E01E" />
      </video>
      <video
        ref={phoneRef}
        className="horizon-media horizon-phone"
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
      >
        <source src="/horizon-phone.webm" type="video/webm; codecs=av1" />
        <source src="/horizon-phone.mp4" type="video/mp4; codecs=avc1.42E01E" />
      </video>
    </>
  );
}
