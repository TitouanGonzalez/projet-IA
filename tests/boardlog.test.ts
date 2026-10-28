import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AMBIENT,
  AMBIENT_MAX,
  AMBIENT_MIN,
  EVENTS,
  dropLine,
  nextDelay,
  pickAmbient,
  pushLine,
  type LogSection,
} from '../app/shared/boardlog.js';

test('journal : chaque section a au moins deux phrases, toutes uniques', () => {
  const all: string[] = [];
  for (const [section, lines] of Object.entries(AMBIENT)) {
    assert.ok(lines.length >= 2, section);
    all.push(...lines);
  }
  assert.equal(new Set(all).size, all.length);
});

test('journal : aucun caractère interdit dans les phrases', () => {
  const texts = [...Object.values(AMBIENT).flat(), ...Object.values(EVENTS)];
  for (const t of texts) assert.doesNotMatch(t, /[–—«»→ ]/, t);
});

test('journal : le délai reste entre les bornes', () => {
  assert.equal(
    nextDelay(() => 0),
    AMBIENT_MIN,
  );
  assert.equal(
    nextDelay(() => 1),
    AMBIENT_MAX,
  );
  for (let i = 0; i < 100; i++) {
    const d = nextDelay(Math.random);
    assert.ok(d >= AMBIENT_MIN && d <= AMBIENT_MAX);
  }
});

test('journal : une phrase récente n’est pas répétée tant qu’il en reste d’autres', () => {
  const section: LogSection = 'dossiers';
  const pool = AMBIENT[section];
  const recent = pool.slice(0, pool.length - 1);
  for (let i = 0; i < 50; i++)
    assert.equal(
      pickAmbient(section, recent, Math.random),
      pool[pool.length - 1],
    );
});

test('journal : quand tout a été dit, on repart de zéro', () => {
  const pool = AMBIENT.terminal;
  const t = pickAmbient('terminal', pool, () => 0);
  assert.ok(pool.includes(t));
});

test('journal : rng à 1 ne sort pas du tableau', () => {
  const t = pickAmbient('accueil', [], () => 0.999999);
  assert.ok(AMBIENT.accueil.includes(t));
});

test('journal : trois lignes au plus, les plus récentes gardées', () => {
  let lines = pushLine([], 'a', 1);
  lines = pushLine(lines, 'b', 2);
  lines = pushLine(lines, 'c', 3);
  lines = pushLine(lines, 'd', 4);
  assert.deepEqual(
    lines.map((l) => l.text),
    ['b', 'c', 'd'],
  );
  assert.deepEqual(
    dropLine(lines, 3).map((l) => l.id),
    [2, 4],
  );
});
