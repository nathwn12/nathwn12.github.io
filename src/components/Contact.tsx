import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { CONTACT_EMAIL, validateContactFields, type ContactField, type ContactFieldError } from "../lib/contact";
import { WEB3FORMS_KEY } from "../content/contact";
import { credentials } from "../content/credentials";
import { fadeIn, fadeUp } from "../lib/motion";
import { navigate } from "../lib/router";
import { PageFoot } from "./PageFoot";

/**
 * Contact — the conversion point, and the quietest page on the site.
 *
 * Authority: docs/premium-direction.md § Per-route application, Contact.
 * Order: title block, address block (email link phrase, location in words),
 * the relay form when a Web3Forms key is configured, one "Reach me" band
 * with the three keyless actions in fixed order, then the four verified
 * credentials inline with verification links.
 *
 * Two modes, one page. `WEB3FORMS_KEY` (src/content/contact.ts) is empty
 * until the owner pastes a Web3Forms access key:
 *   keyless (empty key) — the page is exactly the mailto draft, the
 *   copy-address button, and the public-issue link. No form posts nowhere.
 *   relay (non-empty key) — a "Send a message" band appears above "Reach
 *   me" and posts to https://api.web3forms.com/submit with the key as the
 *   hidden `access_key`, a fixed `subject` of `Portfolio enquiry`, a
 *   `redirect` of `/thanks`, and a `botcheck` honeypot. The copy button
 *   and the issue link stay in both modes — they work regardless of the key.
 *
 * The relay form owns three visible states and never leaves the visitor
 * guessing: field errors name the field beside it and again in a focused
 * summary that links back to each field; the send control reads
 * "Sending…" while the request is in flight; a refused send keeps every
 * word in the form and says what to fix in an assertive region with the
 * direct address beside it. Success navigates to `/thanks` (the hidden
 * redirect carries the same path for no-JS posts).
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

/* Relay-form field chrome: the retired compose form's tokens, unchanged. */
const FIELD =
  "w-full rounded-sm border border-border-accent bg-bg px-4 py-3 text-body text-text transition-colors duration-field";
const FIELD_LABEL = "block text-label font-medium text-text";
const FIELD_ERROR = "mt-2 text-detail font-medium text-text";
const FIELD_WRAP = "mb-6";
const SUMMARY_LINK = "font-medium text-text hover:underline";

const MAIL_SUBJECT = "Portfolio enquiry";
const MAIL_BODY = `Hi Nathaniel,

I found your portfolio and wanted to talk about [a role / a system / a problem worth solving].

— [Your name]`;

const MAILTO_HREF =
  `mailto:${CONTACT_EMAIL}` +
  `?subject=${encodeURIComponent(MAIL_SUBJECT)}` +
  `&body=${encodeURIComponent(MAIL_BODY)}`;

const ISSUES_HREF = "https://github.com/nathwn12/nathwn12/issues/new";

const WEB3FORMS_ACTION = "https://api.web3forms.com/submit";
const THANKS_PATH = "/thanks";

const COPY_RESET_MS = 3000;

/**
 * The relay form, rendered only when `WEB3FORMS_KEY` is non-empty.
 * Posts to Web3Forms with the key as hidden `access_key`; the fixed
 * subject and the `/thanks` redirect travel as hidden fields so a no-JS
 * post lands on the same confirmation the JS path navigates to.
 */
