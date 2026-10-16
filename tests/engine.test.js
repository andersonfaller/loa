// Engine tests. Run with: node --test tests/
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const LOA = require('../js/engine.js');

const { BLACK, WHITE, EMPTY } = LOA;
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]];

// --- Straightforward reference implementation of the rules -------------

function refMoves(cells, side) {
  const out = [];
  const inside = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
  for (let s = 0; s < 64; s++) {
    if (cells[s] !== side) continue;
    const r = s >> 3, c = s & 7;
    for (const [dr, dc] of DIRS) {
      let count = 1;
      for (const k of [1, -1]) {
        let rr = r + dr * k, cc = c + dc * k;
        while (inside(rr, cc)) { if (cells[rr * 8 + cc]) count++; rr += dr * k; cc += dc * k; }
      }
      const tr = r + dr * count, tc = c + dc * count;
      if (!inside(tr, tc) || cells[tr * 8 + tc] === side) continue;
      let blocked = false;
      for (let k = 1; k < count; k++) if (cells[(r + dr * k) * 8 + c + dc * k] === 3 - side) blocked = true;
      if (!blocked) out.push(s | ((tr * 8 + tc) << 6));
    }
  }
  return out.sort((a, b) => a - b);
}

function refGroups(cells, side) {
  const seen = new Set();
  let groups = 0;
  for (let s = 0; s < 64; s++) {
    if (cells[s] !== side || seen.has(s)) continue;
    groups++;
    const stack = [s];
    seen.add(s);
    while (stack.length) {
      const q = stack.pop();
      for (const [dr, dc] of DIRS) {
        const r = (q >> 3) + dr, c = (q & 7) + dc;
        const t = r * 8 + c;
        if (r >= 0 && r < 8 && c >= 0 && c < 8 && cells[t] === side && !seen.has(t)) { seen.add(t); stack.push(t); }
      }
    }
  }
  return groups;
}

function rng(seed) {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
}

function fromDiagram(rows, side) {
  const cells = [];
  for (const row of rows) for (const ch of row.replace(/\s+/g, '')) cells.push(ch === 'b' ? BLACK : ch === 'w' ? WHITE : EMPTY);
  assert.equal(cells.length, 64);
  return new LOA.Position().setup(cells, side || BLACK);
}

// --- Tests --------------------------------------------------------------

test('standard start position', () => {
  const pos = new LOA.Position().setup(LOA.startPosition('standard'), BLACK);
  assert.equal(pos.pcount[BLACK], 12);
  assert.equal(pos.pcount[WHITE], 12);
  assert.equal(pos.side, BLACK);
  assert.deepEqual(pos.legalMoves().sort((a, b) => a - b), refMoves(pos.board, BLACK));
  assert.equal(pos.legalMoves().length, 36);
  assert.equal(pos.countGroups(BLACK), 2);
  assert.equal(pos.countGroups(WHITE), 2);
});

test('scrambled eggs start position is balanced and symmetric', () => {
  const cells = LOA.startPosition('scrambled');
  assert.equal(cells.filter((p) => p === BLACK).length, 12);
  assert.equal(cells.filter((p) => p === WHITE).length, 12);
  for (let s = 0; s < 64; s++) assert.equal(cells[s], cells[63 - s]);
});

test('move generation, make/unmake and hashing agree with the reference rules', () => {
  const random = rng(12345);
  for (const variant of ['standard', 'scrambled']) {
    for (let game = 0; game < 120; game++) {
      const pos = new LOA.Position().setup(LOA.startPosition(variant), BLACK);
      const played = [];
      for (let ply = 0; ply < 120; ply++) {
        const moves = pos.legalMoves().sort((a, b) => a - b);
        assert.deepEqual(moves, refMoves(pos.board, pos.side));
        assert.equal(pos.countGroups(BLACK), refGroups(pos.board, BLACK));
        assert.equal(pos.countGroups(WHITE), refGroups(pos.board, WHITE));

        // Incremental state must match a fresh setup of the same board.
        const fresh = new LOA.Position().setup(pos.board, pos.side);
        assert.deepEqual(Array.from(pos.lines), Array.from(fresh.lines));
        assert.equal(pos.lo, fresh.lo);
        assert.equal(pos.hi, fresh.hi);

        if (!moves.length) break;
        const m = moves[Math.floor(random() * moves.length)];
        const cap = pos.board[m >> 6] !== EMPTY;
        pos.make(m);
        played.push(m);
        if (pos.resultAfterMove(cap) !== 0) break;
      }
      for (let i = played.length - 1; i >= 0; i--) pos.unmake(played[i]);
      const start = new LOA.Position().setup(LOA.startPosition(variant), BLACK);
      assert.deepEqual(Array.from(pos.board), Array.from(start.board));
      assert.equal(pos.lo, start.lo);
      assert.equal(pos.hp, 0);
    }
  }
});

test('jumping: own pieces can be jumped, enemy pieces block', () => {
  const pos = fromDiagram([
    '........',
    '........',
    '........',
    '..w.....',
    '.bb..b..',
    'b.......',
    '........',
    '........',
  ]);
  const b4 = 4 * 8 + 1;
  const moves = pos.legalMoves().filter((m) => (m & 63) === b4).map((m) => LOA.squareName(m >> 6));
  assert.ok(moves.includes('e4'), 'jumps over its own piece on c4');
  assert.ok(!moves.includes('e7'), 'cannot jump over the white piece on c5');
});

