import { CONTACT_EMAIL } from "../lib/contact";
import { RouteLink } from "../lib/router";

/**
 * Thanks — the relay confirmation at `/thanks`.
 *
 * One heading, one line confirming the message arrived, a link back home,
 * and the direct address as the fallback if nothing shows up. Same layout
 * primitives as the other pages (section shell, 68ch container, display
 * heading, accent action phrase). Like NotFound it is a terminal page, so it
 * carries no PageFoot pager — there is nowhere adjacent to go.
 */
const MAILTO_HREF = `mailto:${CONTACT_EMAIL}`;

export function Thanks() {
  return (
    <section id="thanks" className="px-6 py-16 lg:px-10">
      <div className="mx-auto w-full max-w-[68ch]">
        <h1 className="text-display font-semibold text-text">
          Your message is on its way
        </h1>
        <p className="mt-4 max-w-[65ch] text-body text-text-muted">
          It arrived safely — I read every note and usually answer within a
          day or two.
        </p>
        <RouteLink
          href="/"
          data-nav-item
          className="mt-8 inline-flex min-h-11 items-center rounded-xs text-label font-semibold text-accent-text transition-colors duration-link hover:underline"
        >
          Return to the home page
        </RouteLink>
        <p className="mt-4 max-w-[65ch] text-detail text-text-muted">
          If nothing shows up within a few days,{" "}
          <a
            href={MAILTO_HREF}
            className="font-medium text-accent-text hover:underline"
          >
            email me directly at {CONTACT_EMAIL}
          </a>
          .
        </p>
      </div>
    </section>
  );
}
