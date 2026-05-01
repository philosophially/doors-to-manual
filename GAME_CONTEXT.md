# DOORS TO MANUAL — Game Context
Vibe Jam 2026 | Built with Cursor + Phaser.js 3
Last updated: 1 May 2026 | Build: KUL end-to-end + timing / landing / win polish

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
- `WinScene` — DOORS TO MANUAL win screen, final score, leaderboard, play again, DOM phase `LANDED`, hint “Welcome to Vibe Jam City.”

---

## Routes
Only SIN → KUL is playable. SIN → BKK and SIN → NRT are greyed-out placeholder labels.

| Field | Value |
|---|---|
| Timer | **4:00** total (**240** seconds) |
| Drinks | OJ (key 1), Water (key 2), Wine (key 3) |
| Meals | None |
| Turbulence | 1× mild at **0:50** elapsed after service start (timer shows **3:10**) — 10 seconds, visual only |

---

## Phase Flow & Timer
Timer: **4:00** (**240s** total). **`index.html`** sets `#hud-timer` to **04:00** before Phaser runs; **`CabinScene` `create()`** resets the same label and removes **`is-warning`**. Starts when SPACEBAR pressed in idle.

| Segment | Clock (`remainingSec`) | Duration |
|---|---|---|
| Service | **240 → 100** | **2:20** |
| Collection | **100 → 30** (or ends early) | **1:10** timed window |
| After collection | **continues counting down** through landing | Landing uses whatever time remains (e.g. early collection finish leaves more time before 0) |

| Timer shows | Event |
|---|---|
| 4:00 | SPACEBAR → service starts, timer begins |
| 3:10 | Turbulence (**50s** elapsed in service) — shake + flashing text 10s, no penalty |
| **1:40** | **Service ends** (forced if not all served) → popup → **collection** (clock stays **1:40**) |
| **0:30** | **Collection ends** (forced) if still in collection → wrap-up popup → **landing** |
| **1:00** | Timer **`is-warning`** (red / pulsing CSS) — **≤ 60** seconds remaining |
| After landing audio | **2.5s** delay → **WinScene** (camera fade-in there) |

Phase checkpoints (seconds **remaining** on timer):
- `remainingSec === 100 && phase === 'service'` → show service popup → **collection**
- `remainingSec === 30 && phase === 'collection' && !collectionWrapUpStarted` → **finishCollectionPhase** (forced end)
- `remainingSec <= 60` → add **`is-warning`** on `#hud-timer`

Early completion:
- **Service:** all passengers served before forced handoff → `bonus = max(0, remainingSec - 100)` (computed **before** snap) → **`remainingSec` set to 100** (HUD **1:40**) → “great job” popup → collection (`enterCollectionPhase` resets `collectionWrapUpStarted`). If time runs out with passengers unserved, “need to be faster” popup → collection at **100** (no snap, no service time bonus).
- **Collection:** all cups collected and all sleeping / skip targets resolved (`allCollectionResolved`) **before** **0:30** left → **finishCollectionPhase** immediately; countdown keeps running into landing.
- **Guards:** `collectionWrapUpStarted` prevents double collection wrap-up; `winSceneScheduled` prevents double WinScene transition.

**Collection wrap-up** (before landing): ~2.8s centered popup — either *“Great! All cups collected. Time to prepare for landing.”* or *“Need to be quicker next time. Time to prepare for landing.”* Then penalties for missed cups (if any) already applied; time bonus `max(0, remainingSec - 30)` for collection.

---

## Phase Descriptions

