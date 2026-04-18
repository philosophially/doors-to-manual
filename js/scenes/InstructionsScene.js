// =============================================================================
// PHASER SCENE — Instructions (after crew select, before cabin)
// =============================================================================
class InstructionsScene extends Phaser.Scene {
  constructor() {
    super({ key: "InstructionsScene" });
  }

  create() {
    const bg = 0xf5f0e8;
    const ink = "#1B2A4A";
    const titleRed = "#FF4444";
    const font = '"Press Start 2P"';
    const wrap = CW - 48;

    this.add.rectangle(CW / 2, CH / 2, CW, CH, bg);

    this.add
      .text(CW / 2, 36, "DOORS TO MANUAL", {
        fontFamily: font,
        fontSize: "18px",
        color: titleRed,
      })
      .setOrigin(0.5);

    let y = 78;
    const gapAfterHeader = 10;
    const gapBetweenSections = 18;
    const bodySize = "8px";
    const headSize = "9px";

    const bodyStyle = {
      fontFamily: font,
      fontSize: bodySize,
      color: ink,
      wordWrap: { width: wrap },
      lineSpacing: 4,
    };

    const addHeader = (label) => {
      const t = this.add
        .text(CW / 2, y, label, {
          fontFamily: font,
          fontSize: headSize,
          color: ink,
        })
        .setOrigin(0.5, 0);
      y += t.height + gapAfterHeader;
    };

    const addBody = (lines) => {
      const block = lines.join("\n");
      const t = this.add.text(24, y, block, bodyStyle).setOrigin(0, 0);
      y += t.height + gapBetweenSections;
    };

    addHeader("MOVEMENT");
    addBody([
      "Arrow Up / Down — move along aisle",
      "W / A / S / D — rotate crew in place",
      "  (W: face up, A: left, S: down, D: right)",
    ]);

    addHeader("INTERACTION");
    addBody([
      "ENTER — activate bubble / confirm selection",
      "SHIFT — skip sleeping or no-thanks passenger safely",
      "Arrow Left / Right — toggle between bubbles on the same side",
      "1 / 2 / 3 — select drink (1: OJ, 2: Water, 3: Wine)",
    ]);

    addHeader("SCORING HINTS");
    addBody([
      "Correct drink → +10",
      "Wrong drink → -10",
      "Wake sleeping passenger → -15",
      "Serve no-thanks passenger → -10",
      "Correct skip → no penalty",
    ]);

    const startY = Math.min(y + 12, CH - 52);
    const start = this.add
      .text(CW / 2, startY, "START", {
        fontFamily: font,
        fontSize: "14px",
        color: ink,
        backgroundColor: "#e8e0d4",
        padding: { x: 18, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    start.on("pointerover", () => start.setStyle({ backgroundColor: "#d8d0c8" }));
    start.on("pointerout", () => start.setStyle({ backgroundColor: "#e8e0d4" }));
    start.on("pointerdown", () => {
      this.scene.start("CabinScene");
    });

    const hint = this.add
      .text(CW / 2, startY + 34, "CLICK TO CONTINUE", {
        fontFamily: font,
        fontSize: "10px",
        color: "#5a6a85",
        stroke: "#e0dcd4",
        strokeThickness: 2,
      })
      .setOrigin(0.5, 0);
    this.tweens.add({
      targets: hint,
      alpha: { from: 1, to: 0.35 },
      duration: 300,
      yoyo: true,
      repeat: -1,
    });
  }
}
