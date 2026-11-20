# Verification

Checked 2026-11-20 at code commit 3488134.

- npm test: PASS, 77 assertions across all 30 CLI commands in isolated PGlite databases.
- [GitHub Actions](https://github.com/Enterprise-DNA-OS/text-annotation-for-claude-code/actions/runs/44660000440): all four jobs passed, Windows and Ubuntu on Node 20 and 22. Each ran npm ci, npm test, npm run demo, npm run view and npm run docs.
- Meaningful failure cases: whole-import rollback, changed-source refusal, malformed CSV, duplicate-line grouping, unknown labels, invalid calendar dates, ambiguous names, self-adjudication, stale guidance, changed labels, evidence changes, holds and overdue retention reviews.
- Evidence checked: exact original CSV retained, repeated imports idempotent, imported source labels do not become approvals, releases retain their original payload after later edits, HTML escapes source markup, exports and drafts write real files.
- Branded weekly dashboard and dataset review card rendered and visually inspected in a headless browser.
- No TODO(author) placeholders, em dashes or banned voice terms in prose; brand lint passed the README, operating instructions, documents and command recipes.

PostgreSQL uses the same migration and parameterised commands through the shared adapter, but this run tested embedded PGlite rather than a hosted PostgreSQL server. No real Datasaur account or customer export was available. The importer was tested against a synthetic fixture based on the vendor's documented row-label format. Authentication, media annotation and automatic model calls are outside the free base.
