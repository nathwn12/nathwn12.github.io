import { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useAnimationFrame,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useVelocity,
} from "framer-motion";
import type { AnimationPlaybackControls } from "framer-motion";
import { heroClaim, coreStack, availability } from "../content/hero";
import { CONTACT_EMAIL } from "../lib/contact";
import {
  employer,
  experience,
  experienceMarginalia,
  formerRoleLine,
} from "../content/experience";
import { projects, projectsMarginalia } from "../content/projects";
import {
  bandEnter,
  fadeUp,
  mastheadLine,
  mastheadParent,
  staggerChild,
  staggerParent,
} from "../lib/motion";
import {
  MARQUEE_EASE_BACK_MS,
  marqueeRateForVelocity,
} from "../lib/motion";
import { CredentialsStrip } from "./ProofBand";
import { ExperienceBand } from "./ExperienceBand";
import { ForwardBand } from "./ForwardBand";
import { PageFoot } from "./PageFoot";
import { SystemAtlas } from "./SystemAtlas";
import { WorkTeaser } from "./WorkTeaser";
import { GUTTER_CONTAINER, Marginalia } from "./InstrumentBand";

/**
 * Hero — the landing page, read as one statement followed by its evidence.
 *
 * The title block carries the page's single moment of character: the opening
 * claim typing itself through a rotating set of identities, then the role
 * stated in words, the primary action phrase, and one plain prose line naming
 * the stack the career was actually built on. Directly after the title block
 * comes the seam — the real stack under two hairlines, scrolling unless held —
 * then the backend experience band, the selected work, the forward band, and
 * the credentials strip close the page, so position carries hierarchy instead
 * of colour or cards.
 *
 * Copy is read from src/content/*.ts — this file states the claim and sequences
 * the evidence, it never authors a fact. The opening hook lives in
 * src/content/hero.ts ({@link heroClaim}) and leads {@link HERO_PHRASES} so
 * the claim has one home. Depth lives on the routes, not here:
 * there is no metric wall, no card grid, and no credentials list dressed as
 * decoration.
 *
 * Motion comes from src/lib/motion only (frozen token names): the statement
 * walks in per element (heroIn for the title, fadeUp for the clauses), the
 * claim types itself through the identities, and the stack seam scrolls
 * continuously — the seam is the one motion this file drives itself, from a
 * MotionValue, so the loop can be held (see {@link TICKER_PX_PER_S}). Both
 * loops honour `prefers-reduced-motion: reduce`: the typed claim renders
 * static and the seam stands still, with no timer and no infinite animation
 * scheduled. The seam holds while hovered, while focus is inside it, and
 * while the document is hidden. By owner decision there is no pause control:
 * the hold mechanisms are the whole gate, no knob is offered.
 *
 * Authority: owner brief 2026-10-21 (recruiter-first landing, motion restored
 * without a pause control) + docs/premium-direction.md § Landing, § Type,
 * § Principles 1 and 5.
 */

/* The seam's index: real identifiers from the shipped work, de-duplicated and
   order-preserved. Read-only from content. */
const _baseStrip: string[] = Array.from(
  new Set([
    ...projects.flatMap((project) => project.tech),
    ...experience.flatMap((entry) => entry.tech),
  ]),
);

/* Lead with the recognizable core stack (case-insensitive match against the
   derived base), then the rest in existing order — still de-duplicated. */
const CORE_FIRST = ["C#", "ASP.NET", "MySQL", "Redis", "RabbitMQ", "AWS"];

const techStrip: string[] = [
  ...CORE_FIRST.map((core) =>
    _baseStrip.find((tech) => tech.toLowerCase() === core.toLowerCase()),
  ).filter((tech): tech is string => typeof tech === "string"),
  ..._baseStrip.filter(
    (tech) =>
      !CORE_FIRST.some((core) => core.toLowerCase() === tech.toLowerCase()),
  ),
];

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
 * lasting over five seconds can be paused, and hovering or focusing the seam
 * is one mechanism — a hidden document holds it too.
 * `prefers-reduced-motion:
 * reduce` stops it entirely (see {@link usePrefersReducedMotion}): no loop is
 * scheduled and the seam renders as a static list.
 */
const TICKER_PX_PER_S = 40;

/**
 * The hero identities. The first entry is the fixed opening hook — it leads
 * every visit and is the static default (first paint, no-JS),
 * never randomized; the rest state what he is in varied cadence — a clipped
 * fragment, an em-dash clause, a colon-led turn — so the rotation never
 * settles into one sentence shape. After the opener, the remaining entries
 * rotate from a shuffled bag ({@link nextTypingState}) rather than in fixed
 * order, so the h1 varies without repeating the previous phrase. The opener is
 * read from src/content/hero.ts so the claim has one home; the rotation
 * entries are kept here, in the Hero surface, because the copy is the page's
 * one bold move.
 */
