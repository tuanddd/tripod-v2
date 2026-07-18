declare module "triple-pod-game-engine" {
  import type { Game, Player } from "game-interface";
  // Prando only used as a type in engine state
  type Prando = { next(): number; nextInt(min: number, max: number): number };


export enum PieceEnum {
    EMPTY = 0,
    ROBOT = 1,
    GRASS = 2,
    BUSH = 3,
    SUPER_BUSH = 4,
    TREE = 5,
    SUPER_TREE = 6,
    HUT = 7,
    SUPER_HUT = 8,
    HOUSE = 9,
    SUPER_HOUSE = 10,
    MANSION = 11,
    SUPER_MANSION = 12,
    CASTLE = 13,
    SUPER_CASTLE = 14,
    FLOATING_CASTLE = 15,
    SUPER_FLOATING_CASTLE = 16,
    TRIPLE_CASTLE = 17,
    BEAR = 18,
    NINJA_BEAR = 19,
    TOMB = 20,
    CHURCH = 21,
    CATHEDRAL = 22,
    TREASURE = 23,
    LARGE_TREASURE = 24,
    ROCK = 25,
    MOUNTAIN = 26,
    CRYSTAL = 27,
    AIRDROPPER = 28,
    REROLL_BOX = 29,
    TELEPORT_PORTAL = 30,
    TERRAFORMER = 31,
    MEGA_BOMB = 32,
    BOMB = 33
}
export type Group = number | "NONE";
interface Piece {
    id: PieceEnum;
    name: string;
    points: number;
    nextTierPiece?: Piece;
    nextSuperTierPiece?: Piece;
    icon: string;
    group: Group;
    super: boolean;
    willAffectGameEnd?: boolean;
}

interface Player extends Player {
}
export type Position = [number, number];
export type Data = {
    type: "put";
    x: number;
    y: number;
} | {
    type: "scan";
    x: number;
    y: number;
} | {
    type: "swap";
} | {
    type: "spawn";
    piece: Piece;
} | {
    type: "buy";
    piece: BuyablePiece;
} | ({
    type: "use";
} & UseItemParams) | {
    type: "admin-put";
    pieceId: PieceEnum;
    x: number;
    y: number;
} | {
    type: "add-coins";
    coins: number;
} | {
    type: "end";
};
export type UseItemParams = {
    pieceId: PieceEnum.AIRDROPPER;
    params: {
        target: Position;
        dest: Position;
    };
} | {
    pieceId: PieceEnum.REROLL_BOX;
    params: {};
} | {
    pieceId: PieceEnum.TELEPORT_PORTAL;
    params: {
        posA: Position;
        posB: Position;
    };
} | {
    pieceId: PieceEnum.TERRAFORMER;
    params: {};
} | {
    pieceId: PieceEnum.MEGA_BOMB;
    params: {
        pos: Position;
    };
} | {
    pieceId: PieceEnum.BOMB;
    params: {
        pos: Position;
    };
};
export type Event = {
    type: "condense";
    from: PieceEnum;
    to: PieceEnum;
    x: number;
    y: number;
    super: boolean;
} | {
    type: "bear-move";
    piece: PieceEnum.BEAR | PieceEnum.NINJA_BEAR;
    from: {
        x: number;
        y: number;
    };
    to: {
        x: number;
        y: number;
    };
} | {
    type: "transform";
    from: PieceEnum;
    to: PieceEnum;
    x: number;
    y: number;
} | {
    type: "destroy";
    pieces: Array<PieceEnum>;
    x: number;
    y: number;
} | {
    type: "miss";
    x: number;
    y: number;
};
export type Board = Array<Array<Piece>>;
interface State {
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
interface BuyableProps {
    isBuyable: true;
    price: number;
}
export type BuyablePiece = Piece & BuyableProps;

interface Config {
    initialPieceRatio: Partial<Record<PieceEnum, number>>;
    userPieceRatio: Partial<Record<PieceEnum, number | {
        when: number;
        ratio: number;
    }>>;
    coins: number;
    shopItems: BuyablePiece[];
}

export type InitOption = {
    id: string;
    points: number;
    config: Config;
};
export class TriplePodGame implements Game<State, Player, Data> {
    id: string;
    private gen;
    readonly name = "triple-pod";
    done: boolean;
    started: boolean;
    winners: never[];
    state: State;
    private isCrystal;
    private localEvents;
    players: Player[];
    history: Array<Data>;
    private localPoints;
    constructor(options?: Partial<InitOption>);
    join(p: Player): void;
    leave(p: Player): void;
    start(): void;
    nextState(d: Data): {
        valid: boolean;
        error: string | null;
    };
    private filterPieces;
    private spawn;
    private randomUserPiece;
    private randomInitialPiece;
    private travel;
    private condense;
    private isMixed;
    private evaluate;
    private getAdjacentTiles;
    private getBearJump;
    private moveBears;
    private moveBearsType;
    private swap;
    private record;
    private recordEvent;
    private recordTurnEvent;
    private destroyIfAny;
    private reconcile;
    private getHighestPiece;
    private round;
}

export const tree: Piece;
export const bush: Piece;
export const grass: Piece;
export const bear: Piece;
export const robot: Piece;
export const empty: Piece;
export const ninjaBear: Piece;
export const crystal: Piece;
export const treasure: Piece;
export const rock: Piece;
export const tombStone: Piece;
export const airdropper: Piece;
export const rerollBox: Piece;
export const teleportPortal: Piece;
export const terraformer: Piece;
export const megaBomb: Piece;
export const bomb: Piece;
export const shopItems: Piece[];
export const levelByPiece: Partial<Record<PieceEnum, number>>;
export function get(id: PieceEnum): Piece | undefined;
export function is(piece: Piece, id: PieceEnum): boolean;
export function createBuyablePiece(piece: Piece, buyableProps: Omit<BuyableProps, "isBuyable">): BuyablePiece;

export const _default: {
    normal: Config;
    hard: Config;
};

export { Board, BuyablePiece, BuyableProps, Data, Event, TriplePodGame as Game, Group, Piece, PieceEnum, Player, Position, State, airdropper, bear, bomb, bush, _default as configs, createBuyablePiece, crystal, empty, get, grass, is, levelByPiece, megaBomb, ninjaBear, rerollBox, robot, rock, shopItems, teleportPortal, terraformer, tombStone, treasure, tree };
}
