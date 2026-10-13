import { motion } from "framer-motion";
import { experience, provenance } from "../content/experience";
import { projects } from "../content/projects";
import { credentials } from "../content/credentials";
import { fadeUp, staggerChild, staggerParent } from "../lib/motion";

/**
 * ProofBand — the landing's page proof marker, then the delivery provenance.
 *
 * What the data actually carries, stated plainly: the top-ranked open-source
 * project's own description sentence (the strongest shipped artifact, read
 * verbatim), then the delivery ledger line in Detail beside its provenance.
 * No project on this page has a measured production number, so none is claimed
 * here — the proof is that the work shipped and the ledger behind it. Values,
 * labels, and the ledger entry are read from src/content/*.ts — this file
 * formats and sequences, it never authors a fact.
 *
 * Choreography: the band is a stagger parent (staggerParent) and each element
 * walks in a short beat apart (fadeUp / staggerChild), revealed once when the
 * band enters the viewport. Reduced motion is honoured inside src/lib/motion.
 *
 * Authority: fleet brief (senior landing pass) + docs/premium-direction.md
 * § Landing ("one measured outcome as the page proof marker"), § Hard-ban list
 * ("hero metric walls").
 */

/** The one commit-ledger entry that carries the delivery numbers. */
const ledger = experience.find((entry) => entry.id === "01");

const LINK = "font-medium text-accent-text hover:underline";

export function ProofBand() {
  const [lead] = projects;

  return (
    <section aria-labelledby="proof-heading" className="px-6 pt-14 lg:px-10">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-15% 0px" }}
        variants={staggerParent}
        className="mx-auto w-full max-w-[68ch]"
      >
        <motion.h2
          id="proof-heading"
          variants={fadeUp}
          className="text-headline font-semibold text-text"
        >
          Built and shipped
        </motion.h2>

        <motion.p
          variants={staggerChild}
          className="mt-4 max-w-[65ch] text-lead text-text"
        >
          {lead.description}
        </motion.p>

        <motion.p
          variants={staggerChild}
          className="mt-4 max-w-[65ch] text-detail text-text-muted"
        >
          {ledger ? `${ledger.outcome} ` : ""}
          {provenance}
        </motion.p>
      </motion.div>
    </section>
  );
}

/**
 * CredentialsStrip — the landing's closing band: the four verified credentials
 * as plain inline items, each a verify link phrased as a full phrase.
 *
 * No stack of cards, no heading-level decoration beyond the one section
 * heading, and no icon standing in for the link's own words. The four verify
 * links are the band's whole content; each opens the issuer's public
 * verification page in a new tab.
 *
 * Authority: fleet brief + docs/premium-direction.md § Landing ("credentials
 * strip, four items inline"), § Per-route application, Contact.
 */
export function CredentialsStrip() {
  return (
    <section
      aria-labelledby="credentials-heading"
      className="px-6 pt-14 lg:px-10"
    >
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-15% 0px" }}
        variants={fadeUp}
        className="mx-auto w-full max-w-[68ch]"
      >
        <h2
          id="credentials-heading"
          className="text-headline font-semibold text-text"
        >
          Credentials
        </h2>

        <ul className="mt-4 flex flex-wrap gap-x-8">
          {credentials.map((cert) => (
            <li key={cert.id}>
              <a
                href={cert.url}
                target="_blank"
                rel="noopener noreferrer"
                data-nav-item
                className={`${LINK} flex min-h-11 items-center text-label`}
              >
                Verify {cert.title} at {cert.issuer}
              </a>
            </li>
          ))}
        </ul>
      </motion.div>
    </section>
  );
}
