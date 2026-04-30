// =============================================================================
// PHASER SCENE — CabinScene
// =============================================================================
class CabinScene extends Phaser.Scene {
  constructor() {
    super({ key: "CabinScene" });
  }

  preload() {
    ["female-crew", "male-crew"].forEach((g) => {
      ["south", "north", "east", "west"].forEach((d) => {
        this.load.image(`${g}-${d}`, `sprites/${g}-${d}.png`);
      });
    });
    this.load.image("bubble_oj", "sprites/bubble_oj.png");
    this.load.image("bubble_water", "sprites/bubble_water.png");
    this.load.image("bubble_wine", "sprites/bubble_wine.png");
    this.load.image("bubble_padthai", "sprites/bubble_padthai.png");
    this.load.image("bubble_chickenrice", "sprites/bubble_chickenrice.png");
    this.load.image("bubble_yakisoba", "sprites/bubble_yakisoba.png");
    this.load.image("bubble_fishpotatoes", "sprites/bubble_fishpotatoes.png");
    this.load.image("bubble_sleeping", "sprites/bubble_sleeping.png");
    this.load.image("bubble_nothanks", "sprites/bubble_nothanks.png");
    this.load.atlas("passengers", "sprites/passengers.png", "sprites/passengers.json");
    generateTextures(this);
  }

