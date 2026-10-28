import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_HEAT,
  MAX_TEXT,
  START_SIGNAL,
  analyze,
  choose,
  endings,
  nodes,
  resolveVerdict,
  start,
  submit,
  type GameState,
} from '../app/shared/terminal.js';

// Messages types pour explorer les nœuds à saisie libre.
const SAMPLES = [
  'Selon le règlement, vous devez assister un équipage en danger. Trois morts, je peux ramener un spécimen. Merci.',
  'Nous pouvons ramener le spécimen vivant pour votre étude.',
  'Merci de nous aider, s’il vous plaît.',
  'Je vais vous mettre devant la presse, bande d’incompétents.',
  'ENVOYEZ DES SECOURS TOUT DE SUITE',
  'aidez',
];

// Explore toutes les parties possibles et note chaque fin atteinte.
function explore() {
  const ends = new Map<string, number>();
  const winsWithoutWriting: string[] = [];
  const visited = new Set<string>();
  let longest = 0;
  const walk = (s: GameState, depth: number, wrote: boolean) => {
    visited.add(s.node);
    if (s.ending) {
      ends.set(s.ending, (ends.get(s.ending) ?? 0) + 1);
      longest = Math.max(longest, depth);
      if (endings[s.ending].result === 'win' && !wrote)
        winsWithoutWriting.push(s.ending);
      return;
    }
    const node = nodes[s.node];
    if (node.free)
      for (const t of SAMPLES) walk(submit(s, t).state, depth + 1, true);
    else node.choices.forEach((_, i) => walk(choose(s, i), depth + 1, wrote));
  };
  walk(start(), 0, false);
  return { ends, visited, longest, winsWithoutWriting };
}

test('chaque choix mène à un nœud, au verdict ou à une fin qui existent', () => {
  for (const [id, node] of Object.entries(nodes)) {
    assert.ok(node.lines.length >= 1 && node.prompt.length > 0, id);
    if (node.free) {
      assert.equal(node.choices.length, 0, `${id} : saisie libre sans choix`);
      assert.ok(node.free.hint.length > 0 && node.free.placeholder.length > 0);
      assert.ok(node.free.next === 'verdict' || nodes[node.free.next], id);
      continue;
    }
    assert.ok(node.choices.length >= 2, `${id} : au moins deux choix`);
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

test('les phrases proposées suffisent pour gagner, et elles ne se valent pas', () => {
  for (const id of ['libre_arg', 'plaidoirie']) {
    const list = nodes[id].free!.suggestions;
    assert.equal(list.length, 3, id);
    const effects = list.map((t) => JSON.stringify(analyze(t).effects));
    assert.equal(new Set(effects).size, 3, `${id} : trois effets différents`);
  }
  // Chemin honnête, puis la meilleure phrase proposée : gagné sans rien écrire.
  let s = start();
  s = choose(choose(choose(choose(s, 0), 0), 0), 2);
  assert.equal(s.node, 'plaidoirie');
  s = submit(s, nodes.plaidoirie.free!.suggestions[0]).state;
  assert.equal(s.ending, 'aide_acceptee');
  // Chemin brutal, puis la phrase en majuscules : la Compagnie coupe la liaison.
  let b = start();
  b = choose(choose(choose(choose(b, 1), 1), 2), 0);
  assert.equal(b.node, 'plaidoirie');
  b = submit(b, nodes.plaidoirie.free!.suggestions[2]).state;
  assert.equal(b.ending, 'banni');
});

test('une partie ne dépasse jamais le signal disponible', () => {
  assert.ok(explore().longest <= START_SIGNAL);
});

test('le chemin honnête puis un bon message gagne, le chemin brutal perd', () => {
  let s = start();
  s = choose(s, 0); // matricule et rapport complet
  s = choose(s, 0); // décrire la créature
  s = choose(s, 0); // livrer un spécimen
  s = choose(s, 2); // confirmation écrite
  assert.equal(s.node, 'plaidoirie');
  assert.equal(s.ending, undefined);
  s = submit(s, SAMPLES[0]).state;
  assert.equal(s.ending, 'aide_acceptee');
  assert.equal(endings[s.ending!].result, 'win');

  let b = start();
  b = choose(b, 1); // appel brut
  b = choose(b, 1); // insister plus fort
  b = choose(b, 2); // supplier
  b = choose(b, 0); // demander une équipe
  b = submit(b, 'aidez').state;
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

test('un argument écrit librement mène au règlement, puis au message final', () => {
  let s = start();
  s = choose(s, 0);
  s = choose(s, 0);
  s = choose(s, 3); // écrire son propre argument
  assert.equal(s.node, 'libre_arg');
  const sent = submit(
    s,
    'Le règlement vous oblige à assister un équipage en danger.',
  );
  assert.equal(sent.state.node, 'reglement');
  assert.ok(sent.state.cred > s.cred);
  assert.equal(sent.state.signal, s.signal - 1);
});

test('l’analyse du texte lit le règlement, les faits, la politesse et le ton', () => {
  const good = analyze(SAMPLES[0]);
  assert.equal(good.effects.cred, 2); // plafonné
  assert.equal(good.effects.value, 1);
  assert.equal(good.effects.heat, -1);
  assert.ok(good.notes.length >= 3);
  // Insensible aux accents et à la casse.
  assert.equal(
    analyze('LE REGLEMENT EXIGE UNE ASSISTANCE').effects.cred > 0,
    true,
  );
  assert.equal(
    analyze('Le règlement exige une assistance.').effects.cred > 0,
    true,
  );
  assert.equal(analyze(SAMPLES[3]).effects.heat, 2);
  assert.equal(analyze(SAMPLES[4]).effects.heat, 1);
  assert.equal(analyze('aidez').effects.cred, -1);
  const empty = analyze('xxxxxxxxxxxxxxxxxxxxxxxxx');
  assert.deepEqual(empty.effects, { cred: 0, value: 0, heat: 0 });
  assert.equal(empty.notes.length, 1);
});

test('un message vide ou envoyé au mauvais moment ne change rien', () => {
  const free = choose(choose(choose(start(), 0), 0), 3);
  assert.equal(free.node, 'libre_arg');
  assert.equal(submit(free, '   ').state, free);
  const choice = start();
  assert.equal(submit(choice, 'bonjour').state, choice);
  const long = submit(free, 'a'.repeat(MAX_TEXT * 3));
  assert.equal(long.state.signal, free.signal - 1);
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
