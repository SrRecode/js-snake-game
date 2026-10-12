// Pure Snake game logic. The renderer lives in ui.js; everything here is a
// pure function of state so the rules can be unit tested without a canvas.

export const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export const cellsEqual = (a, b) => a.x === b.x && a.y === b.y;

export const isOpposite = (a, b) => a.x === -b.x && a.y === -b.y;

/** Does `point` land on any cell of `snake`? Optionally include the tail. */
export function hitsSnake(snake, point, includeTail = false) {
  const cells = includeTail ? snake : snake.slice(0, Math.max(0, snake.length - 1));
  return cells.some((cell) => cellsEqual(cell, point));
}

/** Choose a free cell for the next food, or null when the board is full. */
export function placeFood(state, rng = state.rng ?? Math.random) {
  const occupied = new Set(state.snake.map((cell) => `${cell.x},${cell.y}`));
  const free = [];
  for (let y = 0; y < state.rows; y += 1) {
    for (let x = 0; x < state.cols; x += 1) {
      if (!occupied.has(`${x},${y}`)) free.push({ x, y });
    }
  }
  if (free.length === 0) return null;
  const index = Math.min(free.length - 1, Math.floor((rng() || 0) * free.length));
  return free[index];
}

/** Start a fresh game with a one-segment snake in the middle. */
export function createGame({ cols = 20, rows = 20, rng = Math.random } = {}) {
  const snake = [{ x: Math.floor(cols / 2), y: Math.floor(rows / 2) }];
  const state = { cols, rows, snake, dir: DIRECTIONS.right, food: null, score: 0, alive: true, rng };
  state.food = placeFood(state, rng);
  return state;
}

/** Turn the snake. Ignores reversals (and no-ops when already dead). */
export function setDirection(state, dir) {
  if (!state.alive || !dir || isOpposite(dir, state.dir)) return state;
  return { ...state, dir };
}

/**
 * Advance one tick. Returns a new state; never mutates the input.
 * Deaths carry a `deathReason` of 'wall' or 'self'.
 */
export function step(state) {
  if (!state.alive) return state;

  const head = { x: state.snake[0].x + state.dir.x, y: state.snake[0].y + state.dir.y };
  const eating = Boolean(state.food) && cellsEqual(head, state.food);

  const outOfBounds =
    head.x < 0 || head.y < 0 || head.x >= state.cols || head.y >= state.rows;
  if (outOfBounds) return { ...state, alive: false, deathReason: 'wall' };

  // The tail vacates its cell this tick unless the snake is growing.
  if (hitsSnake(state.snake, head, eating)) {
    return { ...state, alive: false, deathReason: 'self' };
  }

  const snake = [head, ...state.snake];
  if (!eating) snake.pop();

  const next = { ...state, snake, score: eating ? state.score + 1 : state.score };
  if (eating) next.food = placeFood(next, state.rng);
  return next;
}
