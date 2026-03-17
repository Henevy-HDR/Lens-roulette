import { useState, useRef } from "react";

// ════════════════════════════════════════════════════════════════════
//  LENS CLASS
//  One instance = one physical lens in your bag.
//  All tag-matching logic lives here so ScoringEngine stays clean.
//
//  HOW TO ADD A LENS — copy this template and push to COLLECTION:
//
//  new Lens({
//    shortName: "LABEL  XX",        // ≤12 chars, shown on slot reel
//    name:      "Full Lens Name",
//    aperture:  "f/1.8",            // max (widest) aperture
//    type:      "Prime",            // Prime | Zoom | Macro | Cine Prime | Tele Prime | Tele Zoom
//    origin:    "Japanese",         // Japanese | Soviet | East German | Third Party
//    era:       "1970s",
//    rarity:    3,                  // 1 (common) – 5 (museum piece)
//    outdoor:   true,               // false = mainly indoor lens
//    character: "One-line optical personality",
//    tip:       "Shooting advice shown on the result card.",
//    subjects:  ["street","landscape"],  // any lowercase words — new ones auto-appear as pills
//    moods:     ["warm"],                // warm | clinical | cinematic | lofi
//    light:     ["any"],                 // any | bright sun | golden hour | low light | night
//    weather:   ["any"],                 // any | sunny | cloudy | rain | fog
//  }),
// ════════════════════════════════════════════════════════════════════
const KNOWN_MOODS   = ["warm", "clinical", "cinematic", "lofi"];
const KNOWN_LIGHT   = ["any", "bright sun", "golden hour", "low light", "night"];
const KNOWN_WEATHER = ["any", "sunny", "cloudy", "rain", "fog"];

class Lens {
  constructor(data) {
    Object.assign(this, data);
    this._validate();
  }

  get maxAperture() {
    return parseFloat(this.aperture.replace("f/", ""));
  }

  matchesSubject(query) {
    const q = query.toLowerCase();
    return this.subjects.some(s => s.includes(q) || q.includes(s));
  }

  matchesMood(moodTag) {
    return (this.moods || []).includes(moodTag.toLowerCase());
  }

  matchesLight(lightTag) {
    const tags = this.light || ["any"];
    if (tags.includes("any")) return true;
    const t = lightTag.toLowerCase();
    return tags.some(l => l.includes(t) || t.includes(l));
  }

  matchesWeather(weatherTag) {
    const tags = this.weather || ["any"];
    if (tags.includes("any")) return true;
    const t = weatherTag.toLowerCase();
    return tags.some(w => w.includes(t) || t.includes(w));
  }

  _validate() {
    const warn = (msg) => console.warn(`[Lens "${this.name}"] ${msg}`);
    ["shortName","name","aperture","type","origin","era","rarity","character","tip","subjects"]
      .forEach(f => { if (!this[f]) warn(`Missing required field: ${f}`); });
    if (isNaN(this.maxAperture)) warn(`aperture "${this.aperture}" couldn't be parsed`);
    if (this.rarity < 1 || this.rarity > 5) warn(`rarity should be 1–5, got ${this.rarity}`);
    (this.moods || []).forEach(m => {
      if (!KNOWN_MOODS.includes(m))
        warn(`Unknown mood tag "${m}" — known: ${KNOWN_MOODS.join(", ")}`);
    });
  }

  describe() {
    return `${this.name} (${this.aperture}) — ${this.origin}, ${this.era} | `
         + `subjects: [${this.subjects.join(", ")}] moods: [${(this.moods||[]).join(", ")}]`;
  }
}


// ════════════════════════════════════════════════════════════════════
//  LENS COLLECTION
// ════════════════════════════════════════════════════════════════════
class LensCollection {
  static HIDDEN_SUBJECTS = new Set(["portrait","travel","event","experimental","creative","lowlight","indoor"]);

  constructor(lenses) {
    this.lenses = lenses.map((l, i) => { l.id = i + 1; return l; });
  }

  get count()  { return this.lenses.length; }
  getById(id)  { return this.lenses.find(l => l.id === id); }
  random()     { return this.lenses[Math.floor(Math.random() * this.lenses.length)]; }

