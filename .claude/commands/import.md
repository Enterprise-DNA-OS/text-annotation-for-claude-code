# /import

Run the recorded workflow below and report its result.

```bash
npm run annotation -- import datasaur --project=DEMO --file=fixtures/datasaur.csv --map=fixtures/datasaur-map.json --source=export-2026-11-20 --owner=Rae --due=2099-01-01 --actor="Import operator" --dry-run
```

Inspect actual headers and stable identifiers first. This fixture is synthetic. Preview first, reconcile source rows against grouped examples, then repeat without --dry-run when authorised. Import keeps source answers as evidence, never as local approvals.
