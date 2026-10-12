# Snake

The classic Snake game, built with plain JavaScript and an HTML `<canvas>`.
No frameworks and no build step — the only dependency is your browser.

## Features

- Responsive canvas board that scales to its container
- Arrow keys **or** WASD to steer, Space to pause, Enter to restart
- Swipe gestures on touch devices
- Score and a persistent best score (saved in `localStorage`)
- Speed ramps up as your score grows
- Clean game-over and pause overlays

## Getting started

Serve the folder over HTTP (ES modules do not load from `file://`):

```bash
npm start        # runs: npx --yes serve .
```

Then open the printed URL and press **Play**. Any static server works
(`python -m http.server`, VS Code Live Server, etc.).

## Project layout

```
index.html          Markup: HUD, canvas, overlay
styles.css          Styling (dark theme, responsive square board)
src/snake.js        Pure game rules: createGame, setDirection, step, placeFood
src/ui.js           Canvas rendering, input handling and the game loop
test/snake.test.js  Unit tests for the rules (node:test)
```

The rules in `src/snake.js` are intentionally pure — `step()` takes a state and
returns a **new** state, never mutating the input. That makes every rule
(movement, growth, wall/self collisions, no-reverse turning) testable without a
browser or canvas.

## Tests

```bash
npm test          # runs: node --test
```

Covers initial state, food placement (including a full board), normal movement,
allowing the head to enter the vacated tail cell, growth and scoring on eating,
wall and self collisions, reverse-turn rejection, and that a dead game stays put.

## Rules

- Eat the red food to grow and score a point.
- The game ends if you hit a wall or your own body.
- You cannot reverse directly into yourself; the turn is ignored.
- Each tick the snake advances one cell; its tail follows unless it just ate.

## License

MIT
