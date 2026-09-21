import { useCallback, useEffect, useState } from "react";

/** Resolved/applied theme — the only values <html data-theme> and CSS understand. */
export type TerminalTheme = "dark" | "light";

/** Stored user intent: "auto" follows the OS scheme, explicit values pin it. */
export type ThemePreference = "auto" | "light" | "dark";

export const THEME_STORAGE_KEY = "nnl-theme";
export const THEME_CHANGE_EVENT = "nnl-theme-change";

const DARK_SCHEME_QUERY = "(prefers-color-scheme: dark)";

const CYCLE: readonly ThemePreference[] = ["auto", "light", "dark"];

/** In-memory mirror of a preference whose storage write could not be confirmed.
 *  It exists because setTheme broadcasts THEME_CHANGE_EVENT *after* writing:
 *  a listener that re-derives the preference from storage alone would read
 *  "auto" (the write never landed) and silently revert the user's explicit
 *  pin. Keeping the intent here lets an unpersistable pin survive the session.
 *  Cleared whenever a write verifiably lands — storage is then authoritative. */
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
export function systemTheme(): TerminalTheme {
  return darkMedia()?.matches ? "dark" : "light";
}

/** Resolve a stored preference against the live system scheme. */
export function resolveTheme(preference: ThemePreference): TerminalTheme {
  return preference === "auto" ? systemTheme() : preference;
}

/** Preference persisted for the session; missing or unrecognized ⇒ "auto". */
export function storedPreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "auto" || stored === "light" || stored === "dark") {
      return stored;
    }
  } catch {
    /* storage unavailable — fall through to the in-memory mirror */
  }
  /* Nothing valid in storage: fall back to a pin whose write was dropped, so
     the broadcast listener below sees the user's choice instead of "auto". */
  return inMemoryPreference ?? "auto";
}

/** Current applied theme, read from the <html> dataset the inline script seeds pre-paint. */
export function getTheme(): TerminalTheme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

/** Apply + persist a preference, then broadcast so every consumer recalibrates. */
export function setTheme(preference: ThemePreference): void {
  const root = document.documentElement;
  /* Atomic flip: suppress CSS color transitions for the swap so every
     element lands on the new palette in the same frame (see .theme-flip). */
  root.classList.add("theme-flip");
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
    /* Write landed: storage now carries the truth, so retire the mirror. */
    inMemoryPreference = null;
  } catch {
    /* storage unavailable — the DOM theme still applies, and the mirror keeps
       the explicit pin alive for this session (see inMemoryPreference). */
    inMemoryPreference = preference;
  }
  /* data-theme only ever holds the RESOLVED theme — CSS has no "auto" branch. */
  root.dataset.theme = resolveTheme(preference);
  const event = new CustomEvent<ThemePreference>(THEME_CHANGE_EVENT, {
    detail: preference,
  });
  window.dispatchEvent(event);
  document.dispatchEvent(event);
  /* Re-enable transitions a couple of frames later, once the swap settled. */
  requestAnimationFrame(() => {
    requestAnimationFrame(() => root.classList.remove("theme-flip"));
  });
}

/** auto → light → dark → auto, applying + persisting each step. */
export function cycleTheme(): ThemePreference {
  const index = CYCLE.indexOf(storedPreference());
  const next = CYCLE[(index + 1) % CYCLE.length];
  setTheme(next);
  return next;
}

/** React binding: state stays in sync across same-tab toggles, multi-tab storage,
 *  and OS scheme flips while the preference is "auto". */
export function useTheme(): [ThemePreference, (preference: ThemePreference) => void] {
  const [preference, setPreference] = useState<ThemePreference>(storedPreference);

  useEffect(() => {
    /* Re-derive from storage so a same-tab broadcast and a cross-tab `storage`
       edit both land on the same resolved theme. */
    const sync = () => {
      const next = storedPreference();
      setPreference(next);
      if (resolveTheme(next) !== getTheme()) setTheme(next);
    };

    /* Reconcile once on mount: the pre-paint script can land on a different
       theme than this layer resolves (e.g. its storage read threw while this
       one succeeded), and the DOM would otherwise stay wrong until an
       unrelated event. Already-consistent state is a NO-OP — the getTheme()
       guard keeps setTheme (and its .theme-flip class) off a normal load. */
    sync();

    window.addEventListener("storage", sync);
    window.addEventListener(THEME_CHANGE_EVENT, sync);

    /* Live-follow the OS scheme. An explicit light/dark pins the theme and
       ignores the flip; only "auto" re-applies. */
    const media = darkMedia();
    const onSystemChange = () => {
      if (storedPreference() !== "auto") return;
      if (systemTheme() !== getTheme()) setTheme("auto");
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
