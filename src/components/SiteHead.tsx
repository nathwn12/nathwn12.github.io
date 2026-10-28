import {
  RouteLink,
  useContactNavigation,
  useRoute,
} from "../lib/router";
import { NAV_ITEMS } from "../lib/routes";

/**
 * The static header. Three destinations, as the direction's cover has:
 * Record and Work are routes, Contact is the cover's contact section.
 * The wordmark returns home. No palette button, no résumé action, no menu:
 * the nav fits one line at every width, so there is nothing to collapse.
 */
export function SiteHead() {
  const { path } = useRoute();
  const onContact = useContactNavigation();

  return (
    <header className="site-head wrap">
      <RouteLink
        className="mark"
        href="/"
        aria-label="Nathaniel Nikolai Ladero, home"
      >
        nathwn12
      </RouteLink>
      <nav aria-label="Primary">
        {NAV_ITEMS.map((item) =>
          item.href.startsWith("/#") ? (
            <a key={item.label} href={item.href} onClick={onContact}>
              {item.label}
            </a>
          ) : (
            <RouteLink
              key={item.label}
              href={item.href}
              aria-current={path === item.href ? "page" : undefined}
            >
              {item.label}
            </RouteLink>
          ),
        )}
      </nav>
    </header>
  );
}
