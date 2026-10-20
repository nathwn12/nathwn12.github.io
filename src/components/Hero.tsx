import { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue } from "framer-motion";
import type { AnimationPlaybackControls } from "framer-motion";
import { employer, experience } from "../content/experience";
import { projects } from "../content/projects";
import { HERO_INSTALL_HINT, HERO_SENTENCE } from "../content/portfolio";
import { RouteLink } from "../lib/router";
import { fadeUp, heroIn, staggerChild, staggerParent } from "../lib/motion";
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
 * walks in per element (heroIn for the title, fadeUp for the clauses), and the
 * stack seam scrolls continuously — the seam is the one motion this file drives
 * itself, from a MotionValue, so the loop can be held (see
 * {@link TICKER_PX_PER_S}). Nothing here is gated on the visitor's OS (owner
 * order 2026-10-14, src/lib/motionPreference.ts): the typed claim is the
 * page's one piece of character, and it is set in a fixed-length box so the
 * bands below it never move while it types.
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
 * The seam's rate: an ambient ticker reads at 35–45 px/s. The strip is laid out
 * `w-max` and duplicated once, so one loop carries it exactly half its own
 * width; the loop's seconds are therefore half the measured track over this
 * rate, never a duration kept by hand — a stack item added to
 * {@link techStrip} or a change of face would otherwise silently change the
 * pace. Measured at 1440x900 (full Chromium over CDP, 2026-10-14): the track is
 * 16417.34px wide, so one loop is 8208.67px and 40px/s is 205.2s.
 *
 * The loop is driven from a MotionValue rather than from a variant, because a
 * variant's loop has no handle to hold: measured at 1440x900 (2026-10-14) the
 * strip kept running at 40px/s while hovered. WCAG 2.2.2 asks that movement
 * lasting over five seconds can be paused, and hovering or focusing the seam is
 * that mechanism — a hidden document holds it too. Reduced motion is
 * deliberately NOT a gate here (owner order 2026-10-14).
 */
const TICKER_PX_PER_S = 40;

/**
 * The hero identities. The first entry is the fixed opening hook — it leads
 * every visit and is the static default (first paint, no-JS),
 * never randomized; the rest state what he is — a backend developer building
 * fintech systems, an AI-equipped builder — so the claim opens on the payments
 * work before the identities rotate. After the opener, the remaining entries
 * rotate from a shuffled bag ({@link nextTypingState}) rather than in fixed
 * order, so the h1 varies without repeating the previous phrase. Kept here, in
 * the Hero surface, because the copy is the page's one bold move.
 */
export const HERO_PHRASES: readonly string[] = [
  "Payment backends that hold up under production load.",
  "A backend developer building fintech systems.",
  "An AI-equipped builder who ships measured change.",
  "An engineer who reads production before the diagram.",
];

/** Typing cadence in ms: one beat per keystroke, a longer hold on a finished
    phrase, a longer still hold on the opening hook (the page's one claim, held
    longest so it is read before the rotation begins), and a short gap before
    the next phrase starts. */
export const TYPING_CADENCE = {
  type: 55,
  delete: 30,
  hold: 2000,
  holdFirst: 2600,
  gap: 400,
} as const;

export interface TypingState {
  phraseIndex: number;
  charCount: number;
  deleting: boolean;
  /** Remaining shuffled phrase indices drawn after the opener; absent until the
      first advance, then carried frame to frame so ordering survives steps. */
  bag?: readonly number[];
}

/** The first frame: the opening phrase fully shown, so first paint and the
    no-JS state both carry the real claim, never an empty h1. */
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
 * Fisher–Yates shuffle of a set of phrase indices, seeded by the injected
 * `rng`. When more than one index remains, `avoidFirst` is never left in the
 * first slot — so a bag refilled at the end of a cycle can never begin with the
 * phrase that just finished (no immediate repeat across the refill boundary).
 */
