import { PieceEnum } from "triple-pod-game-engine";

export type PieceMeta = {
  name: string;
  /** Texture key loaded in BootScene */
  key: string;
  noHighlight?: boolean;
  tier?: number;
  category: "plant" | "building" | "enemy" | "treasure" | "utility" | "empty";
  flavor?: string;
};

/** Map engine piece IDs → display names + Phaser texture keys */
export const mappings: Record<PieceEnum, PieceMeta> = {
  [PieceEnum.EMPTY]: {
    name: "Empty",
    key: "piece-empty",
    category: "empty",
  },
  [PieceEnum.GRASS]: {
    name: "Glitteroot Bud",
    key: "piece-grass",
    category: "plant",
    tier: 1,
    flavor: "The first spark of life on Podtown soil.",
  },
  [PieceEnum.BUSH]: {
    name: "Glitteroot Shrub",
    key: "piece-bush",
    category: "plant",
    tier: 2,
  },
  [PieceEnum.SUPER_BUSH]: {
    name: "Glitteroot Shrub+",
    key: "piece-super-bush",
    category: "plant",
    tier: 2,
  },
  [PieceEnum.TREE]: {
    name: "Glitteroot",
    key: "piece-tree",
    category: "plant",
    tier: 3,
  },
  [PieceEnum.SUPER_TREE]: {
    name: "Glitteroot+",
    key: "piece-super-tree",
    category: "plant",
    tier: 3,
  },
  [PieceEnum.HUT]: {
    name: "Pod",
    key: "piece-hut",
    category: "building",
    tier: 4,
  },
  [PieceEnum.SUPER_HUT]: {
    name: "Pod+",
    key: "piece-super-hut",
    category: "building",
    tier: 4,
  },
  [PieceEnum.HOUSE]: {
    name: "Shelter",
    key: "piece-house",
    category: "building",
    tier: 5,
  },
  [PieceEnum.SUPER_HOUSE]: {
    name: "Shelter+",
    key: "piece-super-house",
    category: "building",
    tier: 5,
  },
  [PieceEnum.MANSION]: {
    name: "Condo",
    key: "piece-mansion",
    category: "building",
    tier: 6,
  },
  [PieceEnum.SUPER_MANSION]: {
    name: "Condo+",
    key: "piece-super-mansion",
    category: "building",
    tier: 6,
  },
  [PieceEnum.CASTLE]: {
    name: "Apartment",
    key: "piece-castle",
    category: "building",
    tier: 7,
  },
  [PieceEnum.SUPER_CASTLE]: {
    name: "Apartment+",
    key: "piece-super-castle",
    category: "building",
    tier: 7,
  },
  [PieceEnum.FLOATING_CASTLE]: {
    name: "Soaring Tower",
    key: "piece-floating",
    category: "building",
    tier: 8,
  },
  [PieceEnum.SUPER_FLOATING_CASTLE]: {
    name: "Soaring Tower+",
    key: "piece-super-floating",
    category: "building",
    tier: 8,
  },
  [PieceEnum.TRIPLE_CASTLE]: {
    name: "Galaxy Fortress",
    key: "piece-triple",
    category: "building",
    tier: 9,
    flavor: "The ultimate monument of Podtown.",
  },
  [PieceEnum.BEAR]: {
    name: "Droid",
    // Animated idle frame 1 — portrait aspect (not square piece art)
    key: "droid-idle-1",
    category: "enemy",
    flavor: "Shuffles to an adjacent empty tile each turn.",
  },
  [PieceEnum.NINJA_BEAR]: {
    name: "Rocket Droid",
    key: "piece-ninja",
    category: "enemy",
    flavor: "Warps to any empty tile on the board.",
  },
  [PieceEnum.TOMB]: {
    name: "Scarlet Shard",
    key: "piece-tomb",
    category: "treasure",
    tier: 1,
  },
  [PieceEnum.CHURCH]: {
    name: "Energy Stone",
    key: "piece-church",
    category: "treasure",
    tier: 2,
  },
  [PieceEnum.CATHEDRAL]: {
    name: "Energy Reactor",
    key: "piece-cathedral",
    category: "treasure",
    tier: 3,
  },
  [PieceEnum.CRYSTAL]: {
    name: "Mimic Slime",
    key: "piece-crystal",
    category: "utility",
    flavor: "Clones an adjacent piece to force a match.",
  },
  [PieceEnum.ROCK]: {
    name: "Marble Piece",
    key: "piece-rock",
    category: "treasure",
    tier: 1,
  },
  [PieceEnum.MOUNTAIN]: {
    name: "Marble Chunk",
    key: "piece-mountain",
    category: "treasure",
    tier: 2,
  },
  [PieceEnum.TREASURE]: {
    name: "Loot Chest",
    key: "piece-treasure",
    category: "treasure",
    tier: 3,
  },
  [PieceEnum.LARGE_TREASURE]: {
    name: "Cybercore Crate",
    key: "piece-large-treasure",
    category: "treasure",
    tier: 4,
  },
  [PieceEnum.ROBOT]: {
    name: "Unstable Bomb",
    key: "piece-robot",
    category: "utility",
    flavor: "50% chance to destroy a tile. Misses hurt.",
  },
  [PieceEnum.AIRDROPPER]: {
    name: "Airdropper",
    key: "piece-airdropper",
    noHighlight: true,
    category: "utility",
    flavor: "Clone any piece (except your highest) onto an empty tile.",
  },
  [PieceEnum.REROLL_BOX]: {
    name: "Reroll Box",
    key: "piece-reroll",
    noHighlight: true,
    category: "utility",
    flavor: "Discard your current piece for a random new one.",
  },
  [PieceEnum.TELEPORT_PORTAL]: {
    name: "Teleport Portal",
    key: "piece-portal",
    noHighlight: true,
    category: "utility",
    flavor: "Swap two pieces on the board.",
  },
  [PieceEnum.TERRAFORMER]: {
    name: "Terraformer",
    key: "piece-terraformer",
    noHighlight: true,
    category: "utility",
    flavor: "Wipe all Marble Pieces from the board.",
  },
  [PieceEnum.MEGA_BOMB]: {
    name: "Mega Bomb",
    key: "piece-mega-bomb",
    noHighlight: true,
    category: "utility",
    flavor: "Detonate a 2×2 area.",
  },
  [PieceEnum.BOMB]: {
    name: "Mini Bomb",
    key: "piece-bomb",
    noHighlight: true,
    category: "utility",
    flavor: "Detonate a single tile.",
  },
};

