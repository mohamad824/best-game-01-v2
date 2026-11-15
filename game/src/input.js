// Mouse and keyboard input: plot clicks, road clicks, hotkeys.
import { BAR_TOP, FIELD_BOTTOM, FIELD_TOP, ROAD_POINTS, ROAD_WIDTH, TOWER_ORDER, TOWER_TYPES } from './data.js';
import { buildBarricade, buildTower, sellTower } from './towers.js';
import { showMessage, startWave, turnWind } from './sim.js';

function distToRoad(x, y) {
  let best = { dist: Infinity, roadDist: 0 };
  let acc = 0;
  for (let i = 1; i < ROAD_POINTS.length; i += 1) {
    const [x0, y0] = ROAD_POINTS[i - 1];
    const [x1, y1] = ROAD_POINTS[i];
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len2 = dx * dx + dy * dy;
    let t = len2 === 0 ? 0 : ((x - x0) * dx + (y - y0) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const px = x0 + dx * t;
    const py = y0 + dy * t;
    const d = Math.hypot(x - px, y - py);
    if (d < best.dist) best = { dist: d, roadDist: acc + Math.hypot(px - x0, py - y0) };
    acc += Math.hypot(dx, dy);
  }
  return best;
}

function nearestPlot(state, x, y) {
  let best = null;
  for (const plot of state.plots) {
    const d = Math.hypot(x - plot.x, y - plot.y);
    if (d <= 30 && (!best || d < best.d)) best = { plot, d };
  }
  return best ? best.plot : null;
}

export function handleClick(state, x, y, sfx) {
  if (state.phase === 'title') {
    state.phase = 'playing';
    showMessage(state, 'Build towers, then press SPACE to send wave 1.', 3);
    return;
  }
  if (state.phase === 'won' || state.phase === 'lost') return;
  if (y < FIELD_TOP || y > FIELD_BOTTOM) {
    // Clicks on the build bar select a tower card.
    if (y >= BAR_TOP + 26 && y <= BAR_TOP + 90) {
      const cardW = 238;
      const gap = 8;
      for (let i = 0; i < TOWER_ORDER.length; i += 1) {
        const cx = 8 + i * (cardW + gap);
        if (x >= cx && x <= cx + cardW) {
          state.selectedType = TOWER_ORDER[i];
          state.selectedTower = null;
          if (sfx) sfx.play('build');
          return;
        }
      }
    }
    return;
  }
  const plot = nearestPlot(state, x, y);
  if (plot) {
    const existing = state.towers.find((t) => t.plot === plot.index);
    if (existing) {
      state.selectedTower = existing;
      state.selectedPlot = plot.index;
      return;
    }
    const built = buildTower(state, state.selectedType, plot.index);
    if (built) {
      state.selectedPlot = plot.index;
      if (sfx) sfx.play('build');
    } else if (state.salt < TOWER_TYPES[state.selectedType].cost) {
      showMessage(state, `Not enough salt for a ${TOWER_TYPES[state.selectedType].name}.`, 1.8);
      if (sfx) sfx.play('error');
    }
    return;
  }
  // Otherwise, a click near the road places a barricade there.
  const road = distToRoad(x, y);
  if (road.dist <= ROAD_WIDTH / 2 + 8) {
    const built = buildBarricade(state, road.roadDist);
    if (built) {
      if (sfx) sfx.play('build');
    } else if (state.salt < TOWER_TYPES.barricade.cost) {
      showMessage(state, 'Not enough salt for a barricade.', 1.8);
      if (sfx) sfx.play('error');
    } else {
      showMessage(state, 'Too close to another barricade.', 1.8);
    }
    return;
  }
  // Clicked empty sand: clear the selection.
  state.selectedTower = null;
  state.selectedPlot = -1;
}

export function handleKey(state, key, sfx, restart) {
  const k = key.toLowerCase();
  if (state.phase === 'title' && (key === 'Enter' || key === ' ')) {
    state.phase = 'playing';
    showMessage(state, 'Build towers, then press SPACE to send wave 1.', 3);
    return;
  }
  if (k === 'r') {
    restart();
    return;
  }
  if (state.phase !== 'playing') return;
  if (k === 'p') {
    state.paused = !state.paused;
    return;
  }
  if (k === 'm') {
    state.muted = !state.muted;
    if (sfx) sfx.setMuted(state.muted);
    return;
  }
  if (state.paused) return;
  if (k === ' ') {
    startWave(state, sfx ? (name) => sfx.play(name) : null);
    return;
  }
  if (k === '5') {
    turnWind(state, sfx ? (name) => sfx.play(name) : null);
    return;
  }
  if (k === 'x' && state.selectedTower) {
    const refund = sellTower(state, state.selectedTower);
    showMessage(state, `Sold for +${refund} salt.`, 1.6);
    if (sfx) sfx.play('coin');
    return;
  }
  const typeIndex = ['1', '2', '3', '4'].indexOf(k);
  if (typeIndex >= 0) {
    state.selectedType = TOWER_ORDER[typeIndex];
    state.selectedTower = null;
  }
}