function shuffledBag(
  indices: readonly number[],
  avoidFirst: number,
  rng: () => number,
): number[] {
  const bag = [...indices];
  for (let i = bag.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  if (bag.length > 1 && bag[0] === avoidFirst) {
    const swap = 1 + Math.floor(rng() * (bag.length - 1));
    [bag[0], bag[swap]] = [bag[swap], bag[0]];
  }
  return bag;
}

/**
 * Pure, timerless one-step transition of the typing loop — deterministic given
 * `rng`, so the unit tests drive it directly and the mount effect only
 * schedules it. Types forward, holds, deletes, then draws the next phrase from
 * a shuffled bag of the non-opening indices (refilled when exhausted), so the
 * rotation varies but never repeats the phrase that just finished. The opener
 * (index 0) leads every visit and is never drawn again.
 */
export function nextTypingState(
  state: TypingState,
  phrases: readonly string[] = HERO_PHRASES,
  rng: () => number = Math.random,
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
  const others =
    phrases.length > 1 ? phrases.slice(1).map((_, i) => i + 1) : [];
  if (others.length === 0) {
    return { phraseIndex: 0, charCount: 0, deleting: false };
  }
  const remaining =
    state.bag && state.bag.length > 0
      ? state.bag
      : shuffledBag(others, state.phraseIndex, rng);
  const [phraseIndex, ...bag] = remaining;
  return { phraseIndex, charCount: 0, deleting: false, bag };
}

/** How long the current frame is displayed before {@link nextTypingState}. */
export function typingDelayMs(
  state: TypingState,
  phrases: readonly string[] = HERO_PHRASES,
): number {
  const full = phrases[state.phraseIndex] ?? "";
  if (!state.deleting) {
    if (state.charCount < full.length) return TYPING_CADENCE.type;
    return state.phraseIndex === 0
      ? TYPING_CADENCE.holdFirst
      : TYPING_CADENCE.hold;
  }
  return state.charCount > 0 ? TYPING_CADENCE.delete : TYPING_CADENCE.gap;
}

/**
 * The typing loop as a hook. Renders the current frame, waits its beat, steps
 * once with {@link nextTypingState}, and repeats — always: there is no reduced
 * state to opt out to, so the loop owns its timer unconditionally. Exported so
 * the deterministic pure helpers AND the timer/cleanup behavior can be tested
 * without mounting the whole landing surface.
 */
export function useHeroTyping(phrases: readonly string[] = HERO_PHRASES) {
  const [state, setState] = useState<TypingState>(() =>
    initialTypingState(phrases),
  );

  useEffect(() => {
    const id = window.setTimeout(() => {
      setState((current) => nextTypingState(current, phrases));
    }, typingDelayMs(state, phrases));
    return () => window.clearTimeout(id);
  }, [state, phrases]);

  const phrase = phrases[state.phraseIndex] ?? phrases[0] ?? "";
  const shown = phrase.slice(0, state.charCount);
  return { state, phrase, shown };
}

/**
 * The Insert caret — the rule that rides the end of the typed claim.
 *
 * Zero-width by construction: a `w-0` inline anchor with the rule absolutely
 * positioned inside it, so the caret can never push the last character onto a
 * new line. It is a drawn rule rather than a `▍` glyph so the page never asks
 * for a face it does not set (premium-direction.md § Type: Fraunces + Public
 * Sans, no system fallback). Its height stays inside the line's own ascent
 * (0.8em of the 1em content box), so it adds no leading of its own.
 */
function InsertCaret() {
  return (
    <span aria-hidden="true" className="relative inline-block h-[0.8em] w-0">
      <span className="absolute bottom-0 left-[0.1em] h-[0.7em] w-[0.09em] bg-accent-text" />
    </span>
  );
}

/**
 * Terminal install hint — types the one-line install hint unless the
 * visitor prefers reduced motion, in which case it renders statically
 * (UX spec accessibility floor). No autoplay beyond this single hint.
 */
function InstallHint() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [count, setCount] = useState(HERO_INSTALL_HINT.length);

  useEffect(() => {
    const query =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;
    if (!query) return;
    const sync = () => {
      setReduced(query.matches);
      if (query.matches) setCount(HERO_INSTALL_HINT.length);
    };
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduced) {
      setCount(HERO_INSTALL_HINT.length);
      return;
    }
    setCount(0);
    const id = window.setInterval(() => {
      setCount((c) => {
        if (c >= HERO_INSTALL_HINT.length) {
          window.clearInterval(id);
          return c;
        }
        return c + 1;
      });
    }, 45);
    return () => window.clearInterval(id);
  }, [reduced]);

  return (
    <p
      aria-label={`Try it: ${HERO_INSTALL_HINT}`}
      className="mt-6 rounded-xs border border-border bg-surface p-3 font-mono text-detail text-text"
    >
      <span aria-hidden="true" className="text-text-muted">
        ${" "}
      </span>
      <span aria-hidden="true">{HERO_INSTALL_HINT.slice(0, count)}</span>
      {!reduced && count < HERO_INSTALL_HINT.length ? (
        <InsertCaret />
      ) : null}
    </p>
  );
}

