# Evidence checks for text datasets

Checked 2026-11-20. These checks surface missing records. They do not decide whether collection, processing or disclosure is lawful, certify compliance, detect all personal information, or replace the business's privacy officer.

| Rule | Source and obligation | Implemented check |
|---|---|---|
| NZ-IPP8 | [NZ Privacy Commissioner, Principle 8](https://www.privacy.org.nz/privacy-principles/8/): reasonable steps before using or disclosing personal information to ensure accuracy and relevance | privacy-check records a named actor and evidence; missing evidence blocks release |
| NZ-IPP9 | [NZ Privacy Commissioner, Principle 9](https://www.privacy.org.nz/privacy-principles/9/): do not retain personal information longer than needed for lawful purposes | a project retention review date is mandatory; an overdue review is flagged and blocks release |
| LOCAL-REVIEW | Organisation policy, not legislation | configured annotation count, a different adjudicator, current guidance and unchanged item revision |
| LOCAL-HOLD | Organisation policy, not legislation | held examples cannot receive new labels or enter a release |

The dates are operator choices, not statutory retention periods. Completing a check records evidence, not proof that all data is lawful. A blank accuracy check cannot be bypassed by an imported resolved answer. Legal duties apply to source archives, releases, drafts and backups too. The CLI never deletes data automatically; an authorised retention procedure must cover all copies. AU deployments must add their applicable obligations before production. Keep synthetic or appropriately de-identified data for initial trials.
