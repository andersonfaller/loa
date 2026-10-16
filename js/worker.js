/* Runs the LOA search off the main thread so the UI never freezes. */
'use strict';
importScripts('engine.js');

const searcher = new LOA.Searcher(19);

self.onmessage = (e) => {
  const msg = e.data;
  if (msg.type !== 'search') return;
  const pos = new LOA.Position().setup(msg.start, msg.startSide);
  for (const m of msg.moves) pos.play(m);
  const result = searcher.search(pos, Object.assign({}, msg.opts, {
    onInfo: (info) => self.postMessage({ type: 'info', id: msg.id, info })
  }));
  self.postMessage({ type: 'result', id: msg.id, result });
};
