// =============================================================================
// DOORS TO MANUAL — Cabin Scene (Phaser.js 3)
// Engine: Phaser 3 | Canvas: 800×(grid + thin margin) | Portrait
// =============================================================================

// ---------------------------------------------------------------------------
// CONSTANTS — grid geometry (matches vanilla JS version for continuity)
// ---------------------------------------------------------------------------
const CW = 800;
const TILE = 48;

// Grid: 9 cols × 12 rows = 432×576px
// Layout: 3 left seats | 1 aisle | 3 right seats | 2 fuselage walls
const GRID_COLS = 9,
  GRID_ROWS = 12;
const GRID_W = GRID_COLS * TILE; // 432
const GRID_H = GRID_ROWS * TILE; // 576
// Snug canvas height — only a small margin above/below the grid (avoids large black bands in-canvas)
const CANVAS_V_MARGIN = 8;
const CH = GRID_H + CANVAS_V_MARGIN * 2;
const OX = Math.floor((CW - GRID_W) / 2);
const OY = CANVAS_V_MARGIN;

// Tile row indices (top → bottom)
const TR = {
  fuseTop: 0, // fuselage top wall
  galley: 1, // galley zone (TOP — player spawns here)
  cabin: 2, // first cabin row (row 1); rows 2–8 follow sequentially
  cockpit: 10, // cockpit door (BOTTOM)
  fuseBot: 11, // fuselage bottom wall
};

// Tile col indices (left → right)
const TC = {
  fuseLeft: 0, // fuselage left wall
  seatA: 1, // left window seat
  seatB: 2, // left middle seat
  seatC: 3, // left aisle seat
  aisle: 4, // centre aisle
  seatD: 5, // right aisle seat
  seatE: 6, // right middle seat
  seatF: 7, // right window seat
  fuseRight: 8, // fuselage right wall
};

const SEAT_COLS_LEFT = [TC.seatA, TC.seatB, TC.seatC];
const SEAT_COLS_RIGHT = [TC.seatD, TC.seatE, TC.seatF];
const CABIN_ROWS = 8; // rows 1 through 8

// ---------------------------------------------------------------------------
// COLOURS
// ---------------------------------------------------------------------------
const C = {
  bg: 0x111111,
  fuselage: 0xe8e4dc,
  fuseEdge: 0xc4c0b8,
  window: 0x4a7aaa,
  windowGlare: 0x7aaad0,
  cabinFloor: 0xf5f0e8,
  seatNavy: 0x1b2a4a,
  seatHi: 0x2a3f6b,
  aisle: 0xd0cec8,
  aisleStripe: 0xbcbab4,
  divider: 0xe0dbd0,
  cockpitFill: 0x0f1a2e,
  cockpitAccent: 0x1b2a4a,
  galleyFill: 0xbbbbbb,
  galleyUnit: 0x999999,
  galleyTop: 0xaaaaaa,
  // Passenger variants (muted so crew pops)
  paxSkins: [0xd4a882, 0xc8956a, 0xe8c9a0, 0xb07850],
  paxBodies: [0x8a8fa0, 0x7a8a70, 0x9a8878, 0x707890],
  paxHairs: [0x2a2018, 0x111111, 0x503820, 0x182018],
  // Crew
  crewBody: 0x00ff7f,
  crewSkin: 0xf5c5a0,
  crewHair: 0x111111,
  crewAccent: 0xffd700,
};

// ---------------------------------------------------------------------------
// SEEDED PRNG — consistent layout each session
// ---------------------------------------------------------------------------
let _s = 7331;
function rand() {
  _s = (_s * 1664525 + 1013904223) >>> 0;
  return _s / 0xffffffff;
}
function ri(a, b) {
  return a + Math.floor(rand() * (b - a + 1));
}

// ---------------------------------------------------------------------------
// PASSENGER MAP — random 3–5 occupied seats per cabin row
// ---------------------------------------------------------------------------
const paxMap = {};
for (let rowNum = 1; rowNum <= CABIN_ROWS; rowNum++) {
  const total = ri(3, 5);
  const indices = [0, 1, 2, 3, 4, 5];
  for (let i = 5; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const occupied = new Set(indices.slice(0, total));
  paxMap[rowNum] = Array.from({ length: 6 }, (_, s) => ({
    occ: occupied.has(s),
    v: ri(0, 3),
  }));
}

// ---------------------------------------------------------------------------
// HELPER — pixel coordinate from tile col/row
// ---------------------------------------------------------------------------
function tx(col) {
  return OX + col * TILE;
}
function ty(row) {
  return OY + row * TILE;
}
