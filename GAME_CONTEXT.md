# DOORS TO MANUAL — Game Context
Vibe Jam 2026 | Built with Cursor + Phaser.js 3
Last updated: 29 April 2026 | Synced to: DoorsToManual_GDD_v4_FINAL.md

---

## Engine & Canvas
- Engine: Phaser.js 3 via CDN: `https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js`
- Canvas: `CW = 800`, `CH = 592px` (`GRID_H + CANVAS_V_MARGIN * 2`), portrait
- `pixelArt: true`, `roundPixels: true`, `Phaser.Scale.FIT`, `CENTER_BOTH`
- Font: Press Start 2P (Google Fonts)
- Jam widget: `<script async src="https://vibej.am/2026/widget.js"></script>` — REQUIRED in `<head>`, already embedded

---

## File Structure
```
index.html                        — HTML shell, HUD bars, hint bar, legend modal, Phaser config
js/
  constants.js                    — All constants, TR, TC, C palette, PRNG, ROUTES, paxMap, tx/ty
  textures.js                     — generateTextures(scene) standalone function
  scenes/
    CharacterSelectScene.js       — Crew gender + route selection screen
    InstructionsScene.js          — Controls / scoring hints, START → CabinScene
    CabinScene.js                 — All gameplay
    WinScene.js                   — Win screen (DOORS TO MANUAL) + leaderboard
sprites/                          — PNG sprite files
```

---

## Grid Constants
- `TILE = 48`
- `GRID_COLS = 9`, `GRID_ROWS = 12`, `CABIN_ROWS = 8`
- `GRID_W = 432` (9 × 48), `GRID_H = 576` (12 × 48)
- `CANVAS_V_MARGIN = 8`
- `OX = Math.floor((CW - GRID_W) / 2)` = 184 — centres grid horizontally
- `OY = CANVAS_V_MARGIN` = 8 — top offset

## Tile Column Indices (TC)
| Key | Value | Description |
|---|---|---|
| `TC.fuseLeft` | 0 | Left fuselage wall |
| `TC.seatA` | 1 | Left window seat |
| `TC.seatB` | 2 | Left middle seat |
| `TC.seatC` | 3 | Left aisle seat |
| `TC.aisle` | 4 | Centre aisle — ONLY column player moves through |
| `TC.seatD` | 5 | Right aisle seat |
| `TC.seatE` | 6 | Right middle seat |
| `TC.seatF` | 7 | Right window seat |
| `TC.fuseRight` | 8 | Right fuselage wall |

Seat groups:
- `SEAT_COLS_LEFT = [TC.seatA, TC.seatB, TC.seatC]` — seats A, B, C (left of aisle)
- `SEAT_COLS_RIGHT = [TC.seatD, TC.seatE, TC.seatF]` — seats D, E, F (right of aisle)

## Tile Row Indices (TR)
| Key | Value | Description |
|---|---|---|
| `TR.fuseTop` | 0 | Top fuselage wall |
| `TR.galley` | 1 | Galley — trolley spawn, pull-up start |
| `TR.cabin` | 2 | First cabin row (labelled Row 8 in-game) |
| `TR.cockpit` | 10 | Cockpit door — player cannot enter |
| `TR.fuseBot` | 11 | Bottom fuselage wall |

- Cabin rows: `TR.cabin` (index 2) through `TR.cabin + 7` (index 9)
- HUD labels count from cockpit end: tile index 9 = HUD Row 1, tile index 2 = HUD Row 8
- Player spawn: `TR.cabin + 7` (HUD Row 1, cockpit end), facing south
- Player top boundary: `TR.galley` — cannot move above galley row
- Player bottom boundary: `TR.cabin + 7` — cannot enter cockpit

### Row Numbering Formula
- `tileRow = TR.cabin + (8 - hudRow)`
- `paxMapKey = 9 - hudRow`
- paxMap keys 1–8: key 1 = TR.cabin (HUD Row 8), key 8 = TR.cabin+7 (HUD Row 1)

---

## Scenes & Boot Flow
`CharacterSelectScene` → `InstructionsScene` → `CabinScene` → `WinScene`

