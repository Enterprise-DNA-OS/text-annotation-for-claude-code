# Operate the desk

Use npm run migrate to apply numbered migrations. Local PGlite is the default. Set DATABASE_URL for PostgreSQL. Dates use UTC. Date-only inputs require a real calendar date. Run the demo only on an empty disposable database; the seed refuses to mix examples into an existing project database.

All writes run inside a transaction with table locks. Latest annotations are selected per case-insensitive actor. Decision validity is tied to item revision and guideline version. Assignment changes do not change labels; annotation, hold and privacy evidence changes invalidate the decision. Every write records its actor label in audit. A database owner can bypass these controls. These are not verified multi-user identities: add authentication and permission rules before sharing a service.

npm run annotation -- export writes a full private JSON archive including original source CSVs and all annotation and decision history. Add --release=<code> for the frozen training payload. A release stores a canonical-content SHA-256 fingerprint. This is a checksum, not a digital signature or tamper-proof audit. Releases remain unchanged through the CLI when later labels change.

Stop all processes before copying .data/db for a PGlite backup. Restore to a separate DATA_DIR, run projects and weekly-review, and compare archive counts and release hashes. For PostgreSQL use the provider's backup and restore tools, then rehearse the same checks in an isolated database. JSON export is a portable archive, not an automatic restore command. Keep originals until the restore rehearsal passes.

Reports and exports include private text and evidence. OUTPUT_DIR chooses their root. Linux file creation requests private modes; on Windows use account and folder ACLs. Do not serve these directories publicly. Retention reviews cover source CSVs, generated documents, releases and backups. The CLI has no destructive purge command.
