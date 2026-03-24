# Scoring OS Reference

This document describes the Organic Scoring System implemented in `src/engine/index.js`.

## 1. Core Objects

- `ConditionProfile`: normalizes raw UI selections.
- `OrganicScoringSystem`: computes per-lens score + explainable breakdown.
- `ScoringEngine`: public facade (`pick`, `scoreWithBreakdown`).

## 2. Breakdown Buckets

Every lens receives a score contribution in these buckets:

- `subject`
- `mood`
- `light`
- `weather`
- `location`
- `traits`
- `bokeh`
- `randomness`

Final score is the sum of all bucket scores.

## 3. Scoring Phases (Execution Order)

`scoreLens()` executes these methods in sequence:

1. `_scoreSubject`
2. `_scoreMood`
3. `_scoreLight`
4. `_scoreWeather`
5. `_scoreTraits`
6. `_scoreLocation`
7. `_scoreBokeh`
8. `_scoreCrossInfluence`
9. Randomness add-on (`chaos`)

Order matters because the cross-influence phase uses context flags set by earlier phases.

## 4. Context Flags

The engine tracks intra-score context so criteria can influence each other:

- `subjectMatch`
- `moodMatchCount`
- `lightMatched`
- `weatherMatched`
- `locationMatched`
- `focalMatched`
- `focusMatched`
- `weightMatched`
- `bokehMatched`

These are used for coherence bonuses and contradiction penalties.

## 5. Subject Phase

`_scoreSubject` combines direct and inferred fit:

- Direct subject tag match -> `subject` bucket.
- Subject model checks:
  - focal class fit
  - distance category fit
  - close-focus/magnification expectations
  - edge sharpness and distortion suitability
  - bokeh profile suitability
  - optional outdoor and portability fit

If geometry is mismatched, contradiction penalty is applied.

## 6. Mood Phase

`_scoreMood` handles both explicit and aesthetic fit:

- Direct mood tag match.
- Mood model matching for:
  - color rendering
  - bokeh style
  - flare behavior
  - contrast tendency
  - sharpness floor
  - distortion and vignetting character
  - compression style

Special case: `chaotic` mood introduces random mood boost and rewards higher `weirdness`.

## 7. Light Phase

`_scoreLight` is condition-specific:

- `astro`: aperture speed curve + focal suitability + fisheye penalty.
- `low light`: aperture thresholds + strong-vignetting caution.
- general light tags: direct compatibility via `matchesLight`.

Additional style coupling:

- Bright sun rewards flare resistance and high contrast.
- Golden hour rewards warm rendering and creamy/swirly bokeh.

## 8. Weather Phase

`_scoreWeather` evaluates direct tag compatibility and atmospheric behavior:

- Direct weather match.
- Sunny/clear: flare resistance + contrast stability bonuses.
- Cloudy/fog: dreamy/prone flare and warm/neutral color bonuses.
- Rain: build quality bonus; heavy-lens mobility penalty.

## 9. Traits Phase

`_scoreTraits` evaluates explicit technical constraints:

- Focal class match (`wide`, `standard`, `tele`, `super tele`)
- Focus mode match (`close`, `normal`)
- Weight class match (`light`, `medium`, `heavy`)
- Contrast direct match
- Flare direct match

Mismatch penalties are applied for focal/focus/weight divergence.

## 10. Location Phase

`_scoreLocation` evaluates environment handling:

- Indoor condition rewards indoor-leaning lenses (`outdoor === false`).
- Outdoor condition rewards outdoor-ready lenses (`outdoor === true`).
- Indoor heavy-lens penalty.
- Outdoor build-quality bonus for `solid`/`tank`.

## 11. Bokeh Phase

`_scoreBokeh` includes:

- Direct bokeh request match.
- Bokeh subcriteria model coupling with:
  - subject
  - mood
  - light
  - weather
  - focus mode

This allows bokeh style to become a bridge criterion across other categories.

## 12. Cross-Influence Phase

`_scoreCrossInfluence` adds coherence bonuses when independent criteria align:

- Subject + mood + bokeh trinity bonus.
- Subject + focal coherence bonus.
- Light + weather coherence bonus.
- Location + ergonomic fit bonus.
- Cinematic mood + historical significance bonus.
- Chaotic mood + weirdness reinforcement.

This phase is the core mechanism that makes the system "organic".

## 13. Randomness and Wild Behavior

Randomness is intentionally layered:

1. Per-lens `chaos` additive score in every evaluation.
2. Candidate diversification with `wildProb` and `wildN`.
3. Full random pick when no conditions are active or subject is wild.

This prevents repetitive top-1 lock while preserving logical scoring structure.

## 14. Weight Tuning Guide

All scalar controls are in `ScoringEngine.WEIGHTS`.

Typical tuning effects:

- Increase `subject`, `focal`, `focus` -> more deterministic technical fit.
- Increase `synergy` -> stronger multi-criterion coherence.
- Increase absolute value of `contradiction` -> stricter mismatch rejection.
- Increase `chaos` or `wildProb` -> more variety.
- Decrease `moodChaos` -> less volatility under chaotic mood.

## 15. Practical Debug Workflow

1. Pick one fixed condition set in UI.
2. Spin multiple times and inspect `WHY THIS LENS` breakdown rows.
3. Identify over/under-represented buckets.
4. Tune corresponding weights.
5. Rebuild and retest.

Repeat until top picks are both explainable and creatively diverse.
