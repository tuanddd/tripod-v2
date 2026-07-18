import { PieceEnum, type Piece } from "./Piece";
import Prando from "prando";
import {
  bear,
  empty,
  tombStone,
  get,
  is,
  rock,
  crystal,
  treasure,
  shopItems,
  levelByPiece,
} from "./pieces";
import { Config } from "./Config";
import configs from "./configs";
import type { Game } from "game-interface";
import { Data, Event, Player, Position, State } from "./types";
import humanId from "human-id";
import uniqBy from "lodash.uniqby";
import deepMerge from "deepmerge";

const size = 6;
const normalMatch = 3;
const superMatch = 4;
const semiSuperPointModifier = 0.2;
const fullSuperPointModifier = 0.5;

const newId = () => humanId({ separator: "-", capitalize: false });

type CustomNexValue = {
  shouldRecord: boolean;
  valid: boolean;
  error: string | null;
};

type InitOption = {
  id: string;
  points: number;
  config: Config;
};

const defaultOption: InitOption = {
  id: newId(),
  points: 0,
  config: configs.normal,
};

export default class TriplePodGame implements Game<State, Player, Data> {
  public id: string = newId();
  private gen: Generator<CustomNexValue, CustomNexValue, Data>;
  public readonly name = "triple-pod";
  public done = false;
  public started = false;
  public winners = [];
  public state: State = {
    board: [],
    config: configs.normal,
    points: 0,
    currentPiece: empty,
    swapPiece: null,
    randomizer: new Prando(),
    lastActionPos: [0, 0],
    travelledNodes: [],
    affectedNodes: [],
    initialPieces: [],
    events: [],
    coins: 0,
    isBoardFull: false,
  };
  private isCrystal = false;
  private localEvents: Array<Event> = [];
  public players: Player[] = [];
  public history: Array<Data> = [];
  private localPoints: number = 0;

  constructor(options: Partial<InitOption> = {}) {
    const mergedOptions = deepMerge(defaultOption, options);
    const { points, id, config } = mergedOptions;
    this.id = id;
    this.state.points = points;
    this.state.randomizer = new Prando(id);
    this.state.config = config;
    this.state.initialPieces = Object.entries(config.initialPieceRatio)
      .map((c) => new Array(c[1]).fill(get(Number(c[0]) as PieceEnum)))
      .flat();
    this.state.coins = config.coins;

    for (let i = 0; i < size; i++) {
      const row = [];
      for (let j = 0; j < size; j++) {
        // non-empty tile or empty
        if (this.state.randomizer.nextBoolean()) {
          row.push(this.randomInitialPiece());
        } else {
          row.push(empty);
        }
      }
      this.state.board.push(row);
    }

    this.state.board[0][0] = empty;
    this.state.randomizer.reset();
    this.state.currentPiece = this.randomUserPiece();
    this.gen = this.round();
  }

  public join(p: Player) {
    if (this.started || this.players.some((pl) => pl.id === p.id)) return;
    this.players.push(p);
  }

  public leave(p: Player) {
    if (this.started || this.players.every((pl) => pl.id !== p.id)) return;
    const index = this.players.findIndex((pl) => pl.id === p.id);
    this.players.splice(index, 1);
  }

  public start() {
    if (this.started) return;
    this.started = true;
    this.gen.next();
  }

  public nextState(d: Data) {
    if (!this.started)
      return { valid: false, error: "The game is not started" };
    const { value } = this.gen.next(d);
    if (value.shouldRecord) {
      this.record(d);
    }
    this.gen.next();
    return { valid: value.valid, error: value.error };
  }

  private filterPieces(id: PieceEnum) {
    const nodes: Array<Position> = [];
    for (let [j, row] of this.state.board.entries()) {
      for (let [i, cell] of row.entries()) {
        if (cell.id === id) {
          nodes.push([i, j]);
        }
      }
    }

    return nodes;
  }

