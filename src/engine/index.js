// ─────────────────────────────────────────────────────────────────
//  ENGINE — src/engine/index.js
//
//  Single source of truth for the lens domain model and scoring.
//  UI imports LensCollection, ScoringEngine, and OPTIONS from here
//  and lens data from src/data/lenses.js.
//
//  This version adds an OOP Organic Scoring System (OS): criteria
//  do not score in isolation; they also influence each other.
// ─────────────────────────────────────────────────────────────────

import { deriveLens } from "../data/lensUtils.js";

const KNOWN_MOODS = ["warm", "clinical", "cinematic", "lofi"];
const KNOWN_LIGHT = ["any", "bright sun", "golden hour", "low light", "night", "astro", "astrophotography"];
const KNOWN_WEATHER = ["any", "sunny", "cloudy", "rain", "fog", "clear"];
const KNOWN_CONTRAST = ["low", "medium", "high"];
const KNOWN_FLARE = ["prone", "resistant", "dreamy"];
const KNOWN_BOKEH = ["creamy", "neutral", "swirly", "structured"];
const KNOWN_SHARPNESS = ["soft", "medium", "sharp", "razor"];
const KNOWN_DISTORTION = ["none", "barrel", "pincushion", "fisheye"];
const KNOWN_VIGNETTING = ["none", "mild", "strong"];

const SHARPNESS_SCORE = { soft: 1, medium: 2, sharp: 3, razor: 4 };
const CONTRAST_SCORE = { low: 1, medium: 2, high: 3 };
const WEIGHT_ORDER = ["light", "medium", "heavy"];

function normalizeTag(value) {
  return String(value || "").toLowerCase().trim();
}

function normalizeLight(value) {
  const v = normalizeTag(value);
  if (!v) return "";
  if (v.includes("astro")) return "astro";
  if (v.includes("low light") || v.includes("night")) return "low light";
  if (v.includes("golden")) return "golden hour";
  if (v.includes("sun")) return "bright sun";
  return v;
}

function normalizeWeather(value) {
  const v = normalizeTag(value).replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
  if (!v) return "";
  const bits = v.split(" ");
  return bits[bits.length - 1] || "";
}

function normalizeFocalCondition(value) {
  const v = normalizeTag(value);
  if (v.includes("super")) return "super tele";
  if (v.includes("tele")) return "tele";
  if (v.includes("standard") || v.includes("normal")) return "standard";
  if (v.includes("wide")) return "wide";
  return "";
}

function normalizeFocusCondition(value) {
  const v = normalizeTag(value);
  if (v.includes("close")) return "close";
  if (v.includes("normal")) return "normal";
  return "";
}

function normalizeWeightCondition(value) {
  const v = normalizeTag(value);
  if (v.includes("light")) return "light";
  if (v.includes("medium")) return "medium";
  if (v.includes("heavy")) return "heavy";
  return "";
}

function parseMoodTags(value) {
  const v = normalizeTag(value);
  const tags = [];
  if (v.includes("warm")) tags.push("warm");
  if (v.includes("clinical")) tags.push("clinical");
  if (v.includes("cinematic")) tags.push("cinematic");
  if (v.includes("lofi")) tags.push("lofi");
  if (v.includes("chaotic") || v.includes("wild")) tags.push("chaotic");
  return tags;
}

function titleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

// ── Lens ─────────────────────────────────────────────────────────
export class Lens {
  constructor(data) {
    const source = { ...data };
    if (!source.light) source.light = ["any"];
    if (!source.weather) source.weather = ["any"];

    if (typeof source.focalLength === "number") {
      source.focalLength = { min: source.focalLength, max: source.focalLength };
    }

    const derived = deriveLens(source);
    Object.assign(this, source, derived);

    this._subjectsNorm = new Set((this.subjects || []).map(normalizeTag));
    this._moodsNorm = new Set((this.moods || []).map(normalizeTag));
    this._lightNorm = new Set((this.light || ["any"]).map(normalizeLight));
    this._weatherNorm = new Set((this.weather || ["any"]).map(normalizeWeather));
    this._distanceNorm = new Set((this.distanceCategory || []).map(normalizeTag));

    this._validate();
  }

  get apertureRange() {
    const values = String(this.aperture || "")
      .match(/\d+(?:\.\d+)?/g)
      ?.map(Number)
      .filter((n) => Number.isFinite(n));
    return values?.length ? values : [];
  }

  // Fastest aperture in the range (smaller number = faster glass)
  get maxAperture() {
    if (!this.apertureRange.length) return Number.POSITIVE_INFINITY;
    return Math.min(...this.apertureRange);
  }

  get focalMin() {
    return this.focalLength?.min ?? null;
  }

  get focalMax() {
    return this.focalLength?.max ?? null;
  }

  get focalMid() {
    if (this.focalMin == null || this.focalMax == null) return null;
    return (this.focalMin + this.focalMax) / 2;
  }

