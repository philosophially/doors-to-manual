# DOORS TO MANUAL — Game Context
Vibe Jam 2026 | Built with Cursor + Phaser.js 3
Last updated: 30 April 2026 | Build: KUL end-to-end locked

---

## Engine & Canvas
- Engine: Phaser.js 3 via CDN: `https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js`
- Canvas: `CW = 800`, `CH = 592px`, portrait
- `pixelArt: true`, `roundPixels: true`, `Phaser.Scale.FIT`, `CENTER_BOTH`
- Font: Press Start 2P (Google Fonts)
- Jam widget: `<script async src="https://vibej.am/2026/widget.js"></script>` — REQUIRED in `<head>`, already embedded

---

## File Structure
```
index.html                        — HTML shell, HUD bars, hint bar, legend modal, Phaser config
js/
  constants.js                    — Grid constants, colours, ROUTES, SERVICE_POINTS, SCORE_RULES, buildPaxMap(), tx/ty
  textures.js                     — generateTextures(scene) standalone function
  scenes/
    CharacterSelectScene.js       — Crew gender selection → InstructionsScene
    InstructionsScene.js          — Route selection + controls reference → CabinScene
    CabinScene.js                 — All gameplay
    WinScene.js                   — Win screen + leaderboard
sprites/                          — PNG sprite files
audio/                            — landing_announcement.mp3
```

---

## Scenes & Boot Flow
```
CharacterSelectScene → InstructionsScene → CabinScene → WinScene
```

- `CharacterSelectScene` — crew gender selection (female default). Click → `InstructionsScene`.
- `InstructionsScene` — route selection (KUL only playable; BKK/NRT greyed out) + controls reference. "CLICK TO CONTINUE" → `CabinScene`.
- `CabinScene` — all gameplay.
- `WinScene` — DOORS TO MANUAL win screen, final score, leaderboard, play again.

---

## Routes
Only SIN → KUL is playable. SIN → BKK and SIN → NRT are greyed-out placeholder labels.

| Field | Value |
|---|---|
| Timer | 5:00 total (300 seconds) |
| Drinks | OJ (key 1), Water (key 2), Wine (key 3) |
| Meals | None |
| Turbulence | 1× mild at 1:30 elapsed (timer shows 3:30) — 10 seconds, visual only |

---

## Phase Flow & Timer
Timer: 5:00 (300s total). Starts when SPACEBAR pressed in idle.

| Timer shows | Event |
|---|---|
| 5:00 | SPACEBAR → service starts, timer begins |
| 3:30 | Turbulence (1:30 elapsed) — shake + flashing text 10s, no penalty |
| 3:00 | Service ends → time bonus if early → popup → collection |
| 1:30 | Collection ends → time bonus if early → landing |
| 1:00 | Timer turns red |
| landing | Camera shake → mp3 plays (~10s) → WinScene |

Phase checkpoints (seconds remaining on timer):
- `remainingSec === 180 && phase === 'service'` → service ends
- `remainingSec === 90 && phase === 'collection'` → collection ends
- `remainingSec <= 60` → is-warning CSS on timer

Early completion:
- Service: if all passengers served before 3:00 → `bonus = remainingSec - 180` → immediate phase change
- Collection: if player steps on TR.galley before 1:30 → `bonus = remainingSec - 90` → immediate phase change
- Phase guards prevent double-triggering in both cases

---

## Phase Descriptions

| Phase | Description |
|---|---|
| `idle` | Player at TR.cabin+7, facing south. No timer. SPACEBAR starts service. |
| `service` | Timer running. Aisle tint active. Trolley one tile above player. Serve passengers. Ends at 3:00 or when all served. |
| `collection` | Trolley parks at galley. Player collects cups. Ends at 1:30 or when player steps on TR.galley. |
| `landing` | Input blocked. Camera shake. mp3 plays (~10s). WinScene on audio complete. 15s fallback. |
| `win` | WinScene — DOORS TO MANUAL, final score, leaderboard, play again. |

---

