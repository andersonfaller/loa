# LoA - Lines of Action

Vibe coded game of LoA with an AI opponent. Developed with Google Gemini.

Play [here](https://andersonfaller.github.io/loa/)

## Features

- **Strong AI** running in a Web Worker (the page never freezes): iterative-deepening
  alpha-beta (PVS) with a transposition table, killer/history move ordering, late-move
  reductions, null-move pruning and exact one-move-win detection at the leaves.
- **Five difficulty levels**, from *Beginner* (plays loosely, ideal for learning) to *Master*.
- **Game modes:** against the computer (choose your colour), two players on the same device,
  or watch AI vs AI. Classic setup or the *Scrambled Eggs* variant.
- **Polished board:** animated moves and captures, drag-and-drop or tap-to-move, legal-move
  dots, path preview, connection lines between your pieces (so you can see your groups),
  winning-group glow and confetti.
- **Tools:** undo, hints, evaluation bar, move list with full game review (◀ ▶ / arrow keys).
- **Settings:** four board themes, sound effects (synthesised, no audio files), toggles for
  connections, legal moves, coordinates, animations and the evaluation bar.
- Portuguese and English UI, illustrated rules, responsive layout for phones, and the current
  game is saved so a reload resumes it.

## Rules in short

Each player starts with 12 pieces. A piece moves in a straight line exactly as many squares as
there are pieces (of both colours) on that line; it may jump over its own pieces but not over
enemy pieces, and captures by landing on an enemy piece. The first player to join all of their
pieces into a single connected group (including diagonals) wins.

## Running locally

It is a static site: open `index.html` directly, or serve the folder (recommended, so the AI
runs in a Web Worker):

```sh
npx http-server .
```

## Project structure

| Path | What it is |
| --- | --- |
| `index.html` | Page markup |
| `css/style.css` | Styles and board themes |
| `js/engine.js` | Rules, move generation, evaluation and search (shared by the page, the worker and the tests) |
| `js/worker.js` | Runs the search off the main thread |
| `js/app.js` | User interface |
| `tests/engine.test.js` | Engine tests, checked against a straightforward reference implementation of the rules |

## Tests

```sh
npm test
```
