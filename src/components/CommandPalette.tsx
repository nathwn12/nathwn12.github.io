/**
 * Command palette — the keyboard front door (`Ctrl+K` / `⌘K`, or `/`).
 *
 * Mounted once in App.tsx beside the other global chrome. One window keydown
 * listener serves both halves: the open shortcuts while closed, and the
 * dialog keys while open. While open, `isOverlayOpen` (keyboardNav.ts) sees
 * this dialog's [data-command-palette] marker, so the existing arrow-key
 * route navigation stays quiet without a competing handler.
 *
 * Accessibility contract: role="dialog" aria-modal, labelled by a
 * visually-hidden title, labelled combobox input with aria-activedescendant,
 * listbox options, focus moved in on open and returned to the opener on
 * close, Tab trapped inside, arrows/Home/End move the active option, Enter
 * activates, Escape/backdrop/activation closes, and a polite live region
 * announces the result count. The open/close motion is the shared nnl-fade-in
 * keyframe with a motion-reduce cut-out, so reduced-motion users get the
 * same fully usable panel with no animation.
 */

import { useEffect, useRef, useState } from "react";
import { isEditableTarget, isOverlayOpen } from "../lib/keyboardNav";
import { CONTACT_EMAIL } from "../lib/contact";
import {
  PALETTE_OPEN_EVENT,
  buildPaletteItems,
  copyText,
  filterPaletteItems,
  paletteOptionId,
  type PaletteGroup,
  type PaletteItem,
} from "../lib/palette";
import { navigate } from "../lib/router";

const TITLE_ID = "command-palette-title";
const LISTBOX_ID = "command-palette-listbox";
const INPUT_ID = "command-palette-input";
const INPUT_LABEL = "Search pages, projects, and actions";

const GROUP_ORDER: readonly PaletteGroup[] = ["Pages", "Projects", "Actions"];

