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

/** Design resolution — everything is laid out in this space, then FIT-scaled */
export const W = 1280;
export const H = 720;

export const GRID = 6;
export const BOARD_SIZE = 420;
export const CELL = BOARD_SIZE / GRID;
