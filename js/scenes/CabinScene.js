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
    this.load.image("bubble_sleeping", "sprites/bubble_sleeping.png");
    this.load.image("bubble_emptycup", "sprites/bubble_emptycup.png");
    this.load.audio("landing_announcement", "audio/landing_announcement.mp3");
    this.load.audio("cabin_ambience", "audio/cabin_ambience.mp3");
    this.load.audio("sfx_correct", "audio/sfx_correct.mp3");
    this.load.audio("sfx_wrong", "audio/sfx_wrong.mp3");
    this.load.audio("sfx_collect", "audio/sfx_collect.mp3");
    this.load.audio("sfx_seatbelt_chime", "audio/sfx_seatbelt_chime.mp3");
    this.load.audio("turbulence", "audio/turbulence.mp3");
    this.load.on("loaderror", (file) => {
      console.warn("Asset failed to load:", file.key);
    });
    this.load.atlas(
      "passengers",
      "sprites/passengers.png",
      "sprites/passengers.json",
    );
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

    // -------------------------------------------------------------------------
    // FIX — Issue 3: Reset all persistent DOM HUD elements on every new game.
    // The #hud-timer "is-warning" CSS class (red/pulsing) is only ever added,
    // never removed — so it carries over into subsequent playthroughs.
    // We also reset the timer label since Phaser scene restarts do not touch
    // DOM elements outside the canvas.
    // -------------------------------------------------------------------------
    const timerEl = document.getElementById("hud-timer");
    if (timerEl) {
      timerEl.classList.remove("is-warning");
      timerEl.textContent = "04:00";
    }
    const scoreEl = document.getElementById("hud-score");
    if (scoreEl) scoreEl.textContent = "SCORE: 0";
    const phaseEl = document.getElementById("hud-phase");
    if (phaseEl) phaseEl.textContent = "PHASE: BOARDING";
    const hintEl = document.getElementById("hint-bar");
    if (hintEl) hintEl.textContent = "SPACEBAR — Begin service";
    const armedEl = document.getElementById("hud-armed");
    if (armedEl) {
      armedEl.textContent = "DOORS TO ARMED";
      armedEl.style.color = "#ff4444";
    }

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
      c: Phaser.Input.Keyboard.KeyCodes.C,
      esc: Phaser.Input.Keyboard.KeyCodes.ESC,
      shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      one: Phaser.Input.Keyboard.KeyCodes.ONE,
      two: Phaser.Input.Keyboard.KeyCodes.TWO,
      three: Phaser.Input.Keyboard.KeyCodes.THREE,
    });

    this.trolley = null;
    this.collectionWrapUpStarted = false;
    this.winSceneScheduled = false;
    this.serviceEntryComplete = true;
    this.setPhase("idle");
    this.updateHudMeta();
    this.updateTimerHud();
    this.updateScore(0);
    this.updateHintBar();

    this.soundAmbience = this.cache.audio.exists("cabin_ambience")
      ? this.sound.add("cabin_ambience", { loop: true, volume: 0.25 })
      : null;
    this.sfxCorrect = this.cache.audio.exists("sfx_correct")
      ? this.sound.add("sfx_correct", { volume: 0.6 })
      : null;
    this.sfxWrong = this.cache.audio.exists("sfx_wrong")
      ? this.sound.add("sfx_wrong", { volume: 0.6 })
      : null;
    this.sfxCollect = this.cache.audio.exists("sfx_collect")
      ? this.sound.add("sfx_collect", { volume: 0.6 })
      : null;
    this.turbulenceSound = this.cache.audio.exists("turbulence")
      ? this.sound.add("turbulence", { volume: 0.55 })
      : null;
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
    if (this.handleMovement()) {
      this.syncPassengerBubbles();
      if (this.phase === "collection") this.syncCollectionBubbles();
    }
    this.handleFacingAndSelection();
    this.handleInteractionKeys();
  }

  handleMovement() {
    if (this.phase === "landing") return false;
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
      if (this.phase === "service" || this.phase === "collection") {
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
      } else if (this.phase === "collection") {
        this.selectedSeatIdx = null;
        this.promptState = null;
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
      if (this.phase === "collection") this.syncCollectionBubbles();
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
      if (this.phase === "collection") this.syncCollectionBubbles();
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
      if (this.phase === "collection") this.syncCollectionBubbles();
      return;
    }
    if (this.phase === "idle" && Phaser.Input.Keyboard.JustDown(k.space)) {
      this.startServicePhase();
      return;
    }
    if (this.phase === "service") {
      this.handleServiceInputs();
      return;
    }
    if (this.phase === "collection") {
      this.handleCollectionInputs();
      return;
    }
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

    const keyToItem = { 1: "oj", 2: "water", 3: "wine" };
    const pressed = this.getPressedServiceKey();
    if (!pressed) return;
    const chosen = keyToItem[pressed];
    if (!chosen) return;

    if (seat.state === "sleeping") {
      this.updateScore(SERVICE_POINTS.sleepingWake);
      this.promptState = null;
      this.updateHintBar();
      return;
    }

    if (seat.state === chosen) {
      if (this.sfxCorrect) {
        this.sfxCorrect.stop();
        this.sfxCorrect.play();
      }
      this.updateScore(SERVICE_POINTS.drink);
      seat.served = true;
      seat.hasCup = true;
      this.promptState = null;
      this.updateAfterServiceResolution();
    } else {
      if (this.sfxWrong) {
        this.sfxWrong.stop();
        this.sfxWrong.play();
      }
      this.updateScore(SERVICE_POINTS.wrongItem);
      this.promptState = null;
      this.updateHintBar();
    }
  }

  handleCollectionInputs() {
    const k = this.keyMap;

    if (Phaser.Input.Keyboard.JustDown(k.space)) {
      const seat = this.getSelectedSeat();
      if (!seat) return;
      const isCollectable = seat.hasCup && !seat.cupCollected;
      const isSleeping = seat.state === "sleeping" && !seat.cupCollected;
      if (!isCollectable && !isSleeping) return;
      this.promptState = "collection";
      this.updateHintBar();
      return;
    }

    if (this.promptState !== "collection") return;

    const seat = this.getSelectedSeat();
    if (!seat) return;

    if (Phaser.Input.Keyboard.JustDown(k.c)) {
      if (seat.state === "sleeping") {
        this.updateScore(-10);
        this.promptState = null;
        this.updateHintBar();
        return;
      }
      if (seat.hasCup && !seat.cupCollected) {
        if (this.sfxCollect) {
          this.sfxCollect.stop();
          this.sfxCollect.play();
        }
        seat.cupCollected = true;
        this.updateScore(SCORE_RULES.collectionGood);
        this.promptState = null;
        this.updateHintBar();
        this.syncCollectionBubbles();
        this.tryCompleteCollectionEarly();
      }
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(k.shift)) {
      seat.cupCollected = true;
      this.promptState = null;
      this.updateHintBar();
      this.syncCollectionBubbles();
      this.tryCompleteCollectionEarly();
    }
  }

  getPressedServiceKey() {
    const k = this.keyMap;
    if (Phaser.Input.Keyboard.JustDown(k.one)) return 1;
    if (Phaser.Input.Keyboard.JustDown(k.two)) return 2;
    if (Phaser.Input.Keyboard.JustDown(k.three)) return 3;
    return null;
  }

  getCurrentRowNum() {
    return this.playerRow - TR.cabin + 1;
  }

  seatColForSeatIndex(seatIdx) {
    return [...SEAT_COLS_LEFT, ...SEAT_COLS_RIGHT][seatIdx];
  }

  getSelectableSeatIndices() {
    if (this.phase === "service") return this.getSelectableServiceTargets();
    const rowNum = this.getCurrentRowNum();
    if (rowNum < 1 || rowNum > CABIN_ROWS) return [];
    if (this.phase === "collection") {
      const arr = this.facing === "east" ? [3, 4, 5] : [0, 1, 2];
      const seen = new Set();
      const result = [];
      for (let i = 0; i < arr.length; i++) {
        const idx = arr[i];
        if (seen.has(idx)) continue;
        const seat = this.paxMap[rowNum][idx];
        if (!seat.occ) continue;
        if (
          (seat.hasCup && !seat.cupCollected) ||
          (seat.state === "sleeping" && !seat.cupCollected)
        ) {
          result.push(idx);
          seen.add(idx);
        }
      }
      return result;
    }
    return [];
  }

  moveSeatSelection(delta) {
    const seats = this.getSelectableSeatIndices();
    if (!seats.length) {
      if (this.phase === "service") this.selectedServiceTarget = null;
      else {
        this.selectedSeatIdx = null;
        if (this.phase === "collection") this.syncCollectionBubbles();
      }
      return;
    }
    const current =
      this.phase === "service"
        ? this.selectedServiceTarget
        : this.selectedSeatIdx;
    let i = seats.indexOf(current);
    if (i < 0) i = 0;
    i = Phaser.Math.Wrap(i + delta, 0, seats.length);
    if (this.phase === "service") {
      this.selectedServiceTarget = seats[i];
      this.syncPassengerBubbles();
    } else {
      this.selectedSeatIdx = seats[i];
      if (this.phase === "collection") this.syncCollectionBubbles();
    }
  }

  getSelectedSeat() {
    if (this.phase === "service") {
      if (!this.selectedServiceTarget) return null;
      const [rowText, seatText] = this.selectedServiceTarget.split("-");
      const rowNum = Number(rowText);
      const seatIdx = Number(seatText);
      if (rowNum < 1 || rowNum > CABIN_ROWS || seatIdx < 0 || seatIdx > 5)
        return null;
      return this.paxMap[rowNum][seatIdx];
    }
    const rowNum = this.getCurrentRowNum();
    if (rowNum < 1 || rowNum > CABIN_ROWS || this.selectedSeatIdx == null)
      return null;
    return this.paxMap[rowNum][this.selectedSeatIdx];
  }

  updateAfterServiceResolution() {
    this.checkBubbleWindowAdvance();
    const liveTargets = this.getSelectableServiceTargets();
    if (!liveTargets.includes(this.selectedServiceTarget))
      this.selectedServiceTarget = null;
    this.syncPassengerBubbles();
    this.updateHintBar();

    if (this.allServiceResolved() && this.phase === "service") {
      const bonus = Math.max(0, this.remainingSec - 100);
      if (bonus > 0) this.updateScore(bonus);
      this.remainingSec = 100;
      this.updateTimerHud();
      this.showServicePopup();
      this.enterCollectionPhase();
    }
  }

  getSelectableServiceTargets() {
    const rowNum = this.getCurrentRowNum();
    if (rowNum < 1 || rowNum > CABIN_ROWS) return [];
    const side = this.facing === "west" ? [0, 1, 2] : [3, 4, 5];
    const targets = [];
    for (let s = 0; s < side.length; s++) {
      const seatIdx = side[s];
      const seat = this.paxMap[rowNum][seatIdx];
      if (seat.occ && !seat.served && seat.state)
        targets.push(`${rowNum}-${seatIdx}`);
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
    const labels = {
      idle: "BOARDING",
      service: "SERVICE",
      collection: "COLLECTION",
      landing: "LANDING",
    };
    const el = document.getElementById("hud-phase");
    if (el) el.textContent = `PHASE: ${labels[phase] || phase.toUpperCase()}`;
    if (phase === "service") this.setAisleTint(true);
    if (phase === "landing") {
      this.setAisleTint(false);
      if (this.soundAmbience && this.soundAmbience.isPlaying) {
        this.soundAmbience.stop();
      }
    }
    if (phase !== "service") {
      this.fadeOutAllPassengerBubbles();
      this.serviceSideChosen = false;
      this.selectedServiceTarget = null;
    }
    this.updateHintBar();
  }

  stopGamestartMusic() {
    const s = this.registry.get("gamestartSound");
    if (s) {
      s.stop();
      s.destroy();
      this.registry.remove("gamestartSound");
    }
  }

  startServicePhase() {
    this.stopGamestartMusic();
    if (!this.trolley) {
      this.trolley = this.add
        .image(tx(TC.aisle) + TILE / 2, ty(TR.galley) + TILE / 2 + 4, "trolley")
        .setDepth(10);
    }
    this.setPhase("service");
    if (this.soundAmbience && !this.soundAmbience.isPlaying) {
      this.soundAmbience.play();
    }
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
        if (this.remainingSec <= 0) return;
        this.remainingSec -= 1;
        this.updateTimerHud();
        this.checkPhaseCheckpoints();
      },
    });
  }

  checkPhaseCheckpoints() {
    if (this.remainingSec <= 60) {
      const timerEl = document.getElementById("hud-timer");
      if (timerEl) timerEl.classList.add("is-warning");
    }
    if (this.remainingSec === 100 && this.phase === "service") {
      this.showServicePopup();
      this.enterCollectionPhase();
    }
    if (
      this.remainingSec === 30 &&
      this.phase === "collection" &&
      !this.collectionWrapUpStarted
    ) {
      this.finishCollectionPhase();
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
    this.collectionWrapUpStarted = false;
    this.selectedSeatIdx = null;
    this.promptState = null;
    if (this.trolley)
      this.trolley.setPosition(
        tx(TC.aisle) + TILE / 2,
        ty(TR.galley) + TILE / 2 + 4,
      );
    this.setPhase("collection");
    this.syncCollectionBubbles();
  }

  allCollectionResolved() {
    for (let r = 1; r <= CABIN_ROWS; r++) {
      for (let s = 0; s < 6; s++) {
        const seat = this.paxMap[r][s];
        if (!seat.occ) continue;
        if (seat.hasCup && !seat.cupCollected) return false;
        if (seat.state === "sleeping" && !seat.cupCollected) return false;
      }
    }
    return true;
  }

  tryCompleteCollectionEarly() {
    if (this.phase !== "collection" || this.collectionWrapUpStarted) return;
    if (this.allCollectionResolved()) this.finishCollectionPhase();
  }

  finishCollectionPhase() {
    if (this.phase !== "collection" || this.collectionWrapUpStarted) return;
    this.collectionWrapUpStarted = true;

    const allCupsDone = this.allCollectionResolved();

    const bonus = Math.max(0, this.remainingSec - 30);
    if (bonus > 0) this.updateScore(bonus);

    for (let r = 1; r <= CABIN_ROWS; r++) {
      for (let s = 0; s < 6; s++) {
        const seat = this.paxMap[r][s];
        if (seat.hasCup && !seat.cupCollected && seat.state !== "sleeping") {
          this.updateScore(SCORE_RULES.collectionMiss);
        }
      }
    }

    const txt = allCupsDone
      ? "Great! All cups collected. Time to prepare for landing."
      : "Need to be quicker next time. Time to prepare for landing.";
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
      this.startLandingSequence();
    });
  }

  goToWinSceneAfterLanding(delayMs = 0) {
    if (this.winSceneScheduled) return;
    this.winSceneScheduled = true;
    this.time.delayedCall(delayMs, () => {
      if (this.scene.isActive("CabinScene")) {
        this.scene.start("WinScene", { score: this.score });
      }
    });
  }

  runLandingPatrol() {
    const moveMs = 380;
    const lookMs = 420;
    const returnMoveMs = 520;
    const aisleX = tx(TC.aisle) + TILE / 2;
    this.crewSprite.setAlpha(1);
    this.playerRow = TR.cabin;
    this.crewSprite.setPosition(aisleX, ty(this.playerRow) + TILE);
    this.setCrewDirection("north");

    const fadeCrewOut = () => {
      this.tweens.add({
        targets: this.crewSprite,
        alpha: 0,
        duration: 1400,
        ease: "Sine.easeIn",
      });
    };

    const runReturn = (rowNum) => {
      if (rowNum < 1) {
        fadeCrewOut();
        return;
      }
      this.setCrewDirection("north");
      this.playerRow = TR.cabin + rowNum - 1;
      const targetY = ty(this.playerRow) + TILE;
      this.tweens.add({
        targets: this.crewSprite,
        y: targetY,
        duration: returnMoveMs,
        ease: "Sine.easeInOut",
        onComplete: () => {
          runReturn(rowNum - 1);
        },
      });
    };

    const runRow = (rowNum) => {
      if (rowNum > CABIN_ROWS) {
        runReturn(CABIN_ROWS - 1);
        return;
      }
      this.playerRow = TR.cabin + rowNum - 1;
      const targetY = ty(this.playerRow) + TILE;
      this.tweens.add({
        targets: this.crewSprite,
        y: targetY,
        duration: moveMs,
        ease: "Sine.easeInOut",
        onComplete: () => {
          this.setCrewDirection("west");
          this.time.delayedCall(lookMs, () => {
            this.setCrewDirection("east");
            this.time.delayedCall(lookMs, () => {
              runRow(rowNum + 1);
            });
          });
        },
      });
    };

    runRow(1);
  }

  startLandingSequence() {
    this.winSceneScheduled = false;
    this.serviceEntryComplete = false;
    this.setPhase("landing");
    if (this.trolley) {
      this.trolley.setVisible(false);
    }
    this.cameras.main.shake(1000, 0.004);

    this.runLandingPatrol();

    const playSeatbeltChimeThenWin = () => {
      if (!this.cache.audio.exists("sfx_seatbelt_chime")) {
        this.goToWinSceneAfterLanding(1000);
        return;
      }
      const chime = this.sound.add("sfx_seatbelt_chime", { volume: 0.6 });
      chime.once("complete", () => {
        // Win scene should begin 1s after seatbelt chime ends.
        this.goToWinSceneAfterLanding(1000);
      });
      chime.play();
    };

    if (this.cache.audio.exists("landing_announcement")) {
      const announcement = this.sound.add("landing_announcement", {
        volume: 0.6,
      });
      announcement.play();
      announcement.once("complete", () => {
        playSeatbeltChimeThenWin();
      });
    } else {
      playSeatbeltChimeThenWin();
    }

    this.time.delayedCall(25000, () => {
      if (this.scene.isActive("CabinScene")) {
        this.goToWinSceneAfterLanding(0);
      }
    });
  }

  scheduleTurbulence() {
    const t = this.route.turbulence && this.route.turbulence[0];
    if (!t) return;
    this.time.delayedCall(t.elapsedSec * 1000, () => {
      if (this.phase !== "service") return;
      this.cameras.main.shake(t.durationSec * 1000, 0.005);
      if (this.turbulenceSound) {
        this.turbulenceSound.stop();
        this.turbulenceSound.play();
        this.time.delayedCall(t.durationSec * 1000, () => {
          if (this.turbulenceSound && this.turbulenceSound.isPlaying) {
            this.turbulenceSound.stop();
          }
        });
      }
      const txt = this.add
        .text(CW / 2, CH / 2 - 40, "WE HIT TURBULENCE\n(not the song)", {
          fontFamily: '"Press Start 2P"',
          fontSize: "11px",
          color: "#ffff44",
          backgroundColor: "#1b2a4a",
          padding: { x: 14, y: 10 },
          align: "center",
        })
        .setOrigin(0.5)
        .setDepth(200);
      const flashTween = this.tweens.add({
        targets: txt,
        alpha: { from: 1, to: 0 },
        duration: 400,
        yoyo: true,
        repeat: -1,
      });
      this.time.delayedCall(t.durationSec * 1000, () => {
        flashTween.stop();
        txt.destroy();
      });
    });
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
      el.textContent =
        "A / D — Face seats | ← → — Select | SPACEBAR — Serve | SHIFT — Skip";
    } else if (this.phase === "service" && this.promptState === "service") {
      el.textContent = "1 OJ  |  2 WATER  |  3 WINE  |  ESC CANCEL";
    } else if (
      this.phase === "collection" &&
      this.promptState === "collection"
    ) {
      el.textContent = "C — Collect  |  SHIFT — Skip  |  ESC — Cancel";
    } else if (this.phase === "collection") {
      el.textContent =
        "A / D — Face seats | ← → — Select | SPACEBAR — Interact | C — Collect | SHIFT — Skip";
    } else if (this.phase === "landing") {
      el.textContent = "Cabin checked and ready for landing...";
    }
  }

  syncCrewPosition() {
    this.crewSprite.setPosition(
      tx(TC.aisle) + TILE / 2,
      ty(this.playerRow) + TILE,
    );
    if (
      (this.phase === "service" || this.phase === "collection") &&
      this.trolley
    ) {
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
    const bubbleSize = Math.round(TILE * 0.82);
    const bubbleSizeActive = Math.round(TILE * 0.9);
    const desired = new Set();
    const d0 = this.bubbleWindowStartDisplay;
    const rows = [9 - d0, 9 - (d0 + 1)].filter(
      (r) => r >= 1 && r <= CABIN_ROWS,
    );
    for (let i = 0; i < rows.length; i++) {
      const rowNum = rows[i];
      for (let seatIdx = 0; seatIdx < 6; seatIdx++) {
        const seat = this.paxMap[rowNum][seatIdx];
        if (seat.occ && !seat.served && seat.state)
          desired.add(`${rowNum}-${seatIdx}`);
      }
    }
    const keys = Object.keys(this.bubbleByKey);
    for (let i = 0; i < keys.length; i++) {
      if (!desired.has(keys[i])) {
        this.bubbleByKey[keys[i]].destroy();
        delete this.bubbleByKey[keys[i]];
      }
    }
    if (
      this.selectedServiceTarget &&
      !desired.has(this.selectedServiceTarget)
    ) {
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
        .image(tx(col) + TILE / 2, ty(TR.cabin + rowNum - 1) + 3, tex)
        .setOrigin(0.5, 1)
        .setDisplaySize(bubbleSize, bubbleSize)
        .setDepth(100);
      this.bubbleByKey[key] = img;
    });
    const allKeys = Object.keys(this.bubbleByKey);
    for (let i = 0; i < allKeys.length; i++) {
      const key = allKeys[i];
      const bubble = this.bubbleByKey[key];
      if (!bubble) continue;
      const active = key === this.selectedServiceTarget;
      bubble.setDisplaySize(
        active ? bubbleSizeActive : bubbleSize,
        active ? bubbleSizeActive : bubbleSize,
      );
      bubble.setTint(active ? 0xd6ffad : 0xffffff);
    }
  }

  syncCollectionBubbles() {
    if (this.phase !== "collection") return;
    const bubbleSize = Math.round(TILE * 0.82);
    const bubbleSizeActive = Math.round(TILE * 0.9);

    const desired = new Set();
    for (let rowNum = 1; rowNum <= CABIN_ROWS; rowNum++) {
      for (let seatIdx = 0; seatIdx < 6; seatIdx++) {
        const seat = this.paxMap[rowNum][seatIdx];
        if (!seat.occ) continue;
        if (seat.hasCup && !seat.cupCollected)
          desired.add(`${rowNum}-${seatIdx}`);
        else if (seat.state === "sleeping" && !seat.cupCollected)
          desired.add(`${rowNum}-${seatIdx}`);
      }
    }

    const keys = Object.keys(this.bubbleByKey);
    for (let i = 0; i < keys.length; i++) {
      if (!desired.has(keys[i])) {
        this.bubbleByKey[keys[i]].destroy();
        delete this.bubbleByKey[keys[i]];
      }
    }

    desired.forEach((key) => {
      if (this.bubbleByKey[key]) return;
      const [rowText, seatText] = key.split("-");
      const rowNum = Number(rowText);
      const seatIdx = Number(seatText);
      const seat = this.paxMap[rowNum][seatIdx];
      const col = this.seatColForSeatIndex(seatIdx);
      const tex =
        seat.state === "sleeping" ? "bubble_sleeping" : "bubble_emptycup";
      const img = this.add
        .image(tx(col) + TILE / 2, ty(TR.cabin + rowNum - 1) + 3, tex)
        .setOrigin(0.5, 1)
        .setDisplaySize(bubbleSize, bubbleSize)
        .setDepth(100);
      this.bubbleByKey[key] = img;
    });

    const activeKey =
      this.selectedSeatIdx !== null
        ? `${this.getCurrentRowNum()}-${this.selectedSeatIdx}`
        : null;
    const allKeys = Object.keys(this.bubbleByKey);
    for (let i = 0; i < allKeys.length; i++) {
      const key = allKeys[i];
      const bubble = this.bubbleByKey[key];
      if (!bubble) continue;
      const isActive = key === activeKey;
      bubble.setDisplaySize(
        isActive ? bubbleSizeActive : bubbleSize,
        isActive ? bubbleSizeActive : bubbleSize,
      );
      bubble.setTint(isActive ? 0xd6ffad : 0xffffff);
    }
  }

  drawAisle() {
    for (let r = 0; r < CABIN_ROWS; r++) {
      this.add.image(
        tx(TC.aisle) + TILE / 2,
        ty(TR.cabin + r) + TILE / 2,
        "aisle_tile",
      );
    }
  }

  drawFuselage() {
    for (let r = 0; r < GRID_ROWS; r++) {
      this.add.image(tx(TC.fuseLeft) + TILE / 2, ty(r) + TILE / 2, "fuse_wall");
      this.add.image(
        tx(TC.fuseRight) + TILE / 2,
        ty(r) + TILE / 2,
        "fuse_wall",
      );
    }
    for (let c = 0; c < GRID_COLS; c++) {
      this.add.image(tx(c) + TILE / 2, ty(TR.fuseTop) + TILE / 2, "fuse_wall");
      this.add
        .image(tx(c) + TILE / 2, ty(TR.fuseBot) + TILE / 2, "fuse_wall")
        .setFlipY(true);
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
              .setDisplaySize(TILE - 20, TILE - 20);
          } else {
            this.add
              .image(cx, cy, "pax-intern-a")
              .setDisplaySize(TILE - 20, TILE - 20);
          }
        }
      });
    }
  }

  drawCockpit() {
    for (let c = TC.seatA; c <= TC.seatF; c++) {
      this.add.image(
        tx(c) + TILE / 2,
        ty(TR.cockpit) + TILE / 2,
        "cockpit_fill",
      );
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

  drawCrew() {
    const cx = tx(this.playerCol) + TILE / 2;
    const cy = ty(this.playerRow) + TILE;
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
      this.add
        .text(rowLabelX, ty(tileRow) + TILE / 2, rowLabel, labelStyle)
        .setOrigin(0.5);
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
