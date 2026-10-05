// This file is appended inside a private copy of the original game module.
// The original two modes do not import it and keep their original objects.
const EXPEDITION_SAVE = 'dopravacek.medvedi-vyprava.v1';
const EXPEDITION_COST = Object.freeze({
  road: 3, bridgeRoad: 8, rail: 5, bridgeRail: 11,
  stop: 40, station: 70, lamp: 8, pole: 12,
  bus: 100, busDouble: 170, truck: 110, garbageTruck: 130,
  tractor: 65, locoSteam: 180, locoDiesel: 230, wagon: 45,
  service: 25, demolish: 2,
});
const EXPEDITION_REWARD = Object.freeze({passengers: 4, coal: 2, wood: 3, grain: 3, flour: 4});

function expeditionInitial(world) {
  return {
    coins: 480, debt: 0, earned: 0, spent: 0,
    delivered: {passengers: 0, coal: 0, wood: 0, grain: 0, flour: 0},
    woodAtSawmill: 0, poles: [], fuel: {},
    food: world.towns.map(() => 0),
    lastGarbage: world.towns.map(() => -1),
    lastPassengerDelivery: world.towns.map(() => -1),
    powered: world.towns.map(() => false),
    lastTick: -1,
  };
}
function expeditionReady(world) {
  if (!world.challenge) world.challenge = expeditionInitial(world);
  const s = world.challenge;
  s.delivered.flour ??= 0;
  s.food ??= world.towns.map(() => 0);
  s.lastGarbage ??= world.towns.map(() => -1);
  s.lastPassengerDelivery ??= world.towns.map(() => -1);
  s.powered ??= world.towns.map(() => false);
  s.poles ??= [];
  s.fuel ??= {};
  world.delivered.flour ??= 0;
  for (const station of world.stations) station.stock.flour ??= 0;
  return s;
}
function expeditionCredit(world, amount) {
  const s = expeditionReady(world);
  const payment = Math.min(s.debt, Math.floor(amount * 0.3));
  s.debt -= payment;
  s.coins += amount - payment;
  s.earned += amount;
}
function expeditionCost(world, action, result) {
  const p = EXPEDITION_COST;
  switch (action.type) {
    case 'buildRoad': return [...result.plan.masks].reduce((sum, [index, mask]) => {
      const tile = world.tiles[index];
      return sum + ((tile.roadMask | mask) === tile.roadMask ? 0 : tile.terrain === 'water' ? p.bridgeRoad : p.road);
    }, 0);
    case 'buildRail': return [...result.plan.pieces].reduce((sum, [index, mask]) => {
      const tile = world.tiles[index];
      return sum + ((tile.railMask | mask) === tile.railMask ? 0 : tile.terrain === 'water' ? p.bridgeRail : p.rail);
    }, 0);
    case 'buildStop': return p.stop;
    case 'buildStation': return p.station + expeditionCost(world, {type: 'buildRail'}, {plan: result.plan.rails});
    case 'buildLamps': return result.plan.tiles.length * p.lamp;
    case 'buildPole': return p.pole;
    case 'demolish': return result.plan.targets.length * p.demolish;
    case 'addVehicle': return p[action.modelId] ?? 100;
    case 'addGarbageTruck': return p.garbageTruck;
    case 'addTractor': return p.tractor;
    case 'addTrain': return (p[action.cars[0]] ?? p.locoSteam) + (action.cars.length - 1) * p.wagon;
    case 'callService': return p.service;
    default: return 0;
  }
}
function expeditionCanPlacePole(world, tile) {
  const t = w(world, tile.x, tile.y);
  if (!t || !O(t) || t.tree || t.townId !== null) return false;
  if (expeditionReady(world).poles.some(p => p.x === tile.x && p.y === tile.y)) return false;
  return expeditionNearbyPole(world, tile) || world.industries.some(industry =>
    industry.type === 'powerPlant' && expeditionNearArea(tile, industry.origin, industry.size, 3));
}
function expeditionNearbyPole(world, tile) {
  return expeditionReady(world).poles.some(p => d(p, tile) <= 6);
}
function expeditionNearArea(tile, origin, size, radius) {
  const dx = Math.max(origin.x - tile.x, 0, tile.x - (origin.x + size.x - 1));
  const dy = Math.max(origin.y - tile.y, 0, tile.y - (origin.y + size.y - 1));
  return Math.max(dx, dy) <= radius;
}
function expeditionPlantAt(world, station, type) {
  return world.industries.find(industry => industry.type === type && fr(station, industry));
}
function expeditionPower(world) {
  const s = expeditionReady(world);
  const visited = new Set();
  const frontier = [];
  for (const plant of world.industries) {
    if (plant.type !== 'powerPlant' || (s.fuel[plant.id] ?? 0) <= 0) continue;
    s.poles.forEach((pole, index) => {
      if (expeditionNearArea(pole, plant.origin, plant.size, 3) && !visited.has(index)) {
        visited.add(index); frontier.push(index);
      }
    });
  }
  for (let head = 0; head < frontier.length; head++) {
    const pole = s.poles[frontier[head]];
    s.poles.forEach((other, index) => {
      if (!visited.has(index) && d(pole, other) <= 6) {
        visited.add(index); frontier.push(index);
      }
    });
  }
  const next = world.towns.map(town => town.houseIds.some(id => {
    const house = world.houses[id];
    return house && [...visited].some(index => d(house.tile, s.poles[index]) <= 3);
  }));
  s.powered = next;
  return next;
}
function expeditionTownPowered(world, townId) {
  return townId !== null && !!world.challenge?.powered?.[townId];
}
function expeditionPoweredTile(world, x, y) {
  const tile = w(world, x, y);
  if (tile?.townId !== null && tile?.townId !== undefined)
    return expeditionTownPowered(world, tile.townId);
  return world.towns.some(town => expeditionTownPowered(world, town.id) &&
    town.houseIds.some(id => world.houses[id] && d({x, y}, world.houses[id].tile) <= 6));
}
function expeditionCanGrow(world, town) {
  const s = expeditionReady(world);
  const deliveredAt = s.lastPassengerDelivery[town.id] ?? -1;
  if (deliveredAt < 0 || world.tick - deliveredAt > t(60)) return false;
  if (!s.powered[town.id]) return false;
  if (world.emergencies.some(emergency => emergency.townId === town.id)) return false;
  const population = D(world, town);
  if (population >= 600 && (s.food[town.id] ?? 0) < 1) return false;
  const collectedAt = s.lastGarbage[town.id] ?? -1;
  if (population >= 1000 && (collectedAt < 0 || world.tick - collectedAt > t(120))) return false;
  return true;
}
function expeditionTick(game) {
  const world = game.sim.world, s = expeditionReady(world);
  const second = Math.floor(world.tick / e.time.ticksPerSecond);
  if (second <= s.lastTick) return;
  s.lastTick = second;
  for (const plant of world.industries) {
    if (plant.type === 'powerPlant' && s.fuel[plant.id] > 0) s.fuel[plant.id]--;
  }
  if (second % 10 === 0) world.towns.forEach(town => {
    const used = Math.max(1, Math.ceil(D(world, town) / 100));
    s.food[town.id] = Math.max(0, (s.food[town.id] ?? 0) - used);
  });
  const previous = [...s.powered];
  expeditionPower(world);
  if (previous.some((on, id) => on !== s.powered[id])) {
    for (const house of world.houses) game.view.nightLights.markDirty(house.tile.x, house.tile.y);
    world.tiles.forEach((tile, index) => {
      if (tile.lamp) game.view.nightLights.markDirty(index % world.size, Math.floor(index / world.size));
    });
    game.view.nightLights.flush();
  }
}
function expeditionDelivered(world, vehicle, station, cargo) {
  const s = expeditionReady(world);
  s.delivered[cargo] = (s.delivered[cargo] ?? 0) + 1;
  expeditionCredit(world, EXPEDITION_REWARD[cargo] ?? 0);
  if (cargo === 'passengers') {
    for (const townId of qo(world, station)) s.lastPassengerDelivery[townId] = world.tick;
  } else if (cargo === 'coal') {
    const plant = expeditionPlantAt(world, station, 'powerPlant');
    if (plant) s.fuel[plant.id] = Math.min(600, (s.fuel[plant.id] ?? 0) + 8);
  } else if (cargo === 'wood' && expeditionPlantAt(world, station, 'sawmill')) {
    s.woodAtSawmill++;
  } else if (cargo === 'grain' && expeditionPlantAt(world, station, 'mill')) {
    station.stock.flour = Math.min(e.cargo.maxStationStock, (station.stock.flour ?? 0) + 1);
  } else if (cargo === 'flour') {
    const towns = qo(world, station);
    towns.sort((a, b) => (s.food[a] ?? 0) - (s.food[b] ?? 0));
    if (towns.length) s.food[towns[0]] = Math.min(120, (s.food[towns[0]] ?? 0) + 1);
  }
}

