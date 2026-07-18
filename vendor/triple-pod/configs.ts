import { Config } from "./Config";
import { PieceEnum } from "./Piece";
import {
  bear,
  bush,
  createBuyablePiece,
  crystal,
  grass,
  robot,
  tree,
} from "./pieces";
import { BuyablePiece } from "./types";

const shopItems: BuyablePiece[] = [
  createBuyablePiece(grass, { price: 100 }),
  createBuyablePiece(bush, { price: 200 }),
  createBuyablePiece(tree, { price: 300 }),
  createBuyablePiece(crystal, { price: 500 }),
  createBuyablePiece(robot, { price: 1000 }),
  createBuyablePiece(bear, { price: 1000 }),
];

const normal: Config = {
  coins: 2000,
  shopItems,
  initialPieceRatio: {
    [PieceEnum.EMPTY]: 50,
    [PieceEnum.GRASS]: 10,
    [PieceEnum.BUSH]: 5,
    [PieceEnum.ROCK]: 4,
    [PieceEnum.BEAR]: 3,
    [PieceEnum.TREE]: 1,
  },
  userPieceRatio: {
    [PieceEnum.GRASS]: 50,
    [PieceEnum.BUSH]: 40,
    [PieceEnum.BEAR]: {
      when: 0,
      ratio: 10,
    },
    [PieceEnum.BEAR]: {
      when: 500,
      ratio: 20,
    },
    [PieceEnum.NINJA_BEAR]: {
      when: 1000,
      ratio: 5,
    },
    [PieceEnum.ROBOT]: 5,
    [PieceEnum.CRYSTAL]: 2,
    [PieceEnum.HUT]: {
      when: 1300,
      ratio: 3,
    },
    [PieceEnum.HUT]: {
      when: 2000,
      ratio: 1,
    },
  },
};

const hard: Config = {
  coins: 2000,
  shopItems,
  initialPieceRatio: {
    [PieceEnum.EMPTY]: 70,
    [PieceEnum.GRASS]: 5,
    [PieceEnum.BUSH]: 2,
    [PieceEnum.BEAR]: 15,
    [PieceEnum.ROCK]: 10,
  },
  userPieceRatio: {
    [PieceEnum.GRASS]: 50,
    [PieceEnum.BUSH]: 40,
    [PieceEnum.BEAR]: 10,
    [PieceEnum.NINJA_BEAR]: 10,
    [PieceEnum.ROBOT]: 5,
    [PieceEnum.HUT]: {
      when: 13000,
      ratio: 3,
    },
    [PieceEnum.HUT]: {
      when: 20000,
      ratio: 1,
    },
  },
};

export default { normal, hard };
