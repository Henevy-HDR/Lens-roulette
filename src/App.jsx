import { useState, useRef } from "react";
import { LensCollection, ScoringEngine, OPTIONS as ENGINE_OPTIONS } from "./engine";
import { LENS_DATA } from "./data/lenses";

const COLLECTION = new LensCollection(LENS_DATA);
const OPTIONS = { ...ENGINE_OPTIONS, subject: [...COLLECTION.uiSubjects, "🎲 Wild"] };

export default function LensRoulette() {
  const [cond, setCond]     = useState({});
  const [spin, setSpin]     = useState(false);
  const [disp, setDisp]     = useState({ name: "── ──── ──", ap: "f/──", origin: "────" });
  const [result, setResult] = useState(null);
  const [wild,   setWild]   = useState(false);
  const [why,    setWhy]    = useState(null);
  const timers = useRef([]);

  const activeCount = Object.values(cond).filter(Boolean).length;
  const reasons = buildReasons(why);

  function clearTimers() { timers.current.forEach(clearInterval); timers.current = []; }

  function runSpin() {
    if (spin) return;
    clearTimers();
    setSpin(true);
    setResult(null);
    setWhy(null);

    const { lens: chosen, wild: isWild, breakdown } = ScoringEngine.pick(COLLECTION, cond);

    const phases = [[55,14],[100,9],[170,6],[280,4],[450,3]];
    let pi = 0;

    function next() {
      if (pi >= phases.length) {
        setDisp({ name: chosen.shortName, ap: chosen.aperture, origin: chosen.origin.toUpperCase() });
        setTimeout(() => { setSpin(false); setWild(isWild); setResult(chosen); setWhy(breakdown); }, 350);
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
    setWhy(null);
  }

  function formatFocal(lens) {
    if (!lens?.focalLength) return "--";
    const { min, max } = lens.focalLength;
    if (min == null || max == null) return "--";
    return min === max ? `${min}mm` : `${min}-${max}mm`;
  }

  function formatMinFocus(lens) {
    return typeof lens?.minFocus === "number" ? `${lens.minFocus}m` : "--";
  }

  function formatWeight(lens) {
    return typeof lens?.weight === "number" ? `${lens.weight}g` : "--";
  }

  function formatScore(value) {
    if (typeof value !== "number") return "";
    const v = Math.round(value * 10) / 10;
    return v >= 0 ? `+${v}` : `${v}`;
  }

  function buildReasons(breakdown) {
    if (!breakdown) return [];
    const rows = [
      { key: "subject",   label: "SUBJECT" },
      { key: "light",     label: "LIGHT" },
      { key: "mood",      label: "MOOD" },
      { key: "location",  label: "LOCATION" },
      { key: "weather",   label: "WEATHER" },
      { key: "bokeh",     label: "BOKEH" },
      { key: "traits",    label: "TRAITS" },
      { key: "randomness",label: "RANDOMNESS" },
    ];
    return rows
      .map(r => ({ ...r, data: breakdown[r.key] }))
      .filter(r => r.data && r.data.score)
      .map(r => ({
        label: r.label,
        score: r.data.score,
        detail: (r.data.detail || []).join(", "),
      }));
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

          <div style={{ fontSize:9, letterSpacing:4, color:"#333", marginBottom:7 }}>WHY THIS LENS</div>
          <div style={{ fontSize:11, color:"#8e876f", lineHeight:1.7, marginBottom:18 }}>
            {wild && <div style={{ marginBottom:6 }}>Pure random wild pick — conditions ignored.</div>}
            {reasons.length === 0 && !wild && (
              <div>No matching conditions — random selection applied.</div>
            )}
            {reasons.map(r => (
              <div key={r.label} style={{ display:"flex", gap:8 }}>
                <div style={{ minWidth:84, color:"#6f6a58", letterSpacing:2 }}>{r.label}</div>
                <div style={{ color:"#c8a96e" }}>{formatScore(r.score)}</div>
                <div style={{ color:"#7e7762" }}>{r.detail || "match"}</div>
              </div>
            ))}
          </div>

          <div style={{ display:"flex", flexWrap:"wrap", gap:12, marginBottom:18 }}>
            {[
              ["FOCAL", formatFocal(result)],
              ["MIN FOCUS", formatMinFocus(result)],
              ["WEIGHT", formatWeight(result)],
              ["CONTRAST", (result.contrast || "--").toUpperCase()],
              ["FLARE", (result.flare || "--").toUpperCase()],
              ["BOKEH", (result.bokeh || "--").toUpperCase()],
            ].map(([label, val]) => (
              <div key={label} style={{ minWidth:90 }}>
                <div style={{ fontSize:9, letterSpacing:3, color:"#333", marginBottom:4 }}>{label}</div>
                <div style={{ fontSize:11, color:"#c8a96e", letterSpacing:1 }}>{val}</div>
              </div>
            ))}
          </div>

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
