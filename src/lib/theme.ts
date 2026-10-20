import { useCallback, useEffect, useState } from "react";

/** The two schemes — the only values <html data-theme> and CSS understand. */
export type Theme = "dark" | "light";

/** Stored user intent. Owner order 2026-10-14 retired "auto": the intent space
 *  is now the same two schemes, so a preference is always a concrete pin, and a
 *  visitor who has never chosen simply starts on the OS scheme. */
export type ThemePreference = Theme;

export const THEME_STORAGE_KEY = "nnl-theme";
export const THEME_CHANGE_EVENT = "nnl-theme-change";

const DARK_SCHEME_QUERY = "(prefers-color-scheme: dark)";

const CYCLE: readonly ThemePreference[] = ["light", "dark"];

/** In-memory mirror of a pin whose storage write could not be confirmed.
 *  It exists because setTheme broadcasts THEME_CHANGE_EVENT *after* writing:
 *  a listener that re-derives the pin from storage alone would read a stale or
 *  absent value (the write never landed) and silently revert the visitor's
 *  explicit choice. Keeping the intent here lets an unpersistable pin survive
 *  the session. Cleared whenever a write verifiably lands — storage is then
 *  authoritative. */
let inMemoryPreference: ThemePreference | null = null;

/** The OS/browser scheme media list, or undefined where matchMedia is missing
 *  or throws. Mirrors the pre-paint script's posture (index.html): a throwing
 *  probe must degrade to light, never unwind the caller — under StrictMode an
 *  uncaught error in the mount effect unmounts the tree and blanks the page. */
function darkMedia(): MediaQueryList | undefined {
  try {
    if (typeof window.matchMedia !== "function") return undefined;
    return window.matchMedia(DARK_SCHEME_QUERY);
  } catch {
    /* matchMedia unavailable — treat as light */
    return undefined;
  }
}

/** OS/browser scheme. Missing matchMedia (SSR, jsdom, very old browsers) ⇒ light. */
export function systemTheme(): Theme {
  return darkMedia()?.matches ? "dark" : "light";
}

/** The visitor's pinned scheme, or null when they have never chosen one. A
 *  retired or unrecognized stored value ("auto", "solarized") is not a pin: it
 *  falls through to the OS scheme, the same resolution the pre-paint script
 *  applies before first paint. */
export function storedPin(): ThemePreference | null {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* storage unavailable — the in-memory mirror below still carries a pin */
  }
  return null;
}

/** The scheme to show: the visitor's pin — storage first, then the mirror of a
 *  write that was dropped — otherwise the live OS scheme. Never "auto": the
 *  value space is light/dark. */
export function storedPreference(): ThemePreference {
  return inMemoryPreference ?? storedPin() ?? systemTheme();
}

/** Current applied theme, read from the <html> dataset the inline script seeds pre-paint. */
export function getTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

/** Paint a scheme on <html>. The `.theme-flip` guard suppresses CSS color
 *  transitions for the swap, so every element lands on the new palette in the
 *  same frame instead of lagging half-dark/half-light (see index.css). */
function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.classList.add("theme-flip");
  root.dataset.theme = theme;
  /* Re-enable transitions a couple of frames later, once the swap settled. */
  requestAnimationFrame(() => {
    requestAnimationFrame(() => root.classList.remove("theme-flip"));
  });
}

/** Apply + persist the visitor's explicit choice, then broadcast so every
 *  consumer recalibrates. This is the only writer of a pin. */
export function setTheme(preference: ThemePreference): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
    /* Write landed: storage now carries the truth, so retire the mirror. */
    inMemoryPreference = null;
  } catch {
    /* storage unavailable — the DOM theme still applies, and the mirror keeps
       the explicit pin alive for this session (see inMemoryPreference). */
    inMemoryPreference = preference;
  }
  applyTheme(preference);
  const event = new CustomEvent<ThemePreference>(THEME_CHANGE_EVENT, {
    detail: preference,
  });
  window.dispatchEvent(event);
  document.dispatchEvent(event);
}

/** light → dark → light, applying + persisting each step. */
export function cycleTheme(): ThemePreference {
  const index = CYCLE.indexOf(storedPreference());
  const next = CYCLE[(index + 1) % CYCLE.length];
  setTheme(next);
  return next;
}

/** React binding: state stays in sync across same-tab toggles, multi-tab storage
 *  edits, and OS scheme flips while the visitor has not pinned a scheme. */
export function useTheme(): [ThemePreference, (preference: ThemePreference) => void] {
  const [preference, setPreference] = useState<ThemePreference>(storedPreference);

  useEffect(() => {
    /* Re-derive from the pin + the live OS scheme, so a same-tab broadcast and
       a cross-tab `storage` edit both land on the same scheme.

       Reconciling here APPLIES only — it never writes storage, because for an
       unpinned visitor `next` is the OS scheme, and persisting that would pin
       them: their first OS flip would then be ignored. */
    const sync = () => {
      const next = storedPreference();
      setPreference(next);
      if (next !== getTheme()) applyTheme(next);
    };

    /* Reconcile once on mount: the pre-paint script can land on a different
       scheme than this layer resolves (e.g. its storage read threw while this
       one succeeded), and the DOM would otherwise stay wrong until an unrelated
       event. Already-consistent state is a NO-OP — the getTheme() guard keeps
       applyTheme (and its .theme-flip class) off a normal load. */
    sync();

    window.addEventListener("storage", sync);
    window.addEventListener(THEME_CHANGE_EVENT, sync);

    /* Live-follow the OS scheme while nothing is pinned: a visitor who has not
       chosen a scheme is not held on the pre-paint reading. An explicit
       light/dark pin ignores the flip. */
    const media = darkMedia();
    const onSystemChange = () => {
      if (inMemoryPreference !== null || storedPin() !== null) return;
      sync();
    };
    let detachSystem = () => {};
    if (media) {
      if (typeof media.addEventListener === "function") {
        media.addEventListener("change", onSystemChange);
        detachSystem = () => media.removeEventListener("change", onSystemChange);
      } else if (typeof media.addListener === "function") {
        /* Legacy MediaQueryList (Safari < 14) has no addEventListener. */
        media.addListener(onSystemChange);
        detachSystem = () => media.removeListener(onSystemChange);
      }
    }

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(THEME_CHANGE_EVENT, sync);
      detachSystem();
    };
  }, []);

  const applyPreference = useCallback((next: ThemePreference) => {
    setTheme(next);
    setPreference(next);
  }, []);

  return [preference, applyPreference];
}
