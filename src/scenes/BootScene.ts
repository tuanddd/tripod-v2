import Phaser from "phaser";
import { asset } from "../asset";
import { PIECE_ASSETS } from "../constants/mappings";
import { FONT_DISPLAY, H, Theme, W } from "../constants/theme";
import { audio } from "../systems/AudioBus";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload() {
    const { width, height } = this.scale;

    // Loading chrome
    const barW = 320;
    const barH = 10;
    const cx = width / 2;
    const cy = height / 2;

    this.add
      .text(cx, cy - 40, "TRIPOD", {
        fontFamily: FONT_DISPLAY,
        fontSize: "28px",
        color: "#eef2ff",
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy - 12, "INITIALIZING PODTOWN…", {
        fontFamily: FONT_DISPLAY,
        fontSize: "11px",
        color: "#6b7394",
      })
      .setOrigin(0.5);

    const track = this.add.graphics();
    track.fillStyle(Theme.panel, 1);
    track.fillRoundedRect(cx - barW / 2, cy + 16, barW, barH, 4);
    track.lineStyle(1, Theme.border, 0.4);
    track.strokeRoundedRect(cx - barW / 2, cy + 16, barW, barH, 4);

    const fill = this.add.graphics();

    this.load.on("progress", (p: number) => {
      fill.clear();
      fill.fillStyle(Theme.purple, 1);
      fill.fillRoundedRect(cx - barW / 2, cy + 16, barW * p, barH, 4);
      if (p > 0.15) {
        fill.fillStyle(Theme.cyan, 0.85);
        fill.fillRoundedRect(
          cx - barW / 2 + barW * p - 8,
          cy + 16,
          8,
          barH,
          2
        );
      }
    });

    // Board & chrome (asset() prefixes Vite base for GitHub Pages)
    this.load.image("board-bg", asset("background.webp"));
    this.load.image("disk", asset("disk.webp"));
    this.load.image("logo", asset("text.webp"));
    this.load.image("coins", asset("coins.png"));
    this.load.image("welcome-bg", asset("horizontal-wallpaper.jpg"));
    this.load.image("map-bg", asset("podtownmap.jpeg"));

    // Pieces
    for (const a of PIECE_ASSETS) {
      this.load.image(a.key, asset(a.path));
    }

    // Normal droid animation frames (face left by default)
    this.load.image("droid-idle-1", asset("pieces/droid/idle-frame1.png"));
    this.load.image("droid-idle-2", asset("pieces/droid/idle-frame2.png"));
    this.load.image("droid-jump", asset("pieces/droid/jumping-frame.png"));
    this.load.image("droid-land", asset("pieces/droid/landing-frame.png"));

    // Audio
    this.load.audio("sfx-click", asset("audio/click.mp3"));
    this.load.audio("sfx-start", asset("audio/start.mp3"));
    this.load.audio("sfx-merge", asset("audio/merge.mp3"));
    this.load.audio("sfx-explosion", asset("audio/explosion.mp3"));
    this.load.audio("sfx-buy", asset("audio/buy.mp3"));
    this.load.audio("sfx-error", asset("audio/error.mp3"));
    this.load.audio("music-bg", asset("audio/bg.mp3"));
  }

  create() {
    audio.attach(this);
    // Ensure design size camera for all scenes
    this.scale.setGameSize(W, H);
    this.scene.start("Welcome");
  }
}
