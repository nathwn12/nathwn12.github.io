import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { fadeUp } from "../lib/motion";
import { BandShell } from "./InstrumentBand";

/**
 * SystemAtlas — the landing's living system diagram.
 *
 * Production services on the left, the agent tooling on the right in two headed
 * clusters (the private, zero-retention agents first, then the local,
 * on-machine ones), joined by six individual links: each one leaves a
 * production card's right edge and lands on a tooling card's left edge, so the
 * curves cross in the channel between the two sides. The web is the story — a
 * change leaves a named service and reaches a named agent, and each agent is
 * wired to the work it actually takes. Selecting a node updates the reading
 * beside the diagram (below it under `lg`). Every label and sentence is grounded in the delivered record
 * (src/content/experience.ts, src/content/projects.ts, src/content/skills.ts) —
 * generic capability phrasing, no metric claimed that the record does not
 * already carry.
 *
 * Owner verdict 2026-10-14 (reduce): eleven nodes, two levels fewer than the
 * fourteen the atlas opened with — a title-only rail, a prompt-library shelf and
 * an MCP-server shelf were cut, and four of the drawn pairs with them, because
 * the diagram had over-expanded into inventory. Six links remain and every one
 * of the eleven nodes is an end of one: no orphan, and no card left as
 * decoration.
 *
 * Alignment (owner brief 2026-10-14): two clean columns and one crisp channel
 * between them. Every production card's RIGHT edge sits on the single vertical
 * `LEFT_COL_RIGHT`; every tooling card's LEFT edge sits on a single vertical per
 * cluster — `RIGHT_COL_LEFT` and `RIGHT_COL_LEFT_LOCAL`, the two clusters
 * staggered the group offset apart — and the pitch inside each cluster is
 * uniform. No card carries a per-node x offset or jitter: the sophistication is
 * the rhythm and the exact edge, and scatter is rejected outright. The one
 * deliberate variation left is horizontal — a card's width follows its label
 * (`cardWidth`), so the two shared edges stay exact while the widths differ.
 *
 * Balanced columns (owner verdict 2026-10-14). Five production cards against a
 * tooling column of two three-card boxes: at the clusters' own `PITCH` the
 * production column would end 188u short of the tooling box, leaving dead paper
 * in the lower left. So the production column does not use the cluster pitch —
 * it takes the tooling column's whole span (`TOOLING_SPAN`) and shares it evenly
 * across its four gaps (`PRODUCTION_PITCH`). Both columns therefore open at
 * `HEADING_BAND` and close on the same line (`DIAGRAM_BOTTOM`): level at the
 * top, level at the bottom, no leftover. The clusters keep their own uniform
 * pitch, so a cluster still reads as one group of cards 24u apart.
 *
 * Hierarchy without scatter: the two hero cards (`Gateway API` on the left,
 * `Adversarial agent loop` on the right) render one width step wider
 * (`HERO_W_EXTRA`), carry the accent stroke, and set their label one weight
 * heavier; the height is `CARD_H` for every card, hero included, so no box reads
 * bloated. Every non-hero card is a hairline `border` in muted `text`. The
 * tooling clusters sit in enclosing boxes with `BOX_PAD` of padding and a
 * hairline border, each headed by its label `HEADING_GAP` above the box with
 * clear space on both sides of it.
 *
 * Scale (owner verdict 2026-10-14, 1:1): one user unit is one rendered pixel. The
 * drawing is laid out in `VIEW_W` (666) × `VIEW_H` units and the plate renders it
 * at the page's own measure — 665.84px at a 1440 viewport — so the scale is 0.9998
 * and a 64-unit card is 63.98px on screen, a 14-unit label 14.0px. Card widths are
 * content-fit and clamped: the narrowest card is `CARD_W_MIN` × `CARD_H`
 * (170 × 64 units), the widest 195 × 64.
 *
 * Frame (defect 2026-10-14). A resize used to take the LOCAL cluster box's right
 * border away, and the PRIVATE box and the production column's left edge were one
 * step from the same: the local box ran flush to the viewBox's right edge (its
 * hairline centred on 666) and the `Gateway API` hero's left edge ran flush to 0,
 * so half of each stroke fell outside the viewBox — and whether the border
 * survived depended on where the plate's sub-pixel boundary landed, which moves
 * with the window. Both columns are now held `FRAME_CLEAR` (3u) inside the frame
 * with the stroke counted, the heading band is lifted clear of the top edge, and
 * the margin is asserted at the module as well as measured in the browser, so no
 * drawn edge can sit on the frame at any width.
 *
 * Plate (owner verdict 2026-10-14): the plate IS the page's measure and the drawing
 * is drawn to it, not shrunk into it. The 1040-unit drawing the atlas first shipped
 * was wider than every text element on the page, which read as out of place on a
 * full-wide monitor; capping THAT drawing to the measure would have scaled it
 * 0.640x and dropped card labels to 8.96px, under the site's 13px floor (a 980px
 * cap fails the same way at 11.8px). So the geometry was redrawn at the measure
 * instead: `VIEW_W` (666) is the page measure in pixels, the two columns and the
 * channel are laid out to fill it, and the plate fills the band's content
 * column rather than a copy of the number that can drift. Heading, lede,
 * rule, diagram and reading then share one left edge — the content column's — and the drawing's
 * frame sits just inside the plate's, so the atlas is a plate set into the page
 * rather than a diagram floating past every text section. The section heading's
 * measure is deliberately NOT widened to match — the prose keeps the page's 68ch —
 * because the plate is the period, not a full-bleed.
 *
 * Motion: the diagram always animates (owner order 2026-10-14, see
 * src/lib/motionPreference.ts). There is no motion gate here — the entrance
 * walks in on scroll and the pulses always render, so there is no state in
 * which the atlas is left standing still.
 *
 * The pulse travel is armed on a post-mount pass (`travelling`) because the app
 * root wraps every page in `<AnimatePresence mode="wait" initial={false}>`
 * (src/App.tsx). With that flag Framer suppresses a motion element's *first*
 * animation pass and, for a keyframe array, seeds the initial render with the
 * LAST keyframe (framer-motion `motion/utils/use-visual-state.mjs`), while
 * `render/utils/animation-state.mjs` drops the animation itself for that pass.
 * The pulses would therefore be painted at one end of the loop — a stub at a
 * path end — and, with no later pass, would never travel. So the travel
 * keyframes only enter the tree on the pass after mount: the flip creates the
 * loop, and the pulses are moving continuously from the first painted frame
 * that follows.
 *
 * The travelling pulse marks a change moving through the loop. It is not
 * decoration.
 *
 * Responsive: eleven nodes squeezed into a phone viewport are illegible, so the
 * diagram keeps its two-dimensional form from 768px up and becomes the same
 * nodes stacked in visual order below it (production first, then the two
 * tooling clusters). Nothing is hidden and nothing is dropped.
 *
 * Accessibility: the section is labelled by its heading; the nodes are a
 * labelled group of aria-pressed toggle buttons (a group, not a radiogroup: the
 * controls are buttons and nothing here owns radio semantics or a roving
 * tabindex); the reading updates through an aria-live region.
 *
 * Authority: docs/premium-direction.md § Principles 4–5, § Hard-ban list.
 */

