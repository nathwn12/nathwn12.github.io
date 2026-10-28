import { useEffect, useRef, useState } from "react";
import { RouteLink, SectionLink, useRoute } from "../lib/router";

/**
 * Header - the wordmark and three destinations. Navigation only.
 *
 * The two documents used to sit here as well, which put the same pair of
 * downloads in the header, on the cover and in the footer - three copies of one
 * action. The header now carries destinations and nothing else: the cover keeps
 * its primary action row, and the footer carries both documents on the two
 * detail routes, which have no cover. The contact band no longer repeats them.
 *
 * ONE nav renders in both layouts, a row on desktop and a panel under the bar on
 * a phone, so there is no second set of links to keep in step. No palette, no
 * pager. The panel is `position: absolute` under the bar, so while it is open it
 * covers the content below; every link in it closes the panel as it navigates,
 * and the section link closes it before the scroll settles so the target band is
 * never read through an open menu.
 *
 * The only rule is the 2px ink under the bar - a structural boundary, not a
 * hairline divider: the header is sticky over a long scroll and needs one.
 */
export function Header() {
  const { route } = useRoute();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      toggleRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  /* A route change closes the menu; the new page is what the visitor asked for. */
  useEffect(() => {
    setOpen(false);
  }, [route.path]);

  return (
    <header className="site-header">
      <div className="frame">
        <div className="site-header__row">
          {/* The mark is a monogram, so its three letters say nothing to a
              screen reader or to voice control: the accessible name stays the
              full name, and the visible text is the mark alone. */}
          <RouteLink
            href="/"
            className="wordmark"
            aria-label="Nathaniel Nikolai Ladero — home"
            aria-current={route.path === "/" ? "page" : undefined}
          >
            NNL
          </RouteLink>

          <button
            ref={toggleRef}
            type="button"
            className="menu-toggle"
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
            className="site-nav"
            data-open={open ? "true" : "false"}
          >
            <RouteLink
              href="/experience"
              className="site-nav__link"
              aria-current={route.path === "/experience" ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              Experience
            </RouteLink>
            <RouteLink
              href="/projects"
              className="site-nav__link"
              aria-current={route.path === "/projects" ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              Projects
            </RouteLink>
            <SectionLink
              section="contact"
              className="site-nav__link"
              onClick={() => setOpen(false)}
            >
              Contact
            </SectionLink>
          </nav>
        </div>
      </div>
    </header>
  );
}
