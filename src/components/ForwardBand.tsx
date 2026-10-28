import { forward, forwardHeading } from "../content/forward";
import { forwardLede } from "../content/ledger";
import { Reveal } from "./Reveal";

/**
 * ForwardBand — where the work is going: the AI-assisted workflow, the shipped
 * MCP servers and plugins, and what is being learned.
 *
 * Five items of equal weight, set as a two-column flow from 1024px and one
 * column below it. The equal weight is the point: the workflow is not more
 * important than the tools it produced, and a hierarchy here would have needed
 * a card to signal it. Text is the only material — no icons, no tiles — and
 * every string is read from src/content/forward.ts.
 *
 * The container is a CSS multi-column flow, not a grid of rows. A row grid
 * stretched each pair to the taller item and top-aligned the shorter one, so a
 * short item's metadata sat 99px above its neighbour's (124px at 768) with the
 * row's empty space below it, and the fifth item was orphaned in an empty
 * right-hand cell. In a column flow each item closes on its own metadata and
 * the next item starts one 32px gap below it; items flow down the left column
 * and continue down the right, so DOM order (and therefore keyboard and screen
 * reader order) is still the reading order. `break-inside: avoid` keeps an item
 * whole, and the last item carries no trailing margin so the band's own padding
 * closes it. No filler and no reorder: with this copy the two columns end as
 * close as their content permits.
 */
export function ForwardBand() {
  return (
    <section id="forward" className="band" aria-labelledby="forward-heading">
      <div className="frame">
        <Reveal>
          <h2 id="forward-heading" className="h2">
            {forwardHeading}
          </h2>
          <p className="prose mt-3">{forwardLede}</p>
        </Reveal>

        <div className="mt-8 lg:columns-2 lg:gap-x-10 lg:mt-10">
          {forward.map((item, index) => (
            <Reveal
              key={item.id}
              delayMs={index * 40}
              className="mb-8 break-inside-avoid last:mb-0"
            >
              <div>
                <h3 className="text-[1.0625rem] font-semibold tracking-[-0.01em]">
                  {item.title}
                </h3>
                <p className="prose mt-1">{item.body}</p>
                <p className="meta muted mt-2">{item.tech.join(" · ")}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
