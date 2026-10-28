import { useEffect, useRef, useState } from "react";
import { CONTACT_EMAIL } from "../lib/contact";
import { CONTACT_CTA, contactBlock } from "../content/ledger";
import { Reveal } from "./Reveal";

/**
 * Contact — the record's last band, and the only place to reach a person.
 *
 * There is no form. The relay form that used to sit here posted to a
 * third-party service and depended on a public key and a confirmation route;
 * both are retired. What is left are the things that always work: a mailto with
 * the subject and opening line already written, the address as text for a
 * visitor with no mail client, a copy control, and the public issue tracker for
 * a message that is not private about a repository.
 *
 * The documents do not live here. The cover carries the pair on the record, and
 * the footer carries it on the two detail routes, which are the only routes
 * without a cover; the contact band used to repeat the same two downloads a
 * third time in the closing viewport. The availability sentence does not live
 * here either: it is stated once where a reader meets it, at the top of the
 * record, and a second copy in the closing viewport said the same thing twice.
 *
 * The address is the primary action and the submit path's "Email me" phrase
 * stays on the mailto, so the site keeps one contact phrase.
 */

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
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
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
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => {
      setCopied(false);
      resetTimer.current = null;
    }, COPY_RESET_MS);
  }

  return (
    <section
      id="contact"
      className="band field-strong"
      aria-labelledby="contact-heading"
    >
      <div className="frame">
        <div className="grid gap-x-10 gap-y-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Reveal>
              <h2 id="contact-heading" className="h2">
                {contactBlock.heading}
              </h2>
              <p className="lede mt-4 max-w-[44ch]">{contactBlock.line}</p>

              <div className="mt-7">
                <a href={MAILTO_HREF} className="button">
                  {CONTACT_CTA}
                </a>
              </div>

              <p className="meta muted mt-5">{contactBlock.directLabel}</p>
              <a
                href={MAILTO_HREF}
                className="text-action break-all text-[1rem] font-semibold"
              >
                {CONTACT_EMAIL}
              </a>

              <div className="mt-3 flex flex-col items-start gap-1">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-action"
                >
                  {copied ? "Copied to the clipboard" : "Copy the email address"}
                </button>
                <a
                  href={ISSUES_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-action"
                >
                  Open a GitHub issue for a non-private message
                </a>
              </div>

              <div
                role="status"
                className={
                  copied || copyFailed
                    ? "mt-4 max-w-[40ch] bg-bg p-4 text-body text-text"
                    : "sr-only"
                }
              >
                {copied && (
                  <p>
                    <span className="font-semibold">Copied.</span>{" "}
                    {CONTACT_EMAIL} is on your clipboard.
                  </p>
                )}
                {copyFailed && (
                  <p>
                    Copying did not work here — the address is shown above, ready
                    to select.
                  </p>
                )}
              </div>

              <p className="meta muted mt-6 max-w-[40ch]">
                {contactBlock.nextStep}
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
