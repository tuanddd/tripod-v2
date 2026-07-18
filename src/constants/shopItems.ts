import {
  airdropper,
  bomb,
  BuyablePiece,
  megaBomb,
  rerollBox,
  teleportPortal,
  terraformer,
} from "triple-pod-game-engine";

export type ShopItem = BuyablePiece & {
  desc: string;
};

export const shopItems: ShopItem[] = [
  {
    ...airdropper,
    desc: "Clone a piece onto an empty tile",
    price: 1000,
    isBuyable: true,
  },
  {
    ...rerollBox,
    desc: "Reroll your current piece",
    price: 1000,
    isBuyable: true,
  },
  {
    ...teleportPortal,
    desc: "Swap two pieces on the board",
    price: 1000,
    isBuyable: true,
  },
  {
    ...terraformer,
    desc: "Destroy all Marble Pieces",
    price: 1000,
    isBuyable: true,
  },
  {
    ...megaBomb,
    desc: "Wipe a 2×2 blast zone",
    price: 1000,
    isBuyable: true,
  },
  {
    ...bomb,
    desc: "Destroy a single tile",
    price: 1000,
    isBuyable: true,
  },
];
