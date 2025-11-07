# Futuristic Wine Map — React + Vite (Modular)

This is a modular React application powered by Vite and Mapbox GL JS. The map renders clustered German wine locations (points) and wine-growing regions (polygons). It supports a 3D globe mode with terrain/fog and polygon highlighting.

Token setup (required)

- Create `frontend/.env` and set your Mapbox token:

```
VITE_MAPBOX_TOKEN=pk.your_mapbox_token_here
```

- The app now uses only the `.env` value (no token.js fallback).

Quick start

```bash
cd frontend
npm install
npm run prepare   # copies data/ into public/data
npm run dev
```

Build and preview

```bash
npm run build
npm run preview
```

Data

- JSON files are served from `/data/...`. During dev, they’re read from `frontend/public/data/`.
- The postbuild script copies public/data into `dist/data` for preview.

Features

- Clustered points and polygon overlays
- Click priority: markers > clusters > polygons
- Polygon highlight toggling on click
- 3D globe toggle with animated camera and terrain/fog

Troubleshooting

- 401/403 from Mapbox: check `VITE_MAPBOX_TOKEN` and token scopes (styles:read, tiles:read).
- No data: ensure `public/data` contains the JSON files (run `npm run prepare`).