  private spawn(piece: Piece) {
    if (piece) {
      const emptyNodes = this.filterPieces(empty.id);
      const [x, y] = this.state.randomizer.nextArrayItem(emptyNodes);
      this.state.board[y][x] = piece;

      this.moveBears();
      this.evaluate({ piece: tombStone, committed: true });
    }
  }

  private randomUserPiece() {
    const userPieces = Object.entries(this.state.config.userPieceRatio)
      .map((c) => {
        if (typeof c[1] === "number") {
          return new Array(c[1]).fill(get(Number(c[0]) as PieceEnum));
        } else {
          return this.state.points >= c[1].when
            ? new Array(c[1].ratio).fill(get(Number(c[0]) as PieceEnum))
            : [];
        }
      })
      .flat();
    return this.state.randomizer.nextArrayItem(userPieces);
  }

  private randomInitialPiece() {
    return this.state.randomizer.nextArrayItem(this.state.initialPieces);
  }

  private travel(x: number, y: number, lastPiece: Piece): void {
    this.state.travelledNodes.push([x, y]);
    const adjacents = this.getAdjacentTiles(x, y).filter(([i, j]) => {
      if (this.state.travelledNodes.some(([a, b]) => a === i && b === j))
        return false;
      return true;
    });
    const sameNodes = adjacents.filter(([i, j]) => {
      const sameId = lastPiece.id === this.state.board[j][i].id;
      const notGroupNone =
        lastPiece.group !== "NONE" && this.state.board[j][i].group !== "NONE";
      const sameGroup = lastPiece.group === this.state.board[j][i].group;

      return notGroupNone && (sameId || sameGroup);
    });
    if (sameNodes.length === 0) {
      return;
    } else {
      sameNodes.map(([i, j]) => this.travel(i, j, lastPiece));
    }
  }

  private condense({
    x,
    y,
    piece,
    nextPiece,
    committed,
  }: {
    x: number;
    y: number;
    piece: Piece;
    nextPiece?: Piece;
    committed: boolean;
  }) {
    if (!nextPiece) return;
    this.recordEvent({
      type: "condense",
      x,
      y,
      from: this.isCrystal ? crystal.id : piece.id,
      to: nextPiece.id,
      super: nextPiece.super,
    });
    if (committed) {
      this.state.travelledNodes.forEach((pos) => {
        const [x, y] = pos;
        this.state.board[y][x] = empty;
      });
      this.localPoints += nextPiece.points;
      this.state.board[y][x] = nextPiece;
    } else {
      this.state.affectedNodes = this.state.travelledNodes.map((p) => p);
    }
  }

  private isMixed(nodes: Array<Position>): boolean {
    return uniqBy(nodes, (pos) => this.state.board[pos[1]][pos[0]]).length > 1;
  }

