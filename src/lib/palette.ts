/**
 * Command palette data — pure and testable without mounting.
 *
 * The palette is the keyboard front door to the site: every route, every
 * project, and the keyless contact actions in one filterable list. The item
 * builders and the filter below carry no DOM or React so they unit-test
 * directly; `src/components/CommandPalette.tsx` owns the dialog, focus, and
 * activation wiring.
 *
 * Source notes:
 * - Routes come from `ROUTES` (src/lib/router.tsx); the label is the
 *   person-facing `navName` (as in the Header) and the hint is the route's
 *   own `command` string.
 * - Projects come from `projects` (src/content/projects.ts); activating one
 *   navigates to `/projects`.
 * - The résumé and CV download hrefs are imported from src/lib/contact.ts —
 *   the same constants PageFoot renders (the build copies both repo-root PDFs
 *   to dist/, so they resolve in production) — never an invented path.
 * - The mailto is built from `CONTACT_EMAIL` (src/lib/contact.ts), the real
 *   single source of truth; src/content/contact.ts holds only the relay key.
 */

import { projects } from "../content/projects";
import { CONTACT_EMAIL, CV_PATH, RESUME_PATH } from "./contact";
import { navName } from "./navNames";
import { ROUTES } from "./router";

export type PaletteGroup = "Pages" | "Projects" | "Actions";

export type PaletteAction =
  | { kind: "route"; path: string }
  | { kind: "external"; url: string }
  | { kind: "mailto"; href: string }
  | { kind: "download"; href: string; filename: string }
  | { kind: "copy-email" };

export interface PaletteItem {
  /** Stable id, also the suffix of the rendered option element id. */
  id: string;
  group: PaletteGroup;
  label: string;
  /** Secondary text shown beside the label and included in filtering. */
  hint: string;
  action: PaletteAction;
}

/** Download paths: one constant each from src/lib/contact.ts — the same values
    PageFoot renders — with the filename being that path minus its leading
    slash. Nothing is restated here, so the palette cannot drift from the site. */
export const RESUME_HREF = RESUME_PATH;
export const RESUME_FILENAME = RESUME_PATH.slice(1);
export const CV_HREF = CV_PATH;
export const CV_FILENAME = CV_PATH.slice(1);

export const GITHUB_URL = "https://github.com/nathwn12";
export const LINKEDIN_URL =
  "https://www.linkedin.com/in/nathaniel-nikolai-l-184181261/";

export const EMAIL_HREF = `mailto:${CONTACT_EMAIL}`;

/** Window event the Header dispatches to open the palette; the palette owns
    the open state so chrome never prop-drills it. */
export const PALETTE_OPEN_EVENT = "nnl:open-palette";

export function requestPaletteOpen(): void {
  window.dispatchEvent(new CustomEvent(PALETTE_OPEN_EVENT));
}

/** DOM id of a rendered option, shared with tests and aria-activedescendant. */
export function paletteOptionId(itemId: string): string {
  return `palette-option-${itemId}`;
}

export function buildPaletteItems(): PaletteItem[] {
  const pages: PaletteItem[] = ROUTES.map((route) => ({
    id: `route-${route.id}`,
    group: "Pages",
    label: navName(route.id, route.label),
    hint: route.command,
    action: { kind: "route", path: route.path },
  }));

  const projectItems: PaletteItem[] = projects.map((project) => ({
    id: `project-${project.id}`,
    group: "Projects",
    label: project.name,
    hint: `${project.kind} · ${project.dir}`,
    action: { kind: "route", path: "/projects" },
  }));

  const actions: PaletteItem[] = [
    {
      id: "action-email",
      group: "Actions",
      label: "Email Nathaniel",
      hint: CONTACT_EMAIL,
      action: { kind: "mailto", href: EMAIL_HREF },
    },
    {
      id: "action-copy-email",
      group: "Actions",
      label: "Copy email address",
      hint: CONTACT_EMAIL,
      action: { kind: "copy-email" },
    },
    {
      id: "action-github",
      group: "Actions",
      label: "GitHub",
      hint: "github.com/nathwn12",
      action: { kind: "external", url: GITHUB_URL },
    },
    {
      id: "action-linkedin",
      group: "Actions",
      label: "LinkedIn",
      hint: "linkedin.com/in/nathaniel-nikolai-l-184181261",
      action: { kind: "external", url: LINKEDIN_URL },
    },
    {
      id: "action-resume",
      group: "Actions",
      label: "Download résumé",
      hint: RESUME_FILENAME,
      action: {
        kind: "download",
        href: RESUME_HREF,
        filename: RESUME_FILENAME,
      },
    },
    {
      id: "action-cv",
      group: "Actions",
      label: "Download CV",
      hint: CV_FILENAME,
      action: {
        kind: "download",
        href: CV_HREF,
        filename: CV_FILENAME,
      },
    },
  ];

  return [...pages, ...projectItems, ...actions];
}

/** Case-insensitive substring match across label and hint. Pure per render —
    the component computes it inline, never mirrored into an effect. */
export function filterPaletteItems(
  items: readonly PaletteItem[],
  query: string,
): PaletteItem[] {
  const q = query.trim().toLowerCase();
  if (q === "") return [...items];
  return items.filter((item) =>
    `${item.label} ${item.hint}`.toLowerCase().includes(q),
  );
}

/**
 * Copy text to the clipboard: the async Clipboard API first, then the
 * legacy execCommand path for locked-down clients. Never throws — false
 * means the caller must show the manual-copy remedy.
 */
export async function copyText(text: string): Promise<boolean> {
  const field = document.createElement("textarea");
  try {
    const clipboard = navigator.clipboard;
    if (clipboard && typeof clipboard.writeText === "function") {
      await clipboard.writeText(text);
      return true;
    }
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    return (
      typeof document.execCommand === "function" &&
      document.execCommand("copy")
    );
  } catch {
    return false;
  } finally {
    field.remove();
  }
}