| Phase | Description |
|---|---|
| `idle` | Player at TR.cabin+7, facing south. No timer. SPACEBAR starts service. |
| `service` | Timer running. Aisle tint active. Trolley one tile above player. Serve passengers. Ends at **1:40** left on clock (forced) or when all served (early finish snaps timer to **1:40**). |
| `collection` | Trolley at galley. Player collects cups / skips sleeping. Ends at **0:30** left or when **`allCollectionResolved`**. |
| `landing` | **`PHASE: LANDING`** on `#hud-phase`. Input blocked (`serviceEntryComplete` false). Shake; **landing patrol** (aisle 1→8 west/east per row, then walk back toward row 1, crew **alpha → 0**); MP3 in parallel. **2.5s** after audio **`complete`** → WinScene ( **`winSceneScheduled`** ). **25s** fallback also uses same delayed handoff. |
| `win` | **WinScene** — `#hud-phase` **PHASE: LANDED**, `#hint-bar` **“Welcome to Vibe Jam City.”**, DOORS TO MANUAL, final score, leaderboard, play again, **`cameras.main.fadeIn`**. |

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
| `TR.galley` | 1 | Galley — trolley spawn |
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
| A | all (not landing) | Face west — target seats D, E, F |
| D | all (not landing) | Face east — target seats A, B, C |
| Arrow Left / Right | service, collection | Move seat selection within current row |
| ESC | service, collection | Deselect / close prompt |
| SPACEBAR | idle | Begin service |
| SPACEBAR | service | Open drink prompt for selected seat |
| SPACEBAR | collection | Open collection interaction |
| 1 / 2 / 3 | service (prompt active) | OJ / Water / Wine |
| SHIFT | service | Skip sleeping/nothanks passenger |
| C | collection | Collect cup from selected seat |
| SHIFT | collection | Skip (marks resolved; sleeping / cup skip) |

---

## Scoring

| Action | Points |
|---|---|
| Correct drink served | +10 |
| Wrong drink served | -10 |
| Sleeping passenger woken (SPACEBAR not SHIFT) | -15 |
| Cup collected | +3 |
| Cup missed at collection end | -5 |
| Seconds saved finishing service early | +1/s for each second **`remainingSec` above 100** when all served (before snap to **1:40**) |
| Seconds saved finishing collection | +1/s for each second **`remainingSec` above 30** when collection phase completes |

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
- Active during **service** phase only (collection uses its own bubble rules in `syncCollectionBubbles`)
- 2-row sliding window ahead of player position
- `this.bubbleByKey` — map of `"{rowNum}-{seatIdx}"` → Phaser Image
- Bubble textures: `bubble_oj`, `bubble_water`, `bubble_wine`, `bubble_sleeping`
- Depth: 100. Selected bubble: tinted 0xd6ffad and slightly enlarged.
- All bubbles destroyed on phase change away from service

---

## Turbulence
- Fires at **`elapsedSec: 50`** from `scheduleTurbulence()` after service start (timer shows **3:10** on a **240s** game)
- Camera shake for 10 seconds, intensity 0.005
- Flashing text overlay: "WE HIT TURBULENCE (not the song)" — yellow on navy, depth 200
- Text flashes (alpha tween) and auto-destroys after 10 seconds
- No score penalty

---

## Trolley
- Spawns at TR.galley on first SPACEBAR in idle
- During service: `trolleyRow = playerRow - 1`, updated by `syncCrewPosition()`
- Parks at TR.galley when collection phase begins
- Hidden during landing
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
- `#hud-timer` — countdown MM:SS; static default **04:00** in **`index.html`** (aligned with **240s** KUL route); **`is-warning`** at **≤ 01:00** remaining
- `#hud-score` — "SCORE: 0", neon green, live updates
- `#hud-phase` — **BOARDING / SERVICE / COLLECTION / LANDING** in cabin; **LANDED** only after **WinScene** starts
- `#hint-bar` — contextual hints in cabin; **WinScene** sets **“Welcome to Vibe Jam City.”**
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

## WinScene & Leaderboard
- **`loadLeaderboardRows`** (Supabase when `SUPABASE_URL` / `SUPABASE_ANON_KEY` set) can hang on network; **`Promise.race`** with **3.5s** timeout falls back to **`getFallbackLeaderboard(finalScore)`** so leaderboard rows and **Play Again** always appear.
- After layout: **`this.cameras.main.fadeIn(900, 0, 0, 0, true)`**.

---

