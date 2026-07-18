declare module "lodash.uniqby" {
  function uniqBy<T>(array: T[], iteratee: string | ((item: T) => unknown)): T[];
  export default uniqBy;
}

declare module "game-interface" {
  export interface Player {
    id: string;
    name: string;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type Data = any;
  export interface Game<S = unknown, P extends Player = Player, D = Data> {
    id: string;
    name: string;
    players: Array<P>;
    done: boolean;
    started: boolean;
    winners: Array<P>;
    state: S;
    nextState(data: D): { error: string | null; valid: boolean };
    join(p: P): void;
    leave(p: P): void;
    start(): void;
    history: Array<Data>;
  }
}