  private evaluate({
    piece,
    x,
    y,
    committed,
  }: {
    piece?: Piece;
    x?: number;
    y?: number;
    committed: boolean;
  }) {
    if (!piece) return;
    this.isCrystal = false;
    this.state.travelledNodes = [];
    const nextPiece = piece.nextTierPiece;
    const nextSuperPiece = piece.nextSuperTierPiece;
    const hasNextLevel = nextPiece || nextSuperPiece;
    const hasCoords = typeof x === "number" && typeof y === "number";

    if (piece.id === crystal.id && hasCoords) {
      this.isCrystal = true;
      const adjacents = this.getAdjacentTiles(x, y);
      const adjacentPieceIds = Array.from(
        new Set(adjacents.map(([i, j]) => this.state.board[j][i].id))
      )
        .filter((id) => id !== empty.id)
        .sort((id1, id2) => id1 - id2);
      let nextPiece: Piece | undefined;
      for (let pieceId of adjacentPieceIds) {
        const piece = get(pieceId);
        if (piece) {
          if (this.state.travelledNodes.length < normalMatch) {
            this.state.travelledNodes = [];
            this.travel(x, y, piece);
            if (this.state.travelledNodes.length >= superMatch) {
              const isMixed = this.isMixed(this.state.travelledNodes);
              nextPiece = isMixed
                ? piece.nextTierPiece
                : piece.nextSuperTierPiece;
              this.condense({
                x,
                y,
                piece,
                nextPiece: piece.nextSuperTierPiece,
                committed,
              });
              break;
            } else if (this.state.travelledNodes.length >= normalMatch) {
              nextPiece = piece.nextTierPiece;
              this.condense({
                x,
                y,
                piece,
                nextPiece: piece.nextTierPiece,
                committed,
              });
              break;
            }
          }
        }
      }
      if (nextPiece) {
        this.evaluate({ piece: nextPiece, x, y, committed });
      }
    } else if (hasNextLevel || hasCoords) {
      if (hasCoords) {
        this.state.travelledNodes = [];
        this.travel(x, y, piece);
        const isMixed = this.isMixed(this.state.travelledNodes);
        if (this.state.travelledNodes.length >= superMatch) {
          this.condense({
            x,
            y,
            piece,
            nextPiece: isMixed ? nextPiece : nextSuperPiece,
            committed,
          });
          this.evaluate({ piece: nextSuperPiece, x, y, committed });
        } else if (this.state.travelledNodes.length >= normalMatch) {
          this.condense({ x, y, piece, nextPiece, committed });
          this.evaluate({ piece: nextPiece, x, y, committed });
        }
      } else {
        /**
         * Logic to handle condense with no coords.
         *
         * This generally applies when the condense happens as a SIDE EFFECT,
         * so we need to determine the condensed piece's coord differently.
         * Consider these 2 scenarios:
         *
         * 1. Players put a bear piece
         * -> bears die -> the tombstones that spawns after happens to be condense-able
         * -> condensed tombstone should be where the players put the bear
         *
         * 2. Players put a non-bear piece
         * -> bears die -> the tombstones that spawns after happens to be condense-able
         * -> condensed tombstone should be random among the travelledNodes of type bear piece
         *
         * Therefore, we need to determine the condensed piece's coord in consideration
         * of the lastActionPos.
         */
        const nodes = this.filterPieces(piece.id);
        if (nodes.length >= normalMatch && nextPiece) {
          let isSuperMatch = false;
          for (let [i, j] of nodes) {
            this.state.travelledNodes = [];
            this.travel(i, j, piece);
            if (this.state.travelledNodes.length >= normalMatch) {
              const isMixed = this.isMixed(this.state.travelledNodes);
              isSuperMatch = this.state.travelledNodes.length >= superMatch;

              // Determine condensed piece's coord
              let [x, y] = [0, 0];
              if (
                // If the piece at lastActionPos is also one of the travelledNodes,
                // put the condensed piece there
                this.state.travelledNodes.some(
                  ([x, y]) =>
                    x === this.state.lastActionPos[0] &&
                    y === this.state.lastActionPos[1]
                )
              ) {
                [x, y] = this.state.lastActionPos;
              } else {
                // Else choose a random position among the travelledNodes
                [x, y] = this.state.randomizer.nextArrayItem(
                  this.state.travelledNodes
                );
              }
              this.condense({
                x,
                y,
                piece,
                nextPiece:
                  isSuperMatch && !isMixed ? nextSuperPiece : nextPiece,
                committed,
              });
            }
          }
          this.evaluate({
            piece: isSuperMatch ? nextSuperPiece : nextPiece,
            committed,
          });
        }
      }
    }
  }

  private getAdjacentTiles(x: number, y: number) {
    const cases: Array<Position> = [
      [x, y - 1],
      [x, y + 1],
      [x - 1, y],
      [x + 1, y],
    ];

    return cases.filter(
      ([x, y]) => x >= 0 && x <= size - 1 && y >= 0 && y <= size - 1
    );
  }

