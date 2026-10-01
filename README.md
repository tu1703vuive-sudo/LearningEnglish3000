# English 3000 V3.2.1 — Stabilization & Data Quality

This release intentionally prioritizes correctness and maintainability over new UI features.

## Data
Runtime source: `data/vocab-clean.json`. The app does **not** require exactly 3000 entries. Untrusted/review rows are quarantined instead of padded back into Quiz.

Files:
- `data/vocab-clean.json` — runtime vocabulary
- `data/manual-overrides.json` — explicit reviewed corrections
- `data/quarantine.json` — excluded source rows
- `data/audit-report-v3.2.1.json` — audit summary
- `tests/fixtures/golden-vocab.json` — 150-entry regression fixture

The golden fixture is transparent: manual override anchors are reviewed; the rest are two-source-consensus regression entries and are **not falsely labelled fully human-reviewed**. Continue human review over time.

## Architecture
Core logic is split into ES modules under `src/`:
`state.js`, `data.js`, `srs.js`, `session.js`, `quiz-engine.js`, `audio.js`, `ui.js`, `utils.js`, `config.js`.

## Tests
No npm dependencies are required.

```bash
npm test
npm run audit
```

## Local run
Because V3.2.1 uses ES modules, serve it over HTTP:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## GitHub Pages safety gate

`.github/workflows/deploy-pages.yml` runs both automated tests and the vocabulary audit before deployment. A failing test/audit blocks the Pages deploy.

## Current audit snapshot

- Runtime trusted words: **2,994**
- Missing meaning / IPA / POS: **0 / 0 / 0**
- Manual overrides: **20**
- Source rows quarantined before runtime: **399**
- Topic mapping is intentionally conservative; only exact trusted mappings are kept, so topic coverage is incomplete rather than guessed.
