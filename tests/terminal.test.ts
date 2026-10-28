import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_HEAT,
  START_SIGNAL,
  choose,
  endings,
  nodes,
  resolveVerdict,
  start,
  type GameState,
} from '../app/shared/terminal.js';

// Explore toutes les parties possibles et note chaque fin atteinte.
function explore(): {
  ends: Map<string, number>;
  visited: Set<string>;
  longest: number;
} {
  const ends = new Map<string, number>();
  const visited = new Set<string>();
  let longest = 0;
  const walk = (s: GameState, depth: number) => {
    visited.add(s.node);
    if (s.ending) {
      ends.set(s.ending, (ends.get(s.ending) ?? 0) + 1);
      longest = Math.max(longest, depth);
      return;
    }
    nodes[s.node].choices.forEach((_, i) => walk(choose(s, i), depth + 1));
  };
  walk(start(), 0);
  return { ends, visited, longest };
}

test('chaque choix mène à un nœud, au verdict ou à une fin qui existent', () => {
  for (const [id, node] of Object.entries(nodes)) {
    assert.ok(node.choices.length >= 2, `${id} : au moins deux choix`);
    assert.ok(node.lines.length >= 1 && node.prompt.length > 0, id);
    for (const c of node.choices) {
      assert.ok(c.label.length > 0);
      if (c.next === 'verdict') continue;
      if (c.next.startsWith('end:'))
        assert.ok(endings[c.next.slice(4)], `${id} : fin inconnue ${c.next}`);
      else assert.ok(nodes[c.next], `${id} : nœud inconnu ${c.next}`);
    }
  }
});

test('tous les nœuds sont atteignables depuis le début', () => {
  const { visited } = explore();
  for (const id of Object.keys(nodes))
    assert.ok(visited.has(id), `inatteignable : ${id}`);
});

test('toutes les fins sont atteignables, victoires et défaites', () => {
  const { ends } = explore();
  for (const id of Object.keys(endings))
    assert.ok(ends.has(id), `fin jamais atteinte : ${id}`);
  const wins = [...ends].filter(([id]) => endings[id].result === 'win');
  const losses = [...ends].filter(([id]) => endings[id].result === 'lose');
  assert.ok(wins.length >= 2 && losses.length >= 3);
  // Gagner doit demander de bons choix : les victoires restent minoritaires.
  const winCount = wins.reduce((n, [, c]) => n + c, 0);
  const total = [...ends.values()].reduce((a, b) => a + b, 0);
  assert.ok(
    winCount > 0 && winCount / total < 0.5,
    `part de victoires : ${winCount}/${total}`,
  );
});

test('une partie ne dépasse jamais le signal disponible', () => {
  assert.ok(explore().longest <= START_SIGNAL);
});

test('le chemin honnête et argumenté gagne, le chemin brutal perd', () => {
  let s = start();
  s = choose(s, 0); // matricule et rapport complet
  s = choose(s, 0); // décrire la créature
  s = choose(s, 0); // livrer un spécimen
  s = choose(s, 2); // confirmation écrite
  assert.equal(s.ending, 'aide_acceptee');
  assert.equal(endings[s.ending!].result, 'win');

  let b = start();
  b = choose(b, 1); // appel brut
  b = choose(b, 1); // insister plus fort
  b = choose(b, 2); // supplier
  b = choose(b, 0); // demander une équipe
  assert.equal(endings[b.ending!].result, 'lose');
});

test('trop d’irritation coupe la liaison tout de suite', () => {
  let s = start();
  s = choose(s, 2); // opérateur humain
  s = choose(s, 1); // exiger un nom
  s = choose(s, 0); // décrire la créature
  s = choose(s, 2); // menacer
  assert.equal(s.heat >= MAX_HEAT, true);
  assert.equal(s.ending, 'banni');
});

test('le verdict suit la règle et une partie finie ne bouge plus', () => {
  const base = { node: 'x', cred: 0, value: 0, heat: 0, signal: 3 };
  assert.equal(resolveVerdict({ ...base, cred: 3, value: 2 }), 'aide_acceptee');
  assert.equal(resolveVerdict({ ...base, value: 3 }), 'aide_interessee');
  assert.equal(
    resolveVerdict({ ...base, cred: 3, value: 3, heat: 3 }),
    'aide_interessee',
  );
  assert.equal(resolveVerdict({ ...base, cred: 1, value: 1 }), 'refus');
  assert.equal(resolveVerdict({ ...base, heat: MAX_HEAT, value: 5 }), 'banni');
  const done = { ...base, ending: 'refus' };
  assert.equal(choose(done, 0), done);
  assert.equal(choose(start(), 99).node, 'ouverture');
});
