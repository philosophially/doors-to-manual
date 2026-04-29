function generateTextures(scene) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  // --- Fuselage top/bottom wall tile (32×32) ---
  g.clear();
  g.fillStyle(C.fuselage);
  g.fillRect(0, 0, TILE, TILE);
  g.fillStyle(C.fuseEdge);
  g.fillRect(0, 0, TILE, 3);
  g.generateTexture("fuse_wall", TILE, TILE);

  // --- Porthole (16×16, drawn centred) ---
  g.clear();
  g.fillStyle(C.fuseEdge);
  g.fillCircle(8, 8, 9);
  g.fillStyle(C.window);
  g.fillCircle(8, 8, 7);
  g.fillStyle(C.windowGlare);
  g.fillCircle(6, 6, 3);
  g.generateTexture("porthole", 16, 16);

  // --- Cabin floor tile (32×32, beige) ---
  g.clear();
  g.fillStyle(C.cabinFloor);
  g.fillRect(0, 0, TILE, TILE);
  g.generateTexture("cabin_floor", TILE, TILE);

  // --- Aisle tile (32×32, grey with centre dash) ---
  g.clear();
  g.fillStyle(C.aisle);
  g.fillRect(0, 0, TILE, TILE);
  g.fillStyle(C.aisleStripe);
  g.fillRect(TILE / 2 - 1, 4, 2, TILE - 8);
  g.generateTexture("aisle_tile", TILE, TILE);

  // --- Seat tile (32×32, navy with highlight) ---
  g.clear();
  g.fillStyle(C.cabinFloor);
  g.fillRect(0, 0, TILE, TILE);
  g.fillStyle(C.seatNavy);
  g.fillRect(3, 2, TILE - 6, TILE - 4);
  g.fillStyle(C.seatHi);
  g.fillRect(3, 2, TILE - 6, 5);
  g.generateTexture("seat_tile", TILE, TILE);

  // --- Column divider (1×96 — 3 seat rows tall) ---
  g.clear();
  g.fillStyle(C.divider);
  g.fillRect(0, 0, 1, TILE * 3);
  g.generateTexture("col_divider", 1, TILE * 3);

  // --- Cockpit fill tile (32×32) ---
  g.clear();
  g.fillStyle(C.cockpitFill);
  g.fillRect(0, 0, TILE, TILE);
  g.generateTexture("cockpit_fill", TILE, TILE);

  // --- Galley fill tile (32×32) ---
  g.clear();
  g.fillStyle(C.galleyFill);
  g.fillRect(0, 0, TILE, TILE);
  g.generateTexture("galley_fill", TILE, TILE);

  // --- Trolley (24×56, silver) ---
  g.clear();
  g.fillStyle(0xcccccc);
  g.fillRect(0, 0, 24, 56);
  g.fillStyle(0xaaaaaa);
  g.fillRect(2, Math.floor(56 / 3), 20, 2);
  g.fillRect(2, Math.floor((56 * 2) / 3), 20, 2);
  g.fillStyle(0x555555); // wheels
  g.fillRect(2, 52, 7, 4);
  g.fillRect(15, 52, 7, 4);
  g.fillStyle(0x999999); // handle (left side)
  g.fillRect(-5, 10, 5, 36);
  g.generateTexture("trolley", 29, 56);

  // Passenger and crew sprites are loaded from /sprites/*.png in preload().

  // --- Request bubbles (rounded speech bubble + pixel icon) ---
  const BUBBLE_W = 38;
  const BUBBLE_H = 30;
  const R = 7;
  const ox = 3;
  const oy = 2;

  function bubbleFrame() {
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(0, 0, BUBBLE_W, BUBBLE_H, R);
    g.lineStyle(2, 0xd0d0d0, 1);
    g.strokeRoundedRect(0, 0, BUBBLE_W, BUBBLE_H, R);
    // small tail overlapping downward (seat sits below)
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(
      BUBBLE_W / 2 - 5,
      BUBBLE_H - 2,
      BUBBLE_W / 2 + 5,
      BUBBLE_H - 2,
      BUBBLE_W / 2,
      BUBBLE_H + 6,
    );
    g.lineStyle(2, 0xd0d0d0, 1);
    g.lineBetween(BUBBLE_W / 2 - 5, BUBBLE_H - 2, BUBBLE_W / 2, BUBBLE_H + 6);
    g.lineBetween(BUBBLE_W / 2, BUBBLE_H + 6, BUBBLE_W / 2 + 5, BUBBLE_H - 2);
  }

  function emitBubble(key, drawIcon) {
    g.clear();
    bubbleFrame();
    drawIcon(g, ox, oy);
    g.generateTexture(key, BUBBLE_W, BUBBLE_H + 6);
  }

  // sleeping — grey Zs
  emitBubble("bubble_sleeping", (gg, x, y) => {
    gg.fillStyle(0x888888, 1);
    gg.fillRect(x + 8, y + 6, 10, 2);
    gg.fillRect(x + 14, y + 10, 8, 2);
    gg.fillRect(x + 20, y + 14, 6, 2);
  });

  // no thanks — red X
  emitBubble("bubble_nothanks", (gg, x, y) => {
    gg.lineStyle(4, 0xcc2222, 1);
    gg.lineBetween(x + 9, y + 5, x + 25, y + 19);
    gg.lineBetween(x + 25, y + 5, x + 9, y + 19);
  });

  // OJ — orange wedge / glass
  emitBubble("bubble_oj", (gg, x, y) => {
    gg.fillStyle(0xff8800, 1);
    gg.fillRect(x + 10, y + 4, 14, 16);
    gg.fillStyle(0xffcc66, 1);
    gg.fillRect(x + 12, y + 6, 10, 4);
    gg.fillStyle(0xffffff, 1);
    gg.fillRect(x + 13, y + 5, 8, 2);
  });

  // water — light blue cup
  emitBubble("bubble_water", (gg, x, y) => {
    gg.fillStyle(0x4a9eff, 1);
    gg.fillRect(x + 11, y + 8, 12, 12);
    gg.fillStyle(0x87ceff, 1);
    gg.fillRect(x + 13, y + 10, 8, 6);
    gg.fillStyle(0x2a6ecc, 1);
    gg.fillRect(x + 14, y + 20, 6, 2);
  });

  // wine — purple glass + stem
  emitBubble("bubble_wine", (gg, x, y) => {
    gg.fillStyle(0x6a2d8a, 1);
    gg.fillRect(x + 13, y + 5, 10, 12);
    gg.fillStyle(0x4a1a6a, 1);
    gg.fillRect(x + 15, y + 7, 6, 6);
    gg.fillStyle(0x888888, 1);
    gg.fillRect(x + 17, y + 17, 2, 6);
    gg.fillRect(x + 15, y + 23, 6, 2);
  });

  // pad thai — noodle box
  emitBubble("bubble_padthai", (gg, x, y) => {
    gg.fillStyle(0xc77a2f, 1);
    gg.fillRect(x + 9, y + 8, 18, 12);
    gg.fillStyle(0xe9b76d, 1);
    gg.fillRect(x + 11, y + 10, 14, 4);
    gg.fillStyle(0xffffff, 1);
    gg.fillRect(x + 12, y + 6, 12, 2);
  });

  // chicken rice — plate with protein and rice
  emitBubble("bubble_chickenrice", (gg, x, y) => {
    gg.fillStyle(0xffffff, 1);
    gg.fillRect(x + 9, y + 11, 20, 8);
    gg.fillStyle(0xf0d0a0, 1);
    gg.fillRect(x + 12, y + 12, 6, 6);
    gg.fillStyle(0xe7e7e7, 1);
    gg.fillRect(x + 20, y + 12, 6, 6);
  });

  // yakisoba — dark noodle tray
  emitBubble("bubble_yakisoba", (gg, x, y) => {
    gg.fillStyle(0x603b20, 1);
    gg.fillRect(x + 8, y + 10, 22, 10);
    gg.fillStyle(0xc08b4c, 1);
    gg.fillRect(x + 10, y + 12, 18, 4);
    gg.fillStyle(0x9fd76a, 1);
    gg.fillRect(x + 11, y + 8, 16, 2);
  });

  // fish with potatoes — fish filet + side
  emitBubble("bubble_fishpotatoes", (gg, x, y) => {
    gg.fillStyle(0x78a8d8, 1);
    gg.fillRect(x + 9, y + 11, 12, 7);
    gg.fillStyle(0xe0c080, 1);
    gg.fillRect(x + 22, y + 11, 7, 7);
    gg.fillStyle(0xffffff, 1);
    gg.fillRect(x + 10, y + 13, 8, 2);
  });

  g.destroy();
}
