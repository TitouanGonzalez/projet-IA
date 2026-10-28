// Logique pure du jeu d'esquive : aucune dépendance au navigateur, donc testable.
export const GAME_WIDTH = 320;
export const GAME_HEIGHT = 420;
const SHIP_SIZE = 28;
const SHIP_SPEED = 230;
const HIT_MARGIN = 4;

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface GameState {
  ship: Box;
  obstacles: Box[];
  elapsed: number;
  spawnIn: number;
  over: boolean;
}
export type Direction = -1 | 0 | 1;

export function createGame(): GameState {
  return {
    ship: {
      x: (GAME_WIDTH - SHIP_SIZE) / 2,
      y: GAME_HEIGHT - SHIP_SIZE - 12,
      w: SHIP_SIZE,
      h: SHIP_SIZE,
    },
    obstacles: [],
    elapsed: 0,
    spawnIn: 0.6,
    over: false,
  };
}

export function score(state: GameState): number {
  return Math.floor(state.elapsed * 10);
}

// Vitesse de chute en px/s : elle monte doucement, puis se plafonne.
export function fallSpeed(elapsed: number, pace = 1): number {
  return Math.min(320, 110 + elapsed * 6) * pace;
}

export function spawnDelay(elapsed: number): number {
  return Math.max(0.35, 1 - elapsed * 0.02);
}

export function hits(a: Box, b: Box): boolean {
  const m = HIT_MARGIN;
  return (
    a.x + m < b.x + b.w - m &&
    a.x + a.w - m > b.x + m &&
    a.y + m < b.y + b.h - m &&
    a.y + a.h - m > b.y + m
  );
}

// Fait avancer la partie de dt secondes. `pace` ralentit les obstacles (mode calme).
export function step(
  state: GameState,
  dt: number,
  direction: Direction,
  rng: () => number,
  pace = 1,
): GameState {
  if (state.over) return state;
  const elapsed = state.elapsed + dt;
  const x = Math.min(
    GAME_WIDTH - state.ship.w,
    Math.max(0, state.ship.x + direction * SHIP_SPEED * dt),
  );
  const ship = { ...state.ship, x };
  const dy = fallSpeed(elapsed, pace) * dt;
  const obstacles = state.obstacles
    .map((o) => ({ ...o, y: o.y + dy }))
    .filter((o) => o.y < GAME_HEIGHT);
  let spawnIn = state.spawnIn - dt;
  if (spawnIn <= 0) {
    const w = 24 + Math.floor(rng() * 33);
    obstacles.push({
      x: Math.floor(rng() * (GAME_WIDTH - w)),
      y: -28,
      w,
      h: 28,
    });
    spawnIn = spawnDelay(elapsed);
  }
  const over = obstacles.some((o) => hits(ship, o));
  return { ship, obstacles, elapsed, spawnIn, over };
}
