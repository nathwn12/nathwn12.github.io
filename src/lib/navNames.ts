/**
 * Display names for the route nav — one source for the two shell surfaces that
 * read them (the Header nav and the PageFoot pager).
 *
 * `RouteDef.label` is the shell's short code (`EXP`, `SKILLS`) and stays
 * untouched: the direction requires sentence case wherever a label is shown to
 * a person, and this map is that step. Keyed by route id, falling back to the
 * label so a new route still renders something sensible.
 */
const NAV_NAMES: Readonly<Record<string, string>> = {
  hero: "Home",
  experience: "Experience",
  skills: "Skills",
  projects: "Projects",
  contact: "Contact",
  thanks: "Thanks",
};

export function navName(id: string, label: string): string {
  return NAV_NAMES[id] ?? label;
}
