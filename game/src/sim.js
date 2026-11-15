// The simulation: waves, wind, economy, win/loss, and the auto-player
// that proves a full 12-wave win is reachable (and that doing nothing loses).
import { TOTAL_WAVES, TOWER_TYPES, WIND_DIRS } from './data.js';
import { cartPos, windOf } from './state.js';
import { buildWaveQueue, shiftWindForWave, waveName } from './waves.js';
import { spawnEnemy, updateEnemies } from './enemies.js';
import { buildBarricade, buildTower, updateProjectiles, updateTowers } from './towers.js';

export function showMessage(state, text, seconds) {
  state.message = text;
  state.messageTimer = seconds || 2.2;
}

export function startWave(state, sfx) {
  if (state.phase !== 'playing' || state.waveState !== 'between') return false;
  if (state.wave >= TOTAL_WAVES) return false;
  state.wave += 1;
  state.waveKills = 0;
  state.waveState = 'spawning';
  state.spawnQueue = buildWaveQueue(state, state.wave);
  state.spawnTimer = 0.4;
  const wind = shiftWindForWave(state);
  showMessage(state, `Wave ${state.wave} — ${waveName(state.wave)}. Wind turns ${wind.code} (${wind.name}).`, 2.6);
  if (sfx) sfx('wave');
  return true;
}

export function turnWind(state, sfx) {
  if (state.phase !== 'playing') return false;
  if (state.windCharges <= 0) {
    showMessage(state, 'No wind charges left — clear a wave to earn one.', 2);
    if (sfx) sfx('error');
    return false;
  }
  state.windCharges -= 1;
  state.windIndex = (state.windIndex + 1) % WIND_DIRS.length;
  state.stats.windTurns += 1;
  const wind = windOf(state);
  showMessage(state, `Wind turns ${wind.code} — ${wind.name}. Sail-towers now fire downwind that way.`, 2);
  if (sfx) sfx('wind');
  return true;
}

function endWave(state, sfx) {
  state.wavesCleared += 1;
  state.waveState = 'between';
  // Salt-cart income: +8 salt per cart, every cleared wave.
  const carts = state.towers.filter((t) => t.type === 'saltcart').length;
  if (carts > 0) {
    const income = carts * 8;
    state.salt += income;
    state.saltEarned += income;
    showMessage(state, `Wave ${state.wave} cleared! Salt carts earned +${income} salt.`, 2.4);
  } else {
    showMessage(state, `Wave ${state.wave} cleared! The heart-cart rolls on.`, 2.2);
  }
  if (state.windCharges < 5) state.windCharges += 1;
  if (state.wavesCleared >= TOTAL_WAVES) {
    state.phase = 'won';
    state.finalScore = state.score + state.heart * 25;
    if (sfx) sfx('win');
  }
}

function loseGame(state, sfx) {
  state.phase = 'lost';
  state.finalScore = state.score;
  if (sfx) sfx('lose');
}

export function updatePlaying(state, dt, sfx) {
  if (state.phase !== 'playing' || state.paused) return;
  state.time += dt;
  if (state.messageTimer > 0) state.messageTimer -= dt;

  // Spawning.
  if (state.waveState === 'spawning') {
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      const type = state.spawnQueue.shift();
      if (type) {
        state.enemies.push(spawnEnemy(state, type));
        state.spawnTimer = Math.max(0.35, 0.95 - state.wave * 0.04);
      } else {
        state.waveState = 'fighting';
      }
    }
  }

  updateTowers(state, dt, sfx ? (name) => sfx(name) : null);
  updateProjectiles(state, dt);
  updateEnemies(state, dt);

  // Particles and floaters.
  for (const p of state.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 60 * dt;
    p.life -= dt;
  }
  state.particles = state.particles.filter((p) => p.life > 0);
  for (const f of state.floaters) {
    f.y -= 22 * dt;
    f.life -= dt;
  }
  state.floaters = state.floaters.filter((f) => f.life > 0);

  // Wind streaks drift across the field along the wind.
  const wind = windOf(state);
  if (state.rng() < dt * 6) {
    state.streaks.push({
      x: 40 + state.rng() * 1200, y: 70 + state.rng() * 520,
      life: 1.6, max: 1.6, len: 26 + state.rng() * 30,
    });
  }
  for (const s of state.streaks) {
    s.x += wind.dx * 130 * dt;
    s.y += wind.dy * 130 * dt;
    s.life -= dt;
  }
  state.streaks = state.streaks.filter((s) => s.life > 0);

  if (state.heart <= 0) {
    state.heart = 0;
    loseGame(state, sfx);
    return;
  }
  if ((state.waveState === 'spawning' || state.waveState === 'fighting')
    && state.spawnQueue.length === 0 && state.enemies.length === 0) {
    endWave(state, sfx);
  }
}