  // Derived live from the collection — add a subject tag to any Lens
  // and the pill appears in the UI automatically
  get uiSubjects() {
    return [...new Set(this.lenses.flatMap(l => l.subjects))]
      .filter(s => !LensCollection.HIDDEN_SUBJECTS.has(s))
      .sort()
      .map(s => s.charAt(0).toUpperCase() + s.slice(1));
  }
}


// ════════════════════════════════════════════════════════════════════
//  SCORING ENGINE
//  Pure algorithm — no lens IDs hardcoded, no UI concerns.
//  Tune WEIGHTS to adjust how much each condition influences picks.
// ════════════════════════════════════════════════════════════════════
class ScoringEngine {
  static WEIGHTS = {
    subject:         4,    // subject tag match
    mood:            1.5,  // mood nudge — intentionally subtle
    moodChaos:       3,    // extra random when "Chaotic" mood chosen
    lightGeneral:    2,    // general light condition match
    lowLightFast:    4,    // aperture ≤f/1.8 in low light
    lowLightMid:     2,    // aperture ≤f/2.2 in low light
    astroFast:       7,    // astrophotography score at f/1.4
    astroStep:       2,    // score drops this much per stop above f/1.4
    astroPenalty:   -2,    // floor penalty for slow lenses in astro
    weather:         1.5,  // weather tag match
    locationIndoor:  2,    // indoor lens bonus when Indoor selected
    locationOutdoor: 1,    // outdoor lens bonus when Outdoor selected
    chaos:           2.5,  // max random float — always added to every lens
    wildProb:        0.28, // chance of picking from top-N instead of top-1
    wildN:           4,    // pool size for wild picks
  };

  static score(lens, cond) {
    const W = ScoringEngine.WEIGHTS;
    let s = 0;

    if (cond.subject && lens.matchesSubject(cond.subject)) s += W.subject;

    if (cond.mood) {
      if (cond.mood.includes("Warm")     && lens.matchesMood("warm"))      s += W.mood;
      if (cond.mood.includes("Clinical") && lens.matchesMood("clinical"))  s += W.mood;
      if (cond.mood.includes("Cinematic")&& lens.matchesMood("cinematic")) s += W.mood;
      if (cond.mood.includes("Lofi")     && lens.matchesMood("lofi"))      s += W.mood * 2; // stronger nudge — lofi is a niche pick
      if (cond.mood.includes("Chaotic"))  s += Math.random() * W.moodChaos;
    }

    if (cond.light) {
      const lk = cond.light.toLowerCase();
      if (lk.includes("astro")) {
        const stops = (lens.maxAperture - 1.4) / 0.5;
        s += Math.max(W.astroPenalty, W.astroFast - stops * W.astroStep);
      } else if (lk.includes("low light")) {
        if (lens.maxAperture <= 1.8) s += W.lowLightFast;
        if (lens.maxAperture <= 2.8) s += W.lowLightMid;
      } else {
        if (lens.matchesLight(lk)) s += W.lightGeneral;
      }
    }

    if (cond.weather) {
      // Strip leading emoji token (e.g. "☀ Sunny" → "sunny", "🌧 Rain" → "rain")
      const weatherWord = cond.weather.trim().split(" ").slice(1).join(" ").toLowerCase();
      s += lens.matchesWeather(weatherWord) ? W.weather : 0;
    }

    if (cond.location === "Indoor"  && !lens.outdoor) s += W.locationIndoor;
    if (cond.location === "Outdoor" &&  lens.outdoor) s += W.locationOutdoor;

    s += Math.random() * W.chaos;
    return s;
  }

  static pick(collection, cond) {
    const W      = ScoringEngine.WEIGHTS;
    const isWild = !Object.values(cond).some(Boolean) || cond.subject === "🎲 Wild";
    if (isWild) return { lens: collection.random(), wild: true };

    const ranked = collection.lenses
      .map(lens => ({ lens, score: ScoringEngine.score(lens, cond) }))
      .sort((a, b) => b.score - a.score);

    const goWild = Math.random() < W.wildProb;
    const idx    = goWild ? Math.floor(Math.random() * Math.min(W.wildN, ranked.length)) : 0;
    return { lens: ranked[idx].lens, wild: goWild && idx > 0 };
  }
}


