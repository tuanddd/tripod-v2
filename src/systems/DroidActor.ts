import Phaser from "phaser";
import { PieceEnum } from "triple-pod-game-engine";

export const DROID_TEX = {
  idle1: "droid-idle-1",
  idle2: "droid-idle-2",
  jump: "droid-jump",
  land: "droid-land",
  ninja: "piece-ninja",
  /** Fallback static art for ninja / legacy */
  static: "piece-bear",
} as const;

/** True for any texture key that uses portrait droid frames */
export function isNormalDroidTex(key: string) {
  return (
    key === DROID_TEX.idle1 ||
    key === DROID_TEX.idle2 ||
    key === DROID_TEX.jump ||
    key === DROID_TEX.land
  );
}

/**
 * Size an image/sprite to fit a box while preserving native aspect ratio.
 * Used for HUD chips, deploy pill, and board ghost preview.
 */
export function fitPortraitInBox(
  img: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite,
  maxW: number,
  maxH: number
) {
  const frame = img.frame;
  const nw = frame.realWidth || frame.width || 1;
  const nh = frame.realHeight || frame.height || 1;
  const scale = Math.min(maxW / nw, maxH / nh);
  img.setDisplaySize(nw * scale, nh * scale);
}

/** Pixels to shift normal droids up so they read as standing on the tile */
export const DROID_STAND_OFFSET_Y = 10;

export const DROID_IDLE_ANIM = "droid-idle";

/** Register textures + idle animation (call once after load). */
export function ensureDroidAnims(scene: Phaser.Scene) {
  if (scene.anims.exists(DROID_IDLE_ANIM)) return;
  if (
    !scene.textures.exists(DROID_TEX.idle1) ||
    !scene.textures.exists(DROID_TEX.idle2)
  ) {
    return;
  }
  scene.anims.create({
    key: DROID_IDLE_ANIM,
    frames: [
      { key: DROID_TEX.idle1 },
      { key: DROID_TEX.idle2 },
    ],
    // Alternate back and forth between the two idle frames
    frameRate: 3.5,
    repeat: -1,
    yoyo: true,
  });
}

export type DroidActor = {
  sprite: Phaser.GameObjects.Sprite;
  pieceId: PieceEnum;
  cellX: number;
  cellY: number;
  /** True while a hop tween is driving the sprite */
  hopping: boolean;
  /** Normal droid uses custom frames; ninja uses static rocket art */
  isNormal: boolean;
};

/**
 * Sprites face LEFT by default.
 * flipX = true → face right.
 */
export function faceLeft(sprite: Phaser.GameObjects.Sprite) {
  sprite.setFlipX(false);
}

export function faceRight(sprite: Phaser.GameObjects.Sprite) {
  sprite.setFlipX(true);
}

/** Idle: face toward the board center. */
export function faceTowardCenter(
  sprite: Phaser.GameObjects.Sprite,
  worldX: number,
  boardCenterX: number
) {
  if (worldX < boardCenterX) faceRight(sprite);
  else faceLeft(sprite);
}

/** Jump: face the horizontal travel direction; vertical-only falls back to center. */
export function faceJumpDirection(
  sprite: Phaser.GameObjects.Sprite,
  fromX: number,
  toX: number,
  boardCenterX: number
) {
  if (toX > fromX) faceRight(sprite);
  else if (toX < fromX) faceLeft(sprite);
  else faceTowardCenter(sprite, fromX, boardCenterX);
}

export function playIdle(actor: DroidActor) {
  if (!actor.isNormal || actor.hopping) return;
  const { sprite } = actor;
  if (!sprite.anims || !sprite.scene.anims.exists(DROID_IDLE_ANIM)) {
    sprite.setTexture(DROID_TEX.idle1);
    return;
  }
  if (sprite.anims.currentAnim?.key !== DROID_IDLE_ANIM || !sprite.anims.isPlaying) {
    sprite.play(DROID_IDLE_ANIM);
  }
}

export function setJumpFrame(actor: DroidActor, phase: "jump" | "land") {
  if (!actor.isNormal) return;
  const { sprite } = actor;
  sprite.anims?.stop();
  sprite.setTexture(phase === "jump" ? DROID_TEX.jump : DROID_TEX.land);
}

export function destroyActor(actor: DroidActor) {
  actor.hopping = false;
  actor.sprite.anims?.stop();
  if (actor.sprite.active) actor.sprite.destroy();
}
