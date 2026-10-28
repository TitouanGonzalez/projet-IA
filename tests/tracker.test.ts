import test from 'node:test';
import assert from 'node:assert/strict';
import {
  APEX,
  HALF,
  RADIUS,
  beepEvery,
  beepPitch,
  classify,
  clampToFan,
  insideFan,
  makeContacts,
  meters,
  nearest,
  reveal,
  stepContacts,
  sweepAngle,
  toXY,
} from '../app/shared/tracker.js';

const seeded = (seed = 7) => {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
};

test('le sommet est au bas de l’éventail et l’axe monte tout droit', () => {
  const p = toXY(1, 0);
  assert.equal(Math.round(p.x), APEX.x);
  assert.equal(Math.round(p.y), APEX.y - RADIUS);
  assert.equal(insideFan({ x: APEX.x, y: APEX.y - 100 }), true);
  assert.equal(insideFan({ x: APEX.x, y: APEX.y + 20 }), false);
  assert.equal(insideFan({ x: APEX.x + 390, y: APEX.y - 20 }), false);
});

test('la sonde est ramenée dans l’éventail', () => {
  const p = clampToFan({ x: 5000, y: 10 });
  assert.equal(insideFan({ x: p.x - 0.001, y: p.y + 0.001 }), true);
  const q = clampToFan({ x: APEX.x, y: APEX.y + 300 });
  assert.ok(q.y <= APEX.y);
});

test('les contacts restent dans l’éventail après de longues dérives', () => {
  const rng = seeded();
  let cs = makeContacts(rng, 4);
  assert.equal(cs.length, 4);
  for (let i = 0; i < 4000; i++) cs = stepContacts(cs, 0.05, rng);
  for (const c of cs) {
    assert.ok(c.r >= 0.12 && c.r <= 0.95);
    assert.ok(Math.abs(c.a) <= HALF);
  }
});

test('le balayage traverse tout l’éventail', () => {
  let min = 0;
  let max = 0;
  for (let t = 0; t < 5; t += 0.01) {
    const a = sweepAngle(t);
    min = Math.min(min, a);
    max = Math.max(max, a);
  }
  assert.ok(max > HALF * 0.99);
  assert.ok(min < -HALF * 0.99);
});

test('un contact apparaît quand le balayage passe, ou pendant une impulsion', () => {
  const cs = [
    { r: 0.5, a: 0.2, vr: 0, va: 0, seen: 0 },
    { r: 0.5, a: -0.5, vr: 0, va: 0, seen: 0 },
  ];
  const swept = reveal(cs, 0.1, 0.3, false);
  assert.equal(swept[0].seen, 1);
  assert.equal(swept[1].seen, 0);
  assert.equal(
    reveal(cs, 0, 0, true).every((c) => c.seen === 1),
    true,
  );
});

test('un contact visible s’estompe avec le temps', () => {
  const rng = seeded(3);
  let cs = [{ r: 0.5, a: 0, vr: 0, va: 0, seen: 1 }];
  for (let i = 0; i < 100; i++) cs = stepContacts(cs, 0.05, rng);
  assert.ok(cs[0].seen < 0.05);
});

test('le contact le plus proche et la distance en mètres', () => {
  const cs = [
    { r: 0.5, a: 0, vr: 0, va: 0, seen: 0 },
    { r: 0.9, a: 0.4, vr: 0, va: 0, seen: 0 },
  ];
  const on = toXY(0.5, 0);
  assert.equal(meters(on, cs[0]), 0);
  const n = nearest(cs, on)!;
  assert.equal(n.index, 0);
  assert.equal(nearest([], on), null);
  assert.ok(meters({ x: on.x + RADIUS, y: on.y }, cs[0]) > 29);
});

test('le bip accélère et monte quand on s’approche', () => {
  assert.ok(beepEvery(1) < beepEvery(20));
  assert.equal(beepEvery(0), 0.12);
  assert.equal(beepEvery(500), 1.6);
  assert.ok(beepPitch(1) > beepPitch(20));
  assert.equal(classify(2), 'close');
  assert.equal(classify(7), 'suspect');
  assert.equal(classify(25), 'far');
});
