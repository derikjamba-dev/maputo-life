# Maputo Life

Maputo Life is a browser-based, single-player life sim set in Maputo.
Walk the city, talk to NPCs, visit landmarks, and juggle money, hunger,
energy, and fun through the day.

## Tech stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- React Three Fiber for the 3D city map
- Client-side game state with `localStorage` saves

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) or use `http://localhost:3000/play`.

## Checks

```bash
npm run lint
npm run test
npm run build
```

## Controls

- `WASD` / arrow keys: move directly
- Click / tap on the map: walk to a spot
- Click an NPC or press `E`: talk
- Click a building: approach its entrance
- `E` / `Enter`: continue dialogue
- `Escape`: close dialogue
- HUD buttons: save or start a new game

## Project layout

- `src/app/` - Next.js routes and global styles
- `src/components/game/` - React UI and 3D map
- `src/lib/` - game rules, player pathfinding, NPCs, saves
- `src/data/` - landmark and NPC content
- `docs/` - design notes and implementation plan
- `public/models/` - character and world assets

## Assets

3D models and their credits live under `public/models/`. See
`public/models/CREDITS.md`.