export function Hero() {
  const { phrase, shown } = useHeroTyping();
  /* The same pass reads the loop's length off the track, so the seconds that
     buy the ambient rate come from the rendered strip rather than from a
     constant, and the faces are settled first: a fallback face lays the strip
     out at a different width, and only the settled layout can time the loop.
     Starting the loop from this effect, rather than from a variant, is also
     what makes it holdable: the root's
     `<AnimatePresence mode="wait" initial={false}>` (src/App.tsx) suppresses an
     element's first declarative pass, which is what left the strip parked at the
     loop's final keyframe, and a variant loop has no handle to pause. */
  const trackRef = useRef<HTMLUListElement>(null);
  const trackX = useMotionValue(0);
  const [tickerSeconds, setTickerSeconds] = useState<number | null>(null);
  useEffect(() => {
    let alive = true;
    const arm = () => {
      const track = trackRef.current;
      if (!alive || !track) return;
      setTickerSeconds(track.getBoundingClientRect().width / 2 / TICKER_PX_PER_S);
    };
    document.fonts.ready.then(arm, arm);
    return () => {
      alive = false;
    };
  }, []);

  /* The seam's loop: the duplicated track travels exactly half its own width
     (the loop's seconds times the rate) and repeats for as long as the page is
     up. `animate` hands back the playback controls, and they are kept — pausing
     the loop where it stands is what the hold below needs; re-creating the loop
     on resume would jump the strip back to its start. */
  const controlsRef = useRef<AnimationPlaybackControls | null>(null);
  useEffect(() => {
    if (tickerSeconds === null) return;
    const controls = animate(trackX, [0, -tickerSeconds * TICKER_PX_PER_S], {
      duration: tickerSeconds,
      ease: "linear",
      repeat: Infinity,
    });
    controlsRef.current = controls;
    return () => {
      controlsRef.current = null;
      controls.stop();
    };
  }, [tickerSeconds, trackX]);

  /* The hold: hovering the seam, focusing inside it, or hiding the document
     pauses the loop; releasing continues it from where it stopped. The seam
     carries no control of its own, so the gesture IS the control. */
  const [held, setHeld] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  useEffect(() => {
    const sync = () => setTabHidden(document.visibilityState === "hidden");
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    if (held || tabHidden) controls.pause();
    else controls.play();
  }, [held, tabHidden, tickerSeconds]);

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
          <motion.p
            variants={fadeUp}
            className="font-mono text-detail text-text-muted"
          >
            $ whoami
          </motion.p>
          <motion.p
            variants={fadeUp}
            className="mt-2 max-w-[62ch] text-lead font-semibold text-text"
          >
            {HERO_SENTENCE}
          </motion.p>
          <motion.div variants={fadeUp}>
            <InstallHint />
          </motion.div>
          <motion.p
            variants={staggerChild}
            className="mt-4 flex flex-wrap gap-x-8"
          >
            <RouteLink
              href="/projects"
              data-nav-item
              className="flex min-h-11 items-center rounded-xs text-lead font-semibold text-accent-text transition-colors duration-150 hover:underline"
            >
              See featured work
            </RouteLink>
            <RouteLink
              href="/contact"
              data-nav-item
              className="flex min-h-11 items-center rounded-xs text-lead font-semibold text-accent-text transition-colors duration-150 hover:underline"
            >
              Get in touch
            </RouteLink>
          </motion.p>
          <motion.h1
            variants={heroIn}
            aria-label={phrase}
            className="grid max-w-[16ch] grid-cols-1 text-[clamp(2.5rem,6vw,4rem)] leading-[1.04] font-semibold text-text"
          >
            {/* Fixed-length Insert: every identity is laid out invisibly in the
                SAME grid cell as the typed one, so the h1 is always exactly as
                tall as the longest identity — including its caret — and the
                claim can type itself out without ever reflowing the bands
                below. No reserved magic height, and no drift at any breakpoint. */}
            {HERO_PHRASES.map((identity) => (
              <span
                key={identity}
                aria-hidden="true"
                className="col-start-1 row-start-1 invisible"
              >
                {identity}
                <InsertCaret />
              </span>
            ))}
            <span aria-hidden="true" className="col-start-1 row-start-1">
              {shown}
              <InsertCaret />
            </span>
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
            className="mt-5 max-w-[62ch] text-detail text-text-muted text-balance"
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
          two hairlines, always scrolling unless held — hovering, focusing
          inside, or hiding the document pauses it (see
          {@link TICKER_PX_PER_S}). Each item is separated by a 1px Line rule,
          never a glyph. */}
      <div
        className="overflow-hidden border-y border-border py-3"
        onMouseEnter={() => setHeld(true)}
        onMouseLeave={() => setHeld(false)}
        onFocus={() => setHeld(true)}
        onBlur={() => setHeld(false)}
      >
        <motion.ul
          ref={trackRef}
          aria-hidden="true"
          style={{ x: trackX }}
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