function ContactRelayForm() {
  const [errors, setErrors] = useState<ContactFieldError[]>([]);
  const [sendFailed, setSendFailed] = useState(false);
  const [sending, setSending] = useState(false);
  const alertRef = useRef<HTMLDivElement>(null);

  const errorFor = (field: ContactField) =>
    errors.find((error) => error.field === field)?.message;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;

    const form = event.currentTarget;
    const data = new FormData(form);

    /* Honeypot: a filled `botcheck` is accepted silently without POSTing,
       so bots get no signal either way. */
    if (String(data.get("botcheck") ?? "").length > 0) {
      navigate(THANKS_PATH);
      return;
    }

    /* The subject travels hidden and fixed, so validate it as the constant
       the relay actually sends — it can never fail, and its slot in the
       ordered errors never surfaces. */
    const fieldErrors = validateContactFields({
      name: data.get("name"),
      email: data.get("email"),
      subject: MAIL_SUBJECT,
      message: data.get("message"),
    }).filter((error) => error.field !== "subject");

    if (fieldErrors.length > 0) {
      setErrors(fieldErrors);
      setSendFailed(false);
      /* Focus the summary, not the first field: it lists every problem in
         form order and links each one back to its field. */
      requestAnimationFrame(() => alertRef.current?.focus());
      return;
    }

    setErrors([]);
    setSendFailed(false);
    setSending(true);

    try {
      const res = await fetch(form.action, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          name: String(data.get("name") ?? ""),
          email: String(data.get("email") ?? ""),
          subject: MAIL_SUBJECT,
          message: String(data.get("message") ?? ""),
          botcheck: "",
          redirect: THANKS_PATH,
        }),
      });

      let ok = res.ok;
      try {
        const body: unknown = await res.json();
        if (typeof body === "object" && body !== null && "success" in body) {
          ok = res.ok && (body as { success?: boolean }).success !== false;
        }
      } catch {
        /* Non-JSON body (proxy or gateway error page) — fall back to the
           HTTP status already read above. */
      }

      if (!ok) throw new Error("relay refused");
      navigate(THANKS_PATH);
    } catch {
      /* Recovery is one activation: nothing is cleared, the words stay in
         the form, and the send control is live again. */
      setSendFailed(true);
      requestAnimationFrame(() => alertRef.current?.focus());
    } finally {
      setSending(false);
    }
  }

  const alertVisible = errors.length > 0 || sendFailed;

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="mt-16 border-t border-border pt-8"
    >
      <h2 className="text-headline font-semibold text-text">Send a message</h2>
      <p className="mt-4 max-w-[65ch] text-detail text-text-muted">
        The fastest path to my inbox — your note arrives directly, and I
        usually answer within a day or two.
      </p>

      <div
        ref={alertRef}
        tabIndex={-1}
        role="alert"
        className={
          alertVisible
            ? "mt-6 rounded-sm border border-border-accent bg-surface p-4"
            : "sr-only"
        }
      >
        {errors.length > 0 && (
          <>
            <p className="text-label font-semibold text-text">
              There is a problem with{" "}
              {errors.length === 1 ? "one field" : `${errors.length} fields`} —
              fix {errors.length === 1 ? "it" : "them"} and send again.
            </p>
            <ul className="mt-2 list-disc pl-4">
              {errors.map((error) => (
                <li key={error.field} className="text-detail text-text">
                  <a
                    href={`#relay-${error.field}`}
                    className={SUMMARY_LINK}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(`relay-${error.field}`)?.focus();
                    }}
                  >
                    {error.message}
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}

        {sendFailed && (
          <>
            <p className="text-body font-semibold text-text">
              Your message was not sent.
            </p>
            <p className="mt-2 max-w-[65ch] text-detail text-text-muted">
              It is still in the form below. Check your connection and send
              it again, or reach me directly at{" "}
              <a
                href={MAILTO_HREF}
                className={`${LINK} break-words`}
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </>
        )}
      </div>

      <form
        action={WEB3FORMS_ACTION}
        method="POST"
        noValidate
        aria-busy={sending}
        onSubmit={handleSubmit}
        className="mt-6"
      >
        <input type="hidden" name="access_key" value={WEB3FORMS_KEY} />
        <input type="hidden" name="subject" value={MAIL_SUBJECT} />
        <input type="hidden" name="redirect" value={THANKS_PATH} />
        {/* Honeypot: a checkbox bots fill and people never meet — hidden
            from sight (CSS) and from assistive tech (aria-hidden, off the
            tab order, no autocomplete). */}
        <div aria-hidden="true" className="hidden">
          <input
            type="checkbox"
            name="botcheck"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
          />
        </div>

        <div className={FIELD_WRAP}>
          <label htmlFor="relay-name" className={FIELD_LABEL}>
            Your name
          </label>
          <input
            id="relay-name"
            name="name"
            type="text"
            required
            maxLength={100}
            autoComplete="name"
            aria-invalid={errorFor("name") ? true : undefined}
            aria-describedby={errorFor("name") ? "relay-name-error" : undefined}
            className={`mt-2 ${FIELD}`}
          />
          {errorFor("name") && (
            <p id="relay-name-error" className={FIELD_ERROR}>
              {errorFor("name")}
            </p>
          )}
        </div>

        <div className={FIELD_WRAP}>
          <label htmlFor="relay-email" className={FIELD_LABEL}>
            Your email address
          </label>
          <input
            id="relay-email"
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            aria-invalid={errorFor("email") ? true : undefined}
            aria-describedby={
              errorFor("email") ? "relay-email-error" : undefined
            }
            className={`mt-2 ${FIELD}`}
          />
          {errorFor("email") && (
            <p id="relay-email-error" className={FIELD_ERROR}>
              {errorFor("email")}
            </p>
          )}
        </div>

        <div className={FIELD_WRAP}>
          <label htmlFor="relay-message" className={FIELD_LABEL}>
            Message
          </label>
          <textarea
            id="relay-message"
            name="message"
            required
            rows={6}
            maxLength={5000}
            aria-invalid={errorFor("message") ? true : undefined}
            aria-describedby={
              errorFor("message") ? "relay-message-error" : undefined
            }
            className={`mt-2 resize-y ${FIELD}`}
          />
          {errorFor("message") && (
            <p id="relay-message-error" className={FIELD_ERROR}>
              {errorFor("message")}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={sending}
          className="flex min-h-11 items-center rounded-sm bg-accent px-6 py-3 text-label font-semibold text-bg transition-colors duration-submit disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending ? "Sending your message…" : "Send the message"}
        </button>

        <div
          role="status"
          className={sending ? "mt-6 max-w-[65ch] text-body text-text-muted" : "sr-only"}
        >
          {sending && <p>Sending your message…</p>}
        </div>
      </form>
    </motion.div>
  );
}

export function Contact() {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const resetTimer = useRef<number | null>(null);
  const relayEnabled = WEB3FORMS_KEY.length > 0;

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

        {/* Relay form: only when a Web3Forms key is configured. Empty key
            keeps this page exactly the keyless mailto + copy + issue path. */}
        {relayEnabled && <ContactRelayForm />}

        {/* Reach me: the three keyless actions, most direct first. They work
            in both modes — the relay never replaces them. */}
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
