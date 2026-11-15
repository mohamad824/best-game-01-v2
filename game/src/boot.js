// Boot: canvas setup, main loop, screenshot states, test hooks.
import { VIEW_H, VIEW_W } from './data.js';
import { createState } from './state.js';
import { createSfx } from './audio.js';
import { draw } from './render.js';
import { handleClick, handleKey } from './input.js';
import { autoPlayStep, fastForward, startWave, updatePlaying } from './sim.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const sfx = createSfx();

const params = new URLSearchParams(window.location.search);
const seed = parseInt(params.get('seed') || '7', 10) || 7;
const shot = params.get('shot') || '';

let state = createState(seed);

function restart() {
  const wasTitle = state.phase === 'title';
  state = createState(seed);
  if (!wasTitle) state.phase = 'playing';
  sfx.setMuted(state.muted);
}

function toCanvasCoords(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * VIEW_W,
    y: ((event.clientY - rect.top) / rect.height) * VIEW_H,
  };
}

canvas.addEventListener('click', (event) => {
  const { x, y } = toCanvasCoords(event);
  handleClick(state, x, y, sfx);
});

window.addEventListener('keydown', (event) => {
  if ([' ', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.preventDefault();
  handleKey(state, event.key, sfx, restart);
});

// Screenshot states: real runs of the real simulation, not staged demos.
//   ?shot=title  — the title screen.
//   ?shot=play   — auto-played through waves 1–2, wave 3 in progress.
//   ?shot=win    — the auto-player's full 12-wave win, fast-forwarded.
//   ?shot=loss   — no towers built: the heart-cart falls, fast-forwarded.
function setupShot() {
  if (shot === 'play') {
    state.phase = 'playing';
    let guard = 0;
    while (state.wavesCleared < 2 && state.phase === 'playing' && guard < 200000) {
      autoPlayStep(state, 1 / 30, null);
      guard += 1;
    }
    startWave(state, null);
  } else if (shot === 'win') {
    state.phase = 'playing';
    fastForward(state, 'auto');
  } else if (shot === 'loss') {
    state.phase = 'playing';
    fastForward(state, 'none');
  }
  window.__saltwindShotReady = true;
}

setupShot();

// Test hooks for headless play: the same functions the game itself uses.
window.__saltwind = {
  get state() { return state; },
  createState,
  fastForward,
  autoPlayStep,
  startWave,
  updatePlaying,
  restart,
  version: 'saltwind-caravan-v2',
};

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (state.phase === 'title') {
    state.time += dt;
  } else {
    updatePlaying(state, dt, (name) => sfx.play(name));
  }
  draw(ctx, state);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
