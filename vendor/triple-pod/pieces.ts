import { PieceEnum, type Piece } from "./Piece";
import { BuyableProps, BuyablePiece } from "./types";

const tripleCastle: Piece = {
  name: "Triple Castle",
  points: 300000,
  icon: "✅",
  id: PieceEnum.TRIPLE_CASTLE,
  group: "NONE",
  super: false,
};

const floatingCastle: Piece = {
  name: "Floating Castle",
  points: 100000,
  icon: "🏯",
  nextTierPiece: tripleCastle,
  id: PieceEnum.FLOATING_CASTLE,
  group: 7,
  super: false,
};

const superFloatingCastle: Piece = {
  name: "Super Floating Castle",
  points: 200000,
  icon: "a",
  nextTierPiece: tripleCastle,
  id: PieceEnum.SUPER_FLOATING_CASTLE,
  group: 7,
  super: true,
};

const superCastle: Piece = {
  name: "Super Castle",
  points: 40000,
  icon: "b",
  id: PieceEnum.SUPER_CASTLE,
  nextTierPiece: superFloatingCastle,
  nextSuperTierPiece: superFloatingCastle,
  group: 6,
  super: true,
};

const castle: Piece = {
  name: "Castle",
  points: 20000,
  icon: "🏰",
  nextTierPiece: floatingCastle,
  nextSuperTierPiece: superFloatingCastle,
  id: PieceEnum.CASTLE,
  group: 6,
  super: false,
};

const mansion: Piece = {
  name: "Mansion",
  points: 5000,
  icon: "🏡",
  nextTierPiece: castle,
  nextSuperTierPiece: superCastle,
  id: PieceEnum.MANSION,
  group: 5,
  super: false,
};

const superMansion: Piece = {
  name: "Super Mansion",
  points: 10000,
  icon: "c",
  id: PieceEnum.SUPER_MANSION,
  nextTierPiece: superCastle,
  nextSuperTierPiece: superCastle,
  group: 5,
  super: true,
};

const house: Piece = {
  name: "House",
  points: 1500,
  icon: "🏠",
  nextTierPiece: mansion,
  nextSuperTierPiece: superMansion,
  id: PieceEnum.HOUSE,
  group: 4,
  super: false,
};

const superHouse: Piece = {
  name: "Super House",
  points: 3000,
  icon: "d",
  id: PieceEnum.SUPER_HOUSE,
  nextTierPiece: superMansion,
  nextSuperTierPiece: superMansion,
  group: 4,
  super: true,
};

const hut: Piece = {
  name: "Hut",
  points: 500,
  icon: "🎪",
  nextTierPiece: house,
  nextSuperTierPiece: superHouse,
  id: PieceEnum.HUT,
  group: 3,
  super: false,
};

const superHut: Piece = {
  name: "Super Hut",
  points: 1000,
  icon: "e",
  id: PieceEnum.SUPER_HUT,
  nextTierPiece: superHouse,
  nextSuperTierPiece: superHouse,
  group: 3,
  super: true,
};

export const tree: Piece = {
  name: "Tree",
  points: 100,
  icon: "🌳",
  nextTierPiece: hut,
  nextSuperTierPiece: superHut,
  id: PieceEnum.TREE,
  group: 2,
  super: false,
};

const superTree: Piece = {
  name: "Super Tree",
  points: 200,
  icon: "f",
  id: PieceEnum.SUPER_TREE,
  nextTierPiece: superHut,
  nextSuperTierPiece: superHut,
  group: 2,
  super: true,
};

const superBush: Piece = {
  name: "Super Bush",
  points: 40,
  icon: "g",
  id: PieceEnum.SUPER_BUSH,
  nextTierPiece: superTree,
  nextSuperTierPiece: superTree,
  group: 1,
  super: true,
};

export const bush: Piece = {
  name: "Bush",
  points: 20,
  icon: "🍀",
  nextTierPiece: tree,
  nextSuperTierPiece: superTree,
  id: PieceEnum.BUSH,
  group: 1,
  super: false,
};

