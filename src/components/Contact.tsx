import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { CONTACT_EMAIL } from "../lib/contact";
import { WEB3FORMS_ENDPOINT, WEB3FORMS_KEY } from "../content/contact";
import { credentials } from "../content/credentials";
import { fadeIn, fadeUp } from "../lib/motion";
import { navigate } from "../lib/router";
import { PageFoot } from "./PageFoot";
import {
  Folio,
  GUTTER_CELL,
  GUTTER_CONTAINER,
  GUTTER_GRID,
  Kicker,
  folioFromKicker,
} from "./InstrumentBand";

/**
 * Contact — the conversion point, and the quietest page on the site.
 *
 * Authority: docs/premium-direction.md § Per-route application, Contact.
 * Order: title block, the relay form, address block (email link phrase,
 * location in words), one "Reach me" band with the three keyless actions in
 * fixed order, then the four verified credentials inline with verification
 * links.
 *
 * Form first, mailto beneath. The relay form posts JSON to Web3Forms (the
 * endpoint and the public access key live in src/content/contact.ts) and, on
 * `{"success":true}`, clears itself and navigates to `/thanks` — no
 * `redirect` field, since this is a SPA. A refused send (network failure or
 * `success:false`) keeps every word in the form and says so in an assertive
 * region with the direct address beside it, so the path never dead-ends. The
 * mailto draft, the copy-address button, and the public-issue link stay
 * unchanged beneath the form as the secondary path: or email me directly.
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
  "inline-flex min-h-11 items-center rounded-none bg-accent px-6 py-3 text-label font-semibold text-bg transition-colors duration-submit";
/* Secondary controls are bordered chips: quieter than the primary, still
   full 44px targets with visible text labels. */
const SECONDARY_BUTTON =
  "inline-flex min-h-11 items-center rounded-none border border-border px-6 py-3 text-label font-semibold text-text transition-colors duration-submit hover:border-border-accent";

const MAIL_SUBJECT = "Portfolio enquiry";
const MAIL_BODY = `Hi Nathaniel,

I found your portfolio and wanted to talk about [a role / a system / a problem worth solving].

— [Your name]`;

const MAILTO_HREF =
  `mailto:${CONTACT_EMAIL}` +
  `?subject=${encodeURIComponent(MAIL_SUBJECT)}` +
  `&body=${encodeURIComponent(MAIL_BODY)}`;

const ISSUES_HREF = "https://github.com/nathwn12/nathwn12/issues/new";

const THANKS_PATH = "/thanks";

/** The route's kicker — the folio's only source (see folioFromKicker). */
const KICKER = "09 / Contact";

/* Relay-form field chrome: quiet bordered controls on the page ground. */
const FIELD_LABEL = "block text-label font-medium text-text";
const FIELD_CONTROL =
  "mt-2 w-full rounded-none border border-border bg-bg px-4 py-3 text-body text-text transition-colors duration-field focus-visible:border-border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text";
const FIELD_INPUT = `${FIELD_CONTROL} min-h-11`;
const FIELD_ERROR_TEXT = "mt-2 min-h-[2.75rem] text-detail font-medium text-text";
const FIELD_WRAP = "mb-6";

/* Name needs at least 2 characters, the message at least 10; the address
   check stays deliberately simple — the relay validates for real. */
const EMAIL_RE = /^\S+@\S+\.\S+$/;

type FormStatus = "idle" | "submitting" | "error";

interface ContactFieldErrors {
  name?: string;
  email?: string;
  message?: string;
}

/**
 * The relay form, rendered above the mailto block. Posts JSON to
 * WEB3FORMS_ENDPOINT with the public access key; there is no `redirect`
 * field — this is a SPA, so the `{"success":true}` path clears the form and
 * calls `navigate(THANKS_PATH)` instead.
 */
