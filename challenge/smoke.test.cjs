const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// Evaluate the exact browser bundle without starting WebGL. This verifies the
// separate simulation, prices, supply chain, electricity and save roundtrip.
const source = fs.readFileSync(__dirname + '/game.js', 'utf8').replace(/vL\(\);\s*$/, '');
const context = vm.createContext({
  document: {createElement: () => ({relList: {supports: () => true}})},
  window: {}, console, URLSearchParams, performance: {now: () => 0}, setTimeout,
});
vm.runInContext(source, context, {timeout: 10000});
const run = code => vm.runInContext(code, context, {timeout: 10000});

run(`
  var testWorld = b(42, 24);
  testWorld.mode = 'free';
  testWorld.towns = [{id: 0, name: 'Medvědín', kind: 'town', center: {x: 8, y: 8},
    houseIds: [0], lastServedTick: 0}];
  testWorld.houses = [{id: 0, townId: 0, tile: {x: 8, y: 8}, facing: 0,
    level: 1, residents: 300}];
  T(testWorld, 8, 8).houseId = 0;
  testWorld.industries = [
    {id: 0, type: 'powerPlant', origin: {x: 4, y: 4}, size: {x: 3, y: 3}, produces: null, accepts: 'coal'},
    {id: 1, type: 'sawmill', origin: {x: 15, y: 4}, size: {x: 3, y: 3}, produces: null, accepts: 'wood'},
    {id: 2, type: 'mill', origin: {x: 15, y: 14}, size: {x: 3, y: 3}, produces: null, accepts: 'grain'},
  ];
  const state = expeditionReady(testWorld);
  var testSim = new oc(testWorld);
`);
assert.equal(run('testWorld.challenge.coins'), 480);
assert.equal(run('_(testWorld, testWorld.towns[0])'), false, 'travel alone must not grow the city');

run(`testWorld.stations.push({id:0, kind:'stop', tiles:[{x:8,y:9}], stock:Ne(), orientation:'NS'});`);
run(`T(testWorld, 8, 9).roadMask = 5;`);
assert.equal(run(`testSim.execute({type:'buildStop', tile:{x:8,y:9}}).ok`), true);
assert.equal(run('testWorld.challenge.coins'), 440, 'stop costs 40');
run('testWorld.challenge.coins = 0');
run('T(testWorld, 9, 9).roadMask = 5');
assert.equal(run(`testSim.execute({type:'buildStop', tile:{x:9,y:9}}).error`), 'noCoins');
assert.equal(run('testWorld.stations.length'), 2, 'rejected transaction creates nothing');

run('testWorld.challenge.coins = 400');
run(`expeditionDelivered(testWorld, {}, {id: 7, tiles:[{x:8,y:9}], stock:Ne()}, 'passengers')`);
assert.equal(run(`testSim.execute({type:'buildRail',path:[{x:19,y:19}]}).error`), 'needWood');
assert.equal(run(`testSim.execute({type:'buildPole',tile:{x:7,y:6}}).ok`), true);
assert.equal(run('testWorld.challenge.coins'), 392);
assert.equal(run('_(testWorld, testWorld.towns[0])'), false, 'unfueled power line stays dark');

run(`
  var powerStop = {id: 3, tiles:[{x:7,y:5}], stock:Ne()};
  expeditionDelivered(testWorld, {}, powerStop, 'coal');
  expeditionPower(testWorld);
`);
assert.equal(run('testWorld.challenge.fuel[0]'), 8);
assert.equal(run('testWorld.challenge.powered[0]'), true);
assert.equal(run('_(testWorld, testWorld.towns[0])'), true);
run(`testWorld.challenge.fuel[0] = 0; expeditionPower(testWorld)`);
assert.equal(run('_(testWorld, testWorld.towns[0])'), false, 'blackout stops growth');
run(`testWorld.challenge.fuel[0] = 100; expeditionPower(testWorld); testWorld.houses[0].residents = 600;`);
assert.equal(run('_(testWorld, testWorld.towns[0])'), false, 'larger city needs food');
run('testWorld.challenge.food[0] = 1');
assert.equal(run('_(testWorld, testWorld.towns[0])'), true);
run('testWorld.houses[0].residents = 1000');
assert.equal(run('_(testWorld, testWorld.towns[0])'), false, 'large city needs garbage pickup');
run('testWorld.challenge.lastGarbage[0] = 0');
assert.equal(run('_(testWorld, testWorld.towns[0])'), true);
run('testWorld.emergencies.push({townId: 0})');
assert.equal(run('_(testWorld, testWorld.towns[0])'), false, 'emergency suspends growth');
run('testWorld.emergencies.length = 0');
run('testWorld.challenge.food[0] = 0');

run(`
  var sawmillStop = {id: 4, tiles:[{x:14,y:5}], stock:Ne()};
  for (let i=0;i<20;i++) expeditionDelivered(testWorld, {}, sawmillStop, 'wood');
`);
assert.equal(run('testWorld.challenge.woodAtSawmill'), 20);
assert.notEqual(run(`testSim.execute({type:'buildRail',path:[{x:19,y:19}]}).error`), 'needWood');

run(`
  var millStop = {id: 5, tiles:[{x:14,y:15}], stock:Ne()};
  expeditionDelivered(testWorld, {}, millStop, 'grain');
  var townStop = {id: 6, tiles:[{x:8,y:9}], stock:Ne()};
  expeditionDelivered(testWorld, {}, townStop, 'flour');
`);
assert.equal(run('millStop.stock.flour'), 1, 'grain creates a unit of flour at the mill');
assert.equal(run('testWorld.challenge.food[0]'), 1, 'flour delivery provisions its town');
assert.equal(run('testWorld.challenge.delivered.flour'), 1);

run(`
  var unitVehicle = {cars:[{cargoType:'coal',capacity:12,load:[]}], unloadedHere:Ne(), deliveredTotal:0};
  Uo(testWorld, unitVehicle, powerStop, 'coal');
`);
assert.equal(run('testWorld.delivered.coal'), 1, 'the actual unload hook counts precisely one unit');
assert.equal(run('testWorld.challenge.delivered.coal'), 2);

run('testWorld.challenge.debt = 300; testWorld.challenge.coins = 0; expeditionCredit(testWorld, 100)');
assert.equal(run('testWorld.challenge.coins'), 70);
assert.equal(run('testWorld.challenge.debt'), 270);
run('var restored = GI(WI(testWorld));');
assert.equal(run('restored.challenge.debt'), 270);
assert.equal(run('restored.challenge.poles.length'), 1);
assert.equal(run('restored.challenge.food[0]'), 1);
assert.equal(run('restored.challenge.lastPassengerDelivery[0]'), 0);
assert.equal(run('restored.delivered.flour'), 0, 'unit was counted only by challenge delivery ledger');
assert.equal(run('e.save.keys.free'), 'dopravacek.medvedi-vyprava.v1');
console.log('Medvědí výprava: simulation smoke checks passed');
