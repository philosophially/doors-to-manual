class WinScene extends Phaser.Scene {
  constructor() {
    super({ key: "WinScene" });
  }

  create(data) {
    const finalScore = data && typeof data.score === "number" ? data.score : 0;

    this.add.rectangle(CW / 2, CH / 2, CW, CH, 0x000000);
    this.add
      .text(CW / 2, 86, "Ladies and Gentlemen, we have safely landed.", {
        fontFamily: '"Press Start 2P"',
        fontSize: "10px",
        color: "#FFFFFF",
      })
      .setOrigin(0.5);
    this.add
      .text(CW / 2, 132, "DOORS TO MANUAL", {
        fontFamily: '"Press Start 2P"',
        fontSize: "22px",
        color: "#00FF7F",
      })
      .setOrigin(0.5);
    this.add
      .text(CW / 2, 178, `FINAL SCORE: ${finalScore}`, {
        fontFamily: '"Press Start 2P"',
        fontSize: "12px",
        color: "#FFFF44",
      })
      .setOrigin(0.5);

    const playAgainY = 226;
    let didRestart = false;
    const restartToStart = () => {
      if (didRestart || !this.scene.isActive("WinScene")) return;
      didRestart = true;
      this.scene.start("CharacterSelectScene");
    };

    const playAgain = this.add
      .text(CW / 2, playAgainY, "PLAY AGAIN", {
        fontFamily: '"Press Start 2P"',
        fontSize: "12px",
        color: "#00FF7F",
        backgroundColor: "#10251a",
        padding: { x: 14, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    playAgain.on("pointerup", restartToStart);

    const playAgainZone = this.add
      .zone(CW / 2, playAgainY, 260, 64)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    playAgainZone.on("pointerup", restartToStart);

    const exitPortal = this.add
      .text(CW / 2, CH - 100, "🌀 VIBE JAM PORTAL →", {
        fontFamily: '"Press Start 2P"',
        fontSize: "9px",
        color: "#00FF7F",
        backgroundColor: "#0a1a0a",
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    exitPortal.on("pointerdown", () => {
      window.location.href =
        "https://vibejam.cc/portal/2026?ref=doors-to-manual.netlify.app";
    });

    this.tweens.add({
      targets: exitPortal,
      alpha: { from: 1, to: 0.5 },
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard.once("keydown-ENTER", restartToStart);
    this.input.keyboard.once("keydown-SPACE", restartToStart);

    this.cameras.main.fadeIn(900, 0, 0, 0);

    const phaseEl = document.getElementById("hud-phase");
    if (phaseEl) phaseEl.textContent = "PHASE: LANDED";
    const hintEl = document.getElementById("hint-bar");
    if (hintEl) hintEl.textContent = "Welcome to Vibe Jam City.";
    const armed = document.getElementById("hud-armed");
    if (armed) {
      armed.textContent = "DOORS TO MANUAL";
      armed.style.color = "#00FF7F";
    }
  }
}
