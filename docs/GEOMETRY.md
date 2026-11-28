# Geometry gate

`bun run check:geometry` proves the served `dist` build against the frozen contract in
`scripts/geometry/contract.yaml`. It builds when a source input is newer than `dist/index.html`,
serves `dist` on an ephemeral loopback port, runs `scripts/geometry/probe.mjs` over all 32
configs, prints the summary, and closes the listener in a `finally` block on both green and red.
No fixed port, no status file, no JSON left in the repo (the report goes to a temp dir removed
by the runner). CI stays a publisher: this gate is local only.

`bun run check` stays typecheck + build + tests. `bun run check:all` runs `check`, then
`check:geometry` as a separate step — not folded into vitest.

## Five invariants

| ID | Name | Measured | Expected |
| --- | --- | --- | --- |
| INV1 | no overlap | glyph-ink overlap depth between leaf text line boxes | 0; count only when vertical overlap > 1px and horizontal overlap > 0.5px |
| INV2 | no overshoot | visible box past the document box, plus `scrollWidth` overflow with `overflow-x: visible` | 0 past the document (1px tolerance); field content boxes inside parent |
| INV3 | no divergence | left spread of `.lab-nav .mark`, `#horizon h1`, `.ch-coordinate`, `.ch-name`; right edge delta against `.chapter .field` content right | <= 1.5px |
| INV4 | no mixing | vertical glyph-ink clearance between stacked blocks whose horizontal ink overlaps >= 50% of the narrower range | >= 12px at width >= 701; >= 10px at width <= 700 |
| INV5 | no occlusion | landed anchor heading ink against the sticky `.lab-nav` and fixed `nav.spine` boxes | 0 overlap (0.5px tolerance) |

Ink is `Range.getClientRects()` per direct text node, narrowed to glyph ink with canvas
`actualBoundingBoxAscent` / `actualBoundingBoxDescent`. Ancestor/descendant pairs and hidden or
zero-size elements are never compared. Tolerances live in `contract.yaml` under `tolerances`.
INV5 clicks every visible anchor in `.lab-nav .links a` and `nav.spine a`, lets the scroll
settle, then checks the landed heading.

## Width matrix

Widths: 320, 360, 390, 430, 640, 768, 900, 1024, 1200, 1440, 1680, 1920, 2200, 2560, 3440, 3840.
Modes: `no-preference`, `reduce`. 16 x 2 = 32 configs. Viewport height by width: <= 430 -> 800;
<= 900 -> 1024; <= 1440 -> 900; <= 1920 -> 1080; <= 2560 -> 1440; above -> 2160.

## Exemption

One INV1 pair is exempt: `span.seal-zero` + `span.seal-stamp`. Reason: the -98% stamp is composed
inside the hollow zero; this ink overlap is the intended seal, not a collision. The pair is
skipped only when both own-selectors match exactly. The probe counts real INV1 candidates that
an exemption swallows; an exemption with zero hits across all configs is a dead exemption and
fails the gate (`DEAD EXEMPTION | ...` plus `DEAD_EXEMPTIONS=n` in the summary). A stale seal
markup therefore breaks the gate instead of silently losing its exception.

## Red proof

Exact command:

```sh
bun run check:geometry --inject=overlap
```

Expected on the current build (the port and JSON path are ephemeral):

```text
GEOMETRY PORT=<port> URL=http://127.0.0.1:<port>/
URL: http://127.0.0.1:<port>/  inject=overlap  configs=32
INV1 | div#root > main#main > section#horizon > div.beat.beat-one > div.hero-hud > div.hud.hud-role > p "Backend developer · payment " <> div#root > main#main > section#horizon > div.beat.beat-one > div.hero-hud > div.hud.hud-role > p.data "Philippines" | 320 | no-preference | 6.8px ink overlap | 0 ink overlap (vertical tol 1px)
SUMMARY INV1=64 INV2=0 INV3=0 INV4=0 INV5=0 TOTAL=64
GEOMETRY PORT=<port> STOPPED
error: script "check:geometry" exited with code 1
```

Exit 1, a named INV1 row, and the stopped-port line are the proof. The clean run prints
`SUMMARY INV1=0 INV2=0 INV3=0 INV4=0 INV5=0 TOTAL=0` and exits 0. `--inject=edge`,
`--inject=occlude` and `--inject=all` fault the other surfaces the same way.
