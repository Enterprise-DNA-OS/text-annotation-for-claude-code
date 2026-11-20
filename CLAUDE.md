# Text Annotation for Claude Code

Read records before answering. This is a text classification and independent review desk for a trusted data team. The demo is entirely synthetic. Change brand.json to the business identity.

Use Node 20 or newer. Run npm run demo only in an empty local demo database. Use npm run migrate for a working database. DATABASE_URL selects PostgreSQL; otherwise DATA_DIR selects embedded PGlite, default .data/db. OUTPUT_DIR redirects reports, drafts and exports.

All business actions use scripts/annotation.mjs. Actor values are supplied labels, not authenticated identities. Never invent reviewers, source text, privacy evidence or a second human vote. Never send, publish or delete. Do not submit private source text to an agent service without the business's approved data handling arrangements. Keep imports, exports and generated documents private.

## Routing

- /help: npm run annotation -- help. Read .claude/commands/help.md for required arguments.
- /add-project: npm run annotation -- add-project. Read .claude/commands/add-project.md for required arguments.
- /add-item: npm run annotation -- add-item. Read .claude/commands/add-item.md for required arguments.
- /assign: npm run annotation -- assign. Read .claude/commands/assign.md for required arguments.
- /annotate: npm run annotation -- annotate. Read .claude/commands/annotate.md for required arguments.
- /adjudicate: npm run annotation -- adjudicate. Read .claude/commands/adjudicate.md for required arguments.
- /privacy-check: npm run annotation -- privacy-check. Read .claude/commands/privacy-check.md for required arguments.
- /hold: npm run annotation -- hold. Read .claude/commands/hold.md for required arguments.
- /unhold: npm run annotation -- unhold. Read .claude/commands/unhold.md for required arguments.
- /guidelines: npm run annotation -- guidelines. Read .claude/commands/guidelines.md for required arguments.
- /retention-review: npm run annotation -- retention-review. Read .claude/commands/retention-review.md for required arguments.
- /log: npm run annotation -- log. Read .claude/commands/log.md for required arguments.
- /import: npm run annotation -- import. Read .claude/commands/import.md for required arguments.
- /release: npm run annotation -- release. Read .claude/commands/release.md for required arguments.
- /detail: npm run annotation -- detail. Read .claude/commands/detail.md for required arguments.
- /history: npm run annotation -- history. Read .claude/commands/history.md for required arguments.
- /weekly-review: npm run annotation -- weekly-review. Read .claude/commands/weekly-review.md for required arguments.
- /draft-review-note: npm run annotation -- draft-review-note. Read .claude/commands/draft-review-note.md for required arguments.
- /export: npm run annotation -- export. Read .claude/commands/export.md for required arguments.
- /projects: npm run annotation -- projects. Read .claude/commands/projects.md for required arguments.
- /items: npm run annotation -- items. Read .claude/commands/items.md for required arguments.
- /queue: npm run annotation -- queue. Read .claude/commands/queue.md for required arguments.
- /attention: npm run annotation -- attention. Read .claude/commands/attention.md for required arguments.
- /disagreements: npm run annotation -- disagreements. Read .claude/commands/disagreements.md for required arguments.
- /coverage: npm run annotation -- coverage. Read .claude/commands/coverage.md for required arguments.
- /reviewer-workload: npm run annotation -- reviewer-workload. Read .claude/commands/reviewer-workload.md for required arguments.
- /compliance: npm run annotation -- compliance. Read .claude/commands/compliance.md for required arguments.
- /imports: npm run annotation -- imports. Read .claude/commands/imports.md for required arguments.
- /releases: npm run annotation -- releases. Read .claude/commands/releases.md for required arguments.
- /audit: npm run annotation -- audit. Read .claude/commands/audit.md for required arguments.

- /view and /docs render read-only branded HTML.
- /customise writes a migration with tests and applies it to the authorised database.
- /new-view extends the reporting without adding a front end.

## Review rules

One classification question per project, with one or more labels per answer. Annotations are append-only. Only each actor's latest answer counts. A guideline change invalidates old annotations and decisions. A changed annotation, privacy check or hold invalidates the previous decision. Adjudication requires the configured count and a different reviewer. Release requires every project item to be ready and records an immutable snapshot in normal CLI use.

Imported answers remain source evidence. A resolved vendor answer is never treated as an independent local approval. Duplicate source lines with the same text are grouped, preserving every answer and original row. Changed existing source records are rejected; use a new source snapshot name after reconciliation. No import silently deletes or replaces records.

Read docs/operations.md, docs/compliance.md and docs/replace-datasaur.md before real use. Database administrators can bypass CLI controls. Restrict the database to trusted operators and add verified identities before multi-user deployment.

Built and run through Omni by Enterprise DNA. https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=datasaur&utm_medium=instructions