  get focalClass() {
    const p = normalizeTag(this.perspective);
    if (p.includes("ultra") || p === "wide") return "wide";
    if (p === "normal") return "standard";
    if (p === "super-tele") return "super tele";
    if (p === "telephoto") return "tele";
    return "";
  }

  get closeFocusClass() {
    const c = normalizeTag(this.closeFocusAbility);
    if (c === "macro" || c === "excellent") return "close";
    if (c === "normal") return this.minFocus <= 0.3 ? "close" : "normal";
    if (c === "poor") return "normal";
    return this.minFocus <= 0.3 ? "close" : "normal";
  }

  get weightClass() {
    if (typeof this.weight !== "number") return "";
    if (this.weight <= 300) return "light";
    if (this.weight <= 600) return "medium";
    return "heavy";
  }

  get sharpnessValue() {
    return SHARPNESS_SCORE[normalizeTag(this.sharpness)] ?? 2;
  }

  get edgeSharpnessValue() {
    return SHARPNESS_SCORE[normalizeTag(this.sharpnessEdge)] ?? this.sharpnessValue;
  }

  get contrastValue() {
    return CONTRAST_SCORE[normalizeTag(this.contrast)] ?? 2;
  }

  get weirdnessValue() {
    return Number(this.weirdness ?? 1) || 1;
  }

  get historicalValue() {
    return Number(this.historicalSignificance ?? 1) || 1;
  }

  overlapsFocal(min, max) {
    if (this.focalMin == null || this.focalMax == null) return false;
    return this.focalMin <= max && this.focalMax >= min;
  }

  overlapsFocalClass(focalClass) {
    const target = normalizeFocalCondition(focalClass);
    if (target === "wide") return this.overlapsFocal(10, 35);
    if (target === "standard") return this.overlapsFocal(35, 70);
    if (target === "tele") return this.overlapsFocal(70, 200);
    if (target === "super tele") return this.overlapsFocal(200, 1000);
    return false;
  }

  matchesSubject(query) {
    const q = normalizeTag(query);
    if (!q) return false;
    for (const s of this._subjectsNorm) {
      if (s.includes(q) || q.includes(s)) return true;
    }
    return false;
  }

  hasSubject(subject) {
    return this.matchesSubject(subject);
  }

  matchesMood(moodTag) {
    return this._moodsNorm.has(normalizeTag(moodTag));
  }

  matchesLight(lightTag) {
    if (this._lightNorm.has("any")) return true;
    const t = normalizeLight(lightTag);
    if (!t) return false;
    for (const l of this._lightNorm) {
      if (l.includes(t) || t.includes(l)) return true;
    }
    return false;
  }

  matchesWeather(weatherTag) {
    if (this._weatherNorm.has("any")) return true;
    const t = normalizeWeather(weatherTag);
    if (!t) return false;
    for (const w of this._weatherNorm) {
      if (w.includes(t) || t.includes(w)) return true;
    }
    return false;
  }

  matchesBokeh(bokehTag) {
    return normalizeTag(this.bokeh) === normalizeTag(bokehTag);
  }

  supportsDistance(distanceTag) {
    const d = normalizeTag(distanceTag);
    return this._distanceNorm.has(d);
  }

  _validate() {
    const warn = (msg) => console.warn(`[Lens "${this.name ?? "?"}"] ${msg}`);

    [
      "shortName",
      "name",
      "aperture",
      "type",
      "origin",
      "era",
      "rarity",
      "character",
      "tip",
      "subjects",
      "minFocus",
      "focalLength",
      "weight",
      "contrast",
      "flare",
      "bokeh",
    ].forEach((f) => {
      if (this[f] == null || this[f] === "") warn(`Missing required field: ${f}`);
    });

    if (!Number.isFinite(this.maxAperture)) warn(`aperture "${this.aperture}" could not be parsed`);
    if (this.focalMin == null || this.focalMax == null) warn("focalLength should be { min, max } in mm");
    if (this.focalMin != null && this.focalMax != null && this.focalMin > this.focalMax) {
      warn("focalLength min > max");
    }

    if (this.minFocus != null && typeof this.minFocus !== "number") warn("minFocus should be number (meters)");
    if (this.weight != null && typeof this.weight !== "number") warn("weight should be number (grams)");
    if (this.rarity != null && (this.rarity < 1 || this.rarity > 5)) warn(`rarity should be 1–5, got ${this.rarity}`);

    (this.moods || []).forEach((m) => {
      if (!KNOWN_MOODS.includes(normalizeTag(m))) warn(`Unknown mood tag "${m}"`);
    });
    (this.light || []).forEach((l) => {
      const k = normalizeLight(l);
      if (k && !KNOWN_LIGHT.includes(k) && k !== "any") warn(`Unknown light tag "${l}"`);
    });
    (this.weather || []).forEach((w) => {
      const k = normalizeWeather(w);
      if (k && !KNOWN_WEATHER.includes(k) && k !== "any") warn(`Unknown weather tag "${w}"`);
    });

    if (this.contrast && !KNOWN_CONTRAST.includes(normalizeTag(this.contrast))) warn(`Unknown contrast "${this.contrast}"`);
    if (this.flare && !KNOWN_FLARE.includes(normalizeTag(this.flare))) warn(`Unknown flare "${this.flare}"`);
    if (this.bokeh && !KNOWN_BOKEH.includes(normalizeTag(this.bokeh))) warn(`Unknown bokeh "${this.bokeh}"`);
    if (this.sharpness && !KNOWN_SHARPNESS.includes(normalizeTag(this.sharpness))) warn(`Unknown sharpness "${this.sharpness}"`);
    if (this.distortion && !KNOWN_DISTORTION.includes(normalizeTag(this.distortion))) warn(`Unknown distortion "${this.distortion}"`);
    if (this.vignetting && !KNOWN_VIGNETTING.includes(normalizeTag(this.vignetting))) warn(`Unknown vignetting "${this.vignetting}"`);
  }
}

