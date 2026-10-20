import { motion } from "framer-motion";
import { heroIn } from "../lib/motion";
import { RouteLink } from "../lib/router";
import { PageFoot } from "./PageFoot";
import { FeaturedGrid } from "./FeaturedGrid";
import { InstallStrip } from "./InstallStrip";
import { SecondTier } from "./SecondTier";

/**
 * Projects — spec-ordered portfolio refresh (B §2–§4).
 *
 * Order: terminal prompt header, featured grid (7 cards, spec order),
 * install strip (one copy-paste per installable), second tier + forks
 * (collapsed, forks badged), footer. Card anatomy and install strings come
 * from src/content/portfolio.ts — this file sequences only.
 *
 * Terminal language kept: the route's `ls -la projects/` prompt heads the
 * page, matching the router's command convention.
 */

const ACTION =
  "mt-8 inline-flex min-h-11 items-center rounded-xs text-label font-semibold text-accent-text transition-colors duration-link hover:underline";

export default function Projects() {
  return (
    <section id="projects" className="px-6 py-16 lg:px-10">
      <div className="mx-auto w-full max-w-[68ch] lg:max-w-[calc(68ch_+_4.5rem)]">
        <motion.div
          variants={heroIn}
          initial="hidden"
          animate="visible"
          className="lg:pl-[4.5rem]"
        >
          <p className="font-mono text-detail text-text-muted">
            $ ls -la projects/
          </p>
          <h1 className="mt-2 text-display font-semibold text-text">
            Projects
          </h1>
          <p className="mt-4 max-w-[65ch] text-lead text-text">
            I build tools that let AI agents operate real desktops, browsers,
            and developer workflows.
          </p>
          <p className="mt-4 max-w-[65ch] text-detail text-text-muted">
            Seven featured below, most installable first. Smaller tools and
            forks sit collapsed underneath — forks badged, never implied as
            own work.
          </p>
          <RouteLink href="/contact" className={ACTION}>
            Start a conversation about this work
          </RouteLink>
        </motion.div>

        <div className="lg:pl-[4.5rem]">
          <FeaturedGrid />
          <InstallStrip />
          <SecondTier />
        </div>

        <div className="lg:pl-[4.5rem]">
          <PageFoot />
        </div>
      </div>
    </section>
  );
}
