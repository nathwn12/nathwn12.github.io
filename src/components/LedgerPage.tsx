import { useEffect, useState, type ReactNode } from "react";
import HorizonVideo from "./HorizonVideo";
import ZeroSeal from "./ZeroSeal";
import WitnessMark from "./WitnessMark";
import { CountUp, Heatmap, Sparkline } from "./Instruments";
import {
  employer,
  experience,
  spineDate,
} from "../content/experience";
import {
  aiPractice,
  contactBlock,
  figures,
  locatedIn,
  name,
  spineStamp,
  statusLine,
  workBand,
} from "../content/ledger";
import { coldRead, coordinates, type CoordinateKey } from "../content/coordinates";
import { signal, specLines } from "../content/signal";
import {
  featuredRows,
  indexRows,
  workShelfIntro,
} from "../content/showcase";
import { CONTACT_EMAIL, CV_PATH, RESUME_PATH } from "../lib/contact";

/** The ids stay stable; the labels are the owner's final visible copy. */
const SECTIONS = [
  { id: "signal", index: "01", label: "Numbers" },
  { id: "work", index: "02", label: "Open Source" },
  { id: "proof", index: "03", label: "Work" },
  { id: "method", index: "04", label: "Approach" },
  { id: "contact", index: "05", label: "Contact" },
] as const;

/** Lifetime downloads as the ledger prints them: a figure, or no package. */
const lifetimeOf = (row: { lifetime: number | null }): string =>
  row.lifetime !== null ? row.lifetime.toLocaleString("en-US") : "no package";

function Cluster({
  id,
  index,
  label,
  variant,
  active,
  ornament,
  children,
}: {
  id: CoordinateKey;
  index: string;
  label: string;
  variant: string;
  active: string;
  ornament?: ReactNode;
  children: ReactNode;
}) {
  const coord = coordinates[id];
  return (
    <section
      id={id}
      className={active === id ? "chapter is-active" : "chapter"}
      aria-labelledby={`${id}-title`}
    >
      {ornament}
      <div className="field">
        <div className="ch-head">
          <span className="ch-coordinate">
            <span className={active === id ? "ch-num is-active" : "ch-num"}>
              {index}
            </span>
            {` / ${label.toUpperCase()}`}
            <span className="coord-tail">{` / ${coord.value} / ${coord.date}`}</span>
          </span>
          <h2 id={`${id}-title`} className="ch-name">
            {label}
          </h2>
        </div>
        <div className={`v-body ${variant}`}>{children}</div>
        <p className="chapter-margin">{coord.margin}</p>
      </div>
    </section>
  );
}

