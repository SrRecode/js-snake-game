import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DIRECTIONS,
  cellsEqual,
  isOpposite,
  hitsSnake,
  placeFood,
  createGame,
  setDirection,
  step,
} from '../src/snake.js';

// Deterministic RNG so food placement is reproducible.
function seeded(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

test('createGame starts with a single centred segment, alive, score 0', () => {
  const game = createGame({ cols: 10, rows: 8, rng: seeded(1) });
  assert.equal(game.snake.length, 1);
  assert.deepEqual(game.snake[0], { x: 5, y: 4 });
  assert.equal(game.score, 0);
  assert.equal(game.alive, true);
  assert.ok(game.food);
});

test('food never spawns on the snake', () => {
  const game = createGame({ cols: 6, rows: 6, rng: seeded(2) });
  assert.ok(!hitsSnake(game.snake, game.food, true));
});

test('placeFood returns null when the board is full', () => {
  const full = {
    cols: 2,
    rows: 1,
    snake: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ],
    rng: seeded(3),
  };
  assert.equal(placeFood(full), null);
});

test('a normal step moves the head and keeps length', () => {
  const game = { ...createGame({ cols: 10, rows: 10, rng: seeded(4) }), food: null };
  const next = step(game);
  assert.deepEqual(next.snake[0], { x: 6, y: 5 });
  assert.equal(next.snake.length, 1);
  assert.equal(next.alive, true);
});

test('moving into the vacated tail cell is allowed', () => {
  // Head (1,1) is about to move down into (1,2), which is the current tail.
  // Because the tail vacates this tick, this must NOT count as a collision.
  const game = {
    cols: 5,
    rows: 5,
    snake: [
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 1, y: 2 },
    ],
    dir: DIRECTIONS.down,
    food: null,
    score: 0,
    alive: true,
    rng: seeded(5),
  };
  const next = step(game);
  assert.equal(next.alive, true);
  assert.deepEqual(next.snake[0], { x: 1, y: 2 });
  assert.equal(next.snake.length, 4);
});

test('eating food grows the snake and increments the score', () => {
  const game = {
    cols: 10,
    rows: 10,
    snake: [{ x: 4, y: 4 }],
    dir: DIRECTIONS.right,
    food: { x: 5, y: 4 },
    score: 3,
    alive: true,
    rng: seeded(6),
  };
  const next = step(game);
  assert.equal(next.snake.length, 2);
  assert.equal(next.score, 4);
  assert.deepEqual(next.snake[0], { x: 5, y: 4 });
  assert.ok(next.food);
});

test('hitting a wall ends the game', () => {
  const game = {
    cols: 5,
    rows: 5,
    snake: [{ x: 4, y: 0 }],
    dir: DIRECTIONS.right,
    food: null,
    score: 0,
    alive: true,
    rng: seeded(7),
  };
  const next = step(game);
  assert.equal(next.alive, false);
  assert.equal(next.deathReason, 'wall');
});

test('running into your own body ends the game', () => {
  // Head (5,5) turns left into (4,5), which is still a body segment when the
  // tail (4,4) is excluded, so this is a self-collision.
  const game = {
    cols: 10,
    rows: 10,
    snake: [
      { x: 5, y: 5 },
      { x: 5, y: 6 },
      { x: 4, y: 6 },
      { x: 4, y: 5 },
      { x: 4, y: 4 },
    ],
    dir: DIRECTIONS.left,
    food: null,
    score: 0,
    alive: true,
    rng: seeded(8),
  };
  const next = step(game);
  assert.equal(next.alive, false);
  assert.equal(next.deathReason, 'self');
});

test('setDirection ignores reversals and accepts turns', () => {
  const game = createGame({ cols: 8, rows: 8, rng: seeded(9) });
  assert.equal(setDirection(game, DIRECTIONS.left), game); // reverse of right
  const turned = setDirection(game, DIRECTIONS.up);
  assert.deepEqual(turned.dir, DIRECTIONS.up);
  assert.equal(turned !== game, true);
});

test('a dead snake does not move further', () => {
  const dead = { ...createGame({ cols: 8, rows: 8, rng: seeded(10) }), alive: false };
  assert.equal(step(dead), dead);
});

test('isOpposite and cellsEqual behave as expected', () => {
  assert.equal(isOpposite(DIRECTIONS.up, DIRECTIONS.down), true);
  assert.equal(isOpposite(DIRECTIONS.up, DIRECTIONS.left), false);
  assert.equal(cellsEqual({ x: 1, y: 2 }, { x: 1, y: 2 }), true);
});
