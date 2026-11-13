import { useEffect, useRef, useState } from "react";
import { CONTACT_EMAIL } from "../lib/contact";
import { contactBlock } from "../content/ledger";
import { Seam } from "./Readout";

/**
 * Contact — the close, and the only place to reach a person.
 *
 * The display line is the band: "Tell me what has to hold up." It is in his
 * voice, it is the same claim the record opened on, and it asks a question
 * instead of announcing a channel — "Write to me about backend work." was the
 * fallback, and it says less.
 *
 * The address is the primary action and it is a real `mailto:` link, so the
 * whole band works with no script at all. `Copy address` is the enhancement for
 * a visitor who does not want to open a mail client: the clipboard API where it
 * exists, and where it does not — an insecure context, a refused permission —
 * the address is selected instead, so Ctrl+C still finishes the job. The
 * confirmation is one `role="status"` line that clears itself after two
 * seconds; nothing on this band moves.
 *
 * There is no form, no second copy of the availability sentence, and no list of
 * ways out: GitHub, LinkedIn and the documents belong to the footer, which sits
 * about 200px below this band on every route. One surface per fact.
 */

const MAIL_SUBJECT = "Portfolio enquiry";
const MAIL_BODY = `Hi Nathaniel,

I found your portfolio and wanted to talk about [a role / a system / a problem worth solving].

— [Your name]`;

const MAILTO_HREF =
  `mailto:${CONTACT_EMAIL}` +
  `?subject=${encodeURIComponent(MAIL_SUBJECT)}` +
  `&body=${encodeURIComponent(MAIL_BODY)}`;

/** The confirmation clears itself; two seconds is long enough to read. */
const RESET_MS = 2000;

type CopyState = "idle" | "copied" | "selected";

export function Contact() {
  const [state, setState] = useState<CopyState>("idle");
  const addressRef = useRef<HTMLAnchorElement>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  const scheduleReset = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setState("idle");
      timer.current = null;
    }, RESET_MS);
  };

  /** Select the visible address — the path that needs no clipboard at all. */
  const selectAddress = () => {
    const node = addressRef.current;
    const selection = window.getSelection();
    if (!node || !selection) return;
    const range = document.createRange();
    range.selectNodeContents(node);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  async function handleCopy() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("no clipboard");
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setState("copied");
    } catch {
      selectAddress();
      setState("selected");
    }
    scheduleReset();
  }

  const status =
    state === "copied"
      ? `${CONTACT_EMAIL} is on your clipboard.`
      : state === "selected"
        ? "The address is selected — press Ctrl+C or ⌘C to copy it."
        : "";

  return (
    <>
      <Seam />
      <section
        id="contact"
        aria-labelledby="contact-heading"
        className="py-[var(--rec-rhythm)] md:py-[var(--rec-rhythm-lg)]"
      >
        <div className="frame">
          <h2
            id="contact-heading"
            className="max-w-[20ch] font-display text-[length:clamp(2rem,1.2rem+2.8vw,3.75rem)] leading-[0.96] font-normal! tracking-[-0.02em]! text-[color:var(--rec-ink)]"
          >
            Tell me what has to hold up.
          </h2>

          <p className="mt-6 max-w-[52ch] text-[color:var(--rec-ink-muted)]">
            {contactBlock.line}
          </p>

          <p className="mt-6">
            <a
              ref={addressRef}
              href={MAILTO_HREF}
              data-magnetic
              className="inline-block break-all font-mono text-[length:clamp(1rem,0.7rem+1.3vw,1.5rem)] leading-[1.3] text-[color:var(--rec-ink)] underline decoration-[color:var(--rec-rule-strong)] decoration-1 underline-offset-[0.25em] transition-[color,text-decoration-color,border-color] duration-150 hover:text-[color:var(--rec-signal)]"
            >
              {CONTACT_EMAIL}
            </a>
          </p>

          <div className="mt-6 flex flex-wrap items-baseline gap-x-8 gap-y-3">
            <button
              type="button"
              onClick={handleCopy}
              className="data inline-flex min-h-11 items-center border border-[color:var(--rec-rule-strong)] px-4 text-[color:var(--rec-ink)] transition-[color,text-decoration-color,border-color] duration-150 hover:border-[color:var(--rec-signal)] hover:text-[color:var(--rec-signal)]"
            >
              {state === "copied" ? "Address copied" : "Copy address"}
            </button>
            <p className="data data--sm text-[color:var(--rec-ink-muted)]">
              {contactBlock.nextStep}
            </p>
          </div>

          <p
            role="status"
            aria-live="polite"
            className="data data--sm mt-3 min-h-[1.25rem] text-[color:var(--rec-measure)]"
          >
            {status}
          </p>
        </div>
      </section>
    </>
  );
}