// Only the copied module receives these adaptations. No old save keys or
// original game state are referenced here.
e.save.keys = {free: EXPEDITION_SAVE, quests: `${EXPEDITION_SAVE}.unused`};
e.save.lastKey = `${EXPEDITION_SAVE}.last`;
e.save.testKeys = {free: `${EXPEDITION_SAVE}.test`, quests: `${EXPEDITION_SAVE}.test.unused`};
e.save.testLastKey = `${EXPEDITION_SAVE}.test.last`;
e.vehicles.catalog.truck.cargo.push('flour');
k.cargo.flour = 'mouka';
Gb.flour = Gb.grain;
k.tools.power = {label: 'Stožár', tip: 'Postavit elektrický stožár', hint: 'Klikni na trávu poblíž elektrárny nebo vedení.'};
const expeditionOldStock = Ne;
Ne = function () { return {...expeditionOldStock(), flour: 0}; };
je.push('flour');
const expeditionOldCatchment = Be;
Be = function (world, tiles) {
  const result = expeditionOldCatchment(world, tiles);
  const station = {tiles};
  if (world.houses.some(house => dr(station, house.tile)) && !result.accepts.includes('flour'))
    result.accepts.push('flour');
  if (world.industries.some(industry => industry.type === 'mill' && fr(station, industry)))
    result.supplies.push('flour');
  return result;
};
const expeditionOldUnload = Uo;
Uo = function (world, vehicle, station, cargo) {
  expeditionOldUnload(world, vehicle, station, cargo);
  if (world.challenge) expeditionDelivered(world, vehicle, station, cargo);
};
const expeditionOldServed = _;
_ = function (world, town) {
  return expeditionOldServed(world, town) && (!world.challenge || expeditionCanGrow(world, town));
};
const expeditionOldSave = WI;
WI = function (world) {
  const data = expeditionOldSave(world);
  data.challenge = world.challenge;
  return data;
};
const expeditionOldLoad = GI;
GI = function (data) {
  const world = expeditionOldLoad(data);
  world.challenge = data.challenge ?? expeditionInitial(world);
  expeditionReady(world);
  expeditionPower(world);
  return world;
};
const expeditionOldMessage = Gx;
Gx = function (error) {
  if (error === 'noCoins') return 'Na to zatím nemáš dost medvědích mincí.';
  if (error === 'needWood') return 'Nejdřív dovez 20 kusů dřeva do pily.';
  if (error === 'badPole') return 'Stožár patří na volnou souš poblíž elektrárny nebo dalšího stožáru.';
  return expeditionOldMessage(error);
};
const expeditionOldExecute = oc.prototype.execute;
oc.prototype.execute = function (action) {
  const world = this.world;
  const s = expeditionReady(world);
  if (action.type === 'buildPole') {
    if (!expeditionCanPlacePole(world, action.tile)) return {type: 'buildPole', ok: false, error: 'badPole'};
    if (s.coins < EXPEDITION_COST.pole) return {type: 'buildPole', ok: false, error: 'noCoins'};
    s.coins -= EXPEDITION_COST.pole;
    s.spent += EXPEDITION_COST.pole;
    s.poles.push({...action.tile});
    return {type: 'buildPole', ok: true, error: null};
  }
  if (action.type === 'removePole') {
    const index = s.poles.findIndex(p => p.x === action.tile.x && p.y === action.tile.y);
    if (index < 0) return {type: 'removePole', ok: false, error: 'badPole'};
    if (s.coins < EXPEDITION_COST.demolish) return {type: 'removePole', ok: false, error: 'noCoins'};
    s.coins -= EXPEDITION_COST.demolish;
    s.spent += EXPEDITION_COST.demolish;
    s.poles.splice(index, 1);
    return {type: 'removePole', ok: true, error: null};
  }
  if (['buildRail', 'buildStation', 'addTrain'].includes(action.type) && s.woodAtSawmill < 20)
    return {type: action.type, ok: false, error: 'needWood'};
  const planned = no(world, action);
  if (!planned.ok) return planned;
  const cost = expeditionCost(world, action, planned);
  if (cost > s.coins) return {...planned, ok: false, error: 'noCoins'};
  const result = expeditionOldExecute.call(this, action);
  if (result.ok) {
    s.coins -= cost;
    s.spent += cost;
  }
  return result;
};
const expeditionOldLoader = _L;
_L = function (params, action, storage) {
  if (params.has('new')) {
    storage.clear('free');
    params.delete('new');
    window.history.replaceState(null, '', `${window.location.pathname}${params.size ? `?${params}` : ''}`);
  }
  const saved = storage.load('free');
  if (saved.kind === 'ok') {
    expeditionReady(saved.world);
    expeditionPower(saved.world);
    return {world: saved.world, view: saved.view, saved: true, play: true, intro: false, note: null};
  }
  const seed = Math.floor(Math.random() * 2 ** 31);
  const world = $n(seed, 'free');
  expeditionReady(world);
  return {world, view: null, saved: false, play: true, intro: false, note: null};
};