// ── LensCollection ────────────────────────────────────────────────
export class LensCollection {
  static HIDDEN_SUBJECTS = new Set(["portrait", "travel", "event", "experimental", "creative", "lowlight", "indoor"]);

  constructor(rawData) {
    this.lenses = rawData.map((d, i) => (d instanceof Lens ? d : new Lens({ id: d.id ?? i + 1, ...d })));
  }

  get count() {
    return this.lenses.length;
  }

  getById(id) {
    return this.lenses.find((l) => l.id === id) ?? null;
  }

  random() {
    return this.lenses[Math.floor(Math.random() * this.lenses.length)];
  }

  get uiSubjects() {
    return [...new Set(this.lenses.flatMap((l) => l.subjects || []))]
      .map((s) => normalizeTag(s))
      .filter((s) => s && !LensCollection.HIDDEN_SUBJECTS.has(s))
      .sort()
      .map(titleCase);
  }

  add(rawData) {
    const maxId = Math.max(0, ...this.lenses.map((l) => l.id ?? 0));
    this.lenses = [...this.lenses, new Lens({ ...rawData, id: maxId + 1 })];
  }

  update(id, rawData) {
    this.lenses = this.lenses.map((l) => (l.id === id ? new Lens({ ...rawData, id }) : l));
  }

  remove(id) {
    this.lenses = this.lenses.filter((l) => l.id !== id);
  }
}

// ── ConditionProfile ──────────────────────────────────────────────
class ConditionProfile {
  constructor(raw = {}) {
    this.raw = raw;

    this.subject = normalizeTag(raw.subject).replace("🎲", "").trim();
    this.moodRaw = normalizeTag(raw.mood);
    this.moodTags = parseMoodTags(raw.mood);
    this.hasChaoticMood = this.moodTags.includes("chaotic");

    this.light = normalizeLight(raw.light);
    this.weather = normalizeWeather(raw.weather);
    this.location = normalizeTag(raw.location);

    this.focal = normalizeFocalCondition(raw.focal);
    this.focus = normalizeFocusCondition(raw.focus);
    this.weight = normalizeWeightCondition(raw.weight);
    this.contrast = normalizeTag(raw.contrast);
    this.flare = normalizeTag(raw.flare);
    this.bokeh = normalizeTag(raw.bokeh);

    this.activeCount = Object.values(raw).filter(Boolean).length;
    this.isWild = this.subject === "wild" || this.subject.includes("wild") || this.activeCount === 0;
  }
}

// ── Organic Scoring System (OS) ───────────────────────────────────
class OrganicScoringSystem {
  static SUBJECT_MODEL = {
    street:      { focal: ["wide", "standard"], distance: ["medium"], bokeh: ["neutral", "swirly", "creamy"] },
    landscape:   { focal: ["wide"], distance: ["far"], edgeSharpness: 3, distortion: ["none", "barrel"] },
    architecture:{ focal: ["wide"], distance: ["medium", "far"], edgeSharpness: 3, distortion: ["none"] },
    macro:       { focal: ["standard", "tele"], distance: ["close"], closeFocus: true, minMagnification: 0.2 },
    portrait:    { focal: ["standard", "tele"], distance: ["medium"], bokeh: ["creamy", "swirly"], fastAperture: 2.8 },
    nature:      { focal: ["wide", "standard", "tele"], distance: ["medium", "far", "close"] },
    wildlife:    { focal: ["tele", "super tele"], distance: ["far"], outdoor: true },
    astronomy:   { focal: ["wide", "super tele"], distance: ["far"], fastAperture: 2.8 },
    travel:      { focal: ["wide", "standard"], distance: ["medium"], weight: "light" },
  };

