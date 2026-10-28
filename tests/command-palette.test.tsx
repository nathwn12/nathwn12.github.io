// @vitest-environment jsdom
/**
 * Command palette — open/close, guard, filter, activate, focus, cleanup.
 *
 * The data layer (src/lib/palette.ts) is pure and tests directly: group
 * composition, stable unique ids, and the case-insensitive filter. The
 * dialog behaviour mounts <CommandPalette /> alone and drives the same
 * window keydown path the component wires in production:
 *   - Ctrl+K / ⌘K opens from anywhere (including a text field) and prevents
 *     the browser default; `/` opens from a plain surface but never from an
 *     editable target (the keyboardNav.ts guard);
 *   - typing filters to one option and the polite live region announces it;
 *   - an empty result renders the no-matches state with a working clear;
 *   - Enter on a route item navigates and closes;
 *   - arrows move the active option, tracked by aria-activedescendant;
 *   - Tab stays inside the dialog; Escape and the backdrop close, with focus
 *     returning to the opener;
 *   - the copy action shows a visible success state, and names the manual
 *     remedy on failure;
 *   - unmounting removes the global keydown listener (spy + functional).
 *
 * Every count below can go red.
 *
 *   pnpm vitest run tests/command-palette.test.tsx
 */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { CommandPalette } from "../src/components/CommandPalette";
import { CONTACT_EMAIL } from "../src/lib/contact";
import {
  buildPaletteItems,
  filterPaletteItems,
  paletteOptionId,
  requestPaletteOpen,
} from "../src/lib/palette";
import { projects } from "../src/content/projects";

let host: HTMLDivElement;
let root: Root | null = null;

async function mount(): Promise<void> {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(createElement(CommandPalette));
  });
}

async function unmount(): Promise<void> {
  if (root) {
    await act(async () => {
      root!.unmount();
    });
    root = null;
  }
  host?.remove();
}

function press(
  key: string,
  target: Element | Window,
  init: KeyboardEventInit = {},
): KeyboardEvent {
  const ev = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    ...init,
  });
  target.dispatchEvent(ev);
  return ev;
}

function dialog(): HTMLElement | null {
  return host.querySelector('[role="dialog"]');
}

