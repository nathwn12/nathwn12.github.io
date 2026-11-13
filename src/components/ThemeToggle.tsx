import { useEffect } from "react";
import { useTheme } from "../lib/theme";

/**
 * ThemeToggle — the document setting, as a real switch.
 *
 * `role="switch"` on a button, with `aria-checked` carrying "the light theme is
 * on", so a screen reader announces "Light theme, switch, on" and a keyboard
 * reaches it with Tab and flips it with Space or Enter. The visible state is the
 * knob's position and the track's rule colour; the announced state is echoed in
 * a polite live region, because a switch that repaints the whole document should
 * say so once, audibly.
 *
 * F2 does the same thing, from anywhere that is not a text field — the binding
 * `main` had, restored. The two entry points share one writer (`toggleTheme`),
 * so there is no second source of truth for what is painted.
 */
export function ThemeToggle() {
  const [theme, toggle] = useTheme();
  const light = theme === "light";

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "F2" || event.repeat) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      event.preventDefault();
      toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  return (
    <div className="theme-toggle">
      <button
        type="button"
        role="switch"
        aria-checked={light}
        aria-label="Light theme"
        className="theme-toggle__switch"
        onClick={toggle}
      >
        <span className="data theme-toggle__label">Light</span>
        <span className="theme-toggle__track" aria-hidden="true">
          <span className="theme-toggle__knob" />
        </span>
      </button>
      <span role="status" aria-live="polite" className="theme-toggle__status">
        {light ? "Light theme" : "Dark theme"}
      </span>
    </div>
  );
}
