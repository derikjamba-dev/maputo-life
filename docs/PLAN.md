# Implementation Plan (Maputo Life, LagosLife-style)

## Step 1: Setup ✅
- Next.js + TypeScript + Tailwind CSS (App Router)
- Project structure under D:/xampp/htdocs/maputo-life
- Config, linting if needed

## Step 2: Core Architecture ✅
- Game canvas/component (DOM sprites + rAF loop)
- State management (React state + simulation ref)
- Player/avatar (name + color on start screen)
- Location system (12 spots, zone detection)
- HUD (name, location, time/day, money, stat bars)

## Step 3: Map & Locations ✅
- Top-down tilemap w/ camera follow
- Praca da Independencia, Cathedral, Fortaleza, Railway, Mercado Central, Tunduru, Costa do Sol, FEIMA, Baixa, Polana, Sommerschield, Natural History Museum
- Neighborhoods

## Step 4: Assets (in progress)
- ✅ Emoji/CSS sprites (avatar, NPCs, decor)
- ⬜ Pixel-art sprite sheets (avatar, NPCs, chapas, buildings)
- ⬜ Tiles, UI art

## Step 5: Gameplay Loop ✅
- Move, explore, interact, hangout
- ✅ 7 wandering NPCs with dialogue (press E)
- ✅ Transport (chapa/carrinha/mota/taxi fast-travel)
- ✅ Sleep (advance to morning)
- ✅ Save/load (localStorage auto-save + manual)

## Step 6: Polish (in progress)
- ✅ HUD, action panel, dialogue box, transport menu
- ✅ Day/night tint cycle
- ⬜ Sound (marrabenta/chapa ambience, SFX)
- ⬜ Menus (settings, inventory)

## Step 7: Build & test ✅
- npm run dev/build (tsc + eslint + next build all pass)
- npm run test (Vitest unit tests for game rules, player movement, and save data)

## Step 8: Quality hardening (in progress)
- ✅ NPC proximity ring now follows each NPC
- ✅ Save data is validated/normalized before load and storage
- ✅ README documents controls and project layout
- ⬜ Sound (marrabenta/chapa ambience, SFX)
- ⬜ Interiors for enterable landmarks
- ⬜ Settings and inventory menus
