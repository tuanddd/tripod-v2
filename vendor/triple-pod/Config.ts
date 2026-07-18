import { PieceEnum } from "./Piece";
import { BuyablePiece } from "./types";

export interface Config {
  // used once when the game starts
  initialPieceRatio: Partial<Record<PieceEnum, number>>;
  // used when randomizing a piece for next turn for user
  userPieceRatio: Partial<
    Record<PieceEnum, number | { when: number; ratio: number }>
  >;
  // used for purchasing shop items
  coins: number;
  // used to determine shop items
  shopItems: BuyablePiece[];
}