interface AtlasNode {
  /** Stable id, never rendered. */
  readonly id: string;
  /** Node label, sentence case. */
  readonly label: string;
  /** One sentence of grounded detail. */
  readonly detail: string;
  /** Node centre in viewBox units. */
  readonly x: number;
  readonly y: number;
  /** Renders one width step wider, with the accent stroke and a heavier label. */
  readonly hero?: boolean;
}

/** A node before its column places it: the column edge fixes `x`. */
type AtlasNodeSeed = Omit<AtlasNode, "x">;

/** One link: the production node the curve leaves and the tooling node it
    reaches, plus the cubic drawn between their card edges. */
interface AtlasLink {
  /** Node id the curve leaves — the production side. */
  readonly from: string;
  /** Node id the curve reaches — the tooling side. */
  readonly to: string;
  /** Cubic path in viewBox units. */
  readonly d: string;
}

/** One tooling cluster: its enclosing box, the heading above that box, and the
    nodes inside it. */
interface AtlasCluster {
  readonly id: string;
  readonly heading: string;
  /** The enclosing box in viewBox units — the cards plus `BOX_PAD`. */
  readonly box: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
  /** The cluster's nodes, in reading order. */
  readonly nodes: readonly AtlasNode[];
}

/** The drawing's width in user units — the page's own measure in pixels
    (`68ch` = 665.84px at a 1440 viewport, measured), so 1u = 1px and no part of
    the drawing is scaled. The whole geometry above is laid out to fill it. */
const VIEW_W = 666;

/**
 * The plate's cap: the band content column's own measure — the plate fills
 * the content column, so the drawing sits in it at ~1:1 with no separate
 * cap to drift (previously `min(980px, 68ch)`, measured 665.84px at a 1440
 * viewport, 2026-10-14; the content column carries that same 68ch now).
 */

/** The plate's framing: the page's 1px Line hairline opens the plate, 40px above
    the drawing — the same step either side, so the plate is framed evenly
    inside the section's unchanged rhythm. The legend and the selected-node
    reading sit beside the diagram at `lg` and stack below it under. */
const PLATE_ABOVE = "mt-10 border-t border-border pt-10";

/** A card: one uniform height for every card — hero included — and a width that
    follows its label. `CARD_PAD_X` is the breathing room either side of the
    label, and the fit is clamped so a short label still gets a card that reads
    as a box rather than a chip. At the plate's own width the clamp is 170–195u,
    and every label keeps at least 18.9u of clearance either side of its card
    (measured at 1440). */
const CARD_H = 64;
const CARD_PAD_X = 18;
const CARD_W_MIN = 170;
const CARD_W_MAX = 195;
/** The estimated advance of one character at the card's 14px label — the fit's
    only input, since the width is computed before any label is laid out. Measured
    against Public Sans at 14px in the browser, 7.2 sits above every label's real
    advance (the worst is `Local model workflows` at 150.11u for 21 characters =
    7.15/char), so the estimate never under-fits a label. */
const EST_CHAR_W = 7.2;

/** A hero card is one step wider, never taller: the hierarchy is the accent
    stroke and the heavier label, and the width step stays inside `HERO_W_MAX`. */
const HERO_W_EXTRA = 18;
const HERO_W_MAX = 195;

/** The frame: no ink is drawn closer than `FRAME_CLEAR` to the viewBox edge, the
    stroke included, at any window width. A box that ran flush to the frame had
    its border land on the frame's own sub-pixel boundary, so the border appeared
    or disappeared as the plate changed width — the resize defect this holds off.
    `SELECTED_STROKE` is the thickest stroke the drawing paints (a selected
    card's), so a card's edge keeps `FRAME_CLEAR` plus its own stroke's outer
    half, and a cluster box's hairline half of that. */
