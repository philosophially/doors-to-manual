// =============================================================================
// PHASER SCENE — CabinScene
// =============================================================================
class CabinScene extends Phaser.Scene {
  constructor() {
    super({ key: "CabinScene" });
  }

  // ---------------------------------------------------------------------------
  // PRELOAD — PNG sprites + programmatic cabin tiles (Graphics)
  // ---------------------------------------------------------------------------
  preload() {
    const crew = ["south", "north", "east", "west"];
    crew.forEach((dir) => {
      this.load.image(
        `female-crew-${dir}`,
        `sprites/female-crew-${dir}.png`,
      );
      this.load.image(
        `male-crew-${dir}`,
        `sprites/male-crew-${dir}.png`,
      );
    });
    for (let v = 0; v < 4; v++) {
      crew.forEach((dir) => {
        this.load.image(
          `pax-${v}-${dir}`,
          `sprites/pax-${v}-${dir}.png`,
        );
      });
    }
    generateTextures(this);
  }

  // ---------------------------------------------------------------------------
  // CREATE — place all static scene objects
  // ---------------------------------------------------------------------------
  create() {
    // Background
    this.add.rectangle(CW / 2, CH / 2, CW, CH, C.bg);

    this.drawFuselage();
    this.drawGalley();

    this.trolley = null;
    this.trolleyRow = TR.galley;

    for (let r = 0; r < CABIN_ROWS; r++) {
      const tileRow = TR.cabin + r;
      this.add.image(
        tx(TC.aisle) + TILE / 2,
        ty(tileRow) + TILE / 2,
        "aisle_tile",
      );
    }

    this.drawCabin();
    this.drawCockpit();

    this.aisleTint = this.add.graphics();

    this.playerCol = TC.aisle;
    this.playerRow = TR.cabin + 7;
    this.drawCrew();

    this.setPhase("idle");
    this.serviceEntryComplete = true;

    this.keyW = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.W,
    );
    this.keyS = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.S,
    );
    this.keyA = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.A,
    );
    this.keyD = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.D,
    );
    this.keySpace = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE,
    );
    this.keyArrowUp = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.UP,
    );
    this.keyArrowDown = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.DOWN,
    );

    this.drawLabels();
  }

  setAisleTint(active) {
    this.aisleTint.clear();
    if (!active) {
      return;
    }
    this.aisleTint.fillStyle(0xd4a96a, 0.35);
    for (let r = 0; r < CABIN_ROWS; r++) {
      const tileRow = TR.cabin + r;
      this.aisleTint.fillRect(
        tx(TC.aisle),
        ty(tileRow),
        TILE,
        TILE,
      );
    }
  }

  setPhase(phase) {
    this.phase = phase;
    const labels = {
      idle: "BOARDING",
      service: "SERVICE",
      landing: "LANDING",
    };
    const el = document.getElementById("hud-phase");
    if (el) {
      el.textContent =
        "PHASE: " + (labels[phase] || phase.toUpperCase());
    }
    if (phase === "landing") {
      this.setAisleTint(false);
    }
  }

  syncServiceUnitPositions() {
    this.trolleyRow = this.playerRow - 1;
    this.crewSprite.setPosition(
      tx(this.playerCol) + TILE / 2,
      ty(this.playerRow) + TILE / 2,
    );
    this.trolley.setPosition(
      tx(TC.aisle) + TILE / 2,
      ty(this.trolleyRow) + TILE / 2 + 4,
    );
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.keyW)) {
      this.crewSprite.setTexture(`${this.crewTexturePrefix}north`);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyS)) {
      this.crewSprite.setTexture(`${this.crewTexturePrefix}south`);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyA)) {
      this.crewSprite.setTexture(`${this.crewTexturePrefix}west`);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyD)) {
      this.crewSprite.setTexture(`${this.crewTexturePrefix}east`);
    }

    const boardingMove =
      this.phase === "idle" && this.serviceEntryComplete;
    const serviceMove =
      this.phase === "service" && this.serviceEntryComplete;

    if (Phaser.Input.Keyboard.JustDown(this.keyArrowUp)) {
      this.crewSprite.setTexture(`${this.crewTexturePrefix}north`);
      if (boardingMove && this.playerRow > TR.galley) {
        this.playerRow -= 1;
        this.crewSprite.setPosition(
          tx(this.playerCol) + TILE / 2,
          ty(this.playerRow) + TILE / 2,
        );
      } else if (
        serviceMove &&
        this.playerRow > TR.galley + 1
      ) {
        this.playerRow -= 1;
        this.syncServiceUnitPositions();
      }
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyArrowDown)) {
      if (this.phase === "service") {
        this.crewSprite.setTexture(`${this.crewTexturePrefix}north`);
      } else {
        this.crewSprite.setTexture(`${this.crewTexturePrefix}south`);
      }
      if (boardingMove && this.playerRow < TR.cabin + 7) {
        this.playerRow += 1;
        this.crewSprite.setPosition(
          tx(this.playerCol) + TILE / 2,
          ty(this.playerRow) + TILE / 2,
        );
      } else if (serviceMove && this.playerRow < TR.cabin + 7) {
        this.playerRow += 1;
        this.syncServiceUnitPositions();
      }
    }

    if (
      this.phase === "idle" &&
      Phaser.Input.Keyboard.JustDown(this.keySpace)
    ) {
      if (!this.trolley) {
        this.trolley = this.add
          .image(
            tx(TC.aisle) + TILE / 2,
            ty(TR.galley) + TILE / 2 + 4,
            "trolley",
          )
          .setOrigin(0.5, 0.5)
          .setDepth(10);
      }
      this.trolleyRow = TR.galley;
      this.trolley.setPosition(
        tx(TC.aisle) + TILE / 2,
        ty(TR.galley) + TILE / 2 + 4,
      );
      this.setPhase("service");
      this.setAisleTint(true);
      this.crewSprite.setTexture(`${this.crewTexturePrefix}north`);
      this.serviceEntryComplete = false;
      this.tweens.add({
        targets: this.crewSprite,
        y: ty(TR.galley + 1) + TILE / 2,
        duration: 250,
        ease: "Quad.easeOut",
        onComplete: () => {
          this.playerRow = TR.galley + 1;
          this.crewSprite.setPosition(
            tx(this.playerCol) + TILE / 2,
            ty(this.playerRow) + TILE / 2,
          );
          this.syncServiceUnitPositions();
          this.serviceEntryComplete = true;
        },
      });
    }
  }

  // ---------------------------------------------------------------------------
  // FUSELAGE — left/right walls + top/bottom bands + portholes
  // ---------------------------------------------------------------------------
  drawFuselage() {
    // Left + right fuselage walls for all rows
    for (let r = 0; r < GRID_ROWS; r++) {
      this.add.image(
        tx(TC.fuseLeft) + TILE / 2,
        ty(r) + TILE / 2,
        "fuse_wall",
      );
      this.add.image(
        tx(TC.fuseRight) + TILE / 2,
        ty(r) + TILE / 2,
        "fuse_wall",
      );
    }

    // Top + bottom fuselage walls across full width
    for (let c = 0; c < GRID_COLS; c++) {
      this.add.image(
        tx(c) + TILE / 2,
        ty(TR.fuseTop) + TILE / 2,
        "fuse_wall",
      );
      this.add
        .image(tx(c) + TILE / 2, ty(TR.fuseBot) + TILE / 2, "fuse_wall")
        .setFlipY(true);
    }

    // Portholes — one per cabin row, on both left and right walls
    for (let r = 0; r < CABIN_ROWS; r++) {
      const tileRow = TR.cabin + r;
      const py = ty(tileRow) + TILE / 2;
      this.add.image(tx(TC.fuseLeft) + TILE / 2, py, "porthole");
      this.add.image(tx(TC.fuseRight) + TILE / 2, py, "porthole");
    }
  }

  // ---------------------------------------------------------------------------
  // CABIN — seats + aisle + passengers (rows 1–8)
  // ---------------------------------------------------------------------------
  drawCabin() {
    const seatBg = this.add.graphics();
    seatBg.fillStyle(0x03165c, 1);

    const seatCols = [...SEAT_COLS_LEFT, ...SEAT_COLS_RIGHT];

    for (let r = 0; r < CABIN_ROWS; r++) {
      const tileRow = TR.cabin + r;
      const rowNum = r + 1; // paxMap keys are 1–8

      // Seats A–F (0–5) across left then right
      seatCols.forEach((col, seatIdx) => {
        const cx = tx(col) + TILE / 2;
        const cy = ty(tileRow) + TILE / 2;
        const seat = paxMap[rowNum][seatIdx];

        seatBg.fillRect(
          tx(col) + 2,
          ty(tileRow) + 2,
          TILE - 4,
          TILE - 4,
        );
        if (seat.occ) {
          this.add
            .image(cx, cy, `pax-${seat.v}-south`)
            .setDisplaySize(TILE - 8, TILE - 8);
        }
      });
    }
  }

  // ---------------------------------------------------------------------------
  // COCKPIT — bottom row (TR.cockpit)
  // ---------------------------------------------------------------------------
  drawCockpit() {
    // Fill cockpit row across cols 1–7
    for (let c = TC.seatA; c <= TC.seatF; c++) {
      this.add.image(
        tx(c) + TILE / 2,
        ty(TR.cockpit) + TILE / 2,
        "cockpit_fill",
      );
    }

    // Door panel (Graphics — drawn over tiles in the cockpit row)
    const g = this.add.graphics();
    const x0 = tx(TC.seatA);
    const y0 = ty(TR.cockpit);
    const w = (TC.seatF - TC.seatA + 1) * TILE;
    const h = TILE;

    // Outer frame (reads as a thicker door surround in one tile)
    g.lineStyle(2, 0x2a4068, 1);
    g.strokeRect(x0 + 2, y0 + 2, w - 4, h - 4);

    g.fillStyle(0x1b2a4a);
    g.fillRect(x0 + 5, y0 + 5, w - 10, h - 10);

    g.lineStyle(1.5, 0x0a1020);
    g.strokeRect(x0 + 7, y0 + 7, w - 14, h - 14);

    // Centre seam
    g.lineStyle(1.5, 0x0a1020);
    g.beginPath();
    g.moveTo(x0 + w / 2, y0 + 9);
    g.lineTo(x0 + w / 2, y0 + h - 9);
    g.strokePath();

    // Handle
    g.fillStyle(0x3a5080);
    g.fillRect(x0 + w - 15, y0 + h / 2 - 5, 6, 10);

    // Portholes on cockpit door
    const doorCx = x0 + w / 2;
    const doorCy = y0 + h / 2;
    this.add
      .image(doorCx - 26, doorCy, "porthole")
      .setScale(1);
    this.add
      .image(doorCx + 26, doorCy, "porthole")
      .setScale(1);

    // COCKPIT label — larger + stroke so it reads on dark blue
    this.add
      .text(x0 + w / 2, y0 + h / 2 + 1, "COCKPIT", {
        fontFamily: '"Press Start 2P"',
        fontSize: "7px",
        color: "#c8e6ff",
        stroke: "#0a1020",
        strokeThickness: 3,
      })
      .setOrigin(0.5, 0.5);
  }

  // ---------------------------------------------------------------------------
  // GALLEY — top row (TR.galley)
  // ---------------------------------------------------------------------------
  drawGalley() {
    // Fill galley row across cols 1–7
    for (let c = TC.seatA; c <= TC.seatF; c++) {
      this.add.image(
        tx(c) + TILE / 2,
        ty(TR.galley) + TILE / 2,
        "galley_fill",
      );
    }

    const g = this.add.graphics();
    const x0 = tx(TC.seatA);
    const y0 = ty(TR.galley);
    const w = (TC.seatF - TC.seatA + 1) * TILE;

    // Upper counter band + lower equipment band (reads clearer in one tile)
    g.fillStyle(0xb8b8b8);
    g.fillRect(x0 + 2, y0 + 2, w - 4, 11);
    g.lineStyle(1, 0x888888, 1);
    g.strokeRect(x0 + 2, y0 + 2, w - 4, 11);

    // Lower galley “bench” / ovens
    g.fillStyle(0x999999);
    g.fillRect(x0 + 4, y0 + 16, w - 8, TILE - 20);
    g.fillStyle(0x888888);
    g.fillRect(x0 + 6, y0 + 19, w - 12, 4);

    // Small indicator lights along the bench
    const lightsY = y0 + 24;
    const step = Math.floor((w - 20) / 6);
    for (let i = 0; i < 6; i++) {
      const lx = x0 + 10 + i * step;
      g.fillStyle(i % 2 === 0 ? 0x00cc44 : 0xffaa00);
      g.fillRect(lx, lightsY, 4, 4);
    }

    // GALLEY label — sits on the lower bench band (clear of counter + lights)
    this.add
      .text(x0 + w / 2, y0 + 34, "GALLEY", {
        fontFamily: '"Press Start 2P"',
        fontSize: "7px",
        color: "#1b2a4a",
        stroke: "#e8e8e8",
        strokeThickness: 2,
      })
      .setOrigin(0.5, 0.5);
  }

  // ---------------------------------------------------------------------------
  // CREW — boarding: aisle at this.playerRow / this.playerCol (set before call)
  // ---------------------------------------------------------------------------
  drawCrew() {
    const cx = tx(this.playerCol) + TILE / 2;
    const cy = ty(this.playerRow) + TILE / 2;

    // Standing crew — no seat tile background (unlike seated passengers)

    // Character select sets window.selectedCrew; default / undefined = female.
    this.crewGender =
      window.selectedCrew === "male" ? "male" : "female";
    const prefix =
      this.crewGender === "male" ? "male-crew-" : "female-crew-";
    this.crewTexturePrefix = prefix;

    this.crewDir = "south";
    this.crewSprite = this.add
      .image(cx, cy, `${prefix}south`)
      .setOrigin(0.5, 0.5)
      .setDisplaySize(TILE - 4, TILE - 4)
      .setDepth(20);
  }

  // ---------------------------------------------------------------------------
  // LABELS — row numbers (left) + seat letters (top)
  // ---------------------------------------------------------------------------
  drawLabels() {
    const labelStyle = {
      fontFamily: '"Press Start 2P"',
      fontSize: "5px",
      color: "#888888",
    };

    // Row numbers (1–8) to the left of the cabin rows
    const rowLabelX = tx(TC.fuseLeft) - 10;
    for (let r = 0; r < CABIN_ROWS; r++) {
      const tileRow = TR.cabin + r;
      const rowLabel = String(CABIN_ROWS - r);
      this.add
        .text(rowLabelX, ty(tileRow) + TILE / 2, rowLabel, labelStyle)
        .setOrigin(0.5);
    }

    // Seat letters above cabin (F E D | C B A)
    const seatLetters = ["F", "E", "D", "C", "B", "A"];
    const seatCols = [...SEAT_COLS_LEFT, ...SEAT_COLS_RIGHT];
    const seatLabelY = ty(TR.cabin) - 10;
    const seatLetterStyle = {
      ...labelStyle,
      color: "#cccccc",
    };
    seatCols.forEach((col, i) => {
      this.add
        .text(tx(col) + TILE / 2, seatLabelY, seatLetters[i], seatLetterStyle)
        .setOrigin(0.5);
    });
  }
}