class ExpeditionPowerTool {
  id = 'power';
  panWithPrimary = true;
  constructor(ctx) { this.ctx = ctx; }
  deactivate() { this.leave(); }
  leave() { this.ctx.view.preview.showTiles([]); this.ctx.bubble.hide(); }
  hover(x, y) {
    const tile = $x(this.ctx, x, y);
    if (!tile) return this.leave();
    const exists = expeditionReady(this.ctx.sim.world).poles.some(p => p.x === tile.x && p.y === tile.y);
    const ok = expeditionCanPlacePole(this.ctx.sim.world, tile);
    this.ctx.view.preview.showTiles([{tile, tone: ok || exists ? 'ok' : 'bad'}]);
    this.ctx.bubble.show(x, y, {ok: ok || exists, message: exists ? `Odstranit stožár: ${EXPEDITION_COST.demolish} mince` : ok ? `Stožár: ${EXPEDITION_COST.pole} mincí` : Gx('badPole')});
  }
  click(x, y, button) {
    if (button !== 0) return;
    const tile = $x(this.ctx, x, y);
    if (!tile) return;
    const exists = expeditionReady(this.ctx.sim.world).poles.some(p => p.x === tile.x && p.y === tile.y);
    const result = this.ctx.sim.execute({type: exists ? 'removePole' : 'buildPole', tile});
    if (!result.ok) this.ctx.toasts.show(Gx(result.error));
    else this.ctx.sfx.play('pop');
    this.hover(x, y);
  }
}
const expeditionOldToolbar = Tw;
Tw = function (ctx, root) {
  const tools = expeditionOldToolbar(ctx, root);
  tools.controller.tools.power = new ExpeditionPowerTool(ctx);
  return tools;
};