  static MOOD_MODEL = {
    warm: {
      colors: ["warm"],
      bokeh: ["creamy", "swirly"],
      flare: ["dreamy"],
      contrast: ["medium"],
    },
    clinical: {
      colors: ["neutral", "cool"],
      bokeh: ["neutral", "structured"],
      flare: ["resistant"],
      sharpnessMin: 3,
      distortion: ["none"],
      vignetting: ["none", "mild"],
    },
    cinematic: {
      colors: ["warm", "neutral"],
      bokeh: ["creamy", "swirly"],
      flare: ["dreamy", "prone"],
      vignetting: ["mild", "strong"],
      compression: ["medium", "high"],
    },
    lofi: {
      colors: ["warm"],
      bokeh: ["swirly", "structured"],
      flare: ["dreamy", "prone"],
      distortion: ["barrel", "fisheye"],
      vignetting: ["mild", "strong"],
    },
  };

  static BOKEH_SUBCRITERIA = {
    creamy: {
      subjects: ["portrait", "nature", "macro"],
      moods: ["warm", "cinematic"],
      light: ["golden hour", "low light"],
      weather: ["cloudy", "fog"],
      closeFocus: true,
      normalFocus: false,
    },
    neutral: {
      subjects: ["street", "travel", "landscape"],
      moods: ["clinical"],
      light: ["bright sun"],
      weather: ["sunny", "clear"],
      closeFocus: false,
      normalFocus: true,
    },
    swirly: {
      subjects: ["portrait", "street", "nature"],
      moods: ["cinematic", "lofi", "warm"],
      light: ["golden hour", "low light"],
      weather: ["sunny", "cloudy"],
      closeFocus: true,
      normalFocus: false,
    },
    structured: {
      subjects: ["architecture", "landscape", "macro", "astronomy"],
      moods: ["clinical"],
      light: ["bright sun", "astro"],
      weather: ["clear", "sunny"],
      closeFocus: false,
      normalFocus: true,
    },
  };

  constructor(weights) {
    this.W = weights;
  }

  _emptyBreakdown() {
    return {
      subject: { score: 0, detail: [] },
      mood: { score: 0, detail: [] },
      light: { score: 0, detail: [] },
      weather: { score: 0, detail: [] },
      location: { score: 0, detail: [] },
      traits: { score: 0, detail: [] },
      bokeh: { score: 0, detail: [] },
      randomness: { score: 0, detail: [] },
    };
  }

  _add(breakdown, key, value, detail) {
    if (!value || !breakdown[key]) return;
    breakdown[key].score += value;
    if (detail) breakdown[key].detail.push(detail);
  }

  _scoreSubject(lens, profile, breakdown, context) {
    if (!profile.subject) return;
    const subjectMatch = lens.matchesSubject(profile.subject);
    context.subjectMatch = subjectMatch;

    if (subjectMatch) {
      this._add(breakdown, "subject", this.W.subject, `Subject ${profile.subject}`);
    }

    const model = OrganicScoringSystem.SUBJECT_MODEL[profile.subject];
    if (!model) return;

    if (model.focal?.includes(lens.focalClass)) {
      this._add(breakdown, "traits", this.W.subjectSynergy, `${profile.subject} geometry`);
      context.subjectGeometryAligned = true;
    } else {
      this._add(breakdown, "traits", this.W.contradiction, `${profile.subject} geometry mismatch`);
    }

    if (model.distance?.some((d) => lens.supportsDistance(d))) {
      this._add(breakdown, "traits", this.W.subjectDistance, `${profile.subject} distance`);
    }

    if (model.closeFocus && lens.closeFocusClass === "close") {
      this._add(breakdown, "traits", this.W.subjectClose, `${profile.subject} close-focus`);
    }

    if (model.minMagnification && (lens.magnification ?? 0) >= model.minMagnification) {
      this._add(breakdown, "traits", this.W.subjectClose, `${profile.subject} magnification`);
    }

    if (model.edgeSharpness && lens.edgeSharpnessValue >= model.edgeSharpness) {
      this._add(breakdown, "traits", this.W.subjectOptics, `${profile.subject} edge acuity`);
    }

    if (model.distortion?.includes(normalizeTag(lens.distortion))) {
      this._add(breakdown, "traits", this.W.subjectOptics, `${profile.subject} distortion profile`);
    }

    if (typeof model.fastAperture === "number" && lens.maxAperture <= model.fastAperture) {
      this._add(breakdown, "light", this.W.subjectOptics, `${profile.subject} aperture headroom`);
    }

    if (model.bokeh?.includes(normalizeTag(lens.bokeh))) {
      this._add(breakdown, "bokeh", this.W.bokehSubject, `${normalizeTag(lens.bokeh)} for ${profile.subject}`);
    }

    if (model.outdoor && lens.outdoor) {
      this._add(breakdown, "location", this.W.subjectDistance, `${profile.subject} outdoor fit`);
    }

    if (model.weight && lens.weightClass === model.weight) {
      this._add(breakdown, "traits", this.W.subjectDistance, `${profile.subject} portability`);
    }
  }

