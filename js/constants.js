const CW = 800;
const TILE = 48;
const GRID_COLS = 9;
const GRID_ROWS = 12;
const GRID_W = GRID_COLS * TILE;
const GRID_H = GRID_ROWS * TILE;
const CANVAS_V_MARGIN = 8;
const CH = GRID_H + CANVAS_V_MARGIN * 2;
const OX = Math.floor((CW - GRID_W) / 2);
const OY = CANVAS_V_MARGIN;

const TR = {
  fuseTop: 0,
  galley: 1,
  cabin: 2,
  cockpit: 10,
  fuseBot: 11,
};

const TC = {
  fuseLeft: 0,
  seatA: 1,
  seatB: 2,
  seatC: 3,
  aisle: 4,
  seatD: 5,
  seatE: 6,
  seatF: 7,
  fuseRight: 8,
};

const SEAT_COLS_LEFT = [TC.seatA, TC.seatB, TC.seatC];
const SEAT_COLS_RIGHT = [TC.seatD, TC.seatE, TC.seatF];
const CABIN_ROWS = 8;
const PASSENGER_ARCHETYPES = ["intern", "bizlady", "tourist", "elderly", "backpacker"];
const PASSENGER_VARIATIONS = ["a", "b", "c"];

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
  crewBody: 0x00ff7f,
  crewSkin: 0xf5c5a0,
  crewHair: 0x111111,
  crewAccent: 0xffd700,
};

const ROUTES = {
  KUL: {
    key: "KUL",
    label: "SIN → KUL",
    difficulty: "EASY",
    timerSeconds: 600,
    drinks: ["oj", "water", "wine"],
    meals: [],
    turbulence: [{ elapsedSec: 120, severity: "mild", durationSec: 10 }],
  },
  BKK: {
    key: "BKK",
    label: "SIN → BKK",
    difficulty: "MEDIUM",
    timerSeconds: 600,
    drinks: ["oj", "water", "wine"],
    meals: ["padthai", "chickenrice"],
    turbulence: [
      { elapsedSec: 120, severity: "mild", durationSec: 10 },
      { elapsedSec: 240, severity: "mild", durationSec: 10 },
    ],
  },
  NRT: {
    key: "NRT",
    label: "SIN → NRT",
    difficulty: "HARD",
    timerSeconds: 600,
    drinks: ["oj", "water", "wine"],
    meals: ["yakisoba", "fishpotatoes"],
    turbulence: [
      { elapsedSec: 120, severity: "moderate", durationSec: 15 },
      { elapsedSec: 240, severity: "moderate", durationSec: 15 },
    ],
  },
};

const SERVICE_POINTS = {
  drink: 10,
  meal: 10,
  combo: 20,
  wrongItem: -10,
  sleepingWake: -15,
};

const SCORE_RULES = {
  collectionGood: 3,
  collectionMiss: -5,
  callCorrect: 15,
  callWrong: -5,
  callReset: 5,
  callUnresolved: -12,
  turbulenceSpill: -8,
};

function buildStatePool(routeKey) {
  const route = ROUTES[routeKey] || ROUTES.KUL;
  const drinks = route.drinks.slice();
  if (!route.meals.length) {
    return [
      "oj",
      "water",
      "wine",
      "oj",
      "water",
      "wine",
      "sleeping",
    ];
  }

  const singles = drinks.concat(route.meals);
  const combos = [];
  for (let i = 0; i < drinks.length; i++) {
    for (let j = 0; j < route.meals.length; j++) {
      combos.push(`${drinks[i]}+${route.meals[j]}`);
    }
  }
  return combos.concat(singles, singles, ["sleeping"]);
}

function createRng(seed) {
  let s = seed >>> 0;
  return {
    next() {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 0xffffffff;
    },
    ri(a, b) {
      return a + Math.floor(this.next() * (b - a + 1));
    },
  };
}

function buildPaxMap(routeKey) {
  const pool = buildStatePool(routeKey);
  const rng = createRng(7331);
  const map = {};
  for (let rowNum = 1; rowNum <= CABIN_ROWS; rowNum++) {
    const total = rng.ri(3, 5);
    const indices = [0, 1, 2, 3, 4, 5];
    for (let i = 5; i > 0; i--) {
      const j = Math.floor(rng.next() * (i + 1));
      const tmp = indices[i];
      indices[i] = indices[j];
      indices[j] = tmp;
    }
    const occupied = new Set(indices.slice(0, total));
    map[rowNum] = Array.from({ length: 6 }, (_, seatIdx) => {
      const occ = occupied.has(seatIdx);
      const archetype =
        PASSENGER_ARCHETYPES[rng.ri(0, PASSENGER_ARCHETYPES.length - 1)];
      const variation =
        PASSENGER_VARIATIONS[rng.ri(0, PASSENGER_VARIATIONS.length - 1)];
      return {
        occ,
        spriteFrame: `pax-${archetype}-${variation}`,
        state: occ ? pool[rng.ri(0, pool.length - 1)] : null,
        served: false,
        hasCup: false,
        cupCollected: false,
      };
    });
  }
  return map;
}

function tx(col) {
  return OX + col * TILE;
}
function ty(row) {
  return OY + row * TILE;
}
