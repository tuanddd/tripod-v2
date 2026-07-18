import type { Player as BasePlayer } from "game-interface";
import Prando from "prando";
import type { Config } from "./Config";
import { Piece, PieceEnum } from "./Piece";

export interface Player extends BasePlayer {}

export type Position = [number, number];

export type Data =
  | { type: "put"; x: number; y: number }
  | { type: "scan"; x: number; y: number }
  | { type: "swap" }
  | { type: "spawn"; piece: Piece }
  | { type: "buy"; piece: BuyablePiece }
  | ({ type: "use" } & UseItemParams)
  | { type: "admin-put"; pieceId: PieceEnum; x: number; y: number }
  | { type: "add-coins"; coins: number }
  | { type: "end" };

type UseItemParams =
  | {
      pieceId: PieceEnum.AIRDROPPER;
      params: {
        target: Position;
        dest: Position;
      };
    }
  | {
      pieceId: PieceEnum.REROLL_BOX;
      params: {};
    }
  | {
      pieceId: PieceEnum.TELEPORT_PORTAL;
      params: {
        posA: Position;
        posB: Position;
      };
    }
  | {
      pieceId: PieceEnum.TERRAFORMER;
      params: {};
    }
  | {
      pieceId: PieceEnum.MEGA_BOMB;
      params: {
        pos: Position;
      };
    }
  | {
      pieceId: PieceEnum.BOMB;
      params: {
        pos: Position;
      };
    };

export type Event =
  | {
      type: "condense";
      from: PieceEnum;
      to: PieceEnum;
      x: number;
      y: number;
      super: boolean;
    }
  | {
      type: "bear-move";
      piece: PieceEnum.BEAR | PieceEnum.NINJA_BEAR;
      from: { x: number; y: number };
      to: { x: number; y: number };
    }
  | {
      type: "transform";
      from: PieceEnum;
      to: PieceEnum;
      x: number;
      y: number;
    }
  | {
      type: "destroy";
      pieces: Array<PieceEnum>;
      x: number;
      y: number;
    }
  | {
      type: "miss";
      x: number;
      y: number;
    };

export type Board = Array<Array<Piece>>;

export interface State {
  points: number;
  config: Config;
  randomizer: Prando;
  board: Board;
  currentPiece: Piece;
  swapPiece: Piece | null;
  lastActionPos: Position;
  travelledNodes: Array<Position>;
  affectedNodes: Array<Position>;
  initialPieces: Array<Piece>;
  events: Array<Array<Event>>;
  coins: number;
  isBoardFull: boolean;
}

export interface BuyableProps {
  isBuyable: true;
  price: number;
}

export type BuyablePiece = Piece & BuyableProps;