function typeQuery(value: string): void {
  const input = host.querySelector("input");
  if (!input) throw new Error("palette input is missing");
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set;
  if (!setter) throw new Error("no HTMLInputElement value setter");
  setter.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function options(): NodeListOf<HTMLElement> {
  return host.querySelectorAll('[role="option"]');
}

beforeEach(() => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(async () => {
  await unmount();
  document.body.replaceChildren();
  window.history.replaceState(null, "", "/");
});

describe("palette data (no mount)", () => {
  test("five page items, one per project, six actions, all ids unique", () => {
    const items = buildPaletteItems();
    expect(items.filter((i) => i.group === "Pages")).toHaveLength(5);
    expect(items.filter((i) => i.group === "Projects")).toHaveLength(
      projects.length,
    );
    // résumé and CV downloads are twins: one action each, same shape.
    expect(items.filter((i) => i.group === "Actions")).toHaveLength(6);
    const ids = items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("the résumé and CV download actions share one shape", () => {
    const downloads = buildPaletteItems().filter(
      (i) => i.action.kind === "download",
    );
    expect(downloads.map((i) => i.id)).toEqual(["action-resume", "action-cv"]);
    for (const item of downloads) {
      const { href, filename } = item.action as {
        href: string;
        filename: string;
      };
      expect(href.startsWith("/")).toBe(true);
      expect(href).toBe(`/${filename}`);
      expect(item.hint).toBe(filename);
    }
    const cv = downloads.find((i) => i.id === "action-cv")!;
    expect(cv.label).toBe("Download CV");
    expect(cv.action).toEqual({
      kind: "download",
      href: "/Nathaniel-Nikolai-Ladero-CV.pdf",
      filename: "Nathaniel-Nikolai-Ladero-CV.pdf",
    });
  });

  test("page items carry the route's own command as secondary text", () => {
    const hints = buildPaletteItems()
      .filter((i) => i.group === "Pages")
      .map((i) => i.hint);
    expect(hints).toContain("whoami");
    expect(hints).toContain("ls -la projects/");
  });

  test("filter is a case-insensitive substring across label and hint", () => {
    const items = buildPaletteItems();
    const skills = filterPaletteItems(items, "SKILLS");
    expect(skills).toHaveLength(1);
    expect(skills[0].id).toBe("route-skills");
    expect(filterPaletteItems(items, "ls -la")).toHaveLength(1);
    expect(filterPaletteItems(items, "")).toHaveLength(items.length);
    expect(filterPaletteItems(items, "zzz-no-such-thing")).toHaveLength(0);
  });
});

describe("palette dialog", () => {
  test("Control K and Command K open from anywhere and prevent default", async () => {
    await mount();
    let ev: KeyboardEvent | undefined;
    await act(async () => {
      ev = press("k", window, { ctrlKey: true });
    });
    expect(dialog()).not.toBeNull();
    expect(ev!.defaultPrevented).toBe(true);

    await act(async () => {
      press("Escape", window);
    });
    expect(dialog()).toBeNull();

    await act(async () => {
      press("k", window, { metaKey: true });
    });
    expect(dialog()).not.toBeNull();
  });

  test("Control K opens even when focus is in a text field", async () => {
    await mount();
    const field = document.createElement("input");
    field.type = "text";
    document.body.appendChild(field);
    field.focus();
    await act(async () => {
      press("k", field, { ctrlKey: true });
    });
    expect(dialog()).not.toBeNull();
  });

  test("header entry point opens the palette", async () => {
    await mount();
    await act(async () => {
      requestPaletteOpen();
    });
    expect(dialog()).not.toBeNull();
  });

  test("slash opens from a plain surface but never from a text field", async () => {
    await mount();
    await act(async () => {
      press("/", document.body);
    });
    expect(dialog()).not.toBeNull();

    await act(async () => {
      press("Escape", window);
    });
    expect(dialog()).toBeNull();

    const field = document.createElement("input");
    field.type = "text";
    document.body.appendChild(field);
    field.focus();
    await act(async () => {
      press("/", field);
    });
    expect(dialog()).toBeNull();
  });

  test("typing filters the list and the live region announces the count", async () => {
    await mount();
    await act(async () => {
      press("k", window, { ctrlKey: true });
    });
    await act(async () => {
      typeQuery("skills");
    });
    const found = options();
    expect(found).toHaveLength(1);
    expect(found[0].textContent).toContain("Skills");
    expect(host.querySelector('[role="status"]')?.textContent).toBe(
      "1 result",
    );
  });

  test("no matches renders an empty state with a working clear action", async () => {
    await mount();
    await act(async () => {
      press("k", window, { ctrlKey: true });
    });
    await act(async () => {
      typeQuery("zzz-no-such-thing");
    });
    expect(options()).toHaveLength(0);
    expect(host.textContent).toContain("No matches");
    const clear = Array.from(host.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Clear the query"),
    );
    if (!clear) throw new Error("clear-query button is missing");
    await act(async () => {
      clear.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(options().length).toBeGreaterThan(1);
  });

  test("Enter on a route item navigates and closes", async () => {
    await mount();
    await act(async () => {
      press("k", window, { ctrlKey: true });
    });
    await act(async () => {
      typeQuery("skills");
    });
    await act(async () => {
      press("Enter", window);
    });
    expect(window.location.pathname).toBe("/skills");
    expect(dialog()).toBeNull();
  });

  test("arrows move the active option, tracked by aria-activedescendant", async () => {
    await mount();
    await act(async () => {
      press("k", window, { ctrlKey: true });
    });
    const input = host.querySelector("input");
    if (!input) throw new Error("palette input is missing");
    expect(input.getAttribute("aria-activedescendant")).toBe(
      paletteOptionId("route-hero"),
    );
    await act(async () => {
      press("ArrowDown", window);
    });
    expect(input.getAttribute("aria-activedescendant")).toBe(
      paletteOptionId("route-experience"),
    );
    await act(async () => {
      press("ArrowUp", window);
    });
    expect(input.getAttribute("aria-activedescendant")).toBe(
      paletteOptionId("route-hero"),
    );
  });

  test("Tab stays inside the dialog", async () => {
    await mount();
    await act(async () => {
      press("k", window, { ctrlKey: true });
    });
    let ev: KeyboardEvent | undefined;
    await act(async () => {
      ev = press("Tab", window);
    });
    expect(ev!.defaultPrevented).toBe(true);
    expect(host.contains(document.activeElement)).toBe(true);
  });

  test("Escape closes and returns focus to the opener", async () => {
    await mount();
    const opener = document.createElement("button");
    opener.textContent = "opener";
    document.body.appendChild(opener);
    opener.focus();
    await act(async () => {
      press("k", window, { ctrlKey: true });
    });
    expect(dialog()).not.toBeNull();
    await act(async () => {
      press("Escape", window);
    });
    expect(dialog()).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  test("clicking the backdrop closes", async () => {
    await mount();
    await act(async () => {
      press("k", window, { ctrlKey: true });
    });
    const backdrop = host.querySelector("[data-palette-backdrop]");
    if (!(backdrop instanceof HTMLElement))
      throw new Error("backdrop is missing");
    await act(async () => {
      backdrop.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(dialog()).toBeNull();
  });

  test("copy action shows a visible success state with the address", async () => {
    const writeText = vi.fn(async (_text: string) => {});
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    try {
      await mount();
      await act(async () => {
        press("k", window, { ctrlKey: true });
      });
      await act(async () => {
        typeQuery("copy email");
      });
      expect(options()).toHaveLength(1);
      await act(async () => {
        press("Enter", window);
        await Promise.resolve();
      });
      expect(writeText).toHaveBeenCalledWith(CONTACT_EMAIL);
      expect(dialog()).not.toBeNull();
      expect(host.textContent).toContain("Copied.");
      expect(host.textContent).toContain(CONTACT_EMAIL);
    } finally {
      delete (navigator as unknown as Record<string, unknown>).clipboard;
    }
  });

  test("copy failure names the manual remedy and shows the address", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
    try {
      await mount();
      await act(async () => {
        press("k", window, { ctrlKey: true });
      });
      await act(async () => {
        typeQuery("copy email");
      });
      await act(async () => {
        press("Enter", window);
        await Promise.resolve();
      });
      expect(host.textContent).toContain("copy it manually");
      expect(host.textContent).toContain(CONTACT_EMAIL);
    } finally {
      delete (navigator as unknown as Record<string, unknown>).clipboard;
    }
  });

  test("unmounting removes the global keydown listener", async () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    await mount();
    await unmount();
    expect(removeSpy).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function),
    );
    removeSpy.mockRestore();
    await act(async () => {
      press("k", window, { ctrlKey: true });
    });
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });
});