type CopyState = "idle" | "ok" | "error";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const doneRef = useRef<HTMLButtonElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  /* Inline per render — never mirrored into an effect. Rebuilt data is
     cheap (tens of small records) and keeps handlers free of staleness. */
  const filtered = filterPaletteItems(buildPaletteItems(), query);
  const clampedIndex =
    filtered.length === 0 ? 0 : Math.min(activeIndex, filtered.length - 1);
  const activeItem: PaletteItem | undefined = filtered[clampedIndex];

  function closePalette(): void {
    setOpen(false);
    const opener = openerRef.current;
    openerRef.current = null;
    if (opener && document.contains(opener)) {
      opener.focus({ preventScroll: true });
    }
  }

  function openPalette(): void {
    const current = document.activeElement;
    openerRef.current = current instanceof HTMLElement ? current : null;
    setQuery("");
    setActiveIndex(0);
    setCopyState("idle");
    setOpen(true);
  }

  function activate(item: PaletteItem): void {
    switch (item.action.kind) {
      case "route":
        closePalette();
        navigate(item.action.path);
        return;
      case "mailto":
        window.location.href = item.action.href;
        closePalette();
        return;
      case "external":
        window.open(item.action.url, "_blank", "noopener,noreferrer");
        closePalette();
        return;
      case "download": {
        const anchor = document.createElement("a");
        anchor.href = item.action.href;
        anchor.download = item.action.filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        closePalette();
        return;
      }
      case "copy-email":
        /* Stays open on the confirmation view: the success/error state is
           the visible feedback, announced through role="status". */
        void copyText(CONTACT_EMAIL).then((ok) => {
          setCopyState(ok ? "ok" : "error");
        });
        return;
    }
  }

  /* The palette's one global listener: open shortcuts while closed, dialog
     keys while open. No dependency array — it re-registers every render so
     the closure always sees the current query, list, and open flag. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
          e.preventDefault();
          openPalette();
          return;
        }
        if (
          e.key === "/" &&
          !e.ctrlKey &&
          !e.metaKey &&
          !e.altKey &&
          !isEditableTarget(e.target) &&
          !isOverlayOpen()
        ) {
          e.preventDefault();
          openPalette();
        }
        return;
      }
      switch (e.key) {
        case "Escape":
          e.preventDefault();
          closePalette();
          return;
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((i) =>
            filtered.length === 0 ? 0 : (i + 1) % filtered.length,
          );
          return;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((i) =>
            filtered.length === 0
              ? 0
              : (i - 1 + filtered.length) % filtered.length,
          );
          return;
        case "Home":
          e.preventDefault();
          setActiveIndex(0);
          return;
        case "End":
          e.preventDefault();
          setActiveIndex(filtered.length === 0 ? 0 : filtered.length - 1);
          return;
        case "Enter":
          if (!activeItem) return;
          e.preventDefault();
          activate(activeItem);
          return;
        case "Tab": {
          const dialog = dialogRef.current;
          if (!dialog) return;
          const focusables = Array.from(
            dialog.querySelectorAll<HTMLElement>("input, button, a[href]"),
          ).filter((el) => !el.hasAttribute("disabled"));
          if (focusables.length === 0) {
            e.preventDefault();
            return;
          }
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          const focused = document.activeElement;
          if (e.shiftKey && focused === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && focused === last) {
            e.preventDefault();
            first.focus();
          }
          return;
        }
        default:
          return;
      }
    };
    const onOpenEvent = () => {
      openPalette();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(PALETTE_OPEN_EVENT, onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(PALETTE_OPEN_EVENT, onOpenEvent);
    };
  });

  /* Focus moves into the input on open… */
  useEffect(() => {
    if (open && copyState === "idle") inputRef.current?.focus();
  }, [open, copyState]);

  /* …and onto the confirmation's Done control once a copy resolves. */
  useEffect(() => {
    if (open && copyState !== "idle") doneRef.current?.focus();
  }, [open, copyState]);

  if (!open) return null;

  let running = 0;
  const sections = GROUP_ORDER.map((group) => {
    const items = filtered.filter((item) => item.group === group);
    const start = running;
    running += items.length;
    return { group, items, start };
  }).filter((section) => section.items.length > 0);

  const countText =
    filtered.length === 0
      ? `No matches for "${query.trim()}"`
      : `${filtered.length} ${filtered.length === 1 ? "result" : "results"}`;

  return (
    <div
      data-command-palette
      className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[10vh]"
    >
      <div
        aria-hidden="true"
        data-palette-backdrop
        onClick={closePalette}
        className="absolute inset-0 bg-text/10"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
        className="relative w-full max-w-[68ch] animate-[nnl-fade-in_160ms_ease-out] rounded-none border border-border bg-bg motion-reduce:animate-none"
      >
        <h2 id={TITLE_ID} className="sr-only">
          Command palette
        </h2>
        {copyState === "idle" ? (
          <>
            <div className="border-b-2 border-text px-4">
              <label htmlFor={INPUT_ID} className="sr-only">
                {INPUT_LABEL}
              </label>
              <input
                ref={inputRef}
                id={INPUT_ID}
                type="text"
                role="combobox"
                aria-expanded="true"
                aria-controls={LISTBOX_ID}
                aria-autocomplete="list"
                aria-activedescendant={
                  activeItem ? paletteOptionId(activeItem.id) : undefined
                }
                aria-label={INPUT_LABEL}
                placeholder="Type a command…"
                autoComplete="off"
                spellCheck={false}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                className="w-full bg-transparent py-4 text-body text-text outline-none placeholder:text-text-muted"
              />
            </div>
            {filtered.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-body text-text">
                  No matches for &ldquo;{query.trim()}&rdquo;.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setActiveIndex(0);
                    inputRef.current?.focus();
                  }}
                  className="mt-4 inline-flex min-h-11 items-center rounded-none border border-border px-6 py-3 text-label font-semibold text-text transition-colors duration-submit hover:border-border-accent"
                >
                  Clear the query
                </button>
              </div>
            ) : (
              <ul
                role="listbox"
                id={LISTBOX_ID}
                aria-label="Results"
                className="max-h-[60vh] overflow-y-auto py-1"
              >
                {sections.map((section) => (
                  <li key={section.group} role="presentation">
                    <p
                      id={`palette-group-${section.group}`}
                      className="px-4 pt-2 pb-1 text-label font-medium text-text-muted"
                    >
                      {section.group}
                    </p>
                    <ul role="group" aria-labelledby={`palette-group-${section.group}`}>
                      {section.items.map((item, offset) => {
                        const index = section.start + offset;
                        const selected = index === clampedIndex;
                        return (
                          <li
                            key={item.id}
                            role="option"
                            id={paletteOptionId(item.id)}
                            aria-selected={selected}
                            onMouseDown={(e) => e.preventDefault()}
                            onMouseEnter={() => setActiveIndex(index)}
                            onClick={() => activate(item)}
                            className={`flex min-h-11 cursor-pointer items-baseline justify-between gap-4 px-4 py-1 text-body transition-colors duration-nav ${
                              selected ? "bg-surface" : "bg-transparent"
                            }`}
                          >
                            <span
                              className={`font-medium ${selected ? "text-accent-text" : "text-text"}`}
                            >
                              {item.label}
                            </span>
                            <span className="shrink-0 text-detail text-text">
                              {item.hint}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
            <p className="border-t border-border px-4 py-2 text-detail text-text">
              ↑↓ navigate · ↵ open · esc close
            </p>
            <p role="status" className="sr-only">
              {countText}
            </p>
          </>
        ) : (
          <div className="px-6 py-6">
            <div role="status">
              {copyState === "ok" ? (
                <p className="text-body text-text">
                  <span className="font-semibold">Copied.</span> {CONTACT_EMAIL}{" "}
                  is on your clipboard.
                </p>
              ) : (
                <div>
                  <p className="text-body text-text">
                    <span className="font-semibold">
                      Copying did not work here.
                    </span>{" "}
                    Select the address below and copy it manually:
                  </p>
                  <p className="mt-4 text-body font-semibold break-words text-accent-text">
                    {CONTACT_EMAIL}
                  </p>
                </div>
              )}
            </div>
            <button
              ref={doneRef}
              type="button"
              onClick={closePalette}
              className="mt-6 inline-flex min-h-11 items-center rounded-none border border-border px-6 py-3 text-label font-semibold text-text transition-colors duration-submit hover:border-border-accent"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
