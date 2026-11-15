// Static data for SALTWIND CARAVAN: palette, road, plots, waves, towers.
// Nothing here is read from the network; every value is written out below.

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const HUD_H = 56;
export const FIELD_TOP = 56;
export const FIELD_BOTTOM = 600;
export const BAR_TOP = 600;

export const PALETTE = {
  sand: '#f0d49a',
  sandLight: '#f7e3b8',
  sandDark: '#e0bd7d',
  dune: '#dfb877',
  duneDark: '#cfa45e',
  road: '#b98a4e',
  roadEdge: '#8a5f30',
  roadDash: '#e8d5a8',
  hud: '#3a2415',
  hudLight: '#4d3a24',
  panel: '#4a2f1c',
  panelEdge: '#c9a227',
  cream: '#f7ead0',
  ink: '#2e1c0e',
  teal: '#1fa8a0',
  tealDark: '#0f7a74',
  gold: '#e8b93c',
  red: '#e1553f',
  green: '#58b368',
  white: '#fff8ea',
};

// The winding road the raiders walk and the heart-cart travels, as a
// polyline across the field. Narrow band, never a big empty rectangle.
export const ROAD_POINTS = [
  [-20, 570],
  [340, 570],
  [340, 440],
  [900, 440],
  [900, 310],
  [420, 310],
  [420, 180],
  [1300, 180],
];
export const ROAD_WIDTH = 44;
export const GATE_POS = { x: 1225, y: 180 };

// Dashed circular build plots, hand-placed clear of the road band.
export const PLOTS = [
  { x: 120, y: 500 },
  { x: 180, y: 360 },
  { x: 520, y: 500 },
  { x: 700, y: 370 },
  { x: 1060, y: 500 },
  { x: 1060, y: 370 },
  { x: 700, y: 240 },
  { x: 240, y: 240 },
  { x: 1080, y: 110 },
  { x: 620, y: 110 },
  { x: 80, y: 110 },
  { x: 1150, y: 240 },
  { x: 520, y: 370 },
  { x: 980, y: 510 },
  { x: 340, y: 110 },
  { x: 860, y: 110 },
  { x: 1150, y: 110 },
  { x: 1180, y: 380 },
];

// Fixed decoration, placed to fill every gap between road and plots.
export const CACTI = [
  { x: 60, y: 500, s: 1.1 },
  { x: 430, y: 500, s: 0.9 },
  { x: 850, y: 505, s: 1.2 },
  { x: 1180, y: 500, s: 1.0 },
  { x: 60, y: 200, s: 0.9 },
  { x: 60, y: 290, s: 1.0 },
  { x: 960, y: 90, s: 0.8 },
  { x: 1200, y: 500, s: 1.0 },
];
export const ROCKS = [
  { x: 260, y: 500, s: 1.0 },
  { x: 620, y: 380, s: 0.7 },
  { x: 780, y: 510, s: 1.1 },
  { x: 280, y: 390, s: 0.8 },
  { x: 1240, y: 380, s: 0.9 },
  { x: 200, y: 520, s: 0.7 },
  { x: 900, y: 120, s: 0.8 },
  { x: 480, y: 240, s: 0.6 },
  { x: 40, y: 330, s: 0.9 },
  { x: 1240, y: 90, s: 0.7 },
];
export const GRASS = [
  { x: 150, y: 470 }, { x: 420, y: 400 }, { x: 640, y: 505 },
  { x: 820, y: 400 }, { x: 900, y: 500 }, { x: 1120, y: 500 },
  { x: 300, y: 240 }, { x: 520, y: 250 }, { x: 760, y: 130 },
  { x: 100, y: 180 }, { x: 360, y: 520 }, { x: 560, y: 130 },
  { x: 1160, y: 120 }, { x: 880, y: 220 }, { x: 180, y: 505 },
];
export const DUNES = [
  { x: 180, y: 90, rx: 220, ry: 26 },
  { x: 700, y: 540, rx: 260, ry: 24 },
  { x: 1150, y: 540, rx: 180, ry: 20 },
  { x: 500, y: 120, rx: 200, ry: 22 },
  { x: 950, y: 420, rx: 170, ry: 18 },
];
export const OASIS = { x: 1140, y: 520, rx: 72, ry: 17 };

