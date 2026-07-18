import {
  Data,
  Game,
  PieceEnum,
  type Event,
} from "triple-pod-game-engine";
import { shopItems } from "../constants/shopItems";

export type HistoryEntry = {
  kind: "match" | "combo" | "buy" | "boom" | "default";
  text: string;
  pieceIds?: PieceEnum[];
};

/**
 * Thin wrapper around the triple-pod engine.
 * Scenes talk only to this singleton — never construct Game themselves.
 */
class GameStateManager {
  game: Game | null = null;
  selectedCells: number[][] = [];
  isUpdating = false;
  isGameDone = false;
  history: HistoryEntry[] = [];
  lastEvents: Event[] = [];

  private overclick = 0;
  private listeners = new Set<() => void>();

  onChange(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    this.listeners.forEach((fn) => fn());
  }

  newGame() {
    this.game = new Game();
    this.game.start();
    this.selectedCells = [];
    this.isUpdating = false;
    this.isGameDone = false;
    this.history = [];
    this.lastEvents = [];
    this.overclick = 0;
    this.emit();
  }

  private pushHistory(entry: HistoryEntry) {
    this.history.unshift(entry);
    if (this.history.length > 40) this.history.length = 40;
  }

  private describeLastMove(data: Data) {
    if (!this.game) return;
    const events = this.game.state.events[0] || [];
    this.lastEvents = events;

    const condenses = events.filter((e) => e.type === "condense");
    const destroy = events.find(
      (e) => e.type === "destroy" || e.type === "transform"
    );
    const isMiss = events.some((e) => e.type === "miss");
    const isCombo = condenses.length > 1;
    const isMatch = condenses.length > 0;

    switch (data.type) {
      case "put": {
        if (isMiss) {
          this.pushHistory({
            kind: "boom",
            text: `Unstable bomb missed at (${data.x},${data.y})`,
          });
        } else if (destroy?.type === "destroy") {
          this.pushHistory({
            kind: "boom",
            text: `Boom — destroyed piece at (${data.x},${data.y})`,
            pieceIds: destroy.pieces,
          });
        } else if (
          destroy?.type === "transform" &&
          (destroy.from === PieceEnum.BEAR ||
            destroy.from === PieceEnum.NINJA_BEAR) &&
          destroy.to === PieceEnum.TOMB
        ) {
          this.pushHistory({
            kind: "boom",
            text: "Bullseye! A droid was taken down",
          });
        } else if (isMatch) {
          const chain = condenses
            .filter((e): e is Extract<Event, { type: "condense" }> => e.type === "condense")
            .map((e) => e.to);
          this.pushHistory({
            kind: isCombo ? "combo" : "match",
            text: isCombo
              ? `Combo!! (${data.x},${data.y})`
              : `Match! (${data.x},${data.y})`,
            pieceIds: chain,
          });
        } else {
          this.pushHistory({
            kind: "default",
            text: `Placed (${data.x},${data.y})`,
          });
        }
        break;
      }
      case "buy":
        this.pushHistory({
          kind: "buy",
          text: `Bought ${data.piece.name}`,
          pieceIds: [data.piece.id],
        });
        break;
      case "swap":
        this.pushHistory({ kind: "default", text: "Swapped storage" });
        break;
      case "use": {
        switch (data.pieceId) {
          case PieceEnum.AIRDROPPER:
            this.pushHistory({
              kind: "buy",
              text: `Airdrop at (${data.params.dest[0]},${data.params.dest[1]})`,
            });
            break;
          case PieceEnum.REROLL_BOX:
            this.pushHistory({
              kind: "buy",
              text: `Rerolled → ${this.game.state.currentPiece.name}`,
            });
            break;
          case PieceEnum.TELEPORT_PORTAL:
            this.pushHistory({
              kind: "buy",
              text: `Teleported (${data.params.posA[0]},${data.params.posA[1]}) ↔ (${data.params.posB[0]},${data.params.posB[1]})`,
            });
            break;
          case PieceEnum.TERRAFORMER:
            this.pushHistory({
              kind: "boom",
              text: "Terraformer wiped all marbles",
            });
            break;
          case PieceEnum.MEGA_BOMB:
            this.pushHistory({
              kind: "boom",
              text: `Mega Bomb 2×2 at (${data.params.pos[0]},${data.params.pos[1]})`,
            });
            break;
          case PieceEnum.BOMB:
            this.pushHistory({
              kind: "boom",
              text: `Mini Bomb at (${data.params.pos[0]},${data.params.pos[1]})`,
            });
            break;
        }
        break;
      }
    }
  }

  next(data: Data, delayMs = 280): { valid: boolean; error: string | null } {
    if (!this.game) return { valid: false, error: "No game" };
    if (this.isUpdating) {
      this.overclick += 1;
      if (this.overclick > 2) {
        this.overclick = 0;
        return { valid: false, error: "Easy there, commander — slow down!" };
      }
      return { valid: false, error: "Busy" };
    }

    const res = this.game.nextState(data);
    if (res.valid) {
      this.isUpdating = true;
      this.describeLastMove(data);
      if (this.game.done) this.isGameDone = true;
      // Single emit for board/UI refresh — unlock later without re-syncing board juice
      this.emit();
      window.setTimeout(() => {
        this.isUpdating = false;
        // Quiet unlock: only notify listeners that input is free (no new events)
        this.lastEvents = [];
        this.emit();
      }, delayMs);
    }
    return { valid: res.valid, error: res.error ?? null };
  }

  put(x: number, y: number) {
    return this.next({ type: "put", x, y });
  }

  swap() {
    return this.next({ type: "swap" });
  }

  buy(pieceId: number) {
    const item = shopItems.find((s) => s.id === pieceId);
    if (!item || !this.game) return { valid: false, error: "Unknown item" };
    if (this.game.state.coins < item.price) {
      return { valid: false, error: "Not enough coins!" };
    }
    const res = this.next({ type: "buy", piece: item }, 0);
    return res;
  }

  use(pieceId: number, params: Record<string, unknown> = {}) {
    const res = this.next({ type: "use", pieceId, params } as Data);
    this.selectedCells = [];
    this.emit();
    return res;
  }

  selectCell(x: number, y: number) {
    this.selectedCells = [...this.selectedCells, [x, y]];
    this.emit();
  }

  clearSelection() {
    this.selectedCells = [];
    this.emit();
  }

  get isBoardFull() {
    if (!this.game) return false;
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 6; x++) {
        if (x === 0 && y === 0) continue;
        if (this.game.state.board[y][x].id === PieceEnum.EMPTY) return false;
      }
    }
    return true;
  }
}

export const GameState = new GameStateManager();
