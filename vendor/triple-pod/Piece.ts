export enum PieceEnum {
  EMPTY = 0,
  ROBOT,
  GRASS,
  BUSH,
  SUPER_BUSH,
  TREE,
  SUPER_TREE,
  HUT,
  SUPER_HUT,
  HOUSE,
  SUPER_HOUSE,
  MANSION,
  SUPER_MANSION,
  CASTLE,
  SUPER_CASTLE,
  FLOATING_CASTLE,
  SUPER_FLOATING_CASTLE,
  TRIPLE_CASTLE,
  BEAR,
  NINJA_BEAR,
  TOMB,
  CHURCH,
  CATHEDRAL,
  TREASURE,
  LARGE_TREASURE,
  ROCK,
  MOUNTAIN,
  CRYSTAL,
  AIRDROPPER,
  REROLL_BOX,
  TELEPORT_PORTAL,
  TERRAFORMER,
  MEGA_BOMB,
  BOMB,
}

export type Group = number | "NONE";

export interface Piece {
  id: PieceEnum;
  name: string;
  points: number;
  nextTierPiece?: Piece;
  nextSuperTierPiece?: Piece;
  icon: string;
  // because some pieces are considered the same level (just different variation) so they belongs
  // to the same group to enable matching
  group: Group;
  super: boolean;
  // pieces with this props can affect game end when the board is full
  // e.g. ROBOT can destroy a piece to clear up a slot
  willAffectGameEnd?: boolean;
}
