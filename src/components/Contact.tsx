import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CONTACT_EMAIL } from "../lib/contact";
import { credentials } from "../content/credentials";
import { fadeIn, fadeUp } from "../lib/motion";
import { PageFoot } from "./PageFoot";

/**
 * Contact — the conversion point, and the quietest page on the site.
 *
 * Authority: docs/premium-direction.md § Per-route application, Contact.
 * Order: title block, address block (email link phrase, location in words),
 * one "Reach me" band with the three keyless actions in fixed order, then
 * the four verified credentials inline with verification links.
 *
 * Keyless by owner order (2026-10-20): there is no form on this page. The
 * previous relay-backed compose form posted through a third party; the page
 * now offers three actions that need no account, no relay, and no key —
 * a prefilled `mailto:` draft first, a copy-address button for visitors
 * without a mail client, and a public-issue link for non-private messages.
 *
 * Route identity (this route's alone): a two-column address plate. The email
 * link phrase and the location sit side by side at `sm` as labelled pairs,
 * so the page opens on a plate rather than a paragraph. The one primary
 * action phrase in the title block opens the prefilled draft — the same
 * draft as the band's primary control, never a second address copy.
 *
 * Rhythm: the direction's 8px base held strictly — section gaps 64px (mt-16),
 * text gaps 16px (mt-4); credentials are the one dense list (py-4).
 *
 * Motion: the title block rises once (fadeUp) and the reach-me block settles
 * a beat later (fadeIn) — unconditionally, since the OS reduced-motion query
 * no longer gates this site (owner order 2026-10-14).
 *
 * The copy control owns two visible states, announced through one
 * always-mounted polite live region: the address on the button, and the
 * confirmation once it is on the clipboard. A failed copy keeps the address
 * on screen and says so in the same region, so the visitor is never left
 * guessing.
 */

const LINK = "font-medium text-accent-text hover:underline";
const ACTION =
  "mt-8 inline-flex min-h-11 items-center rounded-xs text-label font-semibold text-accent-text transition-colors duration-link hover:underline";
/* The band's primary control wears the old send control's solid treatment:
   accent ground, primary weight, same 44px minimum target. */
const PRIMARY_BUTTON =
  "inline-flex min-h-11 items-center rounded-sm bg-accent px-6 py-3 text-label font-semibold text-bg transition-colors duration-submit";
/* Secondary controls are bordered chips: quieter than the primary, still
   full 44px targets with visible text labels. */
const SECONDARY_BUTTON =
  "inline-flex min-h-11 items-center rounded-sm border border-border px-6 py-3 text-label font-semibold text-text transition-colors duration-submit hover:border-border-accent";

const MAIL_SUBJECT = "Portfolio enquiry";
const MAIL_BODY = `Hi Nathaniel,

I found your portfolio and wanted to talk about [a role / a system / a problem worth solving].

— [Your name]`;

const MAILTO_HREF =
  `mailto:${CONTACT_EMAIL}` +
  `?subject=${encodeURIComponent(MAIL_SUBJECT)}` +
  `&body=${encodeURIComponent(MAIL_BODY)}`;

const ISSUES_HREF = "https://github.com/nathwn12/nathwn12/issues/new";

const COPY_RESET_MS = 3000;