const FRAME_CLEAR = 3;
const SELECTED_STROKE = 2;

/** The one vertical each column's cards share, held in from the plate's edges so
    nothing paints on the frame (see {@link FRAME_CLEAR}). At the 666-unit plate
    the production column's widest card is the `Gateway API` hero (188u): its left
    edge sits 4 — `FRAME_CLEAR` plus the selected stroke's outer half — so
    `LEFT_COL_RIGHT` is 192, and the column's heading starts on that same 4. The
    private cluster's cards open on 431: a 239-unit channel between the columns,
    36% of the plate, with every curve in it. The local cluster's cards open one
    16u stagger to the right (447) and its widest is the `Adversarial agent loop`
    hero at 195u, so its box runs 427 to 662 — 3.5u of clear paper inside the
    frame's right edge, where it once ran flush to 666 and the box's own right
    border was half-clipped away. */
const LEFT_COL_RIGHT = 192;
const RIGHT_COL_LEFT = 431;
/** The local cluster's shared left edge — the group stagger off the private
    one, so the two boxes read as two groups rather than one ragged column. */
const RIGHT_COL_LEFT_LOCAL = 447;

/** Cluster pitch: uniform inside both tooling clusters — a card is `CARD_H`
    tall with a 24u gap, so consecutive cluster cards sit `PITCH` apart. */
const PITCH = 88;

/** The cluster boxes: padding around the cards inside them, and the height a box
    around `CLUSTER_CARDS` pitched cards works out to. */
const BOX_PAD = 20;
const BOX_RADIUS = 12;
const CLUSTER_CARDS = 3;
const BOX_H = (CLUSTER_CARDS - 1) * PITCH + CARD_H + 2 * BOX_PAD;

/** The gap between the two cluster boxes — the channel that keeps the two groups
    reading as two groups. */
const CLUSTER_GAP = 44;

/** The heading band: a cluster label's baseline sits `HEADING_GAP` above its box
    and `HEADING_LIFT` of clear space holds the 11px uppercase glyph above it.
    The glyph's em box ascends 10u above its baseline (measured in the browser at
    11px), so `HEADING_LIFT` is 13: the band's top keeps the frame's own
    `FRAME_CLEAR` — at the 10 it first shipped with, the em box sat flush on the
    viewBox's top edge. */
const HEADING_GAP = 14;
const HEADING_LIFT = 13;
const HEADING_BAND = HEADING_GAP + HEADING_LIFT;
/** The production heading's baseline, level with the cluster headings. */
const HEADING_Y = HEADING_LIFT;

/** The tooling column's whole span: both boxes and the gap between them. */
const TOOLING_SPAN = 2 * BOX_H + CLUSTER_GAP;
/** Where the drawing ends — the tooling column's bottom edge, which the
    production column's last card shares. `HEADING_BAND` of clear paper is left
    below it, mirroring the band the headings occupy above the two columns. */
const DIAGRAM_BOTTOM = HEADING_BAND + TOOLING_SPAN;
const VIEW_H = DIAGRAM_BOTTOM + HEADING_BAND;

/** The production column's pitch: `PRODUCTION_CARDS` cards sharing the tooling
    column's span evenly, so the two columns start and end on the same lines. */
const PRODUCTION_CARDS = 5;
const PRODUCTION_PITCH = (TOOLING_SPAN - CARD_H) / (PRODUCTION_CARDS - 1);

/** Where each column's first card sits, and so where its top edge is: the
    production column's first card is level with the private cluster's box top,
    and the local cluster's first card is one box plus `CLUSTER_GAP` below it. */
const PRODUCTION_TOP = HEADING_BAND + CARD_H / 2;
const ZDR_TOP = HEADING_BAND + BOX_PAD + CARD_H / 2;
const LOCAL_TOP = HEADING_BAND + BOX_H + CLUSTER_GAP + BOX_PAD + CARD_H / 2;

/**
 * Geometry invariants. Each one was a measured defect, so they move together:
 *
 *  · A card's width follows its label (`cardWidth`), so widths differ while the
 *    column edges stay exact: every production card's right edge is
 *    `LEFT_COL_RIGHT`, every private card's left edge is `RIGHT_COL_LEFT`, and
 *    every local card's left edge is `RIGHT_COL_LEFT_LOCAL`.
 *  · The channel between the columns runs from the production column's right edge
 *    (192) out to the private column at 431 and to the local column at 447, and
 *    every link lives entirely inside it: it
 *    starts on a production card's right edge and ends on a tooling card's left
 *    edge, both at the card's vertical centre. No card's edge crosses that band,
 *    so no curve can pass through a card. A curve reaches `reach` of the span
 *    before it turns, and `reach` stays at or under 0.5, which keeps every curve
 *    monotone in x.
 *  · The frame is clear: every painted box, stroke included, keeps `FRAME_CLEAR`
 *    (3u) of paper inside the viewBox, and the heading band keeps it above the
 *    top edge — so no border can land on the frame's own sub-pixel boundary and
 *    vanish as the window resizes. The margin is asserted below, not assumed.
 *  · The two columns are level: both open at `HEADING_BAND` and both close on
 *    `DIAGRAM_BOTTOM`. The production column takes `PRODUCTION_PITCH` — the
 *    tooling span shared evenly across its four gaps — precisely so the five
 *    production cards against six tooling cards in two boxes cannot leave dead
 *    paper in the lower left.
 *  · Inside a cluster the pitch is uniform — one `CARD_H` plus 24u — so the gaps
 *    are too: the cluster cards sit 24u apart and the two boxes `CLUSTER_GAP`
 *    (44u) apart. The boxes' own gap is nearly twice the inside gap, so a cluster
 *    reads as one group and the two clusters read as two.
 *  · Each cluster heading owns a band with no card in it: its baseline sits
 *    `HEADING_GAP` above its box, and the box holds `BOX_PAD` of clear space above
 *    the first card, so no label can touch a card or its own box edge.
 *  · The crossings are deliberate and counted: three, one station each down the
 *    channel. `identity → investigation` leaves the fourth production card and
 *    rises to the middle of the private cluster, crossing `cash → evals`,
 *    `payments → adversarial` and `gateway → docs` in turn, so the three crossings
 *    fall at three separated stations — low, middle and high in the channel —
 *    instead of stacking into one X. The per-pair `reach` is what holds them apart.
 */

