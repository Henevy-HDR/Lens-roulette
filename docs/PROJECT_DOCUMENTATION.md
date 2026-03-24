# Project Documentation

## 1. Purpose

Lens Roulette helps pick a lens from a curated vintage collection by combining user conditions with an Organic Scoring System (OS).

The system is designed to be:

- Guided: honors explicit conditions such as subject, light, mood, weather, and lens traits.
- Organic: allows criteria to influence each other instead of scoring in isolation.
- Creative: keeps a controlled randomness layer so results feel alive and not deterministic every time.

## 2. Technology Stack

- Runtime: React 18
- Bundler: Vite 5
- Language: JavaScript (ES modules)
- Package manager: npm

## 3. High-Level Architecture

The project is split into three core layers:

1. Presentation layer (`src/App.jsx`)
2. Domain + scoring layer (`src/engine/index.js`)
3. Data + optical derivation layer (`src/data/lenses.js`, `src/data/lensUtils.js`)

### 3.1 Presentation Layer (`src/App.jsx`)

Responsibilities:

- Render condition controls (subject, mood, light, weather, focal, focus, etc.).
- Animate the slot-style spinning experience.
- Call the scoring API (`ScoringEngine.pick`) with current conditions.
- Render result card and scoring breakdown.

Important state values:

- `cond`: current condition selections.
- `spin`: animation lock and transition state.
- `disp`: temporary displayed lens while reel spins.
- `result`: chosen `Lens` object.
- `why`: score breakdown returned by engine.

### 3.2 Domain + Scoring Layer (`src/engine/index.js`)

This file is the single runtime source of truth for the lens model and selection logic.

Primary classes:

- `Lens`: runtime domain object for one lens.
- `LensCollection`: aggregate/root for lens operations (load, random pick, CRUD helpers).
- `ConditionProfile`: normalized representation of user conditions.
- `OrganicScoringSystem`: modular, phase-based scoring engine.
- `ScoringEngine`: stable facade used by the UI.

### 3.3 Data + Optical Derivation Layer

- `src/data/lenses.js`: canonical stored lens metadata and creative tags.
- `src/data/lensUtils.js`: derived optical computations (FOV, equivalent focal length, perspective, compression, magnification, close-focus, distance category, and estimators).

`Lens` constructor runs `deriveLens()` so each runtime lens includes both stored and derived properties.

## 4. Runtime Data Flow

1. App imports `LENS_DATA` and builds a `LensCollection`.
2. `LensCollection` constructs each `Lens`.
3. `Lens` calls `deriveLens()` to enrich data.
4. User chooses conditions in UI.
5. UI calls `ScoringEngine.pick(collection, cond)`.
6. `ScoringEngine` creates a `ConditionProfile`, delegates to `OrganicScoringSystem`.
7. `OrganicScoringSystem` scores every lens and returns ranked results.
8. Engine returns selected lens plus `breakdown`.
9. UI shows selected lens and the explanatory reasoning rows.

## 5. Organic Scoring Model (OS) at a Glance

The OS follows a phase pipeline:

1. Subject phase
2. Mood phase
3. Light phase
4. Weather phase
5. Traits phase
6. Location phase
7. Bokeh phase
8. Cross-influence phase
9. Controlled randomness phase

Each phase contributes to one or more breakdown buckets:

- `subject`
- `mood`
- `light`
- `weather`
- `location`
- `traits`
- `bokeh`
- `randomness`

Final score is the sum of all bucket scores.

## 6. OOP Design Principles Used

### 6.1 Encapsulation

- `Lens` encapsulates normalization, optics-derived capability getters, and matching behavior (`matchesSubject`, `matchesMood`, `matchesLight`, etc.).
- `ConditionProfile` encapsulates all condition parsing and normalization.
- `OrganicScoringSystem` encapsulates scoring behavior and internal scoring context.

### 6.2 Single Responsibility

- `LensCollection` handles lens set management.
- `ConditionProfile` handles condition interpretation.
- `OrganicScoringSystem` handles ranking logic.
- `ScoringEngine` exposes a backward-compatible API to the UI.

### 6.3 Open/Closed Style

Adding new scoring dimensions generally means:

1. Add normalized input in `ConditionProfile`.
2. Add a dedicated `_scoreX` method in `OrganicScoringSystem`.
3. Call it in `scoreLens` pipeline.
4. Add relevant weight values to `ScoringEngine.WEIGHTS`.

No UI rewrite is required if existing breakdown keys are preserved.

## 7. Condition Normalization Rules

Normalization converts free-text-like UI labels to stable internal keys.

Examples:

- `"Low Light / Night"` -> `"low light"`
- `"Astrophotography"` -> `"astro"`
- `"☁ Cloudy"` -> `"cloudy"`
- `"Warm & Organic"` -> mood tags include `"warm"`
- `"Chaotic & Wild"` -> mood tags include `"chaotic"`

This normalization makes scoring resilient to stylistic label changes.

## 8. Randomness Strategy

There are two randomness layers:

1. Per-lens additive `chaos` in each score.
2. Occasional non-top pick selection (`wildProb`) from top N candidates (`wildN`).

Additionally, if no conditions are set or subject is wild, the engine returns a pure random lens.

## 9. Maintenance Workflow

### 9.1 Add a Lens

1. Add a new object to `LENS_DATA` in `src/data/lenses.js`.
2. Include all required fields from schema reference.
3. Keep derived fields out of the stored object unless intentionally overriding estimator values.
4. Run `npm run build`.

### 9.2 Tune Scoring Behavior

1. Edit values in `ScoringEngine.WEIGHTS`.
2. For logic-level changes, update methods inside `OrganicScoringSystem`.
3. Verify with representative conditions in UI.
4. Run `npm run build`.

### 9.3 Add New Criteria

1. Add UI option group in `OPTIONS` if needed.
2. Normalize new condition in `ConditionProfile`.
3. Implement scoring phase and optional cross-influence coupling.
4. Add bucket details for explainability.

## 10. Console Validation and Data Hygiene

`Lens._validate()` logs warnings when:

- Required fields are missing.
- Aperture cannot be parsed.
- Focal ranges are invalid.
- Tag values are outside known enums.

This protects runtime integrity while still allowing development flexibility.

## 11. Build and Run

```bash
npm install
npm run dev
npm run build
npm run preview
```

Default dev URL: `http://localhost:5173`

## 12. Legacy and Migration Notes

- `src/data/lenses_OLD.js` is legacy reference and not loaded by runtime.
- Runtime uses `src/data/lenses.js` + derivation from `lensUtils.js`.
- Engine facade (`ScoringEngine`) preserves existing app integration while internals evolve.

## 13. Recommended Next Documentation Steps

- Add a sample condition matrix and expected top-3 outputs for regression testing.
- Add lightweight unit tests around condition normalization and scoring invariants.
- Add per-lens "capability profile" snapshots to help debug ranking drift after weight tuning.
