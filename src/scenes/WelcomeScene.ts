import Phaser from "phaser";
import {
  FONT_BODY,
  FONT_DISPLAY,
  H,
  IS_MOBILE,
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

    const stars = this.add.graphics();
    drawStarfield(stars, W, H, IS_MOBILE ? 60 : 100);

    if (this.textures.exists("welcome-bg")) {
      this.add
        .image(W / 2, H / 2, "welcome-bg")
        .setDisplaySize(W, H)
        .setAlpha(0.45);
      this.add.rectangle(W / 2, H / 2, W, H, Theme.void, 0.45);
    }

    const vig = this.add.graphics();
    vig.fillStyle(Theme.void, 0.55);
    vig.fillRect(0, 0, W, H * 0.18);
    vig.fillRect(0, H * 0.82, W, H * 0.18);

    const logoScale = IS_MOBILE ? 0.38 : 0.55;
    const logoTarget = IS_MOBILE ? 0.42 : 0.62;
    const logo = this.add
      .image(W / 2, H * (IS_MOBILE ? 0.28 : 0.32), "logo")
      .setOrigin(0.5)
      .setScale(logoScale)
      .setAlpha(0);

    this.tweens.add({
      targets: logo,
      alpha: 1,
      scale: logoTarget,
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

    const tag = this.add
      .text(W / 2, H * (IS_MOBILE ? 0.42 : 0.48), "BUILD  ·  MERGE  ·  ASCEND", {
        fontFamily: FONT_DISPLAY,
        fontSize: IS_MOBILE ? "11px" : "14px",
        color: "#2ee6a6",
        letterSpacing: IS_MOBILE ? 3 : 6,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: tag,
      alpha: 1,
      delay: 350,
      duration: 500,
    });

    const blurb = this.add
      .text(
        W / 2,
        H * (IS_MOBILE ? 0.5 : 0.56),
        IS_MOBILE
          ? "Match three to evolve your pods.\nOutsmart droids. Dominate Podtown."
          : "Match three to evolve your pods into a Galaxy Fortress.\nOutsmart droids. Spend credits. Dominate Podtown.",
        {
          fontFamily: FONT_BODY,
          fontSize: IS_MOBILE ? "16px" : "18px",
          color: "#a8b0d0",
          align: "center",
          lineSpacing: 6,
          wordWrap: { width: W - 48 },
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

    const btn = makeButton(this, W / 2, H * (IS_MOBILE ? 0.66 : 0.7), "ENGAGE", {
      width: IS_MOBILE ? 220 : 200,
      height: IS_MOBILE ? 56 : 52,
      fontSize: IS_MOBILE ? 18 : 16,
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

    this.add
      .text(
        W / 2,
        H * (IS_MOBILE ? 0.76 : 0.8),
        IS_MOBILE
          ? "V2  ·  TOUCH READY  ·  TRIPLE-POD"
          : "V2  ·  CANVAS ENGINE  ·  TRIPLE-POD CORE",
        {
          fontFamily: FONT_DISPLAY,
          fontSize: "10px",
          color: "#6b7394",
          letterSpacing: 2,
        }
      )
      .setOrigin(0.5)
      .setAlpha(0.8);

    const line = this.add.graphics();
    line.lineStyle(1, Theme.purple, 0.5);
    const ly = H * (IS_MOBILE ? 0.455 : 0.515);
    line.lineBetween(W / 2 - 100, ly, W / 2 + 100, ly);
  }
}
