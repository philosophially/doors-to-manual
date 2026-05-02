// =============================================================================
// PHASER SCENE — Instructions (after crew select, before cabin)
// =============================================================================
class InstructionsScene extends Phaser.Scene {
  constructor() {
    super({ key: "InstructionsScene" });
  }

  create() {
    const font = '"Press Start 2P"';
    const navy = 0x1b2a4a;
    const white = "#FFFFFF";
    const green = "#00FF7F";
    const yellow = "#FFD95A";
    window.selectedRoute = window.selectedRoute || "KUL";

    this.add.rectangle(CW / 2, CH / 2, CW, CH, 0x000000);

    this.add
      .text(CW / 2, 86, "DOORS TO MANUAL", {
        fontFamily: font,
        fontSize: "20px",
        color: green,
      })
      .setOrigin(0.5);

    this.add
      .text(CW / 2, 118, "SELECT ROUTE", {
        fontFamily: font,
        fontSize: "12px",
        color: white,
      })
      .setOrigin(0.5);

    const routeDefs = [
      { key: "KUL", top: "SIN → KUL", bottom: "EASY" },
      { key: "BKK", top: "SIN → BKK", bottom: "MEDIUM" },
      { key: "NRT", top: "SIN → NRT", bottom: "HARD" },
    ];
    const cards = [];
    const cardW = 136;
    const cardH = 78;
    const cardGap = 32;
    const startX = CW / 2 - cardW - cardGap / 2;
    const cardY = 138;

    for (let i = 0; i < routeDefs.length; i++) {
      const def = routeDefs[i];
      const isLocked = def.key !== "KUL";
      const x = startX + i * (cardW + cardGap);
      const g = this.add.graphics();
      this.add
        .text(x, cardY + 24, def.top, {
          fontFamily: font,
          fontSize: "10px",
          color: isLocked ? "#666666" : white,
        })
        .setOrigin(0.5);
      this.add
        .text(x, cardY + 56, def.bottom, {
          fontFamily: font,
          fontSize: "10px",
          color: isLocked ? "#555555" : yellow,
        })
        .setOrigin(0.5);
      if (!isLocked) {
        this.add
          .zone(x, cardY + cardH / 2, cardW, cardH)
          .setInteractive({ useHandCursor: true })
          .on("pointerdown", () => {
            window.selectedRoute = def.key;
            drawCards();
          });
      }
      cards.push({ def, g, x, isLocked });
    }

    const drawCards = () => {
      for (let i = 0; i < cards.length; i++) {
        const c = cards[i];
        const active = c.def.key === window.selectedRoute;
        c.g.clear();
        c.g.fillStyle(navy, c.isLocked ? 0.4 : 1);
        c.g.fillRoundedRect(c.x - cardW / 2, cardY, cardW, cardH, 3);
        c.g.lineStyle(
          2,
          active ? 0x00ff7f : c.isLocked ? 0x333333 : 0xffffff,
          1,
        );
        c.g.strokeRoundedRect(c.x - cardW / 2, cardY, cardW, cardH, 3);
      }
    };
    drawCards();

    const drawInfoPanel = (x, title, lines) => {
      const panelW = 220;
      const panelH = 170;
      const y = 250;
      const g = this.add.graphics();
      g.fillStyle(navy, 1);
      g.fillRoundedRect(x - panelW / 2, y, panelW, panelH, 3);
      g.lineStyle(2, 0x2a3f6b, 1);
      g.strokeRoundedRect(x - panelW / 2, y, panelW, panelH, 3);
      this.add
        .text(x - 82, y + 18, title, {
          fontFamily: font,
          fontSize: "10px",
          color: green,
        })
        .setOrigin(0, 0.5);
      for (let i = 0; i < lines.length; i++) {
        this.add
          .text(x - 82, y + 48 + i * 30, lines[i], {
            fontFamily: font,
            fontSize: "9px",
            color: white,
          })
          .setOrigin(0, 0.5);
      }
    };

    drawInfoPanel(CW / 2 - 250, "MOVEMENT", [
      "W / ↑  GALLEY",
      "S / ↓  COCKPIT",
      "A      FACE D/E/F",
      "D      FACE A/B/C",
    ]);
    drawInfoPanel(CW / 2, "INTERACT", [
      "← →  SELECT SEAT",
      "SPACEBAR SERVE",
      "SHIFT SKIP/RESET",
      "ESC CANCEL",
    ]);
    drawInfoPanel(CW / 2 + 250, "SCORING", [
      "+10 DRINK SERVED",
      "+3 CUP COLLECTED",
      "+1/s EARLY FINISH",
      "MISSES COST POINTS",
    ]);

    this.add
      .text(
        CW / 2,
        460,
        "Serve every passenger before descent. Land cleanly and the captain calls it.",
        {
          fontFamily: font,
          fontSize: "8px",
          color: "#D5D8E6",
        },
      )
      .setOrigin(0.5);

    const hint = this.add
      .text(CW / 2, 520, "CLICK TO CONTINUE", {
        fontFamily: font,
        fontSize: "13px",
        color: yellow,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    hint.on("pointerdown", () => {
      this.scene.start("CabinScene");
    });
    this.tweens.add({
      targets: hint,
      alpha: { from: 1, to: 0.35 },
      duration: 300,
      yoyo: true,
      repeat: -1,
    });
  }

  stopGamestartMusic() {
    const s = this.registry.get("gamestartSound");
    if (s) {
      s.stop();
      s.destroy();
      this.registry.remove("gamestartSound");
    }
  }
}
