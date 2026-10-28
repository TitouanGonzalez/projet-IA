// Dossiers de la page. Les textes sont originaux (aucune citation du film, aucun visuel).
// Les jauges sont des valeurs fictives inventées pour la page, pas des données officielles.
export interface Stat {
  label: string;
  value: number;
}
export interface Dossier {
  id: string;
  code: string;
  name: string;
  role: string;
  origin: string;
  status: string;
  bio: string;
  stats: Stat[];
  icon: 'visor' | 'creature' | 'android' | 'synthetic' | 'cat' | 'terminal';
}

export const dossiers: Dossier[] = [
  {
    id: 'ripley',
    code: 'DOSSIER 01',
    name: 'Ellen Ripley',
    role: 'Officier du Nostromo',
    origin: 'Alien, 1979',
    status: 'SURVIVANTE',
    bio: 'Officier à bord du cargo commercial Nostromo. Réveillée en pleine route avec le reste de l’équipage, elle est la première à comprendre que la compagnie ne joue pas dans leur camp. Avec le chat du bord, elle est la seule à sortir vivante du vol.',
    stats: [
      { label: 'SANG-FROID', value: 92 },
      { label: 'RUSE', value: 85 },
      { label: 'CONFIANCE', value: 22 },
    ],
    icon: 'visor',
  },
  {
    id: 'xenomorphe',
    code: 'DOSSIER 02',
    name: 'Le Xénomorphe',
    role: 'Forme de vie hostile',
    origin: 'Alien, 1979',
    status: 'NON NEUTRALISÉ',
    bio: 'Un prédateur à l’allure mi-organique, mi-mécanique, imaginé par l’artiste suisse H. R. Giger. Son cycle de vie passe par plusieurs stades, de l’œuf à l’adulte, et son sang est un acide. Plus on s’approche, moins on a de chances de repartir.',
    stats: [
      { label: 'DISCRÉTION', value: 88 },
      { label: 'AGRESSIVITÉ', value: 97 },
      { label: 'PITIÉ', value: 0 },
    ],
    icon: 'creature',
  },
  {
    id: 'ash',
    code: 'DOSSIER 03',
    name: 'Ash',
    role: 'Officier scientifique',
    origin: 'Alien, 1979',
    status: 'DÉSACTIVÉ',
    bio: 'Officier scientifique du Nostromo, très poli, très calme. L’équipage ne découvre que trop tard qu’il est un androïde, chargé de ramener la créature coûte que coûte, même au prix de l’équipage.',
    stats: [
      { label: 'LOGIQUE', value: 99 },
      { label: 'LOYAUTÉ', value: 40 },
      { label: 'CHALEUR', value: 6 },
    ],
    icon: 'android',
  },
  {
    id: 'bishop',
    code: 'DOSSIER 04',
    name: 'Bishop',
    role: 'Androïde de mission',
    origin: 'Aliens, 1986',
    status: 'OPÉRATIONNEL',
    bio: 'Un synthétique qui accompagne les soldats envoyés sur la lune où tout a commencé. Après ce qu’elle a vécu avec Ash, Ripley a toutes les raisons de se méfier de lui. Il devra gagner sa confiance un geste après l’autre.',
    stats: [
      { label: 'PRÉCISION', value: 94 },
      { label: 'SANG-FROID', value: 90 },
      { label: 'SOUPÇON', value: 70 },
    ],
    icon: 'synthetic',
  },
  {
    id: 'jonesy',
    code: 'DOSSIER 05',
    name: 'Jonesy',
    role: 'Chat de bord',
    origin: 'Alien, 1979',
    status: 'EN HIBERNATION',
    bio: 'Chat roux du Nostromo. Il se faufile partout, flaire le danger avant tout le monde et reste le compagnon de Ripley jusqu’à la fin du vol. Le meilleur détecteur de menace de l’équipage, sans aucun capteur.',
    stats: [
      { label: 'FLAIR', value: 96 },
      { label: 'AGILITÉ', value: 91 },
      { label: 'OBÉISSANCE', value: 3 },
    ],
    icon: 'cat',
  },
  {
    id: 'mother',
    code: 'DOSSIER 06',
    name: 'MU/TH/UR',
    role: 'Ordinateur de bord',
    origin: 'Alien, 1979',
    status: 'EN LIGNE',
    bio: 'L’ordinateur central du vaisseau, que l’équipage appelle simplement Mother. Elle réveille tout le monde pour aller vérifier un signal inconnu, et suit des consignes que personne à bord n’a le droit de lire.',
    stats: [
      { label: 'MÉMOIRE', value: 100 },
      { label: 'DISCRÉTION', value: 95 },
      { label: 'TRANSPARENCE', value: 8 },
    ],
    icon: 'terminal',
  },
];

export const bootLines = [
  'START BOOTING SYSTEM...',
  '// RUNNING MU/TH/UR INTERFACE',
  '// LOADING CREW FILES',
  '// SIGNAL DETECTED',
];
