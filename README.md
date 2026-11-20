# Text Annotation for Claude Code

Own the text, the labels and the reasons behind them. Plan annotation batches, settle disagreements and freeze reviewed training datasets in a database you control.

## Three ways to use it

- **Do it yourself:** free MIT source. Run the demo with Claude Code, Codex, OpenCode or Cursor. Use one command library.
- **We customise it:** Enterprise DNA brings your Datasaur exports across and builds your labels, checks, connections and screens. Setup fee, then a retainer.
- **We run it for you:** installed, connected and operated through **Omni by Enterprise DNA**, for a setup fee then a retainer. [Book 30 minutes with Sam](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=datasaur&utm_medium=readme).

## Quick start

Node 20 or newer, on Windows or Linux. PGlite runs locally without a server; PostgreSQL uses DATABASE_URL.

```bash
npm install
npm run demo
npm run annotation -- queue
npm run annotation -- disagreements
npm run annotation -- weekly-review
npm run view
npm run docs
npm test
```

The demo has seven synthetic examples across two projects: one ready, one disagreement, unfinished labels, missing evidence, a held example and an overdue retention review. Seeding twice leaves it unchanged. Never seed a working database.

## The annotation week

/queue plans the batch, /annotate records a decision and its reason, /disagreements prepares the calibration meeting, /adjudicate records an independent review, and /release freezes the final dataset. /weekly-review combines progress, attention, disagreements, evidence and label coverage. /draft-review-note creates a private draft and never sends it.

One question per project. Each answer is a sorted set of labels. Multiple projects can represent different questions on the same source text. This base handles text classification, including multi-label answers. It does not claim to reproduce a multimedia annotation editor, token spans, bounding boxes, audio transcription, model training or an outsourced workforce.

## Bring your Datasaur history

```bash
npm run annotation -- import datasaur --project=DEMO --file=fixtures/datasaur.csv --map=fixtures/datasaur-map.json --source=first-export --owner=Rae --due=2099-01-01 --actor="Import operator" --dry-run
```

Map your actual row-label export headers once, then repeat without --dry-run. The supplied CSV is synthetic and follows the documented row format, not a downloaded customer specimen. Every original row and source answer is retained. Repeated lines with the same text become one item with all answers preserved. Changed records under an existing source identifier fail instead of overwriting history. [Full switch guide](docs/replace-datasaur.md).

## Ten questions your own desk answers

1. Which examples are overdue and who owns them? `attention`
2. Where do reviewers disagree under the current guidelines? `disagreements`
3. Which labels have no approved examples? `coverage`
4. Which reviewers still have labels from an old guideline? `reviewer-workload`
5. Which records have no accuracy and privacy evidence? `compliance`
6. Which dataset has an overdue retention review? `compliance`
7. What changed between the first label and the final decision? `history`
8. Which imported answers were unresolved at the source? `detail`
9. What exact examples and labels went into a training release? `export --release=<code>`
10. Which project is ready, and which one is waiting for adjudication? `projects`

These are implemented queries over your text, local review rules and evidence. They are not an unsupported claim that Datasaur cannot offer similar reports.

## Commands

- `help`: see [.claude/commands/help.md](.claude/commands/help.md).
- `add-project`: see [.claude/commands/add-project.md](.claude/commands/add-project.md).
- `add-item`: see [.claude/commands/add-item.md](.claude/commands/add-item.md).
- `assign`: see [.claude/commands/assign.md](.claude/commands/assign.md).
- `annotate`: see [.claude/commands/annotate.md](.claude/commands/annotate.md).
- `adjudicate`: see [.claude/commands/adjudicate.md](.claude/commands/adjudicate.md).
- `privacy-check`: see [.claude/commands/privacy-check.md](.claude/commands/privacy-check.md).
- `hold`: see [.claude/commands/hold.md](.claude/commands/hold.md).
- `unhold`: see [.claude/commands/unhold.md](.claude/commands/unhold.md).
- `guidelines`: see [.claude/commands/guidelines.md](.claude/commands/guidelines.md).
- `retention-review`: see [.claude/commands/retention-review.md](.claude/commands/retention-review.md).
- `log`: see [.claude/commands/log.md](.claude/commands/log.md).
- `import`: see [.claude/commands/import.md](.claude/commands/import.md).
- `release`: see [.claude/commands/release.md](.claude/commands/release.md).
- `detail`: see [.claude/commands/detail.md](.claude/commands/detail.md).
- `history`: see [.claude/commands/history.md](.claude/commands/history.md).
- `weekly-review`: see [.claude/commands/weekly-review.md](.claude/commands/weekly-review.md).
- `draft-review-note`: see [.claude/commands/draft-review-note.md](.claude/commands/draft-review-note.md).
- `export`: see [.claude/commands/export.md](.claude/commands/export.md).
- `projects`: see [.claude/commands/projects.md](.claude/commands/projects.md).
- `items`: see [.claude/commands/items.md](.claude/commands/items.md).
- `queue`: see [.claude/commands/queue.md](.claude/commands/queue.md).
- `attention`: see [.claude/commands/attention.md](.claude/commands/attention.md).
- `disagreements`: see [.claude/commands/disagreements.md](.claude/commands/disagreements.md).
- `coverage`: see [.claude/commands/coverage.md](.claude/commands/coverage.md).
- `reviewer-workload`: see [.claude/commands/reviewer-workload.md](.claude/commands/reviewer-workload.md).
- `compliance`: see [.claude/commands/compliance.md](.claude/commands/compliance.md).
- `imports`: see [.claude/commands/imports.md](.claude/commands/imports.md).
- `releases`: see [.claude/commands/releases.md](.claude/commands/releases.md).
- `audit`: see [.claude/commands/audit.md](.claude/commands/audit.md).

All commands accept --json. Mutations require --actor. Names, codes and ID fragments resolve without case sensitivity; an ambiguous match lists choices and exits 1. Flags use --name=value. Labels are separated with semicolons inside a quoted argument.

## Paperwork and views

brand.json sets the business name, colours and logo. npm run docs generates a dataset review card, an adjudication evidence record for every example, and a manifest for each local release. npm run view creates a read-only weekly dashboard. /customise adds your fields and rules through a tested migration. /new-view adds a report.

## Your first hour: ten things to ask for

1. Put our name on the dataset cards.
2. Show today's review queue.
3. Explain the cancellation disagreement.
4. Find labels with no approved examples.
5. Show whose labels use old guidance.
6. Preview our source export without saving it.
7. Record the evidence behind a privacy check.
8. Draft the next calibration note.
9. Add our dataset owner field with /customise.
10. Add a release readiness view with /new-view.

## Operating boundaries

Imported labels need local review. Every release requires all project examples to be ready, including current annotations, independent adjudication and evidence checks. Actor labels are not verified logins, and this tool does not certify legal compliance. Release means a local snapshot, not publication. Keep the actual purpose, retention decisions and personal information under your organisation's control. Hosting, agent use and operation remain your costs.

[Compliance rules](docs/compliance.md), [operations and backup](docs/operations.md), [scope](docs/why-no-front-end.md), [research](docs/research.md). MIT. Not affiliated with Datasaur or Anthropic.
