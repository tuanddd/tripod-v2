import Phaser from "phaser";

export type SfxKey =
  | "click"
  | "start"
  | "merge"
  | "explosion"
  | "buy"
  | "error";

/**
 * Thin audio facade so scenes don't juggle mute flags.
 * Requires BootScene to have loaded sfx-* and music-bg keys.
 */
export class AudioBus {
  private scene: Phaser.Scene | null = null;
  muted = false;
  bgEnabled = false;
  private bg: Phaser.Sound.BaseSound | null = null;

  attach(scene: Phaser.Scene) {
    this.scene = scene;
  }

  play(key: SfxKey) {
    if (!this.scene || this.muted) return;
    try {
      const volume =
        key === "explosion" ? 0.25 : key === "buy" ? 0.7 : 0.55;
      this.scene.sound.play(`sfx-${key}`, { volume });
    } catch {
      /* missing asset */
    }
  }

  enableBg() {
    if (!this.scene) return;
    this.bgEnabled = true;
    if (this.muted) return;
    if (!this.bg) {
      this.bg = this.scene.sound.add("music-bg", {
        loop: true,
        volume: 0.32,
      });
    }
    if (!this.bg.isPlaying) this.bg.play();
  }

  toggleBg() {
    this.bgEnabled = !this.bgEnabled;
    if (!this.bg && this.scene) {
      this.bg = this.scene.sound.add("music-bg", {
        loop: true,
        volume: 0.32,
      });
    }
    if (!this.bg) return;
    if (this.bgEnabled && !this.muted) this.bg.play();
    else this.bg.stop();
    this.play("click");
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.bg) {
      if (this.muted) this.bg.pause();
      else if (this.bgEnabled) this.bg.resume();
    }
    if (!this.muted) this.play("click");
  }
}

export const audio = new AudioBus();
