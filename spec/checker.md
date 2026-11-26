# Checker contract (local adoption)

This repository vendors the canonical phase-1 gate from the local
docs-template@cffb46a6c6f09ca452ffbf04e14c349fa65af814 verbatim. The two local
files are the checker [docs-check.mjs](../docs-check.mjs) and its configuration
[docs-check.json](../docs-check.json); the gate does not edit either. Tests live
only in the canonical template: no local test/ tree was vendored, so no local
test path is implied.

## What it checks

Phase 1 implements exactly four checks: forbidden (policy facts in AGENTS.md,
with built-in patterns always applied), versions (config-driven equality,
opt-in), generated (byte-exact whole-file or marked-block comparison, opt-in),
and checker (the running script version and SHA-256 against the pin in
docs-check.json). Link checking is not in the Node tool; see
docs-structure.md for the PR-only report workflow that applies here.

## Working commands

From the repository root, each command stands alone:

```text
node docs-check.mjs --report
node docs-check.mjs --strict
node docs-check.mjs --json
node docs-check.mjs --print-hash
```

--config defaults to docs-check.json in the current directory and resolves
paths relative to that file. Exit codes: 0 for no findings or report mode,
1 for findings in strict mode, 2 for a config or checker error.

CLI edge cases follow the canonical contract cited above: `--report --strict`
selects strict mode, and `--print-hash --config docs-check.json` is accepted
because the explicit value equals the default. Repeated `--strict` or `--json`,
and unknown options, exit 2.

The checker hashes the script actually running and normalizes line endings,
so the targeted LF rule in .gitattributes keeps the bytes identical across
checkouts. A mismatch is a finding naming both pins and the actual hash.