  create() {
    this.ensureFallbackSprites();
    this.routeKey = window.selectedRoute || "KUL";
    this.route = ROUTES[this.routeKey] || ROUTES.KUL;
    this.paxMap = buildPaxMap(this.routeKey);
    this.score = 0;
    this.remainingSec = this.route.timerSeconds;
    this.phase = "idle";
    this.facing = "east";
    this.selectedSeatIdx = null;
    this.selectedServiceTarget = null;
    this.serviceSideChosen = false;
    this.promptState = null;
    this.callTasks = [];
    this.pendingCallContext = null;

    // -------------------------------------------------------------------------
    // FIX — Issue 3: Reset all persistent DOM HUD elements on every new game.
    // The #hud-timer "is-warning" CSS class (red/pulsing) is only ever added,
    // never removed — so it carries over into subsequent playthroughs.
    // We also reset the text content to 10:00 since Phaser scene restarts do
    // not touch DOM elements outside the canvas.
    // -------------------------------------------------------------------------
    const timerEl = document.getElementById("hud-timer");
    if (timerEl) {
      timerEl.classList.remove("is-warning");
      timerEl.textContent = "10:00";
    }
    const scoreEl = document.getElementById("hud-score");
    if (scoreEl) scoreEl.textContent = "SCORE: 0";
    const phaseEl = document.getElementById("hud-phase");
    if (phaseEl) phaseEl.textContent = "PHASE: BOARDING";
    const hintEl = document.getElementById("hint-bar");
    if (hintEl) hintEl.textContent = "SPACEBAR — Begin service";

    this.add.rectangle(CW / 2, CH / 2, CW, CH, C.bg);
    this.drawFuselage();
    this.drawGalley();
    this.drawAisle();
    this.drawCabin();
    this.drawCockpit();
    this.aisleTint = this.add.graphics();
    this.bubbleByKey = {};
    this.bubbleWindowStartDisplay = 1;
    this.playerCol = TC.aisle;
    this.playerRow = TR.cabin + 7;
    this.drawCrew();
    this.drawLabels();

    this.keyMap = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      esc: Phaser.Input.Keyboard.KeyCodes.ESC,
      shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      c: Phaser.Input.Keyboard.KeyCodes.C,
      f: Phaser.Input.Keyboard.KeyCodes.F,
      g: Phaser.Input.Keyboard.KeyCodes.G,
      r: Phaser.Input.Keyboard.KeyCodes.R,
      one: Phaser.Input.Keyboard.KeyCodes.ONE,
      two: Phaser.Input.Keyboard.KeyCodes.TWO,
      three: Phaser.Input.Keyboard.KeyCodes.THREE,
      four: Phaser.Input.Keyboard.KeyCodes.FOUR,
      five: Phaser.Input.Keyboard.KeyCodes.FIVE,
    });

    this.trolley = null;
    this.serviceEntryComplete = true;
    this.setPhase("idle");
    this.updateHudMeta();
    this.updateTimerHud();
    this.updateScore(0);
    this.updateHintBar();
  }

  ensureFallbackSprites() {
    const dirs = ["south", "north", "east", "west"];
    const makeFallback = (key, bodyColor) => {
      if (this.textures.exists(key)) return;
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(bodyColor, 1);
      g.fillRect(10, 18, 28, 24);
      g.fillStyle(C.crewSkin, 1);
      g.fillRect(14, 6, 20, 12);
      g.generateTexture(key, 48, 48);
      g.destroy();
    };
    for (let i = 0; i < dirs.length; i++) {
      makeFallback(`female-crew-${dirs[i]}`, 0x00ff7f);
      makeFallback(`male-crew-${dirs[i]}`, 0x44aaff);
    }
    if (!this.textures.exists("passengers")) {
      const fallbackFrames = [
        "pax-intern-a",
        "pax-bizlady-a",
        "pax-tourist-a",
        "pax-elderly-a",
        "pax-backpacker-a",
      ];
      for (let i = 0; i < fallbackFrames.length; i++) {
        const key = fallbackFrames[i];
        if (this.textures.exists(key)) continue;
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x63708a + i * 0x060606, 1);
        g.fillRect(10, 18, 28, 24);
        g.fillStyle(0xe0bd9a, 1);
        g.fillRect(14, 6, 20, 12);
        g.generateTexture(key, 48, 48);
        g.destroy();
      }
    }
  }

  update() {
    if (!this.serviceEntryComplete) return;
    if (this.handleMovement()) this.syncPassengerBubbles();
    this.handleFacingAndSelection();
    this.handleInteractionKeys();
  }

  handleMovement() {
    const k = this.keyMap;
    const moveUp =
      Phaser.Input.Keyboard.JustDown(k.up) ||
      Phaser.Input.Keyboard.JustDown(k.w);
    const moveDown =
      Phaser.Input.Keyboard.JustDown(k.down) ||
      Phaser.Input.Keyboard.JustDown(k.s);
    let moved = false;
    if (moveUp && this.playerRow > TR.galley) {
      this.playerRow -= 1;
      this.setCrewDirection("north");
      moved = true;
    }
    if (moveDown && this.playerRow <= TR.cabin + 7) {
      this.playerRow += 1;
      if (
        this.phase === "service" ||
        this.phase === "collection" ||
        this.phase === "callbutton"
      ) {
        this.setCrewDirection("north");
      } else {
        this.setCrewDirection("south");
      }
      moved = true;
    }
    if (moved) {
      this.syncCrewPosition();
      if (this.phase === "service") {
        this.selectedServiceTarget = null;
        this.promptState = null;
      } else if (this.phase === "collection" || this.phase === "callbutton") {
        this.selectedSeatIdx = null;
        this.promptState = null;
      }
      if (this.phase === "collection" && this.playerRow === TR.galley) {
        this.finishCollectionPhase();
      }
    }
    return moved;
  }

  handleFacingAndSelection() {
    const k = this.keyMap;
    if (Phaser.Input.Keyboard.JustDown(k.a)) {
      this.facing = "west";
      this.setCrewDirection("west");
      if (this.phase === "service") {
        this.serviceSideChosen = true;
        this.selectedServiceTarget = null;
      } else {
        this.selectedSeatIdx = null;
      }
      this.syncPassengerBubbles();
    }
    if (Phaser.Input.Keyboard.JustDown(k.d)) {
      this.facing = "east";
      this.setCrewDirection("east");
      if (this.phase === "service") {
        this.serviceSideChosen = true;
        this.selectedServiceTarget = null;
      } else {
        this.selectedSeatIdx = null;
      }
      this.syncPassengerBubbles();
    }
    if (Phaser.Input.Keyboard.JustDown(k.left)) {
      if (this.phase === "service" && !this.serviceSideChosen) return;
      this.moveSeatSelection(-1);
    }
    if (Phaser.Input.Keyboard.JustDown(k.right)) {
      if (this.phase === "service" && !this.serviceSideChosen) return;
      this.moveSeatSelection(1);
    }
  }

  handleInteractionKeys() {
    const k = this.keyMap;
    if (Phaser.Input.Keyboard.JustDown(k.esc)) {
      this.promptState = null;
      this.selectedSeatIdx = null;
      this.selectedServiceTarget = null;
      if (this.phase === "service") this.serviceSideChosen = false;
      this.updateHintBar();
      this.syncPassengerBubbles();
      return;
    }
    if (this.phase === "idle" && Phaser.Input.Keyboard.JustDown(k.space)) {
      this.startServicePhase();
      return;
    }
    if (this.phase === "service") { this.handleServiceInputs(); return; }
    if (this.phase === "collection") { this.handleCollectionInputs(); return; }
    if (this.phase === "callbutton") { this.handleCallbuttonInputs(); }
  }

  handleServiceInputs() {
    const k = this.keyMap;
    const seat = this.getSelectedSeat();
    if (!seat || !seat.occ || seat.served) return;
    if (Phaser.Input.Keyboard.JustDown(k.shift)) {
      if (seat.state === "sleeping" || seat.state === "nothanks") {
        seat.served = true;
        this.updateAfterServiceResolution();
      }
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(k.space)) {
      this.promptState = "service";
      this.updateHintBar();
      return;
    }
    if (this.promptState !== "service") return;
    const keyToItem = this.serviceKeyMap();
    const pressed = this.getPressedServiceKey();
    if (!pressed) return;
    const chosen = keyToItem[pressed];
    if (!chosen) return;
    if (seat.state === "sleeping") {
      this.updateScore(SERVICE_POINTS.sleepingWake);
      this.promptState = null;
      return;
    }
    if (seat.state === "nothanks") {
      this.updateScore(SERVICE_POINTS.noThanksForce);
      this.promptState = null;
      return;
    }
    const req = seat.state.split("+");
    if (req.length === 1) {
      if (req[0] === chosen) {
        this.updateScore(
          req[0] === "oj" || req[0] === "water" || req[0] === "wine"
            ? SERVICE_POINTS.drink
            : SERVICE_POINTS.meal,
        );
        seat.served = true;
        seat.hasCup = true;
        this.promptState = null;
        this.updateAfterServiceResolution();
      } else {
        this.updateScore(SERVICE_POINTS.wrongItem);
        this.promptState = null;
      }
      return;
    }
    if (!this.pendingComboPick) {
      if (chosen !== req[0]) {
        this.updateScore(SERVICE_POINTS.wrongItem);
        this.promptState = null;
        return;
      }
      this.pendingComboPick = chosen;
      return;
    }
    if (chosen === req[1]) {
      this.updateScore(SERVICE_POINTS.combo);
      seat.served = true;
      seat.hasCup = true;
      this.pendingComboPick = null;
      this.promptState = null;
      this.updateAfterServiceResolution();
      return;
    }
    this.updateScore(SERVICE_POINTS.wrongItem);
    this.pendingComboPick = null;
    this.promptState = null;
  }

  handleCollectionInputs() {
    const k = this.keyMap;
    const seat = this.getSelectedSeat();
    if (!seat || !seat.hasCup || seat.cupCollected) return;
    if (Phaser.Input.Keyboard.JustDown(k.space)) {
      this.promptState = "collection";
      this.updateHintBar();
      return;
    }
    if (this.promptState !== "collection") return;
    if (Phaser.Input.Keyboard.JustDown(k.c)) {
      seat.cupCollected = true;
      this.updateScore(SCORE_RULES.collectionGood);
      this.promptState = null;
    }
    if (Phaser.Input.Keyboard.JustDown(k.shift)) {
      seat.cupCollected = true;
      this.promptState = null;
    }
  }

  handleCallbuttonInputs() {
    const k = this.keyMap;
    const task = this.getCurrentCallTask();
    if (!task) return;
    if (task.scenario === "B") {
      if (
        Phaser.Input.Keyboard.JustDown(k.r) ||
        Phaser.Input.Keyboard.JustDown(k.shift)
      ) {
        task.resolved = true;
        this.updateScore(SCORE_RULES.callReset);
      }
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(k.space)) {
      this.promptState = "callbutton";
      this.pendingCallContext = { items: [] };
      this.updateHintBar();
      return;
    }
    if (!this.pendingCallContext) return;
    if (this.playerRow === TR.galley && Phaser.Input.Keyboard.JustDown(k.f)) {
      this.promptState = "fetch";
      this.updateHintBar();
      return;
    }
    if (this.promptState === "fetch") {
      if (Phaser.Input.Keyboard.JustDown(k.one)) this.pendingCallContext.items.push("drink");
      if (Phaser.Input.Keyboard.JustDown(k.two)) this.pendingCallContext.items.push("snack");
    }
    if (Phaser.Input.Keyboard.JustDown(k.g)) {
      const got = this.pendingCallContext.items.slice().sort().join(",");
      const want = task.expectedItems.slice().sort().join(",");
      this.updateScore(got === want ? SCORE_RULES.callCorrect : SCORE_RULES.callWrong);
      task.resolved = true;
      this.pendingCallContext = null;
      this.promptState = null;
    }
  }

  serviceKeyMap() {
    const map = { 1: "oj", 2: "water", 3: "wine" };
    if (this.routeKey === "BKK") { map[4] = "padthai"; map[5] = "chickenrice"; }
    if (this.routeKey === "NRT") { map[4] = "yakisoba"; map[5] = "fishpotatoes"; }
    return map;
  }

  getPressedServiceKey() {
    const k = this.keyMap;
    if (Phaser.Input.Keyboard.JustDown(k.one)) return 1;
    if (Phaser.Input.Keyboard.JustDown(k.two)) return 2;
    if (Phaser.Input.Keyboard.JustDown(k.three)) return 3;
    if (Phaser.Input.Keyboard.JustDown(k.four)) return 4;
    if (Phaser.Input.Keyboard.JustDown(k.five)) return 5;
    return null;
  }

  getCurrentRowNum() { return this.playerRow - TR.cabin + 1; }

  seatColForSeatIndex(seatIdx) {
    return [...SEAT_COLS_LEFT, ...SEAT_COLS_RIGHT][seatIdx];
  }

  getSelectableSeatIndices() {
    if (this.phase === "service") return this.getSelectableServiceTargets();
    const rowNum = this.getCurrentRowNum();
    if (rowNum < 1 || rowNum > CABIN_ROWS) return [];
    const arr = this.facing === "east" ? [3, 4, 5] : [0, 1, 2];
    const result = [];
    for (let i = 0; i < arr.length; i++) {
      const idx = arr[i];
      const seat = this.paxMap[rowNum][idx];
      if (!seat.occ) continue;
      if (this.phase === "collection" && seat.hasCup && !seat.cupCollected) result.push(idx);
      if (this.phase === "callbutton") {
        const task = this.callTasks.find(
          (t) => t.rowNum === rowNum && t.seatIdx === idx && !t.resolved,
        );
        if (task) result.push(idx);
      }
    }
    return result;
  }

  moveSeatSelection(delta) {
    const seats = this.getSelectableSeatIndices();
    if (!seats.length) {
      if (this.phase === "service") this.selectedServiceTarget = null;
      else this.selectedSeatIdx = null;
      return;
    }
    const current = this.phase === "service" ? this.selectedServiceTarget : this.selectedSeatIdx;
    let i = seats.indexOf(current);
    if (i < 0) i = 0;
    i = Phaser.Math.Wrap(i + delta, 0, seats.length);
    if (this.phase === "service") {
      this.selectedServiceTarget = seats[i];
      this.syncPassengerBubbles();
    } else {
      this.selectedSeatIdx = seats[i];
    }
  }

  getSelectedSeat() {
    if (this.phase === "service") {
      if (!this.selectedServiceTarget) return null;
      const [rowText, seatText] = this.selectedServiceTarget.split("-");
      const rowNum = Number(rowText);
      const seatIdx = Number(seatText);
      if (rowNum < 1 || rowNum > CABIN_ROWS || seatIdx < 0 || seatIdx > 5) return null;
      return this.paxMap[rowNum][seatIdx];
    }
    const rowNum = this.getCurrentRowNum();
    if (rowNum < 1 || rowNum > CABIN_ROWS || this.selectedSeatIdx == null) return null;
    return this.paxMap[rowNum][this.selectedSeatIdx];
  }

  updateAfterServiceResolution() {
    this.checkBubbleWindowAdvance();
    const liveTargets = this.getSelectableServiceTargets();
    if (!liveTargets.includes(this.selectedServiceTarget)) this.selectedServiceTarget = null;
    this.syncPassengerBubbles();
    this.updateHintBar();
  }

  getSelectableServiceTargets() {
    const rowNum = this.getCurrentRowNum();
    if (rowNum < 1 || rowNum > CABIN_ROWS) return [];
    const side = this.facing === "west" ? [0, 1, 2] : [3, 4, 5];
    const targets = [];
    for (let s = 0; s < side.length; s++) {
      const seatIdx = side[s];
      const seat = this.paxMap[rowNum][seatIdx];
      if (seat.occ && !seat.served && seat.state) targets.push(`${rowNum}-${seatIdx}`);
    }
    return targets;
  }

  checkBubbleWindowAdvance() {
    const d = this.bubbleWindowStartDisplay;
    const rowNum = 9 - d;
    if (rowNum < 1 || rowNum > CABIN_ROWS) return;
    const row = this.paxMap[rowNum];
    const done = row.every((s) => !s.occ || s.served);
    if (done) this.bubbleWindowStartDisplay = Math.min(7, d + 1);
  }

  setPhase(phase) {
    this.phase = phase;
    // -------------------------------------------------------------------------
    // FIX — Issue 2: "landed" maps to "LANDED" so the bottom HUD shows the
    // correct final state on the WinScene screen.
    // -------------------------------------------------------------------------
    const labels = {
      idle: "BOARDING",
      service: "SERVICE",
      collection: "COLLECTION",
      callbutton: "CALL BUTTONS",
      landing: "LANDING",
      landed: "LANDED",
    };
    const el = document.getElementById("hud-phase");
    if (el) el.textContent = `PHASE: ${labels[phase] || phase.toUpperCase()}`;
    if (phase === "service") this.setAisleTint(true);
    if (phase === "landing") this.setAisleTint(false);
    if (phase !== "service") {
      this.fadeOutAllPassengerBubbles();
      this.serviceSideChosen = false;
      this.selectedServiceTarget = null;
    }
    this.updateHintBar();
  }

  startServicePhase() {
    if (!this.trolley) {
      this.trolley = this.add
        .image(tx(TC.aisle) + TILE / 2, ty(TR.galley) + TILE / 2 + 4, "trolley")
        .setDepth(10);
    }
    this.setPhase("service");
    this.startTimer();
    this.serviceEntryComplete = false;
    this.setCrewDirection("north");
    this.tweens.add({
      targets: this.crewSprite,
      y: ty(TR.galley + 1) + TILE / 2,
      duration: 240,
      onComplete: () => {
        this.playerRow = TR.galley + 1;
        this.syncCrewPosition();
        this.serviceEntryComplete = true;
        this.bubbleWindowStartDisplay = 1;
        this.serviceSideChosen = false;
        this.selectedServiceTarget = null;
        this.syncPassengerBubbles();
      },
    });
    this.scheduleTurbulence();
  }

  startTimer() {
    if (this.timerEvent) return;
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.remainingSec = Math.max(0, this.remainingSec - 1);
        this.updateTimerHud();
        this.checkPhaseCheckpoints();
        if (this.remainingSec <= 0) {
          this.timerEvent.remove(false);
          this.scene.start("WinScene", { score: this.score });
        }
      },
    });
  }

  checkPhaseCheckpoints() {
    if (this.remainingSec <= 120) {
      const timerEl = document.getElementById("hud-timer");
      if (timerEl) timerEl.classList.add("is-warning");
    }
    if (this.remainingSec === 300 && this.phase === "service") {
      this.showServicePopup();
      this.enterCollectionPhase();
    }
    if (this.remainingSec === 180 && this.phase === "collection") {
      this.finishCollectionPhase();
    }
    if (this.remainingSec === 60 && this.phase === "callbutton") {
      this.finishCallbuttonPhase();
    }
  }

  showServicePopup() {
    const allServed = this.allServiceResolved();
    const txt = allServed
      ? "Great job! Time to collect back what we have served out."
      : "Please buck up on your service speed for the next flight.";
    const popup = this.add
      .text(CW / 2, CH / 2, txt, {
        fontFamily: '"Press Start 2P"',
        fontSize: "9px",
        color: "#1b2a4a",
        backgroundColor: "#f5f0e8",
        padding: { x: 12, y: 10 },
        align: "center",
        wordWrap: { width: 600 },
      })
      .setOrigin(0.5)
      .setDepth(300);
    this.serviceEntryComplete = false;
    this.time.delayedCall(2800, () => {
      popup.destroy();
      this.serviceEntryComplete = true;
    });
  }

  enterCollectionPhase() {
    this.setPhase("collection");
    this.selectedSeatIdx = null;
    this.promptState = null;
    if (this.trolley)
      this.trolley.setPosition(tx(TC.aisle) + TILE / 2, ty(TR.galley) + TILE / 2 + 4);
  }

  finishCollectionPhase() {
    if (this.phase !== "collection") return;
    for (let r = 1; r <= CABIN_ROWS; r++) {
      for (let s = 0; s < 6; s++) {
        const seat = this.paxMap[r][s];
        if (seat.hasCup && !seat.cupCollected) this.updateScore(SCORE_RULES.collectionMiss);
      }
    }
    this.enterCallbuttonPhase();
  }

  enterCallbuttonPhase() {
    this.setPhase("callbutton");
    this.callTasks = this.pickCallTasks();
    this.selectedSeatIdx = null;
    this.promptState = null;
    this.pendingCallContext = null;
  }

  pickCallTasks() {
    const servedSeats = [];
    for (let r = 1; r <= CABIN_ROWS; r++) {
      for (let s = 0; s < 6; s++) {
        const seat = this.paxMap[r][s];
        if (seat.occ && seat.served) servedSeats.push({ rowNum: r, seatIdx: s });
      }
    }
    Phaser.Utils.Array.Shuffle(servedSeats);
    const picked = servedSeats.slice(0, Math.min(3, servedSeats.length));
    return picked.map((p, i) => ({
      ...p,
      scenario: i % 2 === 0 ? "A" : "B",
      expectedItems: i % 2 === 0 ? ["drink"] : [],
      resolved: false,
    }));
  }

  getCurrentCallTask() {
    const rowNum = this.getCurrentRowNum();
    return (
      this.callTasks.find(
        (t) => t.rowNum === rowNum && t.seatIdx === this.selectedSeatIdx && !t.resolved,
      ) || null
    );
  }

  finishCallbuttonPhase() {
    for (let i = 0; i < this.callTasks.length; i++) {
      if (!this.callTasks[i].resolved) this.updateScore(SCORE_RULES.callUnresolved);
    }
    this.setPhase("landing");
    this.startLandingSequence();
  }

  startLandingSequence() {
    this.serviceEntryComplete = false;
    this.updateHintBar();
    this.tweens.add({
      targets: this.cameras.main,
      duration: 700,
      repeat: 8,
      onUpdate: () => { this.cameras.main.shake(40, 0.004); },
    });
    this.time.delayedCall(Math.max(1000, this.remainingSec * 1000), () => {
      this.remainingSec = 0;
      this.updateTimerHud();
      // -----------------------------------------------------------------------
      // FIX — Issue 2: Switch to "landed" phase immediately before handing off
      // to WinScene. This sets the bottom HUD to "PHASE: LANDED" and updates
      // the hint bar to the congratulations message. Both DOM elements persist
      // visibly on the WinScene since they live outside the Phaser canvas.
      // -----------------------------------------------------------------------
      this.setPhase("landed");
      this.scene.start("WinScene", { score: this.score });
    });
  }

  scheduleTurbulence() {
    for (let i = 0; i < this.route.turbulence.length; i++) {
      const t = this.route.turbulence[i];
      this.time.delayedCall(t.elapsedSec * 1000, () => {
        if (this.phase === "service" || this.phase === "callbutton") {
          this.updateScore(SCORE_RULES.turbulenceSpill);
        }
      });
    }
  }

  allServiceResolved() {
    for (let r = 1; r <= CABIN_ROWS; r++) {
      for (let s = 0; s < 6; s++) {
        const seat = this.paxMap[r][s];
        if (seat.occ && !seat.served) return false;
      }
    }
    return true;
  }

  updateHudMeta() {
    const routeEl = document.getElementById("hud-route");
    if (routeEl) routeEl.textContent = this.route.label;
    const armed = document.getElementById("hud-armed");
    if (armed) {
      armed.textContent = "DOORS TO ARMED";
      armed.style.color = "#ff4444";
    }
  }

  updateTimerHud() {
    const mm = String(Math.floor(this.remainingSec / 60)).padStart(2, "0");
    const ss = String(this.remainingSec % 60).padStart(2, "0");
    const el = document.getElementById("hud-timer");
    if (el) el.textContent = `${mm}:${ss}`;
  }

  updateScore(delta) {
    this.score += delta;
    const el = document.getElementById("hud-score");
    if (el) el.textContent = `SCORE: ${this.score}`;
  }

  updateHintBar() {
    const el = document.getElementById("hint-bar");
    if (!el) return;
    if (this.phase === "idle") {
      el.textContent = "SPACEBAR — Begin service";
    } else if (this.phase === "service" && this.promptState !== "service") {
      el.textContent = "A / D — Face seats | ← → — Select | SPACEBAR — Serve | SHIFT — Skip";
    } else if (this.phase === "service" && this.promptState === "service") {
      const meal =
        this.routeKey === "KUL" ? ""
        : this.routeKey === "BKK" ? " | 4 Pad Thai | 5 Chicken Rice"
        : " | 4 Yakisoba | 5 Fish w/ Potatoes";
      el.textContent = `1 OJ | 2 Water | 3 Wine${meal}`;
    } else if (this.phase === "collection") {
      el.textContent = "A / D — Face seats | ← → — Select | SPACEBAR — Interact | C — Collect | SHIFT — Skip";
    } else if (this.phase === "callbutton") {
      el.textContent = "F — Fetch from galley | G — Serve | R or SHIFT — Reset call button | ESC — Cancel";
    } else if (this.phase === "landing") {
      el.textContent = "Cabin checked and ready for landing...";
    } else if (this.phase === "landed") {
      // -----------------------------------------------------------------------
      // FIX — Issue 2: Congratulations message shown on the win screen.
      // -----------------------------------------------------------------------
      el.textContent = "Congratulations on a safe landing!";
    }
  }

  syncCrewPosition() {
    this.crewSprite.setPosition(
      tx(TC.aisle) + TILE / 2,
      ty(this.playerRow) + TILE / 2,
    );
    if (this.phase === "service" && this.trolley) {
      this.trolley.setPosition(
        tx(TC.aisle) + TILE / 2,
        ty(this.playerRow - 1) + TILE / 2 + 4,
      );
    }
  }

  setAisleTint(active) {
    this.aisleTint.clear();
    if (!active) return;
    this.aisleTint.fillStyle(0xd4a96a, 0.35);
    for (let r = 0; r < CABIN_ROWS; r++) {
      this.aisleTint.fillRect(tx(TC.aisle), ty(TR.cabin + r), TILE, TILE);
    }
  }

  fadeOutAllPassengerBubbles() {
    const keys = Object.keys(this.bubbleByKey);
    for (let i = 0; i < keys.length; i++) {
      const spr = this.bubbleByKey[keys[i]];
      if (spr) spr.destroy();
      delete this.bubbleByKey[keys[i]];
    }
  }

  syncPassengerBubbles() {
    if (this.phase !== "service") return;
    const desired = new Set();
    const d0 = this.bubbleWindowStartDisplay;
    const rows = [9 - d0, 9 - (d0 + 1)].filter((r) => r >= 1 && r <= CABIN_ROWS);
    for (let i = 0; i < rows.length; i++) {
      const rowNum = rows[i];
      for (let seatIdx = 0; seatIdx < 6; seatIdx++) {
        const seat = this.paxMap[rowNum][seatIdx];
        if (seat.occ && !seat.served && seat.state) desired.add(`${rowNum}-${seatIdx}`);
      }
    }
    const keys = Object.keys(this.bubbleByKey);
    for (let i = 0; i < keys.length; i++) {
      if (!desired.has(keys[i])) {
        this.bubbleByKey[keys[i]].destroy();
        delete this.bubbleByKey[keys[i]];
      }
    }
    if (this.selectedServiceTarget && !desired.has(this.selectedServiceTarget)) {
      this.selectedServiceTarget = null;
    }
    desired.forEach((key) => {
      if (this.bubbleByKey[key]) return;
      const [rowText, seatText] = key.split("-");
      const rowNum = Number(rowText);
      const seatIdx = Number(seatText);
      const seat = this.paxMap[rowNum][seatIdx];
      const col = this.seatColForSeatIndex(seatIdx);
      const tex = `bubble_${seat.state.split("+")[0]}`;
      const img = this.add
        .image(tx(col) + TILE / 2, ty(TR.cabin + rowNum - 1) + 4, tex)
        .setOrigin(0.5, 1)
        .setDepth(100);
      this.bubbleByKey[key] = img;
    });
    const allKeys = Object.keys(this.bubbleByKey);
    for (let i = 0; i < allKeys.length; i++) {
      const key = allKeys[i];
      const bubble = this.bubbleByKey[key];
      if (!bubble) continue;
      const active = key === this.selectedServiceTarget;
      bubble.setScale(active ? 1.12 : 1);
      bubble.setTint(active ? 0xd6ffad : 0xffffff);
    }
  }

  drawAisle() {
    for (let r = 0; r < CABIN_ROWS; r++) {
      this.add.image(tx(TC.aisle) + TILE / 2, ty(TR.cabin + r) + TILE / 2, "aisle_tile");
    }
  }

  drawFuselage() {
    for (let r = 0; r < GRID_ROWS; r++) {
      this.add.image(tx(TC.fuseLeft) + TILE / 2, ty(r) + TILE / 2, "fuse_wall");
      this.add.image(tx(TC.fuseRight) + TILE / 2, ty(r) + TILE / 2, "fuse_wall");
    }
    for (let c = 0; c < GRID_COLS; c++) {
      this.add.image(tx(c) + TILE / 2, ty(TR.fuseTop) + TILE / 2, "fuse_wall");
      this.add.image(tx(c) + TILE / 2, ty(TR.fuseBot) + TILE / 2, "fuse_wall").setFlipY(true);
    }
    for (let r = 0; r < CABIN_ROWS; r++) {
      const tileRow = TR.cabin + r;
      const py = ty(tileRow) + TILE / 2;
      this.add.image(tx(TC.fuseLeft) + TILE / 2, py, "porthole");
      this.add.image(tx(TC.fuseRight) + TILE / 2, py, "porthole");
    }
  }

  drawCabin() {
    const seatBg = this.add.graphics();
    seatBg.fillStyle(0x03165c, 1);
    const seatCols = [...SEAT_COLS_LEFT, ...SEAT_COLS_RIGHT];
    for (let r = 0; r < CABIN_ROWS; r++) {
      const tileRow = TR.cabin + r;
      const rowNum = r + 1;
      seatCols.forEach((col, seatIdx) => {
        const cx = tx(col) + TILE / 2;
        const cy = ty(tileRow) + TILE / 2;
        const seat = this.paxMap[rowNum][seatIdx];
        seatBg.fillRect(tx(col) + 2, ty(tileRow) + 2, TILE - 4, TILE - 4);
        if (seat.occ) {
          const usesAtlas =
            this.textures.exists("passengers") &&
            this.textures.get("passengers").has(seat.spriteFrame);
          if (usesAtlas) {
            this.add
              .image(cx, cy, "passengers", seat.spriteFrame)
              .setDisplaySize(TILE - 16, TILE - 16);
          } else {
            this.add.image(cx, cy, "pax-intern-a").setDisplaySize(TILE - 16, TILE - 16);
          }
        }
      });
    }
  }

  drawCockpit() {
    for (let c = TC.seatA; c <= TC.seatF; c++) {
      this.add.image(tx(c) + TILE / 2, ty(TR.cockpit) + TILE / 2, "cockpit_fill");
    }
    const g = this.add.graphics();
    const x0 = tx(TC.seatA);
    const y0 = ty(TR.cockpit);
    const w = (TC.seatF - TC.seatA + 1) * TILE;
    const h = TILE;
    g.lineStyle(2, 0x2a4068, 1);
    g.strokeRect(x0 + 2, y0 + 2, w - 4, h - 4);
    g.fillStyle(0x1b2a4a);
    g.fillRect(x0 + 5, y0 + 5, w - 10, h - 10);
    g.lineStyle(1.5, 0x0a1020);
    g.strokeRect(x0 + 7, y0 + 7, w - 14, h - 14);
    g.lineStyle(1.5, 0x0a1020);
    g.beginPath();
    g.moveTo(x0 + w / 2, y0 + 9);
    g.lineTo(x0 + w / 2, y0 + h - 9);
    g.strokePath();
    g.fillStyle(0x3a5080);
    g.fillRect(x0 + w - 15, y0 + h / 2 - 5, 6, 10);
    const doorCx = x0 + w / 2;
    const doorCy = y0 + h / 2;
    this.add.image(doorCx - 26, doorCy, "porthole").setScale(1);
    this.add.image(doorCx + 26, doorCy, "porthole").setScale(1);
    this.add.text(x0 + w / 2, y0 + h / 2 + 1, "COCKPIT", {
      fontFamily: '"Press Start 2P"',
      fontSize: "7px",
      color: "#c8e6ff",
      stroke: "#0a1020",
      strokeThickness: 3,
    }).setOrigin(0.5, 0.5);
  }

  drawGalley() {
    for (let c = TC.seatA; c <= TC.seatF; c++) {
      this.add.image(tx(c) + TILE / 2, ty(TR.galley) + TILE / 2, "galley_fill");
    }
    const g = this.add.graphics();
    const x0 = tx(TC.seatA);
    const y0 = ty(TR.galley);
    const w = (TC.seatF - TC.seatA + 1) * TILE;
    g.fillStyle(0xb8b8b8);
    g.fillRect(x0 + 2, y0 + 2, w - 4, 11);
    g.lineStyle(1, 0x888888, 1);
    g.strokeRect(x0 + 2, y0 + 2, w - 4, 11);
    g.fillStyle(0x999999);
    g.fillRect(x0 + 4, y0 + 16, w - 8, TILE - 20);
    g.fillStyle(0x888888);
    g.fillRect(x0 + 6, y0 + 19, w - 12, 4);
    const lightsY = y0 + 24;
    const step = Math.floor((w - 20) / 6);
    for (let i = 0; i < 6; i++) {
      const lx = x0 + 10 + i * step;
      g.fillStyle(i % 2 === 0 ? 0x00cc44 : 0xffaa00);
      g.fillRect(lx, lightsY, 4, 4);
    }
    this.add.text(x0 + w / 2, y0 + 34, "GALLEY", {
      fontFamily: '"Press Start 2P"',
      fontSize: "7px",
      color: "#1b2a4a",
      stroke: "#e8e8e8",
      strokeThickness: 2,
    }).setOrigin(0.5, 0.5);
  }

  drawCrew() {
    const cx = tx(this.playerCol) + TILE / 2;
    const cy = ty(this.playerRow) + TILE / 2;
    this.crewGender = window.selectedCrew === "male" ? "male" : "female";
    const prefix = this.crewGender === "male" ? "male-crew-" : "female-crew-";
    this.crewTexturePrefix = prefix;
    this.crewDir = "south";
    this.crewSprite = this.add
      .image(cx, cy, `${this.crewTexturePrefix}south`)
      .setOrigin(0.5, 1)
      .setDisplaySize(TILE, TILE * 1.5)
      .setDepth(20);
  }

  setCrewDirection(dir) {
    this.crewDir = dir;
    this.crewSprite.setTexture(`${this.crewTexturePrefix}${dir}`);
  }

  drawLabels() {
    const labelStyle = {
      fontFamily: '"Press Start 2P"',
      fontSize: "5px",
      color: "#888888",
    };
    const rowLabelX = tx(TC.fuseLeft) - 10;
    for (let r = 0; r < CABIN_ROWS; r++) {
      const tileRow = TR.cabin + r;
      const rowLabel = String(CABIN_ROWS - r);
      this.add.text(rowLabelX, ty(tileRow) + TILE / 2, rowLabel, labelStyle).setOrigin(0.5);
    }
    const seatLetters = ["F", "E", "D", "C", "B", "A"];
    const seatCols = [...SEAT_COLS_LEFT, ...SEAT_COLS_RIGHT];
    const seatLabelY = ty(TR.cabin) - 12;
    const seatLetterStyle = {
      fontFamily: '"Press Start 2P"',
      fontSize: "8px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 2,
    };
    seatCols.forEach((col, i) => {
      this.add
        .text(tx(col) + TILE / 2, seatLabelY, seatLetters[i], seatLetterStyle)
        .setOrigin(0.5);
    });
  }
}
