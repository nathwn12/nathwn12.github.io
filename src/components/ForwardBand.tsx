import { motion } from "framer-motion";
import { forward, forwardHeading } from "../content/forward";
import { staggerChild } from "../lib/motion";
import { BandShell } from "./InstrumentBand";

/**
 * ForwardBand — the landing's final band, after the open-source work and
 * before the credentials strip. Renders src/content/forward.ts: the
 * AI-assisted workflow, then the forward feats and development/learning
 * items. Same band conventions as the rest of the landing (section heading,
 * `max-w-[68ch]`, text tokens, no cards, no metric tiles, no hype). Every
 * string is read from src/content/forward.ts — this file formats and
 * sequences, it never authors a fact. Only the genuinely forward-looking
 * items render here (the workflow and learning sections): the shipped feats
 * already have their bands under Selected work, so they are not repeated.
 *
 * Authority: docs/premium-direction.md § Landing, § Type, § Hard-ban list.
 */

export function ForwardBand() {
  return (
    <BandShell
      kicker="04 / Forward"
      title={forwardHeading}
      headingId="forward-heading"
      band={3}
    >
        {forward
          .filter((item) => item.section !== "feat")
          .map((item) => (
            <motion.div key={item.id} variants={staggerChild} className="mt-6">
              <h3 className="text-title font-semibold text-text">
                {item.title}
              </h3>
              <p className="mt-2 max-w-[65ch] text-body text-text">
                {item.body}
              </p>
            </motion.div>
          ))}
    </BandShell>
  );
}