function ContactForm() {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errors, setErrors] = useState<ContactFieldErrors>({});
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const submitting = status === "submitting";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "");
    const email = String(data.get("email") ?? "");
    const message = String(data.get("message") ?? "");

    /* Honeypot: a checked `botcheck` is a bot — abort silently, no POST,
       no error, no navigation. */
    if (data.get("botcheck")) return;

    const next: ContactFieldErrors = {};
    if (name.trim().length < 2) {
      next.name = "Enter your name (at least 2 characters).";
    }
    if (!EMAIL_RE.test(email.trim())) {
      next.email = "Enter an email address in the form name@example.com.";
    }
    if (message.trim().length < 10) {
      next.message = "Write your message (at least 10 characters).";
    }
    setErrors(next);
    if (next.name ?? next.email ?? next.message) {
      /* Focus the first invalid field, in form order. */
      (next.name ? nameRef : next.email ? emailRef : messageRef).current?.focus();
      return;
    }

    setStatus("submitting");
    try {
      const res = await fetch(WEB3FORMS_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: `Portfolio contact — ${name.trim()}`,
          from_name: name.trim(),
          botcheck: String(data.get("botcheck") ?? ""),
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
        }),
      });

      let ok = res.ok;
      try {
        const body: unknown = await res.json();
        if (typeof body === "object" && body !== null && "success" in body) {
          ok = res.ok && (body as { success?: boolean }).success === true;
        }
      } catch {
        /* Non-JSON body (proxy or gateway error page) — fall back to the
           HTTP status already read above. */
      }

      if (!ok) throw new Error("relay refused");
      /* Success clears the form before leaving for the confirmation. */
      form.reset();
      navigate(THANKS_PATH);
    } catch {
      /* Recovery is one activation: nothing is cleared, the words stay in
         the form, and the send control is live again. */
      setStatus("error");
    }
  }

  return (
    <div className="mt-16 border-t border-border pt-8">
      <h2 className="text-headline font-semibold text-text">Send a message</h2>
      <p className="mt-4 max-w-[65ch] text-detail text-text-muted">
        The fastest path to my inbox — I usually answer within a day or two.
        Prefer your own mail client?{" "}
        <a href={MAILTO_HREF} className={LINK}>
          Or email me directly
        </a>{" "}
        below.
      </p>

      {status === "error" && (
        <div
          role="alert"
          className="mt-6 max-w-[65ch] rounded-sm border border-border bg-surface p-4 text-body text-text"
        >
          <p>
            Could not send.{" "}
            <a href={MAILTO_HREF} className={`${LINK} break-words`}>
              Email me directly instead.
            </a>
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        aria-busy={submitting}
        className="mt-6"
      >
        {/* Honeypot: a checkbox bots fill and people never meet — off the
            tab order, no autocomplete, hidden from sight and assistive tech.
            A checked box aborts the submit silently (see handleSubmit). */}
        <input
          type="checkbox"
          name="botcheck"
          className="sr-only"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />

        <div className={FIELD_WRAP}>
          <label htmlFor="contact-name" className={FIELD_LABEL}>
            Your name
          </label>
          <input
            ref={nameRef}
            id="contact-name"
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
            aria-invalid={errors.name ? "true" : undefined}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
            className={FIELD_INPUT}
          />
          <p id="contact-name-error" className={FIELD_ERROR_TEXT}>
            {errors.name ?? ""}
          </p>
        </div>

        <div className={FIELD_WRAP}>
          <label htmlFor="contact-email" className={FIELD_LABEL}>
            Your email address
          </label>
          <input
            ref={emailRef}
            id="contact-email"
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            aria-invalid={errors.email ? "true" : undefined}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
            className={FIELD_INPUT}
          />
          <p id="contact-email-error" className={FIELD_ERROR_TEXT}>
            {errors.email ?? ""}
          </p>
        </div>

        <div className={FIELD_WRAP}>
          <label htmlFor="contact-message" className={FIELD_LABEL}>
            Message
          </label>
          <textarea
            ref={messageRef}
            id="contact-message"
            name="message"
            required
            rows={5}
            minLength={10}
            maxLength={5000}
            aria-invalid={errors.message ? "true" : undefined}
            aria-describedby={
              errors.message ? "contact-message-error" : undefined
            }
            className={`${FIELD_CONTROL} resize-y`}
          />
          <p id="contact-message-error" className={FIELD_ERROR_TEXT}>
            {errors.message ?? ""}
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-11 items-center rounded-none bg-accent px-6 py-3 text-label font-semibold text-bg transition-colors duration-submit disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Sending…" : "Send the message"}
        </button>
      </form>
    </div>
  );
}

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
    <section id="contact" className="px-6 py-16 lg:px-10 lg:py-24">
      <div className={`${GUTTER_CONTAINER} ${GUTTER_GRID}`}>
        <div aria-hidden="true" className={GUTTER_CELL}>
          <div className="lg:sticky lg:top-32">
            <Folio index={folioFromKicker(KICKER)} />
          </div>
        </div>
        <div className="relative min-w-0 lg:col-span-7">
          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <div aria-hidden="true" className="h-[3px] w-full bg-text" />
            <div className="flex items-baseline gap-3 pt-4">
              <Kicker>{KICKER}</Kicker>
            </div>
            <h1 className="masthead-name mt-3 text-text">Contact</h1>
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

          <div aria-hidden="true" className="mt-8 h-[3px] w-full bg-text" />

        {/* Relay form first; the mailto block stays unchanged beneath it as
            the secondary path. */}
        <ContactForm />

        {/* Address plate: the direct email link phrase and the location in
            words, side by side as labelled pairs. */}
        <dl className="mt-16 grid grid-cols-1 gap-x-6 gap-y-6 border-t border-border pt-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
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
          <div className="lg:col-span-5">
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
      </div>
    </section>
  );
}
