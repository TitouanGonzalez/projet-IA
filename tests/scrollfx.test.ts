import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FOCAL,
  RING_SPACING,
  cameraAt,
  clamp01,
  eggFromScroll,
  follow,
  heroProgress,
  ringAlpha,
  ringDistance,
  ringScale,
  scrollSpeed,
  streak,
} from '../app/shared/scrollfx.js';

test('clamp01 borne les valeurs', () => {
  assert.equal(clamp01(-3), 0);
  assert.equal(clamp01(0.4), 0.4);
  assert.equal(clamp01(9), 1);
});

test('follow se rapproche de la cible sans la dépasser', () => {
  assert.equal(follow(0, 10, 0, 5), 0);
  assert.ok(follow(0, 10, 0.1, 5) > 0 && follow(0, 10, 0.1, 5) < 10);
  assert.equal(follow(0, 10, 60, 5), 10);
  assert.equal(follow(10, 0, 60, 5), 0);
});

test('vitesse de défilement : jamais négative, nulle sans temps écoulé', () => {
  assert.equal(scrollSpeed(100, 300, 0.5), 400);
  assert.equal(scrollSpeed(300, 100, 0.5), 400);
  assert.equal(scrollSpeed(100, 300, 0), 0);
  assert.equal(scrollSpeed(100, 300, -1), 0);
  assert.equal(scrollSpeed(100, 300, Number.NaN), 0);
});

test('traînées : de 0 à moins de 1, croissantes', () => {
  assert.equal(streak(0), 0);
  assert.equal(streak(-50), 0);
  let last = 0;
  for (const v of [100, 500, 1500, 5000, 50000]) {
    const s = streak(v);
    assert.ok(s > last && s <= 1, String(v));
    last = s;
  }
});

test('progression de l’accueil', () => {
  assert.equal(heroProgress(0, 800), 0);
  assert.equal(heroProgress(400, 800), 0.5);
  assert.equal(heroProgress(5000, 800), 1);
  assert.equal(heroProgress(-20, 800), 0);
  assert.equal(heroProgress(100, 0), 0);
});

test('œuf : au repos, ouvert et visible à fond ; en bas, effacé', () => {
  const rest = eggFromScroll(0);
  assert.equal(rest.open, 0.1);
  assert.equal(rest.opacity, 1);
  assert.equal(rest.spin, 0);
  const gone = eggFromScroll(1);
  assert.ok(gone.open > 1);
  assert.ok(gone.opacity < 0.1);
  assert.ok(gone.scale > 1);
});

test('œuf : l’ouverture ne diminue jamais quand on descend', () => {
  let last = -1;
  for (let i = 0; i <= 20; i++) {
    const e = eggFromScroll(i / 20);
    assert.ok(e.open >= last);
    assert.ok(e.opacity >= 0 && e.opacity <= 1);
    last = e.open;
  }
  assert.deepEqual(eggFromScroll(-4), eggFromScroll(0));
  assert.deepEqual(eggFromScroll(9), eggFromScroll(1));
});

test('couloir : la distance reste dans [0, longueur[ et se replie', () => {
  const rings = 10;
  for (let k = 0; k < rings; k++)
    for (const cam of [-500, 0, 77, 1399, 1400, 123456]) {
      const d = ringDistance(k, cam, rings);
      assert.ok(d >= 0 && d < rings * RING_SPACING, `${k} ${cam}`);
    }
  // Avancer d'un anneau donne le même ensemble de distances.
  const a = [...Array(rings).keys()]
    .map((k) => ringDistance(k, 30, rings))
    .sort((x, y) => x - y);
  const b = [...Array(rings).keys()]
    .map((k) => ringDistance(k, 30 + RING_SPACING, rings))
    .sort((x, y) => x - y);
  for (let i = 0; i < rings; i++) assert.ok(Math.abs(a[i] - b[i]) < 1e-9);
});

test('couloir : l’échelle diminue avec la distance', () => {
  assert.equal(ringScale(0), 1);
  assert.equal(ringScale(-10), 1);
  assert.equal(ringScale(FOCAL), 0.5);
  assert.ok(ringScale(100) > ringScale(500));
});

test('couloir : opacité entre 0 et 1, nulle tout près et tout au fond', () => {
  const rings = 12;
  assert.equal(ringAlpha(0, rings), 0);
  assert.equal(ringAlpha(rings * RING_SPACING, rings), 0);
  for (let d = 0; d < rings * RING_SPACING; d += 37) {
    const a = ringAlpha(d, rings);
    assert.ok(a >= 0 && a <= 1);
  }
  assert.ok(ringAlpha(RING_SPACING * 2, rings) > 0.3);
});

test('caméra : avance avec le défilement, dérive sauf si les mouvements sont réduits', () => {
  assert.equal(cameraAt(0, 0, false), 0);
  assert.ok(cameraAt(1000, 0, false) > cameraAt(500, 0, false));
  assert.ok(cameraAt(0, 10, false) > 0);
  assert.equal(cameraAt(0, 10, true), 0);
});
