# DOORS TO MANUAL — Game Context
Vibe Jam 2026 | Built with Cursor + Phaser.js 3
Last updated: 18 April 2026

---

## Engine & Canvas
- Engine: Phaser.js 3 (CDN, no build step)
- Canvas: `CW = 800`, `CH = GRID_H + CANVAS_V_MARGIN * 2` (592px), portrait, pixelArt: true, roundPixels: true
- Font: Press Start 2P (Google Fonts)
- Jam widget: `<script async src="https://vibej.am/2026/widget.js"></script>` (required, already embedded)

---

## File Structure
```
index.html                        — HTML shell, HUD, legend “?” + controls modal, Phaser config
js/
  constants.js                    — All constants, TR, TC, C palette, PRNG, paxMap, tx/ty
  textures.js                     — generateTextures(scene) standalone function
  scenes/
    CharacterSelectScene.js       — Crew gender selection screen
    InstructionsScene.js          — Controls / scoring hints, START → cabin (Step 4b)
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
1. `CharacterSelectScene` — crew gender selection (female default); `scene.start('InstructionsScene')` after choice (Step 4b)
2. `InstructionsScene` — full-screen controls / scoring copy; **START** runs `CabinScene` (Step 4b)
3. `CabinScene` — all gameplay
4. `WinScene` — reserved placeholder

**Boot flow (Step 4b):** `CharacterSelectScene` → `InstructionsScene` → `CabinScene` (explicit scene starts; no HTML shim).

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
Arrow **Up** / **Down** move the crew along the aisle in `CabinScene` (boarding + service). **W** / **S** change facing only (no tile movement in the current build).

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

**Jam build (`constants.js`):** `paxMap` request `state` is rolled only from the **SIN → KUL** pool (`water`, `oj`, `sleeping`, `nothanks`). The full `PAX_STATES` list remains for future routes (BKK/NRT).

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

### `paxMap` seat fields (`constants.js`)
- `occ` — seat occupied (boolean)
- `v` — passenger sprite variant `0`–`3`
- `state` — request type for occupied seats (`null` if unoccupied). Jam: one of `water` | `oj` | `sleeping` | `nothanks` (see **Routes** above).

---

## Request bubbles (service phase)

Programmatic textures in `textures.js` (`generateTextures()`): `bubble_sleeping`, `bubble_nothanks`, `bubble_oj`, `bubble_water`, `bubble_wine`, `bubble_blanket`, `bubble_meal`, `bubble_medical` — white rounded speech bubble with tail + small pixel icon. Jam route only uses the first four keys in play.

**`CabinScene.js`**
- `this.bubbleByKey` — map of stable keys `"<paxRowNum>-<seatIdx>"` → bubble `Image` instances.
- `this.bubbleWindowStartDisplay` — first HUD cabin row number (1 = cockpit end, same numbering as row labels on screen) of a **two-row** visible window. The window shows that row and row `+ 1`.
- **`syncPassengerBubbles()`** — rebuilds desired bubble keys from `paxMap` for the two visible rows only; fades out removed keys, fades in new ones. Runs when `phase === "service"` and `serviceEntryComplete`, after service-entry tween completes, and after aisle moves (so bubble list stays correct).
- Bubble sprites: `setDepth(100)` (above trolley `10` and crew `20`), origin bottom-centre, slight overlap above seat tops.

**Step 4 (current):** `bubbleWindowStartDisplay` stays **`1`**, so only **HUD rows 1 and 2** ever show bubbles, regardless of crew position along the aisle.

**Step 5 (planned):** When a row is fully “solved” for all relevant seats, increment `bubbleWindowStartDisplay` (cap at `7` so the pair never exceeds rows 7–8), then call `syncPassengerBubbles()`. That yields: after row 1 done → rows **2–3**; after row 2 done → **3–4**; and so on. Crew movement alone must **not** advance the window.

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
- `#legend-open-btn` — persistent **?** control (below bottom HUD, flush right in `#game-wrapper`); opens full-page legend modal (does not pause Phaser)
- `#legend-modal` — semi-transparent overlay + beige panel; same legend text as `InstructionsScene`; **CLOSE** / **✕** / backdrop / **Escape** dismiss

## Instructions & legend (Step 4b)
- **`InstructionsScene`:** Press Start 2P, cabin palette (`#F5F0E8` / `#1B2A4A` / `#00FF7F`), title **DOORS TO MANUAL**, movement / interaction / scoring blocks, **START** (blinks “CLICK TO CONTINUE” like character-select hint tween).
- **Legend modal:** Pure HTML/CSS/JS in `index.html`; mirrors the same copy; never touches game state.

---

## Key Technical Notes
- Draw call order in `create()` must not be reordered: fuselage -> galley -> aisle tiles -> cabin -> cockpit -> aisleTint graphics -> crew sprite -> labels (dynamic request bubbles are spawned later at high depth and are not part of this static order)
- `this.playerCol` is always `TC.aisle` — never changes
- `this.playerRow` tracks current tile row (integer)
- `paxMap` seeded (seed 7331) — consistent layout every session, generated in `constants.js`
- `paxMap[rowNum][seatIdx]`: `.occ` occupied, `.v` variant `0`–`3`, `.state` request or `null` (see **Request bubbles**)
- Row numbering in `paxMap`: keys 1–8 where key `1` = `TR.cabin` (top cabin row, **HUD label Row 8**), key `8` = `TR.cabin + 7` (**HUD label Row 1**, cockpit end). HUD row label `D` ↔ `paxMap` key `rowNum = 9 - D` for the eight cabin rows.
- `setPhase(phase)` when leaving `service` fades all request bubbles and resets `bubbleWindowStartDisplay` to `1`

---

## Changelog (records)

### 2026-04-18 — Step 4b cleanup: explicit routing (no `ScenePlugin.start` shim)
- **`CharacterSelectScene.js`:** Crew `pointerdown` calls `scene.start('InstructionsScene')` instead of `CabinScene`.
- **`index.html`:** Removed monkey-patch on `Phaser.Scenes.ScenePlugin.prototype.start`; Phaser config + legend modal unchanged.

### 2026-04-18 — Step 4b: `InstructionsScene` + DOM `?` legend
- **`js/scenes/InstructionsScene.js`:** New Phaser scene between character select and cabin; START → `CabinScene`.
- **`index.html`:** Script include + `scene` array order; `#legend-open-btn`, `#legend-modal`, styles, and IIFE for open/close (backdrop, **CLOSE**, **✕**, Escape, body scroll lock). *(Initial build used a `ScenePlugin.start` shim; removed in Step 4b cleanup.)*

### 2026-04-18 — Step 4: passenger `state`, request bubbles, SIN–KUL jam pool
- **`constants.js`:** `paxMap[][].state` on occupied seats; jam build rolls only `PAX_STATES_SIN_KUL` (`water`, `oj`, `sleeping`, `nothanks`); full `PAX_STATES` retained for future routes.
- **`textures.js`:** eight `bubble_*` textures (rounded speech bubble + pixel icon + tail) at end of `generateTextures()`.
- **`CabinScene.js`:** service-phase request bubbles (`bubbleByKey`, `syncPassengerBubbles`, fade out on leave); `bubbleWindowStartDisplay` two-row window starting at HUD rows **1–2**; window does **not** advance with crew movement (Step 5 will advance after each row is fully solved); bubble depth `100`; `setPhase` resets window and clears bubbles when leaving `service`.
- **This doc:** Request bubbles section, `paxMap` fields, SIN–KUL jam note, HUD ↔ `paxMap` row mapping, controls note (arrow keys move aisle; W/S face only), technical notes updates, and this changelog.