  private getBearJump(
    jumpedBears: Array<Position>,
    bearTypeId: PieceEnum.BEAR | PieceEnum.NINJA_BEAR
  ) {
    let bears = this.filterPieces(bearTypeId);
    bears = bears.filter((b) => {
      const idx = jumpedBears.findIndex(
        (jb) => jb[0] === b[0] && jb[1] === b[1]
      );
      return idx === -1 ? true : false;
    });
    const bearsWithJumps = bears.map(([bearX, bearY]) => {
      const spaces =
        bearTypeId === bear.id
          ? this.getAdjacentTiles(bearX, bearY)
          : this.filterPieces(empty.id);
      const possibleJumpTiles = spaces.filter((p) => {
        // cannot jump into swap tile
        if (p[0] === 0 && p[1] === 0) {
          return false;
        }
        return this.state.board[p[1]][p[0]].id === empty.id;
      });

      return [[bearX, bearY], possibleJumpTiles];
    });

    // find a bear with at least 1 possible jump
    const bearPieceIndex = bearsWithJumps.findIndex((b) => b[1].length > 0);
    const bearPiece = (bearsWithJumps[bearPieceIndex] as [
      Position,
      Array<Position>
    ]) ?? [[], []];

    return { bearsWithJumps, bearPiece };
  }

  private moveBears() {
    this.moveBearsType(PieceEnum.NINJA_BEAR);
    this.moveBearsType(PieceEnum.BEAR);
  }

  private moveBearsType(bearTypeId: PieceEnum.BEAR | PieceEnum.NINJA_BEAR) {
    const jumped: Array<Position> = [];
    let data = this.getBearJump(jumped, bearTypeId);
    let { bearsWithJumps, bearPiece } = data;
    let [[bearX, bearY], jumpTiles] = bearPiece;

    // move the normal bear
    while (jumpTiles.length > 0) {
      const [destX, destY] = this.state.randomizer.nextArrayItem(jumpTiles);

      this.recordEvent({
        type: "bear-move",
        piece: bearTypeId,
        from: {
          x: bearX,
          y: bearY,
        },
        to: {
          x: destX,
          y: destY,
        },
      });
      // jump bear
      const tmp = this.state.board[bearY][bearX];
      this.state.board[bearY][bearX] = empty;
      this.state.board[destY][destX] = tmp;

      jumped.push([destX, destY]);
      data = this.getBearJump(jumped, bearTypeId);
      ({ bearsWithJumps, bearPiece } = data);
      [[bearX, bearY], jumpTiles] = bearPiece;
    }

    // what's left now is the bears that cannot jump => convert to tombstone
    bearsWithJumps.forEach((bwj) => {
      const [pos, _] = bwj as [Position, Array<Position>];
      const [bearX, bearY] = pos;
      this.recordEvent({
        type: "transform",
        x: bearX,
        y: bearY,
        from: this.state.board[bearY][bearX].id,
        to: tombStone.id,
      });
      this.state.board[bearY][bearX] = tombStone;
    });
  }

  private swap() {
    if (this.state.swapPiece) {
      const tmp = this.state.swapPiece;
      this.state.swapPiece = this.state.currentPiece;
      this.state.currentPiece = tmp;
    } else {
      this.state.swapPiece = this.state.currentPiece;
      this.state.currentPiece = this.randomUserPiece();
    }
    this.state.lastActionPos = [0, 0];
  }

  private record(d: Data) {
    this.history.unshift(d);
  }

  private recordEvent(e: Event) {
    this.localEvents.unshift(e);
  }

  private recordTurnEvent() {
    this.state.events.unshift(this.localEvents);
  }

