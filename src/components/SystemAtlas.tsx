import { useState } from "react";
import { motion } from "framer-motion";
import { useResolvedReduceMotion } from "../lib/motionPreference";
import { fadeUp, staggerParent } from "../lib/motion";

/**
 * SystemAtlas — the landing's living system diagram.
 *
 * One interactive SVG: two node columns (production services on the left, the
 * local AI tooling alongside them on the right) bridged by paths that carry an
 * animated pulse while motion is allowed. Selecting a node updates the reading
 * below. Every label and sentence is grounded in the delivered Xentra record
 * (src/content/experience.ts) — generic capability phrasing, no metric claimed
 * that the record does not already carry.
 *
 * Accessibility: the section is labelled by its heading; the nodes are a
 * radiogroup of aria-labelled buttons; the reading updates through an
 * aria-live region. Reduced motion is read through the persisted preference
 * (`useResolvedReduceMotion`) — the entrance is skipped and the pulses are not
 * rendered, so the layout holds still without animating.
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
}

interface AtlasLink {
  readonly from: string;
  readonly to: string;
  /** Cubic path between the two node edges. */
  readonly d: string;
}

const VIEW_W = 640;
const VIEW_H = 320;
const NODE_W = 132;
const NODE_H = 44;

/** The real backend surface: C#/.NET fintech services. */
const productionNodes: readonly AtlasNode[] = [
  {
    id: "payments",
    label: "Payments API",
    detail:
      "Payment services written in C#/.NET on AWS, with the slow query paths profiled and tuned so settlement calls stay fast under load.",
    x: 110,
    y: 60,
  },
  {
    id: "cash",
    label: "Cash management",
    detail:
      "Cash-management endpoints on ASP.NET Web API, backed by EF Core and Dapper over MySQL with Redis caching on the hot reads.",
    x: 110,
    y: 130,
  },
  {
    id: "auth",
    label: "Authentication",
    detail:
      "JWT, OAuth 2.0, and OpenID Connect with RBAC and ABAC, centralizing authorization so a policy change ships in one place.",
    x: 110,
    y: 200,
  },
  {
    id: "teller",
    label: "Teller & access",
    detail:
      "Realtime teller and access-control surfaces built on gRPC, SignalR, and RabbitMQ messaging across the product family.",
    x: 110,
    y: 270,
  },
];

/** The post-May-2026 tooling that now runs beside that backend. */
const toolingNodes: readonly AtlasNode[] = [
  {
    id: "review",
    label: "AI code review",
    detail:
      "Local models through LM Studio and OpenCode review C# changes on-machine, keeping prompts and code off hosted services.",
    x: 530,
    y: 80,
  },
  {
    id: "eval",
    label: "Prompt evaluation",
    detail:
      "Reusable prompt libraries for review, migration, and test scaffolding, checked against real repositories before they are reused.",
    x: 530,
    y: 165,
  },
  {
    id: "docs",
    label: "Agent-assisted docs",
    detail:
      "Agent workflows investigate unfamiliar repositories and draft the notes and runbooks that travel with the change.",
    x: 530,
    y: 250,
  },
];

const nodes: readonly AtlasNode[] = [...productionNodes, ...toolingNodes];

const links: readonly AtlasLink[] = [
  { from: "payments", to: "review", d: "M 176 60 C 300 60, 340 80, 464 80" },
  { from: "cash", to: "eval", d: "M 176 130 C 300 130, 340 165, 464 165" },
  { from: "auth", to: "docs", d: "M 176 200 C 300 200, 340 250, 464 250" },
  { from: "teller", to: "review", d: "M 176 270 C 300 270, 340 80, 464 80" },
];

const outcome =
  "The same backend discipline, now run through local AI tooling: production systems carried forward into an agent-assisted workflow.";

/** viewBox unit → percentage of the diagram box. */
function pct(value: number, total: number): string {
  return `${(value / total) * 100}%`;
}

export function SystemAtlas() {
  const reduceMotion = useResolvedReduceMotion();
  const [selectedId, setSelectedId] = useState(productionNodes[0].id);
  const selected =
    nodes.find((node) => node.id === selectedId) ?? productionNodes[0];

  return (
    <section aria-labelledby="atlas-heading" className="px-6 pt-14 lg:px-10">
      <motion.div
        variants={staggerParent}
        initial={reduceMotion ? undefined : "hidden"}
        whileInView={reduceMotion ? undefined : "visible"}
        viewport={{ once: true, margin: "-10% 0px" }}
        className="mx-auto w-full max-w-[68ch]"
      >
        <motion.h2
          id="atlas-heading"
          variants={fadeUp}
          className="text-headline font-semibold text-text"
        >
          System atlas
        </motion.h2>

        <motion.p variants={fadeUp} className="mt-2 text-detail text-text-muted">
          Production services on the left; the local AI tooling now running
          alongside them on the right.
        </motion.p>

        <motion.div variants={fadeUp} className="mt-6">
          <div
            role="radiogroup"
            aria-label="System nodes"
            className="relative aspect-[2/1] w-full"
          >
            <svg
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full"
            >
              <text
                x={110}
                y={24}
                textAnchor="middle"
                fontSize={11}
                letterSpacing="0.08em"
                className="fill-text-muted"
              >
                PRODUCTION · C#/.NET
              </text>
              <text
                x={530}
                y={24}
                textAnchor="middle"
                fontSize={11}
                letterSpacing="0.08em"
                className="fill-text-muted"
              >
                TOOLING · LOCAL AI
              </text>

              {links.map((link) => (
                <path
                  key={`base-${link.from}-${link.to}`}
                  d={link.d}
                  fill="none"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  className="stroke-border"
                />
              ))}

              {!reduceMotion &&
                links.map((link, index) => (
                  <motion.path
                    key={`pulse-${link.from}-${link.to}`}
                    d={link.d}
                    fill="none"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    pathLength={1}
                    strokeDasharray="0.14 0.86"
                    className="stroke-accent"
                    animate={{ strokeDashoffset: [0, -1] }}
                    transition={{
                      duration: 2.6 + index * 0.4,
                      ease: "linear",
                      repeat: Infinity,
                    }}
                  />
                ))}

              {nodes.map((node) => {
                const isSelected = node.id === selectedId;
                return (
                  <g key={node.id}>
                    <rect
                      x={node.x - NODE_W / 2}
                      y={node.y - NODE_H / 2}
                      width={NODE_W}
                      height={NODE_H}
                      rx={6}
                      strokeWidth={isSelected ? 2 : 1}
                      className={
                        isSelected
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
                      className={
                        isSelected ? "fill-accent-text" : "fill-text"
                      }
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {nodes.map((node) => {
              const isSelected = node.id === selectedId;
              return (
                <button
                  key={node.id}
                  type="button"
                  aria-label={node.label}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedId(node.id)}
                  style={{
                    left: pct(node.x, VIEW_W),
                    top: pct(node.y, VIEW_H),
                    width: pct(NODE_W, VIEW_W),
                    height: pct(NODE_H, VIEW_H),
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-xs cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-text focus-visible:outline-offset-[-2px]"                />
              );
            })}
          </div>
        </motion.div>

        <div aria-live="polite" className="mt-6 border-l-2 border-accent pl-4">
          <p className="text-title font-semibold text-text">{selected.label}</p>
          <p className="mt-1 text-body text-text-muted">{selected.detail}</p>
        </div>

        <motion.p variants={fadeUp} className="mt-4 text-detail text-text-muted">
          {outcome}
        </motion.p>
      </motion.div>
    </section>
  );
}