  _scoreMood(lens, profile, breakdown, context) {
    if (!profile.moodTags.length) return;

    profile.moodTags.forEach((tag) => {
      if (tag === "chaotic") {
        const chaosBoost = Math.random() * this.W.moodChaos;
        this._add(breakdown, "mood", chaosBoost, "Chaotic mood");
        this._add(breakdown, "randomness", (lens.weirdnessValue / 5) * this.W.weirdnessMood, `Weirdness ${lens.weirdnessValue}/5`);
        return;
      }

      if (lens.matchesMood(tag)) {
        this._add(breakdown, "mood", this.W.mood, `${titleCase(tag)} mood`);
        context.moodMatchCount += 1;
      }

      const model = OrganicScoringSystem.MOOD_MODEL[tag];
      if (!model) return;

      if (model.colors?.includes(normalizeTag(lens.colorRendering))) {
        this._add(breakdown, "mood", this.W.moodSynergy, `${titleCase(tag)} color rendering`);
      }

      if (model.bokeh?.includes(normalizeTag(lens.bokeh))) {
        this._add(breakdown, "bokeh", this.W.bokehMood, `${normalizeTag(lens.bokeh)} supports ${tag}`);
      }

      if (model.flare?.includes(normalizeTag(lens.flare))) {
        this._add(breakdown, "traits", this.W.moodSynergy, `${titleCase(tag)} flare behavior`);
      }

      if (model.contrast?.includes(normalizeTag(lens.contrast))) {
        this._add(breakdown, "traits", this.W.moodSynergy, `${titleCase(tag)} contrast style`);
      }

      if (model.sharpnessMin && lens.sharpnessValue >= model.sharpnessMin) {
        this._add(breakdown, "traits", this.W.moodSynergy, `${titleCase(tag)} sharpness floor`);
      }

      if (model.distortion?.includes(normalizeTag(lens.distortion))) {
        this._add(breakdown, "traits", this.W.moodSynergy, `${titleCase(tag)} distortion character`);
      }

      if (model.vignetting?.includes(normalizeTag(lens.vignetting))) {
        this._add(breakdown, "traits", this.W.moodSynergy, `${titleCase(tag)} vignetting profile`);
      }

      if (model.compression?.includes(normalizeTag(lens.compression))) {
        this._add(breakdown, "traits", this.W.moodSynergy, `${titleCase(tag)} compression`);
      }
    });
  }

  _scoreLight(lens, profile, breakdown, context) {
    if (!profile.light) return;

    if (profile.light === "astro") {
      const stops = (lens.maxAperture - 1.4) / 0.5;
      const astroScore = Math.max(this.W.astroPenalty, this.W.astroFast - stops * this.W.astroStep);
      this._add(breakdown, "light", astroScore, "Astro speed bias");

      if (lens.focalClass === "wide" || lens.focalClass === "super tele") {
        this._add(breakdown, "traits", this.W.lightSynergy, "Astro focal class");
      }

      if (normalizeTag(lens.distortion) === "fisheye") {
        this._add(breakdown, "traits", this.W.contradiction / 2, "Astro edge distortion penalty");
      }

      context.lightMatched = true;
      return;
    }

    if (profile.light === "low light") {
      if (lens.maxAperture <= 1.8) {
        this._add(breakdown, "light", this.W.lowLightFast, "Fast glass");
        context.lightMatched = true;
      }
      if (lens.maxAperture <= 2.2) {
        this._add(breakdown, "light", this.W.lowLightMid, "Low-light reserve");
      }
      if (normalizeTag(lens.vignetting) === "strong") {
        this._add(breakdown, "traits", this.W.contradiction / 2, "Strong vignetting in low light");
      }
      return;
    }

    if (lens.matchesLight(profile.light)) {
      this._add(breakdown, "light", this.W.lightGeneral, profile.light);
      context.lightMatched = true;
    }

    if (profile.light === "bright sun") {
      if (normalizeTag(lens.flare) === "resistant") {
        this._add(breakdown, "traits", this.W.lightSynergy, "Bright-sun flare control");
      }
      if (normalizeTag(lens.contrast) === "high") {
        this._add(breakdown, "traits", this.W.lightSynergy, "Bright-sun contrast retention");
      }
    }

    if (profile.light === "golden hour") {
      if (normalizeTag(lens.colorRendering) === "warm") {
        this._add(breakdown, "mood", this.W.lightSynergy, "Golden-hour warm rendering");
      }
      if (["creamy", "swirly"].includes(normalizeTag(lens.bokeh))) {
        this._add(breakdown, "bokeh", this.W.bokehLight, `${normalizeTag(lens.bokeh)} in golden hour`);
      }
    }
  }

