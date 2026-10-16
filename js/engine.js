/*
 * Lines of Action — rules and AI engine.
 *
 * Shared by the UI (window.LOA), the search worker (self.LOA) and the Node tests (module.exports).
 *
 * Board: 64 squares, index = row * 8 + col, row 0 is the top of the board (rank 8).
 * Moves are encoded as `from | (to << 6)`; -1 is a pass.
 */
(function (root) {
  'use strict';

  const EMPTY = 0, BLACK = 1, WHITE = 2;
  const WIN = 30000;
  const WIN_THRESHOLD = WIN - 1000;
  const INF = 32000;
  const MAX_PLY = 64;
  const MAX_HISTORY = 4096;
  const PASS = -1;

  // Evaluation weights, see Position#evalSide.
  const W_CONC = 110;   // concentration around the centre of mass
  const W_CENT = 3;     // centralisation (piece-square table)
  const W_COM = 14;     // centre of mass far from the middle of the board
  const W_GROUP = 22;   // each extra group
  const W_QUAD = 7;     // dense 2x2 blocks (solid formations)
  const W_MOB = 1;      // weighted mobility
  const TEMPO = 12;

  /* ------------------------------------------------------------------ */
  /* Geometry tables                                                     */
  /* ------------------------------------------------------------------ */

  const ROW = new Int8Array(64), COL = new Int8Array(64);
  const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]];
  // Line used by each direction: 0 row, 1 column, 2 diagonal (r - c), 3 anti-diagonal (r + c).
  const DIR_LINE = [1, 1, 0, 0, 2, 2, 3, 3];
  // Line counter index for square s and line type t: LINE_OF[s * 4 + t] (0..45).
  const LINE_OF = new Uint8Array(256);
  const RAY_START = new Uint16Array(512), RAY_LEN = new Uint8Array(512);
  const NEIGH_START = new Uint16Array(65);
  const IS_EDGE = new Uint8Array(64);
  const PST = new Int8Array(64);
  const raySq = [], neighSq = [];

  for (let s = 0; s < 64; s++) {
    const r = s >> 3, c = s & 7;
    ROW[s] = r; COL[s] = c;
    LINE_OF[s * 4] = r;
    LINE_OF[s * 4 + 1] = 8 + c;
    LINE_OF[s * 4 + 2] = 16 + r - c + 7;
    LINE_OF[s * 4 + 3] = 31 + r + c;
    for (let d = 0; d < 8; d++) {
      RAY_START[s * 8 + d] = raySq.length;
      let rr = r + DIRS[d][0], cc = c + DIRS[d][1];
      while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) {
        raySq.push(rr * 8 + cc);
        rr += DIRS[d][0]; cc += DIRS[d][1];
      }
      RAY_LEN[s * 8 + d] = raySq.length - RAY_START[s * 8 + d];
    }
    NEIGH_START[s] = neighSq.length;
    for (const [dr, dc] of DIRS) {
      const rr = r + dr, cc = c + dc;
      if (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) neighSq.push(rr * 8 + cc);
    }
    IS_EDGE[s] = (r === 0 || r === 7 || c === 0 || c === 7) ? 1 : 0;
    const ring = Math.min(r, c, 7 - r, 7 - c);
    PST[s] = [-10, 0, 6, 10][ring];
    if ((r === 0 || r === 7) && (c === 0 || c === 7)) PST[s] = -18;
  }
  NEIGH_START[64] = neighSq.length;
  const RAYS = Int8Array.from(raySq);
  const NEIGHS = Int8Array.from(neighSq);

  // Minimal sum of (Chebyshev) distances to the centre of mass for n pieces packed together.
  const MINSUM = new Float64Array(17);
  [0, 0, 1, 2, 2, 4, 5, 6, 7, 8].forEach((v, i) => { MINSUM[i] = v; });
  for (let n = 10; n <= 16; n++) MINSUM[n] = 8 + 2 * (n - 9);

  /* ------------------------------------------------------------------ */
  /* Zobrist hashing (two 32-bit halves)                                 */
  /* ------------------------------------------------------------------ */

  let seed = 0x2545f491;
  function rnd32() {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
    return seed | 0;
  }
  const Z_LO = new Int32Array(3 * 64), Z_HI = new Int32Array(3 * 64);
  for (let i = 0; i < 3 * 64; i++) { Z_LO[i] = rnd32(); Z_HI[i] = rnd32(); }
  const ZS_LO = rnd32(), ZS_HI = rnd32();

  /* ------------------------------------------------------------------ */
  /* Position                                                            */
  /* ------------------------------------------------------------------ */

  class Position {
    constructor() {
      this.board = new Int8Array(64);
      this.lines = new Int8Array(46);
      this.plist = [null, new Int8Array(16), new Int8Array(16)];
      this.pcount = new Int8Array(3);
      this.pidx = new Int8Array(64);
      this.side = BLACK;
      this.lo = 0; this.hi = 0;
      // History stack: one entry per position reached (index hp is the current one).
      this.hp = 0;
      this.histLo = new Int32Array(MAX_HISTORY);
      this.histHi = new Int32Array(MAX_HISTORY);
      this.caps = new Int8Array(MAX_HISTORY);
      this.irrev = new Int16Array(MAX_HISTORY);
      // Scratch buffers.
      this.mark = new Int32Array(64);
      this.markGen = 0;
      this.stack = new Int8Array(64);
      this.quad = new Int8Array(81);
      this.scratch = new Int16Array(128);
    }

    setup(cells, side) {
      this.board.fill(0); this.lines.fill(0); this.pcount.fill(0); this.pidx.fill(0);
      this.lo = 0; this.hi = 0;
      for (let s = 0; s < 64; s++) {
        const p = cells[s];
        if (p !== BLACK && p !== WHITE) continue;
        this.board[s] = p;
        const n = this.pcount[p]++;
        this.plist[p][n] = s;
        this.pidx[s] = n;
        for (let t = 0; t < 4; t++) this.lines[LINE_OF[s * 4 + t]]++;
        this.lo ^= Z_LO[p * 64 + s]; this.hi ^= Z_HI[p * 64 + s];
      }
      this.side = side || BLACK;
      if (this.side === WHITE) { this.lo ^= ZS_LO; this.hi ^= ZS_HI; }
      this.hp = 0;
      this.histLo[0] = this.lo; this.histHi[0] = this.hi;
      this.caps[0] = 0; this.irrev[0] = 0;
      return this;
    }

    clone() {
      const p = new Position();
      p.setup(this.board, this.side);
      return p;
    }

    make(m) {
      const from = m & 63, to = m >> 6, s = this.side, o = 3 - s;
      const b = this.board, L = this.lines;
      const cap = b[to];
      const f4 = from << 2;
      L[LINE_OF[f4]]--; L[LINE_OF[f4 + 1]]--; L[LINE_OF[f4 + 2]]--; L[LINE_OF[f4 + 3]]--;
      b[from] = EMPTY;
      let lo = this.lo ^ Z_LO[s * 64 + from] ^ Z_LO[s * 64 + to] ^ ZS_LO;
      let hi = this.hi ^ Z_HI[s * 64 + from] ^ Z_HI[s * 64 + to] ^ ZS_HI;
      if (cap) {
        const list = this.plist[o], i = this.pidx[to], last = list[--this.pcount[o]];
        list[i] = last; this.pidx[last] = i;
        lo ^= Z_LO[o * 64 + to]; hi ^= Z_HI[o * 64 + to];
      } else {
        const t4 = to << 2;
        L[LINE_OF[t4]]++; L[LINE_OF[t4 + 1]]++; L[LINE_OF[t4 + 2]]++; L[LINE_OF[t4 + 3]]++;
      }
      b[to] = s;
      const i = this.pidx[from];
      this.plist[s][i] = to; this.pidx[to] = i;
      this.side = o; this.lo = lo; this.hi = hi;
      const hp = ++this.hp;
      this.histLo[hp] = lo; this.histHi[hp] = hi; this.caps[hp] = cap;
      this.irrev[hp] = cap ? hp : this.irrev[hp - 1];
    }

    unmake(m) {
      const from = m & 63, to = m >> 6, o = this.side, s = 3 - o;
      const b = this.board, L = this.lines;
      const cap = this.caps[this.hp--];
      const i = this.pidx[to];
      this.plist[s][i] = from; this.pidx[from] = i;
      b[from] = s;
      const f4 = from << 2;
      L[LINE_OF[f4]]++; L[LINE_OF[f4 + 1]]++; L[LINE_OF[f4 + 2]]++; L[LINE_OF[f4 + 3]]++;
      if (cap) {
        b[to] = o;
        const n = this.pcount[o]++;
        this.plist[o][n] = to; this.pidx[to] = n;
      } else {
        b[to] = EMPTY;
        const t4 = to << 2;
        L[LINE_OF[t4]]--; L[LINE_OF[t4 + 1]]--; L[LINE_OF[t4 + 2]]--; L[LINE_OF[t4 + 3]]--;
      }
      this.side = s;
      this.lo = this.histLo[this.hp]; this.hi = this.histHi[this.hp];
    }

    // A pass (only legal when the side to move has no moves). Also used for null-move pruning.
    makeNull() {
      this.side = 3 - this.side;
      this.lo ^= ZS_LO; this.hi ^= ZS_HI;
      const hp = ++this.hp;
      this.histLo[hp] = this.lo; this.histHi[hp] = this.hi;
      this.caps[hp] = 0; this.irrev[hp] = hp;
    }

    unmakeNull() {
      this.hp--;
      this.side = 3 - this.side;
      this.lo = this.histLo[this.hp]; this.hi = this.histHi[this.hp];
    }

    play(m) { if (m === PASS) this.makeNull(); else this.make(m); }

    // Generates the legal moves of `side` (default: side to move) into `out`; returns the count.
    genMoves(out, side) {
      const s = side || this.side, o = 3 - s, b = this.board, L = this.lines;
      const list = this.plist[s], n = this.pcount[s];
      let cnt = 0;
      for (let i = 0; i < n; i++) {
        const from = list[i], f4 = from << 2, f8 = from << 3;
        for (let d = 0; d < 8; d++) {
          const dist = L[LINE_OF[f4 + DIR_LINE[d]]];
          if (dist > RAY_LEN[f8 + d]) continue;
          const start = RAY_START[f8 + d];
          const to = RAYS[start + dist - 1];
          if (b[to] === s) continue;
          let k = start, end = start + dist - 1;
          for (; k < end; k++) if (b[RAYS[k]] === o) break;
          if (k === end) out[cnt++] = from | (to << 6);
        }
      }
      return cnt;
    }

    legalMoves(side) {
      const n = this.genMoves(this.scratch, side);
      return Array.from(this.scratch.subarray(0, n));
    }

    isLegal(m) {
      return this.legalMoves().indexOf(m) !== -1;
    }

    // Number of squares connected to `start` (8-neighbourhood), marking them with `gen`.
    flood(start, side, gen) {
      const mark = this.mark, st = this.stack, b = this.board;
      let sp = 0, cnt = 0;
      st[sp++] = start; mark[start] = gen;
      while (sp) {
        const q = st[--sp];
        cnt++;
        for (let k = NEIGH_START[q], e = NEIGH_START[q + 1]; k < e; k++) {
          const t = NEIGHS[k];
          if (b[t] === side && mark[t] !== gen) { mark[t] = gen; st[sp++] = t; }
        }
      }
      return cnt;
    }

    isConnected(side) {
      const n = this.pcount[side];
      if (n <= 1) return true;
      return this.flood(this.plist[side][0], side, ++this.markGen) === n;
    }

    countGroups(side) {
      const n = this.pcount[side], list = this.plist[side], gen = ++this.markGen;
      let groups = 0;
      for (let i = 0; i < n; i++) {
        const q = list[i];
        if (this.mark[q] !== gen) { groups++; this.flood(q, side, gen); }
      }
      return groups;
    }

    // Squares of the group containing `sq` (for UI highlighting).
    groupOf(sq) {
      const side = this.board[sq];
      if (!side) return [];
      const gen = ++this.markGen;
      this.flood(sq, side, gen);
      const out = [];
      for (let s = 0; s < 64; s++) if (this.mark[s] === gen) out.push(s);
      return out;
    }

    // After a move: 1 if the player who just moved won, -1 if the opponent won, 0 otherwise.
    // If both groups are connected at once, the mover wins.
    resultAfterMove(wasCapture) {
      const mover = 3 - this.side;
      if (this.isConnected(mover)) return 1;
      if (wasCapture && this.isConnected(this.side)) return -1;
      return 0;
    }

    // Can the side to move connect all of its pieces with a single move?
    hasWinningMove(groups) {
      const s = this.side;
      if (groups > 5) return false; // one move can join at most 4 groups plus the moving piece
      const moves = this.scratch, n = this.genMoves(moves, s), b = this.board;
      for (let i = 0; i < n; i++) {
        const m = moves[i], from = m & 63, to = m >> 6;
        let adj = false;
        for (let k = NEIGH_START[to], e = NEIGH_START[to + 1]; k < e; k++) {
          const t = NEIGHS[k];
          if (t !== from && b[t] === s) { adj = true; break; }
        }
        if (!adj) continue;
        this.make(m);
        const win = this.isConnected(s);
        this.unmake(m);
        if (win) return true;
      }
      return false;
    }

    // Two-fold repetition since the last irreversible move (used inside the search).
    isRepetition() {
      const lo = this.lo, hi = this.hi, stop = this.irrev[this.hp];
      for (let i = this.hp - 2; i >= stop; i -= 2) {
        if (this.histLo[i] === lo && this.histHi[i] === hi) return true;
      }
      return false;
    }

    repetitionCount() {
      const lo = this.lo, hi = this.hi, stop = this.irrev[this.hp];
      let n = 0;
      for (let i = this.hp; i >= stop; i -= 2) {
        if (this.histLo[i] === lo && this.histHi[i] === hi) n++;
      }
      return n;
    }

    // Weighted mobility: captures count double, moves onto the edge count half.
    mobility(side) {
      const s = side, o = 3 - s, b = this.board, L = this.lines;
      const list = this.plist[s], n = this.pcount[s];
      let total = 0;
      for (let i = 0; i < n; i++) {
        const from = list[i], f4 = from << 2, f8 = from << 3;
        for (let d = 0; d < 8; d++) {
          const dist = L[LINE_OF[f4 + DIR_LINE[d]]];
          if (dist > RAY_LEN[f8 + d]) continue;
          const start = RAY_START[f8 + d];
          const to = RAYS[start + dist - 1];
          if (b[to] === s) continue;
          let k = start, end = start + dist - 1;
          for (; k < end; k++) if (b[RAYS[k]] === o) break;
          if (k !== end) continue;
          let w = b[to] === o ? 4 : 2;
          if (IS_EDGE[to]) w >>= 1;
          total += w;
        }
      }
      return total;
    }

    // Static evaluation of one side, from that side's point of view.
    evalSide(side, groups) {
      const list = this.plist[side], n = this.pcount[side];
      if (n <= 1) return 0;
      let sr = 0, sc = 0, cent = 0;
      for (let i = 0; i < n; i++) {
        const q = list[i];
        sr += ROW[q]; sc += COL[q]; cent += PST[q];
      }
      const cr = sr / n, cc = sc / n;
      let sd = 0;
      for (let i = 0; i < n; i++) {
        const q = list[i];
        const dr = Math.abs(ROW[q] - cr), dc = Math.abs(COL[q] - cc);
        sd += dr > dc ? dr : dc;
      }
      const conc = (sd - MINSUM[n]) / n;
      const comDist = Math.max(Math.abs(cr - 3.5), Math.abs(cc - 3.5));

      // 2x2 blocks holding at least three of our pieces.
      const qd = this.quad;
      let dense = 0;
      for (let i = 0; i < n; i++) {
        const q = list[i], base = ROW[q] * 9 + COL[q];
        if (++qd[base] === 3) dense++;
        if (++qd[base + 1] === 3) dense++;
        if (++qd[base + 9] === 3) dense++;
        if (++qd[base + 10] === 3) dense++;
      }
      for (let i = 0; i < n; i++) {
        const q = list[i], base = ROW[q] * 9 + COL[q];
        qd[base] = 0; qd[base + 1] = 0; qd[base + 9] = 0; qd[base + 10] = 0;
      }

      return -W_CONC * conc + W_CENT * cent / n - W_COM * comDist -
        W_GROUP * (groups - 1) + W_QUAD * dense + W_MOB * this.mobility(side);
    }

    // Static evaluation from the point of view of the side to move.
    evaluate() {
      const s = this.side, o = 3 - s;
      return Math.round(this.evalSide(s, this.countGroups(s)) - this.evalSide(o, this.countGroups(o))) + TEMPO;
    }
  }

  /* ------------------------------------------------------------------ */
  /* Search: iterative deepening PVS with TT, killers, history, LMR and  */
  /* null-move pruning. Leaves detect one-move wins exactly.             */
  /* ------------------------------------------------------------------ */

  const TT_EXACT = 1, TT_LOWER = 2, TT_UPPER = 3;
  const now = (typeof performance !== 'undefined' && performance.now)
    ? () => performance.now() : () => Date.now();

  class Searcher {
    constructor(ttBits) {
      const size = 1 << (ttBits || 19);
      this.ttMask = size - 1;
      this.ttLo = new Int32Array(size);
      this.ttHi = new Int32Array(size);
      this.ttMove = new Int16Array(size);
      this.ttScore = new Int16Array(size);
      this.ttDepth = new Int8Array(size);
      this.ttFlag = new Int8Array(size);
      this.hist = new Int32Array(3 * 4096);
      this.killers = new Int16Array((MAX_PLY + 2) * 2);
      this.moveBuf = [];
      this.scoreBuf = [];
      for (let i = 0; i <= MAX_PLY + 1; i++) {
        this.moveBuf.push(new Int16Array(128));
        this.scoreBuf.push(new Int32Array(128));
      }
      this.nodes = 0;
      this.stop = false;
    }

    clear() {
      this.ttFlag.fill(0);
      this.hist.fill(0);
    }

    ttStore(pos, depth, score, flag, move, ply) {
      const idx = pos.lo & this.ttMask;
      if (score > WIN_THRESHOLD) score += ply;
      else if (score < -WIN_THRESHOLD) score -= ply;
      this.ttLo[idx] = pos.lo; this.ttHi[idx] = pos.hi;
      this.ttScore[idx] = score; this.ttDepth[idx] = depth;
      this.ttFlag[idx] = flag; this.ttMove[idx] = move;
    }

    search(pos, opts) {
      opts = opts || {};
      const start = now();
      const timeMs = opts.timeMs != null ? opts.timeMs : 1000;
      const maxDepth = Math.min(opts.maxDepth || MAX_PLY - 4, MAX_PLY - 4);
      const margin = opts.margin || 0;
      const random = opts.random || Math.random;
      this.pos = pos;
      this.nodes = 0;
      this.stop = false;
      this.deadline = start + timeMs;
      this.leafWinCheck = opts.leafWinCheck !== false;
      this.killers.fill(0);
      for (let i = 0; i < this.hist.length; i++) this.hist[i] >>= 3;

      const done = (move, score, depth, pv) => ({
        move, score, depth, pv: pv || (move === PASS ? [] : [move]),
        nodes: this.nodes, timeMs: Math.round(now() - start)
      });

      const buf = new Int16Array(128);
      const n = pos.genMoves(buf);
      if (n === 0) return done(PASS, 0, 0, []);

      // Immediate wins first: no search needed.
      for (let i = 0; i < n; i++) {
        const m = buf[i];
        const cap = pos.board[m >> 6] !== EMPTY;
        pos.make(m);
        const r = pos.resultAfterMove(cap);
        pos.unmake(m);
        if (r === 1) return done(m, WIN - 1, 1);
      }

      const moves = Array.from(buf.subarray(0, n));
      const scores = new Array(n).fill(-INF);
      // Initial ordering: TT move, then a cheap static guess.
      const idx = pos.lo & this.ttMask;
      const ttm = (this.ttFlag[idx] && this.ttLo[idx] === pos.lo && this.ttHi[idx] === pos.hi) ? this.ttMove[idx] : 0;
      const guess = moves.map((m) => (m === ttm ? 1e9 : 0) + (pos.board[m >> 6] ? 50 : 0) + PST[m >> 6] - PST[m & 63]);
      sortTogether(moves, guess);

      let bestMove = moves[0], bestScore = -INF, depthDone = 0, pv = [bestMove];
      let finalMoves = null, finalScores = null;
      for (let depth = 1; depth <= maxDepth; depth++) {
        const r = this.searchRoot(moves, scores, depth, margin);
        if (this.stop) {
          // Partial iteration: the previous best move is searched first, so the best completed move is trustworthy.
          if (r.done > 0) {
            if (r.bestMove !== bestMove) pv = [r.bestMove];
            bestMove = r.bestMove; bestScore = r.bestScore;
          }
          break;
        }
        bestMove = r.bestMove; bestScore = r.bestScore; depthDone = depth;
        sortTogether(moves, scores);
        finalMoves = moves.slice();
        finalScores = scores.slice();
        this.ttStore(pos, depth, bestScore, TT_EXACT, bestMove, 0);
        pv = this.principalVariation(pos, depth);
        if (!pv.length || pv[0] !== bestMove) pv = [bestMove];
        if (opts.onInfo) {
          opts.onInfo({ depth, score: bestScore, nodes: this.nodes, timeMs: Math.round(now() - start), pv });
        }
        if (Math.abs(bestScore) >= WIN_THRESHOLD) break;
        if (n === 1 && depth >= 2) break;
        if (now() - start > timeMs * 0.45) break;
      }

      // Weaker levels: choose among the moves that are within `margin` of the best one.
      if (margin > 0 && finalScores) {
        const top = Math.max.apply(null, finalScores);
        const cands = [];
        let total = 0;
        for (let i = 0; i < finalMoves.length; i++) {
          const sc = finalScores[i];
          if (sc >= top - margin && sc > -WIN_THRESHOLD) {
            const w = 1 + (sc - (top - margin));
            cands.push([finalMoves[i], sc, w]);
            total += w;
          }
        }
        if (cands.length) {
          let x = random() * total;
          for (const c of cands) {
            x -= c[2];
            if (x <= 0) { bestMove = c[0]; bestScore = c[1]; break; }
          }
          if (pv[0] !== bestMove) pv = [bestMove];
        }
      }
      return done(bestMove, bestScore, Math.max(depthDone, 1), pv);
    }

    searchRoot(moves, scores, depth, margin) {
      const pos = this.pos;
      let alpha = -INF, best = -INF, bestMove = moves[0], done = 0;
      for (let i = 0; i < moves.length; i++) {
        const m = moves[i];
        const cap = pos.board[m >> 6] !== EMPTY;
        pos.make(m);
        let sc;
        const r = pos.resultAfterMove(cap);
        if (r !== 0) sc = r > 0 ? WIN - 1 : -(WIN - 1);
        else if (margin > 0) {
          const lower = best === -INF ? -INF : best - margin;
          sc = -this.negamax(depth - 1, -INF, -lower, 1, true);
        } else if (i === 0) {
          sc = -this.negamax(depth - 1, -INF, -alpha, 1, true);
        } else {
          sc = -this.negamax(depth - 1, -alpha - 1, -alpha, 1, true);
          if (sc > alpha && !this.stop) sc = -this.negamax(depth - 1, -INF, -alpha, 1, true);
        }
        pos.unmake(m);
        if (this.stop) break;
        scores[i] = sc;
        done++;
        if (sc > best) { best = sc; bestMove = m; }
        if (sc > alpha) alpha = sc;
      }
      return { bestMove, bestScore: best, done };
    }

    negamax(depth, alpha, beta, ply, canNull) {
      if ((++this.nodes & 2047) === 0 && now() > this.deadline) this.stop = true;
      if (this.stop) return 0;
      const pos = this.pos;
      if (pos.isRepetition()) return 0;

      // Mate-distance pruning.
      const mateHi = WIN - ply - 1;
      if (beta > mateHi) { beta = mateHi; if (alpha >= beta) return beta; }

      const alphaOrig = alpha;
      const idx = pos.lo & this.ttMask;
      let ttMove = 0;
      if (this.ttFlag[idx] && this.ttLo[idx] === pos.lo && this.ttHi[idx] === pos.hi) {
        ttMove = this.ttMove[idx];
        if (this.ttDepth[idx] >= depth) {
          let sc = this.ttScore[idx];
          if (sc > WIN_THRESHOLD) sc -= ply; else if (sc < -WIN_THRESHOLD) sc += ply;
          const f = this.ttFlag[idx];
          if (f === TT_EXACT) return sc;
          if (f === TT_LOWER && sc >= beta) return sc;
          if (f === TT_UPPER && sc <= alpha) return sc;
        }
      }

      const s = pos.side;
      if (depth <= 0 || ply >= MAX_PLY) {
        const groups = pos.countGroups(s);
        if (this.leafWinCheck && pos.hasWinningMove(groups)) return WIN - ply - 1;
        return Math.round(pos.evalSide(s, groups) - pos.evalSide(3 - s, pos.countGroups(3 - s))) + TEMPO;
      }

      const pvNode = beta - alpha > 1;

      // Null-move pruning.
      if (canNull && !pvNode && depth >= 3 && beta < WIN_THRESHOLD && beta > -WIN_THRESHOLD &&
          pos.evaluate() >= beta) {
        const R = depth >= 6 ? 3 : 2;
        pos.makeNull();
        const sc = -this.negamax(depth - 1 - R, -beta, -beta + 1, ply + 1, false);
        pos.unmakeNull();
        if (this.stop) return 0;
        if (sc >= beta) return sc >= WIN_THRESHOLD ? beta : sc;
      }

      const moves = this.moveBuf[ply], ms = this.scoreBuf[ply];
      const n = pos.genMoves(moves);
      if (n === 0) {
        pos.makeNull();
        const sc = -this.negamax(depth - 1, -beta, -alpha, ply + 1, false);
        pos.unmakeNull();
        return sc;
      }

      const k1 = this.killers[ply * 2], k2 = this.killers[ply * 2 + 1];
      const hbase = s * 4096, b = pos.board;
      for (let i = 0; i < n; i++) {
        const m = moves[i];
        if (m === ttMove) ms[i] = 1 << 30;
        else if (m === k1) ms[i] = 2000000;
        else if (m === k2) ms[i] = 1900000;
        else ms[i] = (b[m >> 6] ? 1000000 : 0) + this.hist[hbase + m];
      }

      let best = -INF, bestMove = 0, searched = 0;
      for (let i = 0; i < n; i++) {
        // Selection sort: bring the best remaining move to position i.
        let bi = i, bv = ms[i];
        for (let j = i + 1; j < n; j++) if (ms[j] > bv) { bv = ms[j]; bi = j; }
        if (bi !== i) {
          const tm = moves[i]; moves[i] = moves[bi]; moves[bi] = tm;
          const ts = ms[i]; ms[i] = ms[bi]; ms[bi] = ts;
        }
        const m = moves[i];
        const cap = b[m >> 6] !== EMPTY;
        pos.make(m);
        let sc;
        const r = pos.resultAfterMove(cap);
        if (r !== 0) {
          sc = r > 0 ? WIN - ply - 1 : -(WIN - ply - 1);
        } else if (searched === 0) {
          sc = -this.negamax(depth - 1, -beta, -alpha, ply + 1, true);
        } else {
          let red = 0;
          if (depth >= 3 && searched >= 3 && !cap && m !== k1 && m !== k2) {
            red = searched >= 10 && !pvNode ? 2 : 1;
          }
          sc = -this.negamax(depth - 1 - red, -alpha - 1, -alpha, ply + 1, true);
          if (sc > alpha && red > 0 && !this.stop) sc = -this.negamax(depth - 1, -alpha - 1, -alpha, ply + 1, true);
          if (sc > alpha && sc < beta && !this.stop) sc = -this.negamax(depth - 1, -beta, -alpha, ply + 1, true);
        }
        pos.unmake(m);
        if (this.stop) return 0;
        searched++;
        if (sc > best) {
          best = sc; bestMove = m;
          if (sc > alpha) {
            alpha = sc;
            if (sc >= beta) {
              if (!cap) {
                if (m !== k1) { this.killers[ply * 2 + 1] = k1; this.killers[ply * 2] = m; }
                this.hist[hbase + m] += depth * depth;
              }
              break;
            }
          }
        }
      }

      const flag = best >= beta ? TT_LOWER : (best > alphaOrig ? TT_EXACT : TT_UPPER);
      this.ttStore(pos, depth, best, flag, bestMove, ply);
      return best;
    }

    principalVariation(pos, maxLen) {
      const pv = [], buf = new Int16Array(128);
      while (pv.length < maxLen) {
        const idx = pos.lo & this.ttMask;
        if (!this.ttFlag[idx] || this.ttLo[idx] !== pos.lo || this.ttHi[idx] !== pos.hi) break;
        const m = this.ttMove[idx];
        if (!m) break;
        const n = pos.genMoves(buf);
        let ok = false;
        for (let i = 0; i < n; i++) if (buf[i] === m) { ok = true; break; }
        if (!ok) break;
        const cap = pos.board[m >> 6] !== EMPTY;
        pos.make(m);
        pv.push(m);
        if (pos.resultAfterMove(cap) !== 0 || pos.isRepetition()) break;
      }
      for (let i = pv.length - 1; i >= 0; i--) pos.unmake(pv[i]);
      return pv;
    }
  }

  // Sorts `moves` by `scores` (descending, stable), reordering both arrays in place.
  function sortTogether(moves, scores) {
    const order = moves.map((m, i) => i).sort((a, b) => (scores[b] - scores[a]) || (a - b));
    const m2 = order.map((i) => moves[i]), s2 = order.map((i) => scores[i]);
    for (let i = 0; i < moves.length; i++) { moves[i] = m2[i]; scores[i] = s2[i]; }
  }

  /* ------------------------------------------------------------------ */
  /* Helpers                                                             */
  /* ------------------------------------------------------------------ */

  function startPosition(variant) {
    const cells = new Array(64).fill(EMPTY);
    for (let i = 1; i < 7; i++) {
      if (variant === 'scrambled') {
        // "Scrambled eggs": colours alternate along every edge (point-symmetric).
        cells[i] = i % 2 ? BLACK : WHITE;
        cells[56 + i] = i % 2 ? WHITE : BLACK;
        cells[i * 8] = i % 2 ? WHITE : BLACK;
        cells[i * 8 + 7] = i % 2 ? BLACK : WHITE;
      } else {
        cells[i] = BLACK;
        cells[56 + i] = BLACK;
        cells[i * 8] = WHITE;
        cells[i * 8 + 7] = WHITE;
      }
    }
    return cells;
  }

  const FILES = 'abcdefgh';
  function squareName(s) { return FILES[s & 7] + (8 - (s >> 3)); }
  function moveName(m, capture) {
    if (m === PASS) return '—';
    return squareName(m & 63) + (capture ? '×' : '–') + squareName(m >> 6);
  }

  const LOA = {
    EMPTY, BLACK, WHITE, PASS, WIN, WIN_THRESHOLD, INF,
    Position, Searcher,
    startPosition, squareName, moveName,
    from: (m) => m & 63,
    to: (m) => m >> 6,
    encode: (from, to) => from | (to << 6)
  };

  root.LOA = LOA;
  if (typeof module !== 'undefined' && module.exports) module.exports = LOA;
})(typeof self !== 'undefined' ? self : this);