export default function LedgerPage() {
  const [active, setActive] = useState<string>("signal");

  useEffect(() => {
    document.title = `${name} — event horizon`;
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cold = document.querySelector<HTMLElement>(".cold-read");
    if (!cold) return;
    cold.classList.add("is-armed");
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          cold.classList.add("is-shown");
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(cold);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const sections = SECTIONS.map((section) =>
      document.getElementById(section.id),
    ).filter((node): node is HTMLElement => node !== null);
    const lastId = sections[sections.length - 1]?.id;
    // The narrow 40–45% band cannot reach the final chapter when the page
    // bottoms out above it, so the end of the page belongs to the last section.
    const atEnd = () =>
      window.scrollY + window.innerHeight >=
      document.documentElement.scrollHeight - 2;
    const observer = new IntersectionObserver(
      (entries) => {
        if (atEnd() && lastId) {
          setActive(lastId);
          return;
        }
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    for (const section of sections) observer.observe(section);
    const onScroll = () => {
      if (atEnd() && lastId) setActive(lastId);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const nameParts = name.split(" ");
  const firstName = nameParts.slice(0, -1).join(" ");
  const lastName = nameParts[nameParts.length - 1] ?? "";
  const mailSubject = encodeURIComponent("Role, system, or problem");
  const mailBody = encodeURIComponent(contactBlock.line);

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <header className="lab-nav" aria-label="Site">
        <div className="field">
          <a className="mark" href="#horizon" aria-label="Back to the top">
            <img src="/brand/signature-glyph.svg" alt="" width={300} height={252} />
          </a>
          <nav className="links" aria-label="Chapters">
            {SECTIONS.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                aria-current={active === section.id ? "true" : undefined}
              >
                <span aria-hidden="true">{section.index}</span>{" "}
                {section.label}
              </a>
            ))}
          </nav>
          <span className="nav-ticker" aria-hidden="true">
            {signal.ticker.join(" · ")}
          </span>
        </div>
      </header>

      <nav className="spine" aria-label="Chapters, phone">
        {SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            aria-current={active === section.id ? "true" : undefined}
          >
            <span>{section.index}</span>
          </a>
        ))}
      </nav>

      <main id="main" tabIndex={-1}>
        <section id="horizon" className="hero" aria-labelledby="hero-name">
          <div className="beat beat-one">
            <WitnessMark className="witness-hero" />
            <HorizonVideo />
            <div className="hero-hud">
            <div className="hud hud-name">
              <p className="eyebrow data">Event horizon / portfolio / 2026</p>
              <h1 id="hero-name">
                <span className="name-first">{firstName}</span>{" "}
                <span className="name-last">{lastName}</span>
              </h1>
            </div>
            <div className="hud hud-role">
              <p className="eyebrow data">Role</p>
              <p>Backend systems, then the tools around them.</p>
              <p className="data">{locatedIn} · Remote</p>
            </div>
            <div className="hud hud-status">
              <p className="eyebrow data">Status</p>
              <p>{statusLine}</p>
              <p className="data">{employer.period}</p>
            </div>
            <a className="hud hud-scroll data" href="#signal">
              <span className="scroll-line" aria-hidden="true" />
              <span>Descend to the record</span>
              <span aria-hidden="true">↓</span>
            </a>
            </div>
          </div>
          <div className="beat beat-cold">
            <WitnessMark className="witness-cold" />
            <div className="field">
              <div className="cold-read" data-cold>
                {coldRead.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </div>
          </div>
        </section>

        <Cluster id="signal" index="01" label="Numbers" variant="sa" active={active}>
          <div className="top">
            <div>
              <CountUp value={signal.allTime} className="figure" />
              <div className="flabel">npm downloads / all time</div>
            </div>
            <div>
              <CountUp value={signal.month} className="figure" />
              <div className="flabel">npm downloads / last 30 days</div>
            </div>
          </div>

          <div className="strip">
            {signal.packages.map((item) => (
              <div className="cell" key={item.name}>
                <div className="pname">{item.name}</div>
                <Sparkline values={item.daily} />
                <div className="pval">{item.month.toLocaleString("en-US")}</div>
              </div>
            ))}
          </div>

          <div className="lower">
            <div className="micros">
              <div className="micro">
                <CountUp value={signal.github.commits} />
                <span>commits / 12 mo</span>
              </div>
              <div className="micro">
                <CountUp value={signal.repos} />
                <span>public repos</span>
              </div>
              <div className="micro">
                <CountUp value={signal.github.contributions} />
                <span>contributions / 12 mo</span>
              </div>
              <div className="micro">
                <CountUp value={signal.github.pullRequests} />
                <span>pull requests / 12 mo</span>
              </div>
              <div className="micro">
                <CountUp value={signal.packageCount} />
                <span>npm packages</span>
              </div>
            </div>
            <div>
              <div className="heat">
                <Heatmap />
              </div>
              <div className="hnote">{signal.activityText}</div>
            </div>
          </div>
          <div className="stamp">{signal.stamp}</div>
        </Cluster>

        <Cluster id="work" index="02" label="Open Source" variant="wc" active={active}>
          <p className="intro">{workShelfIntro}</p>
          <div className="ledger">
            {featuredRows.map((row) => (
              <a
                className="tier-a"
                key={row.dir}
                href={row.url}
                target="_blank"
                rel="noreferrer"
              >
                <span className="a-head">
                  <span className="a-name">{row.name}</span>
                  <span className="claim a-claim">{row.claim}</span>
                </span>
                <span className="a-detail">{row.detail}</span>
                <span className="a-foot">
                  <span>{row.tech.join(" / ")}</span>
                  <span>{`${lifetimeOf(row)} · ${row.language}`}</span>
                </span>
              </a>
            ))}
            {indexRows.map((row) => (
              <div className="tier-b" key={row.dir}>
                <span className="b-main">
                  <a href={row.url} target="_blank" rel="noreferrer">
                    {row.name}
                  </a>
                  {` · ${row.claim}`}
                </span>
                <span className="b-life">{lifetimeOf(row)}</span>
                <span className="b-lang">{row.language}</span>
              </div>
            ))}
          </div>
        </Cluster>

        <Cluster id="proof" index="03" label="Work" variant="pc" active={active}>
          <div className="band">
            <div>
              <b>{workBand[0].figure}</b>
              <span>{workBand[0].label}</span>
            </div>
            <ZeroSeal figure={workBand[1].figure} label={workBand[1].label} />
          </div>
          <div className="spine">
            {experience.map((entry) => (
              <div className="node" key={entry.id}>
                <span className="date">{spineDate(entry.date)}</span>
                {spineStamp(entry.id) && (
                  <span className="stampfig">{spineStamp(entry.id)}</span>
                )}
                <div className="node-body">
                  <h3>{entry.name}</h3>
                  <p className="out">{entry.outcome}</p>
                  <p className="tex">{entry.texture}</p>
                </div>
              </div>
            ))}
          </div>
        </Cluster>

        <Cluster id="method" index="04" label="Approach" variant="ma" active={active}>
          <div className="prose">
            {aiPractice.sentences.map((sentence) => (
              <p key={sentence}>{sentence}</p>
            ))}
          </div>
          <div className="facts">{aiPractice.facts.join(" · ")}</div>
          <div className="spec">
            {specLines.map((line) => (
              <div className="sline" key={line.key}>
                <span className="sk">{line.key}</span>
                <span className="sv">{line.value}</span>
              </div>
            ))}
          </div>
          <div className="dl">
            <div>
              tenure<b>{figures.tenure}</b>
            </div>
            <div>
              period<b>{employer.period}</b>
            </div>
            <div>
              base<b>{locatedIn}</b>
            </div>
          </div>
        </Cluster>

        <Cluster id="contact" index="05" label="Contact" variant="ca" active={active} ornament={<WitnessMark className="witness-contact" />}>
          <p className="line">{contactBlock.line}</p>
          <a
            className="mail"
            href={`mailto:${CONTACT_EMAIL}?subject=${mailSubject}&body=${mailBody}`}
          >
            {CONTACT_EMAIL}
          </a>
        </Cluster>
      </main>

      <footer className="colophon">
        <WitnessMark className="witness-footer" />
        <div className="field">
          <span className="data">NNL / event horizon / 2026</span>
          <p className="colophon-links data">
            <a href="https://github.com/nathwn12" target="_blank" rel="noreferrer">GitHub</a>
            <a href="https://www.linkedin.com/in/nathaniel-nikolai-l-184181261/" target="_blank" rel="noreferrer">LinkedIn</a>
            <a href={RESUME_PATH}>Résumé</a>
            <a href={CV_PATH}>CV</a>
            <a href="https://github.com/nathwn12/nathwn12.github.io" target="_blank" rel="noreferrer">Source</a>
          </p>
        </div>
      </footer>
    </>
  );
}
