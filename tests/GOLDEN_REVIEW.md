# Golden dataset review process

`fixtures/golden-vocab.json` contains 150 regression anchors.

- Entries marked `manual-override` were explicitly corrected in V3.2.1.
- Entries marked `two-source-consensus` match the two supplied alphabetical PDF sources, but are **not** claimed to be fully human-verified yet.

For human review, check `word`, `pos`, `ipa`, `meaning`, and topic relevance. After review, change the fixture's verification field to `human-reviewed` and commit the change. Regression tests will then protect that exact approved value.
