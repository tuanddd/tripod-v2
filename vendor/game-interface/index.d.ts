interface Player {
  id: string;
  name: string;
}

declare type Data = any;

interface Game<S extends any, P extends Player = Player, D extends Data = {}> {
  id: string;
  name: string;
  players: Array<P>;
  done: boolean;
  started: boolean;
  winners: Array<P>;
  state: S;
  nextState(data: D): {
    error: string | null;
    valid: boolean;
  };
  join(p: P): void;
  leave(p: P): void;
  start(): void;
  history: Array<Data>;
}

export type { Game, Player };