/** A card's width: its label's fit, clamped, plus the hero's one width step. */
function cardWidth(node: Pick<AtlasNode, "label" | "hero">): number {
  const fit = Math.min(
    Math.max(node.label.length * EST_CHAR_W + 2 * CARD_PAD_X, CARD_W_MIN),
    CARD_W_MAX,
  );
  return node.hero ? Math.min(fit + HERO_W_EXTRA, HERO_W_MAX) : fit;
}

/** The production column: every card's right edge sits on `right`. */
function anchorRight(
  seeds: readonly AtlasNodeSeed[],
  right: number,
): readonly AtlasNode[] {
  return seeds.map((seed) => ({ ...seed, x: right - cardWidth(seed) / 2 }));
}

/** A tooling cluster: every card's left edge sits on `left`. */
function anchorLeft(
  seeds: readonly AtlasNodeSeed[],
  left: number,
): readonly AtlasNode[] {
  return seeds.map((seed) => ({ ...seed, x: left + cardWidth(seed) / 2 }));
}

/** The box around a cluster: the cards plus the padding. */
function boxAround(nodes: readonly AtlasNode[]): AtlasCluster["box"] {
  const left =
    Math.min(...nodes.map((node) => node.x - cardWidth(node) / 2)) - BOX_PAD;
  const right =
    Math.max(...nodes.map((node) => node.x + cardWidth(node) / 2)) + BOX_PAD;
  const top = Math.min(...nodes.map((node) => node.y)) - CARD_H / 2 - BOX_PAD;
  const bottom = Math.max(...nodes.map((node) => node.y)) + CARD_H / 2 + BOX_PAD;
  return { x: left, y: top, width: right - left, height: bottom - top };
}

/**
 * The real backend surface: C#/.NET fintech services. Five nodes, each traceable
 * to the delivered record — see the `detail` sentences for the claims.
 *
 * Position is the column, not jitter: every card shares one right edge
 * (`LEFT_COL_RIGHT`), and y walks the request path in uniform
 * `PRODUCTION_PITCH` steps (edge → money → ledger → identity → data). The first
 * card is the hero, so the column's top edge is the hero's, and the last card's
 * bottom edge is the tooling column's.
 */
const productionNodes: readonly AtlasNode[] = anchorRight(
  [
    {
      id: "gateway",
      label: "Gateway API",
      detail:
        "ASP.NET Web APIs with versioned contracts and an additive-only compatibility policy, so downstream services upgraded without a coordinated release.",
      hero: true,
      y: PRODUCTION_TOP,
    },
    {
      id: "payments",
      label: "Payment services",
      detail:
        "Payment services on AWS: the slow query path profiled and the provider replaced so the worst-case call stopped being the bottleneck.",
      y: PRODUCTION_TOP + PRODUCTION_PITCH,
    },
    {
      id: "cash",
      label: "Cash management",
      detail:
        "Cash-management endpoints over EF Core and Dapper with Redis caching on the hot reads, and cache invalidation kept explicit on write.",
      y: PRODUCTION_TOP + 2 * PRODUCTION_PITCH,
    },
    {
      id: "identity",
      label: "Identity & access",
      detail:
        "JWT, OAuth 2.0, and OpenID Connect with RBAC and ABAC, authorizing in one place so a policy change shipped once, not per endpoint.",
      y: PRODUCTION_TOP + 3 * PRODUCTION_PITCH,
    },
    {
      id: "data",
      label: "Data & messaging",
      detail:
        "EF Core and Dapper data layers for high-throughput financial transactions, with Redis caching and RabbitMQ messaging across services.",
      y: PRODUCTION_TOP + 4 * PRODUCTION_PITCH,
    },
  ],
  LEFT_COL_RIGHT,
);

/**
 * The two tooling clusters — the owner's own split: private agents paired with
 * local ones. Each shares one left edge and one uniform pitch, and the local
 * cluster is staggered the group offset off the private one.
 *
 * The local cluster leads with its hero card: `Adversarial agent loop` sits above
 * `Prompt evaluation`, which is what keeps `payments → adversarial` from crossing
 * `cash → evals` while `identity → investigation` is already crossing both. Three
 * crossings, three stations; the other order stacks them into one knot.
 */
