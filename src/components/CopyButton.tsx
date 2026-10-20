import { useState } from "react";

/**
 * CopyButton — one-click copy for an install line.
 *
 * The text is exact (see src/content/portfolio.ts) and selectable: the
 * `<code>` stays a plain text node for one drag-select, while the button
 * copies the same string via the clipboard API with a textarea fallback.
 * Focus ring is the shared accent outline (src/index.css :focus-visible).
 */
export function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand("copy");
      } catch {
        /* clipboard unavailable — keep the text selectable */
      }
      document.body.removeChild(area);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy install line for ${label}`}
      data-nav-item
      className="flex min-h-11 shrink-0 items-center rounded-xs border border-border px-3 text-label font-semibold text-text transition-colors duration-field hover:border-border-accent hover:text-accent-text"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
