# Lens Schema Reference

This document defines the expected lens object structure in `src/data/lenses.js` and its derived runtime fields from `src/data/lensUtils.js`.

## 1. Source of Truth

- Stored data source: `LENS_DATA` in `src/data/lenses.js`
- Runtime enrichment: `deriveLens(lens)` in `src/data/lensUtils.js`
- Runtime domain object: `Lens` in `src/engine/index.js`

## 2. Authoring Rule

Only store canonical metadata in `lenses.js`.

Do not manually duplicate derived fields unless you intentionally want to override estimator behavior.

## 3. Required Stored Fields

The engine validates these fields:

- `shortName` (string)
- `name` (string)
- `aperture` (string)
- `type` (string)
- `origin` (string)
- `era` (string)
- `rarity` (number: 1-5)
- `character` (string)
- `tip` (string)
- `subjects` (string[])
- `minFocus` (number, meters)
- `focalLength` ({ min: number, max: number } or number)
- `weight` (number, grams)
- `contrast` (string)
- `flare` (string)
- `bokeh` (string)

## 4. Expanded Stored Fields (v2)

### 4.1 Optical Performance

- `sharpness`: `soft | medium | sharp | razor`
- `sharpnessCenter`: `soft | medium | sharp | razor`
- `sharpnessEdge`: `soft | medium | sharp | razor`
- `distortion`: `none | barrel | pincushion | fisheye`
- `vignetting`: `none | mild | strong`
- `colorRendering`: `warm | neutral | cool`

### 4.2 Mechanical

- `focusThrow` (number, degrees)
- `apertureBlades` (number, may be `0` for fixed aperture mirror lens)
- `apertureMin` (string, example `f/16`)
- `buildQuality`: `plastic | solid | tank`
- `mount` (string)
- `adaptableTo` (string[])

### 4.3 Creative/Metadata

- `weirdness` (1-5)
- `historicalSignificance` (1-5)
- `signatureRendering` (string)
- `outdoor` (boolean)
- `moods` (string[])
- `light` (string[])
- `weather` (string[])

### 4.4 Internal Utility Flag

- `_halfFrame` (boolean)

Used by `lensUtils` estimators to model stronger APS-C coverage vignetting for half-frame designs.

## 5. Known Enum Domains

### 5.1 Mood Tags

- `warm`
- `clinical`
- `cinematic`
- `lofi`

### 5.2 Light Tags

- `any`
- `bright sun`
- `golden hour`
- `low light`
- `night`
- `astro`
- `astrophotography`

### 5.3 Weather Tags

- `any`
- `sunny`
- `cloudy`
- `rain`
- `fog`
- `clear`

### 5.4 Traits

- Contrast: `low | medium | high`
- Flare: `prone | resistant | dreamy`
- Bokeh: `creamy | neutral | swirly | structured`

## 6. Derived Fields from `lensUtils`

`deriveLens()` computes/normalizes these runtime properties:

- `fov` -> `{ horizontal, vertical, diagonal, isFisheye }`
- `equivalentFL` -> APS-C to FF equivalent
- `perspective` -> `ultra-wide | wide | normal | telephoto | super-tele`
- `compression` -> `low | medium | high`
- `magnification` -> numeric ratio
- `closeFocusAbility` -> `macro | excellent | normal | poor`
- `distanceCategory` -> ordered subset of `close | medium | far`
- `sharpness` / `sharpnessCenter` / `sharpnessEdge` (if estimated)
- `distortion` (if estimated)
- `vignetting` (if estimated)

Stored values take precedence over estimates.

## 7. Derived Formula Highlights

### 7.1 Field of View

Rectilinear formula based on APS-C sensor constants. Fisheye short-circuits to 180 deg values.

### 7.2 Equivalent Focal Length

Uses crop factor 1.6x (Canon APS-C convention in this project).

### 7.3 Magnification

Approximation: `m = f / (d - f)` where:

- `f` is focal length in mm
- `d` is minimum focus distance in mm

## 8. Runtime Lens Capabilities Added by `Lens`

The `Lens` class exposes normalized capability getters used by scoring:

- `maxAperture`
- `focalMin`, `focalMax`, `focalMid`
- `focalClass`
- `closeFocusClass`
- `weightClass`
- `sharpnessValue`, `edgeSharpnessValue`
- `weirdnessValue`, `historicalValue`

And matching helpers:

- `matchesSubject`
- `matchesMood`
- `matchesLight`
- `matchesWeather`
- `matchesBokeh`
- `overlapsFocalClass`
- `supportsDistance`

## 9. Minimal Lens Example

```js
{
  id: 99,
  shortName: "EXAMPLE 50",
  name: "Example Lens 50mm f/2",
  aperture: "f/2",
  minFocus: 0.45,
  focalLength: { min: 50, max: 50 },
  weight: 260,

  sharpness: "sharp",
  sharpnessCenter: "sharp",
  sharpnessEdge: "medium",
  distortion: "none",
  vignetting: "mild",
  colorRendering: "neutral",

  contrast: "medium",
  flare: "resistant",
  bokeh: "neutral",

  focusThrow: 220,
  apertureBlades: 7,
  apertureMin: "f/16",
  buildQuality: "solid",
  mount: "M42",
  adaptableTo: ["Canon EF-M", "Sony E"],

  type: "Prime",
  origin: "Japanese",
  era: "1970s",
  weirdness: 2,
  historicalSignificance: 2,
  signatureRendering: "Balanced rendering",

  character: "Balanced all-round vintage prime",
  tip: "Use as neutral baseline glass",
  rarity: 2,
  outdoor: true,
  subjects: ["street", "portrait"],
  moods: ["clinical"],
  light: ["any"],
  weather: ["any"],
}
```

## 10. Data QA Checklist Before Commit

- All required fields are present.
- Numeric values are actually numbers (not numeric strings).
- Tag values match known enum domains.
- `focalLength.min <= focalLength.max`.
- `rarity`, `weirdness`, `historicalSignificance` are in expected ranges.
- `npm run build` succeeds.