## Grid Constants
- `TILE = 48`, `GRID_COLS = 9`, `GRID_ROWS = 12`, `CABIN_ROWS = 8`
- `GRID_W = 432`, `GRID_H = 576`, `CANVAS_V_MARGIN = 8`
- `OX = Math.floor((CW - GRID_W) / 2)` = 184, `OY = 8`

## Tile Column Indices (TC)
| Key | Value | Description |
|---|---|---|
| `TC.fuseLeft` | 0 | Left fuselage wall |
| `TC.seatA` | 1 | Left window seat |
| `TC.seatB` | 2 | Left middle seat |
| `TC.seatC` | 3 | Left aisle seat |
| `TC.aisle` | 4 | Centre aisle — only column player moves through |
| `TC.seatD` | 5 | Right aisle seat |
| `TC.seatE` | 6 | Right middle seat |
| `TC.seatF` | 7 | Right window seat |
| `TC.fuseRight` | 8 | Right fuselage wall |

`SEAT_COLS_LEFT = [TC.seatA, TC.seatB, TC.seatC]`
`SEAT_COLS_RIGHT = [TC.seatD, TC.seatE, TC.seatF]`

## Tile Row Indices (TR)
| Key | Value | Description |
|---|---|---|
| `TR.fuseTop` | 0 | Top fuselage wall |
| `TR.galley` | 1 | Galley — trolley spawn, early collection exit |
| `TR.cabin` | 2 | First cabin row (HUD Row 8) |
| `TR.cockpit` | 10 | Cockpit door |
| `TR.fuseBot` | 11 | Bottom fuselage wall |

- Player spawn: `TR.cabin + 7` (HUD Row 1), facing south
- Player top boundary: `TR.galley`
- Player bottom boundary: `TR.cabin + 7`
- paxMap keys 1–8: key 1 = TR.cabin (HUD Row 8), key 8 = TR.cabin+7 (HUD Row 1)

---

## Controls (KUL)

| Key | Phase(s) | Action |
|---|---|---|
| Arrow Up / W | idle, service, collection | Move up one tile |
| Arrow Down / S | idle, service, collection | Move down one tile |
| A | all | Face west — target seats D, E, F |
| D | all | Face east — target seats A, B, C |
| Arrow Left / Right | service, collection | Move seat selection within current row |
| ESC | service, collection | Deselect / close prompt |
| SPACEBAR | idle | Begin service |
| SPACEBAR | service | Open drink prompt for selected seat |
| SPACEBAR | collection | Open collection interaction |
| 1 / 2 / 3 | service (prompt active) | OJ / Water / Wine |
| SHIFT | service | Skip sleeping/nothanks passenger |
| C | collection | Collect cup from selected seat |
| SHIFT | collection | Skip (passenger keeping cup, no penalty) |

---

## Scoring

| Action | Points |
|---|---|
| Correct drink served | +10 |
| Wrong drink served | -10 |
| Sleeping passenger woken (SPACEBAR not SHIFT) | -15 |
| Cup collected | +3 |
| Cup missed at collection end | -5 |
| Seconds saved finishing service early | +1/s vs 3:00 checkpoint |
| Seconds saved finishing collection early | +1/s vs 1:30 checkpoint |

---

## Passenger Map (paxMap)
Built by `buildPaxMap()` in constants.js using seeded PRNG (seed 7331).
Each seat object:
```js
{
  occ: bool,
  spriteFrame: string,   // e.g. 'pax-intern-a'
  state: string|null,    // 'oj'|'water'|'wine'|'sleeping'|null
  served: false,
  hasCup: false,
  cupCollected: false,
}
```
State pool (KUL): `["oj", "water", "wine", "oj", "water", "wine", "sleeping"]`

---

## Bubble System
- Active during service phase only
- 2-row sliding window ahead of player position
- `this.bubbleByKey` — map of `"{rowNum}-{seatIdx}"` → Phaser Image
- Bubble textures: `bubble_oj`, `bubble_water`, `bubble_wine`, `bubble_sleeping`
- Depth: 100. Selected bubble: tinted 0xd6ffad and slightly enlarged.
- All bubbles destroyed on phase change away from service

---

