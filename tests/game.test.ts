import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GAME_WIDTH,
  createGame,
  fallSpeed,
  hits,
  score,
  spawnDelay,
  step,
} from '../app/shared/game.js';

const never = () => 0.5;

test('le vaisseau part au centre et reste dans le cadre', () => {
  assert.equal(createGame().ship.x, (GAME_WIDTH - createGame().ship.w) / 2);
  // Les obstacles tombent du côté opposé, donc la partie ne s'arrête pas avant la butée.
  let left = createGame();
  for (let i = 0; i < 20; i++) left = step(left, 0.05, -1, () => 0.999);
  assert.equal(left.over, false);
  assert.equal(left.ship.x, 0);
  let right = createGame();
  for (let i = 0; i < 20; i++) right = step(right, 0.05, 1, () => 0);
  assert.equal(right.over, false);
  assert.equal(right.ship.x, GAME_WIDTH - right.ship.w);
});

test('sans direction, le vaisseau ne bouge pas', () => {
  const game = step(createGame(), 0.1, 0, never);
  assert.equal(game.ship.x, createGame().ship.x);
});

test('une collision termine la partie et la fige', () => {
  const game = createGame();
  game.obstacles.push({
    x: game.ship.x,
    y: game.ship.y - 10,
    w: 30,
    h: 28,
  });
  const next = step(game, 0.016, 0, never);
  assert.equal(next.over, true);
  assert.equal(step(next, 1, 1, never), next);
});

test('un obstacle loin du vaisseau ne touche pas', () => {
  const ship = createGame().ship;
  assert.equal(hits(ship, { x: 0, y: 0, w: 30, h: 28 }), false);
  assert.equal(hits(ship, { ...ship }), true);
});

test('la vitesse monte puis se plafonne, le mode calme la réduit', () => {
  assert.ok(fallSpeed(10) > fallSpeed(0));
  assert.equal(fallSpeed(1000), 320);
  assert.ok(fallSpeed(5, 0.6) < fallSpeed(5));
  assert.ok(spawnDelay(30) < spawnDelay(0));
  assert.equal(spawnDelay(1000), 0.35);
});

test('des obstacles apparaissent, descendent puis sortent du cadre', () => {
  let game = createGame();
  game = step(game, 0.7, 0, never);
  assert.equal(game.obstacles.length, 1);
  const first = game.obstacles[0];
  game = step(game, 0.05, 0, never);
  assert.ok(game.obstacles[0].y > first.y);
  // On écarte le vaisseau pour qu'aucun obstacle (centré) ne le touche.
  let moved = game;
  for (let i = 0; i < 20; i++) moved = step(moved, 0.05, -1, never);
  for (let i = 0; i < 400 && !moved.over; i++)
    moved = step(moved, 0.05, -1, never);
  assert.ok(moved.obstacles.every((o) => o.y < 420));
});

test('le score suit le temps de survie', () => {
  let game = createGame();
  for (let i = 0; i < 20; i++) game = step(game, 0.1, -1, never);
  assert.equal(score(game), Math.floor(game.elapsed * 10));
  assert.ok(score(game) >= 19);
});