/** Asset paths for BootScene loader (key → path under public/, no leading slash) */
export const PIECE_ASSETS: Array<{ key: string; path: string }> = [
  { key: "piece-empty", path: "pieces/empty.png" },
  { key: "piece-grass", path: "pieces/glitteroot-bud.webp" },
  { key: "piece-bush", path: "pieces/glitteroot-shrub.webp" },
  { key: "piece-super-bush", path: "pieces/glitteroot-shrub-enhanced.webp" },
  { key: "piece-tree", path: "pieces/glitteroot.webp" },
  { key: "piece-super-tree", path: "pieces/glitteroot-enhanced.webp" },
  { key: "piece-hut", path: "pieces/pod.webp" },
  { key: "piece-super-hut", path: "pieces/pod-enhanced.webp" },
  { key: "piece-house", path: "pieces/shelter.webp" },
  { key: "piece-super-house", path: "pieces/shelter-enhanced.webp" },
  { key: "piece-mansion", path: "pieces/condo.webp" },
  { key: "piece-super-mansion", path: "pieces/condo-enhanced.webp" },
  { key: "piece-castle", path: "pieces/apartment.webp" },
  { key: "piece-super-castle", path: "pieces/apartment-enhanced.webp" },
  { key: "piece-floating", path: "pieces/soaring-tower.webp" },
  { key: "piece-super-floating", path: "pieces/soaring-tower-enhanced.webp" },
  { key: "piece-triple", path: "pieces/galaxy-fortress.webp" },
  // Static fallback; HUD / board normal droid use droid-idle-* from BootScene
  { key: "piece-bear", path: "pieces/droid.webp" },
  { key: "piece-ninja", path: "pieces/rocket-droid.webp" },
  { key: "piece-tomb", path: "pieces/scarlet-shard.webp" },
  { key: "piece-church", path: "pieces/energy-stone.webp" },
  { key: "piece-cathedral", path: "pieces/energy-reactor.webp" },
  { key: "piece-crystal", path: "pieces/mimic-slime.webp" },
  { key: "piece-rock", path: "pieces/marble-piece.webp" },
  { key: "piece-mountain", path: "pieces/marble-chunk.webp" },
  { key: "piece-treasure", path: "pieces/loot-chest.webp" },
  { key: "piece-large-treasure", path: "pieces/cybercore-crate.webp" },
  { key: "piece-robot", path: "pieces/unstable-bomb.webp" },
  { key: "piece-airdropper", path: "pieces/airdropper.webp" },
  { key: "piece-reroll", path: "pieces/reroll-box.webp" },
  { key: "piece-portal", path: "pieces/teleport-portal.webp" },
  { key: "piece-terraformer", path: "pieces/terraformer.webp" },
  { key: "piece-mega-bomb", path: "pieces/mega-bomb.webp" },
  { key: "piece-bomb", path: "pieces/mini-bomb.webp" },
];

export const formatPoints = (n: number) =>
  new Intl.NumberFormat("en-US").format(n);