1. `CharacterSelectScene` — crew gender selection (female default) AND route selection (KUL default); `scene.start('InstructionsScene')` after crew click
2. `InstructionsScene` — full-screen controls / scoring copy; **CLICK TO CONTINUE** runs `CabinScene`
3. `CabinScene` — all gameplay
4. `WinScene` — DOORS TO MANUAL win screen + leaderboard

### CharacterSelectScene Layout
- Black background
- Title: "DOORS TO MANUAL" — #00FF7F, 20px
- Subtitle: "SELECT YOUR CREW" — white, 13px
- Two crew boxes (FEMALE left, MALE right): ~108×152px, dark navy, rounded corners, 96×96px sprite preview, label below
  - Default highlight: FEMALE (neon green border). Hover swaps highlight.
  - Click: `window.selectedCrew = 'female'|'male'` → `this.scene.start('InstructionsScene')`
- Route selector below crew boxes: three buttons — EASY (KUL), MEDIUM (BKK), HARD (NRT)
  - Default: EASY / KUL. Active route shows neon green border.
  - Click sets `window.selectedRoute = 'KUL'|'BKK'|'NRT'`
- Blinking "CLICK TO START" hint at bottom

### InstructionsScene Layout
- Three panels: Movement controls, Interaction controls, Scoring summary
- Blinking "CLICK TO CONTINUE" → `this.scene.start('CabinScene')`

### WinScene Layout
- Black background
- Sub-line: "CABIN CHECKED AND READY FOR LANDING" — white, smaller
- Reveal: "DOORS TO MANUAL" — #00FF7F, large, centred
- "FINAL SCORE: {N}" — yellow
- Global leaderboard (Supabase) — 5 mock rows if Supabase not configured
- Play again → `this.scene.start('CharacterSelectScene')`
- Update top HUD: `#hud-armed` text → "DOORS TO MANUAL", colour → #00FF7F

---

## Sprite Files (in `/sprites/`)
- `female-crew-south/north/east/west.png`
- `male-crew-south/north/east/west.png`
- `pax-0/1/2/3-south/north/east/west.png` (4 passenger variants × 4 directions = 16 files)

Crew texture prefix stored as `this.crewTexturePrefix` (e.g. `'female-crew-'`).
Crew gender stored as `this.crewGender` (`'female'` or `'male'`).
If any sprite fails to load, generate a programmatic fallback texture with the same key using Phaser Graphics. Game must run fully without any PNG files present.

---

## Controls — Complete Key Map

| Key | Phase(s) | Action |
|---|---|---|
| Arrow Up / W | idle, service, collection, callbutton | Move up one tile (toward galley) |
| Arrow Down / S | idle, service, collection, callbutton | Move down one tile (toward cockpit) |
| A | all | Face west — target seats D, E, F |
| D | all | Face east — target seats A, B, C |
| Arrow Left / Arrow Right | service, collection, callbutton | Move selection highlight between passengers within current row on the faced side |
| ESC | service, collection, callbutton | Deselect current passenger / close open prompt |
| SPACEBAR | idle | Begin service (spawn trolley, tween crew to galley+1, start timer) |
| SPACEBAR | service | Open combined drink/meal prompt for highlighted seat |
| SPACEBAR | collection | Open collection interaction for highlighted seat |
| SPACEBAR | callbutton | Open call button interaction for highlighted seat |
| 1 / 2 / 3 | service (prompt active) | Select OJ / Water / Wine |
| 4 | service, BKK only (prompt active) | Select Pad Thai |
| 4 | service, NRT only (prompt active) | Select Yakisoba |
| 5 | service, BKK only (prompt active) | Select Chicken Rice |
| 5 | service, NRT only (prompt active) | Select Fish with Potatoes |
| SHIFT | service | Skip sleeping or no-thanks passenger (standalone — no SPACEBAR needed first) |
| C | collection | Collect cup/tray from selected seat (after SPACEBAR opens interaction) |
| SHIFT | collection | Skip passenger who does not want cup collected (after SPACEBAR opens interaction) |
| F | callbutton — Scenario A | Fetch item(s) from galley (opens 1=DRINK / 2=SNACK prompt) |
| 1 | callbutton — Scenario A, at galley | Select DRINK |
| 2 | callbutton — Scenario A, at galley | Select SNACK |
| G | callbutton — Scenario A | Serve fetched item(s) to passenger at seat (one press delivers all) |
| R / SHIFT | callbutton — Scenario B | Reset accidental call button press |

