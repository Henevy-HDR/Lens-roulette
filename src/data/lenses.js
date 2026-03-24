// ─────────────────────────────────────────────────────────────────
//  LENS DATA — src/data/lenses.js  (v2 — expanded schema)
//
//  COMPUTED FIELDS — do NOT store these here; call deriveLens():
//    fov, equivalentFL, perspective, compression,
//    magnification, closeFocusAbility, distanceCategory
//
//  NEW STORED FIELDS IN v2:
//
//  ── Optical performance ──────────────────────────────────────────
//  sharpness         "soft" | "medium" | "sharp" | "razor"
//  sharpnessCenter   same scale, center of frame
//  sharpnessEdge     same scale, corners and edges
//  distortion        "none" | "barrel" | "pincushion" | "fisheye"
//  vignetting        "none" | "mild" | "strong"
//  colorRendering    "warm" | "neutral" | "cool"
//
//  ── Mechanical ───────────────────────────────────────────────────
//  focusThrow        degrees of barrel rotation MFD → infinity
//  apertureBlades    integer; 0 = fixed aperture (mirror lens)
//  apertureMin       string, e.g. "f/16"
//  buildQuality      "plastic" | "solid" | "tank"
//  mount             original lens mount
//  adaptableTo       array of target camera mounts via adapters
//
//  ── Creative ─────────────────────────────────────────────────────
//  weirdness         1–5 (5 = most unusual optical behaviour)
//  historicalSignificance  1–5 (5 = historically iconic)
//  signatureRendering  string — one defining optical trait
//
//  ── Internal flag (consumed by lensUtils.js estimators only) ────
//  _halfFrame        true if image circle is half-frame (18×24 mm)
// ─────────────────────────────────────────────────────────────────