const zdrNodes: readonly AtlasNode[] = anchorLeft(
  [
    {
      id: "review",
      label: "AI code review",
      detail:
        "Reviews run on-machine against the changed code, with the review notes written once so the same comment does not have to be made twice.",
      y: ZDR_TOP,
    },
    {
      id: "investigation",
      label: "Investigative agents",
      detail:
        "Agent workflows read unfamiliar repositories to answer a question — tracing a behaviour to its cause instead of guessing at it.",
      y: ZDR_TOP + PITCH,
    },
    {
      id: "docs",
      label: "Agent-assisted docs",
      detail:
        "Agent workflows draft the notes and runbooks that travel with a change, so the written record ships beside the code.",
      y: ZDR_TOP + 2 * PITCH,
    },
  ],
  RIGHT_COL_LEFT,
);

const localNodes: readonly AtlasNode[] = anchorLeft(
  [
    {
      id: "adversarial",
      label: "Adversarial agent loop",
      detail:
        "One agent challenges behaviour while another repairs it, re-challenging until the findings stop moving.",
      hero: true,
      y: LOCAL_TOP,
    },
    {
      id: "evals",
      label: "Prompt evaluation",
      detail:
        "Prompts are checked before they are trusted: the output is compared against the real repository, not assumed from a good-looking sample.",
      y: LOCAL_TOP + PITCH,
    },
    {
      id: "local-models",
      label: "Local model workflows",
      detail:
        "Local models through LM Studio and OpenCode handle investigation and refactoring with no network round trip, keeping prompts and code off hosted services.",
      y: LOCAL_TOP + 2 * PITCH,
    },
  ],
  RIGHT_COL_LEFT_LOCAL,
);

const clusters: readonly AtlasCluster[] = [
  {
    id: "zdr",
    heading: "Private agents",
    box: boxAround(zdrNodes),
    nodes: zdrNodes,
  },
  {
    id: "local",
    heading: "Local agents",
    box: boxAround(localNodes),
    nodes: localNodes,
  },
];

const nodes: readonly AtlasNode[] = [
  ...productionNodes,
  ...zdrNodes,
  ...localNodes,
];

/**
 * The frame invariant: every box the drawing paints, its stroke included, keeps
 * `FRAME_CLEAR` of paper inside the viewBox. It is what the resize defect broke —
 * a box flush to the frame has its border land on the frame's own sub-pixel
 * boundary — so geometry that breaks it fails here, at the module, rather than
 * on screen at one window width and not another.
 *
 * It is one check over ink edges, so both frames the atlas paints in go through
 * it: the diagram's `VIEW_W` × `VIEW_H` below, and the stacked rail's own 16 × 48
 * box (see {@link RAIL_INSET}), where the required clearance is 0 — there a
 * round cap must reach the edge to keep the rail's full length.
 */
function assertInkInsideFrame(
  what: string,
  frame: { width: number; height: number },
  ink: readonly {
    left: number;
    top: number;
    right: number;
    bottom: number;
  }[],
  required: number,
): void {
  for (const box of ink) {
    const clear = Math.min(
      box.left,
      box.top,
      frame.width - box.right,
      frame.height - box.bottom,
    );
    if (clear < required) {
      throw new Error(
        `${what} leaves ${clear}u inside the frame; ${required}u is required`,
      );
    }
  }
}

const paintedBoxes: readonly {
  x: number;
  y: number;
  width: number;
  height: number;
  stroke: number;
}[] = [
  ...clusters.map((cluster) => ({ ...cluster.box, stroke: 1 })),
  ...nodes.map((node) => ({
    x: node.x - cardWidth(node) / 2,
    y: node.y - CARD_H / 2,
    width: cardWidth(node),
    height: CARD_H,
    stroke: SELECTED_STROKE,
  })),
];

assertInkInsideFrame(
  "atlas geometry",
  { width: VIEW_W, height: VIEW_H },
  paintedBoxes.map((box) => ({
    left: box.x - box.stroke / 2,
    top: box.y - box.stroke / 2,
    right: box.x + box.width + box.stroke / 2,
    bottom: box.y + box.height + box.stroke / 2,
  })),
  FRAME_CLEAR,
);

/** The production column's leading edge — its widest card's left edge, which is
    where its heading starts. */
const LEFT_COL_LEFT = Math.min(
  ...productionNodes.map((node) => node.x - cardWidth(node) / 2),
);

/** One stacked node chip, below the breakpoint: the same node, legible width. */
const stackChip =
  "mt-2 flex min-h-11 w-full items-center rounded-xs border border-border px-4 py-2 text-left text-[13px] text-text cursor-pointer aria-pressed:border-accent aria-pressed:text-accent-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-text focus-visible:outline-offset-2";

/** Node lookup for the link table below: a link names its two ends by id. */
const nodeById = new Map(nodes.map((node) => [node.id, node]));

/** Two decimals — under a tenth of a pixel at the rendered scale — so the
    generated path data stays readable in the DOM. */
function coord(value: number): string {
  return `${Math.round(value * 100) / 100}`;
}

/** The cubic from a production card's right edge to a tooling card's left edge,
    both taken at the card's vertical centre. `reach` is the fraction of the span
    the curve covers before it turns; it stays at or under 0.5, so each curve is
    monotone in x and never doubles back over itself. */
function linkPath(fromId: string, toId: string, reach: number): string {
  const from = nodeById.get(fromId);
  const to = nodeById.get(toId);
  if (!from || !to) {
    throw new Error(`atlas link names an unknown node: ${fromId} -> ${toId}`);
  }
  const x0 = from.x + cardWidth(from) / 2;
  const x1 = to.x - cardWidth(to) / 2;
  const turn = (x1 - x0) * reach;
  return `M ${coord(x0)} ${coord(from.y)} C ${coord(x0 + turn)} ${coord(from.y)}, ${coord(x1 - turn)} ${coord(to.y)}, ${coord(x1)} ${coord(to.y)}`;
}