Movement is tile-by-tile (48px per keypress, `JustDown` only — no held-key repeat).
Player always constrained to `TC.aisle` — cannot enter seat columns.

---

## Routes

All jam build routes use 8 cabin rows. Row count scaling is post-jam.
**All routes share a fixed 10-minute timer.** Route is selected in `CharacterSelectScene` and stored as `window.selectedRoute`.

| Route | Key | Timer | Drink Options | Meal Options | Turbulence |
|---|---|---|---|---|---|
| SIN → KUL | `KUL` | 10 min | OJ, Water, Wine | None | 1× mild (~10 sec) at 2:00 elapsed |
| SIN → BKK | `BKK` | 10 min | OJ, Water, Wine | Pad Thai (key 4), Chicken Rice (key 5) | 2× mild (~10 sec each) at 2:00 and 4:00 elapsed |
| SIN → NRT | `NRT` | 10 min | OJ, Water, Wine | Yakisoba (key 4), Fish with Potatoes (key 5) | 2× moderate (~15 sec each) at 2:00 and 4:00 elapsed |

Route config is stored in `ROUTES` object in `constants.js` and accessed via `ROUTES[window.selectedRoute]`.
`paxMap` is built per route by calling `buildPaxMap(routeKey)` at `CabinScene` create time.

---

## Phase Flow & Timer

### Timer Rules
- Fixed at 10:00 for all routes
- Starts counting down when SPACEBAR pressed in idle phase (`startTimer()`)
- Single continuous countdown — never reset between phases
- Timer flashes red CSS class at 2:00 remaining
- Phase transitions driven by `checkPhaseCheckpoints()` on each timer tick — not by player completing tasks (except collection which also ends early if player steps on `TR.galley`)

### Phase Timeline (all routes)

| Timer shows | Event |
|---|---|
| 10:00 | SPACEBAR → service phase begins, timer starts |
| 5:00 | Service ends → pop-up → collection phase begins |
| 3:00 | Collection ends → callbutton phase begins |
| 2:00 remaining | Timer display flashes red |
| 1:00 | Callbutton ends → landing fires automatically |
| 1:00 → 0:00 | Landing animation (screen shake / flash) |
| 0:00 | → WinScene |

### Phase Descriptions

| Phase | HUD Label | Description |
|---|---|---|
| `idle` | BOARDING | Player at Row 1, trolley not spawned, timer not running. SPACEBAR starts service. |
| `service` | SERVICE | Timer starts. Aisle tint active. Trolley one tile above player. Player moves down serving passengers. Request bubbles visible. Ends at 5:00. |
| `collection` | COLLECTION | Trolley parks in galley. Player carries tray, collects cups/trays from served seats. Ends at 3:00 or when player steps on TR.galley. Missed items: -5 each. |
| `callbutton` | CALL BUTTONS | 1–3 served passengers get call buttons (Scenario A or B). Timer flashes red. Ends at 1:00. Unresolved: -12 each. |
| `landing` | LANDING | Automated. Screen shake. No player input. Ends at 0:00. |
| `win` | — | `this.scene.start('WinScene', { score: this.score })` |

### Phase Notes
- `setPhase(phase)` handles both `this.phase` assignment and `#hud-phase` DOM update
- `setAisleTint(true)` fires when `service` begins; `setAisleTint(false)` fires only when `landing` begins
- `serviceEntryComplete` flag blocks all input during crew tween animation
- `syncServiceUnitPositions()` keeps trolley one tile above player during service
- `updateHintBar()` called on every phase change and prompt open/close

### Service Phase — Interaction Flow
1. Player moves to a row (Arrow Up/Down)
2. Press D (face east, target A/B/C) or A (face west, target D/E/F)
3. Arrow Left/Right highlights a specific occupied seat — selected bubble glows
4. SPACEBAR → combined drink/meal prompt opens in hint bar
5. Press number key(s) matching passenger's request:
   - Single request: one keypress → served
   - Dual request (drink + meal): drink key first → prompt stays open → meal key → both served
