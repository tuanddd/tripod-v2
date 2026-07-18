import Phaser from "phaser";
import {
  FONT_BODY,
  FONT_DISPLAY,
  H,
  Theme,
  W,
} from "../constants/theme";
import { audio } from "../systems/AudioBus";
import { GameState } from "../systems/GameState";
import { drawStarfield, makeButton } from "../ui/CanvasUI";

export class WelcomeScene extends Phaser.Scene {
  constructor() {
    super("Welcome");
  }

  create() {
    audio.attach(this);

    // Background layers
    const stars = this.add.graphics();
    drawStarfield(stars, W, H, 100);

    if (this.textures.exists("welcome-bg")) {
      const bg = this.add
        .image(W / 2, H / 2, "welcome-bg")
        .setDisplaySize(W, H)
        .setAlpha(0.45);
      // Darken
      this.add.rectangle(W / 2, H / 2, W, H, Theme.void, 0.45);
      void bg;
    }

    // Soft vignette
    const vig = this.add.graphics();
    vig.fillStyle(Theme.void, 0.55);
    vig.fillRect(0, 0, W, H * 0.18);
    vig.fillRect(0, H * 0.82, W, H * 0.18);

    // Logo
    const logo = this.add
      .image(W / 2, H * 0.32, "logo")
      .setOrigin(0.5)
      .setScale(0.55)
      .setAlpha(0);

    this.tweens.add({
      targets: logo,
      alpha: 1,
      scale: 0.62,
      duration: 700,
      ease: "Back.easeOut",
    });
    this.tweens.add({
      targets: logo,
      y: logo.y - 8,
      duration: 2800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      delay: 700,
    });

    // Tagline
    const tag = this.add
      .text(W / 2, H * 0.48, "BUILD  ·  MERGE  ·  ASCEND", {
        fontFamily: FONT_DISPLAY,
        fontSize: "14px",
        color: "#2ee6a6",
        letterSpacing: 6,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: tag,
      alpha: 1,
      delay: 350,
      duration: 500,
    });

    // Blurb
    const blurb = this.add
      .text(
        W / 2,
        H * 0.56,
        "Match three to evolve your pods into a Galaxy Fortress.\nOutsmart droids. Spend credits. Dominate Podtown.",
        {
          fontFamily: FONT_BODY,
          fontSize: "18px",
          color: "#a8b0d0",
          align: "center",
          lineSpacing: 6,
        }
      )
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: blurb,
      alpha: 1,
      delay: 500,
      duration: 500,
    });

    // Engage button
    const btn = makeButton(this, W / 2, H * 0.7, "ENGAGE", {
      width: 200,
      height: 52,
      fontSize: 16,
      variant: "primary",
      onClick: () => {
        audio.play("start");
        audio.enableBg();
        GameState.newGame();
        this.cameras.main.fadeOut(400, 5, 7, 15);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.scene.start("Game");
        });
      },
    });
    btn.setAlpha(0);
    btn.setScale(0.9);
    this.tweens.add({
      targets: btn,
      alpha: 1,
      scale: 1,
      delay: 700,
      duration: 400,
      ease: "Back.easeOut",
    });

    // Version chip
    this.add
      .text(W / 2, H * 0.8, "V2  ·  CANVAS ENGINE  ·  TRIPLE-POD CORE", {
        fontFamily: FONT_DISPLAY,
        fontSize: "10px",
        color: "#6b7394",
        letterSpacing: 3,
      })
      .setOrigin(0.5)
      .setAlpha(0.8);

    // Accent line under logo area
    const line = this.add.graphics();
    line.lineStyle(1, Theme.purple, 0.5);
    line.lineBetween(W / 2 - 120, H * 0.515, W / 2 + 120, H * 0.515);
  }
}