class ExpeditionGame extends AI {
  constructor(...args) {
    super(...args);
    this.expeditionHud = document.createElement('aside');
    this.expeditionHud.className = 'expedition-hud';
    this.expeditionHud.innerHTML = `<div class="expedition-line"><strong>🐻 Medvědí výprava</strong><strong data-coins></strong></div>
      <div data-debt></div><div data-chain></div>
      <label>Sleduj obec: <select data-town-select></select></label><div data-town></div><div data-needs></div><div data-freight></div>
      <div class="expedition-actions"><button type="button" data-power>⚡ Stožár · 12</button>
      <button type="button" data-loan>🪙 Půjčka +250</button><button type="button" data-home>↩ Menu</button></div>
      <details class="expedition-rules"><summary>Ceník a pravidla</summary>
      <p>Silnice 3, most 8, zastávka 40, autobus 100, náklaďák 110, lampa 8, stožár 12.</p>
      <p>Dovez 20 dřeva do pily. Pak můžeš stavět koleje (5), nádraží (70) a vlaky (mašinka od 180, vagón 45).</p>
      <p>Uhlí v elektrárně vydrží 8 sekund za kus. Stožáry na souši propoj po nejvýše 6 políčkách až k obci.</p>
      <p>Obilí dovez do mlýna. Tam vznikne mouka, kterou náklaďák rozveze obcím. Nad 600 obyvatel potřebují jídlo, nad 1000 také svoz.</p>
      <p>Za člověka dostaneš 4 mince, uhlí 2, dřevo a obilí 3, mouku 4. Půjčka přidá 250 mincí a dluh 300.</p></details>`;
    this.ui.append(this.expeditionHud);
    this.selectedTownId = this.sim.world.startTownId;
    const townSelect = this.expeditionHud.querySelector('[data-town-select]');
    for (const town of this.sim.world.towns) townSelect.add(new Option(town.name, town.id));
    townSelect.value = String(this.selectedTownId);
    townSelect.addEventListener('change', () => { this.selectedTownId = Number(townSelect.value); this.expeditionUpdate(); });
    for (const [id, price] of Object.entries({road: 3, stop: 40, lamp: 8, rail: 5, station: 70, newCar: 100, buildTrain: 225, demolish: 2})) {
      const button = this.tools.toolbar.buttons.get(id);
      if (button) button.dataset.tip += ` · od ${price} mincí`;
    }
    this.expeditionHud.querySelector('[data-power]').addEventListener('click', () =>
      this.tools.controller.select(this.tools.controller.activeId === 'power' ? 'hand' : 'power'));
    this.expeditionHud.querySelector('[data-loan]').addEventListener('click', () => {
      if (!confirm('Půjčíš si 250 mincí a z dalších tržeb splatíš 300. Chceš pokračovat?')) return;
      const s = expeditionReady(this.sim.world);
      s.coins += 250; s.debt += 300;
      this.ctx.toasts.show('Půjčka: +250 mincí, splatíš 300 z dalších tržeb.');
      this.save(false);
      this.expeditionUpdate();
    });
    this.expeditionHud.querySelector('[data-home]').addEventListener('click', () => this.goHome());
    this.expeditionCanvas = document.createElement('canvas');
    this.expeditionCanvas.className = 'expedition-wires';
    this.app.append(this.expeditionCanvas);
    this.expeditionPosition = new F();
    this.sim.events.on('binEmptied', ({binId}) => {
      const bin = this.sim.world.bins[binId];
      if (!bin) return;
      expeditionReady(this.sim.world).lastGarbage[bin.townId] = this.sim.world.tick;
      expeditionCredit(this.sim.world, 3);
    });
    this.expeditionUpdate();
  }
  frame(delta, elapsed, realDelta) {
    expeditionTick(this);
    super.frame(delta, elapsed, realDelta);
    expeditionTick(this);
    this.expeditionUpdate();
    this.expeditionDraw();
  }
  expeditionUpdate() {
    const world = this.sim.world, s = expeditionReady(world), hud = this.expeditionHud;
    hud.querySelector('[data-coins]').textContent = `${s.coins} 🪙`;
    hud.querySelector('[data-debt]').textContent = s.debt ? `Dluh: ${s.debt} 🪙 (30 % z tržeb)` : 'Bez dluhu';
    hud.querySelector('[data-chain]').textContent = `Železnice: ${s.woodAtSawmill >= 20 ? 'odemčena' : `${s.woodAtSawmill}/20 dřeva u pily`}`;
    const railReady = s.woodAtSawmill >= 20;
    for (const id of ['rail', 'station', 'buildTrain']) {
      const button = this.tools.toolbar.buttons.get(id);
      if (button) { button.disabled = !railReady; button.title = railReady ? '' : 'Nejdřív dovez 20 dřeva do pily'; }
    }
    const town = world.towns[this.selectedTownId] ?? world.towns[world.startTownId];
    const power = !!s.powered[town.id], food = s.food[town.id] ?? 0;
    const collectedAt = s.lastGarbage[town.id] ?? -1;
    const garbage = collectedAt >= 0 && world.tick - collectedAt <= t(120);
    hud.querySelector('[data-town]').textContent = `${town.name}: ${D(world, town)} obyvatel · ${power ? '⚡ proud' : '⚫ bez proudu'} · 🍞 ${food} · ${garbage ? '♻ svoz' : '○ bez svozu'}`;
    const reasons = [];
    const deliveredAt = s.lastPassengerDelivery[town.id] ?? -1;
    if (deliveredAt < 0 || world.tick - deliveredAt > t(60)) reasons.push('dovezené cestující');
    if (!power) reasons.push('uhlí, elektrárnu a vedení');
    if (D(world, town) >= 600 && food < 1) reasons.push('mouku');
    if (D(world, town) >= 1000 && !garbage) reasons.push('popeláře');
    if (world.emergencies.some(item => item.townId === town.id)) reasons.push('vyřešit pomoc v obci');
    hud.querySelector('[data-needs]').textContent = reasons.length ? `Pro další růst chybí: ${reasons.join(', ')}.` : 'Podmínky pro růst splněny.';
    hud.querySelector('[data-freight]').textContent = `Převezeno: ${s.delivered.passengers} lidí · ${s.delivered.coal} uhlí · ${s.delivered.wood} dřeva · ${s.delivered.grain} obilí · ${s.delivered.flour} mouky`;
    hud.querySelector('[data-power]').classList.toggle('active', this.tools.controller.activeId === 'power');
  }
  expeditionDraw() {
    const canvas = this.expeditionCanvas;
    if (canvas.width !== this.size.width || canvas.height !== this.size.height) {
      canvas.width = this.size.width; canvas.height = this.size.height;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const world = this.sim.world, s = expeditionReady(world);
    const project = (x, y) => {
      this.expeditionPosition.set(x + 0.5, 0.55, y + 0.5).project(this.camera.camera);
      return {x: (this.expeditionPosition.x + 1) * canvas.width / 2,
        y: (1 - this.expeditionPosition.y) * canvas.height / 2};
    };
    ctx.lineWidth = 2.5;
    for (const [index, pole] of s.poles.entries()) {
      const from = project(pole.x, pole.y);
      const earlier = s.poles.slice(0, index).filter(other => d(pole, other) <= 6)
        .sort((a, b) => d(pole, a) - d(pole, b))[0];
      let to = earlier ? project(earlier.x, earlier.y) : null;
      if (!to) {
        const plant = world.industries.find(i => i.type === 'powerPlant' && expeditionNearArea(pole, i.origin, i.size, 3));
        if (plant) to = project(plant.origin.x + plant.size.x / 2, plant.origin.y + plant.size.y / 2);
      }
      if (to) {
        ctx.strokeStyle = '#f8c344';
        ctx.beginPath(); ctx.moveTo(from.x, from.y - 13); ctx.lineTo(to.x, to.y - 13); ctx.stroke();
      }
      ctx.fillStyle = '#fff4a7'; ctx.strokeStyle = '#735733';
      ctx.beginPath(); ctx.moveTo(from.x, from.y - 19); ctx.lineTo(from.x - 8, from.y + 8);
      ctx.lineTo(from.x + 8, from.y + 8); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#735733'; ctx.fillRect(from.x - 9, from.y - 17, 18, 3);
    }
  }
  goHome() {
    this.save(false);
    if (window.parent !== window)
      window.parent.postMessage({type: 'medvedi-vyprava-close'}, location.origin);
    else location.href = '../index.html';
  }
}
AI = ExpeditionGame;