export function Contact() {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const resetTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current !== null) {
        window.clearTimeout(resetTimer.current);
      }
    };
  }, []);

  async function handleCopy() {
    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        await navigator.clipboard.writeText(CONTACT_EMAIL);
      } else {
        /* Clipboard API absent (old client, locked-down permissions):
           select a temporary field and copy the old way. */
        const field = document.createElement("textarea");
        field.value = CONTACT_EMAIL;
        field.setAttribute("readonly", "");
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(field);
        if (!ok) throw new Error("copy refused");
      }
      setCopyFailed(false);
      setCopied(true);
    } catch {
      setCopyFailed(true);
      setCopied(false);
      return;
    }
    if (resetTimer.current !== null) {
      window.clearTimeout(resetTimer.current);
    }
    resetTimer.current = window.setTimeout(() => {
      setCopied(false);
      resetTimer.current = null;
    }, COPY_RESET_MS);
  }

  return (
    <section id="contact" className="px-6 py-16 lg:px-10">
      <div className="mx-auto w-full max-w-[68ch]">
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <h1 className="text-display font-semibold text-text">Contact</h1>
          <p className="mt-4 max-w-[65ch] text-lead text-text">
            Send a note about a role, a system, or a problem worth solving — it
            reaches my inbox directly and I answer from Hagonoy, Bulacan.
          </p>
          {/* The page's one primary action phrase, at the end of the title
              block (docs/premium-direction.md § Layout): it opens the
              prefilled draft, not a second copy of the address. */}
          <a href={MAILTO_HREF} className={ACTION}>
            Write an email
          </a>
        </motion.div>

        {/* Address plate: the direct email link phrase and the location in
            words, side by side as labelled pairs. */}
        <dl className="mt-16 grid grid-cols-1 gap-x-10 gap-y-6 border-t border-border pt-8 sm:grid-cols-2">
          <div>
            <dt className="text-label font-medium text-text-muted">
              Direct email
            </dt>
            <dd className="mt-2">
              <a
                href={MAILTO_HREF}
                className="break-words text-body font-semibold text-accent-text transition-colors duration-link hover:underline"
              >
                Write to {CONTACT_EMAIL}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-label font-medium text-text-muted">Location</dt>
            <dd className="mt-2 max-w-[65ch] text-body text-text">
              Hagonoy, Bulacan, Philippines, UTC+8 (Philippine time)
            </dd>
          </div>
        </dl>

        {/* Reach me: the three keyless actions, most direct first. */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="mt-16 border-t border-border pt-8"
        >
          <h2 className="text-headline font-semibold text-text">Reach me</h2>
          <p className="mt-4 max-w-[65ch] text-detail text-text-muted">
            No account, no form, nothing in between: your mail client opens
            with the subject and a short template already filled in.
          </p>

          <div className="mt-6 flex flex-col items-start gap-4">
            <a href={MAILTO_HREF} className={PRIMARY_BUTTON}>
              Write an email
            </a>
            <button
              type="button"
              onClick={handleCopy}
              className={SECONDARY_BUTTON}
            >
              {copied ? "Copied to the clipboard" : "Copy the email address"}
            </button>
            <a
              href={ISSUES_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className={`${LINK} flex min-h-11 items-center text-label`}
            >
              Open a GitHub issue for a non-private message
            </a>
          </div>

          <div
            role="status"
            className={
              copied || copyFailed
                ? "mt-6 max-w-[65ch] rounded-sm border border-border bg-surface p-4 text-body text-text"
                : "sr-only"
            }
          >
            {copied && (
              <p>
                <span className="font-semibold">Copied.</span> {CONTACT_EMAIL}{" "}
                is on your clipboard.
              </p>
            )}
            {copyFailed && (
              <p>
                Copying did not work here — the address is shown above, ready
                to select.
              </p>
            )}
          </div>

          <p className="mt-6 max-w-[65ch] text-detail text-text-muted">
            I read every note and usually answer within a day or two.
          </p>
        </motion.div>

        {/* Verified credentials — four real, externally verifiable entries,
            each with a link phrased as a full phrase */}
        <div className="mt-16 border-t border-border pt-8">
          <h2 className="text-headline font-semibold text-text">
            Credentials and degree
          </h2>
          <p className="mt-4 max-w-[65ch] text-detail text-text-muted">
            Four certificates, each with a public verification link. BS
            Information Technology, La Consolacion University Philippines, 2017
            to 2023.
          </p>

          <ul className="mt-6 border-t border-border">
            {credentials.map((cert) => (
              <li
                key={cert.id}
                className="grid grid-cols-1 gap-x-6 gap-y-1 border-b border-border py-4"
              >
                <p className="text-body font-semibold text-text">
                  {cert.title}
                </p>
                <p className="text-detail text-text-muted">
                  {cert.issuer}
                  {cert.date ? `, ${cert.date}` : ""}. Credential ID {cert.id}.
                </p>
                <a
                  href={cert.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${LINK} mt-1 flex min-h-11 w-fit items-center text-label`}
                >
                  Verify {cert.title} at {cert.issuer}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <PageFoot />
      </div>
    </section>
  );
}
