import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";

export function Contact() {
  const [formStatus, setFormStatus] = useState<{ type: "pending" | "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current); };
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;

    setFormStatus({ type: "pending", message: "Sending your message..." });
    setIsSubmitting(true);

    try {
      const data = new FormData(form);
      const payload = Object.fromEntries(data.entries());
      const res = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result?.message || "Something went wrong.");
      setFormStatus({ type: "success", message: "Message sent! Check your email for confirmation." });
      form.reset();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setFormStatus({ type: "error", message: msg });
    } finally {
      setIsSubmitting(false);
      statusTimeoutRef.current = setTimeout(() => setFormStatus(null), 5000);
    }
  }

  return (
    <section id="contact" className="py-24 md:py-32 px-4 lg:px-8 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-4 mb-12"
        >
          <span className="text-accent-2 text-sm">$</span>
          <span className="text-xs tracking-[0.4em] text-text-dim">
            ./contact.sh
          </span>
          <div className="flex-1 h-[1px] bg-border" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-3xl md:text-6xl font-bold tracking-tight leading-tight">
            <span className="text-text-dim">LET'S BUILD</span>
            <br />
            <span className="text-white">SOMETHING </span>
            <span className="text-accent glow-green">GREAT</span>
            <span className="cursor-blink text-accent">_</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="border border-border-accent bg-surface p-6 md:p-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] tracking-widest text-accent">[EMAIL]</span>
              <div className="flex-1 h-[1px] bg-border" />
            </div>
            <a
              href="mailto:nathanielnikolai.ladero@gmail.com"
              className="text-lg md:text-2xl font-bold text-white hover:text-accent transition-colors duration-300 block break-all"
            >
              nathanielnikolai.ladero@gmail.com
            </a>
            <p className="text-text-muted text-xs mt-3 tracking-wider">
              RESPONSE TIME: ~24 HOURS
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="border border-border-accent bg-surface p-6 md:p-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] tracking-widest text-accent-2">[SOCIAL]</span>
              <div className="flex-1 h-[1px] bg-border" />
            </div>
            <div className="space-y-3">
              <a href="https://github.com/nathwn12" target="_blank" rel="noopener noreferrer" className="block text-sm text-text-dim hover:text-accent transition-colors">
                github.com/nathwn12
              </a>
              <a href="https://www.linkedin.com/in/nathaniel-nikolai-l-184181261/" target="_blank" rel="noopener noreferrer" className="block text-sm text-text-dim hover:text-accent-2 transition-colors">
                linkedin.com/in/nathaniel-nikolai-l-184181261/
              </a>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="border border-border-accent bg-surface p-6 md:p-8 mb-12"
        >
          <div className="flex items-center gap-2 mb-6">
            <span className="text-accent-2">$</span>
            <span className="text-sm text-text-dim">cat mail.sh</span>
            <span className="cursor-blink text-accent text-sm">█</span>
          </div>
          <form
            id="contactForm"
            action="https://formsubmit.co/ajax/nathanielnikolai.ladero@gmail.com"
            method="POST"
            onSubmit={handleSubmit}
          >
            <input type="hidden" name="_subject" value="New resume site contact submission" />
            <input type="hidden" name="_captcha" value="false" />
            <input type="text" name="_honey" tabIndex={-1} autoComplete="off" style={{ display: "none" }} />

            <div className="space-y-1 mb-4">
              <label htmlFor="form-name" className="flex items-center gap-2 text-[10px] tracking-widest text-text-muted mb-2">
                <span className="text-accent">$</span>
                <span>read -p "Name: " name</span>
              </label>
              <input
                id="form-name"
                name="name"
                type="text"
                required
                autoComplete="name"
                placeholder="Nathaniel Nikolai Ladero"
                className="w-full bg-bg border border-border-accent px-4 py-3 text-sm text-white font-mono outline-none focus:border-accent transition-colors placeholder:text-text-muted/30"
              />
            </div>

            <div className="space-y-1 mb-4">
              <label htmlFor="form-email" className="flex items-center gap-2 text-[10px] tracking-widest text-text-muted mb-2">
                <span className="text-accent">$</span>
                <span>read -p "Email: " email</span>
              </label>
              <input
                id="form-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="user@example.com"
                className="w-full bg-bg border border-border-accent px-4 py-3 text-sm text-white font-mono outline-none focus:border-accent transition-colors placeholder:text-text-muted/30"
              />
            </div>

            <div className="space-y-1 mb-4">
              <label htmlFor="form-subject" className="flex items-center gap-2 text-[10px] tracking-widest text-text-muted mb-2">
                <span className="text-accent">$</span>
                <span>read -p "Subject: " subject</span>
              </label>
              <input
                id="form-subject"
                name="subject"
                type="text"
                required
                placeholder="What is this regarding?"
                className="w-full bg-bg border border-border-accent px-4 py-3 text-sm text-white font-mono outline-none focus:border-accent transition-colors placeholder:text-text-muted/30"
              />
            </div>

            <div className="space-y-1 mb-6">
              <label htmlFor="form-message" className="flex items-center gap-2 text-[10px] tracking-widest text-text-muted mb-2">
                <span className="text-accent">$</span>
                <span>read -p "Message: " message</span>
              </label>
              <textarea
                id="form-message"
                name="message"
                required
                rows={4}
                placeholder="Your message here..."
                className="w-full bg-bg border border-border-accent px-4 py-3 text-sm text-white font-mono outline-none focus:border-accent transition-colors resize-none placeholder:text-text-muted/30"
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-accent text-xs">$</span>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-accent/10 border border-accent/30 text-accent text-xs font-bold tracking-widest hover:bg-accent/20 hover:border-accent/60 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "./send-message --sending…" : "./send-message --send"}
              </button>
              <span className="cursor-blink text-accent text-xs">█</span>
            </div>

            {formStatus && (
              <div className={`mt-4 border-l-2 pl-4 py-2 text-xs font-mono ${
                formStatus.type === "success"
                  ? "border-accent text-accent bg-accent/5"
                  : formStatus.type === "error"
                  ? "border-accent-3 text-accent-3 bg-accent-3/5"
                  : "border-text-muted text-text-dim bg-white/5"
              }`}>
                <span className="text-text-muted mr-2">$</span>
                {formStatus.message}
                {formStatus.type === "pending" && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="ml-1"
                  >
                    █
                  </motion.span>
                )}
              </div>
            )}
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="border border-border-accent bg-surface p-4 md:p-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-accent text-sm">$</span>
            <span className="text-sm text-text-dim">echo "Thanks for visiting. Let's connect."</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-accent text-sm">$</span>
            <span className="text-sm text-text-dim">
              cat /dev/null &gt; goodbye.world
            </span>
            <span className="cursor-blink text-accent text-sm">█</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
