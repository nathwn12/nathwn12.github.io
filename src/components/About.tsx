/**
 * About — 3 lines maximum, hiring-relevant only.
 */
export function About() {
  return (
    <section aria-labelledby="about-heading" className="px-4 py-16">
      <div className="mx-auto w-full max-w-[720px]">
        <p className="mono-accent">about</p>
        <h2 id="about-heading" className="mt-4 max-w-[66ch]">
          About keeps it short
        </h2>
        <p className="mt-8 max-w-[66ch] text-[1rem] leading-[1.5]">
          Backend developer in Hagonoy, Bulacan, working remotely on fintech
          systems and developer tools.
        </p>
        <p className="mt-4 max-w-[66ch] text-[1rem] leading-[1.5]">
          Recent work: payment APIs, data layers, and the agent tooling above.
        </p>
        <p className="mt-4 max-w-[66ch] text-[1rem] leading-[1.5]">
          Open to backend and tooling roles where production behaviour counts.
        </p>
      </div>
    </section>
  );
}