export const grass: Piece = {
  name: "Grass",
  points: 5,
  icon: "🌱",
  nextTierPiece: bush,
  nextSuperTierPiece: superBush,
  id: PieceEnum.GRASS,
  group: 0,
  super: false,
};

export const bear: Piece = {
  name: "Bear",
  points: 0,
  icon: "🐻",
  id: PieceEnum.BEAR,
  group: "NONE",
  super: false,
};

export const robot: Piece = {
  name: "Robot",
  points: 0,
  icon: "🤖",
  id: PieceEnum.ROBOT,
  group: "NONE",
  super: false,
  willAffectGameEnd: true,
};

export const empty: Piece = {
  name: "empty",
  points: 0,
  icon: "__",
  id: PieceEnum.EMPTY,
  group: "NONE",
  super: false,
};

export const ninjaBear: Piece = {
  name: "Ninja Bear",
  points: 0,
  icon: "h",
  id: PieceEnum.NINJA_BEAR,
  group: "NONE",
  super: false,
};

export const crystal: Piece = {
  name: "Crystal",
  points: 0,
  icon: "💎",
  id: PieceEnum.CRYSTAL,
  group: "NONE",
  super: false,
};

const largeTreasure: Piece = {
  name: "Large Treasure",
  points: 50000,
  icon: "💵",
  id: PieceEnum.LARGE_TREASURE,
  group: "NONE",
  super: false,
};

export const treasure: Piece = {
  name: "Treasure",
  points: 10000,
  icon: "🪙",
  id: PieceEnum.TREASURE,
  nextTierPiece: largeTreasure,
  nextSuperTierPiece: largeTreasure,
  group: 8,
  super: false,
};

const mountain: Piece = {
  name: "Mountain",
  points: 1000,
  icon: "⛰",
  id: PieceEnum.MOUNTAIN,
  nextTierPiece: treasure,
  group: 9,
  super: false,
};

export const rock: Piece = {
  name: "Rock",
  points: 0,
  icon: "🧱",
  id: PieceEnum.ROCK,
  nextTierPiece: mountain,
  group: 10,
  super: false,
};

const cathedral: Piece = {
  name: "Cathedral",
  points: 5000,
  icon: "⛪",
  id: PieceEnum.CATHEDRAL,
  nextTierPiece: treasure,
  nextSuperTierPiece: treasure,
  group: 11,
  super: false,
};

const church: Piece = {
  name: "Church",
  points: 1000,
  icon: "🕯",
  id: PieceEnum.CHURCH,
  nextTierPiece: cathedral,
  nextSuperTierPiece: cathedral,
  group: 12,
  super: false,
};

export const tombStone: Piece = {
  name: "Tombstone",
  points: 0,
  icon: "👻",
  id: PieceEnum.TOMB,
  nextTierPiece: church,
  nextSuperTierPiece: church,
  group: 13,
  super: false,
};

export const airdropper: Piece = {
  name: "Airdropper",
  points: 0,
  icon: "",
  id: PieceEnum.AIRDROPPER,
  group: "NONE",
  super: false,
};

export const rerollBox: Piece = {
  name: "Reroll Box",
  points: 0,
  icon: "",
  id: PieceEnum.REROLL_BOX,
  group: "NONE",
  super: false,
  willAffectGameEnd: true,
};

export const teleportPortal: Piece = {
  name: "Teleport Portal",
  points: 0,
  icon: "",
  id: PieceEnum.TELEPORT_PORTAL,
  group: "NONE",
  super: false,
  willAffectGameEnd: true,
};

export const terraformer: Piece = {
  name: "Terraformer",
  points: 0,
  icon: "",
  id: PieceEnum.TERRAFORMER,
  group: "NONE",
  super: false,
  willAffectGameEnd: true,
};

