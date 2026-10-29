// Cartes à collectionner : raretés, tirage d'un œuf, œufs qui s'accumulent avec le temps.
// Logique pure, sans dépendance au navigateur : le stockage est fait par l'interface.
// Les textes sont originaux (aucune réplique du film).
export type Rarity =
  'legendaire' | 'super_rare' | 'rare' | 'peu_commune' | 'commune';

export interface RarityInfo {
  id: Rarity;
  label: string;
  weight: number; // poids du tirage, en pourcents
  level: number; // 5 pour la plus rare, 1 pour la plus commune
}

// De la plus rare à la plus commune.
export const RARITIES: RarityInfo[] = [
  { id: 'legendaire', label: 'LÉGENDAIRE', weight: 2, level: 5 },
  { id: 'super_rare', label: 'SUPER RARE', weight: 8, level: 4 },
  { id: 'rare', label: 'RARE', weight: 20, level: 3 },
  { id: 'peu_commune', label: 'PEU COMMUNE', weight: 30, level: 2 },
  { id: 'commune', label: 'COMMUNE', weight: 40, level: 1 },
];

export type CardIcon =
  | 'visor'
  | 'creature'
  | 'android'
  | 'synthetic'
  | 'cat'
  | 'terminal'
  | 'queen'
  | 'child'
  | 'officer'
  | 'marine'
  | 'engineer'
  | 'suit'
  | 'egg'
  | 'facehugger'
  | 'chestburster'
  | 'rifle'
  | 'tracker'
  | 'shuttle';

export interface Card {
  id: string;
  name: string;
  rarity: Rarity;
  icon: CardIcon;
  text: string;
}