/**
 * The wiring: six links, one production node to one tooling node each, and one
 * clause to justify every pair. All five production cards and all six tooling
 * cards are an end of exactly the six drawn here — no orphan card, and no card
 * carrying two curves it does not need.
 *
 *  · Gateway API → AI code review — the contract is the first thing review reads.
 *  · Gateway API → Agent-assisted docs — the API surface is what the runbooks document.
 *  · Payment services → Adversarial agent loop — the money path is challenged hardest.
 *  · Cash management → Prompt evaluation — the ledger rules are what the prompts are checked against.
 *  · Identity & access → Investigative agents — an authorisation question is what the agents trace.
 *  · Data & messaging → Local model workflows — the data layer is what the local models work over.
 *
 * Three crossings, one station each down the channel: `evals` against
 * `investigation` low in the channel, `adversarial` against `investigation` in
 * the middle, `docs` against `investigation` high in it. Every card the six do
 * not reach is not a card at all — the two shelves the atlas used to carry
 * (`Prompt libraries`, `MCP tool servers`) and the `Teller & access` service are
 * gone.
 *
 * `reach` is how far into the channel each curve runs before it turns; the values
 * differ so the three crossings do not stack on one vertical line.
 */
const LINK_PAIRS: readonly {
  readonly from: string;
  readonly to: string;
  readonly reach: number;
}[] = [
  { from: "gateway", to: "review", reach: 0.42 },
  { from: "gateway", to: "docs", reach: 0.5 },
  { from: "payments", to: "adversarial", reach: 0.42 },
  { from: "cash", to: "evals", reach: 0.36 },
  { from: "identity", to: "investigation", reach: 0.46 },
  { from: "data", to: "local-models", reach: 0.44 },
];

const links: readonly AtlasLink[] = LINK_PAIRS.map((pair) => ({
  from: pair.from,
  to: pair.to,
  d: linkPath(pair.from, pair.to, pair.reach),
}));

const outcome =
  "The same backend discipline, sustained in production: versioned contracts, reviewed changes, and delivery standards held across every service.";

/** viewBox unit → percentage of the diagram box. */
function pct(value: number, total: number): string {
  return `${(value / total) * 100}%`;
}

/**
 * Above the breakpoint the diagram needs two dimensions; below it the same
 * nodes stack. Resolved from the viewport, not from the visitor's motion
 * preference — the diagram is never gated off.
 */
