# DOORS TO MANUAL — Game Context
Vibe Jam 2026 | Built with Cursor + Phaser.js 3
Last updated: April 2026

---

## Engine & Canvas
- Engine: Phaser.js 3 (CDN, no build step)
- Canvas: `CW = 800`, `CH = GRID_H + CANVAS_V_MARGIN * 2` (592px), portrait, pixelArt: true, roundPixels: true
- Font: Press Start 2P (Google Fonts)
- Jam widget: `<script async src="https://vibej.am/2026/widget.js"></script>` (required, already embedded)

---

## File Structure
```
index.html                        — HTML shell, HUD, script tags, Phaser config only
js/
  constants.js                    — All constants, TR, TC, C palette, PRNG, paxMap, tx/ty
  textures.js                     — generateTextures(scene) standalone function
  scenes/
    CharacterSelectScene.js       — Crew gender selection screen
    CabinScene.js                 — All gameplay
    WinScene.js                   — Placeholder (Step 10)
sprites/                          — PNG sprite files
```

---

## Grid Constants
- `TILE = 48`
- `GRID_COLS = 9`, `GRID_ROWS = 12`, `CABIN_ROWS = 8`
- `GRID_W = 432`, `GRID_H = 576`, `CANVAS_V_MARGIN = 8`
- `OX = Math.floor((CW - GRID_W) / 2)` — centres grid horizontally
- `OY = CANVAS_V_MARGIN` — top offset

## Tile Column Indices (TC)
| Key | Value | Description |
|---|---|---|
| `TC.fuseLeft` | 0 | Left fuselage wall |
| `TC.seatA` | 1 | Left window seat |
| `TC.seatB` | 2 | Left middle seat |
| `TC.seatC` | 3 | Left aisle seat |
| `TC.aisle` | 4 | Centre aisle — player movement lane |
| `TC.seatD` | 5 | Right aisle seat |
| `TC.seatE` | 6 | Right middle seat |
| `TC.seatF` | 7 | Right window seat |
| `TC.fuseRight` | 8 | Right fuselage wall |

## Tile Row Indices (TR)
| Key | Value | Description |
|---|---|---|
| `TR.fuseTop` | 0 | Top fuselage wall |
| `TR.galley` | 1 | Galley — trolley spawn, pull-up start |
| `TR.cabin` | 2 | First cabin row (labelled Row 8 in-game) |
| `TR.cockpit` | 10 | Cockpit door — player cannot enter |
| `TR.fuseBot` | 11 | Bottom fuselage wall |

- Cabin rows: `TR.cabin` (index 2) through `TR.cabin + 7` (index 9)
- In-game row labels count downward: index 2 = Row 8, index 9 = Row 1
- Player spawn: `TR.cabin + 7` (Row 1, bottom cabin boundary)
- Player top boundary: `TR.galley` — cannot move above galley row
- Player bottom boundary: `TR.cabin + 7` — cannot enter cockpit

---

## Scenes
1. `CharacterSelectScene` — crew gender selection (female default), starts `CabinScene`
2. `CabinScene` — all gameplay
3. `WinScene` — reserved placeholder

---

## Sprite Files (in `/sprites/`)
- `female-crew-south/north/east/west.png`
- `male-crew-south/north/east/west.png`
- `pax-0/1/2/3-south/north/east/west.png` (4 passenger variants)

Crew texture prefix stored as `this.crewTexturePrefix` (e.g. `'female-crew-'`).
Crew gender stored as `this.crewGender` (`'female'` or `'male'`).
Selected crew set via `window.selectedCrew` in `CharacterSelectScene`.

---

## Controls
| Key | Action |
|---|---|
| W / Arrow Up | Move up (toward galley) — face north |
| S / Arrow Down | Move down (toward cockpit) — face south |
| A | Face west (no tile movement) |
| D | Face east (no tile movement) |
| SPACEBAR | Interact — begin service, serve, collect, fetch, reset |
| SHIFT | Skip sleeping / no-thanks passenger |
| 1 / 2 / 3 | Select drink (1: OJ, 2: Water, 3: Wine) |

Movement is tile-by-tile (48px per keypress, JustDown only — no held-key repeat).
Player always constrained to `TC.aisle` — cannot enter seat columns.
Both Arrow keys and WASD registered for up/down movement.

---

## Phase Flow
`idle` → `service` → `collection` → `callbutton` → `landing` → `win`

| Phase | Trigger | HUD Label |
|---|---|---|
| `idle` | Game start — player at Row 1, waiting for SPACEBAR | BOARDING |
| `service` | SPACEBAR in idle — trolley spawns, crew tweens to galley+1, walks down | SERVICE |
| `collection` | Trolley parks — player collects cups | COLLECTION* |
| `callbutton` | Collection complete — call buttons fire | CALL BUTTONS* |
| `landing` | Timer expires — seatbelt sign on, aisle tint clears | LANDING |
| `win` | Landing complete — DOORS TO MANUAL screen | — |

