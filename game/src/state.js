// Game state: one plain object, created fresh on every restart.
import { makeRng } from './rng.js';
import {
  PLOTS, ROAD_POINTS, START_HEART, START_SALT, TOTAL_WAVES, WIND_DIRS,
} from './data.js';

export function roadLength(points) {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  }
  return total;
}

export function pointOnRoad(points, dist) {
  let left = Math.max(0, dist);
  for (let i = 1; i < points.length; i += 1) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const seg = Math.hypot(x1 - x0, y1 - y0);
    if (left <= seg) {
      const t = seg === 0 ? 0 : left / seg;
      return { x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t, angle: Math.atan2(y1 - y0, x1 - x0) };
    }
    left -= seg;
  }
  const last = points[points.length - 1];
  return { x: last[0], y: last[1], angle: 0 };
}

export function createState(seed) {
  const rng = makeRng(seed || 7);
  return {
    seed: seed || 7,
    rng,
    phase: 'title', // title | playing | won | lost
    paused: false,
    muted: false,
    time: 0,
    salt: START_SALT,
    heart: START_HEART,
    maxHeart: START_HEART,
    score: 0, // strictly kills * 10 while playing, so kills 0 always means score 0
    kills: 0,
    wave: 0, // wave in progress (1-based once started); 0 before wave 1
    wavesCleared: 0,
    totalWaves: TOTAL_WAVES,
    windIndex: 5, // start South-West, as on the compass
    windCharges: 3,
    selectedType: 'sail',
    selectedTower: null,
    selectedPlot: -1,
    towers: [], // {id, type, x, y, plot, cooldown, hp, maxHp, angle, built}
    barricades: [], // {id, x, y, roadDist, hp, maxHp}
    enemies: [], // {id, type, x, y, roadDist, hp, maxHp, speed, state, attackCd, slow}
    projectiles: [],
    particles: [],
    streaks: [],
    spawnQueue: [],
    spawnTimer: 0,
    waveState: 'between', // between | spawning | fighting
    waveKills: 0,
    saltEarned: 0,
    towersBuilt: 0,
    message: '',
    messageTimer: 0,
    floaters: [], // {x, y, text, color, life}
    roadTotal: roadLength(ROAD_POINTS),
    plots: PLOTS.map((p, i) => ({ ...p, index: i, towerId: null })),
    nextId: 1,
    stats: { shots: 0, windTurns: 0, barricadesBuilt: 0 },
  };
}

export function windOf(state) {
  return WIND_DIRS[state.windIndex];
}

export function cartRoadDist(state) {
  // The heart-cart advances one twelfth of the road per cleared wave.
  return (state.wavesCleared / state.totalWaves) * state.roadTotal * 0.9;
}

export function cartPos(state) {
  return pointOnRoad(ROAD_POINTS, cartRoadDist(state));
}
