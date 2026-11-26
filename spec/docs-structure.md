# Documentation structure (local adoption)

This repository follows the documentation structure defined in the canonical
"docs-template" repository. That canonical spec owns the rules; this file
records only how the agreement applies locally, using relative paths.

## Local shape

- Root entry points are README.md (existing, unchanged) and AGENTS.md (policy
  only: no versions, paths, install commands or current-state descriptions).
- spec/checker.md and spec/docs-structure.md describe this adoption. The plan
  is .nstack/plan.yaml and the decision is adr/0001-vendor-docs-gate.yaml.
- One fact has one home. The checker pin is declared in [docs-check.json](../docs-check.json),
  not restated here; verify it with `node docs-check.mjs --print-hash`.
- Existing README.md, docs/GEOMETRY.md and all application files are preserved
  unchanged. The existing Pages deployment workflow is untouched.

## Phase 1 here

The gate is report-only locally; strict mode is earned after a clean report and
is run here as part of the local check. Link checking is not part of the Node gate.
This repository already had CI and a Pages deploy workflow (both unchanged), so a
separate pull-request-only report workflow, .github/workflows/docs-report.yml,
uses pinned offline lychee v2.2.0 with fail: false and contents: read only. It
does not run the strict gate and does not touch the existing workflows.
