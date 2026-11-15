// Wave definitions: names, mixes and the per-wave wind shift.
import { WAVE_MIX, WAVE_NAMES, WIND_DIRS } from './data.js';
import { pick } from './rng.js';

export function waveName(wave) {
  return WAVE_NAMES[wave - 1] || `WAVE ${wave}`;
}

// Build the spawn queue for a wave: a shuffled list of enemy types.
export function buildWaveQueue(state, wave) {
  const queue = [];
  const mix = WAVE_MIX[wave - 1] || WAVE_MIX[0];
  for (const [type, count] of mix) {
    for (let i = 0; i < count; i += 1) queue.push(type);
  }
  // Shuffle with the seeded rng, but keep the first spawn a raider/runner
  // so the wave never opens on a brute.
  for (let i = queue.length - 1; i > 1; i -= 1) {
    const j = 1 + Math.floor(state.rng() * i);
    [queue[i], queue[j]] = [queue[j], queue[i]];
  }
  return queue;
}

// The wind shifts every wave: turn 1-3 steps clockwise or counter.
export function shiftWindForWave(state) {
  const steps = 1 + Math.floor(state.rng() * 3);
  const dir = state.rng() < 0.5 ? 1 : -1;
  state.windIndex = (((state.windIndex + dir * steps) % WIND_DIRS.length) + WIND_DIRS.length) % WIND_DIRS.length;
  return WIND_DIRS[state.windIndex];
}

export function nextWaveName(state) {
  if (state.wave >= state.totalWaves) return 'THE FAR GATE';
  return `WAVE ${state.wave + 1} — ${waveName(state.wave + 1)}`;
}
