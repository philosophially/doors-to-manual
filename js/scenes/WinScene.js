class WinScene extends Phaser.Scene {
  constructor() {
    super({ key: "WinScene" });
  }

  async create(data) {
    const finalScore = data && typeof data.score === "number" ? data.score : 0;
    const phaseEl = document.getElementById("hud-phase");
    if (phaseEl) phaseEl.textContent = "PHASE: LANDED";
    const hintEl = document.getElementById("hint-bar");
    if (hintEl) hintEl.textContent = "Welcome to Vibe Jam City.";
    const armed = document.getElementById("hud-armed");
    if (armed) {
      armed.textContent = "DOORS TO MANUAL";
      armed.style.color = "#00FF7F";
    }

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

    const restartToStart = () => {
      if (!this.scene.isActive("WinScene")) return;
      this.scene.start("CharacterSelectScene");
    };

    const playAgain = this.add
      .text(CW / 2, CH - 56, "PLAY AGAIN", {
        fontFamily: '"Press Start 2P"',
        fontSize: "12px",
        color: "#00FF7F",
        backgroundColor: "#10251a",
        padding: { x: 14, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    playAgain.on("pointerdown", restartToStart);
    playAgain.on("pointerup", restartToStart);

    // Wider hit target avoids missed clicks on scaled pixel text.
    const playAgainZone = this.add
      .zone(CW / 2, CH - 56, 260, 64)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    playAgainZone.on("pointerdown", restartToStart);
    playAgainZone.on("pointerup", restartToStart);

    this.input.keyboard.on("keydown-ENTER", restartToStart);
    this.input.keyboard.on("keydown-SPACE", restartToStart);

    let rows = this.getFallbackLeaderboard(finalScore);
    try {
      const loadedRows = await Promise.race([
        this.loadLeaderboardRows(finalScore),
        new Promise((resolve) =>
          setTimeout(() => resolve(this.getFallbackLeaderboard(finalScore)), 3500),
        ),
      ]);
      if (Array.isArray(loadedRows) && loadedRows.length) {
        rows = loadedRows;
      }
    } catch (e) {
      rows = this.getFallbackLeaderboard(finalScore);
    }

    this.add
      .text(CW / 2, 228, "LEADERBOARD", {
        fontFamily: '"Press Start 2P"',
        fontSize: "10px",
        color: "#FFFFFF",
      })
      .setOrigin(0.5);
    for (let i = 0; i < rows.length; i++) {
      this.add
        .text(
          CW / 2,
          254 + i * 28,
          `${i + 1}. ${rows[i].name}  ${rows[i].score}`,
          {
            fontFamily: '"Press Start 2P"',
            fontSize: "8px",
            color: "#BBBBBB",
          },
        )
        .setOrigin(0.5);
    }

    this.cameras.main.fadeIn(900, 0, 0, 0, true);
  }

  getFallbackLeaderboard(finalScore) {
    return [
      { name: "ALEX", score: 420 },
      { name: "NOVA", score: 380 },
      { name: "RIN", score: 340 },
      { name: "KAI", score: 300 },
      { name: "YOU", score: finalScore },
    ]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  async loadLeaderboardRows(finalScore) {
    const fallback = this.getFallbackLeaderboard(finalScore);
    const url = window.SUPABASE_URL;
    const key = window.SUPABASE_ANON_KEY;
    if (!url || !key) {
      return fallback;
    }
    try {
      const insertRes = await fetch(`${url}/rest/v1/leaderboard`, {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify([{ name: "YOU", score: finalScore }]),
      });
      if (!insertRes.ok) {
        return fallback;
      }
      const listRes = await fetch(
        `${url}/rest/v1/leaderboard?select=name,score&order=score.desc&limit=5`,
        {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
        },
      );
      if (!listRes.ok) {
        return fallback;
      }
      const json = await listRes.json();
      if (!Array.isArray(json) || !json.length) {
        return fallback;
      }
      return json
        .map((r) => ({
          name: String(r.name || "PAX"),
          score: Number(r.score || 0),
        }))
        .slice(0, 5);
    } catch (e) {
      return fallback;
    }
  }
}
