import { useRef, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import {
  CONTACT_EMAIL,
  validateContactFields,
  type ContactField,
  type ContactFieldError,
} from "../lib/contact";
import { credentials } from "../content/credentials";
import { fadeIn, fadeUp } from "../lib/motion";
import { PageFoot } from "./PageFoot";

/**
 * Contact — the conversion point, and the quietest page on the site.
 *
 * Authority: docs/premium-direction.md § Per-route application, Contact.
 * Order is fixed and this file follows it literally: title block, address block
 * (email link phrase, location in words), one stacked form with a visible label
 * above every field, then the four verified credentials inline with
 * verification links.
 *
 * Route identity (this route's alone): a two-column address plate. The email
 * link phrase and the location sit side by side at `sm` as labelled pairs, so
 * the page opens on a plate rather than a paragraph, and the one primary action
 * phrase in the title block jumps straight to the form rather than imitating
 * the address below it. Every field is genuinely EMPTY on load: labels sit above
 * each control and no placeholder imitates a filled value, so nothing reads as
 * prefilled and nothing is mistaken for an answer. Errors are linked twice over:
 * one sentence beside the offending field, and a focused summary whose links
 * return to each field.
 *
 * Rhythm: the direction's 8px base held strictly — section gaps 64px (mt-16),
 * text gaps 16px (mt-4); credentials are the one dense list (py-4).
 *
 * Motion: the title block rises once (fadeUp) and the compose block settles a
 * beat later (fadeIn). Reduced motion is honoured inside src/lib/motion.
 *
 * The form owns five visible states, never one-at-a-time guesses:
 *   loading     — the send control is disabled and the status line reads
 *                 "Sending your message…" (aria-busy on the form)
 *   validation  — one sentence beside each offending field, plus an error
 *                 summary that takes focus and links back to every field
 *   error       — the mail service refused: the message stays in the form, the
 *                 send control is live again, and the direct address is offered
 *   disabled    — the send control while a request is in flight
 *   recovery    — nothing is cleared on failure, so retry is one activation
 *
 * Two live regions, both mounted from the first render so a state change is
 * announced instead of re-created: one polite status role for progress and
 * success, one assertive alert role for the validation summary and the send
 * failure (only one of those can be current, so they share a region and never
 * double-announce).
 *
 * The send contract is unchanged from the previous UI: the same FormSubmit
 * action, `_subject` / `_captcha` / `_honey` fields, field names, HTML5
 * constraints, and JSON POST. Only the presentation and the pre-submit
 * messages moved.
 */

type FormStatus =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; message: string }
  | { kind: "failed"; detail?: string };

const FIELD =
  "w-full rounded-sm border border-border-accent bg-bg px-4 py-3 text-body text-text transition-colors duration-field";
const FIELD_LABEL = "block text-label font-medium text-text";
const FIELD_ERROR = "mt-2 text-detail font-medium text-text";
const FIELD_WRAP = "mb-6";
const LINK = "font-medium text-accent-text hover:underline";
const ACTION =
  "mt-8 inline-flex min-h-11 items-center rounded-xs text-label font-semibold text-accent-text transition-colors duration-link hover:underline";

/* The error-summary links are Ink, not Claret: the accent budget above the
   fold is the email phrase and the send control (docs/premium-direction.md
   § Token plan, "Usage budget"), and a summary link is still a link by weight
   and underline. */
const SUMMARY_LINK = "font-medium text-text hover:underline";

