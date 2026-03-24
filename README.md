# Lens Roulette

Lens Roulette is a React + Vite application for selecting a vintage lens based on creative and technical shooting conditions.

The current engine uses an OOP Organic Scoring System (OS): each criterion (subject, mood, light, weather, focal class, focus behavior, etc.) is scored individually and then cross-influences other criteria to produce coherent picks.

## Quick Start

```bash
npm install
npm run dev
```

Open: `http://localhost:5173`

Build production bundle:

```bash
npm run build
npm run preview
```

## Documentation Map

- [Project Documentation](./docs/PROJECT_DOCUMENTATION.md)
  Complete guide: architecture, data flow, UI behavior, runtime model, and maintenance workflow.
- [Scoring OS Reference](./docs/SCORING_REFERENCE.md)
  Detailed explanation of the Organic Scoring System internals, scoring phases, and criterion interactions.
- [Lens Schema Reference](./docs/LENS_SCHEMA_REFERENCE.md)
  Full field reference for `LENS_DATA`, derived optical fields from `lensUtils`, and data authoring rules.

## Project Structure

```text
src/
  App.jsx                UI and interaction flow
  main.jsx               React entrypoint
  data/
    lenses.js            Canonical lens inventory (stored fields)
    lensUtils.js         Derived optical calculations
    lenses_OLD.js        Legacy dataset snapshot
  engine/
    index.js             OOP domain model + Organic Scoring System
```

## NPM Scripts

- `npm run dev` - Run local development server.
- `npm run build` - Build production bundle.
- `npm run preview` - Serve built output locally.

## Notes

- Lens additions should be made in `src/data/lenses.js`.
- Do not duplicate derived fields in `lenses.js`; they are computed via `deriveLens()` in `src/data/lensUtils.js`.
- `src/data/lenses_OLD.js` is kept as historical reference and is not used by the runtime engine.