export const LENS_DATA = [
  // ── 1 ──────────────────────────────────────────────────────────
  {
    id: 1,
    shortName: "TAKUMAR 50",
    name: "Super Takumar 50mm f/1.4 (8-element)",
    aperture: "f/1.4",
    minFocus: 0.45,
    focalLength: { min: 50, max: 50 },
    weight: 230,

    sharpness: "sharp",
    sharpnessCenter: "sharp",
    sharpnessEdge: "medium",
    contrast: "medium",
    flare: "dreamy",
    bokeh: "creamy",
    distortion: "none",
    vignetting: "strong",
    colorRendering: "warm",

    focusThrow: 270,
    apertureBlades: 8,
    apertureMin: "f/16",
    buildQuality: "tank",
    mount: "M42",
    adaptableTo: ["Canon EF-M", "Canon EF", "Sony E", "Micro Four Thirds", "Fujifilm X", "Nikon Z"],

    type: "Prime",
    origin: "Japanese",
    era: "1960s",
    weirdness: 3,
    historicalSignificance: 5,
    signatureRendering: "Thorium-induced warm spectral glow; swirling bokeh wide open",
    character: "Legendary thorium glass, glowing warmth, painterly bokeh and strong subject separation",
    tip: "The thorium element produces a warm spectral shift. Shoot wide open at sunset or indoors with point lights to reveal its creamy bokeh signature.",

    rarity: 4,
    outdoor: false,
    subjects: ["street", "portrait", "nature"],
    moods: ["warm", "cinematic", "lofi"],
    light: ["golden hour", "low light", "any"],
    weather: ["any"],
  },

  // ── 2 ──────────────────────────────────────────────────────────
  {
    id: 2,
    shortName: "VEGA-9 50",
    name: "Vega-9 50mm f/2.1 Cine",
    aperture: "f/2.1",
    minFocus: 0.9,
    focalLength: { min: 50, max: 50 },
    weight: 400,

    sharpness: "medium",
    sharpnessCenter: "sharp",
    sharpnessEdge: "soft",
    contrast: "medium",
    flare: "dreamy",
    bokeh: "swirly",
    distortion: "none",
    vignetting: "mild",
    colorRendering: "warm",

    focusThrow: 300,
    apertureBlades: 15,
    apertureMin: "f/16",
    buildQuality: "tank",
    mount: "Krasnogorsk (OCT-18)",
    adaptableTo: ["Canon EF-M", "Canon EF", "Sony E", "Micro Four Thirds"],

    type: "Cine Prime",
    origin: "Soviet",
    era: "1970s",
    weirdness: 4,
    historicalSignificance: 4,
    signatureRendering: "Subtle swirly bokeh; stepless aperture from 15-blade iris",
    character: "Classic Soviet cine rendering, subtle swirl, smooth focus throw and stepless aperture",
    tip: "Designed for motion picture cameras. Use the stepless aperture for smooth exposure transitions and embrace its organic vintage rendering.",

    rarity: 4,
    outdoor: true,
    subjects: ["street", "portrait", "landscape"],
    moods: ["cinematic", "warm", "lofi"],
    light: ["any", "golden hour"],
    weather: ["any"],
  },

  // ── 3 ──────────────────────────────────────────────────────────
  {
    id: 3,
    shortName: "FLEK 35",
    name: "Carl Zeiss Jena Flektogon 35mm f/2.4 MC",
    aperture: "f/2.4",
    minFocus: 0.19,
    focalLength: { min: 35, max: 35 },
    weight: 250,

    sharpness: "sharp",
    sharpnessCenter: "sharp",
    sharpnessEdge: "sharp",
    contrast: "high",
    flare: "resistant",
    bokeh: "structured",
    distortion: "barrel",
    vignetting: "mild",
    colorRendering: "neutral",

    focusThrow: 270,
    apertureBlades: 6,
    apertureMin: "f/16",
    buildQuality: "tank",
    mount: "M42",
    adaptableTo: ["Canon EF-M", "Canon EF", "Sony E", "Micro Four Thirds", "Fujifilm X", "Nikon Z"],

    type: "Prime",
    origin: "East German",
    era: "1970s",
    weirdness: 2,
    historicalSignificance: 5,
    signatureRendering: "19 cm extreme close focus; DDR high micro-contrast across the frame",
    character: "Legendary DDR wide angle with extreme close-focus, high micro-contrast and crisp texture",
    tip: "One of the closest-focusing vintage wides ever made. Move extremely close to foreground subjects to exaggerate perspective.",

    rarity: 4,
    outdoor: true,
    subjects: ["street", "landscape", "nature", "macro"],
    moods: ["clinical", "cinematic"],
    light: ["bright sun", "golden hour", "any"],
    weather: ["sunny", "cloudy"],
  },

  // ── 4 ──────────────────────────────────────────────────────────
  {
    id: 4,
    shortName: "VIVITAR 28",
    name: "Vivitar 28mm f/2.8 MC",
    aperture: "f/2.8",
    minFocus: 0.3,
    focalLength: { min: 28, max: 28 },
    weight: 250,

    sharpness: "sharp",
    sharpnessCenter: "sharp",
    sharpnessEdge: "medium",
    contrast: "high",
    flare: "resistant",
    bokeh: "structured",
    distortion: "barrel",
    vignetting: "mild",
    colorRendering: "neutral",

    focusThrow: 200,
    apertureBlades: 6,
    apertureMin: "f/16",
    buildQuality: "solid",
    mount: "M42",
    adaptableTo: ["Canon EF-M", "Canon EF", "Sony E", "Micro Four Thirds"],

    type: "Prime",
    origin: "Japanese",
    era: "1980s",
    weirdness: 1,
    historicalSignificance: 2,
    signatureRendering: "Punchy multi-coated contrast; clean rectilinear rendering",
    character: "Compact multi-coated wide with punchy contrast and strong flare resistance",
    tip: "A street photography classic. Step close to subjects and use strong leading lines to exploit the wide field of view.",

    rarity: 2,
    outdoor: true,
    subjects: ["street", "landscape", "architecture"],
    moods: ["clinical"],
    light: ["bright sun", "golden hour"],
    weather: ["sunny", "cloudy"],
  },

  // ── 5 ──────────────────────────────────────────────────────────
  {
    id: 5,
    shortName: "TAMRON 28",
    name: "Tamron Auto 28mm f/2.8",
    aperture: "f/2.8",
    minFocus: 0.3,
    focalLength: { min: 28, max: 28 },
    weight: 240,

    sharpness: "medium",
    sharpnessCenter: "medium",
    sharpnessEdge: "medium",
    contrast: "medium",
    flare: "resistant",
    bokeh: "neutral",
    distortion: "barrel",
    vignetting: "mild",
    colorRendering: "neutral",

    focusThrow: 200,
    apertureBlades: 6,
    apertureMin: "f/16",
    buildQuality: "solid",
    mount: "Adaptall-2",
    adaptableTo: ["Canon EF-M", "Canon EF", "Sony E", "Micro Four Thirds", "Nikon F"],

    type: "Prime",
    origin: "Japanese",
    era: "1980s",
    weirdness: 1,
    historicalSignificance: 2,
    signatureRendering: "Honest neutral rendering — the scene speaks, not the lens",
    character: "Neutral vintage wide with balanced color, solid contrast and dependable performance",
    tip: "Great for landscapes and architecture where you want honest rendering rather than stylized character.",

    rarity: 2,
    outdoor: true,
    subjects: ["landscape", "architecture", "nature"],
    moods: ["clinical"],
    light: ["bright sun", "golden hour"],
    weather: ["sunny", "cloudy"],
  },

  // ── 6 ──────────────────────────────────────────────────────────
  {
    id: 6,
    shortName: "HEXANON 55",
    name: "Konica Hexanon 55mm f/3.5 Macro",
    aperture: "f/3.5",
    minFocus: 0.25,
    focalLength: { min: 55, max: 55 },
    weight: 290,

    sharpness: "razor",
    sharpnessCenter: "razor",
    sharpnessEdge: "sharp",
    contrast: "high",
    flare: "resistant",
    bokeh: "structured",
    distortion: "none",
    vignetting: "none",
    colorRendering: "neutral",

    focusThrow: 300,
    apertureBlades: 6,
    apertureMin: "f/22",
    buildQuality: "tank",
    mount: "Konica AR",
    adaptableTo: ["Canon EF-M", "Canon EF", "Sony E", "Micro Four Thirds"],

    type: "Macro",
    origin: "Japanese",
    era: "1970s",
    weirdness: 1,
    historicalSignificance: 3,
    signatureRendering: "Flat-field clinical sharpness; zero distortion at macro distances",
    character: "Exceptional macro optics with flat field sharpness and scientific-level detail",
    tip: "Combine with extension tubes to push magnification beyond 1:1. Perfect for textures, insects and botanical work.",

    rarity: 3,
    outdoor: false,
    subjects: ["macro", "nature"],
    moods: ["clinical"],
    light: ["any"],
    weather: ["any"],
  },

  // ── 7 ──────────────────────────────────────────────────────────
  {
    id: 7,
    shortName: "NIKKOR 50",
    name: "Nikon AI 50mm f/1.8",
    aperture: "f/1.8",
    minFocus: 0.45,
    focalLength: { min: 50, max: 50 },
    weight: 155,

    sharpness: "sharp",
    sharpnessCenter: "sharp",
    sharpnessEdge: "medium",
    contrast: "high",
    flare: "resistant",
    bokeh: "neutral",
    distortion: "none",
    vignetting: "mild",
    colorRendering: "neutral",

    focusThrow: 220,
    apertureBlades: 7,
    apertureMin: "f/16",
    buildQuality: "solid",
    mount: "Nikon F",
    adaptableTo: ["Canon EF-M", "Canon EF", "Sony E", "Micro Four Thirds", "Fujifilm X", "Nikon Z"],

    type: "Prime",
    origin: "Japanese",
    era: "1980s",
    weirdness: 1,
    historicalSignificance: 3,
    signatureRendering: "Reference neutral — characterless by design, technically exemplary",
    character: "Neutral reference lens with strong sharpness and classic Nikon color rendering",
    tip: "A perfect baseline lens. Use it when you want the scene itself to dominate without strong optical character.",

    rarity: 1,
    outdoor: true,
    subjects: ["street", "portrait", "landscape"],
    moods: ["clinical"],
    light: ["any"],
    weather: ["any"],
  },

  // ── 8 ──────────────────────────────────────────────────────────
  {
    id: 8,
    shortName: "TELE 135",
    name: "Automatic 135mm f/2.8",
    aperture: "f/2.8",
    minFocus: 1.5,
    focalLength: { min: 135, max: 135 },
    weight: 430,

    sharpness: "sharp",
    sharpnessCenter: "sharp",
    sharpnessEdge: "medium",
    contrast: "medium",
    flare: "prone",
    bokeh: "creamy",
    distortion: "pincushion",
    vignetting: "mild",
    colorRendering: "warm",

    focusThrow: 250,
    apertureBlades: 6,
    apertureMin: "f/16",
    buildQuality: "solid",
    mount: "M42",
    adaptableTo: ["Canon EF-M", "Canon EF", "Sony E", "Micro Four Thirds"],

    type: "Prime",
    origin: "Japanese",
    era: "1970s",
    weirdness: 2,
    historicalSignificance: 2,
    signatureRendering: "Classic portrait telephoto compression; smooth subject isolation",
    character: "Classic portrait telephoto with strong background compression and smooth subject isolation",
    tip: "Back up and frame subjects against distant backgrounds. The compression produces cinematic separation.",

    rarity: 2,
    outdoor: true,
    subjects: ["portrait", "nature", "street"],
    moods: ["cinematic", "warm"],
    light: ["bright sun", "golden hour"],
    weather: ["sunny", "cloudy"],
  },

  // ── 9 ──────────────────────────────────────────────────────────
  {
    id: 9,
    shortName: "NIKKOR 36-72",
    name: "Nikon AI 36-72mm f/3.5-4.5",
    aperture: "f/3.5-4.5",
    minFocus: 1.2,
    focalLength: { min: 36, max: 72 },
    weight: 430,

    sharpness: "medium",
    sharpnessCenter: "medium",
    sharpnessEdge: "soft",
    contrast: "medium",
    flare: "resistant",
    bokeh: "neutral",
    distortion: "barrel",
    vignetting: "mild",
    colorRendering: "neutral",

    focusThrow: 200,
    apertureBlades: 7,
    apertureMin: "f/22",
    buildQuality: "solid",
    mount: "Nikon F",
    adaptableTo: ["Canon EF-M", "Canon EF", "Sony E", "Micro Four Thirds"],

    type: "Zoom",
    origin: "Japanese",
    era: "1980s",
    weirdness: 1,
    historicalSignificance: 2,
    signatureRendering: "Compact vintage zoom — versatile without strong character",
    character: "Compact vintage zoom covering wide to short telephoto with reliable optical performance",
    tip: "A practical walk-around lens when you need flexibility and speed over character.",

    rarity: 1,
    outdoor: true,
    subjects: ["street", "landscape", "travel"],
    moods: ["clinical"],
    light: ["any"],
    weather: ["any"],
  },

  // ── 10 ─────────────────────────────────────────────────────────
  {
    id: 10,
    shortName: "KENLOCK 80-200",
    name: "Kenlock Mctor 80-200mm f/4.5",
    aperture: "f/4.5",
    minFocus: 1.8,
    focalLength: { min: 80, max: 200 },
    weight: 700,

    sharpness: "medium",
    sharpnessCenter: "medium",
    sharpnessEdge: "soft",
    contrast: "medium",
    flare: "prone",
    bokeh: "creamy",
    distortion: "pincushion",
    vignetting: "mild",
    colorRendering: "warm",

    focusThrow: 300,
    apertureBlades: 6,
    apertureMin: "f/22",
    buildQuality: "solid",
    mount: "M42",
    adaptableTo: ["Canon EF-M", "Canon EF", "Sony E", "Micro Four Thirds"],

    type: "Tele Zoom",
    origin: "Japanese",
    era: "1980s",
    weirdness: 2,
    historicalSignificance: 2,
    signatureRendering: "Long tele compression; creamy vintage background rendering",
    character: "Long telephoto reach with strong compression and classic vintage tele look",
    tip: "Best used outdoors in strong light. Ideal for distant wildlife or isolating faraway subjects.",

    rarity: 2,
    outdoor: true,
    subjects: ["nature", "wildlife", "landscape"],
    moods: ["cinematic"],
    light: ["bright sun", "golden hour"],
    weather: ["sunny", "cloudy"],
  },

  // ── 11 ─────────────────────────────────────────────────────────
  {
    id: 11,
    shortName: "TOKINA 28-70",
    name: "Tokina 28-70mm f/3.5-4.5",
    aperture: "f/3.5-4.5",
    minFocus: 0.9,
    focalLength: { min: 28, max: 70 },
    weight: 460,

    sharpness: "medium",
    sharpnessCenter: "medium",
    sharpnessEdge: "medium",
    contrast: "medium",
    flare: "resistant",
    bokeh: "neutral",
    distortion: "barrel",
    vignetting: "mild",
    colorRendering: "neutral",

    focusThrow: 220,
    apertureBlades: 6,
    apertureMin: "f/22",
    buildQuality: "solid",
    mount: "Nikon F",
    adaptableTo: ["Canon EF-M", "Canon EF", "Sony E", "Micro Four Thirds"],

    type: "Zoom",
    origin: "Japanese",
    era: "1980s",
    weirdness: 1,
    historicalSignificance: 2,
    signatureRendering: "Wide-to-short-tele flexibility; dependable everyday rendering",
    character: "Flexible vintage zoom covering wide to short telephoto in one compact package",
    tip: "Perfect exploration lens when you do not know what scene you will encounter next.",

    rarity: 1,
    outdoor: true,
    subjects: ["street", "landscape", "travel"],
    moods: ["clinical"],
    light: ["any"],
    weather: ["any"],
  },

  // ── 12 ─────────────────────────────────────────────────────────
  {
    id: 12,
    shortName: "TOKINA 90-230",
    name: "Tokina Auto Tele-Zoom 90-230mm f/4.5",
    aperture: "f/4.5",
    minFocus: 2.5,
    focalLength: { min: 90, max: 230 },
    weight: 900,

    sharpness: "medium",
    sharpnessCenter: "medium",
    sharpnessEdge: "soft",
    contrast: "medium",
    flare: "dreamy",
    bokeh: "creamy",
    distortion: "pincushion",
    vignetting: "mild",
    colorRendering: "warm",

    focusThrow: 350,
    apertureBlades: 6,
    apertureMin: "f/22",
    buildQuality: "tank",
    mount: "Nikon F",
    adaptableTo: ["Canon EF-M", "Canon EF", "Sony E"],

    type: "Tele Zoom",
    origin: "Japanese",
    era: "1973",
    weirdness: 3,
    historicalSignificance: 5,
    signatureRendering: "Amber-tinted warmth from 1973 early multi-coating; all-metal 900 g construction",
    character: "Early Tokina professional zoom with heavy metal construction and amber-tinted coatings",
    tip: "Shoot during golden hour to emphasize the warm coating signature. This is both a tool and a historical artifact.",

    rarity: 5,
    outdoor: true,
    subjects: ["nature", "landscape"],
    moods: ["warm", "cinematic"],
    light: ["bright sun", "golden hour"],
    weather: ["sunny"],
  },

  // ── 13 ─────────────────────────────────────────────────────────
  // NOTE: The Tokina RMC 500mm is a catadioptric (mirror) lens.
  // Its hollow mirror optics produce annular (donut-ring) bokeh.
  // apertureBlades: 0 because the aperture is fixed — no iris exists.
  // Exposure is controlled via ND filters.
  {
    id: 13,
    shortName: "TOKINA 500",
    name: "Tokina RMC 500mm f/8",
    aperture: "f/8",
    minFocus: 4.0,
    focalLength: { min: 500, max: 500 },
    weight: 600,

    sharpness: "sharp",
    sharpnessCenter: "sharp",
    sharpnessEdge: "medium",
    contrast: "high",
    flare: "prone",
    bokeh: "structured",
    distortion: "none",
    vignetting: "none",
    colorRendering: "neutral",

    focusThrow: 180,
    apertureBlades: 0,
    apertureMin: "f/8",
    buildQuality: "solid",
    mount: "T2",
    adaptableTo: ["Canon EF-M", "Canon EF", "Sony E", "Micro Four Thirds", "Nikon Z", "Fujifilm X"],

    type: "Tele Prime",
    origin: "Japanese",
    era: "1980s",
    weirdness: 4,
    historicalSignificance: 3,
    signatureRendering: "Donut-ring (annular) bokeh from catadioptric mirror design",
    character: "Extreme telephoto reach designed for distant wildlife, astronomy and solar photography",
    tip: "Use a sturdy tripod and high shutter speeds. Perfect for lunar shots, distant birds and solar photography with proper ND filtration.",

    rarity: 4,
    outdoor: true,
    subjects: ["wildlife", "astronomy", "nature"],
    moods: ["clinical", "cinematic"],
    light: ["bright sun"],
    weather: ["sunny", "clear"],
  },

  // ── 14 ─────────────────────────────────────────────────────────
  // NOTE: _halfFrame signals to lensUtils.js that this lens was
  // designed for an 18×24 mm half-frame image circle — smaller than
  // APS-C (23.5×15.6 mm) — causing strong coverage vignetting.
  {
    id: 14,
    shortName: "INDUSTAR 69",
    name: "Industar-69 28mm f/2.8",
    aperture: "f/2.8",
    minFocus: 0.8,
    focalLength: { min: 28, max: 28 },
    weight: 45,

    sharpness: "medium",
    sharpnessCenter: "sharp",
    sharpnessEdge: "soft",
    contrast: "medium",
    flare: "prone",
    bokeh: "swirly",
    distortion: "barrel",
    vignetting: "strong",
    colorRendering: "warm",

    focusThrow: 180,
    apertureBlades: 6,
    apertureMin: "f/16",
    buildQuality: "solid",
    mount: "M39",
    adaptableTo: ["Canon EF-M", "Canon EF", "Sony E", "Micro Four Thirds"],

    _halfFrame: true,

    type: "Prime",
    origin: "Soviet",
    era: "1970s",
    weirdness: 4,
    historicalSignificance: 3,
    signatureRendering: "Heavy APS-C vignetting; sharp center dissolving to swirly dreamy edges",
    character: "Tiny Tessar-type pancake with classic Soviet contrast and strong center sharpness",
    tip: "Designed for half-frame cameras. Expect heavy vignetting on APS-C; embrace it for a strong vintage look or crop slightly in post.",

    rarity: 3,
    outdoor: true,
    subjects: ["street", "architecture", "travel"],
    moods: ["lofi", "cinematic", "warm"],
    light: ["bright sun", "golden hour"],
    weather: ["sunny", "cloudy"],
  },

  // ── 15 ─────────────────────────────────────────────────────────
  {
    id: 15,
    shortName: "INDUSTAR 61D",
    name: "Industar-61 L/D 52mm f/2.8",
    aperture: "f/2.8",
    minFocus: 1.0,
    focalLength: { min: 52, max: 52 },
    weight: 140,

    sharpness: "razor",
    sharpnessCenter: "razor",
    sharpnessEdge: "sharp",
    contrast: "high",
    flare: "resistant",
    bokeh: "structured",
    distortion: "none",
    vignetting: "none",
    colorRendering: "neutral",

    focusThrow: 200,
    apertureBlades: 6,
    apertureMin: "f/16",
    buildQuality: "solid",
    mount: "M42",
    adaptableTo: ["Canon EF-M", "Canon EF", "Sony E", "Micro Four Thirds", "Fujifilm X"],

    type: "Prime",
    origin: "Soviet",
    era: "1970s",
    weirdness: 2,
    historicalSignificance: 3,
    signatureRendering: "Lanthanum glass razor resolution; crisp Soviet micro-contrast",
    character: "Lanthanum-glass Tessar famed for exceptional sharpness and crisp Soviet micro-contrast",
    tip: "A precision lens. Stop down slightly and use it for architecture or detail work where its razor-sharp rendering shines.",

    rarity: 3,
    outdoor: true,
    subjects: ["street", "architecture", "nature"],
    moods: ["clinical"],
    light: ["bright sun", "golden hour", "any"],
    weather: ["any"],
  },

  // ── 16 ─────────────────────────────────────────────────────────
  {
    id: 16,
    shortName: "INDUSTAR 61Z",
    name: "Industar-61 L/Z 50mm f/2.8",
    aperture: "f/2.8",
    minFocus: 0.3,
    focalLength: { min: 50, max: 50 },
    weight: 240,

    sharpness: "razor",
    sharpnessCenter: "razor",
    sharpnessEdge: "sharp",
    contrast: "high",
    flare: "resistant",
    bokeh: "structured",
    distortion: "none",
    vignetting: "none",
    colorRendering: "neutral",

    focusThrow: 220,
    apertureBlades: 6,
    apertureMin: "f/16",
    buildQuality: "solid",
    mount: "M42",
    adaptableTo: ["Canon EF-M", "Canon EF", "Sony E", "Micro Four Thirds", "Fujifilm X"],

    type: "Macro",
    origin: "Soviet",
    era: "1980s",
    weirdness: 3,
    historicalSignificance: 3,
    signatureRendering: "6-point star diffraction spikes at f/8-f/11 from hexagonal aperture",
    character: "Lanthanum Tessar with legendary star-shaped diffraction spikes and extreme sharpness",
    tip: "Stop down toward f/8-f/11 and include point light sources to reveal its famous starburst diffraction pattern.",

    rarity: 3,
    outdoor: true,
    subjects: ["macro", "nature", "street"],
    moods: ["clinical", "cinematic"],
    light: ["bright sun", "golden hour", "any"],
    weather: ["any"],
  },

  // ── 17 ─────────────────────────────────────────────────────────
  {
    id: 17,
    shortName: "ZENITAR 16",
    name: "Zenitar 16mm f/2.8 Fisheye",
    aperture: "f/2.8",
    minFocus: 0.3,
    focalLength: { min: 16, max: 16 },
    weight: 320,

    sharpness: "sharp",
    sharpnessCenter: "sharp",
    sharpnessEdge: "soft",
    contrast: "medium",
    flare: "prone",
    bokeh: "structured",
    distortion: "fisheye",
    vignetting: "none",
    colorRendering: "neutral",

    focusThrow: 120,
    apertureBlades: 6,
    apertureMin: "f/16",
    buildQuality: "solid",
    mount: "M42",
    adaptableTo: ["Canon EF-M", "Canon EF", "Sony E", "Micro Four Thirds"],

    type: "Prime",
    origin: "Soviet / Russian",
    era: "1990s",
    weirdness: 5,
    historicalSignificance: 3,
    signatureRendering: "180-degree equidistant fisheye projection; extreme geometric curvature",
    character: "Ultra-wide fisheye delivering extreme 180 degree perspective and dramatic geometric distortion",
    tip: "Move very close to foreground subjects to exaggerate scale and curvature. Perfect for experimental compositions and astrophotography.",

    rarity: 3,
    outdoor: true,
    subjects: ["architecture", "landscape", "nature", "street", "astronomy"],
    moods: ["cinematic", "lofi"],
    light: ["bright sun", "golden hour", "any"],
    weather: ["any"],
  },
];
