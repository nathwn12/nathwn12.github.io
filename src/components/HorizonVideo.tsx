import { useEffect, useRef, useState } from "react";

/** The hero's one kinetic moment: a recorded singularity loop, decoded as
 *  video — no runtime shader cost. AV1 first, H.264 fallback, poster first. */
export default function HorizonVideo() {
  const desktopRef = useRef<HTMLVideoElement>(null);
  const phoneRef = useRef<HTMLVideoElement>(null);
  const [phone, setPhone] = useState(false);
  const [reduce, setReduce] = useState(false);

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
    const video = (phone ? phoneRef : desktopRef).current;
    if (!video || reduce) return;
    const play = (): void => {
      if (!document.hidden && video.getBoundingClientRect().bottom > 0) {
        void video.play().catch(() => {});
      } else {
        video.pause();
      }
    };
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) play();
      else video.pause();
    });
    observer.observe(video);
    document.addEventListener("visibilitychange", play);
    play();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", play);
      video.pause();
    };
  }, [phone, reduce]);

  /** Reduced motion shows the settled still: a complete static document. */
  if (reduce) {
    return (
      <img
        className="horizon-media"
        src={phone ? "/horizon-poster-phone.webp" : "/horizon-poster-desktop.webp"}
        alt="A stellar singularity on true black, with a thin photon ring and a resolved accretion disc"
      />
    );
  }

  return (
    <>
      <video
        ref={desktopRef}
        className="horizon-media horizon-desktop"
        poster="/horizon-poster-desktop.webp"
        autoPlay
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
        autoPlay
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
