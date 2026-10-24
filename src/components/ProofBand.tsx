import { motion } from "framer-motion";
import { experience, provenance } from "../content/experience";
import { credentials } from "../content/credentials";
import { fadeUp, staggerChild, staggerParent } from "../lib/motion";
import { BandShell } from "./InstrumentBand";

/**
 * ProofBand — the landing's page proof marker, then the delivery provenance.
 *
 * What the data actually carries, stated plainly: the payments delivery's own
 * outcome sentence (the strongest measured backend result, read verbatim),
 * then the delivery ledger line in Detail beside its provenance. Values,
 * labels, and the ledger entry are read from src/content/*.ts — this file
 * formats and sequences, it never authors a fact.
 *
 * Choreography: the band is a stagger parent (staggerParent) and each element
 * walks in a short beat apart (fadeUp / staggerChild), revealed once when the
 * band enters the viewport — unconditionally, since the OS reduced-motion query
 * no longer gates this site (owner order 2026-10-14).
 *
 * Authority: fleet brief (senior landing pass) + docs/premium-direction.md
 * § Landing ("one measured outcome as the page proof marker"), § Hard-ban list
 * ("hero metric walls").
 */

/** The payments entry carrying the strongest measured backend result. */
const payments = experience.find((entry) => entry.id === "02");

/** The one commit-ledger entry that carries the delivery numbers. */
const ledger = experience.find((entry) => entry.id === "01");

const LINK = "font-medium text-accent-text hover:underline";

export function ProofBand() {
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
          className="text-headline font-semibold text-text text-balance"
        >
          Built and shipped
        </motion.h2>

        <motion.p
          variants={staggerChild}
          className="mt-4 max-w-[65ch] text-lead text-text"
        >
          {payments ? payments.outcome : ""}
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
 * CredentialsStrip — the landing's closing band, with the same structural
 * weight as Forward: the four verified credentials as a two-column list, each
 * with a rule, the title, the issuer with its year, and the verify link —
 * every word read from src/content/credentials.ts.
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
    <BandShell
      kicker="05 / Credentials"
      title="Credentials"
      headingId="credentials-heading"
      band={4}
    >
      <motion.ul
        variants={fadeUp}
        className="mt-6 grid grid-cols-1 gap-x-8 lg:grid-cols-2"
      >
          {credentials.map((cert) => {
            const year = cert.date ? cert.date.split(" ").pop() : undefined;
            return (
              <li
                key={cert.id}
                className="border-t border-border py-4"
              >
                <p className="text-body font-semibold text-text">
                  {cert.title}
                </p>
                <p className="mt-1 font-mono text-micro uppercase tracking-[0.14em] text-text-muted">
                  {cert.issuer}
                  {year ? ` · ${year}` : ""}
                </p>
                <a
                  href={cert.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-nav-item
                  className={`${LINK} mt-1 flex min-h-11 w-fit items-center text-label`}
                >
                  Verify {cert.title} at {cert.issuer}
                </a>
              </li>
            );
          })}
        </motion.ul>
    </BandShell>
  );
}
