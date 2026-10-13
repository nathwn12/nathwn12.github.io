import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useResolvedReduceMotion } from "../lib/motionPreference";
import { employer, experience } from "../content/experience";
import { projects } from "../content/projects";
import { RouteLink } from "../lib/router";
import {
  fadeUp,
  heroIn,
  marqueeX,
  staggerChild,
  staggerParent,
} from "../lib/motion";
import { CredentialsStrip, ProofBand } from "./ProofBand";
import { PageFoot } from "./PageFoot";
import { SystemAtlas } from "./SystemAtlas";
import { WorkTeaser } from "./WorkTeaser";

/**
 * Hero — the landing page, read as one statement followed by its evidence.
 *
 * Bands run in the direction's order (docs/premium-direction.md § Landing
 * wireframe): the title block carries the page's single moment of character
 * (weight and size, no second spectacle), the current role sits adjacent to it
 * in Detail, the real stack runs as a hairline-bounded seam, then the proof
 * marker, the selected work, and the credentials strip close the page — one
 * band after another, separated by 1px Line rules, so position carries
 * hierarchy instead of colour or cards.
 *
 * Copy is read from src/content/*.ts — this file states the claim and sequences
 * the evidence, it never authors a fact. Depth lives on the routes, not here:
 * there is no metric wall, no card grid, and no credentials list dressed as
 * decoration.
 *
 * Motion comes from src/lib/motion only (frozen token names): the statement
 * walks in per element (heroIn for the title, fadeUp for the clauses), the
 * stack seam scrolls only when the visitor permits motion, and every band
 * degrades to a static, fully legible state under reduced motion.
 *
 * Authority: fleet brief (senior landing pass) + docs/premium-direction.md
 * § Landing, § Type, § Principles 1 and 5.
 */

/* The seam's index: real identifiers from the shipped work, de-duplicated and
   order-preserved. Read-only from content. */
const techStrip: string[] = Array.from(
  new Set([
    ...projects.flatMap((project) => project.tech),
    ...experience.flatMap((entry) => entry.tech),
  ]),
);

/**
 * The hero identities, in rotation order. The first entry is the owner's
 * opening claim and the static default (first paint, reduced motion, no-JS);
 * the rest state what he is — a backend developer building fintech systems, an
 * AI-equipped builder — so the h1 says "what I am", never payment-only. Kept
 * here, in the Hero surface, because the copy is the page's one bold move.
 */
export const HERO_PHRASES: readonly string[] = [
  "Payment backends that hold up under production load.",
  "A backend developer building fintech systems.",
  "An AI-equipped builder who ships measured change.",
  "An engineer who reads production before the diagram.",
];

/** Typing cadence in ms: one beat per keystroke, a longer hold on a finished
    phrase, and a short gap before the next phrase starts. */
export const TYPING_CADENCE = {
  type: 45,
  delete: 24,
  hold: 1600,
  gap: 350,
} as const;

export interface TypingState {
  phraseIndex: number;
  charCount: number;
  deleting: boolean;
}

/** The first frame: the opening phrase fully shown, so first paint and the
    reduced-motion / no-JS state both carry the real claim, never an empty h1. */
export function initialTypingState(
  phrases: readonly string[] = HERO_PHRASES,
): TypingState {
  return {
    phraseIndex: 0,
    charCount: (phrases[0] ?? "").length,
    deleting: false,
  };
}

/**
 * Pure, timerless one-step transition of the typing loop — deterministic, so
 * the unit tests drive it directly and the mount effect only schedules it.
 * Types forward, holds, deletes, then advances to the next phrase (wrapping).
 */
export function nextTypingState(
  state: TypingState,
  phrases: readonly string[] = HERO_PHRASES,
): TypingState {
  const full = phrases[state.phraseIndex] ?? "";
  if (!state.deleting) {
    if (state.charCount < full.length) {
      return { ...state, charCount: state.charCount + 1 };
    }
    return { ...state, deleting: true };
  }
  if (state.charCount > 0) {
    return { ...state, charCount: state.charCount - 1 };
  }
  return {
    phraseIndex: (state.phraseIndex + 1) % phrases.length,
    charCount: 0,
    deleting: false,
  };
}