## Key Technical Rules
- `this.playerCol` is always `TC.aisle` — never changes
- `this.playerRow` tracks current tile row (integer)
- `paxMap` seeded (seed 7331) — same layout every session
- `setPhase(phase)` updates `this.phase` and `#hud-phase` (landing label **LANDING**, not LANDED)
- `serviceEntryComplete` flag blocks input during crew tween / popups / landing
- Bubble depth 100, trolley depth 10, crew depth 20
- All movement is `JustDown` only — no held-key repeat
- Timer via `this.time.addEvent` (not setInterval)
- Phase transitions at fixed checkpoints; service/collection also end early per rules above
- **Landing:** `handleMovement` no-ops if `phase === 'landing'`; patrol tweens drive crew
- No pause function
- No ES module syntax — all files plain `<script src>` globals
- No localStorage or sessionStorage

---

## Implementation reference — four-minute flight (May 2026)

End-to-end record of the **4:00** total timer, **50s** turbulence offset, **100** remaining as service/collection boundary, and early-service **snap + bonus** behaviour.

| Area | Detail |
|---|---|
| **`index.html`** | `#hud-timer` initial text **04:00** (was **05:00**) so first paint matches KUL length before `CabinScene` runs. |
| **`js/constants.js`** | `ROUTES.KUL.timerSeconds`: **240**. `ROUTES.KUL.turbulence[0].elapsedSec`: **50** (shake/audio **50s** after service start via `scheduleTurbulence()`). |
| **`js/scenes/CabinScene.js`** | `create()`: seed `#hud-timer` with **04:00**. `checkPhaseCheckpoints()`: service → collection when **`remainingSec === 100`** (was **90**). `updateAfterServiceResolution()`: if all served in service phase, **`bonus = max(0, remainingSec - 100)`**, apply score, set **`remainingSec = 100`**, **`updateTimerHud()`**, then popup + **`enterCollectionPhase()`** (replaces old **`remainingSec - 180`** bonus with no snap). Forced handoff at **100** with passengers unserved: existing popup path, **no** bonus, **no** snap (clock already **100**). Collection forced end at **30** and **`max(0, remainingSec - 30)`** collection bonus unchanged. |
| **`GAME_CONTEXT.md`** | Routes table, phase flow, checkpoints, scoring, turbulence, phase descriptions, and changelog updated to match the above. |

Design intent: **2:20** service (**240 → 100**), **1:10** collection (**100 → 30**), **0:30** reserved before **0** (landing buffer logic unchanged). “Great job” path always enters collection at **1:40** on the HUD; “need to be faster” path enters collection at **1:40** without time-save points.

---

## Changelog

### 2026-05-01 — HUD default & implementation docs
- **`index.html`:** `#hud-timer` placeholder **04:00** (matches **240s** flight and `CabinScene` seed).
- **`GAME_CONTEXT.md`:** **Implementation reference — four-minute flight** section (file-by-file summary); HUD/timer copy notes **`index.html`** default.

### 2026-05-01 — Timing, landing patrol, win polish
- **Timer:** **4:00** (240s). **Service** forced to **collection** at **1:40** left (**100** remaining). **Collection** forced end at **0:30** left (**30** remaining) or **early** when **`allCollectionResolved`**.
- **Service early finish:** **`bonus = max(0, remainingSec - 100)`** then HUD snaps to **1:40** for collection; forced late finish keeps clock at **100**, no service time bonus.
- **Turbulence:** **`elapsedSec: 50`** after service start.
- **Timer red:** `#hud-timer` **`is-warning`** when **`remainingSec <= 60`** (01:00 left).
- **Collection:** wrap-up popups (all cups vs not); time bonus **`max(0, remainingSec - 30)`**; **`collectionWrapUpStarted`** guard.
- **Landing:** HUD **PHASE: LANDING**; automated patrol forward (rows 1–8, west/east), **return** walk toward row 1, crew **fade out** (`alpha` tween); MP3 + **2.5s** delay → **WinScene**; **`winSceneScheduled`**; **25s** fallback.
- **WinScene:** **PHASE: LANDED**, hint **“Welcome to Vibe Jam City.”**, camera **fadeIn**; leaderboard **`Promise.race`** + **3.5s** timeout + **`getFallbackLeaderboard`** so UI never stalls on fetch.
- Docs: removed obsolete “collection ends on galley step” note; turbulence aligned with route **`elapsedSec`**.

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
