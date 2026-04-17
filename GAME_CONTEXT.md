# DOORS TO MANUAL — Game Context
Vibe Jam 2026 | Built with Cursor + Phaser.js 3
Last updated: April 2026

---

## Engine & Canvas
- Engine: Phaser.js 3 (CDN, no build step)
- Canvas: 800×700px, portrait, pixel art mode (no anti-aliasing)
- Font: Press Start 2P (Google Fonts)
- Jam widget: `<script async src="https://vibej.am/2026/widget.js"></script>` (required, already embedded)

---

## Grid Constants
- `TILE = 48`
- `GRID_COLS = 9`, `GRID_ROWS = 12`, `CABIN_ROWS = 8`
- `CW = 800`, `CH = 700`
- `OX = Math.floor((CW - GRID_W) / 2)` — horizontal offset to centre grid
- `OY = CANVAS_V_MARGIN` — vertical offset

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
| `TR.galley` | 1 | Galley — player spawn, top boundary |
| `TR.cabin` | 2 | First cabin row (labelled Row 8 in-game) |
| `TR.cockpit` | 10 | Cockpit door — player cannot enter |
| `TR.fuseBot` | 11 | Bottom fuselage wall |

- Cabin rows run from `TR.cabin` (row index 2) to `TR.cabin + 7` (row index 9)
- In-game row labels count downward: index 2 = Row 8, index 9 = Row 1
- Bottom player boundary: `TR.cabin + 7` (Row 1) — player cannot enter cockpit

---

## Scenes
1. `CharacterSelectScene` — crew gender selection (female default), starts `CabinScene`
2. `CabinScene` — all gameplay

---

## Sprite Files (in `/sprites/`)
- `female-crew-south/north/east/west.png`
- `male-crew-south/north/east/west.png`
- `pax-0/1/2/3-south/north/east/west.png` (4 passenger variants)

Crew texture prefix stored as `this.crewTexturePrefix` (e.g. `'female-crew-'`).
Crew gender stored as `this.crewGender` (`'female'` or `'male'`).

---

## Controls
| Key | Action |
|---|---|
| W | Move up (toward galley) — face north |
| S | Move down (toward cockpit) — face south |
| A | Face west (no tile movement) |
| D | Face east (no tile movement) |
| SPACEBAR | Interact — serve, collect, fetch, reset |
| SHIFT | Skip sleeping / no-thanks passenger |
| 1 / 2 / 3 | Select drink (1: OJ, 2: Water, 3: Wine) |

Movement is tile-by-tile (48px per keypress, JustDown only — no held-key repeat).
Player is always constrained to `TC.aisle` — cannot enter seat columns.

---

## Phase Flow
`idle` → `pullup` → `service` → `collection` → `callbutton` → `descent` → `win`

| Phase | Trigger |
|---|---|
| `idle` | Game start — waiting for SPACEBAR |
| `pullup` | SPACEBAR in galley — trolley follows player down to Row 1 |
| `service` | Player reaches Row 1 — drink service begins |
| `collection` | Trolley parks — player collects cups |
| `callbutton` | Call buttons fire randomly |
| `descent` | Timer expires — seatbelt sign on, player returns to jump seat |
| `win` | Landing complete — DOORS TO MANUAL screen |

---

## Routes (Jam Build — all routes use 8 rows)
> Note: Row count is fixed at 8 for the jam build. Post-jam routes will scale rows.

| Route | Timer | Request Types | Turbulence |
|---|---|---|---|
| SIN → KUL 🟢 Easy | 4 min | Drinks + Call Button | 1× mild (~10 sec) |
| SIN → BKK 🟡 Medium | 5 min | Drinks + Call Button + Blanket + Meal | 2× moderate (~15 sec each) |
| SIN → NRT 🔴 Hard | 6 min | All types + Medical | 3× severe (~20 sec each) |

---

## Passenger States
| State | Icon | Action | Penalty if Wrong |
|---|---|---|---|
| Sleeping | 💤 | SHIFT to skip | SPACEBAR = woken, -15 |
| No Thanks | 🚫 | SHIFT to skip | SPACEBAR = forced serve, -10 |
| OJ | 🧃 | SPACEBAR → 1 | Wrong drink: -10 |
| Water | 💧 | SPACEBAR → 2 | Wrong drink: -10 |
| Wine | 🍷 | SPACEBAR → 3 | Wrong drink: -10 |
| Blanket | 🛏 | SPACEBAR (BKK/NRT) | Missed: -10 |
| Meal | 🍱 | SPACEBAR (BKK/NRT) | Missed: -10 |
| Medical | 🚨 | SPACEBAR (NRT only) | Missed: -30 |

Bubble reveal: only 4 rows ahead of player's current position are visible at any time.

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
| Element | Hex |
|---|---|
| Cabin floor | `#F5F0E8` |
| Seats | `#1B2A4A` |
| Aisle | `#D0CEC8` |
| Galley | `#BBBBBB` |
| Cockpit door | `#0F1A2E` |
| Crew uniform | `#00FF7F` (neon green) |
| Crew accents | `#FFD700` (yellow) |
| HUD background | `#1B2A4A` |
| Win screen text | `#00FF7F` on `#000000` |

---

## Technical Notes
- All draw functions (`drawFuselage`, `drawCabin`, `drawCockpit`, `drawGalley`, `drawLabels`) must not be reordered
- Crew sprite always drawn last in `create()` so it renders on top of all tiles
- Trolley is a scene-level sprite (`this.trolley`), not baked into galley draw
- `this.playerCol` is always `TC.aisle` — never changes
- `this.playerRow` tracks current tile row (integer)
- Phase tracked as `this.phase` (string)
- HUD timer is a DOM element (`#hud-timer`), score is (`#hud-score`), phase is (`#hud-phase`)
