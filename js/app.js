/* Lines of Action — user interface. */
(function () {
  'use strict';

  const { BLACK, WHITE, EMPTY, PASS, WIN, WIN_THRESHOLD } = LOA;
  const $ = (id) => document.getElementById(id);
  const MAX_PLIES = 300;
  const MOVE_MS = 300;

  /* ================================================================== */
  /* Text                                                                */
  /* ================================================================== */

  const STRINGS = {
    pt: {
      tagline: 'Conecte todas as suas peças',
      rules: 'Como jogar', sound: 'Som', settings: 'Configurações', close: 'Fechar',
      newGame: 'Nova partida', undo: 'Desfazer', hint: 'Dica', pause: 'Pausar', resume: 'Continuar',
      moves: 'Lances', noMoves: 'As pretas começam. Boa partida!',
      navFirst: 'Posição inicial', navPrev: 'Lance anterior', navNext: 'Próximo lance', navLast: 'Posição atual',
      footer: 'Lines of Action foi criado por Claude Soucie em 1969.',
      mode: 'Modo', modeAi: 'Contra o computador', modePvp: 'Dois jogadores', modeAiAi: 'Assistir IA × IA',
      yourColor: 'Suas peças', blackStarts: 'Pretas (começam)', whiteSide: 'Brancas', random: 'Sorteio',
      difficulty: 'Dificuldade', variant: 'Variante', variantStandard: 'Clássica', variantScrambled: 'Scrambled Eggs',
      start: 'Começar',
      theme: 'Tabuleiro', themeWood: 'Madeira', themeSlate: 'Ardósia', themeJade: 'Jade', themeMarble: 'Mármore',
      optLinks: 'Mostrar conexões entre peças', optLegal: 'Mostrar lances possíveis', optEval: 'Barra de avaliação',
      optCoords: 'Coordenadas', optAnim: 'Animações', optSound: 'Efeitos sonoros', language: 'Idioma',
      lvl1: 'Iniciante', lvl2: 'Fácil', lvl3: 'Médio', lvl4: 'Difícil', lvl5: 'Mestre',
      lvl1d: '<b>Iniciante:</b> joga quase ao acaso e não percebe suas ameaças. Ideal para aprender as regras.',
      lvl2d: '<b>Fácil:</b> olha um lance à frente e erra com frequência.',
      lvl3d: '<b>Médio:</b> calcula alguns lances adiante. Um bom desafio para quem já conhece o jogo.',
      lvl4d: '<b>Difícil:</b> busca profunda de cerca de 2 segundos por lance. Pune qualquer deslize.',
      lvl5d: '<b>Mestre:</b> força máxima, com até 5 segundos de cálculo por lance.',
      black: 'Pretas', white: 'Brancas', you: 'Você', computer: 'Computador', player1: 'Jogador 1', player2: 'Jogador 2',
      pieces: 'peças', groups: 'grupos', group: 'grupo', toMove: 'Vez', winner: 'Venceu', thinkingShort: 'pensando…',
      yourTurn: 'Sua vez', yourTurnSub: 'Toque ou arraste uma de suas peças.',
      turnBlack: 'Vez das pretas', turnWhite: 'Vez das brancas', turnSub: 'Toque ou arraste uma peça.',
      aiThinking: 'Computador pensando…', watching: 'Assistindo à partida entre IAs.', paused: 'Partida pausada.',
      reviewing: 'Revisando a partida', reviewingSub: 'Posição após {n} de {total} lances.',
      backToGame: 'Voltar ao jogo', reviewBanner: 'Lance {n} de {total}',
      winYou: 'Vitória!', loseYou: 'Derrota', winsBlack: 'Pretas vencem!', winsWhite: 'Brancas vencem!', draw: 'Empate',
      reasonConnect: 'Todas as peças foram unidas em um único grupo.',
      reasonRepetition: 'A mesma posição ocorreu três vezes.',
      reasonLimit: 'O limite de {n} lances foi atingido.',
      reasonStalemate: 'Nenhum dos jogadores tem lances.',
      statMoves: 'lances', statCaptures: 'capturas', statTime: 'duração',
      record: 'Placar no nível {level}: vitórias {w} · derrotas {l} · empates {d}',
      review: 'Revisar partida', playAgain: 'Jogar novamente',
      passBlack: 'As pretas não têm lances e passam a vez.', passWhite: 'As brancas não têm lances e passam a vez.',
      hintToast: 'Sugestão: {move}', hintThinking: 'Procurando o melhor lance…',
      reviewToast: 'Use ◀ ▶ ou as setas do teclado para navegar.',
      evalTitle: 'Avaliação da posição', evalWin: 'vitória forçada em {n}',
      engineInfo: 'Profundidade {d} · {n} posições · {s} s',
      resumed: 'Partida anterior restaurada.',
      rulesTitle: 'Como jogar',
      rulesLead: 'Lines of Action é um jogo de estratégia para dois jogadores. Cada um começa com 12 peças nas bordas do tabuleiro, e as pretas fazem o primeiro lance.',
      r1t: 'Movimento',
      r1p: 'Uma peça anda em linha reta (horizontal, vertical ou diagonal) exatamente tantas casas quantas forem as peças nessa linha. Aqui há 2 peças na linha: ela anda 2 casas.',
      r2t: 'Saltos',
      r2p: 'Você pode saltar sobre suas próprias peças, mas nunca sobre peças do adversário.',
      r3t: 'Captura',
      r3p: 'Terminar o lance sobre uma peça adversária a captura. Não é possível parar sobre uma peça sua.',
      r4t: 'Objetivo',
      r4p: 'Vence quem unir todas as suas peças em um único grupo, com ligações horizontais, verticais ou diagonais.',
      rulesMoreTitle: 'Detalhes e dicas',
      rulesMore: [
        '<b>Contagem:</b> conte as peças de toda a linha, nos dois sentidos, das duas cores, incluindo a própria peça.',
        '<b>Vitória simultânea:</b> se um lance conectar os dois jogadores ao mesmo tempo, vence quem fez o lance.',
        '<b>Uma única peça</b> já está conectada: quem fica reduzido a uma peça vence.',
        '<b>Sem lances:</b> o jogador passa a vez. <b>Empate</b> se a mesma posição se repetir três vezes.',
        '<b>Estratégia:</b> capturar nem sempre ajuda, pois cada captura deixa o adversário com uma peça a menos para conectar. Centralize suas peças e acompanhe as linhas de conexão desenhadas no tabuleiro.'
      ],
      gotIt: 'Entendi!',
      boardLabel: 'Tabuleiro'
    },
    en: {
      tagline: 'Connect all of your pieces',
      rules: 'How to play', sound: 'Sound', settings: 'Settings', close: 'Close',
      newGame: 'New game', undo: 'Undo', hint: 'Hint', pause: 'Pause', resume: 'Resume',
      moves: 'Moves', noMoves: 'Black moves first. Have a good game!',
      navFirst: 'Start position', navPrev: 'Previous move', navNext: 'Next move', navLast: 'Current position',
      footer: 'Lines of Action was invented by Claude Soucie in 1969.',
      mode: 'Mode', modeAi: 'Against the computer', modePvp: 'Two players', modeAiAi: 'Watch AI vs AI',
      yourColor: 'Your pieces', blackStarts: 'Black (moves first)', whiteSide: 'White', random: 'Random',
      difficulty: 'Difficulty', variant: 'Variant', variantStandard: 'Classic', variantScrambled: 'Scrambled Eggs',
      start: 'Start',
      theme: 'Board', themeWood: 'Wood', themeSlate: 'Slate', themeJade: 'Jade', themeMarble: 'Marble',
      optLinks: 'Show connections between pieces', optLegal: 'Show legal moves', optEval: 'Evaluation bar',
      optCoords: 'Coordinates', optAnim: 'Animations', optSound: 'Sound effects', language: 'Language',
      lvl1: 'Beginner', lvl2: 'Easy', lvl3: 'Medium', lvl4: 'Hard', lvl5: 'Master',
      lvl1d: '<b>Beginner:</b> plays almost at random and does not notice your threats. Great for learning the rules.',
      lvl2d: '<b>Easy:</b> looks one move ahead and makes frequent mistakes.',
      lvl3d: '<b>Medium:</b> calculates a few moves ahead. A good challenge once you know the game.',
      lvl4d: '<b>Hard:</b> deep search of about 2 seconds per move. Punishes any slip.',
      lvl5d: '<b>Master:</b> full strength, up to 5 seconds of calculation per move.',
      black: 'Black', white: 'White', you: 'You', computer: 'Computer', player1: 'Player 1', player2: 'Player 2',
      pieces: 'pieces', groups: 'groups', group: 'group', toMove: 'To move', winner: 'Winner', thinkingShort: 'thinking…',
      yourTurn: 'Your move', yourTurnSub: 'Tap or drag one of your pieces.',
      turnBlack: 'Black to move', turnWhite: 'White to move', turnSub: 'Tap or drag a piece.',
      aiThinking: 'Computer is thinking…', watching: 'Watching an AI vs AI game.', paused: 'Game paused.',
      reviewing: 'Reviewing the game', reviewingSub: 'Position after {n} of {total} moves.',
      backToGame: 'Back to game', reviewBanner: 'Move {n} of {total}',
      winYou: 'Victory!', loseYou: 'Defeat', winsBlack: 'Black wins!', winsWhite: 'White wins!', draw: 'Draw',
      reasonConnect: 'All pieces joined into a single group.',
      reasonRepetition: 'The same position occurred three times.',
      reasonLimit: 'The {n}-move limit was reached.',
      reasonStalemate: 'Neither player can move.',
      statMoves: 'moves', statCaptures: 'captures', statTime: 'duration',
      record: 'Record on {level}: wins {w} · losses {l} · draws {d}',
      review: 'Review game', playAgain: 'Play again',
      passBlack: 'Black has no legal moves and passes.', passWhite: 'White has no legal moves and passes.',
      hintToast: 'Suggestion: {move}', hintThinking: 'Looking for the best move…',
      reviewToast: 'Use ◀ ▶ or the arrow keys to step through the game.',
      evalTitle: 'Position evaluation', evalWin: 'forced win in {n}',
      engineInfo: 'Depth {d} · {n} positions · {s} s',
      resumed: 'Previous game restored.',
      rulesTitle: 'How to play',
      rulesLead: 'Lines of Action is a two-player strategy game. Each side starts with 12 pieces on the edges of the board, and Black moves first.',
      r1t: 'Movement',
      r1p: 'A piece moves in a straight line (horizontally, vertically or diagonally) exactly as many squares as there are pieces on that line. Here the line holds 2 pieces, so it moves 2 squares.',
      r2t: 'Jumping',
      r2p: 'You may jump over your own pieces, but never over your opponent’s.',
      r3t: 'Capturing',
      r3p: 'Ending a move on an enemy piece captures it. You cannot land on one of your own pieces.',
      r4t: 'Goal',
      r4p: 'Win by joining all of your pieces into one group, connected horizontally, vertically or diagonally.',
      rulesMoreTitle: 'Details and tips',
      rulesMore: [
        '<b>Counting:</b> count every piece on the whole line, in both directions and of both colours, including the moving piece.',
        '<b>Simultaneous connection:</b> if a move connects both players at once, the player who moved wins.',
        '<b>A single piece</b> is already connected: a player reduced to one piece wins.',
        '<b>No legal moves:</b> the player passes. <b>Draw</b> when the same position occurs three times.',
        '<b>Strategy:</b> capturing is not always good, since every capture leaves your opponent one fewer piece to connect. Keep your pieces central and watch the connection lines drawn on the board.'
      ],
      gotIt: 'Got it!',
      boardLabel: 'Board'
    }
  };

  /* ================================================================== */
  /* Persistence                                                         */
  /* ================================================================== */

  const store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem('loa.' + key);
        return v == null ? fallback : JSON.parse(v);
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem('loa.' + key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
    },
    remove(key) {
      try { localStorage.removeItem('loa.' + key); } catch (e) { /* storage unavailable */ }
    }
  };

  const browserLang = (navigator.language || 'en').toLowerCase().startsWith('pt') ? 'pt' : 'en';
  const settings = Object.assign({
    theme: 'wood', sound: true, links: true, legal: true, evalBar: true, coords: true, anim: true, lang: browserLang
  }, store.get('settings', {}));

  function saveSettings() { store.set('settings', settings); }

  function t(key, vars) {
    let s = STRINGS[settings.lang][key];
    if (s == null) s = STRINGS.en[key];
    if (s == null) return key;
    if (vars && typeof s === 'string') s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
    return s;
  }

  /* ================================================================== */
  /* Difficulty levels                                                   */
  /* ================================================================== */

  const LEVELS = [
    { key: 'lvl1', opts: { maxDepth: 1, margin: 220, leafWinCheck: false, timeMs: 3000 } },
    { key: 'lvl2', opts: { maxDepth: 2, margin: 90, timeMs: 3000 } },
    { key: 'lvl3', opts: { maxDepth: 4, margin: 30, timeMs: 900 } },
    { key: 'lvl4', opts: { timeMs: 1800 } },
    { key: 'lvl5', opts: { timeMs: 4500 } }
  ];

  /* ================================================================== */
  /* Engine client: search in a Web Worker, with a main-thread fallback  */
  /* ================================================================== */

  let jobSeq = 0;

  class EngineClient {
    constructor() {
      this.worker = null;
      this.local = null;
      this.job = null;
      this.spawn();
    }

    spawn() {
      this.worker = null;
      if (typeof Worker === 'undefined' || location.protocol === 'file:') return;
      try {
        const w = new Worker('js/worker.js');
        w.onmessage = (e) => this.onMessage(e.data);
        w.onerror = (e) => { if (e.preventDefault) e.preventDefault(); this.fallback(); };
        this.worker = w;
      } catch (e) {
        this.worker = null;
      }
    }

    fallback() {
      if (this.worker) this.worker.terminate();
      this.worker = null;
      this.useLocal = true;
      const job = this.job;
      if (job) this.runLocal(job);
    }

    search(payload, onInfo) {
      this.cancel();
      return new Promise((resolve) => {
        const job = { id: ++jobSeq, payload, onInfo, resolve };
        this.job = job;
        if (this.worker && !this.useLocal) {
          this.worker.postMessage(Object.assign({ type: 'search', id: job.id }, payload));
        } else {
          this.runLocal(job);
        }
      });
    }

    runLocal(job) {
      setTimeout(() => {
        if (this.job !== job) return;
        if (!this.local) this.local = new LOA.Searcher(18);
        const pos = new LOA.Position().setup(job.payload.start, job.payload.startSide);
        for (const m of job.payload.moves) pos.play(m);
        const res = this.local.search(pos, Object.assign({}, job.payload.opts, { onInfo: job.onInfo }));
        if (this.job !== job) return;
        this.job = null;
        job.resolve(res);
      }, 60);
    }

    onMessage(msg) {
      const job = this.job;
      if (!job || msg.id !== job.id) return;
      if (msg.type === 'info') {
        if (job.onInfo) job.onInfo(msg.info);
      } else if (msg.type === 'result') {
        this.job = null;
        job.resolve(msg.result);
      }
    }

    cancel() {
      const job = this.job;
      if (!job) return;
      this.job = null;
      job.resolve(null);
      if (this.worker) {
        // The search is synchronous inside the worker: restart it to stop immediately.
        this.worker.terminate();
        this.spawn();
      }
    }
  }

  const aiEngine = new EngineClient();
  const helperEngine = new EngineClient();

  /* ================================================================== */
  /* Sound (synthesised with Web Audio, no files needed)                 */
  /* ================================================================== */

  const Sound = {
    ctx: null,
    out: null,
    noiseBuf: null,
    unlocked: false,

    // Browsers only allow audio after a user gesture.
    unlock() {
      this.unlocked = true;
      this.ensure();
    },

    ensure() {
      if (!this.unlocked) return null;
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        this.ctx = new AC();
        this.out = this.ctx.createGain();
        this.out.gain.value = 0.55;
        this.out.connect(this.ctx.destination);
        const len = Math.floor(this.ctx.sampleRate * 0.25);
        this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const data = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    },

    tone(t0, freq, dur, vol, type, freqEnd) {
      const ctx = this.ctx, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t0);
      if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t0 + dur * 0.7);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g).connect(this.out);
      o.start(t0);
      o.stop(t0 + dur + 0.02);
    },

    noise(t0, dur, vol, freq) {
      const ctx = this.ctx, src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = this.noiseBuf;
      f.type = 'bandpass';
      f.frequency.value = freq;
      f.Q.value = 1.2;
      g.gain.setValueAtTime(vol, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(f).connect(g).connect(this.out);
      src.start(t0);
      src.stop(t0 + dur + 0.02);
    },

    play(name) {
      if (!settings.sound) return;
      const ctx = this.ensure();
      if (!ctx) return;
      const t0 = ctx.currentTime + 0.01;
      switch (name) {
        case 'move':
          this.tone(t0, 430, 0.12, 0.45, 'sine', 150);
          this.noise(t0, 0.035, 0.3, 2600);
          break;
        case 'capture':
          this.tone(t0, 300, 0.16, 0.5, 'sine', 90);
          this.noise(t0, 0.07, 0.35, 1500);
          this.tone(t0 + 0.06, 620, 0.12, 0.22, 'triangle', 300);
          break;
        case 'select':
          this.tone(t0, 900, 0.05, 0.08, 'sine');
          break;
        case 'hint':
          this.tone(t0, 660, 0.18, 0.12, 'sine');
          this.tone(t0 + 0.09, 990, 0.24, 0.1, 'sine');
          break;
        case 'start':
          [392, 523.25, 659.25].forEach((f, i) => this.tone(t0 + i * 0.06, f, 0.5, 0.07, 'triangle'));
          break;
        case 'win':
          [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => this.tone(t0 + i * 0.1, f, 0.5, 0.16, 'triangle'));
          break;
        case 'lose':
          [440, 349.23, 293.66, 220].forEach((f, i) => this.tone(t0 + i * 0.17, f, 0.5, 0.13, 'sine'));
          break;
        case 'draw':
          [440, 440 * 1.26].forEach((f, i) => this.tone(t0 + i * 0.14, f, 0.45, 0.12, 'sine'));
          break;
      }
    }
  };

  /* ================================================================== */
  /* Game state                                                          */
  /* ================================================================== */

  const defaultSetup = { mode: 'ai', color: 'black', level: 3, variant: 'standard' };
  const game = {
    setup: Object.assign({}, defaultSetup, store.get('setup', {})),
    mode: 'ai',
    level: 3,
    human: BLACK,
    start: null,
    moves: [],              // { m, side, capture }
    pos: new LOA.Position(),
    result: null,           // { winner: 0 | BLACK | WHITE, reason }
    gen: 0,                 // bumps on new game / undo to discard stale engine replies
    thinking: false,
    paused: false,
    hint: null,
    evalBlack: null,
    info: null,
    startedAt: 0,
    endedAt: 0
  };

  const ui = {
    selected: -1,
    targets: [],
    hover: -1,
    drag: null,
    review: null,           // number of moves shown while reviewing, or null when live
    reviewPos: new LOA.Position(),
    hintBusy: false,
    winSquares: null
  };

  const isAiSide = (side) => game.mode === 'aivai' || (game.mode === 'ai' && side !== game.human);
  const bottomSide = () => (game.mode === 'ai' ? game.human : BLACK);
  const isLive = () => ui.review === null;
  const viewPos = () => (isLive() ? game.pos : ui.reviewPos);
  const anyModalOpen = () => !!document.querySelector('.modal:not([hidden])');

  function humanToMove() {
    if (game.result) return false;
    if (game.mode === 'pvp') return true;
    return game.mode === 'ai' && game.pos.side === game.human;
  }

  function canHumanMove() {
    return humanToMove() && isLive() && !anyModalOpen();
  }

  function payload(opts) {
    return { start: Array.from(game.start), startSide: BLACK, moves: game.moves.map((r) => r.m), opts };
  }

  function rebuildPos() {
    game.pos.setup(game.start, BLACK);
    for (const r of game.moves) game.pos.play(r.m);
  }

  function saveGame() {
    if (game.result || !game.moves.length) { store.remove('game'); return; }
    store.set('game', {
      setup: game.setup, human: game.human, moves: game.moves.map((r) => r.m),
      elapsed: Date.now() - game.startedAt
    });
  }

  /* ================================================================== */
  /* Board DOM                                                           */
  /* ================================================================== */

  const boardEl = $('board');
  const piecesEl = $('pieces');
  const linksEl = $('links');
  const squares = [];
  const pieceEls = new Array(64).fill(null);
  const linkEls = new Map();
  let linksTimer = 0;

  function buildBoard() {
    const sqWrap = $('squares');
    for (let s = 0; s < 64; s++) {
      const r = s >> 3, c = s & 7;
      const d = document.createElement('div');
      d.className = 'sq ' + ((r + c) % 2 ? 'dark' : 'light');
      if (c === 0) d.insertAdjacentHTML('beforeend', `<span class="coord rank">${8 - r}</span>`);
      if (r === 7) d.insertAdjacentHTML('beforeend', `<span class="coord file">${'abcdefgh'[c]}</span>`);
      sqWrap.appendChild(d);
      squares.push(d);
    }
  }

  function setPiecePos(el, s) {
    el.style.transform = `translate(${(s & 7) * 100}%, ${(s >> 3) * 100}%)`;
  }

  function createPiece(s, side, appearDelay) {
    const el = document.createElement('div');
    el.className = 'piece ' + (side === BLACK ? 'b' : 'w');
    el.dataset.side = side;
    el.innerHTML = '<div class="stone"></div>';
    setPiecePos(el, s);
    if (appearDelay != null && settings.anim) {
      el.classList.add('appear');
      el.firstChild.style.animationDelay = appearDelay + 'ms';
      setTimeout(() => el.classList.remove('appear'), appearDelay + 500);
    }
    piecesEl.appendChild(el);
    return el;
  }

  // Makes the piece elements match `cells` (no movement animation).
  function syncPieces(cells, appear) {
    for (let s = 0; s < 64; s++) {
      const want = cells[s];
      let el = pieceEls[s];
      if (el && (!want || +el.dataset.side !== want)) { el.remove(); el = pieceEls[s] = null; }
      if (want && !el) {
        let delay = null;
        if (appear) {
          const r = s >> 3, c = s & 7;
          delay = Math.round(Math.max(Math.abs(r - 3.5), Math.abs(c - 3.5)) * 70 + (r + c) * 8);
        }
        pieceEls[s] = createPiece(s, want, delay);
      }
    }
  }

  function clearPieces() {
    piecesEl.innerHTML = '';
    pieceEls.fill(null);
  }

  // Slides a piece; returns the animation duration.
  function animateMove(m, capture, instant) {
    const from = m & 63, to = m >> 6;
    const el = pieceEls[from], victim = pieceEls[to];
    pieceEls[from] = null;
    pieceEls[to] = el;
    if (!el) return 0;
    const animate = settings.anim && !instant;
    el.classList.remove('lifted', 'dragging');
    if (!animate) el.classList.add('instant');
    el.classList.add('moving');
    setPiecePos(el, to);
    if (!animate) { void el.offsetWidth; el.classList.remove('instant'); }
    const dur = animate ? MOVE_MS : 0;
    setTimeout(() => el.classList.remove('moving'), dur + 30);
    if (capture && victim && victim !== el) {
      setTimeout(() => {
        victim.classList.add('captured');
        captureFx(to, +victim.dataset.side);
        setTimeout(() => victim.remove(), settings.anim ? 420 : 0);
      }, animate ? dur * 0.7 : 0);
    }
    return dur;
  }

  // Reverses moves on screen (records in reverse chronological order).
  function animateBack(records) {
    for (const rec of records) {
      if (rec.m === PASS) continue;
      const from = rec.m & 63, to = rec.m >> 6;
      const el = pieceEls[to];
      pieceEls[to] = null;
      pieceEls[from] = el;
      if (el) {
        if (!settings.anim) el.classList.add('instant');
        setPiecePos(el, from);
        if (!settings.anim) { void el.offsetWidth; el.classList.remove('instant'); }
      }
      if (rec.capture) pieceEls[to] = createPiece(to, 3 - rec.side, 140);
    }
  }

  function captureFx(s, side) {
    if (!settings.anim) return;
    const fx = document.createElement('div');
    fx.className = 'fx';
    fx.style.left = (s & 7) * 12.5 + '%';
    fx.style.top = (s >> 3) * 12.5 + '%';
    fx.style.setProperty('--fx-color', side === WHITE ? '#fff3dc' : '#ff8d5c');
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + Math.random() * 0.5;
      const d = 120 + Math.random() * 120;
      const sp = document.createElement('i');
      sp.style.setProperty('--dx', Math.cos(a) * d + '%');
      sp.style.setProperty('--dy', Math.sin(a) * d + '%');
      fx.appendChild(sp);
    }
    piecesEl.parentNode.appendChild(fx);
    setTimeout(() => fx.remove(), 700);
  }

  /* ---------------- Connection lines ---------------- */

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const LINK_DIRS = [[0, 1], [1, 1], [1, 0], [1, -1]];

  function renderLinks() {
    clearTimeout(linksTimer);
    const cells = viewPos().board;
    const winSide = (isLive() && game.result && game.result.reason === 'connect') ? game.result.winner : 0;
    const wanted = new Map();
    for (let s = 0; s < 64; s++) {
      const p = cells[s];
      if (!p) continue;
      const r = s >> 3, c = s & 7;
      for (const [dr, dc] of LINK_DIRS) {
        const rr = r + dr, cc = c + dc;
        if (rr > 7 || cc < 0 || cc > 7) continue;
        const t2 = rr * 8 + cc;
        if (cells[t2] === p) wanted.set(p + ':' + s + ':' + t2, [p, r, c, rr, cc]);
      }
    }
    for (const [key, g] of linkEls) {
      if (!wanted.has(key)) { g.remove(); linkEls.delete(key); }
    }
    for (const [key, v] of wanted) {
      if (linkEls.has(key)) continue;
      const [p, r, c, rr, cc] = v;
      const g = document.createElementNS(SVG_NS, 'g');
      const mk = (cls) => {
        const l = document.createElementNS(SVG_NS, 'line');
        l.setAttribute('x1', c + 0.5); l.setAttribute('y1', r + 0.5);
        l.setAttribute('x2', cc + 0.5); l.setAttribute('y2', rr + 0.5);
        l.setAttribute('class', 'lk ' + cls);
        g.appendChild(l);
      };
      if (p === WHITE) { mk('lk-w-under'); mk('lk-w'); } else mk('lk-b');
      g.dataset.side = p;
      linksEl.appendChild(g);
      linkEls.set(key, g);
    }
    for (const g of linkEls.values()) {
      const win = +g.dataset.side === winSide;
      g.querySelectorAll('line').forEach((l) => l.classList.toggle('win', win));
    }
  }

  function scheduleLinks(delay) {
    clearTimeout(linksTimer);
    if (delay > 0) linksTimer = setTimeout(renderLinks, delay);
    else renderLinks();
  }

  /* ---------------- Highlights, arrows, piece states ---------------- */

  function lastMoveShown() {
    const k = isLive() ? game.moves.length : ui.review;
    for (let i = k - 1; i >= 0; i--) if (game.moves[i].m !== PASS) return i === k - 1 ? game.moves[i].m : -1;
    return -1;
  }

  function renderHighlights() {
    const last = lastMoveShown();
    const lf = last >= 0 ? last & 63 : -1, lt = last >= 0 ? last >> 6 : -1;
    const hint = isLive() ? game.hint : null;
    const showTargets = settings.legal;
    for (let s = 0; s < 64; s++) {
      const cl = squares[s].classList;
      cl.toggle('last', s === lf || s === lt);
      cl.toggle('sel', s === ui.selected);
      const tg = ui.targets.find((x) => x.to === s);
      cl.toggle('target', !!tg && showTargets);
      cl.toggle('capture', !!tg && tg.capture && showTargets);
      cl.toggle('hover', !!tg && s === ui.hover);
      cl.toggle('hint', !!hint && (s === hint.from || s === hint.to));
    }
  }

  function arrowLine(from, to, cls) {
    const x1 = (from & 7) + 0.5, y1 = (from >> 3) + 0.5, x2 = (to & 7) + 0.5, y2 = (to >> 3) + 0.5;
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const f = (n) => n.toFixed(3);
    return `<line class="${cls}" x1="${f(x1 + ux * 0.28)}" y1="${f(y1 + uy * 0.28)}" x2="${f(x2 - ux * 0.36)}" y2="${f(y2 - uy * 0.36)}"/>`;
  }

  function renderArrows() {
    let html = '';
    if (isLive() && game.hint) html += arrowLine(game.hint.from, game.hint.to, 'hint');
    if (ui.selected >= 0 && ui.hover >= 0 && settings.legal && ui.targets.some((x) => x.to === ui.hover)) {
      html += arrowLine(ui.selected, ui.hover, '');
    }
    $('arrows-g').innerHTML = html;
  }

  function markPieces() {
    const mine = canHumanMove() ? game.pos.side : 0;
    let win = null;
    if (isLive() && game.result && game.result.reason === 'connect') win = game.result.winner;
    for (let s = 0; s < 64; s++) {
      const el = pieceEls[s];
      if (!el) continue;
      const side = +el.dataset.side;
      el.classList.toggle('mine', side === mine);
      el.classList.toggle('lifted', s === ui.selected);
      el.classList.toggle('win', side === win);
    }
  }

  function applyBoardClasses() {
    document.documentElement.dataset.theme = settings.theme;
    boardEl.classList.toggle('no-coords', !settings.coords);
    boardEl.classList.toggle('no-links', !settings.links);
    document.body.classList.toggle('no-anim', !settings.anim);
  }

  /* ================================================================== */
  /* Panels                                                              */
  /* ================================================================== */

  function sideName(side) { return t(side === BLACK ? 'black' : 'white'); }

  function renderCard(el, side) {
    const vp = viewPos();
    const pieces = vp.pcount[side];
    const groups = vp.countGroups(side);
    const ai = isAiSide(side);
    let name, sub;
    if (game.mode === 'ai') {
      name = ai ? t('computer') : t('you');
      sub = ai ? t(LEVELS[game.level - 1].key) : sideName(side);
    } else if (game.mode === 'pvp') {
      name = sideName(side);
      sub = side === BLACK ? t('player1') : t('player2');
    } else {
      name = t('computer');
      sub = sideName(side) + ' · ' + t(LEVELS[game.level - 1].key);
    }
    const toMove = !game.result && isLive() && game.pos.side === side;
    const thinking = toMove && ai && game.thinking;
    const winner = !!game.result && game.result.winner === side;
    el.className = 'player-card' + (toMove ? ' active' : '') + (winner ? ' winner' : '');
    const subHtml = thinking
      ? `<span class="thinking"><i></i><i></i><i></i></span>${t('thinkingShort')}`
      : `${sub}${toMove ? `<span class="turn-pill">${t('toMove')}</span>` : ''}${winner ? `<span class="turn-pill win">${t('winner')}</span>` : ''}`;
    el.innerHTML = `
      <div class="pc-avatar ${side === BLACK ? 'black' : 'white'}">${ai ? '<svg><use href="#i-cpu"/></svg>' : ''}</div>
      <div class="pc-main"><div class="pc-name">${name}</div><div class="pc-sub">${subHtml}</div></div>
      <div class="pc-stats">
        <span class="chip" title="${t('pieces')}"><svg><use href="#i-stone"/></svg><b>${pieces}</b><span class="lbl">${t('pieces')}</span></span>
        <span class="chip${groups === 1 ? ' good' : ''}" title="${t('groups')}"><svg><use href="#i-group"/></svg><b>${groups}</b><span class="lbl">${groups === 1 ? t('group') : t('groups')}</span></span>
      </div>`;
  }

  function renderCards() {
    const bottom = bottomSide();
    renderCard($('card-bottom'), bottom);
    renderCard($('card-top'), 3 - bottom);
  }

  function resultTitle(res) {
    if (!res.winner) return t('draw');
    if (game.mode === 'ai') return res.winner === game.human ? t('winYou') : t('loseYou');
    return t(res.winner === BLACK ? 'winsBlack' : 'winsWhite');
  }

  function resultReason(res) {
    return {
      connect: t('reasonConnect'),
      repetition: t('reasonRepetition'),
      limit: t('reasonLimit', { n: MAX_PLIES }),
      stalemate: t('reasonStalemate')
    }[res.reason];
  }

  function renderStatus() {
    let main, sub, dot = 0;
    if (!isLive()) {
      main = t('reviewing');
      sub = t('reviewingSub', { n: ui.review, total: game.moves.length });
    } else if (game.result) {
      main = resultTitle(game.result);
      sub = resultReason(game.result);
      dot = game.result.winner;
    } else {
      const side = game.pos.side;
      dot = side;
      if (game.mode === 'ai') {
        if (side === game.human) { main = t('yourTurn'); sub = t('yourTurnSub'); } else { main = t('aiThinking'); sub = t(LEVELS[game.level - 1].key); }
      } else {
        main = t(side === BLACK ? 'turnBlack' : 'turnWhite');
        sub = game.mode === 'pvp' ? t('turnSub') : (game.paused ? t('paused') : t('watching'));
      }
      if (ui.hintBusy) sub = t('hintThinking');
    }
    $('status-main').innerHTML = (dot ? `<span class="swatch-dot ${dot === BLACK ? 'black' : 'white'}"></span>` : '') + `<span>${main}</span>`;
    $('status-sub').textContent = sub;

    const banner = $('board-banner');
    if (!isLive()) {
      banner.hidden = false;
      banner.innerHTML = `<span>${t('reviewBanner', { n: ui.review, total: game.moves.length })}</span><button type="button" id="banner-back">${t('backToGame')}</button>`;
      $('banner-back').onclick = () => exitReview();
    } else {
      banner.hidden = true;
    }
  }

  function moveHtml(rec) {
    if (rec.m === PASS) return '—';
    const a = LOA.squareName(rec.m & 63), b = LOA.squareName(rec.m >> 6);
    return rec.capture ? `${a}<span class="cap">×</span>${b}` : `${a}–${b}`;
  }

  function renderMoveList() {
    const list = $('move-list');
    const moves = game.moves;
    $('moves-empty').hidden = moves.length > 0;
    const cur = isLive() ? moves.length : ui.review;
    const cell = (i) => {
      const rec = moves[i];
      return `<button type="button" data-k="${i + 1}" class="${cur === i + 1 ? 'current' : ''}"><i class="${rec.side === BLACK ? 'b' : 'w'}"></i><span>${moveHtml(rec)}</span></button>`;
    };
    let html = '';
    for (let i = 0; i < moves.length; i += 2) {
      html += `<li><span class="num">${i / 2 + 1}.</span>${cell(i)}${i + 1 < moves.length ? cell(i + 1) : '<span></span>'}</li>`;
    }
    list.innerHTML = html;
    const curBtn = list.querySelector('button.current');
    if (isLive()) list.scrollTop = list.scrollHeight;
    else if (curBtn) curBtn.scrollIntoView({ block: 'nearest' });
  }

  function formatScore(score) {
    if (Math.abs(score) >= WIN_THRESHOLD) return '#' + Math.ceil((WIN - Math.abs(score)) / 2);
    return (Math.abs(score) / 100).toLocaleString(settings.lang === 'pt' ? 'pt-BR' : 'en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }

  function renderEval() {
    const bar = $('eval-bar'), fill = $('eval-fill'), label = $('eval-label');
    bar.classList.toggle('hidden', !settings.evalBar);
    const bottom = bottomSide();
    bar.classList.toggle('top-black', bottom === WHITE);
    let pct = 50, text = '', bottomAhead = true;
    if (game.result && isLive()) {
      pct = game.result.winner === bottom ? 100 : game.result.winner ? 0 : 50;
      text = game.result.winner ? (game.result.winner === bottom ? '1–0' : '0–1') : '½';
      bottomAhead = game.result.winner !== 3 - bottom;
    } else if (game.evalBlack != null) {
      const sc = bottom === BLACK ? game.evalBlack : -game.evalBlack;
      bottomAhead = sc >= 0;
      if (Math.abs(sc) >= WIN_THRESHOLD) pct = sc > 0 ? 100 : 0;
      else pct = Math.min(96, Math.max(4, 100 / (1 + Math.exp(-sc / 220))));
      text = formatScore(sc);
    }
    fill.style.height = pct + '%';
    label.textContent = text;
    // Put the label on the side that is ahead, in a contrasting colour.
    const regionSide = bottomAhead ? bottom : 3 - bottom;
    label.style.top = bottomAhead ? 'auto' : '4px';
    label.style.bottom = bottomAhead ? '4px' : 'auto';
    label.style.color = regionSide === BLACK ? '#e9e3d6' : '#23262d';
    let title = t('evalTitle');
    if (game.evalBlack != null && Math.abs(game.evalBlack) >= WIN_THRESHOLD) {
      const winner = game.evalBlack > 0 ? BLACK : WHITE;
      title += ': ' + sideName(winner) + ', ' + t('evalWin', { n: Math.ceil((WIN - Math.abs(game.evalBlack)) / 2) });
    }
    bar.title = title;
    bar.setAttribute('aria-label', title);
  }

  function renderInfo() {
    const info = game.info;
    const loc = settings.lang === 'pt' ? 'pt-BR' : 'en-US';
    $('info-line').textContent = info
      ? t('engineInfo', {
        d: info.depth,
        n: info.nodes.toLocaleString(loc),
        s: (info.timeMs / 1000).toLocaleString(loc, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
      })
      : '';
  }

  function updateButtons() {
    const live = isLive();
    const undoable = game.mode === 'pvp' ? game.moves.length > 0
      : game.mode === 'ai' && game.moves.some((r) => r.side === game.human);
    $('btn-undo').disabled = !undoable;
    $('btn-undo').hidden = game.mode === 'aivai';
    const hint = $('btn-hint');
    hint.hidden = game.mode === 'aivai';
    hint.disabled = !humanToMove() || !live || ui.hintBusy;
    hint.classList.toggle('busy', ui.hintBusy);
    const pause = $('btn-pause');
    pause.hidden = game.mode !== 'aivai';
    pause.disabled = !!game.result;
    pause.innerHTML = game.paused
      ? `<svg><use href="#i-play"/></svg><span>${t('resume')}</span>`
      : `<svg><use href="#i-pause"/></svg><span>${t('pause')}</span>`;
    const cur = live ? game.moves.length : ui.review;
    $('nav-first').disabled = cur === 0;
    $('nav-prev').disabled = cur === 0;
    $('nav-next').disabled = live;
    $('nav-last').disabled = live;
    const snd = $('btn-sound');
    snd.innerHTML = `<svg><use href="#${settings.sound ? 'i-sound' : 'i-mute'}"/></svg>`;
    snd.classList.toggle('off', !settings.sound);
  }

  function renderAll() {
    applyBoardClasses();
    renderHighlights();
    renderArrows();
    renderLinks();
    markPieces();
    renderCards();
    renderStatus();
    renderMoveList();
    renderEval();
    renderInfo();
    updateButtons();
  }

  let toastTimer = 0;
  function toast(msg, ms) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), ms || 2600);
  }

  /* ================================================================== */
  /* Game flow                                                           */
  /* ================================================================== */

  function newGame(setup, restored) {
    game.gen++;
    aiEngine.cancel();
    helperEngine.cancel();
    game.setup = Object.assign({}, defaultSetup, setup);
    store.set('setup', game.setup);
    game.mode = game.setup.mode;
    game.level = game.setup.level;
    if (restored) game.human = restored.human;
    else game.human = game.setup.color === 'white' ? WHITE : game.setup.color === 'black' ? BLACK : (Math.random() < 0.5 ? BLACK : WHITE);
    game.start = LOA.startPosition(game.setup.variant);
    game.moves = [];
    game.result = null;
    game.thinking = false;
    game.paused = false;
    game.hint = null;
    game.evalBlack = null;
    game.info = null;
    game.startedAt = Date.now() - (restored ? restored.elapsed || 0 : 0);
    ui.review = null;
    ui.hintBusy = false;
    clearSelection();
    game.pos.setup(game.start, BLACK);
    if (restored) {
      for (const m of restored.moves) {
        const side = game.pos.side;
        const capture = m !== PASS && game.pos.board[m >> 6] !== EMPTY;
        game.pos.play(m);
        game.moves.push({ m, side, capture });
      }
    }
    document.querySelectorAll('.modal').forEach((m) => { m.hidden = true; });
    clearPieces();
    syncPieces(game.pos.board, true);
    renderAll();
    // Let the pieces pop in before the connection lines fade in.
    linksEl.innerHTML = '';
    linkEls.clear();
    scheduleLinks(settings.anim ? 650 : 0);
    if (!restored) Sound.play('start');
    saveGame();
    scheduleTurn(settings.anim ? 650 : 0);
  }

  function checkResult(mover, capture) {
    const r = game.pos.resultAfterMove(capture);
    if (r === 1) return { winner: mover, reason: 'connect' };
    if (r === -1) return { winner: 3 - mover, reason: 'connect' };
    if (game.pos.repetitionCount() >= 3) return { winner: 0, reason: 'repetition' };
    if (game.moves.length >= MAX_PLIES) return { winner: 0, reason: 'limit' };
    return null;
  }

  function playMove(m, opts) {
    opts = opts || {};
    const pos = game.pos;
    const side = pos.side;
    const capture = m !== PASS && pos.board[m >> 6] !== EMPTY;
    pos.play(m);
    game.moves.push({ m, side, capture });
    game.hint = null;
    clearSelection();
    let dur = 0;
    if (isLive() && m !== PASS) dur = animateMove(m, capture, opts.instant);
    if (m !== PASS) Sound.play(capture ? 'capture' : 'move');
    const result = m === PASS ? null : checkResult(side, capture);
    renderHighlights();
    renderArrows();
    markPieces();
    renderMoveList();
    if (isLive()) scheduleLinks(dur);
    if (result) finishGame(result, dur);
    else {
      saveGame();
      scheduleTurn(dur);
    }
  }

  function scheduleTurn(delay) {
    renderCards();
    renderStatus();
    renderEval();
    updateButtons();
    markPieces();
    if (game.result) return;
    const pos = game.pos;
    const gen = game.gen;
    if (pos.legalMoves().length === 0) {
      if (pos.legalMoves(3 - pos.side).length === 0) { finishGame({ winner: 0, reason: 'stalemate' }, delay); return; }
      toast(t(pos.side === BLACK ? 'passBlack' : 'passWhite'));
      setTimeout(() => { if (gen === game.gen && !game.result) playMove(PASS); }, 1200);
      return;
    }
    if (isAiSide(pos.side)) {
      if (game.mode === 'aivai' && game.paused) return;
      requestAiMove(delay || 0);
    } else if (settings.evalBar && game.mode === 'pvp') {
      requestAnalysis();
    }
  }

  function requestAiMove(delay) {
    const gen = game.gen;
    const side = game.pos.side;
    const level = LEVELS[game.level - 1];
    game.thinking = true;
    renderCards();
    renderStatus();
    const started = performance.now();
    aiEngine.search(payload(level.opts), (info) => {
      if (gen !== game.gen) return;
      setEval(info.score, side);
      game.info = info;
      renderInfo();
    }).then((res) => {
      if (!res || gen !== game.gen) return;
      const minWait = (game.mode === 'aivai' ? 700 : 420) + delay;
      const wait = Math.max(0, minWait - (performance.now() - started));
      setTimeout(() => {
        if (gen !== game.gen) return;
        game.thinking = false;
        game.info = res;
        setEval(res.score, side);
        renderInfo();
        playMove(res.move);
      }, wait);
    });
  }

  function requestAnalysis() {
    const gen = game.gen, ply = game.moves.length, side = game.pos.side;
    helperEngine.search(payload({ timeMs: 700 })).then((res) => {
      if (!res || gen !== game.gen || ply !== game.moves.length) return;
      setEval(res.score, side);
    });
  }

  function setEval(score, side) {
    game.evalBlack = side === BLACK ? score : -score;
    renderEval();
  }

  function requestHint() {
    if (!canHumanMove() || ui.hintBusy) return;
    const gen = game.gen, ply = game.moves.length, side = game.pos.side;
    ui.hintBusy = true;
    clearSelection();
    renderHighlights();
    renderArrows();
    markPieces();
    renderStatus();
    updateButtons();
    helperEngine.search(payload({ timeMs: 1500 })).then((res) => {
      if (gen !== game.gen) return;
      ui.hintBusy = false;
      if (res && ply === game.moves.length && res.move !== PASS) {
        game.hint = { from: res.move & 63, to: res.move >> 6 };
        setEval(res.score, side);
        const cap = game.pos.board[res.move >> 6] !== EMPTY;
        toast(t('hintToast', { move: LOA.moveName(res.move, cap) }));
        Sound.play('hint');
      }
      renderHighlights();
      renderArrows();
      renderStatus();
      updateButtons();
    });
  }

  function finishGame(result, delay) {
    game.result = result;
    game.endedAt = Date.now();
    game.thinking = false;
    aiEngine.cancel();
    helperEngine.cancel();
    store.remove('game');
    recordResult(result);
    const gen = game.gen;
    renderCards();
    renderStatus();
    updateButtons();
    setTimeout(() => {
      if (gen !== game.gen) return;
      renderAll();
      const humanWon = game.mode === 'ai' ? result.winner === game.human : !!result.winner;
      const humanLost = game.mode === 'ai' && result.winner && result.winner !== game.human;
      Sound.play(!result.winner ? 'draw' : humanLost ? 'lose' : 'win');
      if (humanWon) confetti();
      setTimeout(() => { if (gen === game.gen && game.result) showGameOver(); }, result.reason === 'connect' ? 1300 : 600);
    }, delay + 60);
  }

  function recordResult(res) {
    if (game.mode !== 'ai') return;
    const stats = store.get('stats', {});
    const s = stats[game.level] || { w: 0, l: 0, d: 0 };
    if (!res.winner) s.d++;
    else if (res.winner === game.human) s.w++;
    else s.l++;
    stats[game.level] = s;
    store.set('stats', stats);
  }

  function undo() {
    if (game.mode === 'aivai' || !game.moves.length) return;
    const wasLive = isLive();
    if (!wasLive) exitReview(true);
    let n = game.moves.length - 1;
    if (game.mode === 'ai') {
      if (!game.moves.some((r) => r.side === game.human)) return;
      while (n > 0 && game.moves[n].side !== game.human) n--;
    }
    game.gen++;
    aiEngine.cancel();
    helperEngine.cancel();
    game.thinking = false;
    const undone = game.moves.slice(n).reverse();
    game.moves.length = n;
    const hadResult = !!game.result;
    game.result = null;
    game.hint = null;
    $('modal-over').hidden = true;
    rebuildPos();
    clearSelection();
    animateBack(undone);
    syncPieces(game.pos.board);
    if (hadResult) game.evalBlack = null;
    renderAll();
    saveGame();
    scheduleTurn(settings.anim ? MOVE_MS : 0);
  }

  /* ---------------- Review ---------------- */

  function reviewCells(k) {
    const p = ui.reviewPos;
    p.setup(game.start, BLACK);
    for (let i = 0; i < k; i++) p.play(game.moves[i].m);
    return p.board;
  }

  function goTo(k) {
    const n = game.moves.length;
    k = Math.max(0, Math.min(n, k));
    const prev = isLive() ? n : ui.review;
    if (k === prev) return;
    clearSelection();
    if (k === n) ui.review = null;
    else {
      ui.review = k;
      reviewCells(k);
    }
    const cells = viewPos().board;
    if (k === prev + 1 && game.moves[k - 1].m !== PASS) {
      const rec = game.moves[k - 1];
      animateMove(rec.m, rec.capture);
    } else if (k === prev - 1) {
      animateBack([game.moves[k]]);
    }
    syncPieces(cells);
    renderAll();
  }

  function enterReview(k) { goTo(k); }

  function exitReview(silent) {
    if (isLive()) return;
    if (silent) {
      ui.review = null;
      syncPieces(game.pos.board);
      renderAll();
      return;
    }
    goTo(game.moves.length);
  }

  /* ================================================================== */
  /* Input                                                               */
  /* ================================================================== */

  function clearSelection() {
    ui.selected = -1;
    ui.targets = [];
    ui.hover = -1;
  }

  function select(s) {
    ui.selected = s;
    ui.targets = game.pos.legalMoves()
      .filter((m) => (m & 63) === s)
      .map((m) => ({ m, to: m >> 6, capture: game.pos.board[m >> 6] !== EMPTY }));
    ui.hover = -1;
    renderHighlights();
    renderArrows();
    markPieces();
  }

  function deselect() {
    if (ui.selected < 0) return;
    clearSelection();
    renderHighlights();
    renderArrows();
    markPieces();
  }

  function setHover(s) {
    if (s === ui.hover) return;
    ui.hover = s;
    for (const x of ui.targets) squares[x.to].classList.toggle('hover', x.to === s);
    renderArrows();
  }

  function squareAt(x, y) {
    const r = boardEl.getBoundingClientRect();
    if (x < r.left || y < r.top || x >= r.right || y >= r.bottom) return -1;
    const c = Math.min(7, Math.floor(((x - r.left) / r.width) * 8));
    const row = Math.min(7, Math.floor(((y - r.top) / r.height) * 8));
    return row * 8 + c;
  }

  const targetAt = (s) => ui.targets.find((x) => x.to === s);

  function onPointerDown(e) {
    if (e.button > 0) return;
    if (!canHumanMove()) return;
    const s = squareAt(e.clientX, e.clientY);
    if (s < 0) return;
    const tg = ui.selected >= 0 ? targetAt(s) : null;
    if (tg) { playMove(tg.m); return; }
    if (game.pos.board[s] === game.pos.side) {
      const already = ui.selected === s;
      if (!already) { select(s); Sound.play('select'); }
      ui.drag = { s, id: e.pointerId, x0: e.clientX, y0: e.clientY, active: false, already };
      e.preventDefault();
    } else {
      deselect();
    }
  }

  function onPointerMove(e) {
    const d = ui.drag;
    if (d && e.pointerId === d.id) {
      const el = pieceEls[d.s];
      if (!el) return;
      if (!d.active && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) > 6) {
        d.active = true;
        el.classList.add('dragging');
      }
      if (d.active) {
        const r = boardEl.getBoundingClientRect();
        const size = r.width / 8;
        el.style.transform = `translate(${e.clientX - r.left - size / 2}px, ${e.clientY - r.top - size / 2}px)`;
        setHover(squareAt(e.clientX, e.clientY));
      }
      return;
    }
    if (e.pointerType === 'mouse' && ui.selected >= 0 && canHumanMove()) setHover(squareAt(e.clientX, e.clientY));
  }

  function onPointerUp(e) {
    const d = ui.drag;
    if (!d || e.pointerId !== d.id) return;
    ui.drag = null;
    const el = pieceEls[d.s];
    if (d.active) {
      if (el) el.classList.remove('dragging');
      const tg = targetAt(squareAt(e.clientX, e.clientY));
      if (tg && canHumanMove()) { playMove(tg.m, { instant: true }); return; }
      if (el) setPiecePos(el, d.s);
      setHover(-1);
    } else if (d.already) {
      deselect();
    }
  }

  function onPointerCancel(e) {
    const d = ui.drag;
    if (!d || e.pointerId !== d.id) return;
    ui.drag = null;
    const el = pieceEls[d.s];
    if (el) { el.classList.remove('dragging'); setPiecePos(el, d.s); }
  }

  /* ================================================================== */
  /* Modals                                                              */
  /* ================================================================== */

  function openModal(id) {
    const m = $(id);
    m.hidden = false;
    markPieces();
    const focusable = m.querySelector('.btn.primary') || m.querySelector('button');
    if (focusable) setTimeout(() => focusable.focus({ preventScroll: true }), 50);
  }

  function closeModal(m) {
    m.hidden = true;
    markPieces();
  }

  /* ---------------- New game dialog ---------------- */

  let draft = null;

  function openSetup() {
    draft = Object.assign({}, game.setup);
    renderSetup();
    openModal('modal-setup');
  }

  function renderSetup() {
    const pick = (wrap, value) => $(wrap).querySelectorAll('[data-value]').forEach((b) => b.classList.toggle('selected', b.dataset.value === String(value)));
    pick('opt-mode', draft.mode);
    pick('opt-color', draft.color);
    pick('opt-variant', draft.variant);
    const lv = $('opt-level');
    lv.innerHTML = LEVELS.map((L, i) => {
      const bars = [1, 2, 3, 4, 5].map((b) => `<span class="${b <= i + 1 ? 'on' : ''}" style="height:${4 + b * 2.4}px"></span>`).join('');
      return `<button type="button" data-value="${i + 1}" class="${draft.level === i + 1 ? 'selected' : ''}"><span class="bars">${bars}</span>${t(L.key)}</button>`;
    }).join('');
    $('level-desc').innerHTML = t(LEVELS[draft.level - 1].key + 'd');
    document.querySelectorAll('#modal-setup .field[data-for]').forEach((f) => {
      f.hidden = !f.dataset.for.split(' ').includes(draft.mode);
    });
  }

  function bindSetup() {
    $('opt-mode').addEventListener('click', (e) => { const b = e.target.closest('[data-value]'); if (b) { draft.mode = b.dataset.value; renderSetup(); } });
    $('opt-color').addEventListener('click', (e) => { const b = e.target.closest('[data-value]'); if (b) { draft.color = b.dataset.value; renderSetup(); } });
    $('opt-variant').addEventListener('click', (e) => { const b = e.target.closest('[data-value]'); if (b) { draft.variant = b.dataset.value; renderSetup(); } });
    $('opt-level').addEventListener('click', (e) => { const b = e.target.closest('[data-value]'); if (b) { draft.level = +b.dataset.value; renderSetup(); } });
    $('btn-start').addEventListener('click', () => newGame(draft));
  }

  /* ---------------- Settings dialog ---------------- */

  function renderSettings() {
    $('opt-theme').querySelectorAll('[data-value]').forEach((b) => b.classList.toggle('selected', b.dataset.value === settings.theme));
    $('opt-lang').querySelectorAll('[data-value]').forEach((b) => b.classList.toggle('selected', b.dataset.value === settings.lang));
    $('opt-toggles').querySelectorAll('input[data-key]').forEach((inp) => { inp.checked = !!settings[inp.dataset.key]; });
  }

  function bindSettings() {
    $('opt-theme').addEventListener('click', (e) => {
      const b = e.target.closest('[data-value]');
      if (!b) return;
      settings.theme = b.dataset.value;
      saveSettings(); renderSettings(); applyBoardClasses();
    });
    $('opt-lang').addEventListener('click', (e) => {
      const b = e.target.closest('[data-value]');
      if (!b) return;
      settings.lang = b.dataset.value;
      saveSettings(); renderSettings(); applyI18n(); renderAll();
    });
    $('opt-toggles').addEventListener('change', (e) => {
      const inp = e.target.closest('input[data-key]');
      if (!inp) return;
      settings[inp.dataset.key] = inp.checked;
      saveSettings();
      if (inp.dataset.key === 'sound' && inp.checked) Sound.play('select');
      if (inp.dataset.key === 'evalBar' && inp.checked && game.mode === 'pvp' && !game.result) requestAnalysis();
      renderAll();
    });
  }

  /* ---------------- Rules dialog ---------------- */

  const sqn = (name) => (8 - +name[1]) * 8 + 'abcdefgh'.indexOf(name[0]);

  function miniBoard(cfg) {
    const black = (cfg.black || []).map(sqn), white = (cfg.white || []).map(sqn);
    const cells = new Array(64).fill(0);
    black.forEach((s) => { cells[s] = BLACK; });
    white.forEach((s) => { cells[s] = WHITE; });
    let out = '<svg viewBox="0 0 8 8" xmlns="http://www.w3.org/2000/svg" role="img">';
    for (let s = 0; s < 64; s++) {
      const r = s >> 3, c = s & 7;
      out += `<rect x="${c}" y="${r}" width="1" height="1" style="fill:var(${(r + c) % 2 ? '--sq-dark' : '--sq-light'})"/>`;
    }
    if (cfg.sel) {
      const s = sqn(cfg.sel);
      out += `<rect x="${s & 7}" y="${s >> 3}" width="1" height="1" style="fill:var(--hl-sel)"/>`;
    }
    if (cfg.links) {
      for (let s = 0; s < 64; s++) {
        const p = cells[s];
        if (!p) continue;
        const r = s >> 3, c = s & 7;
        for (const [dr, dc] of LINK_DIRS) {
          const rr = r + dr, cc = c + dc;
          if (rr > 7 || cc < 0 || cc > 7 || cells[rr * 8 + cc] !== p) continue;
          const st = p === BLACK ? 'stroke:var(--link-black);stroke-width:.13' : 'stroke:var(--link-white);stroke-width:.12';
          out += `<line x1="${c + 0.5}" y1="${r + 0.5}" x2="${cc + 0.5}" y2="${rr + 0.5}" style="${st};stroke-linecap:round"/>`;
        }
      }
    }
    for (let s = 0; s < 64; s++) {
      if (!cells[s]) continue;
      out += `<circle cx="${(s & 7) + 0.5}" cy="${(s >> 3) + 0.5}" r="0.38" fill="url(#${cells[s] === BLACK ? 'g-black' : 'g-white'})"/>`;
    }
    for (const [a, b, kind] of cfg.arrows || []) {
      const f = sqn(a), to = sqn(b);
      const x1 = (f & 7) + 0.5, y1 = (f >> 3) + 0.5, x2 = (to & 7) + 0.5, y2 = (to >> 3) + 0.5;
      const len = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / len, uy = (y2 - y1) / len;
      const blocked = kind === 'blocked';
      const color = blocked ? '#e0503a' : kind === 'capture' ? '#e0503a' : '#2f8f5b';
      out += `<line x1="${x1 + ux * 0.3}" y1="${y1 + uy * 0.3}" x2="${x2 - ux * 0.34}" y2="${y2 - uy * 0.34}" style="stroke:${color};stroke-width:.11;stroke-linecap:round${blocked ? ';stroke-dasharray:.18 .16' : ''}" marker-end="url(#${blocked ? 'mk-red' : kind === 'capture' ? 'mk-red' : 'mk-green'})"/>`;
      if (blocked) {
        out += `<g transform="translate(${x2} ${y2})" style="stroke:#e0503a;stroke-width:.13;stroke-linecap:round"><line x1="-.2" y1="-.2" x2=".2" y2=".2"/><line x1=".2" y1="-.2" x2="-.2" y2=".2"/></g>`;
      }
      if (kind === 'capture') {
        out += `<circle cx="${x2}" cy="${y2}" r=".45" style="fill:none;stroke:#e0503a;stroke-width:.07"/>`;
      }
    }
    for (const d of cfg.dots || []) {
      const s = sqn(d);
      out += `<circle cx="${(s & 7) + 0.5}" cy="${(s >> 3) + 0.5}" r=".13" style="fill:var(--dot)"/>`;
    }
    return out + '</svg>';
  }

  function renderRules() {
    const cards = [
      ['r1t', 'r1p', { black: ['d4'], white: ['g4'], sel: 'd4', arrows: [['d4', 'b4'], ['d4', 'f4']] }],
      ['r2t', 'r2p', { black: ['b4', 'c4', 'f4', 'a3'], white: ['c5'], sel: 'b4', arrows: [['b4', 'e4'], ['b4', 'e7', 'blocked']] }],
      ['r3t', 'r3p', { black: ['c3', 'f2'], white: ['c5', 'e6'], sel: 'c3', arrows: [['c3', 'c5', 'capture']] }],
      ['r4t', 'r4p', { black: ['c6', 'd6', 'd5', 'e5', 'e4', 'c4', 'd3', 'f6'], white: ['b7', 'g3', 'a4', 'h6', 'b1'], links: true }]
    ];
    $('rules-grid').innerHTML = cards.map(([h, p, cfg]) => `<div class="rule">${miniBoard(cfg)}<div><h3>${t(h)}</h3><p>${t(p)}</p></div></div>`).join('');
    $('rules-more').innerHTML = t('rulesMore').map((li) => `<li>${li}</li>`).join('');
  }

  /* ---------------- Game over dialog ---------------- */

  function showGameOver() {
    const res = game.result;
    const title = $('over-title');
    title.textContent = resultTitle(res);
    title.className = game.mode === 'ai' && res.winner ? (res.winner === game.human ? 'good' : 'bad') : '';
    $('over-sub').textContent = resultReason(res);
    $('over-emblem').innerHTML = `<div class="big-stone ${res.winner === BLACK ? 'black' : res.winner === WHITE ? 'white' : 'draw'}"></div>`;
    const real = game.moves.filter((r) => r.m !== PASS);
    const secs = Math.max(0, Math.round((game.endedAt - game.startedAt) / 1000));
    const time = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
    let html = `<div><b>${real.length}</b><span>${t('statMoves')}</span></div>` +
      `<div><b>${real.filter((r) => r.capture).length}</b><span>${t('statCaptures')}</span></div>` +
      `<div><b>${time}</b><span>${t('statTime')}</span></div>`;
    if (game.mode === 'ai') {
      const s = store.get('stats', {})[game.level];
      if (s) html += `<div class="over-record">${t('record', { level: t(LEVELS[game.level - 1].key), w: s.w, l: s.l, d: s.d })}</div>`;
    }
    $('over-stats').innerHTML = html;
    openModal('modal-over');
  }

  /* ================================================================== */
  /* Confetti                                                            */
  /* ================================================================== */

  function confetti() {
    if (!settings.anim) return;
    const cv = $('confetti'), ctx = cv.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = window.innerWidth, H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const colors = ['#f2b45a', '#ffd48f', '#63d69f', '#7cc4ff', '#ff7f70', '#f4efe4', '#c79bff'];
    const rect = boardEl.getBoundingClientRect();
    const parts = [];
    for (let i = 0; i < 180; i++) {
      const fromLeft = i % 2 === 0;
      parts.push({
        x: fromLeft ? rect.left : rect.right,
        y: rect.top + rect.height * 0.55,
        vx: (fromLeft ? 1 : -1) * (3 + Math.random() * 9),
        vy: -(7 + Math.random() * 11),
        w: 6 + Math.random() * 7,
        h: 4 + Math.random() * 6,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.35,
        color: colors[i % colors.length],
        round: Math.random() < 0.3
      });
    }
    const t0 = performance.now();
    (function frame(now) {
      const el = now - t0;
      ctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.vy += 0.32; p.vx *= 0.99; p.vy *= 0.99;
        p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - Math.max(0, el - 2600) / 900);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.h / 2, 0, Math.PI * 2); ctx.fill(); } else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot * 2)) + 1);
        ctx.restore();
      }
      if (el < 3500) requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, W, H);
    })(t0);
  }

  /* ================================================================== */
  /* i18n                                                                */
  /* ================================================================== */

  function applyI18n() {
    document.documentElement.lang = settings.lang === 'pt' ? 'pt-BR' : 'en';
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const v = t(el.dataset.i18nTitle);
      el.title = v;
      el.setAttribute('aria-label', v);
    });
    boardEl.setAttribute('aria-label', t('boardLabel'));
    if (!$('modal-rules').hidden) renderRules();
    if (!$('modal-setup').hidden) renderSetup();
  }

  /* ================================================================== */
  /* Wiring                                                              */
  /* ================================================================== */

  function bind() {
    const unlockAudio = () => {
      Sound.unlock();
      window.removeEventListener('pointerdown', unlockAudio, true);
      window.removeEventListener('keydown', unlockAudio, true);
    };
    window.addEventListener('pointerdown', unlockAudio, true);
    window.addEventListener('keydown', unlockAudio, true);
    boardEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
    boardEl.addEventListener('pointerleave', (e) => { if (!ui.drag && e.pointerType === 'mouse') setHover(-1); });
    boardEl.addEventListener('contextmenu', (e) => e.preventDefault());

    $('btn-new').addEventListener('click', openSetup);
    $('btn-undo').addEventListener('click', undo);
    $('btn-hint').addEventListener('click', requestHint);
    $('btn-pause').addEventListener('click', () => {
      game.paused = !game.paused;
      updateButtons();
      renderStatus();
      if (!game.paused && !game.thinking) scheduleTurn(0);
    });
    $('btn-rules').addEventListener('click', () => { renderRules(); openModal('modal-rules'); });
    $('btn-settings').addEventListener('click', () => { renderSettings(); openModal('modal-settings'); });
    $('btn-sound').addEventListener('click', () => {
      settings.sound = !settings.sound;
      saveSettings();
      updateButtons();
      if (settings.sound) Sound.play('select');
    });
    $('btn-again').addEventListener('click', () => newGame(game.setup));
    $('btn-review').addEventListener('click', () => {
      closeModal($('modal-over'));
      goTo(0);
      toast(t('reviewToast'));
    });

    $('move-list').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-k]');
      if (b) goTo(+b.dataset.k);
    });
    $('nav-first').addEventListener('click', () => goTo(0));
    $('nav-prev').addEventListener('click', () => goTo((isLive() ? game.moves.length : ui.review) - 1));
    $('nav-next').addEventListener('click', () => goTo((isLive() ? game.moves.length : ui.review) + 1));
    $('nav-last').addEventListener('click', () => goTo(game.moves.length));

    document.querySelectorAll('.modal').forEach((m) => {
      m.addEventListener('click', (e) => {
        if (e.target === m || e.target.closest('[data-close]')) closeModal(m);
      });
    });

    document.addEventListener('keydown', (e) => {
      const open = document.querySelector('.modal:not([hidden])');
      if (e.key === 'Escape') {
        if (open) closeModal(open);
        else deselect();
        return;
      }
      if (open || e.target.closest('input, select, textarea')) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); return; }
      const cur = isLive() ? game.moves.length : ui.review;
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(cur - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); goTo(cur + 1); }
      else if (e.key === 'Home') { e.preventDefault(); goTo(0); }
      else if (e.key === 'End') { e.preventDefault(); goTo(game.moves.length); }
    });

    bindSetup();
    bindSettings();
  }

  function init() {
    buildBoard();
    bind();
    applyI18n();
    applyBoardClasses();
    const saved = store.get('game', null);
    let restored = false;
    if (saved && saved.setup && Array.isArray(saved.moves)) {
      try {
        // Validate the saved moves before trusting them.
        const p = new LOA.Position().setup(LOA.startPosition(saved.setup.variant), BLACK);
        for (const m of saved.moves) {
          if (m === PASS ? p.legalMoves().length !== 0 : !p.isLegal(m)) throw new Error('bad save');
          const cap = m !== PASS && p.board[m >> 6] !== EMPTY;
          p.play(m);
          if (m !== PASS && p.resultAfterMove(cap) !== 0) throw new Error('finished game');
        }
        newGame(saved.setup, saved);
        restored = true;
        toast(t('resumed'));
      } catch (e) {
        store.remove('game');
      }
    }
    if (!restored) newGame(game.setup);
    if (!store.get('seenRules', false)) {
      store.set('seenRules', true);
      setTimeout(() => { renderRules(); openModal('modal-rules'); }, 900);
    }
  }

  init();
})();
