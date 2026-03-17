// ─────────────────────────────────────────────────────────────────
//  ENGINE — src/engine/index.js
//
//  Three classes, each with a single responsibility:
//    Lens            → represents one physical lens
//    LensCollection  → manages the set of lenses
//    ScoringEngine   → the algorithm that picks a lens
//
//  The UI (App.jsx) only imports from here and from lenses.js.
//  To change how picking works, edit WEIGHTS or ScoringEngine.score().
//  To add a lens, edit lenses.js only.
// ─────────────────────────────────────────────────────────────────

// ── Lens ─────────────────────────────────────────────────────────
export class Lens {
  constructor(data) {
    Object.assign(this, data);
  }

  // Numeric aperture (e.g. "f/1.4" → 1.4) for math
  get maxAperture() {
    return parseFloat(this.aperture.replace("f/", ""));
  }

  // True if any subject tag overlaps with a query string
  matchesSubject(query) {
    const q = query.toLowerCase();
    return this.subjects.some(s => s.includes(q) || q.includes(s));
  }

  // True if any mood tag overlaps with a query string
  matchesMood(query) {
    const q = query.toLowerCase();
    return this.moods.some(m => m.includes(q) || q.includes(m));
  }

  // True if any light tag overlaps with a query string
  matchesLight(query) {
    const q = query.toLowerCase();
    return this.light.includes("any") || this.light.some(l => l.includes(q) || q.includes(l));
  }
}

// ── LensCollection ────────────────────────────────────────────────
export class LensCollection {
  constructor(rawData) {
    // Accepts plain objects from lenses.js — wraps each in a Lens instance
    this.lenses = rawData.map(d => (d instanceof Lens ? d : new Lens(d)));
  }

  get count() { return this.lenses.length; }

  getById(id)  { return this.lenses.find(l => l.id === id) ?? null; }

  random()     { return this.lenses[Math.floor(Math.random() * this.lenses.length)]; }

  // Add a new lens at runtime (used by the in-app editor)
  add(rawData) {
    const maxId = Math.max(0, ...this.lenses.map(l => l.id));
    this.lenses = [...this.lenses, new Lens({ ...rawData, id: maxId + 1 })];
  }

  // Replace a lens by id (used by the in-app editor)
  update(id, rawData) {
    this.lenses = this.lenses.map(l => l.id === id ? new Lens({ ...rawData, id }) : l);
  }

  // Remove a lens by id
  remove(id) {
    this.lenses = this.lenses.filter(l => l.id !== id);
  }
}

// ── ScoringEngine ─────────────────────────────────────────────────
export class ScoringEngine {
  // All scoring constants in one place — tune freely
  static WEIGHTS = {
    subject:   4,     // points for matching subject tag
    mood:      1.5,   // subtle mood nudge
    light:     2,     // general light tag match
    lowLight:  4,     // aperture bonus in low / night light
    astroTop:  7,     // astro bonus for f/1.4
    astroStep: 2,     // score drop per aperture stop beyond f/1.4
    astroPen: -2,     // floor penalty for very slow lenses in astro
    outdoor:   1,     // outdoor location bonus
    indoor:    2,     // indoor location bonus
    chaos:     2.5,   // max random float added to every lens score
    moodChaos: 3,     // extra random when mood is "Chaotic & Wild"
    wildPickN: 4,     // pick from top-N when wild pick fires
    wildProb:  0.28,  // probability of surprising wild pick
  };

  // Score a single lens against a condition set
  static score(lens, cond) {
    const W = ScoringEngine.WEIGHTS;
    let s = 0;

    // Subject match
    const subj = (cond.subject || "").toLowerCase();
    if (subj && lens.matchesSubject(subj)) s += W.subject;

    // Mood nudge
    const mood = (cond.mood || "").toLowerCase();
    if (mood) {
      if (mood.includes("warm")     && lens.matchesMood("warm"))     s += W.mood;
      if (mood.includes("clinical") && lens.matchesMood("clinical")) s += W.mood;
      if (mood.includes("chaotic"))                                   s += Math.random() * W.moodChaos;
    }

    // Light conditions
    const light = (cond.light || "").toLowerCase();
    if (light) {
      if (light.includes("astro")) {
        // Astrophotography: heavy aperture-speed bias
        const stops = (lens.maxAperture - 1.4) / 0.5;
        s += Math.max(W.astroPen, W.astroTop - stops * W.astroStep);
      } else if (light.includes("low light")) {
        if (lens.maxAperture <= 1.8) s += W.lowLight;
        if (lens.maxAperture <= 2.2) s += W.lowLight / 2;
        if (lens.matchesLight("any")) s += 1;
      } else {
        if (lens.matchesLight("any"))  s += 1;
        if (lens.matchesLight(light))  s += W.light;
      }
    }

    // Location
    const loc = (cond.location || "").toLowerCase();
    if (loc === "indoor"  && !lens.outdoor) s += W.indoor;
    if (loc === "outdoor" &&  lens.outdoor) s += W.outdoor;

    // Base chaos — keeps every spin a little surprising
    s += Math.random() * W.chaos;

    return s;
  }

  // Pick the best lens from a collection given conditions
  static pick(collection, cond) {
    const W = ScoringEngine.WEIGHTS;

    // Pure random if no conditions set, or subject is Wild
    const isPureRandom = !Object.values(cond).some(Boolean) || cond.subject === "🎲 Wild";
    if (isPureRandom) return { lens: collection.random(), wild: true };

    const ranked = collection.lenses
      .map(lens => ({ lens, score: ScoringEngine.score(lens, cond) }))
      .sort((a, b) => b.score - a.score);

    // Wild pick: occasionally choose from top-N instead of top-1
    const isWildPick = Math.random() < W.wildProb;
    const idx = isWildPick ? Math.floor(Math.random() * Math.min(W.wildPickN, ranked.length)) : 0;

    return { lens: ranked[idx].lens, wild: isWildPick };
  }
}

// ── Condition option labels (UI only, edit freely) ─────────────────
export const OPTIONS = {
  subject:  ["Street", "Landscape", "Macro", "Nature", "🎲 Wild"],
  light:    ["Bright Sun", "Golden Hour", "Low Light / Night", "Astrophotography"],
  location: ["Outdoor", "Indoor"],
  mood:     ["Warm & Organic", "Clinical & Sharp", "Chaotic & Wild"],
  weather:  ["☀ Sunny", "☁ Cloudy", "🌧 Rain", "🌫 Fog"],
};

// Blank template for the in-app lens editor
export const LENS_TEMPLATE = {
  shortName: "",
  name: "",
  aperture: "f/2.8",
  type: "Prime",
  origin: "",
  era: "",
  character: "",
  tip: "",
  rarity: 2,
  outdoor: true,
  subjects: [],
  moods: [],
  light: ["any"],
};
