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

  g.destroy();
}
