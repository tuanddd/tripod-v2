import Phaser from "phaser";
import { PieceEnum } from "triple-pod-game-engine";
import { formatPoints, mappings } from "../constants/mappings";
import { shopItems } from "../constants/shopItems";
import {
  BOARD_SIZE,
  CELL,
  FONT_BODY,
  FONT_DISPLAY,
  GRID,
  H,
  IS_MOBILE,
  Theme,
  W,
} from "../constants/theme";
import { audio } from "../systems/AudioBus";
import {
  destroyActor,
  DROID_STAND_OFFSET_Y,
  DROID_TEX,
  type DroidActor,
  ensureDroidAnims,
  faceJumpDirection,
  faceTowardCenter,
  fitPortraitInBox,
  isNormalDroidTex,
  playIdle,
  setJumpFrame,
} from "../systems/DroidActor";
import { GameState } from "../systems/GameState";
import {
  drawPanel,
  drawStarfield,
  makeButton,
  showToast,
} from "../ui/CanvasUI";

type PieceSprite = Phaser.GameObjects.Image & {
  cellX?: number;
  cellY?: number;
  pieceId?: PieceEnum;
};

export class GameScene extends Phaser.Scene {
  private boardOrigin = { x: 0, y: 0 };
  private pieceLayer!: Phaser.GameObjects.Container;
  private overlayLayer!: Phaser.GameObjects.Container;
  private pieceSprites: (PieceSprite | null)[][] = [];
  /** Normal + ninja droids keyed by "x,y" */
  private droids = new Map<string, DroidActor>();
  private previewImg: Phaser.GameObjects.Image | null = null;
  private storageImg: Phaser.GameObjects.Image | null = null;
  private cellHighlights: Phaser.GameObjects.Rectangle[][] = [];
  private diskImg: Phaser.GameObjects.Image | null = null;

  // HUD text refs
  private scoreText!: Phaser.GameObjects.Text;
  private coinsText!: Phaser.GameObjects.Text;
  private holdingName!: Phaser.GameObjects.Text;
  private holdingImg!: Phaser.GameObjects.Image;
  private nextName!: Phaser.GameObjects.Text;
  private nextImg!: Phaser.GameObjects.Image;
  private deployImg!: Phaser.GameObjects.Image;
  private deployName!: Phaser.GameObjects.Text;

  // Side panels
  private historyContainer!: Phaser.GameObjects.Container;
  private shopContainer!: Phaser.GameObjects.Container;
  private shopCoinLabels: Phaser.GameObjects.Text[] = [];
  /** Mobile: history lives in a sheet, not a permanent side panel */
  private historySheetRoot: Phaser.GameObjects.Container | null = null;

  // Modals
  private modalRoot: Phaser.GameObjects.Container | null = null;
  private guidesOpen = false;

  private unsub: (() => void) | null = null;
  private lastPoints = 0;
  private hovered: { x: number; y: number } | null = null;
  private busyLock = false;
  private get pieceDisplay() {
    return CELL * 0.82;
  }

  constructor() {
    super("Game");
  }

