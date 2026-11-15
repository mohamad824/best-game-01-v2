// All drawing: field, HUD, build bar, title/win/loss screens.
import {
  BAR_TOP, CACTI, DUNES, FIELD_BOTTOM, FIELD_TOP, GATE_POS, GRASS, HUD_H,
  OASIS, PALETTE, PLOTS, ROAD_POINTS, ROAD_WIDTH, ROCKS, TOWER_ORDER,
  TOWER_TYPES, VIEW_H, VIEW_W,
} from './data.js';
import { makeRng } from './rng.js';
import { cartPos, windOf } from './state.js';
import { nextWaveName, waveName } from './waves.js';

const speckleRng = makeRng(1234);
const SPECKLES = Array.from({ length: 260 }, () => ({
  x: speckleRng() * VIEW_W,
  y: FIELD_TOP + speckleRng() * (FIELD_BOTTOM - FIELD_TOP),
  r: 1 + speckleRng() * 2.2,
  a: 0.05 + speckleRng() * 0.1,
}));

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawRoad(ctx) {
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(ROAD_POINTS[0][0], ROAD_POINTS[0][1]);
  for (let i = 1; i < ROAD_POINTS.length; i += 1) ctx.lineTo(ROAD_POINTS[i][0], ROAD_POINTS[i][1]);
  ctx.strokeStyle = PALETTE.roadEdge;
  ctx.lineWidth = ROAD_WIDTH + 10;
  ctx.stroke();
  ctx.strokeStyle = PALETTE.road;
  ctx.lineWidth = ROAD_WIDTH;
  ctx.stroke();
  ctx.strokeStyle = PALETTE.roadDash;
  ctx.lineWidth = 3;
  ctx.setLineDash([16, 14]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawCactus(ctx, c) {
  ctx.fillStyle = '#3f8f4f';
  const s = c.s;
  roundRect(ctx, c.x - 4 * s, c.y - 26 * s, 8 * s, 26 * s, 4 * s);
  ctx.fill();
  roundRect(ctx, c.x - 14 * s, c.y - 16 * s, 7 * s, 12 * s, 3 * s);
  ctx.fill();
  roundRect(ctx, c.x + 7 * s, c.y - 20 * s, 7 * s, 14 * s, 3 * s);
  ctx.fill();
  ctx.fillStyle = '#2f7a3e';
  ctx.fillRect(c.x - 14 * s, c.y - 16 * s, 7 * s, 3 * s);
  ctx.fillRect(c.x + 7 * s, c.y - 20 * s, 7 * s, 3 * s);
}

function drawRock(ctx, r) {
  ctx.fillStyle = '#a08a6a';
  ctx.beginPath();
  ctx.ellipse(r.x, r.y, 14 * r.s, 9 * r.s, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c4b198';
  ctx.beginPath();
  ctx.ellipse(r.x - 3 * r.s, r.y - 3 * r.s, 7 * r.s, 4 * r.s, 0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawGrass(ctx, g) {
  ctx.strokeStyle = '#7a9a3f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(g.x - 5, g.y);
  ctx.lineTo(g.x - 7, g.y - 9);
  ctx.moveTo(g.x, g.y);
  ctx.lineTo(g.x, g.y - 11);
  ctx.moveTo(g.x + 5, g.y);
  ctx.lineTo(g.x + 7, g.y - 9);
  ctx.stroke();
}

function drawGate(ctx) {
  const { x, y } = GATE_POS;
  ctx.fillStyle = PALETTE.hud;
  ctx.fillRect(x - 34, y - 52, 10, 104);
  ctx.fillRect(x + 24, y - 52, 10, 104);
  ctx.fillStyle = PALETTE.teal;
  ctx.beginPath();
  ctx.moveTo(x - 34, y - 52);
  ctx.lineTo(x + 34, y - 52);
  ctx.lineTo(x + 24, y - 28);
  ctx.lineTo(x - 24, y - 28);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 13px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FAR GATE', x, y + 78);
  ctx.textAlign = 'left';
}

function drawCart(ctx, state) {
  const pos = cartPos(state);
  const bob = Math.sin(state.time * 2.4) * 1.5;
  ctx.save();
  ctx.translate(pos.x, pos.y + bob);
  ctx.rotate(pos.angle * 0.15);
  // Wheels.
  ctx.fillStyle = PALETTE.hud;
  ctx.beginPath();
  ctx.arc(-10, 8, 6, 0, Math.PI * 2);
  ctx.arc(10, 8, 6, 0, Math.PI * 2);
  ctx.fill();
  // Cart body.
  ctx.fillStyle = '#7a4a22';
  roundRect(ctx, -18, -8, 36, 14, 3);
  ctx.fill();
  ctx.fillStyle = PALETTE.gold;
  ctx.fillRect(-14, -8, 28, 4);
  // Teal sail diamond (the heart).
  ctx.fillStyle = PALETTE.teal;
  ctx.beginPath();
  ctx.moveTo(0, -26);
  ctx.lineTo(8, -14);
  ctx.lineTo(0, -8);
  ctx.lineTo(-8, -14);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // Label + mini heart bar.
  ctx.font = 'bold 11px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.cream;
  ctx.strokeStyle = 'rgba(46,28,14,0.8)';
  ctx.lineWidth = 3;
  ctx.strokeText(`HEART-CART ${state.heart}/${state.maxHeart}`, pos.x, pos.y - 34);
  ctx.fillText(`HEART-CART ${state.heart}/${state.maxHeart}`, pos.x, pos.y - 34);
  ctx.fillStyle = 'rgba(46,28,14,0.55)';
  ctx.fillRect(pos.x - 22, pos.y - 30, 44, 5);
  ctx.fillStyle = PALETTE.green;
  ctx.fillRect(pos.x - 22, pos.y - 30, 44 * Math.max(0, state.heart / state.maxHeart), 5);
  ctx.textAlign = 'left';
}

function drawTower(ctx, state, tower) {
  const def = TOWER_TYPES[tower.type];
  const t = state.time;
  if (tower.type === 'sail') {
    // Wooden mast.
    ctx.fillStyle = '#6b4423';
    ctx.fillRect(tower.x - 3, tower.y - 26, 6, 30);
    ctx.fillStyle = '#8a5f30';
    ctx.beginPath();
    ctx.arc(tower.x, tower.y + 4, 12, 0, Math.PI * 2);
    ctx.fill();
    // Fluttering sail: the wind is visible in every sail.
    const wind = windOf(state);
    const flutter = Math.sin(t * 5 + tower.sailPhase) * 4;
    const lean = wind.dx * 6;
    ctx.fillStyle = PALETTE.cream;
    ctx.beginPath();
    ctx.moveTo(tower.x, tower.y - 28);
    ctx.quadraticCurveTo(tower.x + 16 + lean, tower.y - 14, tower.x + 2 + flutter, tower.y - 2);
    ctx.quadraticCurveTo(tower.x - 4, tower.y - 14, tower.x, tower.y - 28);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.teal;
    ctx.beginPath();
    ctx.moveTo(tower.x, tower.y - 28);
    ctx.lineTo(tower.x + 8 + lean * 0.5, tower.y - 16);
    ctx.lineTo(tower.x, tower.y - 10);
    ctx.closePath();
    ctx.fill();
  } else if (tower.type === 'windmill') {
    ctx.fillStyle = '#8a5f30';
    ctx.beginPath();
    ctx.moveTo(tower.x - 9, tower.y + 6);
    ctx.lineTo(tower.x - 5, tower.y - 26);
    ctx.lineTo(tower.x + 5, tower.y - 26);
    ctx.lineTo(tower.x + 9, tower.y + 6);
    ctx.closePath();
    ctx.fill();
    const spin = t * 1.8 + tower.sailPhase;
    ctx.strokeStyle = PALETTE.cream;
    ctx.lineWidth = 4;
    for (let i = 0; i < 4; i += 1) {
      const a = spin + (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.moveTo(tower.x, tower.y - 28);
      ctx.lineTo(tower.x + Math.cos(a) * 20, tower.y - 28 + Math.sin(a) * 20);
      ctx.stroke();
    }
    ctx.fillStyle = PALETTE.teal;
    ctx.beginPath();
    ctx.arc(tower.x, tower.y - 28, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (tower.type === 'saltcart') {
    ctx.fillStyle = '#6b4423';
    ctx.beginPath();
    ctx.arc(tower.x - 7, tower.y + 4, 5, 0, Math.PI * 2);
    ctx.arc(tower.x + 7, tower.y + 4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#a06a35';
    roundRect(ctx, tower.x - 13, tower.y - 8, 26, 12, 3);
    ctx.fill();
    ctx.fillStyle = PALETTE.white;
    ctx.beginPath();
    ctx.ellipse(tower.x, tower.y - 8, 10, 5, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 10px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('+8', tower.x, tower.y - 16);
    ctx.textAlign = 'left';
  }
}

function drawEnemy(ctx, state, e) {
  const wob = Math.sin(state.time * 6 + e.wobble) * 2;
  ctx.save();
  ctx.translate(e.x, e.y + wob);
  ctx.fillStyle = e.flash > 0 ? '#ffffff' : e.color;
  ctx.beginPath();
  ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
  ctx.fill();
  if (e.type === 'beetle') {
    ctx.strokeStyle = '#3d2f66';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -2, e.radius - 3, Math.PI, 0);
    ctx.stroke();
  }
  if (e.type === 'king') {
    ctx.fillStyle = PALETTE.gold;
    ctx.beginPath();
    ctx.moveTo(-10, -e.radius + 2);
    ctx.lineTo(-5, -e.radius - 8);
    ctx.lineTo(0, -e.radius + 1);
    ctx.lineTo(5, -e.radius - 8);
    ctx.lineTo(10, -e.radius + 2);
    ctx.closePath();
    ctx.fill();
  }
  // Eyes, always facing down the road.
  ctx.fillStyle = '#fff8ea';
  ctx.beginPath();
  ctx.arc(-4, -2, 2.4, 0, Math.PI * 2);
  ctx.arc(4, -2, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1c0f08';
  ctx.beginPath();
  ctx.arc(-3, -2, 1.2, 0, Math.PI * 2);
  ctx.arc(5, -2, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Health bar.
  if (e.hp < e.maxHp) {
    ctx.fillStyle = 'rgba(46,28,14,0.6)';
    ctx.fillRect(e.x - 14, e.y - e.radius - 9, 28, 4);
    ctx.fillStyle = PALETTE.red;
    ctx.fillRect(e.x - 14, e.y - e.radius - 9, 28 * Math.max(0, e.hp / e.maxHp), 4);
  }
}

function drawBarricade(ctx, b) {
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.fillStyle = '#7a4a22';
  ctx.fillRect(-16, -9, 32, 8);
  ctx.fillStyle = '#9a6a35';
  ctx.fillRect(-16, -9, 32, 3);
  ctx.strokeStyle = '#5d3517';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-16, -5);
  ctx.lineTo(16, -5);
  ctx.moveTo(-12, -9);
  ctx.lineTo(-12, -1);
  ctx.moveTo(12, -9);
  ctx.lineTo(12, -1);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = 'rgba(46,28,14,0.6)';
  ctx.fillRect(b.x - 16, b.y - 18, 32, 4);
  ctx.fillStyle = PALETTE.gold;
  ctx.fillRect(b.x - 16, b.y - 18, 32 * Math.max(0, b.hp / b.maxHp), 4);
}

function drawField(ctx, state) {
  // Sand.
  const grad = ctx.createLinearGradient(0, FIELD_TOP, 0, FIELD_BOTTOM);
  grad.addColorStop(0, PALETTE.sandLight);
  grad.addColorStop(0.55, PALETTE.sand);
  grad.addColorStop(1, PALETTE.sandDark);
  ctx.fillStyle = grad;
  ctx.fillRect(0, FIELD_TOP, VIEW_W, FIELD_BOTTOM - FIELD_TOP);
  for (const s of SPECKLES) {
    ctx.fillStyle = `rgba(160,120,60,${s.a})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Dunes.
  for (const d of DUNES) {
    ctx.fillStyle = 'rgba(223,184,119,0.55)';
    ctx.beginPath();
    ctx.ellipse(d.x, d.y, d.rx, d.ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Oasis pond.
  ctx.fillStyle = '#7fd4c8';
  ctx.beginPath();
  ctx.ellipse(OASIS.x, OASIS.y, OASIS.rx, OASIS.ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#a8e8de';
  ctx.beginPath();
  ctx.ellipse(OASIS.x - 8, OASIS.y - 2, OASIS.rx * 0.55, OASIS.ry * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  drawRoad(ctx);
  drawGate(ctx);
  for (const g of GRASS) drawGrass(ctx, g);
  for (const r of ROCKS) drawRock(ctx, r);
  for (const c of CACTI) drawCactus(ctx, c);

  // Build plots.
  for (const plot of state.plots) {
    const hasTower = !!plot.towerId;
    ctx.beginPath();
    ctx.arc(plot.x, plot.y, 26, 0, Math.PI * 2);
    ctx.fillStyle = hasTower ? 'rgba(255,248,234,0.10)' : 'rgba(255,248,234,0.28)';
    ctx.fill();
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = state.selectedPlot === plot.index ? PALETTE.teal : 'rgba(90,60,30,0.75)';
    ctx.lineWidth = state.selectedPlot === plot.index ? 3 : 2;
    ctx.stroke();
    ctx.setLineDash([]);
    if (!hasTower) {
      ctx.fillStyle = 'rgba(90,60,30,0.5)';
      ctx.font = 'bold 16px "Trebuchet MS", Verdana, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('+', plot.x, plot.y + 6);
      ctx.textAlign = 'left';
    }
  }

  for (const b of state.barricades) drawBarricade(ctx, b);
  drawCart(ctx, state);
  for (const tower of state.towers) drawTower(ctx, state, tower);
  for (const e of state.enemies) drawEnemy(ctx, state, e);

  // Projectiles.
  for (const p of state.projectiles) {
    ctx.fillStyle = p.kind === 'windmill' ? '#5d3517' : p.kind === 'saltcart' ? PALETTE.gold : '#fff8ea';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.kind === 'windmill' ? 6 : 4, 0, Math.PI * 2);
    ctx.fill();
  }
  // Particles.
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // Wind streaks: the wind, made visible.
  for (const s of state.streaks) {
    const wind = windOf(state);
    ctx.globalAlpha = Math.max(0, (s.life / s.max) * 0.55);
    ctx.strokeStyle = '#fff8ea';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x - wind.dx * s.len, s.y - wind.dy * s.len);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // Floaters.
  ctx.font = 'bold 13px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  for (const f of state.floaters) {
    ctx.globalAlpha = Math.max(0, Math.min(1, f.life));
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';

  // Selected tower range + sell hint.
  const sel = state.selectedTower;
  if (sel) {
    const def = TOWER_TYPES[sel.type];
    if (def.range > 0) {
      ctx.beginPath();
      ctx.arc(sel.x, sel.y, def.range, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(31,168,160,0.10)';
      ctx.fill();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = PALETTE.teal;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.fillStyle = 'rgba(58,36,21,0.92)';
    roundRect(ctx, sel.x - 90, sel.y - 66, 180, 24, 6);
    ctx.fill();
    ctx.fillStyle = PALETTE.cream;
    ctx.font = 'bold 12px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${def.name} — press X to sell (+${Math.floor(def.cost / 2)} salt)`, sel.x, sel.y - 50);
    ctx.textAlign = 'left';
  }

  // Message banner.
  if (state.messageTimer > 0 && state.message) {
    ctx.font = 'bold 15px "Trebuchet MS", Verdana, sans-serif';
    const w = Math.min(760, ctx.measureText(state.message).width + 36);
    ctx.fillStyle = 'rgba(58,36,21,0.92)';
    roundRect(ctx, (VIEW_W - w) / 2, FIELD_TOP + 8, w, 32, 8);
    ctx.fill();
    ctx.fillStyle = PALETTE.cream;
    ctx.textAlign = 'center';
    ctx.fillText(state.message, VIEW_W / 2, FIELD_TOP + 29);
    ctx.textAlign = 'left';
  }
}

function drawCompass(ctx, state) {
  const cx = 800;
  const cy = HUD_H / 2;
  const wind = windOf(state);
  ctx.fillStyle = PALETTE.cream;
  ctx.beginPath();
  ctx.arc(cx, cy, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Arrow points where the wind blows TO.
  const angle = Math.atan2(wind.dy, wind.dx);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.fillStyle = PALETTE.teal;
  ctx.beginPath();
  ctx.moveTo(13, 0);
  ctx.lineTo(-8, -7);
  ctx.lineTo(-4, 0);
  ctx.lineTo(-8, 7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 15px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(`WIND ${wind.code} · ${wind.name}`, cx + 28, cy - 1);
  ctx.fillStyle = PALETTE.gold;
  ctx.font = '13px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(`charges ${state.windCharges} · [5] turn wind`, cx + 28, cy + 16);
}

function drawHud(ctx, state) {
  ctx.fillStyle = PALETTE.hud;
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 17px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(`◆ SALT ${state.salt}`, 16, 35);
  ctx.fillStyle = PALETTE.cream;
  ctx.fillText(`WAVE ${Math.max(1, state.wave)} / ${state.totalWaves}`, 168, 35);
  // Heart bar.
  ctx.fillStyle = 'rgba(255,248,234,0.25)';
  ctx.fillRect(310, 20, 110, 16);
  ctx.fillStyle = state.heart > 6 ? PALETTE.green : PALETTE.red;
  ctx.fillRect(310, 20, 110 * Math.max(0, state.heart / state.maxHeart), 16);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 14px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(`HEART ${state.heart}`, 428, 34);
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 17px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(`SCORE ${state.score}`, 540, 35);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = '15px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(`kills ${state.kills}`, 668, 34);
  drawCompass(ctx, state);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 14px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(state.muted ? 'SOUND OFF [M]' : 'SOUND ON [M]', VIEW_W - 16, 34);
  ctx.textAlign = 'left';
}

function drawBuildBar(ctx, state) {
  ctx.fillStyle = PALETTE.hud;
  ctx.fillRect(0, BAR_TOP, VIEW_W, VIEW_H - BAR_TOP);
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 13px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('BUILD — click a plot, or a barricade spot on the road', 14, BAR_TOP + 18);

  // Four tower cards. Text is wrapped to the card width, so it never clips.
  const cardW = 238;
  const cardH = 64;
  const cardY = BAR_TOP + 26;
  const gap = 8;
  TOWER_ORDER.forEach((type, i) => {
    const def = TOWER_TYPES[type];
    const x = 8 + i * (cardW + gap);
    const afford = state.salt >= def.cost;
    const selected = state.selectedType === type;
    ctx.fillStyle = selected ? '#1f5f5b' : PALETTE.panel;
    roundRect(ctx, x, cardY, cardW, cardH, 6);
    ctx.fill();
    ctx.strokeStyle = selected ? PALETTE.teal : afford ? 'rgba(247,234,208,0.35)' : 'rgba(247,234,208,0.15)';
    ctx.lineWidth = selected ? 3 : 1;
    ctx.stroke();
    ctx.globalAlpha = afford ? 1 : 0.55;
    ctx.fillStyle = PALETTE.cream;
    ctx.font = 'bold 13px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText(`[${def.key}] ${def.name} — ${def.cost} salt`, x + 10, cardY + 19);
    ctx.font = '11px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillStyle = '#e8dcc0';
    const lines = wrapText(ctx, def.desc, cardW - 20);
    lines.slice(0, 2).forEach((line, li) => {
      ctx.fillText(line, x + 10, cardY + 37 + li * 14);
    });
    ctx.globalAlpha = 1;
  });

  // Wave status panel on the right.
  const px = 992;
  const pw = VIEW_W - px - 8;
  ctx.fillStyle = PALETTE.panel;
  roundRect(ctx, px, BAR_TOP + 4, pw, cardH + 22, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(247,234,208,0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 14px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  let line1 = '';
  let line2 = '';
  if (state.phase === 'playing' && state.waveState === 'between' && state.wave < state.totalWaves) {
    line1 = 'READY — press SPACE';
    line2 = nextWaveName(state);
  } else if (state.phase === 'playing' && state.waveState !== 'between') {
    line1 = 'WAVE RUNNING…';
    line2 = `WAVE ${state.wave} — ${waveName(state.wave)}`;
  } else if (state.phase === 'playing') {
    line1 = 'ALL WAVES DONE';
    line2 = 'The cart is at the gate.';
  } else {
    line1 = 'SALTWIND CARAVAN';
    line2 = '12 waves to the Far Gate';
  }
  ctx.fillText(line1, px + pw / 2, BAR_TOP + 30);
  ctx.fillStyle = PALETTE.gold;
  ctx.font = '12px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(line2, px + pw / 2, BAR_TOP + 50);
  if (state.phase === 'playing' && state.waveState === 'between' && state.wave < state.totalWaves) {
    ctx.fillStyle = '#e8dcc0';
    ctx.font = '11px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText('Build first, then send the wave.', px + pw / 2, BAR_TOP + 68);
  }
  ctx.textAlign = 'left';

  // Controls footer: its own row, below the cards, never overlapping them.
  ctx.fillStyle = '#cbb98f';
  ctx.font = '12px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    '1–4 pick tower  ·  5 turn wind  ·  SPACE next wave  ·  P pause  ·  R restart  ·  M mute  ·  X sell tower',
    VIEW_W / 2, VIEW_H - 8,
  );
  ctx.textAlign = 'left';
}

function drawTitle(ctx, state) {
  // Desert scene behind the title.
  const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  grad.addColorStop(0, '#f7e3b8');
  grad.addColorStop(0.6, '#f0d49a');
  grad.addColorStop(1, '#dfb877');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Sun with glow.
  const sunX = 1050;
  const sunY = 120;
  const glow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 130);
  glow.addColorStop(0, 'rgba(255,220,120,0.9)');
  glow.addColorStop(1, 'rgba(255,220,120,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - 140, sunY - 140, 280, 280);
  ctx.fillStyle = '#ffd95e';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 62, 0, Math.PI * 2);
  ctx.fill();
  // Dune layers.
  ctx.fillStyle = '#e3c184';
  ctx.beginPath();
  ctx.moveTo(0, 480);
  ctx.quadraticCurveTo(320, 420, 640, 480);
  ctx.quadraticCurveTo(960, 540, 1280, 470);
  ctx.lineTo(1280, VIEW_H);
  ctx.lineTo(0, VIEW_H);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d9ae68';
  ctx.beginPath();
  ctx.moveTo(0, 580);
  ctx.quadraticCurveTo(400, 520, 800, 580);
  ctx.quadraticCurveTo(1100, 630, 1280, 570);
  ctx.lineTo(1280, VIEW_H);
  ctx.lineTo(0, VIEW_H);
  ctx.closePath();
  ctx.fill();
  // Drifting wind streaks.
  ctx.strokeStyle = 'rgba(255,248,234,0.8)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i += 1) {
    const y = 140 + i * 52;
    const x = ((state.time * 60 + i * 170) % 1400) - 60;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 46, y + 12);
    ctx.stroke();
  }
  // Small cart with a sail at the foot of the dunes.
  ctx.fillStyle = '#7a4a22';
  roundRect(ctx, 120, 600, 90, 22, 4);
  ctx.fill();
  ctx.fillStyle = PALETTE.hud;
  ctx.beginPath();
  ctx.arc(140, 626, 9, 0, Math.PI * 2);
  ctx.arc(190, 626, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.teal;
  ctx.beginPath();
  ctx.moveTo(165, 600);
  ctx.lineTo(190, 566);
  ctx.lineTo(165, 566);
  ctx.closePath();
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#7a3b1e';
  ctx.font = 'bold 84px Georgia, "Times New Roman", serif';
  ctx.fillText('SALTWIND', VIEW_W / 2, 190);
  ctx.fillStyle = PALETTE.teal;
  ctx.fillText('CARAVAN', VIEW_W / 2, 280);
  ctx.fillStyle = '#4a2f1c';
  ctx.font = 'bold 21px Georgia, "Times New Roman", serif';
  ctx.fillText('A tower defence on the desert flat — the wind decides who shoots.', VIEW_W / 2, 330);
  ctx.font = '16px Georgia, "Times New Roman", serif';
  ctx.fillText('Escort the heart-cart across 12 waves to the Far Gate.', VIEW_W / 2, 362);
  ctx.fillText('The wind shifts every wave. Sail-towers fire ONLY downwind —', VIEW_W / 2, 388);
  ctx.fillText('spend a wind charge [5] to turn it. Barricades hold the road.', VIEW_W / 2, 412);

  // How to play panel.
  ctx.fillStyle = PALETTE.hud;
  roundRect(ctx, 340, 440, 600, 132, 8);
  ctx.fill();
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 16px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('HOW TO PLAY', VIEW_W / 2, 468);
  ctx.font = '14px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('Mouse — click a plot to build · click the road for a barricade', VIEW_W / 2, 496);
  ctx.fillText('1–4 pick a tower · 5 turn the wind · SPACE send the next wave', VIEW_W / 2, 520);
  ctx.fillText('P pause · R restart · M mute · X sell a selected tower', VIEW_W / 2, 544);
  ctx.fillText('Lose if the heart-cart falls. Win by surviving all 12 waves.', VIEW_W / 2, 568 - 8 + 8);

  const blink = Math.sin(state.time * 4) > -0.2;
  if (blink) {
    ctx.fillStyle = PALETTE.red;
    ctx.font = 'bold 22px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText('CLICK OR PRESS ENTER TO START', VIEW_W / 2, 640);
  }
  ctx.textAlign = 'left';
}

function drawEndScreen(ctx, state, won) {
  ctx.fillStyle = won ? 'rgba(18,52,38,0.88)' : 'rgba(74,26,16,0.88)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  if (won) {
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 64px Georgia, "Times New Roman", serif';
    ctx.fillText('THE CARAVAN', VIEW_W / 2, 190);
    ctx.fillStyle = PALETTE.teal;
    ctx.fillText('ARRIVES!', VIEW_W / 2, 264);
    ctx.fillStyle = PALETTE.white;
    ctx.font = 'bold 20px Georgia, "Times New Roman", serif';
    ctx.fillText('All 12 waves survived. The heart-cart rolls through the Far Gate,', VIEW_W / 2, 320);
    ctx.fillText('salt glittering, sails full of the turning wind.', VIEW_W / 2, 348);
  } else {
    ctx.fillStyle = PALETTE.red;
    ctx.font = 'bold 60px Georgia, "Times New Roman", serif';
    ctx.fillText('THE HEART-CART', VIEW_W / 2, 190);
    ctx.fillStyle = PALETTE.gold;
    ctx.fillText('HAS FALLEN', VIEW_W / 2, 264);
    ctx.fillStyle = PALETTE.white;
    ctx.font = 'bold 20px Georgia, "Times New Roman", serif';
    ctx.fillText('The salt scatters across the flat. The wind keeps blowing —', VIEW_W / 2, 320);
    ctx.fillText('but the caravan will not cross today.', VIEW_W / 2, 348);
  }
  const finalScore = state.finalScore !== undefined ? state.finalScore : state.score;
  ctx.fillStyle = PALETTE.cream;
  ctx.font = '17px "Trebuchet MS", Verdana, sans-serif';
  const lines = won
    ? [
      `FINAL SCORE:  ${finalScore}`,
      `Raiders beaten:  ${state.kills}`,
      `Towers built:  ${state.towersBuilt}`,
      `Salt earned:  ${state.saltEarned}`,
      `Heart-cart health left:  ${state.heart}/${state.maxHeart}`,
    ]
    : [
      `Waves survived:  ${state.wavesCleared} / ${state.totalWaves}`,
      `FINAL SCORE:  ${finalScore}`,
      `Raiders beaten:  ${state.kills}`,
      `Towers built:  ${state.towersBuilt}`,
    ];
  lines.forEach((line, i) => {
    ctx.fillText(line, VIEW_W / 2, 404 + i * 30);
  });
  if (!won) {
    ctx.fillStyle = PALETTE.gold;
    ctx.font = '15px Georgia, "Times New Roman", serif';
    ctx.fillText('Tip: barricades buy time, and a wind charge turns your sails onto the pack.', VIEW_W / 2, 404 + lines.length * 30 + 8);
  }
  ctx.fillStyle = PALETTE.red;
  ctx.font = 'bold 22px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText(won ? 'PRESS R TO PLAY AGAIN' : 'PRESS R TO TRY AGAIN', VIEW_W / 2, 404 + lines.length * 30 + 52);
  ctx.textAlign = 'left';
}

export function draw(ctx, state) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  if (state.phase === 'title') {
    drawTitle(ctx, state);
    return;
  }
  drawField(ctx, state);
  drawHud(ctx, state);
  drawBuildBar(ctx, state);
  if (state.paused && state.phase === 'playing') {
    ctx.fillStyle = 'rgba(46,28,14,0.55)';
    ctx.fillRect(0, FIELD_TOP, VIEW_W, FIELD_BOTTOM - FIELD_TOP);
    ctx.fillStyle = PALETTE.cream;
    ctx.font = 'bold 34px Georgia, "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED — press P to resume', VIEW_W / 2, 330);
    ctx.textAlign = 'left';
  }
  if (state.phase === 'won') drawEndScreen(ctx, state, true);
  if (state.phase === 'lost') drawEndScreen(ctx, state, false);
}