export const CARDS: Card[] = [
  {
    id: 'ripley',
    name: 'Ellen Ripley',
    rarity: 'legendaire',
    icon: 'visor',
    text: 'Officier du Nostromo, seule humaine à sortir vivante du premier vol. Elle apprend vite et ne fait confiance à personne.',
  },
  {
    id: 'xenomorphe',
    name: 'Le Xénomorphe',
    rarity: 'legendaire',
    icon: 'creature',
    text: 'Prédateur imaginé par l’artiste H. R. Giger. Son sang est un acide et son cycle de vie commence dans un œuf.',
  },
  {
    id: 'reine',
    name: 'La Reine xénomorphe',
    rarity: 'super_rare',
    icon: 'queen',
    text: 'Elle règne sur la ruche et pond les œufs. On la rencontre dans Aliens, en 1986.',
  },
  {
    id: 'ash',
    name: 'Ash',
    rarity: 'super_rare',
    icon: 'android',
    text: 'Officier scientifique du Nostromo, très calme, très poli. C’est un androïde.',
  },
  {
    id: 'bishop',
    name: 'Bishop',
    rarity: 'super_rare',
    icon: 'synthetic',
    text: 'Un synthétique qui accompagne la mission d’Aliens. Il devra gagner la confiance de Ripley.',
  },
  {
    id: 'newt',
    name: 'Newt',
    rarity: 'super_rare',
    icon: 'child',
    text: 'Jeune survivante d’une colonie, croisée dans Aliens. Elle connaît les conduits mieux que personne.',
  },
  {
    id: 'dallas',
    name: 'Dallas',
    rarity: 'rare',
    icon: 'officer',
    text: 'Capitaine du Nostromo. C’est lui qui décide à bord, jusqu’à ce que tout bascule.',
  },
  {
    id: 'hicks',
    name: 'Hicks',
    rarity: 'rare',
    icon: 'marine',
    text: 'Caporal de la mission d’Aliens. Calme, efficace, il garde la tête froide.',
  },
  {
    id: 'parker',
    name: 'Parker',
    rarity: 'rare',
    icon: 'engineer',
    text: 'Chef mécanicien du Nostromo. Il pense surtout à sa paie et à ses machines.',
  },
  {
    id: 'kane',
    name: 'Kane',
    rarity: 'rare',
    icon: 'officer',
    text: 'Officier du Nostromo, le premier à s’approcher des œufs. Un peu trop curieux.',
  },
  {
    id: 'vasquez',
    name: 'Vasquez',
    rarity: 'rare',
    icon: 'marine',
    text: 'Soldate d’Aliens, toujours la première au combat.',
  },
  {
    id: 'jonesy',
    name: 'Jonesy',
    rarity: 'rare',
    icon: 'cat',
    text: 'Chat roux du Nostromo. Il flaire le danger avant tout le monde, sans aucun capteur.',
  },
  {
    id: 'lambert',
    name: 'Lambert',
    rarity: 'peu_commune',
    icon: 'officer',
    text: 'Navigatrice du Nostromo. Elle garde les yeux sur les écrans.',
  },
  {
    id: 'burke',
    name: 'Burke',
    rarity: 'peu_commune',
    icon: 'suit',
    text: 'Représentant de la Compagnie dans Aliens. Très aimable, trop pour être honnête.',
  },
  {
    id: 'brett',
    name: 'Brett',
    rarity: 'peu_commune',
    icon: 'engineer',
    text: 'Technicien du Nostromo, discret, toujours aux côtés de Parker.',
  },
  {
    id: 'apone',
    name: 'Apone',
    rarity: 'peu_commune',
    icon: 'marine',
    text: 'Sergent des marines d’Aliens. Il dirige l’équipe et ne laisse rien passer.',
  },
  {
    id: 'hudson',
    name: 'Hudson',
    rarity: 'peu_commune',
    icon: 'marine',
    text: 'Soldat bavard d’Aliens, toujours prêt à s’inquiéter à voix haute.',
  },
  {
    id: 'mother',
    name: 'MU/TH/UR',
    rarity: 'peu_commune',
    icon: 'terminal',
    text: 'L’ordinateur de bord du Nostromo. Elle exécute des consignes que personne n’a le droit de lire.',
  },
  {
    id: 'oeuf',
    name: 'L’œuf',
    rarity: 'commune',
    icon: 'egg',
    text: 'Il s’ouvre quand quelqu’un s’approche. Mieux vaut ne pas se pencher dessus.',
  },
  {
    id: 'facehugger',
    name: 'Le face-hugger',
    rarity: 'commune',
    icon: 'facehugger',
    text: 'Il saute au visage et dépose un embryon. Il vient de l’œuf.',
  },
  {
    id: 'chestburster',
    name: 'Le chestburster',
    rarity: 'commune',
    icon: 'chestburster',
    text: 'Il sort de sa victime en quelques instants, puis il grandit très vite.',
  },
  {
    id: 'fusil',
    name: 'Le fusil à impulsion',
    rarity: 'commune',
    icon: 'rifle',
    text: 'L’arme des marines d’Aliens, rapide et bruyante.',
  },
  {
    id: 'detecteur',
    name: 'Le détecteur de mouvement',
    rarity: 'commune',
    icon: 'tracker',
    text: 'Il bipe de plus en plus vite quand quelque chose approche.',
  },
  {
    id: 'navette',
    name: 'La navette de secours',
    rarity: 'commune',
    icon: 'shuttle',
    text: 'Le petit vaisseau de secours du Nostromo, la dernière issue.',
  },
];

export const rarityInfo = (r: Rarity): RarityInfo =>
  RARITIES.find((x) => x.id === r)!;

export const cardsOf = (r: Rarity): Card[] =>
  CARDS.filter((c) => c.rarity === r);

// Tire une carte : d'abord la rareté selon les poids, puis une carte au hasard parmi elle.
export function drawCard(rng: () => number): Card {
  const total = RARITIES.reduce((n, r) => n + r.weight, 0);
  let roll = rng() * total;
  let rarity = RARITIES[RARITIES.length - 1].id;
  for (const r of RARITIES) {
    if (roll < r.weight) {
      rarity = r.id;
      break;
    }
    roll -= r.weight;
  }
  const pool = cardsOf(rarity);
  return pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))];
}

