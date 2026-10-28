import { useEffect } from "react";
import { consumeSectionScroll, scrollToSection } from "../lib/router";
import { FirstScreen } from "./FirstScreen";
import { ProofBand } from "./ProofBand";
import { WorkBand } from "./WorkBand";
import { AtlasBand } from "./AtlasBand";
import { ForwardBand } from "./ForwardBand";
import { CredentialsBand } from "./CredentialsBand";
import { Contact } from "./Contact";

/**
 * Record — the site's home page, one continuous scroll.
 *
 * identity → proof → selected work → the system atlas → forward → credentials
 * → contact. Seven bands, one page, no route between them: the old five-route
 * IA made a visitor choose a page before they had read a claim, and the two
 * pages it retired (/skills, /contact) were one band each.
 *
 * Two kinds of inbound link land here: a `#band` hash (a shared link) and a
 * retired path (`/skills`, `/contact`) that the router canonicalizes to `/` and
 * hands over as a pending section. Both are consumed once, on mount, after the
 * bands exist.
 */
export function Record() {
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    const target = consumeSectionScroll() ?? hash;
    if (!target) return;
    const frame = window.requestAnimationFrame(() => scrollToSection(target));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <>
      <FirstScreen />
      <ProofBand />
      <WorkBand />
      <AtlasBand />
      <ForwardBand />
      <CredentialsBand />
      <Contact />
    </>
  );
}
