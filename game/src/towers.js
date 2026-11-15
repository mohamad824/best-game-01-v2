// Towers: placement, the downwind firing rule, targeting, projectiles.
import { ROAD_POINTS, TOWER_TYPES } from './data.js';
import { pointOnRoad, windOf } from './state.js';

export function towerAtPlot(state, plotIndex) {
  return state.towers.find((t) => t.plot === plotIndex) || null;
}

export function canAfford(state, type) {
  return state.salt >= TOWER_TYPES[type].cost;
}

export function buildTower(state, type, plotIndex) {
  const def = TOWER_TYPES[type];
  if (!def || state.salt < def.cost) return null;
  if (towerAtPlot(state, plotIndex)) return null;
  const plot = state.plots[plotIndex];
  if (!plot) return null;
  state.salt -= def.cost;
  const tower = {
    id: state.nextId,
    type,
    x: plot.x,
    y: plot.y,
    plot: plotIndex,
    cooldown: 0,
    angle: -Math.PI / 2,
    sailPhase: state.rng() * Math.PI * 2,
    built: state.time,
  };
  state.nextId += 1;
  state.towers.push(tower);
  plot.towerId = tower.id;
  state.towersBuilt += 1;
  if (type === 'barricade') state.stats.barricadesBuilt += 1;
  return tower;
}

// A barricade is placed ON the road at the clicked road distance.
export function buildBarricade(state, roadDist) {
  const def = TOWER_TYPES.barricade;
  if (state.salt < def.cost) return null;
  for (const b of state.barricades) {
    if (Math.abs(b.roadDist - roadDist) < 70) return null; // too close to another
  }
  state.salt -= def.cost;
  const pos = pointOnRoad(ROAD_POINTS, roadDist);
  const barricade = {
    id: state.nextId, x: pos.x, y: pos.y, roadDist, hp: def.hp, maxHp: def.hp,
  };
  state.nextId += 1;
  state.barricades.push(barricade);
  state.towersBuilt += 1;
  state.stats.barricadesBuilt += 1;
  return barricade;
}

export function sellTower(state, tower) {
  const def = TOWER_TYPES[tower.type];
  const refund = Math.floor(def.cost / 2);
  state.salt += refund;
  state.towers = state.towers.filter((t) => t.id !== tower.id);
  const plot = state.plots[tower.plot];
  if (plot) plot.towerId = null;
  state.selectedTower = null;
  return refund;
}

// The wind rule: a sail tower fires ONLY at enemies downwind of it.
export function isDownwind(state, tower, enemy) {
  const wind = windOf(state);
  const dx = enemy.x - tower.x;
  const dy = enemy.y - tower.y;
  const len = Math.hypot(dx, dy) || 1;
  return (dx / len) * wind.dx + (dy / len) * wind.dy > 0.2;
}

function nearestTarget(state, tower, def) {
  let best = null;
  for (const e of state.enemies) {
    const d = Math.hypot(e.x - tower.x, e.y - tower.y);
    if (d > def.range) continue;
    if (tower.type === 'sail' && !isDownwind(state, tower, e)) continue;
    // Prefer the enemy furthest along the road (closest to the cart).
    const score = e.roadDist - d * 0.1;
    if (!best || score > best.score) best = { enemy: e, score };
  }
  return best ? best.enemy : null;
}

export function updateTowers(state, dt, sfx) {
  for (const tower of state.towers) {
    if (tower.type === 'barricade') continue;
    tower.cooldown -= dt;
    const def = TOWER_TYPES[tower.type];
    const target = nearestTarget(state, tower, def);
    if (!target) continue;
    tower.angle = Math.atan2(target.y - tower.y, target.x - tower.x);
    if (tower.cooldown > 0) continue;
    tower.cooldown = 1 / def.rate;
    state.stats.shots += 1;
    const speed = tower.type === 'windmill' ? 520 : 640;
    state.projectiles.push({
      x: tower.x, y: tower.y - 8, targetId: target.id,
      tx: target.x, ty: target.y, speed, damage: def.damage,
      kind: tower.type, life: 1.2,
    });
    if (sfx) sfx(tower.type === 'windmill' ? 'thump' : 'shoot');
  }
}

export function updateProjectiles(state, dt) {
  for (const p of state.projectiles) {
    const target = state.enemies.find((e) => e.id === p.targetId);
    if (target) {
      p.tx = target.x;
      p.ty = target.y;
    }
    const dx = p.tx - p.x;
    const dy = p.ty - p.y;
    const dist = Math.hypot(dx, dy);
    const step = p.speed * dt;
    if (dist <= step + 6) {
      p.hit = true;
      if (target && target.hp > 0) {
        target.hp -= p.damage;
        target.flash = 0.12;
        if (p.kind === 'windmill') {
          target.roadDist = Math.max(0, target.roadDist - 6); // heavy shot shoves back
        }
        if (target.hp <= 0) {
          state.kills += 1;
          state.waveKills += 1;
          state.score = state.kills * 10; // score is exactly kills x 10
          state.salt += target.reward;
          state.saltEarned += target.reward;
          state.floaters.push({ x: target.x, y: target.y - 16, text: `+${target.reward}`, color: '#e8b93c', life: 0.8 });
          for (let i = 0; i < 6; i += 1) {
            state.particles.push({
              x: target.x, y: target.y,
              vx: (state.rng() - 0.5) * 120, vy: (state.rng() - 0.5) * 120,
              life: 0.5, max: 0.5, color: target.color, size: 3,
            });
          }
        }
      }
      continue;
    }
    p.x += (dx / dist) * step;
    p.y += (dy / dist) * step;
    p.life -= dt;
  }
  state.projectiles = state.projectiles.filter((p) => !p.hit && p.life > 0);
  state.enemies = state.enemies.filter((e) => e.hp > 0);
}
