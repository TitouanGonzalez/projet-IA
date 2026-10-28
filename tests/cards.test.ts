import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CARDS,
  DEMO_INTERVAL,
  EGG_INTERVAL,
  MAX_EGGS,
  RARITIES,
  START_EGGS,
  accrue,
  cardsOf,
  drawCard,
  formatCountdown,
  fresh,
  nextEggIn,
  openEgg,
  parseCollection,
  setDemo,
  stats,
  type Rarity,
} from '../app/shared/cards.js';

const seeded = (seed = 42) => {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
};
const T0 = 1_700_000_000_000;

test('les cartes sont uniques, et les raretés bien remplies', () => {
  assert.equal(new Set(CARDS.map((c) => c.id)).size, CARDS.length);
  assert.equal(CARDS.length, 24);
  assert.equal(
    RARITIES.reduce((n, r) => n + r.weight, 0),
    100,
  );
  for (const r of RARITIES) assert.ok(cardsOf(r.id).length >= 2, r.id);
  for (const c of CARDS) assert.ok(c.name && c.text && c.icon, c.id);
});

test('les deux cartes légendaires sont Ellen Ripley et le Xénomorphe', () => {
  assert.deepEqual(
    cardsOf('legendaire')
      .map((c) => c.id)
      .sort(),
    ['ripley', 'xenomorphe'],
  );
});

test('le tirage suit les pourcentages de rareté', () => {
  const rng = seeded();
  const counts: Record<string, number> = {};
  const N = 100_000;
  for (let i = 0; i < N; i++) {
    const r = drawCard(rng).rarity;
    counts[r] = (counts[r] ?? 0) + 1;
  }
  for (const r of RARITIES) {
    const share = (counts[r.id] / N) * 100;
    assert.ok(
      Math.abs(share - r.weight) < 1,
      `${r.id} : ${share.toFixed(1)} % au lieu de ${r.weight} %`,
    );
  }
});

test('chaque carte peut sortir, et les cas limites du hasard sont sûrs', () => {
  const seen = new Set<string>();
  const rng = seeded(9);
  for (let i = 0; i < 20_000; i++) seen.add(drawCard(rng).id);
  assert.equal(seen.size, CARDS.length);
  assert.equal(drawCard(() => 0).rarity, 'legendaire');
  assert.equal(drawCard(() => 0.999999).rarity, 'commune');
  assert.ok(CARDS.includes(drawCard(() => 0.999999)));
});

test('un nouveau joueur commence avec 3 œufs et le compteur lancé', () => {
  const c = fresh(T0);
  assert.equal(c.eggs, START_EGGS);
  assert.equal(nextEggIn(c, T0), EGG_INTERVAL);
  assert.equal(nextEggIn(c, T0 + 4 * 60_000), EGG_INTERVAL - 4 * 60_000);
});

test('un œuf toutes les 10 minutes, même page fermée, plafonné à 10', () => {
  const c = fresh(T0);
  assert.equal(accrue(c, T0 + 9 * 60_000), c); // pas encore
  const a = accrue(c, T0 + 25 * 60_000);
  assert.equal(a.eggs, START_EGGS + 2);
  assert.equal(a.last, T0 + 20 * 60_000); // il reste 5 minutes d'avance
  assert.equal(nextEggIn(a, T0 + 25 * 60_000), 5 * 60_000);
  const full = accrue(c, T0 + 10 * 60 * 60_000);
  assert.equal(full.eggs, MAX_EGGS);
  assert.equal(nextEggIn(full, T0 + 10 * 60 * 60_000), null);
});

test('plein, le compteur est en pause et repart à l’ouverture d’un œuf', () => {
  const full = { ...fresh(T0), eggs: MAX_EGGS };
  const later = T0 + 5 * 60 * 60_000;
  const opened = openEgg(full, seeded(), later)!;
  assert.equal(opened.collection.eggs, MAX_EGGS - 1);
  assert.equal(opened.collection.last, later);
  assert.equal(nextEggIn(opened.collection, later), EGG_INTERVAL);
});

test('si l’horloge recule, on ne gagne ni ne perd d’œuf', () => {
  const c = { ...fresh(T0), eggs: 4 };
  const back = accrue(c, T0 - 60 * 60_000);
  assert.equal(back.eggs, 4);
  assert.equal(back.last, T0 - 60 * 60_000);
});

test('ouvrir un œuf donne une carte, retire un œuf et compte les doublons', () => {
  const rng = () => 0; // toujours Ripley
  let c = fresh(T0);
  const first = openEgg(c, rng, T0)!;
  assert.equal(first.card.id, 'ripley');
  assert.equal(first.isNew, true);
  assert.equal(first.count, 1);
  assert.equal(first.collection.eggs, START_EGGS - 1);
  c = first.collection;
  const second = openEgg(c, rng, T0)!;
  assert.equal(second.isNew, false);
  assert.equal(second.count, 2);
  assert.equal(second.collection.owned.ripley, 2);
  const s = stats(second.collection);
  assert.deepEqual(s, { owned: 1, total: 24, copies: 2 });
});

test('sans œuf, rien ne s’ouvre ; un œuf gagné entre-temps s’ouvre', () => {
  const empty = { ...fresh(T0), eggs: 0 };
  assert.equal(openEgg(empty, seeded(), T0 + 1000), null);
  const ready = openEgg(empty, seeded(), T0 + EGG_INTERVAL);
  assert.ok(ready);
  assert.equal(ready!.collection.eggs, 0);
});

test('le mode démonstration donne un œuf toutes les 10 secondes', () => {
  const c = setDemo({ ...fresh(T0), eggs: 0 }, true, T0);
  assert.equal(c.demo, true);
  assert.equal(nextEggIn(c, T0), DEMO_INTERVAL);
  assert.equal(accrue(c, T0 + 35_000).eggs, 3);
  // Le repasser en normal ne donne pas d'œufs rétroactifs.
  const normal = setDemo(accrue(c, T0 + 35_000), false, T0 + 35_000);
  assert.equal(accrue(normal, T0 + 36_000).eggs, 3);
});

test('une sauvegarde abîmée ne fait jamais planter et se corrige', () => {
  assert.deepEqual(parseCollection(null, T0), fresh(T0));
  assert.deepEqual(parseCollection('pas du json {', T0), fresh(T0));
  assert.deepEqual(parseCollection('42', T0), fresh(T0));
  assert.deepEqual(parseCollection('null', T0), fresh(T0));
  const messy = parseCollection(
    JSON.stringify({
      eggs: 999,
      last: T0 + 99999999, // dans le futur
      owned: {
        ripley: 3,
        inconnue: 5,
        ash: -2,
        bishop: 1.5,
        newt: 'x',
        kane: 1,
      },
      demo: 'oui',
    }),
    T0,
  );
  assert.equal(messy.eggs, MAX_EGGS);
  assert.equal(messy.last, T0);
  assert.deepEqual(messy.owned, { ripley: 3, kane: 1 });
  assert.equal(messy.demo, false);
  const ok = parseCollection(JSON.stringify(messy), T0);
  assert.deepEqual(ok, messy);
});

test('le compte à rebours s’écrit en minutes et secondes', () => {
  assert.equal(formatCountdown(600_000), '10:00');
  assert.equal(formatCountdown(61_000), '01:01');
  assert.equal(formatCountdown(0), '00:00');
  assert.equal(formatCountdown(999), '00:01');
});

test('toutes les raretés sont représentées dans la collection', () => {
  const ids = new Set<Rarity>(CARDS.map((c) => c.rarity));
  assert.equal(ids.size, 5);
});
