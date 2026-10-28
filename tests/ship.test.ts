import assert from 'node:assert/strict';
import test from 'node:test';
import { ROOMS, exploration, roomById, visit } from '../app/shared/ship.js';
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

test('plan : six salles aux identifiants uniques', () => {
  assert.equal(ROOMS.length, 6);
  assert.equal(new Set(ROOMS.map((r) => r.id)).size, 6);
});

test('plan : chaque salle a un récit, une phrase de journal, et un bouton si elle mène quelque part', () => {
  for (const r of ROOMS) {
    assert.ok(r.story.length > 80, r.id);
    assert.ok(r.log.length > 10, r.id);
    assert.equal(r.target !== null, r.action.length > 0, r.id);
  }
});

test('plan : les quatre parties du site sont chacune reliées à une salle', () => {
  const targets = new Set(ROOMS.map((r) => r.target).filter(Boolean));
  assert.deepEqual([...targets].sort(), [
    'collection',
    'detecteur',
    'dossiers',
    'terminal',
  ]);
});

test('plan : roomById retrouve une salle et refuse un inconnu', () => {
  assert.equal(roomById('cale')?.name, 'La cale');
  assert.equal(roomById('grenier'), undefined);
});

test('plan : visite sans doublon et sans modifier la liste d’origine', () => {
  const start = ['pont'] as const;
  const next = visit(start, 'cale');
  assert.deepEqual(next, ['pont', 'cale']);
  assert.deepEqual(start, ['pont']);
  assert.deepEqual(visit(next, 'cale'), ['pont', 'cale']);
});

test('plan : l’exploration est complète seulement quand tout est visité', () => {
  assert.deepEqual(exploration([]), { done: 0, total: 6, complete: false });
  const all = ROOMS.map((r) => r.id);
  assert.equal(exploration(all).complete, true);
  assert.equal(exploration(all.slice(1)).done, 5);
});

test('journal : chaque section a au moins deux phrases, toutes uniques', () => {
  const all: string[] = [];
  for (const [section, lines] of Object.entries(AMBIENT)) {
    assert.ok(lines.length >= 2, section);
    all.push(...lines);
  }
  assert.equal(new Set(all).size, all.length);
});

test('journal : aucun caractère interdit dans les phrases', () => {
  const texts = [
    ...Object.values(AMBIENT).flat(),
    ...Object.values(EVENTS),
    ...ROOMS.flatMap((r) => [r.story, r.log, r.action]),
  ];
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