// ════════════════════════════════════════════════════════════════════
//  YOUR LENS COLLECTION
//  Add, remove, or edit lenses here. IDs are auto-assigned.
//  Check the browser console for validation warnings after edits.
// ════════════════════════════════════════════════════════════════════
const COLLECTION = new LensCollection([

  new Lens({
    shortName: "TAKUMAR 50",   name: "Super Takumar 50mm",
    aperture: "f/1.4",         type: "Prime",
    origin: "Japanese",        era: "1960s",
    rarity: 3,                 outdoor: false,
    character: "Warm, creamy bokeh — radioactive thorium glow",
    tip: "Thorium coating paints highlights warm amber. Wide open at golden hour for maximum magic.",
    subjects: ["street", "nature", "landscape"],
    moods:    ["warm", "lofi"],
    weather:  ["any"],
  }),

  new Lens({
    shortName: "ВЕГА-9  50",   name: "Vega-9 50mm",
    aperture: "f/2.1",         type: "Cine Prime",
    origin: "Soviet",          era: "1970s",
    rarity: 4,                 outdoor: true,
    character: "Cinematic swirl, stepless aperture, 16mm image circle",
    tip: "Stepless aperture for smooth exposure pulls. Swirly bokeh is the feature — lean into it.",
    subjects: ["street", "landscape"],
    moods:    ["warm", "cinematic", "lofi"],
    light:    ["any"],
    weather:  ["any"],
  }),

  new Lens({
    shortName: "FLEKTOGON 35", name: "Carl Zeiss Jena Flektogon 35mm",
    aperture: "f/2.4",         type: "Wide Prime",
    origin: "East German",     era: "1960s",
    rarity: 3,                 outdoor: true,
    character: "Punchy micro-contrast, sharp centre, vintage character",
    tip: "East German precision. Get close, fill the frame. Made for tight street and environmental shots.",
    subjects: ["street", "landscape", "nature"],
    moods:    ["clinical"],
    light:    ["bright sun", "any"],
    weather:  ["sunny", "cloudy"],
  }),

  new Lens({
    shortName: "VIVITAR 28",   name: "Vivitar 28mm f/2.8",
    aperture: "f/2.8",         type: "Wide Prime",
    origin: "Third Party",     era: "1980s",
    rarity: 2,                 outdoor: true,
    character: "Multi-coated, punchy contrast, flare-resistant",
    tip: "Multi-coating keeps flare in check. Go wide, get close, commit to the full frame.",
    subjects: ["landscape", "street", "nature"],
    moods:    ["clinical"],
    light:    ["bright sun"],
    weather:  ["sunny"],
  }),

  new Lens({
    shortName: "TAMRON  28",   name: "Tamron Auto 28mm f/2.8",
    aperture: "f/2.8",         type: "Wide Prime",
    origin: "Japanese",        era: "1980s",
    rarity: 2,                 outdoor: true,
    character: "Clean wide-angle rendering, reliable and neutral",
    tip: "Reliable wide-angle for sweeping landscapes. Clean and honest.",
    subjects: ["landscape", "nature"],
    moods:    ["clinical"],
    light:    ["bright sun", "golden hour"],
    weather:  ["sunny", "cloudy"],
  }),

  new Lens({
    shortName: "HEXANON Ø55",  name: "Konica Hexanon 55mm Macro",
    aperture: "f/3.5",         type: "Macro Prime",
    origin: "Japanese",        era: "1970s",
    rarity: 3,                 outdoor: false,
    character: "Razor-sharp macro, clinical and precise",
    tip: "Stack extension tubes for max magnification. Betta fish, insects, textures — clinical beauty.",
    subjects: ["macro", "nature"],
    moods:    ["clinical"],
    light:    ["any"],
    weather:  ["any"],
  }),

  new Lens({
    shortName: "NIKKOR  50",   name: "Nikon AI 50mm f/1.8",
    aperture: "f/1.8",         type: "Prime",
    origin: "Japanese",        era: "1980s",
    rarity: 1,                 outdoor: true,
    character: "Neutral benchmark, clinical sharpness, fast",
    tip: "The benchmark. Neutral rendering lets your vision lead. When in doubt — reach for this.",
    subjects: ["street", "landscape", "nature"],
    moods:    ["clinical"],
    light:    ["any"],
    weather:  ["any"],
  }),

  new Lens({
    shortName: "TELE   135",   name: "Automatic Telephoto 135mm f/2.8",
    aperture: "f/2.8",         type: "Tele Prime",
    origin: "Japanese",        era: "1970s",
    rarity: 2,                 outdoor: true,
    character: "Compressed perspective, beautiful subject isolation",
    tip: "Stand back and let subjects breathe. Background compression flatters everything.",
    subjects: ["nature", "landscape", "street"],
    moods:    ["warm", "cinematic"],
    light:    ["bright sun", "golden hour"],
    weather:  ["sunny", "cloudy"],
  }),

  new Lens({
    shortName: "NIKKOR 36-72", name: "Nikon AI 36–72mm f/3.5-4.5",
    aperture: "f/3.5",         type: "Standard Zoom",
    origin: "Japanese",        era: "1980s",
    rarity: 1,                 outdoor: true,
    character: "Versatile standard zoom, reliable walk-around",
    tip: "When you don't know what you'll encounter — this goes on the camera.",
    subjects: ["street", "landscape", "nature"],
    moods:    ["clinical"],
    light:    ["any"],
    weather:  ["any"],
  }),

  new Lens({
    shortName: "KENLOCK 80-200", name: "Kenlock Mctor 80–200mm f/4.5",
    aperture: "f/4.5",         type: "Tele Zoom",
    origin: "Multi-coated",    era: "1980s",
    rarity: 2,                 outdoor: true,
    character: "Long reach, compressed backgrounds",
    tip: "Reach out from afar. Birds, distant coastlines, candid street — tele compression magic.",
    subjects: ["nature", "landscape"],
    moods:    ["cinematic"],
    light:    ["bright sun", "golden hour"],
    weather:  ["sunny", "cloudy"],
  }),

  new Lens({
    shortName: "TOKINA 28-70",  name: "Tokina 28–70mm f/3.5-4.5",
    aperture: "f/3.5",          type: "Standard Zoom",
    origin: "Japanese",         era: "1980s",
    rarity: 1,                  outdoor: true,
    character: "Flexible general-purpose zoom range",
    tip: "Flexible range for unpredictable shoots. Great when you have no idea what you'll find.",
    subjects: ["street", "landscape", "nature"],
    moods:    ["clinical"],
    light:    ["any"],
    weather:  ["any"],
  }),

  new Lens({
    shortName: "TOKINA  500",  name: "Tokina RMC 500mm",
    aperture: "f/8",           type: "Super Telephoto",
    origin: "Japanese",        era: "1970s",
    rarity: 4,                 outdoor: true,
    character: "Mirror catadioptric, fixed f/8, donut bokeh — 800mm equiv on APS-C",
    tip: "Fixed f/8 — all exposure via shutter and ISO. Pair with your 20-stop ND for solar photography. Donut bokeh on highlights is the signature; embrace it. Tripod mandatory at 800mm equiv.",
    subjects: ["nature", "landscape"],
    moods:    ["cinematic"],
    light:    ["bright sun", "golden hour"],
    weather:  ["sunny", "cloudy"],
  }),

  new Lens({
    shortName: "INDUSTAR 28",  name: "Industar-69 28mm f/2.8",
    aperture: "f/2.8",         type: "Wide Prime",
    origin: "Soviet",          era: "1960s",
    rarity: 3,                 outdoor: true,
    character: "Ultra-compact Soviet pancake, Tessar-type, swirly bokeh, heavy vignette — lo-fi analog soul",
    tip: "Smallest lens in the collection. Set hyperfocal at f/8 and shoot. Embrace the soft corners and vignette — that's the BeLOMO character. Perfect for street and black-and-white.",
    subjects: ["street", "landscape"],
    moods:    ["warm", "lofi"],
    light:    ["any"],
    weather:  ["any"],
  }),

  new Lens({
    shortName: "TOKINA 90-230", name: "Tokina Auto Tele-Zoom 90–230mm",
    aperture: "f/4.5",          type: "Tele Zoom",
    origin: "Japanese",         era: "1973",
    rarity: 5,                  outdoor: true,
    character: "Full metal, amber-coated — 1973 first production, ultra-rare",
    tip: "1973 first production. Amber coating paints light like honey. This is artwork — treat it with reverence.",
    subjects: ["nature", "landscape"],
    moods:    ["warm"],
    light:    ["bright sun", "golden hour"],
    weather:  ["sunny"],
  }),

]);