/** How long the current frame is displayed before {@link nextTypingState}. */
export function typingDelayMs(
  state: TypingState,
  phrases: readonly string[] = HERO_PHRASES,
): number {
  const full = phrases[state.phraseIndex] ?? "";
  if (!state.deleting) {
    return state.charCount < full.length
      ? TYPING_CADENCE.type
      : TYPING_CADENCE.hold;
  }
  return state.charCount > 0 ? TYPING_CADENCE.delete : TYPING_CADENCE.gap;
}

/**
 * The typing loop as a hook. Renders the current frame, waits its beat, steps
 * once with {@link nextTypingState}, and repeats. Reduced motion opts out
 * entirely: no timers are scheduled and the first phrase stays put. Exported so
 * the deterministic pure helpers AND the timer/cleanup behavior can be tested
 * without mounting the whole landing surface.
 */
export function useHeroTyping(
  reduceMotion: boolean,
  phrases: readonly string[] = HERO_PHRASES,
) {
  const [state, setState] = useState<TypingState>(() =>
    initialTypingState(phrases),
  );

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setTimeout(() => {
      setState((current) => nextTypingState(current, phrases));
    }, typingDelayMs(state, phrases));
    return () => window.clearTimeout(id);
  }, [state, reduceMotion, phrases]);

  const phrase = phrases[state.phraseIndex] ?? phrases[0] ?? "";
  const shown = reduceMotion
    ? (phrases[0] ?? "")
    : phrase.slice(0, state.charCount);
  return { state, phrase, shown };
}

export function Hero() {
  const reduceMotion = useResolvedReduceMotion();
  const { phrase, shown } = useHeroTyping(reduceMotion);

  return (
    <section id="hero" className="flex flex-col">
      {/* Title block — the one bold move on the page. Left aligned, one claim
          sentence, then the role stated in words with no separator glyphs. */}
      <div className="px-6 pt-14 pb-block lg:px-10 lg:pt-20">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerParent}
          className="mx-auto w-full max-w-[68ch]"
        >
          <motion.h1
            variants={heroIn}
            aria-label={reduceMotion ? HERO_PHRASES[0] : phrase}
            className="max-w-[16ch] text-[clamp(2.5rem,6vw,4rem)] leading-[1.04] font-semibold text-text"
          >
            <span aria-hidden="true">{shown}</span>
            {!reduceMotion && (
              <span aria-hidden="true" className="text-accent-text">
                ▍
              </span>
            )}
          </motion.h1>


          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-[62ch] text-lead text-text"
          >
            C# and ASP.NET Core, Ubuntu servers, Docker, and CI/CD, measured by
            what changed in production rather than by the size of the stack.
          </motion.p>

          <motion.p
            variants={fadeUp}
            className="mt-5 max-w-[62ch] text-detail text-text-muted"
          >
            {employer.role}, {employer.company}. {employer.location},{" "}
            {employer.period}.
          </motion.p>

          <motion.p variants={staggerChild} className="mt-8">
            <RouteLink
              href="/contact"
              data-nav-item
              className="flex min-h-11 w-fit items-center rounded-xs text-lead font-semibold text-accent-text transition-colors duration-150 hover:underline"
            >
              Get in touch about a role
            </RouteLink>
          </motion.p>
        </motion.div>
      </div>

      {/* The seam between the statement and its evidence: the real stack under
          two hairlines, moving only when the visitor permits motion. Each item
          is separated by a 1px Line rule, never a glyph. */}
      <div className="overflow-hidden border-y border-border py-3">
        <motion.ul
          aria-hidden="true"
          variants={marqueeX}
          animate={reduceMotion ? undefined : "animate"}
          className="flex w-max items-center"
        >
          {[...techStrip, ...techStrip].map((tech, index) => (
            <li
              key={`${tech}-${index}`}
              className="flex items-center gap-6 pr-6 text-detail text-text-muted"
            >
              {tech}
              <span className="h-3 w-px bg-border" aria-hidden="true" />
            </li>
          ))}
        </motion.ul>
      </div>

      <SystemAtlas />

      <ProofBand />

      <WorkTeaser />

      <CredentialsStrip />

      <div className="px-6 pb-section lg:px-10">
        <div className="mx-auto w-full max-w-[68ch]">
          <PageFoot accentResume />
        </div>
      </div>
    </section>
  );
}
