import { DIRECTIONS, createGame, setDirection, step } from './snake.js';

const COLS = 20;
const ROWS = 20;
const BASE_INTERVAL = 130; // ms per tick at score 0
const MIN_INTERVAL = 65;
const BEST_KEY = 'js-snake-game.best';

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayText = document.getElementById('overlay-text');
const overlayButton = document.getElementById('overlay-button');

const cell = canvas.width / COLS;

let state;
let timer = null;
let paused = false;
let best = Number(localStorage.getItem(BEST_KEY)) || 0;

bestEl.textContent = String(best);

const KEY_DIRECTIONS = {
  ArrowUp: DIRECTIONS.up,
  ArrowDown: DIRECTIONS.down,
  ArrowLeft: DIRECTIONS.left,
  ArrowRight: DIRECTIONS.right,
  w: DIRECTIONS.up,
  s: DIRECTIONS.down,
  a: DIRECTIONS.left,
  d: DIRECTIONS.right,
};

function tickInterval(score) {
  return Math.max(MIN_INTERVAL, BASE_INTERVAL - score * 3);
}

function draw() {
  ctx.fillStyle = '#161b22';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle grid.
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let i = 1; i < COLS; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * cell, 0);
    ctx.lineTo(i * cell, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * cell);
    ctx.lineTo(canvas.width, i * cell);
    ctx.stroke();
  }

  if (state.food) {
    ctx.fillStyle = '#f87171';
    const pad = cell * 0.18;
    roundRect(state.food.x * cell + pad, state.food.y * cell + pad, cell - pad * 2, cell - pad * 2, cell * 0.3);
    ctx.fill();
  }

  state.snake.forEach((segment, index) => {
    ctx.fillStyle = index === 0 ? '#86efac' : '#4ade80';
    const pad = cell * 0.08;
    roundRect(segment.x * cell + pad, segment.y * cell + pad, cell - pad * 2, cell - pad * 2, cell * 0.25);
    ctx.fill();
  });
}

function roundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function updateScore() {
  scoreEl.textContent = String(state.score);
  if (state.score > best) {
    best = state.score;
    localStorage.setItem(BEST_KEY, String(best));
    bestEl.textContent = String(best);
  }
}

function schedule() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    if (!paused && state.alive) {
      state = step(state);
      updateScore();
      draw();
      if (!state.alive) return showGameOver();
    }
    schedule();
  }, tickInterval(state.score));
}

function showOverlay(title, text, buttonLabel) {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  overlayButton.textContent = buttonLabel;
  overlay.hidden = false;
}

function showGameOver() {
  const reason = state.deathReason === 'wall' ? 'You hit the wall.' : 'You bit yourself.';
  showOverlay('Game over', `${reason} Final score: ${state.score}.`, 'Play again');
}

function start() {
  state = createGame({ cols: COLS, rows: ROWS });
  paused = false;
  overlay.hidden = true;
  updateScore();
  draw();
  schedule();
}

function togglePause() {
  if (!state.alive) return;
  paused = !paused;
  if (paused) {
    showOverlay('Paused', 'Press Space to resume.', 'Resume');
  } else {
    overlay.hidden = true;
  }
}

function turn(dir) {
  state = setDirection(state, dir);
}

document.addEventListener('keydown', (event) => {
  if (event.key === ' ') {
    event.preventDefault();
    togglePause();
    return;
  }
  if (event.key === 'Enter' && !overlay.hidden) {
    event.preventDefault();
    start();
    return;
  }
  const dir = KEY_DIRECTIONS[event.key] ?? KEY_DIRECTIONS[event.key.toLowerCase()];
  if (dir) {
    event.preventDefault();
    turn(dir);
  }
});

let touchStart = null;
canvas.addEventListener('touchstart', (event) => {
  const touch = event.changedTouches[0];
  touchStart = { x: touch.clientX, y: touch.clientY };
});
canvas.addEventListener('touchend', (event) => {
  if (!touchStart) return;
  const touch = event.changedTouches[0];
  const dx = touch.clientX - touchStart.x;
  const dy = touch.clientY - touchStart.y;
  if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
  if (Math.abs(dx) > Math.abs(dy)) turn(dx > 0 ? DIRECTIONS.right : DIRECTIONS.left);
  else turn(dy > 0 ? DIRECTIONS.down : DIRECTIONS.up);
  touchStart = null;
});

overlayButton.addEventListener('click', () => {
  if (paused && state?.alive) togglePause();
  else start();
});

state = createGame({ cols: COLS, rows: ROWS });
draw();
showOverlay('Snake', 'Arrow keys or WASD to steer. Space to pause.', 'Play');
