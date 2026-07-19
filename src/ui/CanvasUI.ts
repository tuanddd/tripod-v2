import Phaser from "phaser";
import {
  FONT_BODY,
  FONT_DISPLAY,
  Theme,
  W,
} from "../constants/theme";

/** Rounded panel background */
export function drawPanel(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: {
    fill?: number;
    fillAlpha?: number;
    stroke?: number;
    strokeAlpha?: number;
    radius?: number;
  } = {}
) {
  const {
    fill = Theme.panel,
    fillAlpha = 0.88,
    stroke = Theme.border,
    strokeAlpha = 0.35,
    radius = 12,
  } = opts;
  g.fillStyle(fill, fillAlpha);
  g.fillRoundedRect(x, y, w, h, radius);
  g.lineStyle(1.5, stroke, strokeAlpha);
  g.strokeRoundedRect(x, y, w, h, radius);
}

/**
 * Sci-fi button.
 * Hit area is a fixed Zone (never scaled) so pointer math stays correct under Scale.FIT.
 * Only the visual chrome (bg + label) is tweened on hover.
 */
export function makeButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  opts: {
    width?: number;
    height?: number;
    variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
    fontSize?: number;
    onClick?: () => void;
  } = {}
) {
  const {
    width = 160,
    // Prefer ≥44px for touch targets when callers pass height
    height = 44,
    variant = "primary",
    fontSize = 14,
    onClick,
  } = opts;

  const colors: Record<string, { bg: number; stroke: number; text: number }> = {
    primary: { bg: Theme.purple, stroke: 0xb8a6ff, text: Theme.white },
    secondary: {
      bg: Theme.panelElevated,
      stroke: Theme.border,
      text: Theme.text,
    },
    ghost: {
      bg: Theme.deep,
      stroke: Theme.borderDim,
      text: Theme.textSecondary,
    },
    danger: { bg: Theme.danger, stroke: 0xff8aa5, text: Theme.white },
    success: { bg: Theme.cyan, stroke: 0x7ff5c8, text: Theme.deep },
  };
  const c = colors[variant];

  // Outer container — never scaled (keeps world-space hit rect stable)
  const root = scene.add.container(x, y);

  // Visuals live in a child that can bounce without affecting hit testing
  const visual = scene.add.container(0, 0);

  const bg = scene.add.graphics();
  const paint = (hover: boolean) => {
    bg.clear();
    bg.fillStyle(c.bg, hover ? 1 : 0.92);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
    bg.lineStyle(1.5, c.stroke, hover ? 0.95 : 0.55);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 8);
  };
  paint(false);

  const text = scene.add
    .text(0, 0, label, {
      fontFamily: FONT_DISPLAY,
      fontSize: `${fontSize}px`,
      color: `#${c.text.toString(16).padStart(6, "0")}`,
      fontStyle: "700",
    })
    .setOrigin(0.5);

  visual.add([bg, text]);
  root.add(visual);

  // Fixed hit zone — independent of visual scale
  const hit = scene.add
    .zone(0, 0, width, height)
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });
  root.add(hit);

  const pressIn = () => {
    paint(true);
    scene.tweens.killTweensOf(visual);
    scene.tweens.add({
      targets: visual,
      scaleX: 0.96,
      scaleY: 0.96,
      duration: 60,
      ease: "Sine.easeOut",
    });
  };
  const pressOut = () => {
    paint(false);
    scene.tweens.killTweensOf(visual);
    scene.tweens.add({
      targets: visual,
      scaleX: 1,
      scaleY: 1,
      duration: 100,
      ease: "Sine.easeOut",
    });
  };

  // Hover for mouse; press feedback for touch
  hit.on("pointerover", () => {
    paint(true);
    scene.tweens.killTweensOf(visual);
    scene.tweens.add({
      targets: visual,
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 100,
      ease: "Sine.easeOut",
    });
  });
  hit.on("pointerout", pressOut);
  hit.on("pointerdown", () => {
    pressIn();
    onClick?.();
  });
  hit.on("pointerup", pressOut);

  // Expose size for layout helpers
  root.setSize(width, height);
  return root;
}

export function makeLabel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  opts: {
    size?: number;
    color?: string;
    font?: string;
    align?: "left" | "center" | "right";
    originX?: number;
    originY?: number;
    wordWrap?: number;
  } = {}
) {
  const {
    size = 14,
    color = "#eef2ff",
    font = FONT_BODY,
    align = "left",
    originX = 0,
    originY = 0,
    wordWrap,
  } = opts;
  return scene.add
    .text(x, y, text, {
      fontFamily: font,
      fontSize: `${size}px`,
      color,
      align,
      wordWrap: wordWrap ? { width: wordWrap } : undefined,
    })
    .setOrigin(originX, originY);
}

export function makeDisplayLabel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  opts: {
    size?: number;
    color?: string;
    align?: "left" | "center" | "right";
    originX?: number;
    originY?: number;
    wordWrap?: number;
  } = {}
) {
  return makeLabel(scene, x, y, text, {
    font: FONT_DISPLAY,
    size: 12,
    color: "#a8b0d0",
    ...opts,
  });
}

/** Floating toast message at top-center of the design canvas */
export function showToast(
  scene: Phaser.Scene,
  message: string,
  kind: "info" | "error" | "success" = "info"
) {
  const colors = {
    info: Theme.purple,
    error: Theme.rose,
    success: Theme.cyan,
  };
  const maxW = Math.min(W - 32, 420);
  const w = Math.min(maxW, Math.max(180, message.length * 8 + 36));
  const container = scene.add.container(W / 2, 36);
  container.setDepth(1000);

  const g = scene.add.graphics();
  g.fillStyle(Theme.deep, 0.94);
  g.fillRoundedRect(-w / 2, -18, w, 36, 8);
  g.lineStyle(1.5, colors[kind], 0.85);
  g.strokeRoundedRect(-w / 2, -18, w, 36, 8);

  const t = scene.add
    .text(0, 0, message, {
      fontFamily: FONT_BODY,
      fontSize: "15px",
      color: "#eef2ff",
      fontStyle: "600",
      wordWrap: { width: w - 20 },
      align: "center",
    })
    .setOrigin(0.5);

  container.add([g, t]);
  container.setAlpha(0);
  container.y = 24;

  scene.tweens.add({
    targets: container,
    alpha: 1,
    y: 36,
    duration: 220,
    ease: "Back.easeOut",
    onComplete: () => {
      scene.tweens.add({
        targets: container,
        alpha: 0,
        y: 24,
        delay: 2200,
        duration: 250,
        onComplete: () => container.destroy(),
      });
    },
  });
}

/** Draw a starfield into a graphics object */
export function drawStarfield(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  count = 80
) {
  g.fillStyle(Theme.void, 1);
  g.fillRect(0, 0, width, height);

  g.fillStyle(Theme.purple, 0.08);
  g.fillCircle(width * 0.5, height * 0.05, width * 0.4);
  g.fillStyle(Theme.cyan, 0.04);
  g.fillCircle(width * 0.9, height * 0.8, width * 0.25);
  g.fillStyle(Theme.blue, 0.04);
  g.fillCircle(width * 0.1, height * 0.7, width * 0.2);

  for (let i = 0; i < count; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = Math.random() * 1.6 + 0.4;
    const a = 0.3 + Math.random() * 0.55;
    g.fillStyle(Theme.white, a);
    g.fillCircle(x, y, r);
  }
}
