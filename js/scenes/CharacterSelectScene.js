// =============================================================================
// PHASER SCENE — CharacterSelectScene (crew gender before cabin)
// =============================================================================
class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: "CharacterSelectScene" });
  }

  preload() {
    // Only the south-facing previews needed for this screen; cabin loads the rest.
    this.load.image(
      "female-crew-south",
      "sprites/female-crew-south.png",
    );
    this.load.image("male-crew-south", "sprites/male-crew-south.png");
  }

  create() {
    this.add.rectangle(CW / 2, CH / 2, CW, CH, 0x000000);

    // Shared vertical rhythm: same gap above boxes (under subtitle) and below labels (above hint)
    const rowGap = 20;

    // Title block — positions scale with canvas height (CH matches cabin scene)
    const title1Y = Math.round(CH * 0.14);
    const title2Y = title1Y + 44;
    this.add
      .text(CW / 2, title1Y, "DOORS TO MANUAL", {
        fontFamily: '"Press Start 2P"',
        fontSize: "20px",
        color: "#00FF7F",
      })
      .setOrigin(0.5);
    this.add
      .text(CW / 2, title2Y, "SELECT YOUR CREW", {
        fontFamily: '"Press Start 2P"',
        fontSize: "13px",
        color: "#FFFFFF",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    // Subtitle uses default origin (0.5, 0.5): bottom edge ≈ centre + half line height
    const subtitleLineHalf = 14;
    const subtitleBottom = title2Y + subtitleLineHalf;

    // Option layout: larger boxes + crew previews for the taller portrait canvas
    const boxW = 108;
    const boxH = 152;
    const gap = 96;
    const totalW = boxW + gap + boxW;
    const leftCx = CW / 2 - totalW / 2 + boxW / 2;
    const rightCx = CW / 2 + totalW / 2 - boxW / 2;
    const boxTopY = subtitleBottom + rowGap * 2;
    const crewPreviewSize = Math.min(96, boxH - 28);

    let selected = "female"; // default highlight (matches green border)

    const drawBox = (g, x, y, highlighted) => {
      g.clear();
      const r = 6;
      g.fillStyle(0x0f1a2e, 1);
      g.fillRoundedRect(x - boxW / 2, y, boxW, boxH, r);
      g.lineStyle(
        2,
        highlighted ? 0x00ff7f : 0x1b2a4a,
        1,
      );
      g.strokeRoundedRect(x - boxW / 2, y, boxW, boxH, r);
    };

    const leftG = this.add.graphics();
    const rightG = this.add.graphics();

    const refreshBorders = () => {
      drawBox(leftG, leftCx, boxTopY, selected === "female");
      drawBox(rightG, rightCx, boxTopY, selected === "male");
    };
    refreshBorders();

    const leftSprite = this.add
      .image(leftCx, boxTopY + boxH / 2, "female-crew-south")
      .setDisplaySize(crewPreviewSize, crewPreviewSize);
    const rightSprite = this.add
      .image(rightCx, boxTopY + boxH / 2, "male-crew-south")
      .setDisplaySize(crewPreviewSize, crewPreviewSize);

    this.add
      .text(leftCx, boxTopY + boxH + 12, "FEMALE", {
        fontFamily: '"Press Start 2P"',
        fontSize: "11px",
        color: "#FFFFFF",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5, 0);
    this.add
      .text(rightCx, boxTopY + boxH + 12, "MALE", {
        fontFamily: '"Press Start 2P"',
        fontSize: "11px",
        color: "#FFFFFF",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5, 0);

    const hitPad = 10;
    const makeZone = (cx, key) => {
      const z = this.add
        .zone(
          cx,
          boxTopY + boxH / 2,
          boxW + hitPad * 2,
          boxH + 52 + hitPad,
        )
        .setOrigin(0.5, 0.5)
        .setInteractive({ useHandCursor: true });
      z.on("pointerover", () => {
        selected = key;
        refreshBorders();
      });
      z.on("pointerdown", () => {
        window.selectedCrew = key;
        this.scene.start("CabinScene");
      });
      return z;
    };
    makeZone(leftCx, "female");
    makeZone(rightCx, "male");

    // “CLICK TO START” — same size as subtitle; gap under FEMALE/MALE = rowGap * 2 (matches subtitle→boxes)
    const labelTopY = boxTopY + boxH + 12;
    const labelApproxH = 18; // ~11px PS2P line + stroke
    const hintTopY = labelTopY + labelApproxH + rowGap * 2;

    const hint = this.add
      .text(CW / 2, hintTopY, "CLICK TO START", {
        fontFamily: '"Press Start 2P"',
        fontSize: "13px",
        color: "#bbbbbb",
        stroke: "#222222",
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
