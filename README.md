# RAZ 7 — Spanish Open World Adventure

3D open-world game (React + TypeScript + Vite + Three.js + Rapier) for learning Spanish.
Every Spanish text is clickable and opens an Armenian translation with pronunciation.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

Controls: WASD move · Shift run · Space jump · E interact · F enter/exit vehicle · M map ·
mouse camera (click to lock) · wheel zoom · left click / K shoot (hold for power) · Q pass · Esc/P pause.
Touch devices get a virtual joystick, camera drag and action buttons.

Structure:
- `src/game/world/` — engine: city, interiors, player, camera, vehicles, traffic, NPCs, football, weather, audio
- `src/game/data/` — places, cities, missions (70), NPC dialogues, grammar bank, products, minigames
- `src/game/controller.ts` — mission runner and interaction logic
- `src/i18n/` — translation component `<T>`, lexicon, speech
- `src/ui/` — HUD, menus, dialogues, shop, 16 panel minigames