  _scoreWeather(lens, profile, breakdown, context) {
    if (!profile.weather) return;

    if (lens.matchesWeather(profile.weather)) {
      this._add(breakdown, "weather", this.W.weather, profile.weather);
      context.weatherMatched = true;
    }

    const flare = normalizeTag(lens.flare);
    const contrast = normalizeTag(lens.contrast);

    if (["sunny", "clear"].includes(profile.weather)) {
      if (flare === "resistant") this._add(breakdown, "traits", this.W.weatherSynergy, "Sun weather flare control");
      if (contrast === "high") this._add(breakdown, "traits", this.W.weatherSynergy, "Sun weather micro-contrast");
    }

    if (["cloudy", "fog"].includes(profile.weather)) {
      if (["dreamy", "prone"].includes(flare)) {
        this._add(breakdown, "mood", this.W.weatherSynergy, "Atmospheric flare behavior");
      }
      if (["warm", "neutral"].includes(normalizeTag(lens.colorRendering))) {
        this._add(breakdown, "mood", this.W.weatherSynergy, "Atmospheric color rendering");
      }
    }

    if (profile.weather === "rain") {
      if (["tank", "solid"].includes(normalizeTag(lens.buildQuality))) {
        this._add(breakdown, "location", this.W.weatherSynergy, "Weather-ready build");
      }
      if (lens.weightClass === "heavy") {
        this._add(breakdown, "traits", this.W.contradiction / 2, "Rain mobility penalty");
      }
    }
  }

  _scoreTraits(lens, profile, breakdown, context) {
    if (profile.focal) {
      if (lens.overlapsFocalClass(profile.focal)) {
        this._add(breakdown, "traits", this.W.focal, `${titleCase(profile.focal)} focal`);
        context.focalMatched = true;
      } else {
        this._add(breakdown, "traits", this.W.contradiction, `${titleCase(profile.focal)} mismatch`);
      }
    }

    if (profile.focus) {
      const isClose = lens.closeFocusClass === "close";
      if (profile.focus === "close" && isClose) {
        this._add(breakdown, "traits", this.W.focus, "Close focus");
        context.focusMatched = true;
      }
      if (profile.focus === "normal" && !isClose) {
        this._add(breakdown, "traits", this.W.focus, "Normal focus");
        context.focusMatched = true;
      }
      if (!context.focusMatched) {
        this._add(breakdown, "traits", this.W.contradiction / 2, "Focus mismatch");
      }
    }

    if (profile.weight && lens.weightClass) {
      if (profile.weight === lens.weightClass) {
        this._add(breakdown, "traits", this.W.weight, `${titleCase(profile.weight)} weight`);
        context.weightMatched = true;
      } else {
        const lensIndex = WEIGHT_ORDER.indexOf(lens.weightClass);
        const condIndex = WEIGHT_ORDER.indexOf(profile.weight);
        const distance = Math.abs(lensIndex - condIndex);
        this._add(breakdown, "traits", this.W.contradiction * distance * 0.5, "Weight mismatch");
      }
    }

    if (profile.contrast && normalizeTag(lens.contrast) === profile.contrast) {
      this._add(breakdown, "traits", this.W.contrast, `Contrast ${profile.contrast}`);
      context.contrastMatched = true;
    }

    if (profile.flare && normalizeTag(lens.flare) === profile.flare) {
      this._add(breakdown, "traits", this.W.flare, `Flare ${profile.flare}`);
      context.flareMatched = true;
    }
  }

  _scoreLocation(lens, profile, breakdown, context) {
    if (!profile.location) return;

    if (profile.location === "indoor" && !lens.outdoor) {
      this._add(breakdown, "location", this.W.locationIndoor, "Indoor usage");
      context.locationMatched = true;
    }

    if (profile.location === "outdoor" && lens.outdoor) {
      this._add(breakdown, "location", this.W.locationOutdoor, "Outdoor usage");
      context.locationMatched = true;
    }

    if (profile.location === "indoor" && lens.weightClass === "heavy") {
      this._add(breakdown, "traits", this.W.contradiction / 2, "Indoor handling penalty");
    }

    if (profile.location === "outdoor" && ["tank", "solid"].includes(normalizeTag(lens.buildQuality))) {
      this._add(breakdown, "location", this.W.locationSynergy, "Outdoor build confidence");
    }
  }

