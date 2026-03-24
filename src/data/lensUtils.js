// ─────────────────────────────────────────────────────────────────
//  LENS UTILS — src/data/lensUtils.js
//
//  All properties in this file are DERIVED from stored schema fields.
//  Nothing here should ever be duplicated into lenses.js directly.
//
//  Sensor constants assume Canon EOS M50 (APS-C):
//    Sensor width  = 23.5 mm
//    Sensor height = 15.6 mm
//    Crop factor   = 1.6×
// ─────────────────────────────────────────────────────────────────

const SENSOR_WIDTH  = 23.5;   // mm, APS-C horizontal
const SENSOR_HEIGHT = 15.6;   // mm, APS-C vertical
const CROP_FACTOR   = 1.6;

// ─── 1. FIELD OF VIEW ────────────────────────────────────────────
//
//  FOV = 2 × atan( sensorDimension / (2 × focalLength) ) → degrees
//
//  For fisheye lenses (distortion === "fisheye"), the rectilinear
//  formula underestimates true angular coverage. Return 180° instead.
//
//  Returns { horizontal, vertical, diagonal } in degrees.

export function computeFOV(focalLength, distortion = "none") {
  if (distortion === "fisheye") {
    return { horizontal: 180, vertical: 180, diagonal: 180, isFisheye: true };
  }

  const toDeg = (rad) => (rad * 180) / Math.PI;
  const fl = typeof focalLength === "object" ? focalLength.min : focalLength;

  const h = toDeg(2 * Math.atan(SENSOR_WIDTH  / (2 * fl)));
  const v = toDeg(2 * Math.atan(SENSOR_HEIGHT / (2 * fl)));
  const d = toDeg(
    2 * Math.atan(Math.sqrt(SENSOR_WIDTH ** 2 + SENSOR_HEIGHT ** 2) / (2 * fl))
  );

  return {
    horizontal: Math.round(h * 10) / 10,
    vertical:   Math.round(v * 10) / 10,
    diagonal:   Math.round(d * 10) / 10,
    isFisheye:  false,
  };
}

// ─── 2. EQUIVALENT FOCAL LENGTH (35mm full-frame) ─────────────────

export function computeEquivalentFL(focalLength) {
  if (typeof focalLength === "object") {
    return {
      min: Math.round(focalLength.min * CROP_FACTOR),
      max: Math.round(focalLength.max * CROP_FACTOR),
    };
  }
  return Math.round(focalLength * CROP_FACTOR);
}

// ─── 3. PERSPECTIVE CATEGORY ─────────────────────────────────────
//
//  Thresholds applied to NATIVE (APS-C) focal length.
//  Zooms are categorised by their widest focal length (min).
//
//  < 20 mm  → ultra-wide   (≡ < 32 mm FF)
//  20–35 mm → wide         (≡ 32–56 mm FF)
//  35–70 mm → normal       (≡ 56–112 mm FF)
//  70–200 mm→ telephoto    (≡ 112–320 mm FF)
//  > 200 mm → super-tele   (≡ > 320 mm FF)

export function computePerspective(focalLength) {
  const fl = typeof focalLength === "object" ? focalLength.min : focalLength;
  if (fl < 20)   return "ultra-wide";
  if (fl < 35)   return "wide";
  if (fl < 70)   return "normal";
  if (fl <= 200) return "telephoto";
  return "super-tele";
}

// ─── 4. COMPRESSION ──────────────────────────────────────────────
//
//  Perceived depth compression scales with focal length.
//  This is a photographic convention, not a strict physics value.
//
//  < 35 mm  → low
//  35–85 mm → medium
//  > 85 mm  → high

export function computeCompression(focalLength) {
  const fl = typeof focalLength === "object" ? focalLength.min : focalLength;
  if (fl < 35)  return "low";
  if (fl <= 85) return "medium";
  return "high";
}

// ─── 5. MAXIMUM MAGNIFICATION ─────────────────────────────────────
//
//  Thin-lens approximation:  m ≈ f / (d − f)
//
//  where f = focal length in mm, d = min focus distance in mm.
//
//  This slightly underestimates true magnification for retrofocus
//  designs but is accurate enough for comparative ranking.
//
//  For zooms, uses the longest focal length (maximises magnification).
//  Returns a decimal ratio (0.11 ≈ 1:9 ; 1.0 = 1:1 macro).

