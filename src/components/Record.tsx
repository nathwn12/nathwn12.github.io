import { useEffect } from "react";
import { consumeSectionScroll, scrollToSection } from "../lib/router";
import { FirstScreen } from "./FirstScreen";
import { ProofBand } from "./ProofBand";
import { AiPractice } from "./AiPractice";
import { WorkBand } from "./WorkBand";
import { AtlasBand } from "./AtlasBand";
import { ForwardBand } from "./ForwardBand";
import { CredentialsBand } from "./CredentialsBand";
import { Contact } from "./Contact";

/**
 * Record — the site's home page, one continuous scroll.
 *
 * identity → the record → AI practice → public work → the system atlas →
 * forward → credentials → contact. Eight bands, one page, no route between
 * them: the old five-route IA made a visitor choose a page before they had read
 * a claim, and the two pages it retired (/skills, /contact) were one band each.
 *
 * The order is the argument: who this is, what the work measurably did, what he
 * can do with AI now, then the public repositories as supporting evidence, then
 * the reference material and the way to reach him. The thirteen tools sit low on
 * purpose — they support the record, they are not the record.
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
      <AiPractice />
      <WorkBand />
      <AtlasBand />
      <ForwardBand />
      <CredentialsBand />
      <Contact />
    </>
  );
}
