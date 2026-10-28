// Plan du Nostromo : six salles, chacune avec un mini-récit original et, pour quatre d'entre
// elles, un lien vers une partie du site. Aucune dépendance au navigateur, pour pouvoir tester.
export type RoomId =
  'pont' | 'infirmerie' | 'cale' | 'sas' | 'machines' | 'navette';

export type RoomTarget = 'terminal' | 'dossiers' | 'detecteur' | 'collection';

export interface Room {
  id: RoomId;
  name: string;
  deck: string;
  story: string;
  // Partie du site à laquelle la salle donne accès, ou null si c'est seulement un récit.
  target: RoomTarget | null;
  action: string;
  // Phrase de MU/TH/UR quand on entre dans la salle.
  log: string;
}

export const ROOMS: Room[] = [
  {
    id: 'pont',
    name: 'Le pont',
    deck: 'PONT A',
    story:
      'C’est ici que l’ordinateur de bord a tiré l’équipage de son sommeil. Un seul canal part vers la Terre, et c’est MU/TH/UR qui décide de ce qui y passe. Si quelqu’un doit demander de l’aide, c’est depuis ce siège.',
    target: 'terminal',
    action: 'APPELER LA COMPAGNIE',
    log: 'PONT A : ACCÈS AUTORISÉ. LIAISON AVEC LA COMPAGNIE DISPONIBLE.',
  },
  {
    id: 'infirmerie',
    name: 'L’infirmerie',
    deck: 'PONT B',
    story:
      'Les scanners médicaux tournent encore. Chaque lit garde la trace d’un membre de l’équipage : constantes, groupe sanguin, historique. Et une ligne dans le rapport que personne n’a envie de relire à voix haute.',
    target: 'dossiers',
    action: 'LIRE LES DOSSIERS',
    log: 'PONT B : DOSSIERS MÉDICAUX CHARGÉS, SIX FICHES OUVERTES.',
  },
  {
    id: 'cale',
    name: 'La cale',
    deck: 'PONT C',
    story:
      'Une halle immense, sombre, pleine de conteneurs empilés. Ton détecteur n’y voit que des échos, et certains bougent sans raison. Avance doucement, et ne reste jamais longtemps au même endroit.',
    target: 'detecteur',
    action: 'LANCER LE DÉTECTEUR',
    log: 'PONT C : MOUVEMENTS NON RÉPERTORIÉS. DÉTECTEUR PRÊT.',
  },
  {
    id: 'sas',
    name: 'Le sas de quarantaine',
    deck: 'PONT C',
    story:
      'Rien ne devait entrer ici. Pourtant, un casier scellé contient des œufs rapportés sans autorisation. Un seul geste suffit pour en ouvrir un. Personne ne sait ce que tu y trouveras, ni qui te regardera en face.',
    target: 'collection',
    action: 'OUVRIR UN ŒUF',
    log: 'SAS DE QUARANTAINE : SCELLÉS BRISÉS. NE PAS APPROCHER.',
  },
  {
    id: 'machines',
    name: 'La salle des machines',
    deck: 'PONT D',
    story:
      'Les pompes grondent, la vapeur monte, la chaleur colle à la peau. Tu cherches un outil, une idée, une issue, mais il n’y a ici que du bruit. C’est pourtant l’endroit idéal pour s’arrêter un instant et écouter le vaisseau respirer.',
    target: null,
    action: '',
    log: 'PONT D : TEMPÉRATURE ÉLEVÉE. AUCUNE ANOMALIE DÉTECTÉE.',
  },
  {
    id: 'navette',
    name: 'La navette de secours',
    deck: 'PONT E',
    story:
      'Elle peut embarquer quelques personnes, pas l’équipage entier. Le départ dépend d’un seul message : la réponse de la Compagnie. Tant qu’elle ne vient pas, la navette reste accrochée à la coque, moteurs froids.',
    target: null,
    action: '',
    log: 'PONT E : NAVETTE ARRIMÉE. DÉPART IMPOSSIBLE SANS AUTORISATION.',
  },
];

export function roomById(id: string): Room | undefined {
  return ROOMS.find((r) => r.id === id);
}

// Ajoute une salle à la liste des salles visitées, sans doublon et sans effet de bord.
export function visit(visited: readonly RoomId[], id: RoomId): RoomId[] {
  return visited.includes(id) ? [...visited] : [...visited, id];
}

export function exploration(visited: readonly RoomId[]): {
  done: number;
  total: number;
  complete: boolean;
} {
  const done = ROOMS.filter((r) => visited.includes(r.id)).length;
  return { done, total: ROOMS.length, complete: done === ROOMS.length };
}
