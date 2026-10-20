import { RouteLink } from "../lib/router";

/**
 * Thanks — the relay confirmation at `/thanks`.
 *
 * One short confirmation and a link home. Reached after a Web3Forms send
 * (the relay form's hidden `redirect` and its JS success path both land
 * here) and on a direct visit; it carries no form, no second action, and
 * no address of its own — the header nav and the shell footer already do
 * that work.
 */
export function Thanks() {
  return (
    <section id="thanks" className="px-6 py-16 lg:px-10">
      <div className="mx-auto w-full max-w-[68ch]">
        <h1 className="text-display font-semibold text-text">
          Your message is on its way
        </h1>
        <p className="mt-4 max-w-[65ch] text-body text-text-muted">
          I read every note and usually answer within a day or two.
        </p>
        <RouteLink
          href="/"
          data-nav-item
          className="mt-8 inline-flex min-h-11 items-center rounded-xs text-label font-semibold text-accent-text transition-colors duration-link hover:underline"
        >
          Return to the home page
        </RouteLink>
      </div>
    </section>
  );
}
