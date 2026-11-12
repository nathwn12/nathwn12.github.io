import { useEffect, useRef, useState } from "react";
import { RouteLink, useRoute } from "../lib/router";
import { getLenis } from "../lib/smooth";
import { motionAllowed } from "../lib/motion";

/**
 * Header — the instrument's top rail: the author mark, then three places to go.
 *
 * One nav renders in both layouts: a row on a desktop, a panel under the bar
 * below 900px. The panel is a panel, not a card menu — same links, same
 * hairline, opened by the trigger and closed by Escape, a route change, or
 * choosing a destination. While it is open the page behind it does not scroll
 * and focus cannot leave it; both are undone on close, and Escape returns focus
 * to the trigger that opened it.
 *
 * The active destination is stated with `aria-current="page"` and drawn with a
 * signal underline that grows from the left — one indicator, no second colour.
 * The author mark is the house signature, used exactly as the brand kit draws it.
 */
export function Header() {
  const { route } = useRoute();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);

  /* A route change closes the panel; the new page is what the visitor asked for. */
  useEffect(() => {
    setOpen(false);
  }, [route.path]);

  useEffect(() => {
    if (!open) return;
    const nav = navRef.current;
    const toggle = toggleRef.current;

    const links = () =>
      Array.from(nav?.querySelectorAll<HTMLElement>("a[href]") ?? []);

    /* Scroll lock: the page behind the panel stays where it is. Lenis is only
       stopped when it exists and motion is on — otherwise the native scroll is
       the scroller and `overflow: hidden` is the whole lock. */
    const lenis = motionAllowed() ? getLenis() : null;
    lenis?.stop();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    links()[0]?.focus({ preventScroll: true });

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        toggle?.focus();
        return;
      }
      if (event.key !== "Tab") return;

      const items = [toggle, ...links()].filter(
        (item): item is HTMLElement => item !== null,
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && (active === first || !items.includes(active as HTMLElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      if (motionAllowed()) getLenis()?.start();
    };
  }, [open]);

  return (
    <header className="masthead">
      <div className="frame masthead__row">
        {/* The mark is the signature, not a monogram: the image carries the
            brand exactly as drawn, and the link's own label carries the name a
            screen reader or voice control needs. */}
        <RouteLink
          href="/"
          className="masthead__mark"
          aria-label="Nathaniel Nikolai Ladero, home"
          onClick={() => setOpen(false)}
        >
          <img
            src="/brand/signature.svg"
            alt=""
            width="36"
            height="36"
            draggable={false}
          />
        </RouteLink>

        <button
          ref={toggleRef}
          type="button"
          className="masthead__trigger"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((current) => !current)}
        >
          {open ? "Close" : "Menu"}
        </button>

        <nav
          ref={navRef}
          id="site-nav"
          aria-label="Pages"
          className="masthead__nav"
          data-open={open ? "true" : "false"}
        >
          <RouteLink
            href="/"
            className="masthead__link data"
            aria-current={route.path === "/" ? "page" : undefined}
            onClick={() => setOpen(false)}
          >
            the record
          </RouteLink>
          <RouteLink
            href="/experience"
            className="masthead__link data"
            aria-current={route.path === "/experience" ? "page" : undefined}
            onClick={() => setOpen(false)}
          >
            experience
          </RouteLink>
          <RouteLink
            href="/projects"
            className="masthead__link data"
            aria-current={route.path === "/projects" ? "page" : undefined}
            onClick={() => setOpen(false)}
          >
            projects
          </RouteLink>
        </nav>
      </div>
    </header>
  );
}