export function Contact() {
  const [errors, setErrors] = useState<ContactFieldError[]>([]);
  const [status, setStatus] = useState<FormStatus>({ kind: "idle" });
  const alertRef = useRef<HTMLDivElement>(null);
  const isSubmitting = status.kind === "sending";

  const errorFor = (field: ContactField) =>
    errors.find((error) => error.field === field)?.message;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const form = event.currentTarget;
    const data = new FormData(form);

    /* Honeypot guard — unchanged: a filled `_honey` field is accepted
       silently without POSTing, so bots get no signal either way. */
    if (String(data.get("_honey") ?? "").length > 0) {
      form.reset();
      setErrors([]);
      setStatus({
        kind: "sent",
        message: "A confirmation is on its way to your email address.",
      });
      return;
    }

    const fieldErrors = validateContactFields({
      name: data.get("name"),
      email: data.get("email"),
      subject: data.get("subject"),
      message: data.get("message"),
    });

    if (fieldErrors.length > 0) {
      setErrors(fieldErrors);
      setStatus({ kind: "idle" });
      /* Focus the summary, not the first field: it lists every problem in form
         order and links each one, which is the read-back a screen reader needs
         (focus jumps to the field from the link, not from here). */
      requestAnimationFrame(() => alertRef.current?.focus());
      return;
    }

    setErrors([]);
    setStatus({ kind: "sending" });

    try {
      const payload = Object.fromEntries(data.entries());
      const res = await fetch(form.action, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      let payloadJson: { message?: string } | null = null;
      try {
        const body: unknown = await res.json();
        if (typeof body === "object" && body !== null) {
          payloadJson = body as { message?: string };
        }
      } catch {
        /* Non-JSON body (proxy or gateway error page) — report a generic
           failure instead of leaking raw response bytes to the visitor. */
      }

      if (!res.ok) {
        throw new Error(payloadJson?.message || "Something went wrong.");
      }

      form.reset();
      setStatus({
        kind: "sent",
        message: "A confirmation is on its way to your email address.",
      });
    } catch (error: unknown) {
      setStatus({
        kind: "failed",
        detail: error instanceof Error ? error.message : undefined,
      });
      requestAnimationFrame(() => alertRef.current?.focus());
    }
  }

  const alertVisible = errors.length > 0 || status.kind === "failed";

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
              block (docs/premium-direction.md § Layout). It is a jump to the
              form below, not a second copy of the address. */}
          <a href="#contactForm" className={ACTION}>
            Send a message
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
                href={`mailto:${CONTACT_EMAIL}`}
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

        {/* Compose form */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="mt-16 border-t border-border pt-8"
        >
          <h2 className="text-headline font-semibold text-text">
            Send a message
          </h2>

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
                  {errors.length === 1 ? "one field" : `${errors.length} fields`}
                </p>
                <ul className="mt-2 list-disc pl-4">
                  {errors.map((error) => (
                    <li key={error.field} className="text-detail text-text">
                      <a
                        href={`#form-${error.field}`}
                        className={SUMMARY_LINK}
                        onClick={(event) => {
                          event.preventDefault();
                          document.getElementById(`form-${error.field}`)?.focus();
                        }}
                      >
                        {error.message}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {status.kind === "failed" && (
              <>
                <p className="text-body font-semibold text-text">
                  Your message was not sent.
                </p>
                <p className="mt-2 max-w-[65ch] text-detail text-text-muted">
                  It is still in the form below. Check your connection and send
                  it again, or reach me directly at{" "}
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className={`${LINK} break-words`}
                  >
                    {CONTACT_EMAIL}
                  </a>
                  .
                </p>
                {status.detail && (
                  <p className="mt-2 max-w-[65ch] text-detail text-text-muted">
                    The mail service reported: {status.detail}
                  </p>
                )}
              </>
            )}
          </div>

          <form
            id="contactForm"
            action={`https://formsubmit.co/ajax/${CONTACT_EMAIL}`}
            method="POST"
            noValidate
            aria-busy={isSubmitting}
            onSubmit={handleSubmit}
            className="mt-6"
          >
            <input type="hidden" name="_subject" value="New resume site contact submission" />
            <input type="hidden" name="_captcha" value="true" />
            <input
              type="text"
              name="_honey"
              tabIndex={-1}
              autoComplete="off"
              style={{ display: "none" }}
            />

            <div className={FIELD_WRAP}>
              <label htmlFor="form-name" className={FIELD_LABEL}>
                Your name
              </label>
              <input
                id="form-name"
                name="name"
                type="text"
                required
                maxLength={100}
                autoComplete="name"
                aria-invalid={errorFor("name") ? true : undefined}
                aria-describedby={errorFor("name") ? "form-name-error" : undefined}
                className={`mt-2 ${FIELD}`}
              />
              {errorFor("name") && (
                <p id="form-name-error" className={FIELD_ERROR}>
                  {errorFor("name")}
                </p>
              )}
            </div>

            <div className={FIELD_WRAP}>
              <label htmlFor="form-email" className={FIELD_LABEL}>
                Your email address
              </label>
              <input
                id="form-email"
                name="email"
                type="email"
                required
                maxLength={254}
                autoComplete="email"
                aria-invalid={errorFor("email") ? true : undefined}
                aria-describedby={
                  errorFor("email") ? "form-email-error" : undefined
                }
                className={`mt-2 ${FIELD}`}
              />
              {errorFor("email") && (
                <p id="form-email-error" className={FIELD_ERROR}>
                  {errorFor("email")}
                </p>
              )}
            </div>

            <div className={FIELD_WRAP}>
              <label htmlFor="form-subject" className={FIELD_LABEL}>
                Subject
              </label>
              <input
                id="form-subject"
                name="subject"
                type="text"
                required
                maxLength={300}
                aria-invalid={errorFor("subject") ? true : undefined}
                aria-describedby={
                  errorFor("subject") ? "form-subject-error" : undefined
                }
                className={`mt-2 ${FIELD}`}
              />
              {errorFor("subject") && (
                <p id="form-subject-error" className={FIELD_ERROR}>
                  {errorFor("subject")}
                </p>
              )}
            </div>

            <div className={FIELD_WRAP}>
              <label htmlFor="form-message" className={FIELD_LABEL}>
                Message
              </label>
              <textarea
                id="form-message"
                name="message"
                required
                rows={6}
                maxLength={5000}
                aria-invalid={errorFor("message") ? true : undefined}
                aria-describedby={
                  errorFor("message") ? "form-message-error" : undefined
                }
                className={`mt-2 resize-y ${FIELD}`}
              />
              {errorFor("message") && (
                <p id="form-message-error" className={FIELD_ERROR}>
                  {errorFor("message")}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex min-h-11 items-center rounded-sm bg-accent px-6 py-3 text-label font-semibold text-bg transition-colors duration-submit disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Sending your message…" : "Send the message"}
            </button>

            <div
              role="status"
              className={
                status.kind === "sent"
                  ? "mt-6 max-w-[65ch] rounded-sm border border-border bg-surface p-4 text-body text-text"
                  : "sr-only"
              }
            >
              {status.kind === "sending" && (
                <p className="text-body text-text-muted">
                  Sending your message…
                </p>
              )}
              {status.kind === "sent" && (
                <>
                  <span className="font-semibold">Message sent.</span>{" "}
                  {status.message}
                </>
              )}
            </div>
          </form>
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
