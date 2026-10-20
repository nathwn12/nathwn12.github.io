import { CONTACT_EMAIL } from "../lib/contact";

/**
 * ContactSection — email plus one profile link. Targets ≥44px.
 */
export function ContactSection() {
  return (
    <section aria-labelledby="contact-heading" id="contact" className="px-4 py-16">
      <div className="mx-auto w-full max-w-[720px]">
        <p className="mono-accent">contact</p>
        <h2 id="contact-heading" className="mt-4 max-w-[66ch]">
          Contact starts with email
        </h2>
        <p className="mt-8 max-w-[66ch] text-[1rem] leading-[1.5]">
          Tell me about the role and the system behind it. I answer from
          Hagonoy, Bulacan (UTC+8).
        </p>
        <p className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex min-h-[44px] min-w-[44px] items-center text-[1rem] font-semibold text-[#0B57D0] underline underline-offset-4 hover:text-[#111111]"
          >
            {CONTACT_EMAIL}
          </a>
          <a
            href="https://github.com/nathwn12"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] min-w-[44px] items-center text-[1rem] font-semibold text-[#0B57D0] underline underline-offset-4 hover:text-[#111111]"
          >
            GitHub profile
          </a>
        </p>
      </div>
    </section>
  );
}