## Turbulence
- Fires at elapsedSec 90 (1:30 after service start, timer shows 3:30)
- `this.time.delayedCall(90000, ...)` from inside `scheduleTurbulence()`
- Camera shake for 10 seconds, intensity 0.005
- Flashing text overlay: "WE HIT TURBULENCE (not the song)" — yellow on navy, depth 200
- Text flashes (alpha tween) and auto-destroys after 10 seconds
- No score penalty

---

## Trolley
- Spawns at TR.galley on first SPACEBAR in idle
- During service: `trolleyRow = playerRow - 1`, updated by `syncCrewPosition()`
- Parks at TR.galley when collection phase begins
- Depth: 10

---

## Sprite Files
- `sprites/female-crew-south/north/east/west.png`
- `sprites/male-crew-south/north/east/west.png`
- `sprites/passengers.png` + `sprites/passengers.json` (atlas)
- `sprites/bubble_oj/water/wine/sleeping.png`
- Fallback: programmatic textures generated if any PNG fails to load

---

## HUD DOM Elements
- `#hud-armed` — "DOORS TO ARMED" red → "DOORS TO MANUAL" green on win
- `#hud-route` — route string (e.g. "SIN → KUL")
- `#hud-timer` — countdown MM:SS, yellow → red at 1:00 remaining
- `#hud-score` — "SCORE: 0", neon green, live updates
- `#hud-phase` — phase label, grey
- `#hint-bar` — contextual hint text, updates per phase and prompt state
- `#legend-open-btn` — "?" button, opens legend modal
- `#legend-modal` — full-screen controls/scoring reference overlay

### Hint Bar Text by Phase
| Phase / State | Text |
|---|---|
| idle | "SPACEBAR — Begin service" |
| service (no prompt) | "A / D — Face seats | ← → — Select | SPACEBAR — Serve | SHIFT — Skip" |
| service (prompt open) | "1 OJ  |  2 WATER  |  3 WINE  |  ESC CANCEL" |
| collection | "A / D — Face seats | ← → — Select | SPACEBAR — Interact | C — Collect | SHIFT — Skip" |
| landing | "Cabin checked and ready for landing..." |

---

## Key Technical Rules
- `this.playerCol` is always `TC.aisle` — never changes
- `this.playerRow` tracks current tile row (integer)
- `paxMap` seeded (seed 7331) — same layout every session
- `setPhase(phase)` always updates both `this.phase` and `#hud-phase`
- `serviceEntryComplete` flag blocks all input during crew tween animation
- Bubble depth 100, trolley depth 10, crew depth 20
- All movement is `JustDown` only — no held-key repeat
- Timer via `this.time.addEvent` (not setInterval)
- Phase transitions at fixed checkpoints. Exception: service ends early if all served before 3:00; collection ends early if player steps on TR.galley before 1:30.
- No pause function
- No ES module syntax — all files plain `<script src>` globals
- No localStorage or sessionStorage

---

## Changelog

### 2026-04-30 — KUL scope lock
- Timer: 10:00 → 5:00 (300s). Service ends 3:00, collection ends 1:30.
- Phase flow: idle → service → collection → landing → win. Callbutton removed.
- Time bonus: +1/s saved when finishing service or collection early.
- Turbulence: fires at 1:30 elapsed (3:30 on timer). Visual only — shake + flashing text, no score penalty.
- Landing: mp3 plays (~10s), WinScene on audio complete. 15s fallback.
- BKK and NRT: greyed-out placeholders only, not selectable.
- InstructionsScene: BKK/NRT cards dimmed, scoring panel updated.
- Removed: callbutton phase, combo/meal logic, keys C/F/G/R/4/5, unused bubble preloads.
- Simplified: SERVICE_POINTS (3 keys), SCORE_RULES (2 keys), buildStatePool() (no args).

### 2026-04-29 — Revised to GDD v4 FINAL
- All routes 10-minute timer, 8 rows
- Meal options, dual drink+meal combos, call button phase added
- A/D facing, arrow seat selection, ESC, C, F, G, R keys added
- paxMap expanded with served/hasCup/cupCollected fields
- Bubble textures, hint bar, legend modal added