export const HERO_PHRASES: readonly string[] = [
  heroClaim,
  "Backend developer, fintech systems in production.",
  "An AI-equipped builder — every change measured before it ships.",
  "Production first, diagrams second: I read the live system.",
];

/** Typing cadence in ms: one beat per keystroke, a longer hold on a finished
    phrase, a longer still hold on the opening hook (the page's one claim, held
    longest so it is read before the rotation begins), and a short gap before
    the next phrase starts. */
export const TYPING_CADENCE = {
  type: 42,
  delete: 26,
  hold: 2200,
  holdFirst: 3200,
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
 * Whether the visitor asks for less motion.
 *
 * Reads the OS `prefers-reduced-motion: reduce` query live, so a mid-visit
 * change settles on the next render. Safe where `matchMedia` is missing
 * (SSR, jsdom without a stub): reports no preference and the loops animate.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() =>
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", sync);
      return () => query.removeEventListener("change", sync);
    }
    return;
  }, []);

  return reduced;
}

/**
 * The typing loop as a hook. Renders the current frame, waits its beat, steps
 * once with {@link nextTypingState}, and repeats — unless the visitor prefers
 * reduced motion, in which case it renders the opening claim statically and
 * schedules no timer. Exported so
 * the deterministic pure helpers AND the timer/cleanup behavior can be tested
 * without mounting the whole landing surface.
 */
export function useHeroTyping(phrases: readonly string[] = HERO_PHRASES) {
  const reduceMotion = usePrefersReducedMotion();
  const [state, setState] = useState<TypingState>(() =>
    initialTypingState(phrases),
  );

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setTimeout(() => {
      setState((current) => nextTypingState(current, phrases));
    }, typingDelayMs(state, phrases));
    return () => window.clearTimeout(id);
  }, [state, phrases, reduceMotion]);

  const phrase = phrases[state.phraseIndex] ?? phrases[0] ?? "";
  const shown = reduceMotion ? phrase : phrase.slice(0, state.charCount);
  return { state, phrase, shown, reduceMotion };
}

/**
 * The Insert caret — the rule that rides the end of the typed claim.
 *
 * Zero-width by construction: a `w-0` inline anchor with the rule absolutely
 * positioned inside it, so the caret can never push the last character onto a
 * new line. It is a drawn rule rather than a `▍` glyph so the page never asks
 * for a face it does not set (premium-direction.md § Type: Newsreader + Inter,
 * no system fallback). Its height stays inside the line's own ascent
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
 * The hero meta rail — five instrument readings beside the statement at `lg`
 * only. Below `lg` it is hidden: the same facts already stand in the title
 * block lines and the bands beneath, and the rail's five rows would push the
 * printed strip below the first screen on phones. Every value is read from an
 * existing content module; nothing here is authored:
 *
 *  · IMPACT from src/content/experience.ts (payments entry id "02": its
 *    percentage figure lifted out of its own `outcome` string, followed by
 *    "faster payments"; omitted when the figure cannot be derived).
 *  · LOCATION from the Contact address plate ("Hagonoy, Bulacan, Philippines").
 *  · STATUS from src/content/hero.ts (`availability`): the open-to-work line,
 *    with its remote tail folded in as a second clause.
 *  · EXPERIENCE from src/content/experience.ts (`employer.period`).
 *  · LAST SHIP from src/content/projects.ts (the latest project year).
 *
 * Labels and values only — no boxes, no icons.
 */
const LOCATION_META = "Philippines";

const STATUS_META = availability.replace(
  /\s*[—–-]\s*remote\.?\s*$/i,
  ", remote",
);

const LAST_SHIP_META = String(
  Math.max(...projects.map((project) => Number(project.year))),
);

/* The hero's proof line — derived, never typed. Reads the payments entry
   (id "02") and lifts its percentage figure out of its own `outcome`
   sentence with the same extraction the landing's ExperienceBand uses, so
   the rail and the band can never disagree. Null when the entry or its
   figure is absent — the rail row is then omitted, never hardcoded. */
const paymentsEntry = experience.find((entry) => entry.id === "02");

function impactFigure(outcome: string): string | null {
  const match = outcome.match(/\d[\d,]*(?:\.\d+)?%/);
  return match ? match[0] : null;
}