  private destroyIfAny(
    x: number,
    y: number,
    extras = { record: true, bypassMegaBomb: false }
  ) {
    const dest = this.state.board[y]?.[x];
    let hit = true;
    if (is(this.state.currentPiece, PieceEnum.ROBOT)) {
      hit = this.state.randomizer.nextBoolean();
    }
    switch (true) {
      case is(this.state.currentPiece, PieceEnum.MEGA_BOMB) &&
        !extras.bypassMegaBomb: {
        const positions: Array<Position> = [
          [x, y],
          [x + 1, y],
          [x, y + 1],
          [x + 1, y + 1],
        ];
        const destroys: Array<PieceEnum> = [];
        positions.forEach((pos) => {
          const dest = this.state.board[pos[1]]?.[pos[0]];
          if (dest) {
            if (
              is(dest, PieceEnum.BEAR) ||
              is(dest, PieceEnum.NINJA_BEAR) ||
              is(dest, PieceEnum.MOUNTAIN)
            ) {
              this.destroyIfAny(pos[0], pos[1], {
                record: true,
                bypassMegaBomb: true,
              });
            } else {
              destroys.push(this.state.board[pos[1]][pos[0]].id);
              this.destroyIfAny(pos[0], pos[1], {
                record: false,
                bypassMegaBomb: true,
              });
            }
          }
        });
        if (destroys.length > 0) {
          this.recordEvent({
            type: "destroy",
            x,
            y,
            pieces: destroys,
          });
        }

        break;
      }
      case (is(dest, PieceEnum.BEAR) || is(dest, PieceEnum.NINJA_BEAR)) &&
        (is(this.state.currentPiece, PieceEnum.ROBOT) ||
          is(this.state.currentPiece, PieceEnum.BOMB) ||
          is(this.state.currentPiece, PieceEnum.MEGA_BOMB)):
        if (hit) {
          this.state.board[y][x] = tombStone;
          if (extras.record) {
            this.recordEvent({
              type: "transform",
              x,
              y,
              from: dest.id,
              to: tombStone.id,
            });
          }
        }
        break;
      case !is(dest, PieceEnum.EMPTY) &&
        (is(this.state.currentPiece, PieceEnum.ROBOT) ||
          is(this.state.currentPiece, PieceEnum.BOMB) ||
          is(this.state.currentPiece, PieceEnum.MEGA_BOMB)):
        if (hit) {
          this.localPoints -= Math.max(0, this.localPoints - dest.points);
          this.state.board[y][x] = empty;
          if (extras.record) {
            this.recordEvent({ type: "destroy", x, y, pieces: [dest.id] });
          }
        }
        break;
      case is(dest, PieceEnum.MOUNTAIN) &&
        (is(this.state.currentPiece, PieceEnum.ROBOT) ||
          is(this.state.currentPiece, PieceEnum.BOMB) ||
          is(this.state.currentPiece, PieceEnum.MEGA_BOMB)):
        if (hit) {
          this.state.board[y][x] = treasure;
          if (extras.record) {
            this.recordEvent({
              type: "transform",
              x,
              y,
              from: PieceEnum.MOUNTAIN,
              to: treasure.id,
            });
          }
        }
        break;
      default:
        break;
    }
    if (!hit) {
      this.recordEvent({
        type: "miss",
        x,
        y,
      });
    }
  }

  private reconcile(x: number, y: number, committed = true) {
    let dest = this.state.board[y][x];
    const oldLastPos = this.state.lastActionPos;
    this.state.lastActionPos = [x, y];
    this.evaluate({ piece: this.state.board[y][x], x, y, committed });

    dest = this.state.board[y][x];
    switch (true) {
      // nothing to match, crystal will become rock
      case is(dest, PieceEnum.CRYSTAL):
        if (committed) {
          this.state.board[y][x] = rock;
        }
        this.recordEvent({
          type: "transform",
          x,
          y,
          from: PieceEnum.CRYSTAL,
          to: rock.id,
        });
        break;
      default:
        break;
    }

    // secondary means condensing secondary pieces like tombs -> church -> cathedral
    this.evaluate({ piece: tombStone, committed });
    this.evaluate({ piece: rock, committed });

    if (committed) {
      // finally, move the bears, this may create new tombstones
      this.moveBears();
    }

    // another evaluate to check for newly created tombstone
    this.evaluate({ piece: tombStone, committed });

    if (!committed) {
      this.state.lastActionPos = oldLastPos;
    }
  }

