// Journal de bord : phrases de MU/TH/UR qui apparaissent seules, selon la partie du site où
// la personne se trouve. Logique pure (aucun accès au navigateur), pour pouvoir la tester.
export type LogSection =
  'accueil' | 'dossiers' | 'terminal' | 'collection' | 'apropos';

export const AMBIENT_MIN = 22_000;
export const AMBIENT_MAX = 38_000;
export const FIRST_DELAY = 7_000;
export const LINE_LIFETIME = 9_000;
export const MAX_LINES = 3;

export const AMBIENT: Record<LogSection, string[]> = {
  accueil: [
    'MU/TH/UR : TOUS LES SYSTÈMES SONT NOMINAUX.',
    'RAPPEL : LE VOL SE POURSUIT SANS ESCALE.',
    'ÉQUIPAGE EN SOMMEIL PROFOND. UN SEUL POSTE ACTIF.',
  ],
  dossiers: [
    'DOSSIERS DE L’ÉQUIPAGE : LECTURE AUTORISÉE.',
    'UN DOSSIER A ÉTÉ MODIFIÉ SANS VOTRE ACCORD. IGNORÉ.',
    'LES CONSTANTES DE L’ÉQUIPAGE RESTENT STABLES.',
  ],
  terminal: [
    'LIAISON COMPAGNIE : LATENCE ESTIMÉE, SIX MINUTES.',
    'LES PRIORITÉS DE LA COMPAGNIE NE SONT PAS PUBLIQUES.',
    'CONSEIL : RESTE POLI, ET FACTUEL.',
  ],
  collection: [
    'QUARANTAINE : LES ŒUFS REMUENT.',
    'CHAQUE ŒUF OUVERT EST ENREGISTRÉ AU JOURNAL.',
    'STOCK D’ŒUFS : LE COMPTEUR CONTINUE DE TOURNER.',
  ],
  apropos: [
    'FIN DE TRANSMISSION. REPRISE AU PROCHAIN CYCLE.',
    'MU/TH/UR VOUS REMERCIE DE VOTRE ATTENTION.',
  ],
};

// Phrases déclenchées par une action de la personne.
export const EVENTS = {
  enter: 'LIAISON ÉTABLIE. BIENVENUE À BORD DU NOSTROMO.',
  dossier: 'DOSSIER CONSULTÉ. L’ACCÈS EST ENREGISTRÉ.',
  legendary: 'ALERTE : SIGNATURE RARE DÉTECTÉE DANS LA COLLECTION.',
  duplicate: 'DOUBLON ENREGISTRÉ. LE VAISSEAU GARDE TOUT.',
  won: 'LA COMPAGNIE A RÉPONDU. DE L’AIDE EST EN ROUTE.',
  lost: 'LA COMPAGNIE NE RÉPOND PLUS.',
} as const;

export type LogEvent = keyof typeof EVENTS;

export interface LogLine {
  id: number;
  text: string;
}

// Délai avant la prochaine phrase spontanée.
export function nextDelay(rng: () => number): number {
  return Math.round(AMBIENT_MIN + rng() * (AMBIENT_MAX - AMBIENT_MIN));
}

// Choisit une phrase de la section, en évitant celles déjà dites récemment.
// Si tout a été dit, on repart de zéro plutôt que de se taire.
export function pickAmbient(
  section: LogSection,
  recent: readonly string[],
  rng: () => number,
): string {
  const pool = AMBIENT[section];
  const fresh = pool.filter((t) => !recent.includes(t));
  const from = fresh.length > 0 ? fresh : pool;
  return from[Math.min(from.length - 1, Math.floor(rng() * from.length))];
}

// Ajoute une phrase en gardant au plus MAX_LINES lignes, les plus récentes.
export function pushLine(
  lines: readonly LogLine[],
  text: string,
  id: number,
  max = MAX_LINES,
): LogLine[] {
  return [...lines, { id, text }].slice(-max);
}

export function dropLine(lines: readonly LogLine[], id: number): LogLine[] {
  return lines.filter((l) => l.id !== id);
}
