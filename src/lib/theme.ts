import { useCallback, useEffect, useState } from "react";

/**
 * Theme — one switch, one attribute.
 *
 * `<html data-theme="light|dark">` is the only mechanism. There is no
 * `prefers-color-scheme` block in CSS, so a stored choice and the system
 * preference can never disagree on the page: the OS preference decides the
 * *initial* value (index.html's pre-paint script resolves it before first paint,
 * so there is no flash), and from then on the attribute is the truth, persisted
 * under `nnl-theme`.
 *
 * `theme-color` cannot read a custom property, so the two grounds are restated
 * in `THEME_COLORS` for the meta rewrite — pinned against tokens.css by
 * tests/theme.test.ts.
 */

export type Theme = "light" | "dark";

export const THEME_KEY = "nnl-theme";

/** Fired on `<window>` whenever the theme changes, with the new value. */
export const THEME_CHANGE_EVENT = "nnl-theme-change";

/** The ground each theme paints, mirrored from `--rec-ground` in tokens.css. */
export const THEME_COLORS: Record<Theme, string> = {
  dark: "#0A0C0E",
  light: "#ECEDE9",
};

/** The OS/browser preference, or dark where the probe is missing or throws —
 *  the dark ground is the identity, so an unreadable system is not a reason to
 *  paint paper. */
export function systemTheme(): Theme {
  try {
    if (typeof window.matchMedia !== "function") return "dark";
    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  } catch {
    return "dark";
  }
}

/** The visitor's stored pin, or null when they have never chosen. */
export function storedTheme(): Theme | null {
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* storage blocked — the pre-paint script's reading still stands */
  }
  return null;
}

/** The theme currently painted, read from the attribute the pre-paint script
 *  seeded. A document without one — or no document at all, as in a server
 *  render — is dark. */
export function currentTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

/** Point the `theme-color` meta at the active ground. Idempotent. */
function applyThemeColor(theme: Theme): void {
  const content = THEME_COLORS[theme];
  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((meta) => {
      if (meta.getAttribute("content") !== content) {
        meta.setAttribute("content", content);
      }
    });
}

/** Paint a theme on `<html>` and its browser chrome. Never persists. */
export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  applyThemeColor(theme);
}

/** Apply + persist the visitor's explicit choice, then broadcast. */
export function setTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* Storage blocked — the DOM theme still applies for this document. */
  }
  applyTheme(theme);
  window.dispatchEvent(
    new CustomEvent<Theme>(THEME_CHANGE_EVENT, { detail: theme }),
  );
}

/** light → dark → light, applying + persisting. */
export function toggleTheme(): Theme {
  const next: Theme = currentTheme() === "light" ? "dark" : "light";
  setTheme(next);
  return next;
}

/**
 * React binding: the painted theme plus a toggle.
 *
 * On mount it reconciles the attribute with the stored pin (or, with no pin,
 * the live OS preference) — the pre-paint script can have read storage that
 * this layer now sees differently, and a restored back/forward page can hold a
 * stale attribute. An OS flip is followed only while nothing is pinned.
 */
export function useTheme(): [Theme, () => void] {
  const [theme, setThemeState] = useState<Theme>(currentTheme);

  useEffect(() => {
    const sync = () => {
      const next = storedTheme() ?? systemTheme();
      applyTheme(next);
      setThemeState(next);
    };

    sync();
    window.addEventListener(THEME_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);

    let detach = () => {};
    try {
      const media = window.matchMedia("(prefers-color-scheme: light)");
      const onSystemChange = () => {
        if (storedTheme() !== null) return;
        sync();
      };
      media.addEventListener("change", onSystemChange);
      detach = () => media.removeEventListener("change", onSystemChange);
    } catch {
      /* No media query support — the attribute already carries a theme. */
    }

    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
      detach();
    };
  }, []);

  const toggle = useCallback(() => {
    setThemeState(toggleTheme());
  }, []);

  return [theme, toggle];
}