*Not yet implemented — reserved string only.

### Phase Notes
- `setPhase(phase)` handles both `this.phase` assignment and `#hud-phase` DOM update
- `setAisleTint(true)` fires when `service` begins, stays active until `landing`
- `setAisleTint(false)` fires only when `landing` phase begins
- `serviceEntryComplete` flag prevents input during crew tween animation
- `syncServiceUnitPositions()` keeps trolley one tile above player during service

### Trolley Behaviour
- Spawns at `TR.galley` when SPACEBAR first pressed (lazy init — created on first use)
- During service: trolley row = `this.playerRow - 1` (one tile above player, toward galley)
- Depth: `this.trolley.setDepth(10)`, crew sprite depth: `this.crewSprite.setDepth(20)`
- Trolley position updated via `syncServiceUnitPositions()` on each move

---

## Routes (Jam Build — all routes use 8 rows)
> Row count is fixed at 8 for the jam build. Post-jam routes will scale rows.

| Route | Timer | Request Types | Turbulence |
|---|---|---|---|
| SIN → KUL Easy | 4 min | Drinks + Call Button | 1x mild (~10 sec) |
| SIN → BKK Medium | 5 min | Drinks + Call Button + Blanket + Meal | 2x moderate (~15 sec each) |
| SIN → NRT Hard | 6 min | All types + Medical | 3x severe (~20 sec each) |

---

## Passenger States
| State | Icon | Action | Penalty if Wrong |
|---|---|---|---|
| Sleeping | zz | SHIFT to skip | SPACEBAR = woken, -15 |
| No Thanks | X | SHIFT to skip | SPACEBAR = forced serve, -10 |
| OJ | OJ | SPACEBAR then 1 | Wrong drink: -10 |
| Water | W | SPACEBAR then 2 | Wrong drink: -10 |
| Wine | Wi | SPACEBAR then 3 | Wrong drink: -10 |
| Blanket | Bl | SPACEBAR (BKK/NRT) | Missed: -10 |
| Meal | Me | SPACEBAR (BKK/NRT) | Missed: -10 |
| Medical | !! | SPACEBAR (NRT only) | Missed: -30 |

Bubble reveal: only 4 rows ahead of player's current position visible at any time.

---

## Scoring
| Action | Points |
|---|---|
| Correct drink served | +10 |
| Call button fetch resolved | +15 |
| Accidental press reset | +5 |
| Cup collected | +3 |
| Blanket delivered | +10 |
| Meal delivered | +12 |
| Medical resolved | +25 |
| Wrong drink served | -10 |
| Sleeping passenger woken | -15 |
| No-thanks passenger served | -10 |
| Cup missed (per cup) | -5 |
| Turbulence spill (per item) | -8 |
| Missed medical | -30 |
| Unresolved call button at landing | -12 |

---

## Colour Palette
| Element | Value |
|---|---|
| Canvas background | C.bg = 0x111111 |
| Cabin floor | C.cabinFloor = 0xF5F0E8 |
| Seats | C.seatNavy = 0x1B2A4A |
| Aisle | C.aisle = 0xD0CEC8 |
| Aisle tint (service active) | 0xd4a96a at alpha 0.35 |
| Galley | C.galleyFill = 0xBBBBBB |
| Cockpit door | C.cockpitFill = 0x0F1A2E |
| Crew uniform | C.crewBody = 0x00FF7F (neon green) |
| Crew accents | C.crewAccent = 0xFFD700 (yellow) |
| HUD background | #1B2A4A (CSS) |
| Win screen text | #00FF7F on #000000 |

---

## HUD DOM Elements
- `#hud-timer` — countdown timer (static 04:00 placeholder, not yet wired)
- `#hud-score` — score display (SCORE: 0 placeholder)
- `#hud-phase` — phase label, updated by `setPhase()` in `CabinScene`

---

## Key Technical Notes
- Draw call order in `create()` must not be reordered: fuselage -> galley -> aisle tiles -> cabin -> cockpit -> aisleTint graphics -> crew sprite -> labels
- `this.playerCol` is always `TC.aisle` — never changes
- `this.playerRow` tracks current tile row (integer)
- `paxMap` seeded (seed 7331) — consistent layout every session, generated in `constants.js`
- `paxMap[rowNum][seatIdx].occ` = boolean occupied, `.v` = passenger variant (0-3)
- Row numbering in `paxMap`: keys 1-8 where key 1 = TR.cabin (top cabin row, labelled Row 8 in-game)
