# nathwn12.github.io

**The portfolio and record of Nathaniel Nikolai Ladero, a C# and .NET backend developer: what shipped, and what it measurably did.**

## Run it

Node 20.19+ and bun 1.4.4. Run `bun install --frozen-lockfile`, then `bun run preview:live` for
the server on `http://127.0.0.1:5277`.

## Checks

`bun run check` runs the typecheck, the production build and the behavior tests.
`bun run probe:repos` fails when `src/content/projects.ts` stops matching what GitHub publishes.

## Deploy

Push to `main`. `.github/workflows/deploy.yml` builds and publishes `dist` to GitHub Pages.

## Links

- Issues: https://github.com/nathwn12/nathwn12.github.io/issues
- Live: https://nathwn12.github.io
- Licence: [LICENSE](LICENSE)
