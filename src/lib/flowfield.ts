/**
 * The hero field — a flow field, as arithmetic.
 *
 * No DOM lives here on purpose: the canvas in `HeroField.tsx` is a painter, and
 * everything that decides where a particle goes is this module. That keeps the
 * one thing that can be wrong about decoration — the simulation — testable
 * without a browser (tests/hero-field.test.ts).
 *
 * The field is a velocity that is a function of position and time: two sine
 * waves per axis, which is enough to read as plasma and costs no noise table.
 * The pointer bends it tangentially inside one radius (so the page reacts where
 * the hand is, not everywhere), and scroll velocity leans the whole field, so
 * moving fast through the page makes the current run.
 *
 * Determinism is a feature, not a nicety: the reduced-motion frame and the live
 * loop's first frame are drawn from the same seed, so the still picture is the
 * same picture the animation starts from.
 */

export interface Particle {
  x: number;
  y: number;
  /** 0 = `--rec-signal`, 1 = `--rec-measure`. Two accents, never a third. */
  band: 0 | 1;
}

export interface Field {
  width: number;
  height: number;
  particles: Particle[];
  /** Seconds of simulated time. Never the wall clock. */
  time: number;
}

export interface FieldInput {
  /** Seconds since the last step. The caller clamps it. */
  dt: number;
  /** Pointer position in canvas space, or `null` when it has left. */
  pointer: { x: number; y: number } | null;
  /** Scroll velocity in px per frame, positive downward. */
  scroll: number;
}

/** The rolling-average frame time above which the field drops a tier. */
export const FRAME_BUDGET_MS = 22;

/** The sustained frame time below which it may step back up a tier. */
export const UPGRADE_MS = 12;

/** The least time between two tier switches, so the field cannot oscillate. */
export const COOLDOWN_MS = 2000;

/**
 * The tiers, cheapest last: fewer particles first, then the backing buffer's
 * DPR, then fewer again. Both columns only ever fall as the index rises, so a
 * drop is always a real drop and a step up is always a real saving.
 */
export interface Tier {
  /** Particles in the field. */
  count: number;
  /** The cap on `devicePixelRatio` for the backing buffer. */
  dpr: number;
}

export const TIERS: readonly Tier[] = [
  { count: 1500, dpr: 2 },
  { count: 1050, dpr: 2 },
  { count: 720, dpr: 2 },
  { count: 720, dpr: 1.5 },
  { count: 520, dpr: 1.5 },
  { count: 520, dpr: 1 },
  { count: 360, dpr: 1 },
];

/** The pointer's reach, in px. Outside it a particle is untouched. */
const REACH = 260;
const REACH_SQ = REACH * REACH;

/** Base travel, px per second. Slow: the field is a current, not a snowstorm. */
const SPEED = 26;

/** mulberry32 — 32 bits of state, deterministic, and fast enough for thousands
 *  of resets a second if a resize ever asks for one. */
function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createField(
  width: number,
  height: number,
  count: number,
  seed = 0x9e3779b9,
): Field {
  const rand = random(seed);
  const particles: Particle[] = [];
  for (let index = 0; index < count; index += 1) {
    particles.push({
      x: rand() * width,
      y: rand() * height,
      band: rand() < 0.68 ? 0 : 1,
    });
  }
  return { width, height, particles, time: 0 };
}

/** One step of the current. Wraps at the edges, so the field has no corners. */
export function stepField(field: Field, input: FieldInput): void {
  const { dt, pointer, scroll } = input;
  const time = field.time + dt;
  const { width, height } = field;

  for (const particle of field.particles) {
    const nx = particle.x / width;
    const ny = particle.y / height;

    let vx =
      Math.cos(ny * 6.2 + time * 0.22) +
      Math.cos((nx + ny) * 4.1 - time * 0.13) * 0.6;
    let vy =
      Math.sin(nx * 5.4 - time * 0.19) +
      Math.sin((nx - ny) * 3.3 + time * 0.11) * 0.6;

    if (pointer) {
      const dx = particle.x - pointer.x;
      const dy = particle.y - pointer.y;
      const distanceSq = dx * dx + dy * dy;
      if (distanceSq < REACH_SQ) {
        /* Tangential, falling off to nothing at the rim: the current curls
           around the hand instead of piling onto it. */
        const falloff = 1 - distanceSq / REACH_SQ;
        const distance = Math.sqrt(distanceSq) || 1;
        vx += (-dy / distance) * falloff * 3.4;
        vy += (dx / distance) * falloff * 3.4;
      }
    }

    vy += scroll * 0.02;

    particle.x = (((particle.x + vx * SPEED * dt) % width) + width) % width;
    particle.y = (((particle.y + vy * SPEED * dt) % height) + height) % height;
  }

  field.time = time;
}

/**
 * The tier for the next window.
 *
 * Down immediately, up slowly: a field that is over budget is corrected on the
 * next evaluation, and a field that is comfortably inside it is only promoted
 * after two full seconds at the faster rate. The cooldown is the anti-oscillation
 * guarantee — without it a page hovering on the threshold would flip tiers every
 * half second, which is worse than either tier.
 */
export function nextTier(
  index: number,
  rollingFrameMs: number,
  sinceSwitchMs: number,
): number {
  if (rollingFrameMs > FRAME_BUDGET_MS && index < TIERS.length - 1) {
    return index + 1;
  }
  if (
    rollingFrameMs < UPGRADE_MS &&
    sinceSwitchMs >= COOLDOWN_MS &&
    index > 0
  ) {
    return index - 1;
  }
  return index;
}
