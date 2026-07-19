import Phaser from "phaser";
import { applyDesign, Theme } from "./constants/theme";
import { BootScene } from "./scenes/BootScene";
import { GameScene } from "./scenes/GameScene";
import { WelcomeScene } from "./scenes/WelcomeScene";

const design = applyDesign();

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: design.W,
  height: design.H,
  backgroundColor: Theme.void,
  fps: { target: 60, forceSetTimeOut: false },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: design.W,
    height: design.H,
  },
  // Extra pointers help multi-touch / palm rejection edge cases
  input: {
    activePointers: 3,
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: true,
  },
  audio: {
    disableWebAudio: false,
  },
  scene: [BootScene, WelcomeScene, GameScene],
  banner: false,
};

async function boot() {
  try {
    await document.fonts.ready;
  } catch {
    /* ignore */
  }

  // Block browser gestures that steal touch from the canvas
  const el = document.getElementById("game-container");
  if (el) {
    el.addEventListener(
      "touchmove",
      (e) => {
        e.preventDefault();
      },
      { passive: false }
    );
  }
  document.addEventListener(
    "gesturestart",
    (e) => e.preventDefault(),
    { passive: false } as AddEventListenerOptions
  );

  // eslint-disable-next-line no-new
  new Phaser.Game(config);
}

boot();