function useDiagramLayout(): boolean {
  const [wide, setWide] = useState(
    () => typeof window === "undefined" || window.innerWidth >= 768,
  );
  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const sync = () => setWide(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  return wide;
}

/**
 * The pulse's rate for the diagram's links: one pace for every link, in viewBox
 * units per second — mid-band of the 110–140 px/s a travelling connection reads
 * at, and 1u is 1px here because the drawing sits in the plate at 0.9998x (see
 * {@link VIEW_W}). The pulse's seconds are its own measured
 * length over this rate (`duration = pathLength / speed`), so the pace is a
 * property of the path, not of its order in the list: the fixed
 * `2.6s + index * 0.35s` it replaced made the pace an accident of link order —
 * measured at 1440x900 (full Chromium over CDP, 2026-10-14) the six links ran
 * 60.7 / 86.7 / 95.4 / 101.6 / 105.8 / 112.4 px/s, so no two read alike.
 */
const PULSE_U_PER_S = 125;

/** One pulsating path: the stroke draws the change, the dash carries it. The
    travel's seconds come from the path's own measured length, so every link
    crosses the diagram at the same pace. */
function LinkPulse({
  d,
  travelling,
}: {
  d: string;
  travelling: boolean;
}) {
  const ref = useRef<SVGPathElement>(null);
  const [seconds, setSeconds] = useState<number | null>(null);
  useEffect(() => {
    const path = ref.current;
    if (!path) return;
    setSeconds(path.getTotalLength() / PULSE_U_PER_S);
  }, []);
  /* The loop enters on the pass after mount (see the Motion note): before the
     length is read, the stub rests where the un-armed loop starts. */
  const armed = travelling && seconds !== null;
  return (
    <motion.path
      ref={ref}
      d={d}
      fill="none"
      strokeWidth={2.5}
      strokeLinecap="round"
      pathLength={1}
      strokeDasharray="0.2 0.8"
      className="stroke-accent"
      animate={armed ? { strokeDashoffset: [0, -1] } : { strokeDashoffset: 0 }}
      transition={{
        duration: seconds ?? 1,
        ease: "linear",
        repeat: Infinity,
      }}
    />
  );
}

/**
 * The stacked rail's own frame — the same check the diagram's boxes go through,
 * at the rail's scale. A round cap paints half the stroke's width beyond each end
 * of the path, so the path is inset by the thickest ink the rail carries (the
 * 2.5u pulse's 1.25u half): the ink then lands exactly on the viewBox edge and
 * never across it. Un-inset, it crossed the top and bottom edges by 0.75u (the
 * 1.5u base stroke) and 1.25u (the pulse) — measured at 390x844, full Chromium
 * over CDP, 2026-10-14, both rails, both themes. The inset leaves the stroke
 * weights alone, and the cap still reaches 0 and 48, so the rail reads the same
 * length it did with its overhang clipped away.
 */
const RAIL_LEN = 48;
const RAIL_VIEW_W = 16;
const RAIL_BASE_STROKE = 1.5;
const RAIL_PULSE_STROKE = 2.5;
const RAIL_INSET = RAIL_PULSE_STROKE / 2;
const RAIL_D = `M ${RAIL_VIEW_W / 2} ${RAIL_INSET} L ${RAIL_VIEW_W / 2} ${RAIL_LEN - RAIL_INSET}`;

assertInkInsideFrame(
  "the stacked rail",
  { width: RAIL_VIEW_W, height: RAIL_LEN },
  [
    {
      left: RAIL_VIEW_W / 2 - RAIL_PULSE_STROKE / 2,
      top: RAIL_INSET - RAIL_PULSE_STROKE / 2,
      right: RAIL_VIEW_W / 2 + RAIL_PULSE_STROKE / 2,
      bottom: RAIL_LEN - RAIL_INSET + RAIL_PULSE_STROKE / 2,
    },
  ],
  0,
);

/** The stacked rendering's connector: the change leaving one group for the
    next, drawn as a short vertical rail that carries the same travelling pulse
    as the diagram's paths — and at the same pace, by the same rule: the rail's
    own measured length over {@link PULSE_U_PER_S} (measured at 1440x900, full
    Chromium over CDP, 2026-10-14: the rail's path is 45.5u — its 48u box less
    the cap inset — so one pass is 0.364s, where the fixed `2.6s` it replaced
    ran the same rail at 17.5 u/s — 7.1x slower than the diagram beside it). */
function StackConnector({ travelling }: { travelling: boolean }) {
  const ref = useRef<SVGPathElement>(null);
  const [seconds, setSeconds] = useState<number | null>(null);
  useEffect(() => {
    const path = ref.current;
    if (!path) return;
    setSeconds(path.getTotalLength() / PULSE_U_PER_S);
  }, []);
  const armed = travelling && seconds !== null;
  return (
    <div
      aria-hidden="true"
      className="flex w-full justify-start py-1 pl-[1.5rem]"
    >
      <svg
        viewBox={`0 0 ${RAIL_VIEW_W} ${RAIL_LEN}`}
        className="h-12 w-4"
        fill="none"
      >
        <path
          d={RAIL_D}
          strokeWidth={RAIL_BASE_STROKE}
          strokeLinecap="round"
          className="stroke-border"
        />
        <motion.path
          ref={ref}
          d={RAIL_D}
          strokeWidth={RAIL_PULSE_STROKE}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="0.2 0.8"
          className="stroke-accent"
          animate={armed ? { strokeDashoffset: [0, -1] } : { strokeDashoffset: 0 }}
          transition={{
            duration: seconds ?? 1,
            ease: "linear",
            repeat: Infinity,
          }}
        />
      </svg>
    </div>
  );
}

export function SystemAtlas() {
  const [selectedId, setSelectedId] = useState(productionNodes[0].id);
  /* See the Motion note above: the first animation pass is suppressed under the
     app root's `<AnimatePresence initial={false}>`, so the travel loop is armed
     on the pass after mount. Before it the pulse rests at the loop's start,
     which paints the same stub position the blocked pass used to leave it at. */
  const [travelling, setTravelling] = useState(false);
  useEffect(() => {
    setTravelling(true);
  }, []);
  const wide = useDiagramLayout();
  const selected =
    nodes.find((node) => node.id === selectedId) ?? productionNodes[0];

  /** One node as an aria-pressed button. The diagram variant draws nothing
      itself — the SVG carries the node's shape and label — while the stacked
      variant renders the label inside the button. */
  const renderNodeButton = (node: AtlasNode, stacked: boolean) => {
    const isSelected = node.id === selectedId;
    return (
      <button
        key={node.id}
        type="button"
        aria-label={node.label}
        aria-pressed={isSelected}
        onClick={() => setSelectedId(node.id)}
        style={
          stacked
            ? undefined
            : {
                left: pct(node.x, VIEW_W),
                top: pct(node.y, VIEW_H),
                width: pct(cardWidth(node), VIEW_W),
                height: pct(CARD_H, VIEW_H),
              }
        }
        className={
          stacked
            ? stackChip
            : "absolute -translate-x-1/2 -translate-y-1/2 rounded-xs cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-text focus-visible:outline-offset-[-2px]"
        }
      >
        {stacked ? node.label : null}
      </button>
    );
  };

  return (
    <BandShell
      kicker="03 / System atlas"
      title="System atlas"
      headingId="atlas-heading"
      band={2}
      contentClass="lg:col-span-10"
    >
      {/* The plate keeps the page's own measure: heading, rule, diagram and
          reading share the content column's left edge. The diagram takes the
          wide column (7 of 10); the legend and the selected-node reading sit
          in the remaining three as marginalia — stacked below the diagram
          under `lg`. */}
      <motion.p variants={fadeUp} className="mt-4 text-detail text-text-muted">
        Production services on the left; the agent tooling now running
        alongside them on the right — private first, then the local ones.
      </motion.p>

      <motion.div variants={fadeUp} className={PLATE_ABOVE}>
        <div className="lg:grid lg:grid-cols-10 lg:gap-x-6">
          <div className="min-w-0 lg:col-span-7">
          <div
            role="group"
            aria-label="System nodes"
            className="relative min-h-[320px] w-full lg:min-h-[440px]"
          >
            {/* The two-dimensional diagram, from 768px up. */}
            {wide ? (
              <div
                className="relative w-full"
                style={{ aspectRatio: `${VIEW_W} / ${VIEW_H}` }}
              >
                <svg
                  viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 h-full w-full"
                >
                  <text
                    x={LEFT_COL_LEFT}
                    y={HEADING_Y}
                    textAnchor="start"
                    fontSize={12}
                    letterSpacing="0.08em"
                    className="fill-text-muted"
                  >
                    Production services
                  </text>

                  {/* The two tooling clusters: a hairline box with the heading
                      above it, both under the cards so a curve into the cluster
                      is drawn over the box edge it enters. */}
                  {clusters.map((cluster) => (
                    <g key={`group-${cluster.id}`}>
                      <rect
                        x={cluster.box.x}
                        y={cluster.box.y}
                        width={cluster.box.width}
                        height={cluster.box.height}
                        rx={BOX_RADIUS}
                        fill="none"
                        strokeWidth={1}
                        className="stroke-border"
                      />
                      <text
                        x={cluster.box.x}
                        y={cluster.box.y - HEADING_GAP}
                        textAnchor="start"
                        fontSize={12}
                        letterSpacing="0.08em"
                        className="fill-text-muted"
                      >
                        {cluster.heading}
                      </text>
                    </g>
                  ))}

                  {nodes.map((node) => {
                    const isSelected = node.id === selectedId;
                    /* The accent is the hero cards' and the pulses' alone: a
                       selected node takes it too, everything else stays
                       hairline `border` in muted `text`. Selection never rests
                       on colour alone: the selected card carries a triple-width
                       stroke, a second outer hairline, and a bold label
                       against every other card's single hairline and regular
                       label. */
                    const accent = isSelected || node.hero === true;
                    return (
                      <g key={`shape-${node.id}`}>
                        {isSelected ? (
                          <rect
                            x={node.x - cardWidth(node) / 2 - 4}
                            y={node.y - CARD_H / 2 - 4}
                            width={cardWidth(node) + 8}
                            height={CARD_H + 8}
                            rx={9}
                            fill="none"
                            strokeWidth={1}
                            className="stroke-accent"
                          />
                        ) : null}
                        <rect
                          x={node.x - cardWidth(node) / 2}
                          y={node.y - CARD_H / 2}
                          width={cardWidth(node)}
                          height={CARD_H}
                          rx={6}
                          strokeWidth={isSelected ? 3 : 1}
                          className={
                            accent
                              ? "fill-bg stroke-accent"
                              : "fill-bg stroke-border"
                          }
                        />
                        <text
                          x={node.x}
                          y={node.y}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={14}
                          fontWeight={
                            isSelected ? 700 : node.hero ? 600 : 400
                          }
                          className={accent ? "fill-accent-text" : "fill-text"}
                        >
                          {node.label}
                        </text>
                      </g>
                    );
                  })}

                  {links.map((link) => (
                    <path
                      key={`base-${link.from}-${link.to}`}
                      d={link.d}
                      fill="none"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeOpacity={0.45}
                      className="stroke-text"
                    />
                  ))}

                  {links.map((link) => (
                    <LinkPulse
                      key={`pulse-${link.from}-${link.to}`}
                      d={link.d}
                      travelling={travelling}
                    />
                  ))}
                </svg>

                {nodes.map((node) => renderNodeButton(node, false))}
              </div>
            ) : (
              /* Below 768px: the same eleven nodes, stacked in reading order —
                 production, then the private cluster, then the local one, with
                 the two connectors that carry the flow still pulsing. */
              <div className="flex flex-col">
                <p className="text-micro font-semibold tracking-[0.08em] text-text-muted text-balance">
                  Production services
                </p>
                {productionNodes.map((node) => renderNodeButton(node, true))}

                <StackConnector travelling={travelling} />

                {clusters.map((cluster, clusterIndex) => (
                  <div key={`stack-${cluster.id}`} className="flex flex-col">
                    <p className="mt-3 text-micro font-semibold tracking-[0.08em] text-text-muted text-balance">
                      {cluster.heading}
                    </p>
                    {cluster.nodes.map((node) => renderNodeButton(node, true))}
                    {clusterIndex === 0 ? (
                      <StackConnector travelling={travelling} />
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
          </div>

          {/* Marginalia: the legend and the selected-node reading beside the
              diagram at `lg`, stacked below it under — so the diagram is the
              band's dominant element and the reading never sits under empty
              paper. */}
          <aside
            aria-label="Diagram notes"
            className="mt-8 min-w-0 lg:col-span-3 lg:mt-0"
          >
            <div className="border-t border-border pt-3">
              <p className="font-mono text-micro font-medium uppercase tracking-[0.14em] text-text-muted">
                Legend
              </p>
              <ul className="mt-2 space-y-1 text-detail text-text-muted">
                <li>Production services — left column</li>
                <li>Private agents — right, upper box</li>
                <li>Local agents — right, lower box</li>
                <li>
                  {links.length} links — each leaves a service edge and reaches
                  an agent edge
                </li>
              </ul>
              <p className="mt-2 text-detail text-text-muted">
                Select a node to read it.
              </p>
            </div>

            <div
              aria-live="polite"
              className="mt-6 border-l-2 border-accent pl-4"
            >
              <p className="text-title font-semibold text-text">
                {selected.label}
              </p>
              <p className="mt-1 text-body text-text-muted">
                {selected.detail}
              </p>
            </div>
          </aside>
        </div>

          <motion.p variants={fadeUp} className="mt-8 text-detail text-text-muted">
            {outcome}
          </motion.p>
        </motion.div>
    </BandShell>
  );
}
