# Switch from Datasaur

This importer covers a single classification question in a row-label CSV export. It does not import spans, media, attachments, access permissions or project settings. Enterprise DNA can map those requirements into a custom installation.

1. In Datasaur, open the project and use File, then Export file or Export all files. Export all files preserves separate labeler versions and the REVIEW and ROOT copies. Download and keep the original archive privately. Do not merge different source documents unless their row identifiers are globally unique.
2. Select CSV for the row-label task. Include unresolved answers when required. Datasaur documents Line and Label Status columns when those answers are included. Actual text and question headers depend on the project. Choose an existing stable ID column, or Line when exported. If the file has neither, produce a new export with stable identifiers before importing.
3. Create the destination project with add-project, its label vocabulary, current guidance, required review count and retention review date. Map id, text, answer and optional status headers in a JSON mapping file. The default is Line, Text, Category and Label Status. Pick one question. Semicolons split multiple labels, matching Datasaur's documented row format. Use a separate source name per original file and exported snapshot.
4. Run the import below as a preview, reconcile physical CSV rows and grouped examples, then remove --dry-run. This is the same one-command import after mapping. The fixture is synthetic, not a vendor specimen.

```bash
npm run annotation -- import datasaur --project=DEMO --file=fixtures/datasaur.csv --map=fixtures/datasaur-map.json --source=review-export-v1 --owner=Rae --due=2099-01-01 --actor="Import operator" --dry-run
```

The preview writes nothing. Missing headers, unknown labels or statuses, malformed CSV and duplicate identifiers with different text fail the whole import. Repeated identifiers with identical text preserve all answers in one item. Conflicted and resolved rows for the same item remain separate source answers. The complete CSV, its hash, mapping and all source columns stay in the database. Source answers never become local reviewer identities or approvals.

An identical file and source are idempotent. An existing source item with different text or answers is rejected. Use a new source snapshot name after explicitly deciding how to reconcile versions. Reconcile omissions yourself: an import never deletes absent items. Do not treat REVIEW exports as a full historical audit, or a resolved answer as proof of independent human review.

Run privacy-check, annotate and adjudicate on the imported examples. Run weekly-review and compliance. Keep Datasaur available until counts, labels, review policy and a sample release match the intended workflow. A local release includes all ready items in its project and is blocked if any item remains unfinished.

Sources checked 2026-11-20: [export projects](https://docs.datasaur.ai/data-studio-projects/export-project), [supported formats](https://docs.datasaur.ai/compatibility-and-updates/supported-formats).