export function computeMagnification(focalLength, minFocusMetres) {
  const fl  = typeof focalLength === "object" ? focalLength.max : focalLength;
  const d   = minFocusMetres * 1000; // metres → mm
  const mag = fl / (d - fl);
  return Math.round(mag * 1000) / 1000; // 3 decimal places
}

// ─── 6. CLOSE-FOCUS ABILITY ──────────────────────────────────────
//
//  Derived from computed magnification:
//
//  m ≥ 0.5  → macro       (1:2 or better)
//  m ≥ 0.2  → excellent   (~1:5)
//  m ≥ 0.12 → normal
//  m < 0.12 → poor

export function computeCloseFocusAbility(focalLength, minFocusMetres) {
  const m = computeMagnification(focalLength, minFocusMetres);
  if (m >= 0.5)  return "macro";
  if (m >= 0.2)  return "excellent";
  if (m >= 0.12) return "normal";
  return "poor";
}

// ─── 7. DISTANCE CATEGORY ────────────────────────────────────────
//
//  Which shooting distances this lens is well-suited for.
//  Returns an array ordered ["close", "medium", "far"].
//
//  Rules:
//    close  → closeFocusAbility macro or excellent
//    close  → normal closeFocus and focal ≤ 50 mm
//    medium → focal ≤ 200 mm (virtually all lenses)
//    far    → focal ≥ 70 mm