  create() {
    audio.attach(this);
    ensureDroidAnims(this);
    this.cameras.main.fadeIn(400, 5, 7, 15);

    if (!GameState.game) GameState.newGame();
    this.lastPoints = GameState.game!.state.points;

    this.buildBackground();
    this.buildTopBar();
    this.buildHud();
    this.buildBoard();
    if (IS_MOBILE) {
      this.buildMobileShop();
    } else {
      this.buildHistoryPanel();
      this.buildShopPanel();
    }
    this.buildFooterHint();

    this.syncBoard(true);
    this.syncHud();
    this.syncHistory();
    this.syncShop();

    this.unsub = GameState.onChange(() => this.onStateChange());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsub?.();
      this.unsub = null;
      for (const actor of this.droids.values()) destroyActor(actor);
      this.droids.clear();
    });
  }

  private boardCenterX() {
    return this.boardOrigin.x + BOARD_SIZE / 2;
  }

  // ─── Layout builders ───────────────────────────────────────────

  private buildBackground() {
    const stars = this.add.graphics().setDepth(0);
    drawStarfield(stars, W, H, 70);

    if (this.textures.exists("map-bg")) {
      this.add
        .image(W / 2, H / 2, "map-bg")
        .setDisplaySize(W, H)
        .setAlpha(0.18)
        .setDepth(0)
        .setTint(0x8899cc);
    }
    this.add.rectangle(W / 2, H / 2, W, H, Theme.void, 0.35).setDepth(0);
  }

  private buildTopBar() {
    const pad = IS_MOBILE ? 12 : 20;
    const mark = this.add.graphics().setDepth(10);
    mark.fillStyle(Theme.purple, 1);
    mark.fillRoundedRect(pad, IS_MOBILE ? 12 : 16, IS_MOBILE ? 28 : 36, IS_MOBILE ? 28 : 36, 8);
    this.add
      .text(pad + (IS_MOBILE ? 14 : 18), IS_MOBILE ? 26 : 34, "TP", {
        fontFamily: FONT_DISPLAY,
        fontSize: IS_MOBILE ? "10px" : "12px",
        color: "#0a0e1a",
        fontStyle: "800",
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.add
      .text(pad + (IS_MOBILE ? 36 : 46), IS_MOBILE ? 16 : 24, "TRIPOD", {
        fontFamily: FONT_DISPLAY,
        fontSize: IS_MOBILE ? "13px" : "16px",
        color: "#eef2ff",
        fontStyle: "700",
      })
      .setDepth(10);

    if (!IS_MOBILE) {
      this.add
        .text(66, 42, "PODTOWN SECTOR · LIVE OPS", {
          fontFamily: FONT_DISPLAY,
          fontSize: "9px",
          color: "#6b7394",
          letterSpacing: 1,
        })
        .setDepth(10);
    }

    const btnY = IS_MOBILE ? 26 : 34;
    const btnH = IS_MOBILE ? 36 : 34;

    if (IS_MOBILE) {
      // Compact icon row: log · manual · music · mute
      makeButton(this, W - 148, btnY, "LOG", {
        width: 48,
        height: btnH,
        fontSize: 10,
        variant: "ghost",
        onClick: () => {
          audio.play("click");
          this.openHistorySheet();
        },
      }).setDepth(10);

      makeButton(this, W - 94, btnY, "?", {
        width: 40,
        height: btnH,
        fontSize: 14,
        variant: "ghost",
        onClick: () => {
          audio.play("click");
          this.openGuides();
        },
      }).setDepth(10);

      makeButton(this, W - 48, btnY, audio.muted ? "⊘" : "◉", {
        width: 40,
        height: btnH,
        fontSize: 14,
        variant: "ghost",
        onClick: () => {
          audio.toggleMute();
          showToast(this, audio.muted ? "Muted" : "Unmuted", "info");
        },
      }).setDepth(10);

      // Long-press music via double-tap on mute area is awkward — add tiny music toggle
      makeButton(this, W - 198, btnY, "♪", {
        width: 40,
        height: btnH,
        fontSize: 14,
        variant: "ghost",
        onClick: () => {
          audio.toggleBg();
          showToast(
            this,
            audio.bgEnabled ? "Ambience on" : "Ambience off",
            "info"
          );
        },
      }).setDepth(10);
    } else {
      makeButton(this, W - 210, btnY, "FIELD MANUAL", {
        width: 140,
        height: btnH,
        fontSize: 10,
        variant: "ghost",
        onClick: () => {
          audio.play("click");
          this.openGuides();
        },
      }).setDepth(10);

      makeButton(this, W - 100, btnY, audio.bgEnabled ? "♪ ON" : "♪ OFF", {
        width: 56,
        height: btnH,
        fontSize: 11,
        variant: "ghost",
        onClick: () => {
          audio.toggleBg();
          showToast(
            this,
            audio.bgEnabled ? "Ambience on" : "Ambience off",
            "info"
          );
        },
      }).setDepth(10);

      makeButton(this, W - 40, btnY, audio.muted ? "⊘" : "◉", {
        width: 40,
        height: btnH,
        fontSize: 14,
        variant: "ghost",
        onClick: () => {
          audio.toggleMute();
          showToast(this, audio.muted ? "Muted" : "Unmuted", "info");
        },
      }).setDepth(10);
    }
  }

  private buildHud() {
    if (IS_MOBILE) {
      this.buildMobileHud();
      return;
    }

    const y = 78;
    const chipH = 56;
    const gap = 12;
    const chipW = (W - 40 - gap * 3) / 4;
    const labels = ["SCORE", "HOLDING", "NEXT TIER", "CREDITS"];
    const accents = [Theme.gold, Theme.purple, Theme.border, Theme.cyan];

    for (let i = 0; i < 4; i++) {
      const x = 20 + i * (chipW + gap);
      const g = this.add.graphics().setDepth(10);
      drawPanel(g, x, y, chipW, chipH, {
        fill: Theme.deep,
        fillAlpha: 0.9,
        stroke: accents[i],
        strokeAlpha: 0.4,
        radius: 10,
      });

      this.add
        .text(x + 14, y + 10, labels[i], {
          fontFamily: FONT_DISPLAY,
          fontSize: "9px",
          color: "#6b7394",
          letterSpacing: 2,
        })
        .setDepth(10);
    }

    this.scoreText = this.add
      .text(34, y + 28, "0", {
        fontFamily: FONT_DISPLAY,
        fontSize: "20px",
        color: "#ffc857",
        fontStyle: "700",
      })
      .setDepth(10);

    this.holdingName = this.add
      .text(20 + chipW + gap + 14, y + 30, "—", {
        fontFamily: FONT_DISPLAY,
        fontSize: "12px",
        color: "#eef2ff",
      })
      .setDepth(10);
    this.holdingImg = this.add
      .image(20 + chipW + gap + chipW - 30, y + chipH / 2, "piece-grass")
      .setDisplaySize(36, 36)
      .setDepth(10);

    this.nextName = this.add
      .text(20 + 2 * (chipW + gap) + 14, y + 30, "—", {
        fontFamily: FONT_DISPLAY,
        fontSize: "12px",
        color: "#a8b0d0",
      })
      .setDepth(10);
    this.nextImg = this.add
      .image(20 + 2 * (chipW + gap) + chipW - 30, y + chipH / 2, "piece-bush")
      .setDisplaySize(36, 36)
      .setDepth(10)
      .setAlpha(0.9);

    this.coinsText = this.add
      .text(20 + 3 * (chipW + gap) + 14, y + 28, "0", {
        fontFamily: FONT_DISPLAY,
        fontSize: "20px",
        color: "#2ee6a6",
        fontStyle: "700",
      })
      .setDepth(10);
    this.add
      .image(20 + 3 * (chipW + gap) + chipW - 28, y + chipH / 2, "coins")
      .setDisplaySize(26, 26)
      .setDepth(10);
  }

  /** Compact 2-row HUD for phones */
  private buildMobileHud() {
    const y = 52;
    const gap = 6;
    const pad = 12;
    const rowH = 44;
    const half = (W - pad * 2 - gap) / 2;

    // Row 1: score | credits
    const g1 = this.add.graphics().setDepth(10);
    drawPanel(g1, pad, y, half, rowH, {
      fill: Theme.deep,
      fillAlpha: 0.92,
      stroke: Theme.gold,
      strokeAlpha: 0.4,
      radius: 10,
    });
    drawPanel(g1, pad + half + gap, y, half, rowH, {
      fill: Theme.deep,
      fillAlpha: 0.92,
      stroke: Theme.cyan,
      strokeAlpha: 0.4,
      radius: 10,
    });

    this.add
      .text(pad + 10, y + 8, "SCORE", {
        fontFamily: FONT_DISPLAY,
        fontSize: "8px",
        color: "#6b7394",
        letterSpacing: 1,
      })
      .setDepth(10);
    this.scoreText = this.add
      .text(pad + 10, y + 22, "0", {
        fontFamily: FONT_DISPLAY,
        fontSize: "16px",
        color: "#ffc857",
        fontStyle: "700",
      })
      .setDepth(10);

    this.add
      .text(pad + half + gap + 10, y + 8, "CREDITS", {
        fontFamily: FONT_DISPLAY,
        fontSize: "8px",
        color: "#6b7394",
        letterSpacing: 1,
      })
      .setDepth(10);
    this.coinsText = this.add
      .text(pad + half + gap + 10, y + 22, "0", {
        fontFamily: FONT_DISPLAY,
        fontSize: "16px",
        color: "#2ee6a6",
        fontStyle: "700",
      })
      .setDepth(10);
    this.add
      .image(pad + half + gap + half - 18, y + rowH / 2, "coins")
      .setDisplaySize(18, 18)
      .setDepth(10);

    // Row 2: holding | next
    const y2 = y + rowH + gap;
    const g2 = this.add.graphics().setDepth(10);
    drawPanel(g2, pad, y2, half, rowH, {
      fill: Theme.deep,
      fillAlpha: 0.92,
      stroke: Theme.purple,
      strokeAlpha: 0.4,
      radius: 10,
    });
    drawPanel(g2, pad + half + gap, y2, half, rowH, {
      fill: Theme.deep,
      fillAlpha: 0.92,
      stroke: Theme.border,
      strokeAlpha: 0.35,
      radius: 10,
    });

    this.add
      .text(pad + 10, y2 + 8, "HOLDING", {
        fontFamily: FONT_DISPLAY,
        fontSize: "8px",
        color: "#6b7394",
        letterSpacing: 1,
      })
      .setDepth(10);
    this.holdingName = this.add
      .text(pad + 10, y2 + 22, "—", {
        fontFamily: FONT_DISPLAY,
        fontSize: "11px",
        color: "#eef2ff",
      })
      .setDepth(10);
    this.holdingImg = this.add
      .image(pad + half - 22, y2 + rowH / 2, "piece-grass")
      .setDisplaySize(28, 28)
      .setDepth(10);

    this.add
      .text(pad + half + gap + 10, y2 + 8, "NEXT", {
        fontFamily: FONT_DISPLAY,
        fontSize: "8px",
        color: "#6b7394",
        letterSpacing: 1,
      })
      .setDepth(10);
    this.nextName = this.add
      .text(pad + half + gap + 10, y2 + 22, "—", {
        fontFamily: FONT_DISPLAY,
        fontSize: "11px",
        color: "#a8b0d0",
      })
      .setDepth(10);
    this.nextImg = this.add
      .image(pad + half + gap + half - 22, y2 + rowH / 2, "piece-bush")
      .setDisplaySize(28, 28)
      .setDepth(10)
      .setAlpha(0.9);
  }

  private buildBoard() {
    const boardX = W / 2 - BOARD_SIZE / 2;
    // Mobile: sit under compact HUD; desktop: classic mid layout
    const boardY = IS_MOBILE ? 168 : 160;
    this.boardOrigin = { x: boardX, y: boardY };

    // Deploy pill above board
    const pillW = IS_MOBILE ? Math.min(W - 24, 280) : 220;
    const pillY = boardY - (IS_MOBILE ? 22 : 28);
    const pillG = this.add.graphics().setDepth(10);
    drawPanel(pillG, W / 2 - pillW / 2, pillY - 16, pillW, 32, {
      fill: Theme.deep,
      fillAlpha: 0.92,
      stroke: Theme.border,
      strokeAlpha: 0.45,
      radius: 16,
    });
    this.add
      .text(W / 2 - pillW / 2 + 16, pillY, "DEPLOY", {
        fontFamily: FONT_DISPLAY,
        fontSize: "9px",
        color: "#a8b0d0",
        letterSpacing: 2,
      })
      .setOrigin(0, 0.5)
      .setDepth(10);
    this.deployImg = this.add
      .image(W / 2 + (IS_MOBILE ? 10 : 20), pillY, "piece-grass")
      .setDisplaySize(26, 26)
      .setDepth(10);
    this.deployName = this.add
      .text(W / 2 + (IS_MOBILE ? 28 : 40), pillY, "—", {
        fontFamily: FONT_DISPLAY,
        fontSize: IS_MOBILE ? "10px" : "11px",
        color: "#eef2ff",
      })
      .setOrigin(0, 0.5)
      .setDepth(10);

    // Board frame (gradient-ish via double stroke)
    const frame = this.add.graphics().setDepth(5);
    frame.lineStyle(3, Theme.purple, 0.7);
    frame.strokeRoundedRect(boardX - 6, boardY - 6, BOARD_SIZE + 12, BOARD_SIZE + 12, 16);
    frame.lineStyle(1, Theme.cyan, 0.35);
    frame.strokeRoundedRect(boardX - 3, boardY - 3, BOARD_SIZE + 6, BOARD_SIZE + 6, 14);

    // Board background image
    const bg = this.add
      .image(boardX + BOARD_SIZE / 2, boardY + BOARD_SIZE / 2, "board-bg")
      .setDisplaySize(BOARD_SIZE, BOARD_SIZE)
      .setDepth(5);

    // Mask board to rounded rect — use geometry mask via graphics
    const maskG = this.make.graphics({ x: 0, y: 0 });
    maskG.fillStyle(0xffffff);
    maskG.fillRoundedRect(boardX, boardY, BOARD_SIZE, BOARD_SIZE, 12);
    bg.setMask(maskG.createGeometryMask());

    // Grid lines + hit areas + highlights
    const gridG = this.add.graphics().setDepth(6);
    gridG.lineStyle(1, Theme.purple, 0.18);
    for (let i = 1; i < GRID; i++) {
      const p = (i / GRID) * BOARD_SIZE;
      gridG.lineBetween(boardX + p, boardY, boardX + p, boardY + BOARD_SIZE);
      gridG.lineBetween(boardX, boardY + p, boardX + BOARD_SIZE, boardY + p);
    }

    this.cellHighlights = [];
    this.pieceSprites = [];
    for (let y = 0; y < GRID; y++) {
      this.cellHighlights[y] = [];
      this.pieceSprites[y] = [];
      for (let x = 0; x < GRID; x++) {
        const cx = boardX + x * CELL + CELL / 2;
        const cy = boardY + y * CELL + CELL / 2;

        const hl = this.add
          .rectangle(cx, cy, CELL - 4, CELL - 4, Theme.cyan, 0)
          .setDepth(7)
          .setStrokeStyle(0, Theme.cyan, 0);
        this.cellHighlights[y][x] = hl;
        this.pieceSprites[y][x] = null;

        // Interactive hit zone
        const zone = this.add
          .zone(cx, cy, CELL, CELL)
          .setDepth(20)
          .setInteractive({ useHandCursor: true });

        // pointerover works for mouse; on touch, show preview on down then place
        const showPreview = () => {
          this.hovered = { x, y };
          this.updateHighlights();
          if (!this.previewImg || (x === 0 && y === 0)) return;
          const g = GameState.game;
          if (!g) return;
          const empty = g.state.board[y][x].id === PieceEnum.EMPTY;
          const cur = g.state.currentPiece.id;
          const show =
            empty &&
            cur !== PieceEnum.TELEPORT_PORTAL &&
            cur !== PieceEnum.AIRDROPPER;
          this.previewImg.setVisible(show);
          if (show) {
            const key =
              cur === PieceEnum.BEAR
                ? DROID_TEX.idle1
                : mappings[cur]?.key;
            if (key) {
              this.previewImg.setTexture(key);
              this.fitHudIcon(
                this.previewImg,
                key,
                CELL * 0.82,
                CELL * 0.95
              );
              const oy =
                cur === PieceEnum.BEAR ? DROID_STAND_OFFSET_Y : 0;
              this.previewImg.setPosition(cx, cy - oy);
            }
          }
        };
        zone.on("pointerover", showPreview);
        zone.on("pointerout", () => {
          if (this.hovered?.x === x && this.hovered?.y === y) {
            this.hovered = null;
            this.updateHighlights();
          }
          this.previewImg?.setVisible(false);
        });
        zone.on("pointerdown", () => {
          showPreview();
          this.onCellClick(x, y);
        });
      }
    }

    // Storage disk (0,0) — static pad, no spin (was disorienting)
    this.diskImg = this.add
      .image(boardX + CELL / 2, boardY + CELL / 2, "disk")
      .setDisplaySize(CELL * 0.9, CELL * 0.9)
      .setDepth(8)
      .setAlpha(0.92);

    this.pieceLayer = this.add.container(0, 0).setDepth(9);
    this.overlayLayer = this.add.container(0, 0).setDepth(11);

    // Ghost preview (re-sized on hover so texture swaps stay correct)
    this.previewImg = this.add
      .image(0, 0, "piece-grass")
      .setDisplaySize(this.pieceDisplay * 0.95, this.pieceDisplay * 0.95)
      .setAlpha(0.38)
      .setDepth(12)
      .setVisible(false);
  }

  /** Size HUD / deploy / ghost icons; portrait droids keep aspect. */
  private fitHudIcon(
    img: Phaser.GameObjects.Image,
    key: string,
    maxW: number,
    maxH: number
  ) {
    if (isNormalDroidTex(key) || key === DROID_TEX.idle1) {
      fitPortraitInBox(img, maxW, maxH);
    } else {
      img.setDisplaySize(maxW, maxH);
    }
  }

  private buildHistoryPanel() {
    const x = 20;
    const y = 150;
    const w = W / 2 - BOARD_SIZE / 2 - 40;
    const h = BOARD_SIZE + 40;

    const g = this.add.graphics().setDepth(10);
    drawPanel(g, x, y, w, h, { radius: 12 });

    this.add
      .text(x + 14, y + 12, "// OPS LOG", {
        fontFamily: FONT_DISPLAY,
        fontSize: "11px",
        color: "#a8b0d0",
        letterSpacing: 2,
      })
      .setDepth(10);

    this.historyContainer = this.add.container(x + 10, y + 36).setDepth(10);
  }

  private buildShopPanel() {
    const w = W / 2 - BOARD_SIZE / 2 - 40;
    const x = W - 20 - w;
    const y = 150;
    const h = BOARD_SIZE + 40;

    const g = this.add.graphics().setDepth(10);
    drawPanel(g, x, y, w, h, { radius: 12 });

    this.add
      .text(x + 14, y + 12, "// ARSENAL", {
        fontFamily: FONT_DISPLAY,
        fontSize: "11px",
        color: "#a8b0d0",
        letterSpacing: 2,
      })
      .setDepth(10);

    this.shopContainer = this.add.container(x + 8, y + 36).setDepth(10);
    this.buildShopItems(w - 16, false);
  }

  /**
   * Mobile arsenal: 3×2 icon grid under the board — tap to buy.
   * Ops log is a sheet opened from the top bar (LOG).
   */
  private buildMobileShop() {
    const pad = 12;
    const boardBottom = this.boardOrigin.y + BOARD_SIZE;
    const y = boardBottom + 14;
    const w = W - pad * 2;
    const h = H - y - 28;

    const g = this.add.graphics().setDepth(10);
    drawPanel(g, pad, y, w, h, { radius: 12 });

    this.add
      .text(pad + 12, y + 10, "// ARSENAL", {
        fontFamily: FONT_DISPLAY,
        fontSize: "10px",
        color: "#a8b0d0",
        letterSpacing: 2,
      })
      .setDepth(10);

    this.shopContainer = this.add.container(pad + 8, y + 30).setDepth(10);
    // History container still needed for sheet content
    this.historyContainer = this.add.container(0, 0).setDepth(10);
    this.historyContainer.setVisible(false);

    this.buildShopItems(w - 16, true);
  }

  private buildShopItems(width: number, mobileGrid: boolean) {
    this.shopContainer.removeAll(true);
    this.shopCoinLabels = [];

    if (mobileGrid) {
      const cols = 3;
      const gap = 6;
      const cellW = (width - gap * (cols - 1)) / cols;
      const cellH = 78;

      shopItems.forEach((item, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = col * (cellW + gap);
        const y = row * (cellH + gap);
        const meta = mappings[item.id];

        const card = this.add.container(x, y);
        const bg = this.add.graphics();
        const paint = (active: boolean, disabled: boolean) => {
          bg.clear();
          bg.fillStyle(
            Theme.panelElevated,
            disabled ? 0.25 : active ? 0.95 : 0.6
          );
          bg.fillRoundedRect(0, 0, cellW, cellH, 10);
          if (active && !disabled) {
            bg.lineStyle(1.5, Theme.border, 0.7);
            bg.strokeRoundedRect(0, 0, cellW, cellH, 10);
          }
        };
        paint(false, false);

        const icon = this.add
          .image(cellW / 2, 26, meta.key)
          .setDisplaySize(34, 34);

        const name = this.add
          .text(cellW / 2, 50, item.name, {
            fontFamily: FONT_DISPLAY,
            fontSize: "9px",
            color: "#eef2ff",
            fontStyle: "600",
            align: "center",
            wordWrap: { width: cellW - 8 },
          })
          .setOrigin(0.5, 0);

        const price = this.add
          .text(cellW / 2, 66, formatPoints(item.price), {
            fontFamily: FONT_DISPLAY,
            fontSize: "10px",
            color: "#2ee6a6",
            fontStyle: "700",
          })
          .setOrigin(0.5, 0);
        this.shopCoinLabels.push(price);

        const hit = this.add
          .zone(cellW / 2, cellH / 2, cellW, cellH)
          .setOrigin(0.5)
          .setInteractive({ useHandCursor: true });

        card.add([bg, icon, name, price, hit]);

        hit.on("pointerdown", () => {
          paint(true, false);
          audio.play("click");
          this.openBuyConfirm(item.id);
        });
        hit.on("pointerup", () => {
          const can =
            !!GameState.game && GameState.game.state.coins >= item.price;
          paint(false, !can);
        });
        hit.on("pointerout", () => {
          const can =
            !!GameState.game && GameState.game.state.coins >= item.price;
          paint(false, !can);
        });

        this.shopContainer.add(card);
      });
      return;
    }

    shopItems.forEach((item, i) => {
      const rowH = 58;
      const y = i * (rowH + 4);
      const meta = mappings[item.id];

      const row = this.add.container(0, y);
      const bg = this.add.graphics();
      const paint = (hover: boolean, disabled: boolean) => {
        bg.clear();
        bg.fillStyle(Theme.panelElevated, disabled ? 0.25 : hover ? 0.9 : 0.55);
        bg.fillRoundedRect(0, 0, width, rowH, 8);
        if (hover && !disabled) {
          bg.lineStyle(1, Theme.border, 0.55);
          bg.strokeRoundedRect(0, 0, width, rowH, 8);
        }
      };
      paint(false, false);

      const icon = this.add
        .image(28, rowH / 2, meta.key)
        .setDisplaySize(40, 40);

      const name = this.add.text(54, 10, item.name, {
        fontFamily: FONT_DISPLAY,
        fontSize: "11px",
        color: "#eef2ff",
        fontStyle: "600",
      });

      const desc = this.add.text(54, 26, item.desc, {
        fontFamily: FONT_BODY,
        fontSize: "12px",
        color: "#6b7394",
        wordWrap: { width: width - 70 },
      });

      const price = this.add.text(54, 42, `${formatPoints(item.price)}`, {
        fontFamily: FONT_DISPLAY,
        fontSize: "11px",
        color: "#2ee6a6",
        fontStyle: "700",
      });
      this.shopCoinLabels.push(price);

      const coinIcon = this.add
        .image(price.x + price.width + 10, 48, "coins")
        .setDisplaySize(12, 12)
        .setOrigin(0, 0.5);

      const hit = this.add
        .zone(width / 2, rowH / 2, width, rowH)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      row.add([bg, icon, name, desc, price, coinIcon, hit]);

      hit.on("pointerover", () => {
        const can =
          !!GameState.game && GameState.game.state.coins >= item.price;
        paint(true, !can);
      });
      hit.on("pointerout", () => {
        const can =
          !!GameState.game && GameState.game.state.coins >= item.price;
        paint(false, !can);
      });
      hit.on("pointerdown", () => {
        audio.play("click");
        this.openBuyConfirm(item.id);
      });

      this.shopContainer.add(row);
    });
  }

  private buildFooterHint() {
    if (IS_MOBILE) {
      this.add
        .text(W / 2, H - 12, "Tap tile to place  ·  Corner disk swaps", {
          fontFamily: FONT_BODY,
          fontSize: "11px",
          color: "#6b7394",
        })
        .setOrigin(0.5)
        .setDepth(10);
      return;
    }
    this.add
      .text(
        W / 2,
        H - 18,
        "Click empty tile to place  ·  Top-left disk stores / swaps  ·  Match 3 to evolve",
        {
          fontFamily: FONT_BODY,
          fontSize: "13px",
          color: "#6b7394",
        }
      )
      .setOrigin(0.5)
      .setDepth(10);
  }

  /** Full-screen ops log sheet (mobile) */
  private openHistorySheet() {
    if (this.historySheetRoot) {
      this.historySheetRoot.destroy(true);
      this.historySheetRoot = null;
      return;
    }
    // Rebuild history into a temporary container
    const root = this.add.container(0, 0).setDepth(180);
    this.historySheetRoot = root;

    const dim = this.add
      .rectangle(W / 2, H / 2, W, H, Theme.void, 0.72)
      .setInteractive();
    dim.on("pointerdown", () => {
      audio.play("click");
      root.destroy(true);
      this.historySheetRoot = null;
    });

    const panelW = W - 24;
    const panelH = Math.min(H * 0.62, 480);
    const panel = this.add.container(W / 2, H / 2);
    const bg = this.add.graphics();
    drawPanel(bg, -panelW / 2, -panelH / 2, panelW, panelH, {
      fill: Theme.deep,
      fillAlpha: 0.97,
      stroke: Theme.border,
      strokeAlpha: 0.5,
      radius: 14,
    });

    const title = this.add
      .text(0, -panelH / 2 + 18, "// OPS LOG", {
        fontFamily: FONT_DISPLAY,
        fontSize: "12px",
        color: "#a8b0d0",
        letterSpacing: 2,
      })
      .setOrigin(0.5, 0);

    const list = this.add.container(-panelW / 2 + 14, -panelH / 2 + 48);
    // Temporarily point historyContainer at list for syncHistory, then restore
    const prev = this.historyContainer;
    this.historyContainer = list;
    this.historyContainer.setVisible(true);
    this.syncHistory();
    this.historyContainer = prev;

    const close = makeButton(this, 0, panelH / 2 - 28, "CLOSE", {
      width: 120,
      height: 40,
      fontSize: 12,
      variant: "secondary",
      onClick: () => {
        audio.play("click");
        root.destroy(true);
        this.historySheetRoot = null;
      },
    });

    // Block clicks on panel body
    const block = this.add
      .rectangle(0, 0, panelW, panelH - 60, 0x000000, 0.001)
      .setInteractive();

    panel.add([bg, block, title, list, close]);
    root.add([dim, panel]);
  }

  // ─── State sync ────────────────────────────────────────────────

  private onStateChange() {
    // Unlock-only ticks clear lastEvents — skip board juice / full resync churn
    const hasJuice = GameState.lastEvents.length > 0;
    const wasBusy = this.busyLock;
    this.busyLock = GameState.isUpdating;

    if (hasJuice || !wasBusy) {
      this.syncBoard(false);
      this.syncHud();
      this.syncHistory();
      this.syncShopAfford();
    } else {
      // Quiet unlock: HUD afford only
      this.syncShopAfford();
    }

    if (hasJuice) this.playEventJuice();

    if (GameState.isGameDone) {
      this.time.delayedCall(400, () => this.openGameOver());
    }
  }

  private syncHud() {
    const g = GameState.game;
    if (!g) return;

    const pts = g.state.points;
    if (pts !== this.lastPoints) {
      this.scoreText.setText(formatPoints(pts));
      this.tweens.killTweensOf(this.scoreText);
      this.scoreText.setScale(1);
      this.tweens.add({
        targets: this.scoreText,
        scaleX: 1.12,
        scaleY: 1.12,
        duration: 100,
        yoyo: true,
        onComplete: () => this.scoreText.setScale(1),
      });
      // floating +score
      if (pts > this.lastPoints) {
        const delta = pts - this.lastPoints;
        const floater = this.add
          .text(this.scoreText.x + 40, this.scoreText.y, `+${formatPoints(delta)}`, {
            fontFamily: FONT_DISPLAY,
            fontSize: "14px",
            color: "#ffc857",
            fontStyle: "700",
          })
          .setDepth(50);
        this.tweens.add({
          targets: floater,
          y: floater.y - 28,
          alpha: 0,
          duration: 800,
          ease: "Cubic.easeOut",
          onComplete: () => floater.destroy(),
        });
      }
      this.lastPoints = pts;
    } else {
      this.scoreText.setText(formatPoints(pts));
    }

    this.coinsText.setText(formatPoints(g.state.coins));

    const cur = g.state.currentPiece;
    const meta = mappings[cur.id];
    this.holdingName.setText(meta?.name ?? cur.name);
    if (meta) {
      // Normal droid → idle frame 1 (portrait); everything else square piece art
      const key =
        cur.id === PieceEnum.BEAR ? DROID_TEX.idle1 : meta.key;
      this.holdingImg.setTexture(key).setVisible(true);
      this.fitHudIcon(this.holdingImg, key, 36, 44);
      this.deployImg.setTexture(key);
      this.fitHudIcon(this.deployImg, key, 26, 32);
      this.deployName.setText(meta.name);
    }

    const next = cur.nextTierPiece;
    if (next) {
      const nm = mappings[next.id];
      this.nextName.setText(nm?.name ?? next.name);
      if (nm) this.nextImg.setTexture(nm.key).setVisible(true);
    } else {
      this.nextName.setText("—");
      this.nextImg.setVisible(false);
    }
  }

  private syncShop() {
    this.syncShopAfford();
  }

  private syncShopAfford() {
    const coins = GameState.game?.state.coins ?? 0;
    shopItems.forEach((item, i) => {
      const label = this.shopCoinLabels[i];
      if (!label) return;
      const can = coins >= item.price;
      label.setColor(can ? "#2ee6a6" : "#ff5c8a");
    });
  }

  private syncHistory() {
    if (!this.historyContainer) return;
    this.historyContainer.removeAll(true);
    const entries = GameState.history.slice(0, IS_MOBILE ? 14 : 12);
    const wrapW = IS_MOBILE ? W - 70 : 200;
    const colors: Record<string, string> = {
      match: "#2ee6a6",
      combo: "#ffc857",
      buy: "#b8a6ff",
      boom: "#ff5c8a",
      default: "#a8b0d0",
    };

    if (entries.length === 0) {
      this.historyContainer.add(
        this.add.text(4, 8, "No ops yet — place your first piece.", {
          fontFamily: FONT_BODY,
          fontSize: "13px",
          color: "#6b7394",
          wordWrap: { width: wrapW },
        })
      );
      return;
    }

    entries.forEach((e, i) => {
      const y = i * 28;
      const bar = this.add.graphics();
      const col = Phaser.Display.Color.HexStringToColor(colors[e.kind] || "#a8b0d0");
      bar.fillStyle(col.color, 0.9);
      bar.fillRect(0, y + 4, 3, 18);

      const t = this.add.text(10, y + 4, e.text, {
        fontFamily: FONT_BODY,
        fontSize: "13px",
        color: colors[e.kind] || "#a8b0d0",
        wordWrap: { width: wrapW },
      });

      // tiny piece icons
      if (e.pieceIds?.length) {
        e.pieceIds.slice(0, 3).forEach((pid, pi) => {
          const key = mappings[pid]?.key;
          if (!key) return;
          const img = this.add
            .image(t.width + 18 + pi * 18, y + 12, key)
            .setDisplaySize(16, 16);
          this.historyContainer.add(img);
        });
      }

      this.historyContainer.add([bar, t]);
    });
  }

  private cellCenter(x: number, y: number, pieceId?: PieceEnum) {
    const stand =
      pieceId === PieceEnum.BEAR ? DROID_STAND_OFFSET_Y : 0;
    return {
      x: this.boardOrigin.x + x * CELL + CELL / 2,
      y: this.boardOrigin.y + y * CELL + CELL / 2 - stand,
    };
  }

  private syncBoard(initial: boolean) {
    const g = GameState.game;
    if (!g) return;

    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const piece = g.state.board[y][x];
        const isStorage = x === 0 && y === 0;
        const isDroid =
          piece.id === PieceEnum.BEAR || piece.id === PieceEnum.NINJA_BEAR;

        if (isStorage) {
          const swap = g.state.swapPiece;
          if (swap) {
            const key = mappings[swap.id]?.key ?? "piece-empty";
            if (!this.storageImg) {
              const c = this.cellCenter(0, 0);
              this.storageImg = this.add
                .image(c.x, c.y, key)
                .setDisplaySize(CELL * 0.72, CELL * 0.72)
                .setDepth(9);
              this.pieceLayer.add(this.storageImg);
            } else {
              this.storageImg.setTexture(key).setVisible(true);
              // Keep correct display size after texture swap
              this.storageImg.setDisplaySize(CELL * 0.72, CELL * 0.72);
            }
          } else if (this.storageImg) {
            this.storageImg.setVisible(false);
          }
          this.clearPieceSprite(x, y);
          continue;
        }

        if (isDroid) {
          // Droids owned exclusively by reconcileDroids
          this.clearPieceSprite(x, y);
          continue;
        }

        if (piece.id === PieceEnum.EMPTY) {
          this.clearPieceSprite(x, y);
          continue;
        }

        this.setPieceSprite(x, y, piece.id, initial);
      }
    }

    this.reconcileDroids(initial);
    this.updateHighlights();
  }

  private clearPieceSprite(x: number, y: number) {
    const s = this.pieceSprites[y][x];
    if (!s) return;
    this.tweens.killTweensOf(s);
    this.pieceSprites[y][x] = null;
    this.tweens.add({
      targets: s,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 140,
      onComplete: () => {
        if (s.active) s.destroy();
      },
    });
  }

  /**
   * Create or update a board piece sprite.
   * IMPORTANT: setDisplaySize then tween scaleX/Y from 0 → 1 so final size
   * stays at the intended display size (never scale:1 after setDisplaySize alone
   * is wrong if native texture ≠ display size — but scale:0 → scale:1 after
   * setDisplaySize multiplies the display size, which is correct ONLY if we
   * tween relative to the post-setDisplaySize scale. Phaser setDisplaySize sets
   * scaleX/Y to display/native; setScale(0) zeros that, then setScale(1) resets
   * to 1× native texture — which is the permanent enlarge bug. Fix: capture
   * target scale after setDisplaySize and tween back to that.
   */
  private setPieceSprite(
    x: number,
    y: number,
    id: PieceEnum,
    initial: boolean
  ) {
    const key = mappings[id]?.key;
    if (!key) return;
    const c = this.cellCenter(x, y);
    const existing = this.pieceSprites[y][x];

    if (existing && existing.pieceId === id) {
      // Snap size in case a previous tween was interrupted
      this.tweens.killTweensOf(existing);
      existing.setDisplaySize(this.pieceDisplay, this.pieceDisplay);
      existing.setPosition(c.x, c.y);
      existing.setAlpha(1);
      return;
    }

    if (existing) {
      this.tweens.killTweensOf(existing);
      this.pieceSprites[y][x] = null;
      this.tweens.add({
        targets: existing,
        scaleX: 0,
        scaleY: 0,
        alpha: 0,
        duration: 100,
        onComplete: () => {
          if (existing.active) existing.destroy();
        },
      });
      this.spawnBurst(c.x, c.y, Theme.cyan);
    }

    const img = this.add
      .image(c.x, c.y, key)
      .setDisplaySize(this.pieceDisplay, this.pieceDisplay)
      .setDepth(9) as PieceSprite;
    img.cellX = x;
    img.cellY = y;
    img.pieceId = id;
    this.pieceLayer.add(img);
    this.pieceSprites[y][x] = img;

    if (!initial) {
      const tx = img.scaleX;
      const ty = img.scaleY;
      img.setScale(0);
      img.setAlpha(0);
      this.tweens.add({
        targets: img,
        scaleX: tx,
        scaleY: ty,
        alpha: 1,
        duration: 240,
        ease: "Back.easeOut",
      });
    }
  }

  private makeDroidActor(x: number, y: number, id: PieceEnum): DroidActor {
    // Normal droid stands slightly above cell center (feet on tile)
    const c = this.cellCenter(x, y, id);
    const isNormal = id === PieceEnum.BEAR;
    const tex = isNormal
      ? this.textures.exists(DROID_TEX.idle1)
        ? DROID_TEX.idle1
        : DROID_TEX.static
      : DROID_TEX.ninja;

    const sprite = this.add.sprite(c.x, c.y, tex).setDepth(10);

    const actor: DroidActor = {
      sprite,
      pieceId: id,
      cellX: x,
      cellY: y,
      hopping: false,
      isNormal,
    };

    // Frames have different native sizes — re-fit after every texture swap / anim frame
    if (isNormal) {
      sprite.on(Phaser.Animations.Events.ANIMATION_UPDATE, () => {
        if (sprite.active) this.fitDroid(sprite, true);
      });
    }

    // Size once before facing so flip isn't lost
    this.fitDroid(sprite, isNormal);
    faceTowardCenter(sprite, c.x, this.boardCenterX());
    if (isNormal) playIdle(actor);
    return actor;
  }

  /**
   * Size a droid sprite for the board cell.
   * - Normal droid frames are portrait (~2:3) — preserve aspect, fit inside cell.
   * - Ninja / fallback stay square like other pieces.
   */
  private fitDroid(sprite: Phaser.GameObjects.Sprite, preserveAspect: boolean) {
    const flipX = sprite.flipX;
    const maxH = CELL * 0.92;
    const maxW = CELL * 0.88;

    if (!preserveAspect) {
      sprite.setDisplaySize(this.pieceDisplay, this.pieceDisplay);
      sprite.setFlipX(flipX);
      return;
    }

    const frame = sprite.frame;
    const nw = frame.realWidth || frame.width || 1;
    const nh = frame.realHeight || frame.height || 1;
    const scale = Math.min(maxW / nw, maxH / nh);
    sprite.setDisplaySize(nw * scale, nh * scale);
    sprite.setFlipX(flipX);
  }

  private hopDroid(
    actor: DroidActor,
    from: { x: number; y: number },
    to: { x: number; y: number }
  ) {
    const sprite = actor.sprite;
    const dest = this.cellCenter(to.x, to.y, actor.pieceId);
    const startX = sprite.x;
    const startY = sprite.y;

    this.tweens.killTweensOf(sprite);
    // Also kill any hop proxy still attached via data
    const prevProxy = sprite.getData("hopProxy") as { t: number } | undefined;
    if (prevProxy) this.tweens.killTweensOf(prevProxy);

    actor.hopping = true;
    actor.cellX = to.x;
    actor.cellY = to.y;

    faceJumpDirection(sprite, startX, dest.x, this.boardCenterX());

    if (actor.isNormal) {
      setJumpFrame(actor, "jump");
      this.fitDroid(sprite, true);
    }

    const hop = { t: 0 };
    sprite.setData("hopProxy", hop);
    let landed = false;

    this.tweens.add({
      targets: hop,
      t: 1,
      duration: 400,
      ease: "Sine.easeInOut",
      onUpdate: () => {
        if (!sprite.active) return;
        const t = hop.t;
        sprite.x = Phaser.Math.Linear(startX, dest.x, t);
        sprite.y =
          Phaser.Math.Linear(startY, dest.y, t) - Math.sin(t * Math.PI) * 18;

        // Second half of jump → landing frame
        if (actor.isNormal && !landed && t >= 0.5) {
          landed = true;
          setJumpFrame(actor, "land");
          this.fitDroid(sprite, true);
        }
      },
      onComplete: () => {
        if (!sprite.active) return;
        sprite.setPosition(dest.x, dest.y);
        actor.hopping = false;
        sprite.setData("hopProxy", null);
        // After landing, face board center and resume idle
        faceTowardCenter(sprite, dest.x, this.boardCenterX());
        if (actor.isNormal) {
          playIdle(actor);
          this.fitDroid(sprite, true);
        }
      },
    });

    void from; // used for API clarity / future trail FX
  }

  private reconcileDroids(initial: boolean) {
    const g = GameState.game;
    if (!g) return;

    const desired = new Map<string, PieceEnum>();
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const p = g.state.board[y][x];
        if (p.id === PieceEnum.BEAR || p.id === PieceEnum.NINJA_BEAR) {
          desired.set(`${x},${y}`, p.id);
        }
      }
    }

    const moves =
      (!initial && g.state.events[0]?.filter((e) => e.type === "bear-move")) ||
      [];

    const movedTo = new Set<string>();

    for (const m of moves) {
      if (m.type !== "bear-move") continue;
      const fromKey = `${m.from.x},${m.from.y}`;
      const toKey = `${m.to.x},${m.to.y}`;

      let actor = this.droids.get(fromKey);
      if (!actor || !actor.sprite.active) {
        actor = this.droids.get(toKey);
      }
      if (!actor || !actor.sprite.active) {
        actor = this.makeDroidActor(m.from.x, m.from.y, m.piece);
      }

      this.droids.delete(fromKey);
      const occupant = this.droids.get(toKey);
      if (occupant && occupant !== actor) {
        this.tweens.killTweensOf(occupant.sprite);
        destroyActor(occupant);
      }
      this.droids.set(toKey, actor);
      movedTo.add(toKey);

      this.hopDroid(actor, m.from, m.to);
    }

    // Spawn any desired droids not yet represented
    for (const [key, pid] of desired) {
      const existing = this.droids.get(key);
      if (existing) {
        if (!existing.sprite.active) {
          this.droids.delete(key);
        } else {
          // Keep idle going for normals that aren't mid-hop
          if (existing.isNormal && !existing.hopping) {
            playIdle(existing);
            faceTowardCenter(
              existing.sprite,
              existing.sprite.x,
              this.boardCenterX()
            );
          }
          continue;
        }
      }
      const [xs, ys] = key.split(",");
      const x = Number(xs);
      const y = Number(ys);
      const actor = this.makeDroidActor(x, y, pid);
      if (!initial && !movedTo.has(key)) {
        const { sprite } = actor;
        const tx = sprite.scaleX;
        const ty = sprite.scaleY;
        sprite.setScale(0);
        this.tweens.add({
          targets: sprite,
          scaleX: tx,
          scaleY: ty,
          duration: 240,
          ease: "Back.easeOut",
        });
      }
      this.droids.set(key, actor);
    }

    // Remove actors no longer on the board
    for (const [key, actor] of [...this.droids.entries()]) {
      if (desired.has(key)) continue;
      this.tweens.killTweensOf(actor.sprite);
      const proxy = actor.sprite.getData("hopProxy") as
        | { t: number }
        | undefined;
      if (proxy) this.tweens.killTweensOf(proxy);
      this.droids.delete(key);
      const [xs, ys] = key.split(",");
      const c = this.cellCenter(
        Number(xs),
        Number(ys),
        actor.pieceId
      );
      this.spawnBurst(c.x, c.y + DROID_STAND_OFFSET_Y * 0.3, Theme.rose);
      const { sprite } = actor;
      this.tweens.add({
        targets: sprite,
        scaleX: 0,
        scaleY: 0,
        alpha: 0,
        duration: 180,
        onComplete: () => destroyActor(actor),
      });
    }
  }

  private updateHighlights() {
    const g = GameState.game;
    if (!g) return;
    const cur = g.state.currentPiece.id;
    const selected = GameState.selectedCells;

    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const hl = this.cellHighlights[y][x];
        let alpha = 0;
        let color: number = Theme.cyan;

        const isSel = selected.some(([sx, sy]) => sx === x && sy === y);
        if (isSel) {
          alpha = 0.35;
          color = Theme.purple;
        }

        if (this.hovered && cur === PieceEnum.BOMB) {
          if (this.hovered.x === x && this.hovered.y === y) {
            alpha = 0.4;
            color = Theme.rose;
          }
        }
        if (this.hovered && cur === PieceEnum.MEGA_BOMB) {
          const dx = x - this.hovered.x;
          const dy = y - this.hovered.y;
          if (dx >= 0 && dx <= 1 && dy >= 0 && dy <= 1) {
            alpha = 0.35;
            color = Theme.rose;
          }
        }

        hl.setFillStyle(color, alpha);
        if (alpha > 0) hl.setStrokeStyle(1.5, color, 0.7);
        else hl.setStrokeStyle(0, color, 0);
      }
    }
  }

  private spawnBurst(x: number, y: number, color: number) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const p = this.add
        .circle(x, y, 3, color, 0.9)
        .setDepth(30);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(a) * 28,
        y: y + Math.sin(a) * 28,
        alpha: 0,
        scale: 0.2,
        duration: 320,
        ease: "Cubic.easeOut",
        onComplete: () => p.destroy(),
      });
    }
  }

  private playEventJuice() {
    const events = GameState.lastEvents;
    if (!events.length) return;

    const hasCondense = events.some((e) => e.type === "condense");
    const hasDestroy = events.some(
      (e) => e.type === "destroy" || e.type === "transform" || e.type === "miss"
    );

    if (hasCondense) {
      audio.play("merge");
      // Local board pulse only — no full-screen green flash
      this.pulseBoard();
    } else if (hasDestroy) {
      audio.play("explosion");
      this.cameras.main.shake(80, 0.003);
    }
  }

  /** Soft cyan ring around the board on match — stays local, never blinds the UI */
  private pulseBoard() {
    const { x, y } = this.boardOrigin;
    const ring = this.add.graphics().setDepth(6);
    ring.lineStyle(3, Theme.cyan, 0.7);
    ring.strokeRoundedRect(x - 4, y - 4, BOARD_SIZE + 8, BOARD_SIZE + 8, 14);
    ring.setAlpha(0.85);
    this.tweens.add({
      targets: ring,
      alpha: 0,
      duration: 380,
      ease: "Cubic.easeOut",
      onComplete: () => ring.destroy(),
    });
  }

  // ─── Input ─────────────────────────────────────────────────────

  private onCellClick(x: number, y: number) {
    const g = GameState.game;
    if (!g || this.busyLock) return;
    audio.play("click");

    if (x === 0 && y === 0) {
      const res = GameState.swap();
      if (!res.valid && res.error && res.error !== "Busy") {
        showToast(this, res.error, "error");
        audio.play("error");
      }
      return;
    }

    const isEmpty = g.state.board[y][x].id === PieceEnum.EMPTY;
    const cur = g.state.currentPiece.id;

    switch (cur) {
      case PieceEnum.AIRDROPPER: {
        if (GameState.selectedCells.length === 0 && !isEmpty) {
          GameState.selectCell(x, y);
          showToast(this, "Select empty destination", "info");
        } else if (GameState.selectedCells.length === 1) {
          const res = GameState.use(PieceEnum.AIRDROPPER, {
            target: GameState.selectedCells[0],
            dest: [x, y],
          });
          if (!res.valid && res.error) {
            showToast(this, res.error, "error");
            audio.play("error");
            GameState.clearSelection();
          }
        }
        break;
      }
      case PieceEnum.TELEPORT_PORTAL: {
        if (isEmpty) break;
        if (GameState.selectedCells.length === 0) {
          GameState.selectCell(x, y);
          showToast(this, "Select second piece to swap", "info");
        } else {
          const res = GameState.use(PieceEnum.TELEPORT_PORTAL, {
            posA: GameState.selectedCells[0],
            posB: [x, y],
          });
          if (!res.valid && res.error) {
            showToast(this, res.error, "error");
            audio.play("error");
            GameState.clearSelection();
          }
        }
        break;
      }
      case PieceEnum.MEGA_BOMB: {
        const res = GameState.use(PieceEnum.MEGA_BOMB, { pos: [x, y] });
        if (!res.valid && res.error) {
          showToast(this, res.error, "error");
          audio.play("error");
        }
        break;
      }
      case PieceEnum.BOMB: {
        const res = GameState.use(PieceEnum.BOMB, { pos: [x, y] });
        if (!res.valid && res.error) {
          showToast(this, res.error, "error");
          audio.play("error");
        }
        break;
      }
      default: {
        if (isEmpty || cur === PieceEnum.ROBOT) {
          const res = GameState.put(x, y);
          if (!res.valid && res.error && res.error !== "Busy") {
            showToast(this, res.error, "error");
            audio.play("error");
          }
        }
        break;
      }
    }
  }

  // ─── Modals ────────────────────────────────────────────────────

  private closeModal() {
    if (this.modalRoot) {
      this.modalRoot.destroy(true);
      this.modalRoot = null;
    }
    this.guidesOpen = false;
  }

  private openBuyConfirm(pieceId: number) {
    const item = shopItems.find((s) => s.id === pieceId);
    if (!item || !GameState.game) return;
    this.closeModal();

    const root = this.add.container(0, 0).setDepth(200);
    this.modalRoot = root;

    const dim = this.add
      .rectangle(W / 2, H / 2, W, H, Theme.void, 0.72)
      .setInteractive();
    dim.on("pointerdown", () => {
      audio.play("click");
      this.closeModal();
    });

    const cardW = IS_MOBILE ? Math.min(W - 32, 340) : 360;
    const cardH = IS_MOBILE ? 300 : 280;
    const card = this.add.container(W / 2, H / 2);
    const bg = this.add.graphics();
    drawPanel(bg, -cardW / 2, -cardH / 2, cardW, cardH, {
      fill: Theme.panelElevated,
      fillAlpha: 0.98,
      stroke: Theme.border,
      strokeAlpha: 0.6,
      radius: 16,
    });
    bg.lineStyle(2, Theme.purple, 0.8);
    bg.lineBetween(-cardW / 2 + 20, -cardH / 2, cardW / 2 - 20, -cardH / 2);

    const meta = mappings[item.id];
    const icon = this.add
      .image(0, -70, meta.key)
      .setDisplaySize(IS_MOBILE ? 64 : 72, IS_MOBILE ? 64 : 72);

    const title = this.add
      .text(0, -20, item.name.toUpperCase(), {
        fontFamily: FONT_DISPLAY,
        fontSize: IS_MOBILE ? "14px" : "16px",
        color: "#eef2ff",
        fontStyle: "700",
      })
      .setOrigin(0.5);

    const body = this.add
      .text(
        0,
        20,
        `Spend ${formatPoints(item.price)} coins?\nThis replaces the piece you are holding.`,
        {
          fontFamily: FONT_BODY,
          fontSize: IS_MOBILE ? "15px" : "16px",
          color: "#a8b0d0",
          align: "center",
          lineSpacing: 4,
          wordWrap: { width: cardW - 40 },
        }
      )
      .setOrigin(0.5);

    card.add([bg, icon, title, body]);

    const btnY = cardH / 2 - 48;
    const cancel = makeButton(this, -70, btnY, "CANCEL", {
      width: IS_MOBILE ? 120 : 110,
      height: IS_MOBILE ? 44 : 38,
      fontSize: 11,
      variant: "secondary",
      onClick: () => {
        audio.play("click");
        this.closeModal();
      },
    });
    const confirm = makeButton(this, 70, btnY, "DEPLOY", {
      width: IS_MOBILE ? 120 : 110,
      height: IS_MOBILE ? 44 : 38,
      fontSize: 11,
      variant: "success",
      onClick: () => {
        const res = GameState.buy(pieceId);
        if (!res.valid) {
          showToast(this, res.error || "Cannot buy", "error");
          audio.play("error");
        } else {
          audio.play("buy");
          if (
            pieceId === PieceEnum.REROLL_BOX ||
            pieceId === PieceEnum.TERRAFORMER
          ) {
            this.time.delayedCall(50, () => GameState.use(pieceId));
          }
        }
        this.closeModal();
      },
    });
    card.add([cancel, confirm]);

    root.add([dim, card]);
    card.setScale(0.9);
    card.setAlpha(0);
    this.tweens.add({
      targets: card,
      scale: 1,
      alpha: 1,
      duration: 220,
      ease: "Back.easeOut",
    });
  }

  private openGameOver() {
    if (this.modalRoot) return;
    const g = GameState.game;
    if (!g) return;

    const root = this.add.container(0, 0).setDepth(200);
    this.modalRoot = root;

    const dim = this.add.rectangle(W / 2, H / 2, W, H, Theme.void, 0.75);
    const cardW = IS_MOBILE ? Math.min(W - 28, 360) : 400;
    const cardH = IS_MOBILE ? 340 : 320;
    const card = this.add.container(W / 2, H / 2);
    const bg = this.add.graphics();
    drawPanel(bg, -cardW / 2, -cardH / 2, cardW, cardH, {
      fill: Theme.panelElevated,
      fillAlpha: 0.98,
      stroke: Theme.border,
      strokeAlpha: 0.65,
      radius: 18,
    });

    const title = this.add
      .text(0, -cardH / 2 + 36, "MISSION OVER", {
        fontFamily: FONT_DISPLAY,
        fontSize: IS_MOBILE ? "18px" : "22px",
        color: "#eef2ff",
        fontStyle: "800",
      })
      .setOrigin(0.5);

    const label = this.add
      .text(0, -cardH / 2 + 78, "FINAL SCORE", {
        fontFamily: FONT_DISPLAY,
        fontSize: "11px",
        color: "#6b7394",
        letterSpacing: 3,
      })
      .setOrigin(0.5);

    const score = this.add
      .text(0, -10, formatPoints(g.state.points), {
        fontFamily: FONT_DISPLAY,
        fontSize: IS_MOBILE ? "36px" : "42px",
        color: "#ffc857",
        fontStyle: "800",
      })
      .setOrigin(0.5);

    const blurb = this.add
      .text(
        0,
        55,
        "The board is sealed. Droids hold the last free tiles.\nRally your credits and try again, commander.",
        {
          fontFamily: FONT_BODY,
          fontSize: IS_MOBILE ? "14px" : "15px",
          color: "#a8b0d0",
          align: "center",
          lineSpacing: 4,
          wordWrap: { width: cardW - 36 },
        }
      )
      .setOrigin(0.5);

    const again = makeButton(this, 0, cardH / 2 - 42, "RELAUNCH", {
      width: IS_MOBILE ? 200 : 180,
      height: IS_MOBILE ? 50 : 46,
      fontSize: 14,
      variant: "primary",
      onClick: () => {
        audio.play("start");
        this.closeModal();
        GameState.newGame();
        this.scene.restart();
      },
    });

    card.add([bg, title, label, score, blurb, again]);
    root.add([dim, card]);
    card.setScale(0.85).setAlpha(0);
    this.tweens.add({
      targets: card,
      scale: 1,
      alpha: 1,
      duration: 320,
      ease: "Back.easeOut",
    });
  }

  private openGuides() {
    if (this.guidesOpen) return;
    this.closeModal();
    this.guidesOpen = true;

    const root = this.add.container(0, 0).setDepth(200);
    this.modalRoot = root;

    const dim = this.add
      .rectangle(W / 2, H / 2, W, H, Theme.void, 0.78)
      .setInteractive();
    dim.on("pointerdown", () => {
      audio.play("click");
      this.closeModal();
    });

    const howTo = [
      "Tripod is a match-3 city builder. Place the piece you hold onto an empty tile.",
      "Match 3 of a kind (orthogonally) to merge into the next tier. Match 4+ for a super-tier piece.",
      "",
      "CORE LOOP",
      "• Plants → buildings → Galaxy Fortress",
      "• Corner disk = storage / swap",
      "• Droids roam each turn — trap them for shards",
      "• Spend credits in the Arsenal",
      "• Game ends when the board is full",
      "",
      "POWER-UPS",
      "• Airdropper — clone a piece",
      "• Reroll Box — new random piece",
      "• Teleport Portal — swap two tiles",
      "• Terraformer — clear all marbles",
      "• Mega / Mini Bomb — blast zones",
      "",
      "TIPS",
      "• Mimic Slime copies neighbors to force merges",
      "• Unstable Bomb has 50% miss chance",
      "• Combos multiply your score — chain merges",
    ];

    const objects = [
      "PLANTS",
      "Glitteroot Bud → Shrub → Glitteroot",
      "",
      "BUILDINGS",
      "Pod → Shelter → Condo",
      "Apartment → Soaring Tower → Galaxy Fortress",
      "",
      "ENEMIES",
      "Droid — steps to adjacent empty tile",
      "Rocket Droid — warps to any empty tile",
      "",
      "TREASURES",
      "Scarlet Shard → Energy Stone → Reactor",
      "Marble → Chunk → Loot Chest → Cybercore",
      "",
      "Tap outside or Close to return.",
    ];

    if (IS_MOBILE) {
      // Single tall panel — combined manual
      const panelW = W - 24;
      const panelH = H - 80;
      const panel = this.makeGuidePanel(
        W / 2,
        H / 2 - 10,
        panelW,
        panelH,
        "FIELD MANUAL",
        [...howTo, "", "— OBJECTS —", "", ...objects],
        IS_MOBILE ? 12 : 14
      );
      const close = makeButton(
        this,
        W / 2,
        H - 28,
        "CLOSE",
        {
          width: 160,
          height: 44,
          fontSize: 12,
          variant: "secondary",
          onClick: () => {
            audio.play("click");
            this.closeModal();
          },
        }
      );
      root.add([dim, panel, close]);
      return;
    }

    const panelW = 520;
    const panelH = 560;
    const left = this.makeGuidePanel(
      W / 2 - panelW / 2 - 12,
      H / 2,
      panelW,
      panelH,
      "HOW TO PLAY",
      howTo
    );

    const right = this.makeGuidePanel(
      W / 2 + panelW / 2 + 12,
      H / 2,
      panelW,
      panelH,
      "THE OBJECTS",
      objects
    );

    const close = makeButton(this, W / 2, H / 2 + panelH / 2 + 28, "CLOSE MANUAL", {
      width: 180,
      height: 40,
      fontSize: 11,
      variant: "secondary",
      onClick: () => {
        audio.play("click");
        this.closeModal();
      },
    });

    root.add([dim, left, right, close]);
  }

  private makeGuidePanel(
    x: number,
    y: number,
    w: number,
    h: number,
    title: string,
    lines: string[],
    bodySize = 14
  ) {
    const c = this.add.container(x, y);
    const bg = this.add.graphics();
    drawPanel(bg, -w / 2, -h / 2, w, h, {
      fill: Theme.deep,
      fillAlpha: 0.96,
      stroke: Theme.border,
      strokeAlpha: 0.5,
      radius: 14,
    });

    const t = this.add
      .text(0, -h / 2 + 18, title, {
        fontFamily: FONT_DISPLAY,
        fontSize: IS_MOBILE ? "12px" : "14px",
        color: "#2ee6a6",
        fontStyle: "700",
        letterSpacing: 2,
      })
      .setOrigin(0.5, 0);

    const body = this.add
      .text(-w / 2 + 16, -h / 2 + 44, lines.join("\n"), {
        fontFamily: FONT_BODY,
        fontSize: `${bodySize}px`,
        color: "#a8b0d0",
        lineSpacing: IS_MOBILE ? 3 : 5,
        wordWrap: { width: w - 32 },
      })
      .setOrigin(0, 0);

    // Clip overflowing body on small screens
    if (body.height > h - 56) {
      const maskG = this.make.graphics({ x: 0, y: 0 });
      maskG.fillStyle(0xffffff);
      maskG.fillRect(x - w / 2 + 12, y - h / 2 + 40, w - 24, h - 52);
      body.setMask(maskG.createGeometryMask());
    }

    c.add([bg, t, body]);
    const block = this.add
      .rectangle(0, 0, w, h, 0x000000, 0.001)
      .setInteractive();
    c.add(block);
    return c;
  }
}