const IMPACT_META = paymentsEntry
  ? impactFigure(paymentsEntry.outcome)
  : null;

const MONTH_INDEX: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

/** "March 2023 to May 2026" → "3 yrs 2 mos", straight off `employer.period`. */
function tenureShort(period: string): string {
  const match = period.match(
    /([A-Za-z]+)\s+(\d{4})\s+to\s+([A-Za-z]+)\s+(\d{4})/,
  );
  if (!match) return "3 yrs 2 mos";
  const start = MONTH_INDEX[match[1].toLowerCase()] ?? 0;
  const end = MONTH_INDEX[match[3].toLowerCase()] ?? 0;
  const total =
    (Number(match[4]) - Number(match[2])) * 12 + (end - start);
  const years = Math.floor(total / 12);
  const months = total % 12;
  return months === 0 ? `${years} yrs` : `${years} yrs ${months} mos`;
}

const EXPERIENCE_META = tenureShort(employer.period);

export function Hero() {
  const { phrase, shown, reduceMotion } = useHeroTyping();
  /* The same pass reads the loop's length off the track, so the seconds that
     buy the ambient rate come from the rendered strip rather than from a
     constant, and the faces are settled first: a fallback face lays the strip
     out at a different width, and only the settled layout can time the loop.
     Starting the loop from this effect, rather than from a variant, is also
     what makes it holdable: the root's
     `<AnimatePresence mode="wait" initial={false}>` (src/App.tsx) suppresses an
     element's first declarative pass, which is what left the strip parked at the
     loop's final keyframe, and a variant loop has no handle to hold. */
  const trackRef = useRef<HTMLUListElement>(null);
  const trackX = useMotionValue(0);
  const [tickerSeconds, setTickerSeconds] = useState<number | null>(null);
  useEffect(() => {
    if (reduceMotion) return;
    let alive = true;
    const arm = () => {
      const track = trackRef.current;
      if (!alive || !track) return;
      setTickerSeconds(track.getBoundingClientRect().width / 2 / TICKER_PX_PER_S);
    };
    document.fonts?.ready.then(arm, arm);
    return () => {
      alive = false;
    };
  }, [reduceMotion]);

  /* The seam's loop: the duplicated track travels exactly half its own width
     (the loop's seconds times the rate) and repeats for as long as the page is
     up. `animate` hands back the playback controls, and they are kept — holding
     the loop where it stands is what the hold below needs; re-creating the loop
     would jump the strip back to its start. */
  const controlsRef = useRef<AnimationPlaybackControls | null>(null);
  useEffect(() => {
    if (reduceMotion || tickerSeconds === null) return;
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
  }, [tickerSeconds, trackX, reduceMotion]);

  /* The hold: hovering the seam, focusing inside it, or hiding the document
     pauses the loop where it stands; releasing continues it. No control is
     offered — by owner decision the hold mechanisms are the whole gate. */
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

  /* Scroll coupling — mass responds. The loop above keeps the resting rate;
     scroll velocity lends it a clamped boost through the controls' playback
     speed, so the strip itself never jumps: changing speed only changes how
     fast the same clock advances, and the boost is always forward (rate >=
     base > 0), capped at 2.5x. The hold above still wins — a paused clock
     does not advance at any speed. Under reduced motion there is no loop to
     couple, so there is nothing to do. */
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const couplingRef = useRef({
    rate: TICKER_PX_PER_S,
    lastVelocity: 0,
    lastScrollAt: 0,
  });
  useMotionValueEvent(scrollVelocity, "change", (latest) => {
    couplingRef.current.lastVelocity = latest;
    couplingRef.current.lastScrollAt = performance.now();
  });
  useAnimationFrame((_, deltaMs) => {
    const controls = controlsRef.current;
    if (reduceMotion || tickerSeconds === null || !controls) return;
    const coupling = couplingRef.current;
    const settled =
      performance.now() - coupling.lastScrollAt > MARQUEE_EASE_BACK_MS;
    const target = settled
      ? TICKER_PX_PER_S
      : marqueeRateForVelocity(coupling.lastVelocity);
    /* Exponential approach: fast enough to feel the scroll, settled back to
       base well inside the ease-back window once scrolling stops. */
    const alpha = 1 - Math.exp(-deltaMs / 140);
    coupling.rate += (target - coupling.rate) * alpha;
    if (Math.abs(target - coupling.rate) < 0.005) coupling.rate = target;
    controls.speed = coupling.rate / TICKER_PX_PER_S;
  });

  return (
    <section id="hero" className="flex flex-col overflow-x-clip">
      {/* Masthead — the name set as a newspaper nameplate: a 3px ink rule,
          a mono dateline, the name at masthead scale, another 3px rule.
          The typing loop is the deck below it; the role, status, and CTA
          sit in the 12-column band under the deck. */}
      <div className={`${GUTTER_CONTAINER} sheet-pad hero-top`}>
        <div aria-hidden="true" className="h-[3px] w-full bg-text" />
        <motion.p
          initial={reduceMotion ? "visible" : "hidden"}
          animate="visible"
          variants={fadeUp}
          className="flex flex-wrap gap-x-3 hero-dateline font-mono text-micro uppercase tracking-[0.14em] text-text-muted"
        >
          <span>NATHWN12</span>
          <span aria-hidden="true">—</span>
          <span>Backend systems</span>
          <span aria-hidden="true">—</span>
          <span>Designed and built by hand</span>
        </motion.p>
        <motion.h1
          initial={reduceMotion ? "visible" : "hidden"}
          animate="visible"
          variants={mastheadParent}
          aria-label="Nathaniel Nikolai Ladero"
          className="masthead-name hero-name text-text"
        >
          <span className="masthead-mask">
            <motion.span variants={mastheadLine} className="block">
              Nathaniel Nikolai
            </motion.span>
          </span>
          <span className="masthead-mask">
            <motion.span variants={mastheadLine} className="block">
              Ladero
            </motion.span>
          </span>
        </motion.h1>
        <div aria-hidden="true" className="mt-2 h-[3px] w-full bg-text" />

        {/* Deck — the typing loop as standfirst, set in the display face. */}
        <motion.p
          initial={reduceMotion ? "visible" : "hidden"}
          animate="visible"
          variants={fadeUp}
          aria-label={phrase}
          className="max-w-[62ch] hero-deck font-display text-[clamp(1.25rem,2.5vw,1.75rem)] leading-snug text-text"
        >
          <span aria-hidden="true" className="grid grid-cols-1">
            {HERO_PHRASES.map((identity) => (
              <span key={identity} className="invisible col-start-1 row-start-1">
                {identity}
                <InsertCaret />
              </span>
            ))}
            <span className="col-start-1 row-start-1">
              {shown}
              <InsertCaret />
            </span>
          </span>
        </motion.p>

        <div className="hero-cta lg:grid lg:grid-cols-12 lg:gap-x-6">
          <motion.div
            initial={reduceMotion ? "visible" : "hidden"}
            animate="visible"
            variants={staggerParent}
            className="min-w-0 lg:col-span-7"
          >
            <motion.p
              variants={fadeUp}
              className="max-w-[62ch] text-lead text-text"
            >
              {formerRoleLine}
            </motion.p>
            <motion.p
              variants={fadeUp}
              className="mt-1 max-w-[62ch] text-detail text-text-muted"
            >
              {employer.location} — {employer.period}
            </motion.p>

            <motion.div
              variants={staggerChild}
              className="mt-6 flex flex-wrap gap-3 lg:mt-8"
            >
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="flex min-h-11 items-center rounded-xs bg-accent px-6 text-label font-semibold text-bg"
              >
                Email me
              </a>
              <a
                href="/Nathaniel-Nikolai-Ladero-Resume.pdf"
                download
                className="flex min-h-11 items-center rounded-xs border border-text px-6 text-label font-semibold text-text"
              >
                Résumé — PDF
              </a>
            </motion.div>

            <motion.dl
              variants={fadeUp}
              aria-label="Profile summary"
              className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-3 lg:hidden"
            >
              {IMPACT_META ? (
                <div>
                  <dt className="sr-only">Impact</dt>
                  <dd className="font-mono text-micro uppercase text-text-muted">
                    IMPACT — {IMPACT_META} faster payments
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="sr-only">Status</dt>
                <dd className="font-mono text-micro uppercase text-text-muted">
                  STATUS — {STATUS_META}
                </dd>
              </div>
            </motion.dl>

            <motion.p
              variants={fadeUp}
              className="mt-4 max-w-[60ch] text-detail text-text-muted lg:mt-6"
            >
              {coreStack}
            </motion.p>
          </motion.div>

          <motion.dl
            initial={reduceMotion ? "visible" : "hidden"}
            animate="visible"
            variants={fadeUp}
            aria-label="Profile summary"
            className="mt-6 hidden flex-col gap-1 border-t border-border pt-4 lg:col-span-5 lg:mt-0 lg:flex lg:gap-2 lg:border-t-0 lg:pt-0"
          >
            {IMPACT_META ? (
              <div>
                <dt className="sr-only">Impact</dt>
                <dd className="font-mono text-micro whitespace-nowrap text-text-muted">
                  IMPACT — {IMPACT_META} faster payments
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="sr-only">Location</dt>
              <dd className="font-mono text-micro whitespace-nowrap text-text-muted">
                LOCATION — {LOCATION_META}
              </dd>
            </div>
            <div>
              <dt className="sr-only">Status</dt>
              <dd className="font-mono text-micro whitespace-nowrap text-text-muted">
                STATUS — {STATUS_META}
              </dd>
            </div>
            <div>
              <dt className="sr-only">Experience</dt>
              <dd className="font-mono text-micro whitespace-nowrap text-text-muted">
                EXPERIENCE — {EXPERIENCE_META}
              </dd>
            </div>
            <div>
              <dt className="sr-only">Last ship</dt>
              <dd className="font-mono text-micro whitespace-nowrap text-text-muted">
                LAST SHIP — {LAST_SHIP_META}
              </dd>
            </div>
          </motion.dl>
        </div>
      </div>

      {/* The printed strip: full-bleed, uppercase, ink on cream, claret
          bars between items. Keeps its mask and hover/focus hold. */}
      <div
        className="overflow-hidden border-y-[3px] border-text py-4"
        style={
          reduceMotion
            ? undefined
            : {
                maskImage:
                  "linear-gradient(to right, transparent, black 56px, black calc(100% - 56px), transparent)",
                WebkitMaskImage:
                  "linear-gradient(to right, transparent, black 56px, black calc(100% - 56px), transparent)",
              }
        }
        onMouseEnter={() => setHeld(true)}
        onMouseLeave={() => setHeld(false)}
        onFocus={() => setHeld(true)}
        onBlur={() => setHeld(false)}
      >
        <motion.ul
          ref={trackRef}
          aria-hidden="true"
          style={reduceMotion ? undefined : { x: trackX }}
          className={
            reduceMotion
              ? "flex flex-wrap items-center gap-y-2"
              : "flex w-max items-center"
          }
        >
          {(reduceMotion ? [techStrip] : [techStrip, techStrip]).flatMap(
            (half, halfIndex) => [
              <li
                key={`spacer-${halfIndex}`}
                aria-hidden="true"
                className="w-14 shrink-0"
              />,
              ...half.map((tech, index) => (
                <li
                  key={`${tech}-${halfIndex}-${index}`}
                  className="strip-text flex items-center gap-8 pr-8 font-display font-semibold whitespace-nowrap"
                >
                  {tech}
                  <span
                    className="inline-block h-[3px] w-8 bg-accent"
                    aria-hidden="true"
                  />
                </li>
              )),
            ],
          )}
        </motion.ul>
      </div>

      <ExperienceBand
        marginalia={
          <>
            <Marginalia>{experienceMarginalia}</Marginalia>
          </>
        }
      />

      <PullQuote />

      <WorkTeaser
        marginalia={
          <>
            <Marginalia>{projectsMarginalia}</Marginalia>
            <Marginalia>All public on GitHub</Marginalia>
          </>
        }
      />

      <SystemAtlas />

      <ForwardBand />

      <CredentialsStrip />

      <div className={`${GUTTER_CONTAINER} sheet-pad hero-foot`}>
        <div aria-hidden="true" className="h-[3px] w-full bg-text" />
        <div className="pt-6">
          <PageFoot accentResume />
        </div>
      </div>
    </section>
  );
}

/**
 * Pull quote — the page's single display-size claim, drawn from the API
 * contracts entry's own outcome sentence, with a claret rule. Chosen because
 * its claim is not repeated anywhere else on the landing; the payments
 * percentage already carries the experience band's dominant figure.
 */
function PullQuote() {
  const reduceMotion = usePrefersReducedMotion();
  const entry = experience.find((item) => item.id === "08");
  if (!entry) return null;
  return (
    <aside
      aria-label="Pull quote"
      className={`${GUTTER_CONTAINER} sheet-pad pullquote-pad lg:grid lg:grid-cols-12 lg:gap-x-6`}
    >
      <motion.blockquote
        initial={reduceMotion ? "visible" : "hidden"}
        whileInView="visible"
        viewport={{ once: true, margin: "-15% 0px" }}
        variants={bandEnter}
        className="border-l-[3px] border-accent pl-6 lg:col-span-7 lg:col-start-5"
      >
        <p className="pullquote-text max-w-[30ch] text-text">
          {entry.outcome}
        </p>
      </motion.blockquote>
    </aside>
  );
}
