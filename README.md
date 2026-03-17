# 📷 Lens Roulette

A guided + random lens picker for your vintage glass collection. Built with React + Vite.

## Local Development

```bash
npm install
npm run dev
```
Open http://localhost:5173

---

## Deploy to Vercel (recommended)

### Option A — Vercel CLI (fastest)

```bash
npm install -g vercel
vercel
```
Follow the prompts — Vercel auto-detects Vite. You'll get a live URL immediately.

### Option B — via GitHub (best for ongoing updates)

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/lens-roulette.git
git push -u origin main
```

Then go to vercel.com → Add New Project → import the repo → Deploy.
Every `git push` to `main` auto-deploys.

---

## Deploy to GitHub Pages (alternative)

```bash
npm install --save-dev gh-pages
```

Add to `package.json` scripts:
```json
"predeploy": "npm run build",
"deploy": "gh-pages -d dist"
```

Add `base: '/lens-roulette/'` to `vite.config.js`, then:
```bash
npm run deploy
```

---

## Adding a Lens

Add a new `Lens` object to the `COLLECTION` array in `src/App.jsx`:

```js
new Lens({
  shortName: "LABEL  XX",     // shown on the slot reel (≤12 chars)
  name:      "Full Lens Name",
  aperture:  "f/1.8",
  type:      "Prime",         // Prime | Zoom | Macro | Cine Prime | Tele Prime | Tele Zoom
  origin:    "Japanese",      // Japanese | Soviet | East German | Third Party
  era:       "1970s",
  rarity:    3,               // 1–5
  outdoor:   true,
  character: "One-line optical personality",
  tip:       "Shooting tip shown on result card.",
  subjects:  ["street", "landscape"],  // street | landscape | macro | nature
  moods:     ["warm"],                 // warm | clinical | cinematic | lofi
  light:     ["any"],                  // any | bright sun | golden hour | low light | night
  weather:   ["any"],                  // any | sunny | cloudy | rain | fog
}),
```

New subject tags auto-appear as pills — no other changes needed.

---

## Tuning the Algorithm

All weights live in `ScoringEngine.WEIGHTS` at the top of `src/App.jsx`.
Raise `chaos` (default 2.5) for more randomness. Lower `wildProb` (default 0.28) for more deterministic picks.
