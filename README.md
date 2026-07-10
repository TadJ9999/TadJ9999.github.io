# TAD W — NIGHT FLIGHT portfolio

Aviation × Cyber single-page developer portfolio. A scroll-driven Three.js
night flight over a glowing wireframe canyon, with a full avionics HUD:
boot sequence, live altitude that descends as you scroll (you land at the
contact section), heading tape, waypoint nav, and mission-brief project cards.

## Run locally

```bash
npm install
npm run dev      # dev server at http://localhost:5173
```

## Build for production

```bash
npm run build    # static output in dist/
npm run preview  # serve the built dist/ locally
```

## Edit content

All site content lives in **`src/data.js`** — projects (missions), experience,
skills, certifications, education, and the hero terminal lines. Edit that file;
no other code changes needed.

Contact links (LinkedIn / GitHub) and the About paragraphs are in **`index.html`**.

## Deploy to GitHub Pages

1. Create a repo and push this folder.
2. Repo → Settings → Pages → Source: **GitHub Actions**, pick the *Static HTML*
   workflow, and change the upload path to `dist` with a build step — or simply:

```bash
npm run build
# push the dist/ folder to a gh-pages branch, e.g. with:
npx gh-pages -d dist
```

`vite.config.js` already uses a relative base (`./`), so the build works from
any URL path.

## Notes

- Reduced motion: honors `prefers-reduced-motion` (skips boot + animations).
- No WebGL: falls back to a static gradient sky; all content remains readable.
- Boot sequence runs once per browser session (press any key to skip).
