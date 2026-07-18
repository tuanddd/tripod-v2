# Tripod v2 — Canvas Podtown

Full-canvas sci-fi client for the **triple-pod** match-3 city builder engine.

Everything — board, HUD, arsenal, ops log, modals, welcome — renders inside a **single Phaser 3 canvas**.

## Live

**GitHub Pages:** https://tuanddd.github.io/tripod-v2/

## Stack

- Vite + TypeScript
- Phaser 3 (one canvas, FIT scale)
- Vendored `triple-pod` engine (`vendor/triple-pod`)

## Local

```bash
npm install
npm run dev        # http://localhost:5173  (base /)
```

```bash
npm run build      # production, base /tripod-v2/
npm run preview
```

## Deploy

Push to `main` — GitHub Actions builds and publishes Pages automatically
(`.github/workflows/deploy.yml`).

Manual: **Actions → Deploy to GitHub Pages → Run workflow**.