  _scoreBokeh(lens, profile, breakdown, context) {
    const lensBokeh = normalizeTag(lens.bokeh);
    const bokehProfile = OrganicScoringSystem.BOKEH_SUBCRITERIA[lensBokeh] ?? null;

    if (profile.bokeh && profile.bokeh === lensBokeh) {
      this._add(breakdown, "bokeh", this.W.bokehDirect, `Direct ${lensBokeh}`);
      context.bokehMatched = true;
    }

    if (!bokehProfile) return;

    if (profile.subject && bokehProfile.subjects.some((s) => profile.subject.includes(s) || s.includes(profile.subject))) {
      this._add(breakdown, "bokeh", this.W.bokehSubject, `${lensBokeh} for ${profile.subject}`);
    }

    profile.moodTags
      .filter((tag) => tag !== "chaotic")
      .filter((tag) => bokehProfile.moods.includes(tag))
      .forEach((tag) => {
        this._add(breakdown, "bokeh", this.W.bokehMood, `${lensBokeh} + ${tag}`);
      });

    if (profile.light && bokehProfile.light.includes(profile.light)) {
      this._add(breakdown, "bokeh", this.W.bokehLight, `${lensBokeh} in ${profile.light}`);
    }

    if (profile.weather && bokehProfile.weather.includes(profile.weather) && lens.matchesWeather(profile.weather)) {
      this._add(breakdown, "bokeh", this.W.bokehWeather, `${lensBokeh} in ${profile.weather}`);
    }

    if (profile.focus === "close" && lens.closeFocusClass === "close" && bokehProfile.closeFocus) {
      this._add(breakdown, "bokeh", this.W.bokehFocus, `${lensBokeh} close focus`);
    }

    if (profile.focus === "normal" && lens.closeFocusClass !== "close" && bokehProfile.normalFocus) {
      this._add(breakdown, "bokeh", this.W.bokehFocus, `${lensBokeh} normal focus`);
    }
  }

  _scoreCrossInfluence(lens, profile, breakdown, context) {
    // Subject + Mood + Bokeh trinity bonus
    if (context.subjectMatch && context.moodMatchCount > 0 && (context.bokehMatched || ["creamy", "swirly", "structured", "neutral"].includes(normalizeTag(lens.bokeh)))) {
      this._add(breakdown, "bokeh", this.W.synergy, "Subject-mood-bokeh synergy");
    }

    // Focal + Subject coherence bonus
    if (context.subjectMatch && context.focalMatched) {
      this._add(breakdown, "traits", this.W.synergy, "Subject-focal coherence");
    }

    // Light + Weather coherence
    if (context.lightMatched && context.weatherMatched) {
      if ((profile.light === "bright sun" && ["sunny", "clear"].includes(profile.weather)) ||
          (profile.light === "low light" && ["cloudy", "fog", "rain"].includes(profile.weather)) ||
          (profile.light === "astro" && profile.weather === "clear")) {
        this._add(breakdown, "light", this.W.synergy, "Light-weather coherence");
      }
    }

    // Location + Weight ergonomics
    if (context.locationMatched) {
      if (profile.location === "outdoor" && ["light", "medium"].includes(lens.weightClass)) {
        this._add(breakdown, "location", this.W.locationSynergy, "Outdoor mobility");
      }
      if (profile.location === "indoor" && lens.maxAperture <= 2.2) {
        this._add(breakdown, "location", this.W.locationSynergy, "Indoor exposure flexibility");
      }
    }

    // Cinematic look gets a small heritage bonus for iconic glass
    if (profile.moodTags.includes("cinematic") && lens.historicalValue >= 4) {
      this._add(breakdown, "mood", this.W.historical, `Historical rendering ${lens.historicalValue}/5`);
    }

    // Chaotic mood rewards weird lenses but still keeps boundaries via contradiction penalties above.
    if (profile.hasChaoticMood) {
      this._add(breakdown, "randomness", (lens.weirdnessValue / 5) * this.W.weirdnessMood, `Organic chaos ${lens.weirdnessValue}/5`);
    }
  }

  scoreLens(lens, profile) {
    const breakdown = this._emptyBreakdown();
    const context = {
      subjectMatch: false,
      subjectGeometryAligned: false,
      moodMatchCount: 0,
      lightMatched: false,
      weatherMatched: false,
      locationMatched: false,
      focalMatched: false,
      focusMatched: false,
      weightMatched: false,
      bokehMatched: false,
      contrastMatched: false,
      flareMatched: false,
    };

    this._scoreSubject(lens, profile, breakdown, context);
    this._scoreMood(lens, profile, breakdown, context);
    this._scoreLight(lens, profile, breakdown, context);
    this._scoreWeather(lens, profile, breakdown, context);
    this._scoreTraits(lens, profile, breakdown, context);
    this._scoreLocation(lens, profile, breakdown, context);
    this._scoreBokeh(lens, profile, breakdown, context);
    this._scoreCrossInfluence(lens, profile, breakdown, context);

    const chaos = Math.random() * this.W.chaos;
    this._add(breakdown, "randomness", chaos, "Organic chaos");

    const total = Object.values(breakdown).reduce((sum, b) => sum + b.score, 0);
    return { score: total, breakdown };
  }

