/** Sci-fi gaming palette shared across all canvas scenes */
export const Theme = {
  void: 0x05070f,
  deep: 0x0a0e1a,
  panel: 0x12182b,
  panelElevated: 0x1a2240,
  border: 0x7c5cff,
  borderDim: 0x3d2f7a,
  cyan: 0x2ee6a6,
  purple: 0x7c5cff,
  gold: 0xffc857,
  rose: 0xff5c8a,
  blue: 0x4db8ff,
  text: 0xeef2ff,
  textSecondary: 0xa8b0d0,
  textMuted: 0x6b7394,
  danger: 0xff4d6d,
  success: 0x2ee6a6,
  white: 0xffffff,
  black: 0x000000,
} as const;

export const FONT_DISPLAY = "Orbitron, sans-serif";
export const FONT_BODY = "Rajdhani, sans-serif";

export const GRID = 6;

export type DesignMode = "desktop" | "mobile";

/** Mutable design resolution — set once at boot via applyDesign() */
export let W = 1280;
export let H = 720;
export let BOARD_SIZE = 420;
export let CELL = BOARD_SIZE / GRID;
export let IS_MOBILE = false;

/**
 * Pick layout from viewport.
 * Portrait phones / narrow screens → mobile design (390×844).
 * Everything else → desktop 1280×720.
 */
export function detectDesignMode(): DesignMode {
  if (typeof window === "undefined") return "desktop";
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const minSide = Math.min(vw, vh);
  const maxSide = Math.max(vw, vh);
  const coarse =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches;
  // Phone / small tablet portrait, or any coarse-pointer narrow device
  if (minSide <= 700) return "mobile";
  if (coarse && maxSide <= 1100 && vh >= vw) return "mobile";
  return "desktop";
}

export function applyDesign(mode: DesignMode = detectDesignMode()) {
  IS_MOBILE = mode === "mobile";
  if (IS_MOBILE) {
    // Tall phone canvas — FIT scales to any real device
    W = 390;
    H = 844;
    BOARD_SIZE = 348;
  } else {
    W = 1280;
    H = 720;
    BOARD_SIZE = 420;
  }
  CELL = BOARD_SIZE / GRID;
  return { W, H, BOARD_SIZE, CELL, IS_MOBILE, mode };
}