test('connection and win detection', () => {
  const pos = fromDiagram([
    '........',
    '..bb....',
    '..b.....',
    '...b..w.',
    '........',
    '.w......',
    '........',
    '........',
  ]);
  assert.equal(pos.isConnected(BLACK), true);
  assert.equal(pos.isConnected(WHITE), false);
  assert.equal(pos.countGroups(WHITE), 2);
  assert.deepEqual(pos.groupOf(1 * 8 + 2).sort((a, b) => a - b), [10, 11, 18, 27]);
});

function refApply(cells, m) {
  const next = Array.from(cells);
  next[m >> 6] = next[m & 63];
  next[m & 63] = EMPTY;
  return next;
}

function refHasWin(pos) {
  return refMoves(pos.board, pos.side).some((m) => refGroups(refApply(pos.board, m), pos.side) === 1);
}

test('hasWinningMove agrees with brute force on random positions', () => {
  const random = rng(777);
  let wins = 0;
  for (let game = 0; game < 200; game++) {
    const pos = new LOA.Position().setup(LOA.startPosition('standard'), BLACK);
    for (let ply = 0; ply < 80; ply++) {
      const groups = pos.countGroups(pos.side);
      const expected = refHasWin(pos);
      assert.equal(pos.hasWinningMove(groups), expected);
      if (expected) wins++;
      const moves = pos.legalMoves();
      if (!moves.length) break;
      const m = moves[Math.floor(random() * moves.length)];
      const cap = pos.board[m >> 6] !== EMPTY;
      pos.make(m);
      if (pos.resultAfterMove(cap) !== 0) break;
    }
  }
  assert.ok(wins > 0, 'sample should contain winning positions');
});

test('a single remaining piece counts as connected', () => {
  const pos = fromDiagram([
    '........',
    '........',
    '...w....',
    '........',
    '..b..b..',
    '........',
    '........',
    '........',
  ], WHITE);
  assert.equal(pos.isConnected(WHITE), true);
});

test('search takes an immediate win', () => {
  const random = rng(99);
  const searcher = new LOA.Searcher(16);
  let checked = 0;
  for (let game = 0; game < 200 && checked < 20; game++) {
    const pos = new LOA.Position().setup(LOA.startPosition('standard'), BLACK);
    for (let ply = 0; ply < 80; ply++) {
      if (refHasWin(pos)) {
        const res = searcher.search(pos.clone(), { timeMs: 500 });
        const after = pos.clone();
        after.make(res.move);
        assert.equal(after.isConnected(pos.side), true);
        assert.ok(res.score >= LOA.WIN_THRESHOLD);
        checked++;
        break;
      }
      const moves = pos.legalMoves();
      if (!moves.length) break;
      const m = moves[Math.floor(random() * moves.length)];
      const cap = pos.board[m >> 6] !== EMPTY;
      pos.make(m);
      if (pos.resultAfterMove(cap) !== 0) break;
    }
  }
  assert.ok(checked > 0);
});

test('search prevents an immediate loss when possible', () => {
  const random = rng(4242);
  const searcher = new LOA.Searcher(16);
  let checked = 0;
  for (let game = 0; game < 400 && checked < 25; game++) {
    const pos = new LOA.Position().setup(LOA.startPosition('standard'), BLACK);
    for (let ply = 0; ply < 60; ply++) {
      const moves = pos.legalMoves();
      if (!moves.length) break;
      // Position where the opponent threatens to win but we can stop it.
      const me = pos.side, opp = 3 - me;
      const threatened = refMoves(pos.board, opp).some((r) => refGroups(refApply(pos.board, r), opp) === 1);
      const safe = !threatened ? [] : moves.filter((m) => {
        const next = refApply(pos.board, m);
        if (refGroups(next, me) === 1) return true;
        if (refGroups(next, opp) === 1) return false;
        return !refMoves(next, opp).some((r) => refGroups(refApply(next, r), opp) === 1);
      });
      if (threatened && safe.length && safe.length < moves.length) {
        const res = searcher.search(pos.clone(), { maxDepth: 2, timeMs: 2000 });
        assert.ok(safe.includes(res.move), 'search must pick a move that does not allow a one-move win');
        checked++;
      }
      const m = moves[Math.floor(random() * moves.length)];
      const cap = pos.board[m >> 6] !== EMPTY;
      pos.make(m);
      if (pos.resultAfterMove(cap) !== 0) break;
    }
  }
  assert.ok(checked > 0);
});

test('repetition detection', () => {
  const pos = new LOA.Position().setup(LOA.startPosition('standard'), BLACK);
  const findMove = (from, to) => pos.legalMoves().find((m) => (m & 63) === from && (m >> 6) === to);

  // Find two non-capturing moves (one per side) that can both be reversed.
  let cycle = null;
  for (const mb of pos.legalMoves()) {
    pos.make(mb);
    for (const mw of pos.legalMoves()) {
      if (pos.board[mw >> 6]) continue;
      pos.make(mw);
      const backB = findMove(mb >> 6, mb & 63);
      if (backB !== undefined) {
        pos.make(backB);
        const backW = findMove(mw >> 6, mw & 63);
        pos.unmake(backB);
        if (backW !== undefined) cycle = [mb, mw, backB, backW];
      }
      pos.unmake(mw);
      if (cycle) break;
    }
    pos.unmake(mb);
    if (cycle) break;
  }
  assert.ok(cycle, 'found a reversible cycle');

  for (const m of cycle) pos.make(m);
  assert.equal(pos.repetitionCount(), 2);
  assert.equal(pos.isRepetition(), true);
  for (const m of cycle) pos.make(m);
  assert.equal(pos.repetitionCount(), 3);
});