export const megaBomb: Piece = {
  name: "Mega Bomb",
  points: 0,
  icon: "",
  id: PieceEnum.MEGA_BOMB,
  group: "NONE",
  super: false,
  willAffectGameEnd: true,
};

export const bomb: Piece = {
  name: "Bomb",
  points: 0,
  icon: "",
  id: PieceEnum.BOMB,
  group: "NONE",
  super: false,
  willAffectGameEnd: true,
};

const allPieces: Record<keyof typeof PieceEnum, Piece> = {
  EMPTY: empty,
  GRASS: grass,
  BUSH: bush,
  SUPER_BUSH: superBush,
  TREE: tree,
  SUPER_TREE: superTree,
  HUT: hut,
  SUPER_HUT: superHut,
  HOUSE: house,
  SUPER_HOUSE: superHouse,
  MANSION: mansion,
  SUPER_MANSION: superMansion,
  CASTLE: castle,
  SUPER_CASTLE: superCastle,
  FLOATING_CASTLE: floatingCastle,
  SUPER_FLOATING_CASTLE: superFloatingCastle,
  TRIPLE_CASTLE: tripleCastle,
  BEAR: bear,
  TOMB: tombStone,
  ROBOT: robot,
  CHURCH: church,
  CATHEDRAL: cathedral,
  ROCK: rock,
  MOUNTAIN: mountain,
  TREASURE: treasure,
  LARGE_TREASURE: largeTreasure,
  CRYSTAL: crystal,
  NINJA_BEAR: ninjaBear,
  AIRDROPPER: airdropper,
  REROLL_BOX: rerollBox,
  TELEPORT_PORTAL: teleportPortal,
  TERRAFORMER: terraformer,
  MEGA_BOMB: megaBomb,
  BOMB: bomb,
};

export const shopItems = [
  airdropper,
  rerollBox,
  teleportPortal,
  terraformer,
  megaBomb,
  bomb,
];

export const levelByPiece: Partial<Record<PieceEnum, number>> = {
  [PieceEnum.TOMB]: 1,
  [PieceEnum.GRASS]: 1,
  [PieceEnum.ROCK]: 1,
  //
  [PieceEnum.CHURCH]: 2,
  [PieceEnum.BUSH]: 2,
  [PieceEnum.SUPER_BUSH]: 2,
  [PieceEnum.MOUNTAIN]: 2,
  //
  [PieceEnum.CATHEDRAL]: 3,
  [PieceEnum.TREE]: 3,
  [PieceEnum.SUPER_TREE]: 3,
  [PieceEnum.TREASURE]: 3,
  //
  [PieceEnum.HUT]: 4,
  [PieceEnum.SUPER_HUT]: 4,
  [PieceEnum.LARGE_TREASURE]: 4,
  //
  [PieceEnum.HOUSE]: 5,
  [PieceEnum.SUPER_HOUSE]: 5,
  //
  [PieceEnum.HOUSE]: 6,
  [PieceEnum.SUPER_HOUSE]: 6,
  //
  [PieceEnum.MANSION]: 7,
  [PieceEnum.SUPER_MANSION]: 7,
  //
  [PieceEnum.CASTLE]: 8,
  [PieceEnum.SUPER_CASTLE]: 8,
  //
  [PieceEnum.FLOATING_CASTLE]: 9,
  [PieceEnum.SUPER_FLOATING_CASTLE]: 9,
  //
  [PieceEnum.TRIPLE_CASTLE]: 10,
};

const list = Object.values(allPieces);

export function get(id: PieceEnum) {
  return list.find((p) => p.id === id);
}

export function is(piece: Piece, id: PieceEnum) {
  return piece.id === id;
}

export function createBuyablePiece(
  piece: Piece,
  buyableProps: Omit<BuyableProps, "isBuyable">
) {
  return {
    ...piece,
    ...buyableProps,
    isBuyable: true,
  } as BuyablePiece;
}

export default allPieces;
