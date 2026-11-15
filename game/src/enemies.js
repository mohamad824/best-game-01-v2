// Enemies: creation, road movement, barricade blocking, leaks.
import { ENEMY_TYPES, ROAD_POINTS } from './data.js';
import { pointOnRoad } from './state.js';

export function spawnEnemy(state, type) {
  const base = ENEMY_TYPES[type];
  const wave = Math.max(1, state.wave);
  const hpScale = 1 + (wave - 1) * 0.19;
  const speedScale = 1 + (wave - 1) * 0.03;
  const enemy = {
    id: state.nextId,
    type,
    name: base.name,
    x: ROAD_POINTS[0][0],
    y: ROAD_POINTS[0][1],
    roadDist: 0,
    hp: Math.round(base.hp * hpScale),
    maxHp: Math.round(base.hp * hpScale),
    speed: base.speed * speedScale,
    radius: base.radius,
    reward: base.reward,
    leak: base.leak,
    color: base.color,
    state: 'walk', // walk | chew
    attackCd: 0,
    wobble: state.rng() * Math.PI * 2,
    flash: 0,
  };
  state.nextId += 1;
  return enemy;
}

// Distance from a point to the nearest barricade ahead on the road.
function barricadeAhead(state, roadDist) {
  let best = null;
  for (const b of state.barricades) {
    const gap = b.roadDist - roadDist;
    if (gap > 0 && gap < 30 && (!best || gap < best.gap)) best = { barricade: b, gap };
  }
  return best;
}

export function updateEnemies(state, dt) {
  for (const e of state.enemies) {
    if (e.flash > 0) e.flash -= dt;
    if (e.state === 'chew') {
      e.attackCd -= dt;
      const target = e.chewing;
      if (!target || target.hp <= 0) {
        e.state = 'walk';
        e.chewing = null;
        continue;
      }
      if (e.attackCd <= 0) {
        e.attackCd = 0.9;
        target.hp -= 9;
        state.particles.push({ x: target.x, y: target.y - 6, vx: (state.rng() - 0.5) * 40, vy: -30, life: 0.4, max: 0.4, color: '#8a5f30', size: 3 });
        if (target.hp <= 0) {
          state.barricades = state.barricades.filter((b) => b.id !== target.id);
          state.floaters.push({ x: target.x, y: target.y - 18, text: 'Barricade broken!', color: '#e1553f', life: 1.2 });
          e.state = 'walk';
          e.chewing = null;
        }
      }
      continue;
    }
    // Walking: stop at a barricade, else advance along the road.
    const ahead = barricadeAhead(state, e.roadDist);
    if (ahead && ahead.gap < 26) {
      e.state = 'chew';
      e.chewing = ahead.barricade;
      e.attackCd = 0.4;
      continue;
    }
    e.roadDist += e.speed * dt;
    const pos = pointOnRoad(ROAD_POINTS, e.roadDist);
    const wob = Math.sin(state.time * 3 + e.wobble) * 3;
    e.x = pos.x + Math.cos(pos.angle + Math.PI / 2) * wob;
    e.y = pos.y + Math.sin(pos.angle + Math.PI / 2) * wob;
    if (e.roadDist >= state.roadTotal) {
      e.leaked = true;
    }
  }
  // Leaks: an enemy that reaches the Far Gate end hits the heart-cart.
  const leaked = state.enemies.filter((e) => e.leaked);
  for (const e of leaked) {
    state.heart -= e.leak;
    state.floaters.push({ x: e.x - 20, y: e.y - 24, text: `-${e.leak} heart`, color: '#e1553f', life: 1.2 });
  }
  state.enemies = state.enemies.filter((e) => !e.leaked && e.hp > 0);
}
