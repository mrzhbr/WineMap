# Futuristic Wine Map (Mapbox)

A lightweight, futuristic map viewer built with Mapbox GL JS. The page displays:

- International wine growing regions (polygons) and
- German parcels / wine locations (points) from Weinlagen-info.de, shown as clustered markers.
- A sleek dark UI with a translucent info card: click a polygon or marker to see details.

This frontend is intentionally minimal (static HTML + Mapbox GL JS) so you can run it without a build step.

---

Quick checklist (what to do to run locally)

- [ ] Add your Mapbox access token to a local, git-ignored file: `frontend/token.js` (see below).
- [ ] Serve the `frontend` folder over HTTP (recommended: Python simple server or Vite). See commands.
- [ ] Open the page at `http://localhost:8000/` (or the port Vite uses).

---

Security: where to put your Mapbox token

Do NOT commit your Mapbox token to the repository. The app reads the token from a local file `frontend/token.js` which is gitignored.

Create `frontend/token.js` (NOT committed) with a single line:

```js
// frontend/token.js -- gitignored
window.MAPBOX_TOKEN = 'pk.your_mapbox_token_here';
```

The repository already contains `frontend/.gitignore` with `/token.js` listed. After you create the file, reload the app.

If you accidentally committed a token, rotate it immediately in your Mapbox account.

---

How to run (quick)

Option A — Simple static server (recommended for quick checks):

```bash
# from your project root
python3 -m http.server 8000 --directory ./frontend
# then open http://localhost:8000/ in your browser
```

Option B — With Vite (if you want hot reload and development flow):

```bash
cd frontend
npm install    # if it's not already installed
npm run dev    # Vite dev server (will show URL & port)
```

Notes: The HTML uses Mapbox GL JS (CDN). The token file (`/token.js`) must be served by the server so the page can read `window.MAPBOX_TOKEN` before the map code runs.

---

What the app does (features)

- Loads and renders polygons from `data/Weinanbaugebiete.json` as a GeoJSON source + `fill`/`line` layers.
- Loads and renders German parcels from `data/Deutsche_Weinlagen.json` as a clustered GeoJSON source (clusters + unclustered circles).
- Click a polygon or an unclustered point to populate the info card (bottom-right) with fields from the JSON (e.g., `bezeichnung`, `land_bezeichnung`, `rebsorten`, `flaeche`, `name`, `gemeinde`, etc.).
- UI controls: `Zoom to data`, `Toggle points`, `Toggle polygons`.
- Status box (top-right) shows counts and whether bounds are available; helpful for debugging.

---

Troubleshooting

If you see an empty/blank page or no data:

1. Open DevTools (Console) and look for errors.
   - Common: "Mapbox token missing" — create `frontend/token.js`.
   - Common: network 404 for `/data/Weinanbaugebiete.json` or `/data/Deutsche_Weinlagen.json` — ensure the static server serves from `frontend/`.
   - Mapbox auth errors (401) indicate an invalid or restricted token.

2. Check the on-screen status box (top-right) — it should show Points / Polygon counts.

3. Use the `Zoom to data` button to jump to the data extent.

4. If performance is slow (many markers) consider switching to a non-DOM rendering (the app already uses a GeoJSON circle layer and clustering for good performance). For very large datasets, consider vector tiles or server-side tiling.

If you paste console output here I can help diagnose any errors.

---

Development notes / next steps (suggestions)

- Improve styling: custom Mapbox Studio style to match Palantir/Gotham precisely.
- Add filtering, search, or an advanced sidebar to query by `rebsorten`, `land`, or `bezeichnung`.
- Add client-side caching or pagination for very large datasets.
- Convert to a React/Vite app (if you prefer component-based architecture) and add unit tests.

---

Files of interest

- `index.html` — main frontend page (Mapbox map, UI, data loaders).
- `token.js` — local Mapbox token file (create, gitignored).
- `data/Weinanbaugebiete.json` — polygons source (copied in `frontend/data`).
- `data/Deutsche_Weinlagen.json` — point source (copied in `frontend/data`).
- `frontend/.gitignore` — ignores `/token.js` and common artifacts.

---
