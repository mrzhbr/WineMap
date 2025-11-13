# WineMap 🍷🌍

An interactive map showcasing German wine regions with search functionality and detailed information panels.

## Features

- 🗺️ Interactive map with German wine regions
- 🔍 Search for wine grape varieties
- 🎨 Toggle between map styles (satellite, terrain, etc.)
- ℹ️ Info cards with region details
- 🌐 3D globe mode with terrain/fog effects

## Prerequisites

- Node.js (v14+)
- npm or yarn
- Mapbox Access Token

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/wine-map.git
   cd wine-map/frontend
   ```

2. **Set up environment variables**
   Create a `.env` file in the `frontend` directory:
   ```
   VITE_MAPBOX_TOKEN=your_mapbox_access_token_here
   ```

3. **Install dependencies**
   ```bash
   npm install
   # or
   yarn
   ```

4. **Prepare data**
   ```bash
   npm run prepare   # copies data/ into public/data
   ```

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. **Open in browser**
   ```
   http://localhost:5173
   ```

## Build and Deploy

```bash
# Create production build
npm run build

# Preview production build locally
npm run preview
```

## How to Use

1. **Search for Grape Varieties**
   - Click the grape icon (🍇) to open the search panel
   - Type a grape variety (e.g., "Riesling")
   - Click on a result to zoom to that region

2. **Map Controls**
   - Toggle points and polygons visibility
   - Switch between map styles
   - Use the zoom buttons or mouse wheel to navigate
   - Toggle 3D globe mode with terrain/fog effects

3. **Region Information**
   - Click on any region to see detailed information
   - The info card will appear in the bottom-left corner

## Data

- Wine region data from weinlagen-info.de
- Map tiles provided by Mapbox
- Data files are served from `/data/` and copied to `public/data/` during build
- Postbuild script ensures data is available in `dist/data/` for production

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- Built with React, Vite, and Mapbox GL JS
- Icons by Twemoji
- Wine region data collected from weinlagen-info.de

---

Made with ❤️ by [mrzhbr]
