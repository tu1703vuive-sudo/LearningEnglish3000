# V3.2.1 — Stabilization & Data Quality

- Trust-first vocabulary pack: no padding to exactly 3000; runtime currently uses the audited count.
- Removed supplemental padding entries and added explicit manual overrides/quarantine files.
- IPA formatting normalized typographically.
- Safe JSON state loading + schemaVersion migration.
- `mastered[]` is no longer a source of truth; mastery derives from SRS box >= 4.
- Removed `selectedLevel` and legacy state caches.
- Dynamic stage count and progress denominator (`vocab.length`).
- Quiz distractors use deterministic fallback tiers: same POS+topic → same POS → same topic → global.
- Fisher–Yates replaces `sort(() => Math.random() - .5)`.
- Duplicate visible answers are prevented after normalization.
- Core logic split into ES modules: data/state/SRS/session/quiz/audio/UI.
- Added Node built-in automated tests and a 150-entry regression fixture.
- Service Worker split into shell/data/API cache strategies with bounded dictionary runtime cache.
