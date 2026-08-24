import { useCallback, useEffect, useState } from "react";

export type TerminalTheme = "dark" | "light";

export const THEME_STORAGE_KEY = "nnl-theme";
export const THEME_CHANGE_EVENT = "nnl-theme-change";

/** Current applied theme, read from the <html> dataset the inline script seeds pre-paint. */
export function getTheme(): TerminalTheme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

/** Theme persisted for the session, falling back to the applied DOM theme. */
function storedTheme(): TerminalTheme {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* storage unavailable — fall through to applied theme */
  }
  return getTheme();
}

/** Apply + persist a theme, then broadcast so every consumer recalibrates. */
export function setTheme(theme: TerminalTheme): void {
  const root = document.documentElement;
  /* Atomic flip: suppress CSS color transitions for the swap so every
     element lands on the new palette in the same frame (see .theme-flip). */
  root.classList.add("theme-flip");
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* storage unavailable — the DOM theme still applies */
  }
  root.dataset.theme = theme;
  const event = new CustomEvent<TerminalTheme>(THEME_CHANGE_EVENT, {
    detail: theme,
  });
  window.dispatchEvent(event);
  document.dispatchEvent(event);
  /* Re-enable transitions a couple of frames later, once the swap settled. */
  requestAnimationFrame(() => {
    requestAnimationFrame(() => root.classList.remove("theme-flip"));
  });
}

export function toggleTheme(): TerminalTheme {
  const next: TerminalTheme = getTheme() === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}

/** React binding: state stays in sync across same-tab toggles and multi-tab storage. */
export function useTheme(): [TerminalTheme, (theme: TerminalTheme) => void] {
  const [theme, setThemeState] = useState<TerminalTheme>(getTheme);

  useEffect(() => {
    const sync = () => {
      const next = storedTheme();
      if (next !== getTheme()) setTheme(next);
      setThemeState(next);
    };
    window.addEventListener("storage", sync);
    window.addEventListener(THEME_CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(THEME_CHANGE_EVENT, sync);
    };
  }, []);

  const applyTheme = useCallback((next: TerminalTheme) => {
    setTheme(next);
    setThemeState(next);
  }, []);

  return [theme, applyTheme];
}