export const MAX_EGGS = 10;
export const START_EGGS = 3;
export const EGG_INTERVAL = 10 * 60 * 1000; // un œuf toutes les 10 minutes
export const DEMO_INTERVAL = 10 * 1000; // en mode démonstration : toutes les 10 secondes

export interface Collection {
  eggs: number;
  last: number; // instant (ms) à partir duquel on compte le prochain œuf
  owned: Record<string, number>; // identifiant de carte -> nombre d'exemplaires
  demo: boolean;
}

export const interval = (c: Collection): number =>
  c.demo ? DEMO_INTERVAL : EGG_INTERVAL;

export function fresh(now: number): Collection {
  return { eggs: START_EGGS, last: now, owned: {}, demo: false };
}

// Ajoute les œufs gagnés depuis la dernière fois, même si la page était fermée.
// Plein, le compteur est en pause : il repart de zéro dès qu'on ouvre un œuf.
export function accrue(c: Collection, now: number): Collection {
  if (c.eggs >= MAX_EGGS) return c.last === now ? c : { ...c, last: now };
  if (now < c.last) return { ...c, last: now }; // horloge remise en arrière
  const step = interval(c);
  const gained = Math.floor((now - c.last) / step);
  if (gained <= 0) return c;
  const eggs = Math.min(MAX_EGGS, c.eggs + gained);
  return { ...c, eggs, last: eggs >= MAX_EGGS ? now : c.last + gained * step };
}

// Millisecondes avant le prochain œuf, ou null si le stock est plein.
export function nextEggIn(c: Collection, now: number): number | null {
  if (c.eggs >= MAX_EGGS) return null;
  return Math.max(0, interval(c) - Math.max(0, now - c.last));
}

export function openEgg(
  c: Collection,
  rng: () => number,
  now: number,
): {
  collection: Collection;
  card: Card;
  isNew: boolean;
  count: number;
} | null {
  const current = accrue(c, now);
  if (current.eggs <= 0) return null;
  const card = drawCard(rng);
  const before = current.owned[card.id] ?? 0;
  // Le stock était plein : le compteur repart au moment où l'on ouvre.
  const last = current.eggs >= MAX_EGGS ? now : current.last;
  return {
    collection: {
      ...current,
      eggs: current.eggs - 1,
      last,
      owned: { ...current.owned, [card.id]: before + 1 },
    },
    card,
    isNew: before === 0,
    count: before + 1,
  };
}

export function setDemo(c: Collection, demo: boolean, now: number): Collection {
  return { ...c, demo, last: now };
}

export function stats(c: Collection) {
  const owned = CARDS.filter((card) => (c.owned[card.id] ?? 0) > 0);
  return {
    owned: owned.length,
    total: CARDS.length,
    copies: owned.reduce((n, card) => n + c.owned[card.id], 0),
  };
}

export function formatCountdown(ms: number): string {
  const s = Math.ceil(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

// Relit une sauvegarde sans jamais planter : tout ce qui est douteux est ignoré ou corrigé.
export function parseCollection(raw: string | null, now: number): Collection {
  if (!raw) return fresh(now);
  try {
    const data = JSON.parse(raw) as Partial<Collection> | null;
    if (!data || typeof data !== 'object') return fresh(now);
    const known = new Set(CARDS.map((c) => c.id));
    const owned: Record<string, number> = {};
    if (data.owned && typeof data.owned === 'object')
      for (const [id, n] of Object.entries(data.owned))
        if (known.has(id) && Number.isInteger(n) && (n as number) > 0)
          owned[id] = Math.min(999, n as number);
    const eggs =
      typeof data.eggs === 'number' && Number.isFinite(data.eggs)
        ? Math.max(0, Math.min(MAX_EGGS, Math.floor(data.eggs)))
        : START_EGGS;
    const last =
      typeof data.last === 'number' &&
      Number.isFinite(data.last) &&
      data.last <= now
        ? data.last
        : now;
    return { eggs, last, owned, demo: data.demo === true };
  } catch {
    return fresh(now);
  }
}