  private getHighestPiece() {
    let highestLevel = 0;
    let highestPiece = PieceEnum.EMPTY;
    for (const piece of this.state.board.flat()) {
      const level = Number(levelByPiece[piece.id]);
      if (!Number.isNaN(level) && level > highestLevel) {
        highestLevel = level;
        highestPiece = piece.id;
      }
    }

    return highestPiece;
  }

  private *round(): Generator<CustomNexValue, CustomNexValue, Data> {
    if (this.done) return { shouldRecord: true, valid: true, error: null };
    let d: Data;
    let proceed = false;
    let error = null;
    let shouldRecord = true;
    let committed = true;
    while (!proceed) {
      committed = true;
      shouldRecord = true;
      d = yield { shouldRecord, valid: proceed, error };
      committed = d.type !== "scan";

      switch (d.type) {
        case "use":
          const { pieceId, params } = d;
          switch (pieceId) {
            case PieceEnum.AIRDROPPER:
              const { target, dest } = params;
              const highestPiece = this.getHighestPiece();
              if (
                is(this.state.board[target[1]][target[0]], PieceEnum.EMPTY) ||
                !is(this.state.board[dest[1]][dest[0]], PieceEnum.EMPTY) ||
                this.state.board[target[1]][target[0]].id === highestPiece
              ) {
                shouldRecord = false;
                if (
                  this.state.board[target[1]][target[0]].id === highestPiece
                ) {
                  error = "Cannot clone the highest level piece on the board";
                } else if (
                  is(this.state.board[target[1]][target[0]], PieceEnum.EMPTY)
                ) {
                  error = "Cannot clone an empty slot";
                } else {
                  error = "The destination is not empty";
                }
                break;
              }
              const clone = this.state.board[target[1]][target[0]];
              this.state.board[dest[1]][dest[0]] = clone;
              this.reconcile(dest[0], dest[1]);
              proceed = true;
              break;
            case PieceEnum.TELEPORT_PORTAL:
              const { posA, posB } = params;
              if (
                !this.state.board[posA[1]][posA[0]] ||
                !this.state.board[posB[1]][posB[0]]
              ) {
                shouldRecord = false;
                error = "Wrong command, check the `hint` section";
                break;
              }
              const temp = this.state.board[posA[1]][posA[0]];
              this.state.board[posA[1]][posA[0]] =
                this.state.board[posB[1]][posB[0]];
              this.state.board[posB[1]][posB[0]] = temp;
              this.reconcile(posA[0], posA[1]);
              this.reconcile(posB[0], posB[1]);
              proceed = true;
              break;
            case PieceEnum.TERRAFORMER:
              const rocks = this.filterPieces(PieceEnum.ROCK);
              rocks.forEach((pos) => {
                this.state.board[pos[1]][pos[0]] = empty;
              });
              this.reconcile(0, 0);
              proceed = true;
              break;
            case PieceEnum.MEGA_BOMB:
            case PieceEnum.BOMB: {
              const { pos } = params;
              if (
                pos[0] >= 0 &&
                pos[0] <= size - 1 &&
                pos[1] >= 0 &&
                pos[1] <= size - 1
              ) {
                this.destroyIfAny(pos[0], pos[1]);
                this.reconcile(pos[0], pos[1]);
              } else {
                shouldRecord = false;
                error = "Wrong command, check the `hint` section";
              }
              proceed = true;
              break;
            }
            case PieceEnum.REROLL_BOX:
              proceed = true;
              break;
            default:
              break;
          }
          if (shouldRecord) {
            this.state.currentPiece = this.randomUserPiece();
          }
          break;
        case "scan":
          shouldRecord = false;
        case "admin-put":
        case "put":
          const { x, y } = d;
          let piece: Piece | undefined = this.state.currentPiece;
          if ("pieceId" in d) {
            shouldRecord = false;
            piece = get(d.pieceId);
          }
          if (!piece) break;
          this.state.currentPiece = piece;
          const dest = this.state.board[y]?.[x];
          if (x === 0 && y === 0) {
            this.swap();
            proceed = true;
          } else if (shopItems.map((p) => p.id).includes(piece.id)) {
            shouldRecord = false;
            error = "Cannot put shop item onto the board";
          } else {
            let oldPiece = this.state.board[y][x];
            if (committed) {
              this.localPoints += piece.points;

              this.destroyIfAny(x, y);
            }
            if (is(dest, PieceEnum.EMPTY) && !is(piece, PieceEnum.ROBOT)) {
              this.state.board[y][x] = piece;
            } else if (
              ![PieceEnum.BOMB, PieceEnum.MEGA_BOMB, PieceEnum.ROBOT].includes(
                piece.id
              )
            ) {
              shouldRecord = false;
              error = "Cannot place item: not an empty slot";
              break;
            }
            if (committed) {
              this.state.currentPiece = this.randomUserPiece();
            } else {
              this.state.affectedNodes = [];
            }
            this.reconcile(x, y, committed);
            if (!committed) {
              this.state.board[y][x] = oldPiece;
            }
            proceed = true;
          }
          break;
        case "swap":
          this.swap();
          proceed = true;
          break;
        case "spawn":
          this.spawn(d.piece);
          proceed = true;
          shouldRecord = false;
          break;
        case "buy":
          if (this.state.coins >= d.piece.price) {
            this.state.currentPiece = d.piece;
            this.state.coins -= d.piece.price;
          }
          proceed = true;
          break;
        case "add-coins":
          this.state.coins += d.coins;
          proceed = true;
          break;
        case "end":
          this.done = true;
          proceed = true;
        default:
          break;
      }

      // Finally, evaluate if the board is full, and the game should end
      if (d.type !== "end" && committed) {
        const isBoardFull = this.state.board.every((row, i) => {
          return row.every((c, j) =>
            i === 0 && j === 0 ? true : c.id !== empty.id
          );
        });

        if (isBoardFull) {
          this.state.isBoardFull = isBoardFull;

          // If board is full, evaluate if users have enough coin to purchase
          // a shop item that will affect game end evaluation (e.g. a bomb to clear up a slot)
          const shopItemsThatWillAffectGameEnd =
            this.state.config.shopItems.filter(
              (item) => item.willAffectGameEnd
            );

          // Check if users can buy shop items to continue game
          let canBuyShopItemsToContinueGame = false;
          if (shopItemsThatWillAffectGameEnd.length > 0) {
            canBuyShopItemsToContinueGame = shopItemsThatWillAffectGameEnd.some(
              (item) => item.price <= this.state.coins
            );
          }

          // Check if current piece is of any type that can affect game end
          let canUseCurrentPieceToContinueGame = false;
          if (this.state.currentPiece.willAffectGameEnd) {
            canUseCurrentPieceToContinueGame = true;
          }

          // Game will ended if both options fail
          this.done =
            !canBuyShopItemsToContinueGame && !canUseCurrentPieceToContinueGame;
        }
      }

      yield { shouldRecord, valid: proceed, error };
    }

    // calculate the point modifier for combos
    let pointModifier = 0;
    const condenseEvents = this.localEvents.filter(
      (e) => e.type === "condense"
    );
    if (condenseEvents.length > 1) {
      const superCondense = condenseEvents.filter(
        (e) => e.type === "condense" && e.super
      );
      if (superCondense.length > 1) {
        pointModifier = fullSuperPointModifier;
      } else {
        pointModifier = semiSuperPointModifier;
      }
    }
    if (committed) {
      this.state.points +=
        this.localPoints + Math.floor(this.localPoints * pointModifier);
    }

    // reset for next turn
    this.localPoints = 0;
    if (committed) {
      this.recordTurnEvent();
    }
    this.localEvents = [];
    return yield* this.round();
  }
}