  rank(collection, rawConditions) {
    const profile = rawConditions instanceof ConditionProfile ? rawConditions : new ConditionProfile(rawConditions);

    return collection.lenses
      .map((lens) => {
        const scored = this.scoreLens(lens, profile);
        return { lens, score: scored.score, breakdown: scored.breakdown };
      })
      .sort((a, b) => b.score - a.score);
  }

  pick(collection, rawConditions) {
    const profile = rawConditions instanceof ConditionProfile ? rawConditions : new ConditionProfile(rawConditions);

    if (profile.isWild) {
      return { lens: collection.random(), wild: true };
    }

    const ranked = this.rank(collection, profile);
    const goWild = Math.random() < this.W.wildProb;
    const idx = goWild ? Math.floor(Math.random() * Math.min(this.W.wildN, ranked.length)) : 0;
    return {
      lens: ranked[idx].lens,
      wild: goWild && idx > 0,
      breakdown: ranked[idx].breakdown,
    };
  }
}

// ── ScoringEngine facade (UI-compatible) ──────────────────────────
export class ScoringEngine {
  static WEIGHTS = {
    // Base criteria
    subject: 4,
    mood: 1.7,
    lightGeneral: 2,
    weather: 1.5,
    focal: 2.5,
    focus: 2,
    weight: 1.5,
    contrast: 1.3,
    flare: 1.3,
    bokehDirect: 2,

    // Organic links and synergies
    subjectSynergy: 1.3,
    subjectDistance: 0.9,
    subjectClose: 1.1,
    subjectOptics: 0.8,
    moodSynergy: 1,
    lightSynergy: 1,
    weatherSynergy: 0.9,
    locationSynergy: 0.8,
    bokehSubject: 0.9,
    bokehMood: 0.8,
    bokehLight: 0.8,
    bokehFocus: 0.8,
    bokehWeather: 0.6,
    synergy: 1.5,
    contradiction: -1.1,

    // Special contexts
    lowLightFast: 4,
    lowLightMid: 2,
    astroFast: 7,
    astroStep: 2,
    astroPenalty: -2,
    locationIndoor: 2,
    locationOutdoor: 1,
    historical: 0.7,
    weirdnessMood: 1.2,

    // Controlled randomness
    moodChaos: 2.8,
    chaos: 2.2,
    wildProb: 0.24,
    wildN: 4,
  };

  static _system() {
    return new OrganicScoringSystem(ScoringEngine.WEIGHTS);
  }

  static scoreWithBreakdown(lens, cond) {
    const domainLens = lens instanceof Lens ? lens : new Lens(lens);
    const profile = new ConditionProfile(cond);
    return ScoringEngine._system().scoreLens(domainLens, profile);
  }

  static pick(collection, cond) {
    const profile = new ConditionProfile(cond);
    return ScoringEngine._system().pick(collection, profile);
  }
}

// ── Condition option labels (UI only, edit freely) ────────────────
export const OPTIONS = {
  subject: ["Street", "Landscape", "Macro", "Nature", "Portrait", "🎲 Wild"],
  light: ["Bright Sun", "Golden Hour", "Low Light / Night", "Astrophotography"],
  location: ["Outdoor", "Indoor"],
  mood: ["Warm & Organic", "Clinical & Sharp", "Cinematic", "Lofi & Grain", "Chaotic & Wild"],
  weather: ["☀ Sunny", "☀ Clear", "☁ Cloudy", "🌧 Rain", "🌫 Fog"],
  focal: ["Wide", "Standard", "Tele", "Super Tele"],
  focus: ["Close Focus", "Normal Focus"],
  weight: ["Light", "Medium", "Heavy"],
  contrast: ["Low", "Medium", "High"],
  flare: ["Prone", "Resistant", "Dreamy"],
  bokeh: ["Creamy", "Neutral", "Swirly", "Structured"],
};

export const LENS_TEMPLATE = {
  shortName: "",
  name: "",
  aperture: "f/2.8",
  type: "Prime",
  origin: "",
  era: "",
  minFocus: 0.45,
  focalLength: { min: 50, max: 50 },
  weight: 300,

  // Optical
  sharpness: "medium",
  sharpnessCenter: "medium",
  sharpnessEdge: "medium",
  distortion: "none",
  vignetting: "mild",
  colorRendering: "neutral",
  contrast: "medium",
  flare: "resistant",
  bokeh: "neutral",

  // Mechanical
  focusThrow: 180,
  apertureBlades: 6,
  apertureMin: "f/16",
  buildQuality: "solid",
  mount: "",
  adaptableTo: [],

  // Creative
  weirdness: 2,
  historicalSignificance: 2,
  signatureRendering: "",

  character: "",
  tip: "",
  rarity: 2,
  outdoor: true,
  subjects: [],
  moods: [],
  light: ["any"],
  weather: ["any"],
};