6. Correct: score awarded, bubble clears, passenger satisfied
7. Wrong: penalty applied, prompt closes
- SHIFT skips sleeping/nothanks passengers — standalone, no SPACEBAR needed first

### Collection Phase — Interaction Flow
1. Player moves to a row, faces side with cup icons (Arrow Up/Down, D/A)
2. Arrow Left/Right highlights a seat with a cup/tray icon
3. SPACEBAR → interaction opens:
   - C: collect cup/tray → +3 per item, icon clears
   - SHIFT: skip (passenger doesn't want cup collected) — no penalty

### Callbutton Phase — Interaction Flow
**Scenario A (wants something):**
1. Navigate to passenger, SPACEBAR to open interaction
2. Walk to galley (TR.galley), press F → fetch prompt opens: `1 — DRINK │ 2 — SNACK`
3. Press 1, 2, or both in sequence
4. Walk back to seat, press G → delivers all selected items
5. Correct: +15. Wrong (over/under delivery): -5

**Scenario B (accidental press):**
1. Navigate to passenger
2. Press R or SHIFT → +5, call button resolved

ESC cancels/deselects at any point.

---

## Service Phase Pop-up Messages (at 5:00 mark)
- All served: *"Great job! Time to collect back what we have served out."*
- Not all served: *"Please buck up on your service speed for the next flight."*
- Auto-dismisses after ~3 seconds; gameplay paused (`serviceEntryComplete = false`) during dismissal

---

## Passenger States & paxMap

### paxMap Structure
```js
paxMap[rowNum][seatIdx] = {
  occ: boolean,          // seat occupied
  v: 0–3,               // sprite variant
  state: string|null,    // request state (null if unoccupied)
  served: boolean,       // fully served or skipped
  hasCup: boolean,       // drink/meal delivered, cup/tray present
  cupCollected: boolean, // cup/tray collected during collection phase
}
```

### State Definitions
| State | Routes | Correct Action | Wrong Action Penalty |
|---|---|---|---|
| sleeping | All | SHIFT to skip | SPACEBAR = woken, -15 |
| nothanks | All | SHIFT to skip | SPACEBAR = forced serve, -10 |
| oj | All | SPACEBAR → 1 | Wrong key: -10 |
| water | All | SPACEBAR → 2 | Wrong key: -10 |
| wine | All | SPACEBAR → 3 | Wrong key: -10 |
| padthai | BKK only | SPACEBAR → 4 | Wrong key: -10 |
| chickenrice | BKK only | SPACEBAR → 5 | Wrong key: -10 |
| yakisoba | NRT only | SPACEBAR → 4 | Wrong key: -10 |
| fishpotatoes | NRT only | SPACEBAR → 5 | Wrong key: -10 |
| oj+padthai | BKK only | SPACEBAR → 1 then 4 | -10 per wrong item |
| oj+chickenrice | BKK only | SPACEBAR → 1 then 5 | -10 per wrong item |
| water+padthai | BKK only | SPACEBAR → 2 then 4 | -10 per wrong item |
| water+chickenrice | BKK only | SPACEBAR → 2 then 5 | -10 per wrong item |
| wine+padthai | BKK only | SPACEBAR → 3 then 4 | -10 per wrong item |
| wine+chickenrice | BKK only | SPACEBAR → 3 then 5 | -10 per wrong item |
| oj+yakisoba | NRT only | SPACEBAR → 1 then 4 | -10 per wrong item |
| oj+fishpotatoes | NRT only | SPACEBAR → 1 then 5 | -10 per wrong item |
| water+yakisoba | NRT only | SPACEBAR → 2 then 4 | -10 per wrong item |
| water+fishpotatoes | NRT only | SPACEBAR → 2 then 5 | -10 per wrong item |
| wine+yakisoba | NRT only | SPACEBAR → 3 then 4 | -10 per wrong item |
| wine+fishpotatoes | NRT only | SPACEBAR → 3 then 5 | -10 per wrong item |

### State Pool by Route
**KUL:** `['oj', 'water', 'wine', 'sleeping', 'nothanks']`
Weighting: drinks most common, sleeping/nothanks rare.

**BKK:** `['oj', 'water', 'wine', 'padthai', 'chickenrice', 'oj+padthai', 'oj+chickenrice', 'water+padthai', 'water+chickenrice', 'wine+padthai', 'wine+chickenrice', 'sleeping', 'nothanks']`
Weighting: drink+meal combos most common, drink-only moderate, sleeping/nothanks rare.

**NRT:** Same structure as BKK with `yakisoba` and `fishpotatoes` replacing BKK meal names.

### Seeded PRNG (seed 7331 — consistent layout every session)
```js
let _s = 7331;
function rand() { _s = (_s * 1664525 + 1013904223) >>> 0; return _s / 0xffffffff; }
function ri(a, b) { return a + Math.floor(rand() * (b - a + 1)); }
```
Per row: 3–5 seats occupied (Fisher-Yates shuffle on indices 0–5).

---

## Request Bubbles (service phase)

### Bubble Textures (generated in `generateTextures()`)
`bubble_sleeping`, `bubble_nothanks`, `bubble_oj`, `bubble_water`, `bubble_wine`, `bubble_padthai`, `bubble_chickenrice`, `bubble_yakisoba`, `bubble_fishpotatoes`

Each: white rounded speech bubble, tail at bottom, small pixel icon inside.
For dual-request passengers (drink + meal): both icons shown simultaneously in the same bubble (composed at runtime, not pre-generated).

### Bubble Window Logic
- `this.bubbleWindowStartDisplay` — first HUD row number of the 2-row visible window. Starts at 1.
- Window shows HUD rows `bubbleWindowStartDisplay` and `bubbleWindowStartDisplay + 1`.
- Window starts at rows 1–2 (cockpit end, where player is at service start).
- Crew movement alone does NOT advance the window.
- Window advances only when a row is fully resolved (all occupied seats served or skipped).
  - After row D resolved: `bubbleWindowStartDisplay = D + 1` (cap at 7, so max window = rows 7–8)
- Bubble depth: 100 | Trolley depth: 10 | Crew sprite depth: 20
- Selected/highlighted seat bubble: glows or shows distinct highlight

### `syncPassengerBubbles()`
- Called after service entry tween completes and after each aisle move
- Converts window to paxMap keys: HUD row D → `paxMapKey = 9 - D`
- Fades in new bubbles (alpha 0 → 1), fades out removed bubbles (alpha → 0, then destroy)
- Bubble key format: `"{paxRowNum}-{seatIdx}"`
- `this.bubbleByKey` — map of key → bubble Image instance

### Leaving Service Phase
- All bubbles fade out and are destroyed
- `bubbleWindowStartDisplay` resets to 1

---

## Scoring

| Action | Points |
|---|---|
| Correct drink served (service) | +10 |
| Correct meal served (service) | +10 |
| Correct drink+meal combo served (service) | +20 |
| Wrong drink or meal served | -10 per wrong item |
| Sleeping passenger woken (SPACEBAR instead of SHIFT) | -15 |
| No-thanks passenger forced serve | -10 |
| Cup/tray collected (collection) | +3 per item |
| Cup/tray missed at collection phase end | -5 per item |
| Call button Scenario A — correct delivery | +15 |
| Call button Scenario A — wrong delivery | -5 |
| Call button Scenario B — reset | +5 |
| Unresolved call button at landing (1:00 mark) | -12 each |
| Turbulence spill (in-progress delivery lost) | -8 per item |

Score updates `#hud-score` on every scoring action via `updateScore(delta)`.

---

## Trolley Behaviour
- Spawns at `TR.galley` when SPACEBAR first pressed in idle (lazy init — created on first use)
- During service: trolley row = `this.playerRow - 1` (one tile above player, toward galley)
- Trolley position updated via `syncServiceUnitPositions()` on each crew move
- Parks in galley when collection phase begins
- Depth: 10

---

## HUD DOM Elements
- `#hud-armed` — "DOORS TO ARMED" in red. Updates to "DOORS TO MANUAL" in #00FF7F on win.
- `#hud-route` — route string (e.g. `SIN → KUL`) in white. Updated by CabinScene on create.
- `#hud-timer` — countdown timer `MM:SS` in yellow. Flashes red CSS class at 2:00 remaining.
- `#hud-score` — `SCORE: 0` in #00FF7F. Updates live on every scoring action.
- `#hud-phase` — phase label in grey. Updated by `setPhase()`.
- `#hint-bar` — single line of contextual text below bottom HUD. Updates per phase and prompt state.
- `#legend-open-btn` — persistent `?` button, flush right below hint bar. Opens legend modal.
- `#legend-modal` — full-screen overlay with controls + scoring reference. Closed by CLOSE button, backdrop click, or Escape. Does not affect Phaser game state.

### Hint Bar Text by Phase
| Phase | Hint bar text |
|---|---|
| idle | `SPACEBAR — Begin service` |
| service (no prompt) | `A / D — Face seats │ ← → — Select │ SPACEBAR — Serve │ SHIFT — Skip` |
| service (KUL prompt active) | `1 OJ │ 2 Water │ 3 Wine` |
| service (BKK prompt active) | `1 OJ │ 2 Water │ 3 Wine │ 4 Pad Thai │ 5 Chicken Rice` |
| service (NRT prompt active) | `1 OJ │ 2 Water │ 3 Wine │ 4 Yakisoba │ 5 Fish w/ Potatoes` |
| collection | `A / D — Face seats │ ← → — Select │ SPACEBAR — Interact │ C — Collect │ SHIFT — Skip` |
| callbutton | `F — Fetch from galley │ G — Serve │ R or SHIFT — Reset call button │ ESC — Cancel` |
| landing | `Cabin checked and ready for landing...` |

---

## Colour Palette
| Element | Value |
|---|---|
| Canvas background | `C.bg = 0x111111` |
| Cabin floor | `C.cabinFloor = 0xF5F0E8` |
| Seats (navy) | `C.seatNavy = 0x1B2A4A` |
| Seat highlight | `C.seatHi = 0x2A3F6B` |
| Aisle | `C.aisle = 0xD0CEC8` |
| Aisle stripe | `C.aisleStripe = 0xBCBAB4` |
| Aisle tint (service active) | `0xD4A96A` at alpha 0.35 |
| Fuselage wall | `C.fuselage = 0xE8E4DC` |
| Fuselage edge | `C.fuseEdge = 0xC4C0B8` |
| Window | `C.window = 0x4A7AAA` |
| Window glare | `C.windowGlare = 0x7AAAD0` |
| Galley fill | `C.galleyFill = 0xBBBBBB` |
| Cockpit fill | `C.cockpitFill = 0x0F1A2E` |
| Cockpit accent | `C.cockpitAccent = 0x1B2A4A` |
| Crew uniform | `C.crewBody = 0x00FF7F` (neon green — NCT easter egg) |
| Crew skin | `C.crewSkin = 0xF5C5A0` |
| Crew hair | `C.crewHair = 0x111111` |
| Crew accent | `C.crewAccent = 0xFFD700` (yellow) |
| HUD background (CSS) | `#1B2A4A` |
| Win screen text | `#00FF7F` on `#000000` |

---

## CabinScene — Static Layout Draw Order (must not be reordered in create())
1. Background rectangle (full canvas, 0x111111)
2. Fuselage walls (left/right columns, top/bottom rows, portholes)
3. Galley (TR.galley row, cols TC.seatA–TC.seatF)
4. Aisle tiles (TR.cabin through TR.cabin+7, TC.aisle)
5. Cabin seats + passengers
6. Cockpit door
7. Aisle tint graphics object (empty on create)
8. Crew sprite
9. Labels (row numbers left of TC.fuseLeft, seat letters above cabin)
10. Request bubbles — spawned dynamically at depth 100 during service

---

## Key Technical Rules
- `this.playerCol` is always `TC.aisle` — never changes
- `this.playerRow` tracks current tile row (integer)
- `paxMap` is seeded (seed 7331) — consistent layout every session. Built per route via `buildPaxMap(routeKey)`.
- `setPhase(phase)` always updates both `this.phase` and `#hud-phase` DOM element
- `serviceEntryComplete` flag blocks all input during crew tween animation
- Bubble depth 100, trolley depth 10, crew sprite depth 20
- All movement is `JustDown` only — no held-key repeat
- Timer updates `#hud-timer` every second via Phaser `time.addEvent` (not `setInterval`)
- Score updates `#hud-score` on every scoring action via `updateScore(delta)`
- Phase transitions at fixed timer checkpoints only — not triggered by player completing all tasks, except collection which also ends early if player steps on TR.galley
- Turbulence fires at fixed elapsed time via `this.time.delayedCall()` from service phase start
- No pause function
- No ES module syntax — all files are plain scripts loaded via `<script src>`
- No `localStorage` or `sessionStorage`
- Sprite fallback: if a PNG fails to load, generate a programmatic texture with the same key. Game must run fully without any PNG files.

---

## Changelog

### 2026-04-29 — Revised to GDD v4 FINAL
Major changes from previous GAME_CONTEXT.md (synced to v4 GDD):
- **Routes:** All routes now use a fixed 10-minute timer (previously 4/5/6 min). Removed row count differences (all jam routes = 8 rows). Added ROUTES object in constants.js.
- **Meal options added:** BKK adds Pad Thai (4) / Chicken Rice (5). NRT adds Yakisoba (4) / Fish with Potatoes (5). Dual drink+meal request states added.
- **Controls updated:** A/D now face west/east (target seats D-E-F and A-B-C respectively). Arrow Left/Right added for in-row seat selection. ESC added for deselect/cancel. C key for cup collection. F/G/R keys for callbutton phase. 4 and 5 keys for meal selection.
- **Phase flow updated:** Phase checkpoints are timer-based (5:00 service end, 3:00 collection end, 1:00 landing). Service-end pop-up messages added.
- **Scoring updated:** Drink+meal combo = +20. Call button wrong delivery = -5 (new). Meal/blanket/medical line items removed (replaced by drink/meal unified scoring).
- **paxMap expanded:** Added `served`, `hasCup`, `cupCollected` fields. `buildPaxMap(routeKey)` now takes route key.
- **Bubble textures updated:** Replaced blanket/meal/medical bubbles with padthai/chickenrice/yakisoba/fishpotatoes.
- **CharacterSelectScene:** Now includes route selector (KUL/BKK/NRT) in addition to crew gender.
- **Hint bar:** New #hint-bar DOM element added; text updated per phase/prompt/route.
- **HUD:** #hud-armed added (was previously static text). Timer checkpoint at 2:00 remaining flashes red.
- **WinScene:** Now receives `{ score }` data from CabinScene. Shows leaderboard. Updates #hud-armed to green DOORS TO MANUAL.
- **Callbutton phase:** Detailed Scenario A/B interaction flow added (F/G/R keys, fetch prompt).
- **Legend modal:** ✕ button removed — CLOSE button only.

### 2026-04-18 — Legend & instructions visual polish
- `?` button moved into `#game-stage` (over canvas, bottom-right)
- Modal title red `#ff4444`, section headers navy `#1b2a4a`
- Removed modal ✕ button (CLOSE only)
- `InstructionsScene`: Title red `#FF4444`; section headers navy `#1B2A4A`

### 2026-04-18 — Step 4b cleanup: explicit routing
- `CharacterSelectScene.js`: Crew click calls `scene.start('InstructionsScene')`
- Removed `ScenePlugin.start` monkey-patch from `index.html`

### 2026-04-18 — Step 4b: InstructionsScene + DOM legend
- `js/scenes/InstructionsScene.js` added
- `#legend-open-btn`, `#legend-modal` added to `index.html`

### 2026-04-18 — Step 4: passenger state, request bubbles, SIN–KUL jam pool
- `paxMap[][].state` added in `constants.js`
- Eight `bubble_*` textures added to `textures.js`
- `CabinScene.js`: `bubbleByKey`, `syncPassengerBubbles`, `bubbleWindowStartDisplay` added
