import { motion, useReducedMotion } from "framer-motion";
import { employer, experience } from "../content/experience";
import { projects } from "../content/projects";
import { RouteLink } from "../lib/router";
import {
  fadeUp,
  heroIn,
  marqueeX,
  staggerChild,
  staggerParent,
} from "../lib/motion";
import { CredentialsStrip, ProofBand } from "./ProofBand";
import { PageFoot } from "./PageFoot";
import { SystemAtlas } from "./SystemAtlas";
import { WorkTeaser } from "./WorkTeaser";

/**
 * Hero — the landing page, read as one statement followed by its evidence.
 *
 * Bands run in the direction's order (docs/premium-direction.md § Landing
 * wireframe): the title block carries the page's single moment of character
 * (weight and size, no second spectacle), the current role sits adjacent to it
 * in Detail, the real stack runs as a hairline-bounded seam, then the proof
 * marker, the selected work, and the credentials strip close the page — one
 * band after another, separated by 1px Line rules, so position carries
 * hierarchy instead of colour or cards.
 *
 * Copy is read from src/content/*.ts — this file states the claim and sequences
 * the evidence, it never authors a fact. Depth lives on the routes, not here:
 * there is no metric wall, no card grid, and no credentials list dressed as
 * decoration.
 *
 * Motion comes from src/lib/motion only (frozen token names): the statement
 * walks in per element (heroIn for the title, fadeUp for the clauses), the
 * stack seam scrolls only when the visitor permits motion, and every band
 * degrades to a static, fully legible state under reduced motion.
 *
 * Authority: fleet brief (senior landing pass) + docs/premium-direction.md
 * § Landing, § Type, § Principles 1 and 5.
 */

/* The seam's index: real identifiers from the shipped work, de-duplicated and
   order-preserved. Read-only from content. */
const techStrip: string[] = Array.from(
  new Set([
    ...projects.flatMap((project) => project.tech),
    ...experience.flatMap((entry) => entry.tech),
  ]),
);

export function Hero() {
  const reduceMotion = useReducedMotion() === true;

  return (
    <section id="hero" className="flex flex-col">
      {/* Title block — the one bold move on the page. Left aligned, one claim
          sentence, then the role stated in words with no separator glyphs. */}
      <div className="px-6 pt-14 pb-block lg:px-10 lg:pt-20">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerParent}
          className="mx-auto w-full max-w-[68ch]"
        >
          <motion.h1
            variants={heroIn}
            className="max-w-[16ch] text-[clamp(2.5rem,6vw,4rem)] leading-[1.04] font-semibold text-text"
          >
            Payment backends that hold up under production load.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-[62ch] text-lead text-text"
          >
            C# and ASP.NET Core, Ubuntu servers, Docker, and CI/CD, measured by
            what changed in production rather than by the size of the stack.
          </motion.p>

          <motion.p
            variants={fadeUp}
            className="mt-5 max-w-[62ch] text-detail text-text-muted"
          >
            {employer.role}, {employer.company}. {employer.location},{" "}
            {employer.period}.
          </motion.p>

          <motion.p variants={staggerChild} className="mt-8">
            <RouteLink
              href="/contact"
              data-nav-item
              className="flex min-h-11 w-fit items-center rounded-xs text-lead font-semibold text-accent-text transition-colors duration-150 hover:underline"
            >
              Get in touch about a role
            </RouteLink>
          </motion.p>
        </motion.div>
      </div>

      {/* The seam between the statement and its evidence: the real stack under
          two hairlines, moving only when the visitor permits motion. Each item
          is separated by a 1px Line rule, never a glyph. */}
      <div className="overflow-hidden border-y border-border py-3">
        <motion.ul
          aria-hidden="true"
          variants={marqueeX}
          animate={reduceMotion ? undefined : "animate"}
          className="flex w-max items-center"
        >
          {[...techStrip, ...techStrip].map((tech, index) => (
            <li
              key={`${tech}-${index}`}
              className="flex items-center gap-6 pr-6 text-detail text-text-muted"
            >
              {tech}
              <span className="h-3 w-px bg-border" aria-hidden="true" />
            </li>
          ))}
        </motion.ul>
      </div>

      <SystemAtlas />

      <ProofBand />

      <WorkTeaser />

      <CredentialsStrip />

      <div className="px-6 pb-section lg:px-10">
        <div className="mx-auto w-full max-w-[68ch]">
          <PageFoot accentResume />
        </div>
      </div>
    </section>
  );
}