export const WIND_DIRS = [
  { code: 'N', name: 'North', dx: 0, dy: -1 },
  { code: 'NE', name: 'North-East', dx: 0.707, dy: -0.707 },
  { code: 'E', name: 'East', dx: 1, dy: 0 },
  { code: 'SE', name: 'South-East', dx: 0.707, dy: 0.707 },
  { code: 'S', name: 'South', dx: 0, dy: 1 },
  { code: 'SW', name: 'South-West', dx: -0.707, dy: 0.707 },
  { code: 'W', name: 'West', dx: -1, dy: 0 },
  { code: 'NW', name: 'North-West', dx: -0.707, dy: -0.707 },
];

export const TOWER_TYPES = {
  barricade: {
    key: '1', name: 'Barricade', cost: 20, range: 0, damage: 0, rate: 0,
    hp: 120, desc: 'Roadblock on the road. Raiders stop and chew it.',
  },
  sail: {
    key: '2', name: 'Sail Tower', cost: 50, range: 210, damage: 18, rate: 2.6,
    hp: 0, desc: 'Fires only DOWNWIND. Fast, long reach.',
  },
  windmill: {
    key: '3', name: 'Windmill', cost: 80, range: 170, damage: 50, rate: 0.85,
    hp: 0, desc: 'Fires in every direction. Slow, heavy shots.',
  },
  saltcart: {
    key: '4', name: 'Salt Cart', cost: 40, range: 135, damage: 8, rate: 1.3,
    hp: 0, desc: 'Weak shots — but earns +8 salt every wave.',
  },
};
export const TOWER_ORDER = ['barricade', 'sail', 'windmill', 'saltcart'];

export const ENEMY_TYPES = {
  raider: { name: 'Raider', hp: 42, speed: 58, reward: 6, leak: 1, radius: 11, color: '#a03d2a' },
  runner: { name: 'Dust Runner', hp: 30, speed: 96, reward: 6, leak: 1, radius: 9, color: '#c96a1e' },
  beetle: { name: 'Dune Beetle', hp: 110, speed: 40, reward: 9, leak: 2, radius: 13, color: '#5d4a8a' },
  brute: { name: 'Iron Brute', hp: 260, speed: 34, reward: 14, leak: 3, radius: 15, color: '#4a4a52' },
  swarm: { name: 'Sand Mite', hp: 16, speed: 78, reward: 3, leak: 1, radius: 7, color: '#8a6d2f' },
  king: { name: 'Salt King', hp: 900, speed: 30, reward: 60, leak: 5, radius: 20, color: '#7a1f3d' },
};

export const WAVE_NAMES = [
  'SAND STROLLERS', 'DUST RUNNERS', 'SALT THIEVES', 'DUNE BEETLES',
  'WIND REAVERS', 'SCORPION PACK', 'EMBER RAIDERS', 'BEETLE SWARM',
  'STORM RIDERS', 'IRON BRUTES', 'THE LONG NIGHT', "THE SALT KING'S HOST",
];

// Wave composition: [enemy type, count] per wave, before scaling.
export const WAVE_MIX = [
  [['raider', 8]],
  [['raider', 8], ['runner', 4]],
  [['raider', 10], ['runner', 6]],
  [['beetle', 8], ['raider', 6]],
  [['runner', 12], ['raider', 8]],
  [['swarm', 18], ['runner', 6]],
  [['beetle', 10], ['runner', 8], ['raider', 6]],
  [['swarm', 24], ['beetle', 6]],
  [['runner', 14], ['beetle', 8], ['raider', 8]],
  [['brute', 6], ['runner', 10], ['raider', 8]],
  [['brute', 8], ['beetle', 10], ['swarm', 16]],
  [['king', 1], ['brute', 5], ['beetle', 8], ['runner', 8]],
];

export const START_SALT = 260;
export const START_HEART = 20;
export const TOTAL_WAVES = 12;
export const KILL_SCORE = 10;
export const KILL_SALT = 6;
