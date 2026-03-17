# 🎞 Lens Roulette

A vintage glass selector for the Canon EOS M50 — guided by shooting conditions, spiced with randomness.

Built with React + Vite. Deploys to Vercel in ~2 minutes.

---

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:5173

---

## Deploy to Vercel (recommended)

### Option A — Vercel CLI (fastest, ~2 min)

```bash
npm install -g vercel
vercel
```

Follow the prompts:
- **Set up and deploy?** → Y
- **Link to existing project?** → N
- **Project name** → `lens-roulette`
- **Directory** → `./`
- **Override settings?** → N

Done. Live at `https://lens-roulette.vercel.app`.

### Option B — GitHub + Vercel (best for ongoing updates)

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/lens-roulette.git
git push -u origin main
```

Then go to https://vercel.com → **Add New Project** → import the repo → **Deploy**.  
Every `git push` auto-deploys. ✅

---

## Adding a new lens

In `src/App.jsx`, add a `new Lens({...})` to the `COLLECTION` array:

```js
new Lens({
  shortName: "HELIOS  44",      // ≤12 chars — shown on the slot reel
  name:      "Helios 44-2 58mm f/2",
  aperture:  "f/2",
  type:      "Prime",           // Prime | Zoom | Macro | Cine Prime | Tele Prime | Tele Zoom
  origin:    "Soviet",          // Japanese | Soviet | East German | Third Party
  era:       "1970s",
  rarity:    3,                 // 1 (common) – 5 (museum piece)
  outdoor:   true,
  character: "Legendary swirly bokeh, KMZ optical design",
  tip:       "Shoot wide open towards a busy background for the swirl effect.",
  subjects:  ["street", "nature"],
  moods:     ["warm", "lofi"],  // warm | clinical | cinematic | lofi
  light:     ["any"],
  weather:   ["any"],
}),
```

New subject tags auto-appear as pills in the UI — no other changes needed.

---

## Tuning the algorithm

All weights in one place at the top of `src/App.jsx`:

| Weight | Default | Effect |
|--------|---------|--------|
| `subject` | 4 | How much subject match matters |
| `mood` | 1.5 | How much mood nudges results |
| `chaos` | 2.5 | Max random bonus per lens |
| `wildProb` | 0.28 | Chance of a surprise wild pick |

Raise `chaos` for more surprises. Raise `subject` to make conditions dominate.