// --- Auto-player: the strategy a decent player follows. Used by the
// fast-forward screenshot states and by headless win/loss verification.
const AUTO_PLOTS_ORDER = [3, 6, 17, 1, 9, 14, 15, 12, 4, 0, 7, 10, 5, 2, 8, 11, 13, 16];

export function autoBuild(state) {
  // Between waves, spend salt in priority order until nothing affordable.
  let spent = true;
  let guard = 0;
  while (spent && guard < 40) {
    spent = false;
    guard += 1;
    const sails = state.towers.filter((t) => t.type === 'sail').length;
    const mills = state.towers.filter((t) => t.type === 'windmill').length;
    const carts = state.towers.filter((t) => t.type === 'saltcart').length;
    const freePlots = AUTO_PLOTS_ORDER.filter((i) => !state.plots[i].towerId);
    if (freePlots.length === 0) break;
    if (carts < 2 && state.salt >= TOWER_TYPES.saltcart.cost && state.wave <= 2) {
      if (buildTower(state, 'saltcart', freePlots[0])) { spent = true; continue; }
    }
    if (sails < 3 && state.salt >= TOWER_TYPES.sail.cost) {
      if (buildTower(state, 'sail', freePlots[0])) { spent = true; continue; }
    }
    if (mills < 2 && state.salt >= TOWER_TYPES.windmill.cost) {
      if (buildTower(state, 'windmill', freePlots[0])) { spent = true; continue; }
    }
    if (sails < 8 && state.salt >= TOWER_TYPES.sail.cost) {
      if (buildTower(state, 'sail', freePlots[0])) { spent = true; continue; }
    }
    if (mills < 5 && state.salt >= TOWER_TYPES.windmill.cost) {
      if (buildTower(state, 'windmill', freePlots[0])) { spent = true; continue; }
    }
    if (state.salt >= TOWER_TYPES.saltcart.cost && carts < 3) {
      if (buildTower(state, 'saltcart', freePlots[0])) { spent = true; continue; }
    }
    if (state.barricades.length < 3 && state.salt >= TOWER_TYPES.barricade.cost) {
      // Barricade on the long bottom straight, ahead of the cart.
      const dist = 420 + state.barricades.length * 220;
      if (buildBarricade(state, dist)) { spent = true; continue; }
    }
    if (state.salt >= TOWER_TYPES.sail.cost && freePlots.length > 0) {
      if (buildTower(state, 'sail', freePlots[0])) { spent = true; continue; }
    }
  }
}

// During a wave, turn the wind one step when the next wind direction
// would give strictly more sail towers a downwind target in range.
export function autoWind(state) {
  if (state.windCharges <= 0 || state.enemies.length === 0) return;
  const sails = state.towers.filter((t) => t.type === 'sail');
  if (sails.length === 0) return;
  const countFor = (windIndex) => {
    const wind = WIND_DIRS[windIndex];
    let fed = 0;
    for (const t of sails) {
      const def = TOWER_TYPES.sail;
      for (const e of state.enemies) {
        const dx = e.x - t.x;
        const dy = e.y - t.y;
        const len = Math.hypot(dx, dy) || 1;
        if (Math.hypot(dx, dy) > def.range) continue;
        if ((dx / len) * wind.dx + (dy / len) * wind.dy > 0.2) { fed += 1; break; }
      }
    }
    return fed;
  };
  const current = countFor(state.windIndex);
  if (current >= sails.length) return;
  const next = countFor((state.windIndex + 1) % WIND_DIRS.length);
  if (next > current) turnWind(state, null);
}

export function autoPlayStep(state, dt, sfx) {
  if (state.phase !== 'playing') return;
  if (state.waveState === 'between') {
    autoBuild(state);
    startWave(state, sfx);
  } else {
    autoWind(state);
  }
  updatePlaying(state, dt, sfx);
}

// Run the real simulation as fast as possible until the game ends.
// Returns { result: 'won'|'lost', steps, wave, kills, score, heart, salt }.
export function fastForward(state, strategy, maxSteps) {
  const sfx = null;
  let steps = 0;
  const limit = maxSteps || 400000;
  while (state.phase === 'playing' && steps < limit) {
    if (strategy === 'auto') autoPlayStep(state, 1 / 30, sfx);
    else if (strategy === 'none') {
      if (state.waveState === 'between') startWave(state, sfx);
      updatePlaying(state, 1 / 30, sfx);
    } else {
      updatePlaying(state, 1 / 30, sfx);
    }
    steps += 1;
  }
  return {
    result: state.phase,
    steps,
    wave: state.wave,
    wavesCleared: state.wavesCleared,
    kills: state.kills,
    score: state.score,
    heart: state.heart,
    salt: state.salt,
  };
}

export function cartPositionFor(state) {
  return cartPos(state);
}