export function computeDistanceCategory(focalLength, minFocusMetres) {
  const fl  = typeof focalLength === "object" ? focalLength.max : focalLength;
  const cfa = computeCloseFocusAbility(focalLength, minFocusMetres);
  const cats = new Set();

  if (cfa === "macro" || cfa === "excellent")   cats.add("close");
  if (cfa === "normal" && fl <= 50)             cats.add("close");
  if (fl <= 200)                                cats.add("medium");
  if (fl >= 70)                                 cats.add("far");

  if (cats.size === 0) cats.add("medium");

  const order = ["close", "medium", "far"];
  return [...cats].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

// ─── 8. DISTORTION ESTIMATE ──────────────────────────────────────
//
//  Fallback when optical test data is unavailable.
//  Stored lens.distortion always overrides this estimate.
//
//  Priority:
//  1. Fisheye type → fisheye
//  2. focal < 28 mm → barrel (pronounced)
//  3. focal 28–35 mm → barrel (mild)
//  4. focal 35–70 mm → none (normal primes / macros)
//  5. focal 70–200 mm → pincushion (mild)
//  6. focal > 200 mm → pincushion

export function estimateDistortion(focalLength, type) {
  const fl = typeof focalLength === "object" ? focalLength.min : focalLength;
  if (/fisheye/i.test(type)) return "fisheye";
  if (fl < 28)  return "barrel";
  if (fl < 36)  return "barrel";
  if (fl < 70)  return "none";
  if (fl <= 200) return "pincushion";
  return "pincushion";
}

// ─── 9. VIGNETTING ESTIMATE ──────────────────────────────────────
//
//  Score-based heuristic. Higher score = more vignetting.
//
//  Factors:
//    maxAperture ≤ f/1.4         → +2
//    maxAperture f/1.5–f/2.8     → +1
//    focalLength < 24 mm         → +2
//    focalLength 24–35 mm        → +1
//    type is Fisheye             → −2 (retrofocus fills frame)
//    halfFrame flag (Industar-69)→ +2 (image circle too small)
//
//  Score ≥ 3 → "strong"
//  Score 1–2 → "mild"
//  Score ≤ 0 → "none"

export function estimateVignetting(apertureStr, focalLength, type, halfFrame = false) {
  const fl   = typeof focalLength === "object" ? focalLength.min : focalLength;
  const fNum = parseFloat(apertureStr.replace("f/", ""));

  let score = 0;
  if (fNum <= 1.4)           score += 2;
  else if (fNum <= 2.8)      score += 1;
  if (fl < 24)               score += 2;
  else if (fl < 36)          score += 1;
  if (/fisheye/i.test(type)) score -= 2;
  if (halfFrame)             score += 2;

  if (score >= 3) return "strong";
  if (score >= 1) return "mild";
  return "none";
}

// ─── 10. SHARPNESS ESTIMATE ──────────────────────────────────────
//
//  Returns { overall, center, edge } based on lens type and origin.
//
//  Research basis:
//  - Macro lenses are optimised for flat-field, high-resolution work
//    → razor overall (Hexanon 55, Industar-61 L/Z)
//  - Lanthanum glass Soviet primes (Industar-61 series): exceptional
//    micro-contrast and resolution documented by photomacrography.net
//  - Cine primes optimised for motion, not still resolving power
//  - Fisheye: sharp center, characteristic edge falloff
//  - Early zoom lenses: medium overall, soft at edges

export function estimateSharpness(type, origin, focalLength, apertureStr) {
  if (type === "Macro") {
    return { overall: "razor", center: "razor", edge: "sharp" };
  }
  if (type === "Cine Prime") {
    return { overall: "medium", center: "sharp", edge: "soft" };
  }
  if (/fisheye/i.test(type)) {
    return { overall: "sharp", center: "sharp", edge: "soft" };
  }
  if (type === "Zoom" || type === "Tele Zoom") {
    return { overall: "medium", center: "medium", edge: "soft" };
  }
  if (origin === "Soviet" && type === "Prime") {
    return { overall: "sharp", center: "sharp", edge: "medium" };
  }
  const fNum = parseFloat(apertureStr.replace("f/", ""));
  if (fNum <= 1.4) {
    return { overall: "sharp", center: "sharp", edge: "medium" };
  }
  return { overall: "sharp", center: "sharp", edge: "medium" };
}

// ─── 11. FULL DERIVED PROFILE ─────────────────────────────────────
//
//  Accepts any raw lens object from lenses.js.
//  Stored properties take precedence over estimates.
//
//  Usage:
//    import { deriveLens } from "./lensUtils.js";
//    const full = deriveLens(rawLens);
//    console.log(full.fov.horizontal);  // → 26.4°
//    console.log(full.magnification);   // → 0.111

export function deriveLens(lens) {
  const fl   = lens.focalLength;
  const minF = lens.minFocus;

  const fov           = computeFOV(fl, lens.distortion);
  const equivalentFL  = computeEquivalentFL(fl);
  const perspective   = lens.perspective    ?? computePerspective(fl);
  const compression   = lens.compression    ?? computeCompression(fl);
  const magnification = computeMagnification(fl, minF);

  const closeFocusAbility = lens.closeFocusAbility ?? computeCloseFocusAbility(fl, minF);
  const distanceCategory  = lens.distanceCategory  ?? computeDistanceCategory(fl, minF);

  const sharpEst      = estimateSharpness(lens.type, lens.origin, fl, lens.aperture);
  const sharpness       = lens.sharpness       ?? sharpEst.overall;
  const sharpnessCenter = lens.sharpnessCenter ?? sharpEst.center;
  const sharpnessEdge   = lens.sharpnessEdge   ?? sharpEst.edge;

  const distortion = lens.distortion ?? estimateDistortion(fl, lens.type);
  const vignetting = lens.vignetting ?? estimateVignetting(
    lens.aperture, fl, lens.type, lens._halfFrame ?? false
  );

  return {
    ...lens,
    fov,
    equivalentFL,
    perspective,
    compression,
    magnification,
    closeFocusAbility,
    distanceCategory,
    sharpness,
    sharpnessCenter,
    sharpnessEdge,
    distortion,
    vignetting,
  };
}

// ─── 12. COLLECTION HELPERS ───────────────────────────────────────

/** Derive all lenses in a collection. */
export function deriveAll(lensArray) {
  return lensArray.map(deriveLens);
}

/** Filter by perspective category. */
export function byPerspective(lensArray, category) {
  return deriveAll(lensArray).filter((l) => l.perspective === category);
}

/** Filter by minimum magnification. */
export function byMagnification(lensArray, minMag) {
  return deriveAll(lensArray).filter((l) => l.magnification >= minMag);
}

/** Sort by weirdness descending. */
export function sortByWeirdness(lensArray) {
  return [...lensArray].sort((a, b) => (b.weirdness ?? 0) - (a.weirdness ?? 0));
}

/** Sort by historical significance descending. */
export function sortBySignificance(lensArray) {
  return [...lensArray].sort(
    (a, b) => (b.historicalSignificance ?? 0) - (a.historicalSignificance ?? 0)
  );
}
