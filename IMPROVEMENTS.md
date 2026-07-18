# Tripod v2 — Improvements over v1 (`tripod-web`)

## Architecture shift: DOM → single canvas

| | v1 | v2 |
|---|---|---|
| Render | Pure HTML/CSS/React DOM | **Single Phaser 3 canvas** |
| Framework | Next.js 13 pages | Vite + TypeScript |
| UI nodes | Hundreds of DOM elements | One `<canvas>` only |
| Layout | CSS grid / Tailwind | Design resolution 1280×720, `Scale.FIT` |
| Engine | `triple-pod-game-engine` npm | Same engine (local source via Vite alias) |

**Everything happens inside the canvas:** welcome screen, HUD, board, pieces, droids, arsenal, ops log, buy confirm, field manual, mission-over, toasts, starfield.

---

## Visual & UX polish

1. **Cohesive sci-fi identity** — void/nebula starfield, purple–cyan–gold tokens, glass panels drawn with Phaser Graphics  
2. **Welcome boot** — animated logo float, tagline, ENGAGE CTA, camera fade into ops deck  
3. **HUD chips** — Score / Holding / Next Tier / Credits with score pop + floating `+N`  
4. **Board juice** — gradient frame, spinning storage disk, piece pop-in/out, merge particle bursts, bomb target highlights, ghost place-preview  
5. **Droid hops** — engine `bear-move` events drive hop tweens on canvas sprites  
6. **Arsenal** — in-canvas shop rows, afford colors, Deploy confirm modal  
7. **Ops Log** — color-coded match / combo / buy / boom entries  
8. **Field Manual** — complete how-to + object chains (v1 left TBD / `???`)  
9. **Mission Over** — full-canvas end card with RELaunch  
10. **Audio bus** — SFX + looping ambience, mute / ambience toggles  
11. **Toasts** — canvas-drawn spring toasts for errors and guidance  

---

## Engine fidelity

Unchanged contract via `GameState` wrapper:

- `put` / `swap` / `buy` / `use`  
- Events: `condense`, `bear-move`, `destroy`, `transform`, `miss`  
- Shop: airdropper, reroll, portal, terraformer, mega/mini bomb  
- Game-end when board full with no clearing option  

---

## Run

```bash
cd triple-pod && yarn build   # optional; Vite loads engine from src
cd ../tripod-v2 && npm install && npm run dev
```

→ http://localhost:5173
