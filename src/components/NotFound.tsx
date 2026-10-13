import { motion } from "framer-motion";
import { heroIn } from "../lib/motion";
import { RouteLink, useRoute } from "../lib/router";

/**
 * Not found — the plain 404 with one moment of character
 * (docs/premium-direction.md § Per-route application, "Not found": plain
 * title, one explanatory sentence, one primary action phrase returning home).
 *
 * Route identity (this route's alone, and a reading held from the previous
 * pass): the numeral stays. The page's one bold move is its own status — "404"
 * set oversized in the display face and muted, so the dead end reads as
 * deliberate rather than blank. There is no title-block rule, no lead
 * paragraph, no second action: after the numeral the page says what happened in
 * one sentence naming the address that failed, then offers one phrase home. No
 * command-line costume, no stack-trace framing, and no directory listing
 * standing in for navigation — the header nav and the shell footer already
 * carry every real route.
 *
 * Rhythm: the direction's 8px base — text gaps 16px (mt-4), the action 32px
 * below the sentence (mt-8).
 *
 * Motion: the numeral makes the page's single arrival (heroIn), which runs
 * unconditionally — the OS reduced-motion query no longer gates this site
 * (owner order 2026-10-14).
 *
 * The requested path survives from the router (`resolveRoute` echoes it) so a
 * mistyped address is visible in the sentence.
 */
export function NotFound() {
  const { path: requestedPath } = useRoute();

  return (
    <section id="not-found" className="px-6 py-16 lg:px-10">
      <div className="mx-auto w-full max-w-[68ch]">
        <motion.p
          variants={heroIn}
          initial="hidden"
          animate="visible"
          aria-hidden="true"
          className="font-display text-[clamp(3.5rem,9vw,6rem)] font-semibold leading-none text-text-muted"
        >
          404
        </motion.p>

        <h1 className="mt-8 text-display font-semibold text-text">
          This page does not exist
        </h1>

        <p className="mt-4 max-w-[65ch] text-body text-text-muted">
          Nothing lives at{" "}
          <span className="rounded-xs border border-border px-2 py-0.5 break-all font-medium text-text">
            {requestedPath}
          </span>
          — the address may be mistyped, or the page may have moved.
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
