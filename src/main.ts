import Phaser from "phaser";
import { H, Theme, W } from "./constants/theme";
import { BootScene } from "./scenes/BootScene";
import { GameScene } from "./scenes/GameScene";
import { WelcomeScene } from "./scenes/WelcomeScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: W,
  height: H,
  backgroundColor: Theme.void,
  fps: { target: 60, forceSetTimeOut: false },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: W,
    height: H,
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false,
  },
  audio: {
    disableWebAudio: false,
  },
  scene: [BootScene, WelcomeScene, GameScene],
  banner: false,
};

// Wait for fonts so canvas text isn't FOUT
async function boot() {
  try {
    await document.fonts.ready;
  } catch {
    /* ignore */
  }
  // eslint-disable-next-line no-new
  new Phaser.Game(config);
}

boot();