// ════════════════════════════════════════════════════════════════════
//  UI OPTIONS
//  subject is derived live from the collection.
//  Add a new subject tag to any Lens → pill auto-appears.
// ════════════════════════════════════════════════════════════════════
const OPTIONS = {
  subject:  [...COLLECTION.uiSubjects, "🎲 Wild"],
  light:    ["Bright Sun", "Golden Hour", "Low Light / Night", "Astrophotography"],
  location: ["Outdoor", "Indoor"],
  mood:     ["Warm & Organic", "Clinical & Sharp", "Cinematic", "Lofi & Grain", "Chaotic & Wild"],
  weather:  ["☀ Sunny", "☁ Cloudy", "🌧 Rain", "🌫 Fog"],
};


// ════════════════════════════════════════════════════════════════════
//  APP COMPONENT
// ════════════════════════════════════════════════════════════════════
export default function LensRoulette() {
  const [cond, setCond]     = useState({});
  const [spin, setSpin]     = useState(false);
  const [disp, setDisp]     = useState({ name: "── ──── ──", ap: "f/──", origin: "────" });
  const [result, setResult] = useState(null);
  const [wild,   setWild]   = useState(false);
  const timers = useRef([]);

  const activeCount = Object.values(cond).filter(Boolean).length;

  function clearTimers() { timers.current.forEach(clearInterval); timers.current = []; }

  function runSpin() {
    if (spin) return;
    clearTimers();
    setSpin(true);
    setResult(null);

    const { lens: chosen, wild: isWild } = ScoringEngine.pick(COLLECTION, cond);

    const phases = [[55,14],[100,9],[170,6],[280,4],[450,3]];
    let pi = 0;

    function next() {
      if (pi >= phases.length) {
        setDisp({ name: chosen.shortName, ap: chosen.aperture, origin: chosen.origin.toUpperCase() });
        setTimeout(() => { setSpin(false); setWild(isWild); setResult(chosen); }, 350);
        return;
      }
      let count = 0;
      const [ms, n] = phases[pi];
      const id = setInterval(() => {
        const r = COLLECTION.random();
        setDisp({ name: r.shortName, ap: r.aperture, origin: r.origin.toUpperCase() });
        if (++count >= n) { clearInterval(id); pi++; next(); }
      }, ms);
      timers.current.push(id);
    }
    next();
  }

  function toggle(key, val) {
    setCond(p => ({ ...p, [key]: p[key] === val ? undefined : val }));
    setResult(null);
  }

  return (
    <div style={{ minHeight:"100vh", background:"#070707", color:"#ddd0b8",
      fontFamily:"'Courier New','Lucida Console',monospace", paddingBottom:64, position:"relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        .pill { transition: background 0.12s, border-color 0.12s, color 0.12s; }
        .pill:hover { border-color: #ff6b00 !important; color: #ff6b00 !important; }
        .spin-btn { transition: all 0.15s; }
        .spin-btn:hover:not(:disabled) { background: #ff8c30 !important; transform: scale(1.03); }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .scanlines {
          position:fixed; top:0; left:0; right:0; bottom:0; pointer-events:none; z-index:50;
          background: repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.10) 3px,rgba(0,0,0,0.10) 4px);
        }
      `}</style>

      <div className="scanlines" />

      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{ borderBottom:"1px solid #1e1e1e", padding:"24px 28px 18px", display:"flex", alignItems:"center", gap:14 }}>
        <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
          <circle cx="19" cy="19" r="17" stroke="#ff6b00" strokeWidth="1.5"/>
          <circle cx="19" cy="19" r="7"  stroke="#ff6b00" strokeWidth="1"/>
          {[0,60,120,180,240,300].map((a,i) => (
            <line key={i}
              x1={19+8.5*Math.cos(a*Math.PI/180)}     y1={19+8.5*Math.sin(a*Math.PI/180)}
              x2={19+15*Math.cos((a+22)*Math.PI/180)} y2={19+15*Math.sin((a+22)*Math.PI/180)}
              stroke="#ff6b00" strokeWidth="2" strokeLinecap="round"/>
          ))}
        </svg>
        <div>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:26, letterSpacing:7, color:"#ff6b00", fontWeight:700, lineHeight:1 }}>
            LENS ROULETTE
          </div>
          <div style={{ fontSize:9, letterSpacing:5, color:"#444", marginTop:4 }}>
            VINTAGE GLASS SELECTOR · CANON EOS M50 · {COLLECTION.count} LENSES
          </div>
        </div>
      </div>

      {/* ── Conditions ──────────────────────────────────────── */}
      <div style={{ padding:"22px 28px 18px", borderBottom:"1px solid #141414" }}>
        <div style={{ fontSize:9, letterSpacing:5, color:"#3a3a3a", marginBottom:18 }}>
          ── SET CONDITIONS ({activeCount} ACTIVE) ─────────────
        </div>
        {Object.entries(OPTIONS).map(([key, opts]) => (
          <div key={key} style={{ marginBottom:12 }}>
            <div style={{ fontSize:9, letterSpacing:4, color:"#3e3e3e", marginBottom:7 }}>{key.toUpperCase()}</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
              {opts.map(opt => {
                const on = cond[key] === opt;
                return (
                  <button key={opt} className="pill" onClick={() => toggle(key, opt)} style={{
                    background: on ? "#ff6b00" : "transparent",
                    border:    `1px solid ${on ? "#ff6b00" : "#252525"}`,
                    color:      on ? "#080808" : "#666",
                    padding:"4px 11px", fontSize:10, letterSpacing:2,
                    cursor:"pointer", fontFamily:"inherit", fontWeight: on ? 700 : 400,
                  }}>{opt.toUpperCase()}</button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Slot display ────────────────────────────────────── */}
      <div style={{ padding:"36px 28px 24px", display:"flex", flexDirection:"column", alignItems:"center" }}>
        <div style={{
          width:"100%", maxWidth:460,
          background:"#040404", border:"1px solid #1c1c1c", borderTop:"2px solid #ff6b00",
          padding:"28px 22px 22px", position:"relative", marginBottom:28,
        }}>
          {[18,38,58,78].map(pct => ["l","r"].map(side => (
            <div key={`${side}${pct}`} style={{
              position:"absolute", [side==="l"?"left":"right"]:7, top:`${pct}%`,
              width:7, height:7, borderRadius:"50%", border:"1px solid #1a1a1a", background:"#080808",
            }}/>
          )))}

          <div style={{ fontSize:9, letterSpacing:5, color:"#333", textAlign:"center", marginBottom:10 }}>── SELECTED LENS ──</div>

          <div style={{
            fontFamily:"'IBM Plex Mono',monospace", fontSize:24, letterSpacing:3, fontWeight:700,
            color: spin||result ? "#ff6b00" : "#282828",
            textAlign:"center", minHeight:36,
            textShadow: spin||result ? "0 0 24px rgba(255,107,0,0.45)" : "none",
            animation: spin ? "blink 0.2s infinite" : "none",
            transition: spin ? "none" : "color 0.4s, text-shadow 0.4s",
          }}>{disp.name}</div>

          <div style={{ display:"flex", justifyContent:"center", gap:36, marginTop:20, paddingTop:16, borderTop:"1px solid #141414" }}>
            {[["APERTURE", disp.ap], ["ORIGIN", disp.origin]].map(([label, val]) => (
              <div key={label} style={{ textAlign:"center" }}>
                <div style={{ fontSize:8, letterSpacing:4, color:"#2e2e2e", marginBottom:5 }}>{label}</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:16, color:"#c8a96e", letterSpacing:2 }}>{val}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop:16, paddingTop:12, borderTop:"1px solid #0e0e0e", fontSize:8, letterSpacing:3, color:"#2a2a2a", textAlign:"center" }}>
            {activeCount > 0
              ? `${activeCount} CONDITION${activeCount>1?"S":""} ACTIVE · CHAOS ±${ScoringEngine.WEIGHTS.chaos}`
              : "NO CONDITIONS · PURE RANDOM MODE"}
          </div>
        </div>

        <button className="spin-btn" onClick={runSpin} disabled={spin} style={{
          background: spin ? "#111" : "#ff6b00",
          border:"none", color: spin ? "#444" : "#080808",
          padding:"15px 52px", fontSize:13, letterSpacing:6,
          fontFamily:"'IBM Plex Mono',monospace", fontWeight:700,
          cursor: spin ? "not-allowed" : "pointer",
        }}>
          {spin ? "SPINNING ···" : "▶  SPIN"}
        </button>

        <div style={{ fontSize:8, letterSpacing:4, color:"#2e2e2e", marginTop:10, textAlign:"center" }}>
          {activeCount===0 ? "SET CONDITIONS FOR GUIDED SELECTION" : "GUIDED + RANDOM CHAOS TWIST"}
        </div>
      </div>

      {/* ── Result card ─────────────────────────────────────── */}
      {result && !spin && (
        <div style={{
          margin:"0 auto", maxWidth:460, width:"calc(100% - 56px)",
          background:"#0b0b0b", border:"1px solid #1e1e1e", borderLeft:"3px solid #ff6b00",
          padding:"22px 22px 20px", animation:"fadeUp 0.4s ease",
        }}>
          {wild && (
            <div style={{
              display:"inline-block", background:"#ff6b00", color:"#080808",
              fontSize:8, letterSpacing:4, padding:"2px 9px", marginBottom:12, fontWeight:700,
            }}>⚡ WILD PICK</div>
          )}

          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:17, letterSpacing:2, color:"#ff6b00", fontWeight:700, marginBottom:3 }}>
            {result.name}
          </div>
          <div style={{ fontSize:9, letterSpacing:4, color:"#444", marginBottom:18 }}>
            {result.era} · {result.origin} · {result.type}
          </div>

          <div style={{ fontSize:9, letterSpacing:4, color:"#333", marginBottom:7 }}>CHARACTER</div>
          <div style={{ fontSize:12, letterSpacing:1, color:"#c8a96e", marginBottom:18, lineHeight:1.7 }}>{result.character}</div>

          <div style={{ fontSize:9, letterSpacing:4, color:"#333", marginBottom:7 }}>SHOOTING TIP</div>
          <div style={{ fontSize:11, color:"#787060", lineHeight:1.8, marginBottom:20 }}>{result.tip}</div>

          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
            <div>
              <div style={{ fontSize:9, letterSpacing:3, color:"#333", marginBottom:5 }}>RARITY</div>
              <div style={{ fontSize:15, letterSpacing:2, color:"#ff6b00" }}>
                {"●".repeat(result.rarity)}
                <span style={{ color:"#2a2a2a" }}>{"●".repeat(5-result.rarity)}</span>
              </div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:9, letterSpacing:3, color:"#333", marginBottom:3 }}>MAX APERTURE</div>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:22, color:"#c8a96e", letterSpacing:2 }}>{result.aperture}</div>
            </div>
          </div>

          <div style={{ marginTop:18, paddingTop:14, borderTop:"1px solid #111", display:"flex", gap:8, flexWrap:"wrap" }}>
            {result.subjects.map(s => (
              <div key={s} style={{ fontSize:8, letterSpacing:3, color:"#3a3a3a", border:"1px solid #1c1c1c", padding:"2px 8px" }}>
                {s.toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
