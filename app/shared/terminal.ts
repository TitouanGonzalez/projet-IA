// Le jeu du terminal MU/TH/UR : une histoire à choix, sans dépendance au navigateur.
// Le but : convaincre la Compagnie d'envoyer de l'aide avant la fin du signal.
// Les textes sont originaux (aucune réplique du film).
export interface Effects {
  cred?: number; // crédibilité aux yeux de la Compagnie
  value?: number; // intérêt qu'elle trouve à intervenir
  heat?: number; // irritation
}
export interface Choice {
  label: string;
  next: string; // un nœud, 'verdict', ou 'end:<fin>'
  effects?: Effects;
}
export interface Node {
  speaker: 'mother' | 'company';
  lines: string[];
  prompt: string;
  choices: Choice[];
}
export interface Ending {
  result: 'win' | 'lose';
  title: string;
  lines: string[];
}
export interface GameState {
  node: string;
  cred: number;
  value: number;
  heat: number;
  signal: number;
  ending?: string;
}

export const START_SIGNAL = 5;
export const MAX_HEAT = 4;

export const intro = {
  speaker: 'mother' as const,
  lines: [
    'LIAISON LONGUE PORTÉE ÉTABLIE.',
    'DÉLAI D’ÉCHANGE : 14 MINUTES PAR MESSAGE. SIGNAL RESTANT : 5 MESSAGES.',
    'Un organisme hostile est à bord et l’équipage tombe un à un. Tu es la seule personne en état d’écrire à la Compagnie.',
    'Elle ne répond qu’aux messages conformes. Convaincs-la d’envoyer de l’aide avant la fin du signal.',
  ],
};

export const nodes: Record<string, Node> = {
  ouverture: {
    speaker: 'mother',
    lines: ['CANAL OUVERT. EN ATTENTE DE TON MESSAGE.'],
    prompt: 'Comment ouvres-tu ton message ?',
    choices: [
      {
        label: 'Donner ton matricule, ton poste et ton rapport complet.',
        next: 'formel',
        effects: { cred: 1 },
      },
      {
        label: 'Envoyer un appel de détresse brut, sans protocole.',
        next: 'brut',
        effects: { heat: 1 },
      },
      {
        label: 'Demander qu’un opérateur humain te réponde.',
        next: 'humain',
        effects: { heat: 1 },
      },
    ],
  },
  formel: {
    speaker: 'company',
    lines: ['RAPPORT REÇU ET ENREGISTRÉ.', 'NATURE DE L’INCIDENT : PRÉCISER.'],
    prompt: 'Que réponds-tu ?',
    choices: [
      {
        label:
          'Décrire la créature telle qu’elle est : rapide, mortelle, impossible à arrêter.',
        next: 'creature',
        effects: { cred: 1, value: 1 },
      },
      {
        label: 'Parler d’une avarie technique pour ne pas affoler.',
        next: 'avarie',
        effects: { cred: -1 },
      },
      {
        label: 'Écrire seulement : demande de secours, priorité maximale.',
        next: 'secours',
      },
    ],
  },
  brut: {
    speaker: 'company',
    lines: [
      'MESSAGE NON CONFORME. REFORMULER SELON LE FORMULAIRE 12.',
      'TOUT MESSAGE EN MAJUSCULES SERA IGNORÉ.',
    ],
    prompt: 'Que fais-tu ?',
    choices: [
      {
        label: 'Reprendre calmement et remplir le formulaire.',
        next: 'formel',
        effects: { cred: 1 },
      },
      {
        label: 'Insister, plus fort.',
        next: 'secours',
        effects: { heat: 2 },
      },
      {
        label: 'Écrire que tout l’équipage va mourir.',
        next: 'secours',
        effects: { heat: 1 },
      },
    ],
  },
  humain: {
    speaker: 'company',
    lines: [
      'AUCUN OPÉRATEUR DISPONIBLE SUR CE CANAL.',
      'RAPPEL : PRÉSERVER LA CARGAISON ET L’ÉCHANTILLON EST LA PRIORITÉ.',
    ],
    prompt: 'Que réponds-tu ?',
    choices: [
      {
        label: 'Demander de quel échantillon il s’agit.',
        next: 'echantillon',
        effects: { value: 1 },
      },
      {
        label: 'Exiger un nom et un numéro de dossier.',
        next: 'secours',
        effects: { heat: 1 },
      },
      {
        label: 'Laisser tomber et envoyer le rapport complet.',
        next: 'formel',
        effects: { cred: 1 },
      },
    ],
  },
  creature: {
    speaker: 'company',
    lines: [
      'ORGANISME DÉCRIT. ANALYSE EN COURS.',
      'INTÉRÊT : ÉLEVÉ. COÛT D’UNE MISSION : ÉLEVÉ.',
      'ARGUMENTAIRE ATTENDU.',
    ],
    prompt: 'Quel argument avances-tu ?',
    choices: [
      {
        label:
          'Proposer de livrer un spécimen vivant à une équipe de récupération.',
        next: 'marche',
        effects: { value: 2 },
      },
      {
        label:
          'Rappeler le règlement : toute équipe en détresse a droit à une assistance.',
        next: 'reglement',
        effects: { cred: 1 },
      },
      {
        label: 'Menacer de tout révéler à la presse et aux familles.',
        next: 'menace',
        effects: { heat: 2 },
      },
    ],
  },
  avarie: {
    speaker: 'company',
    lines: [
      'AVARIE SANS DANGER VITAL. RÉPARER ET REPRENDRE LA ROUTE.',
      'FIN DE LA TRANSMISSION DANS DEUX MESSAGES.',
    ],
    prompt: 'Que fais-tu ?',
    choices: [
      {
        label: 'Avouer que tu as menti et décrire la vraie menace.',
        next: 'aveu',
        effects: { value: 1 },
      },
      {
        label: 'Maintenir l’avarie et demander seulement des pièces.',
        next: 'pieces',
      },
      {
        label: 'Couper la liaison et t’arranger seul.',
        next: 'end:renoncement',
      },
    ],
  },
  secours: {
    speaker: 'company',
    lines: [
      'DEMANDE DE SECOURS ENREGISTRÉE.',
      'MOTIF INSUFFISANT. AJOUTER UNE JUSTIFICATION.',
    ],
    prompt: 'Que réponds-tu ?',
    choices: [
      {
        label: 'Décrire la créature en détail.',
        next: 'creature',
        effects: { cred: 1, value: 1 },
      },
      {
        label: 'Citer les noms de l’équipage et leur état de santé.',
        next: 'reglement',
        effects: { cred: 1 },
      },
      {
        label: 'Écrire simplement : aidez-nous, s’il vous plaît.',
        next: 'echec',
      },
    ],
  },
  echantillon: {
    speaker: 'company',
    lines: [
      'ÉCHANTILLON : FORME DE VIE DÉTECTÉE SUR LA LUNE.',
      'CONSIGNE PRIORITAIRE : LA RAMENER. TOUTE AUTRE CONSIDÉRATION EST SECONDAIRE.',
    ],
    prompt: 'Que réponds-tu ?',
    choices: [
      {
        label: 'Répondre que tu peux la ramener, mais pas sans équipe.',
        next: 'marche',
        effects: { cred: 1, value: 2 },
      },
      {
        label: 'Exprimer ton indignation.',
        next: 'menace',
        effects: { heat: 1 },
      },
      {
        label: 'Demander ce que la Compagnie sait de cette créature.',
        next: 'creature',
        effects: { value: 1 },
      },
    ],
  },
  marche: {
    speaker: 'company',
    lines: [
      'PROPOSITION EXAMINÉE.',
      'UNE ÉQUIPE DE RÉCUPÉRATION EST ENVISAGEABLE SOUS CONDITIONS.',
      'PRÉCISER TON ACCORD.',
    ],
    prompt: 'Que réponds-tu ?',
    choices: [
      {
        label:
          'Accepter les conditions : le spécimen d’abord, l’équipage ensuite.',
        next: 'verdict',
        effects: { value: 1 },
      },
      {
        label: 'Exiger que l’équipage soit évacué en premier.',
        next: 'verdict',
        effects: { cred: 1, value: -1 },
      },
      {
        label: 'Demander une confirmation écrite avant tout engagement.',
        next: 'verdict',
        effects: { cred: 1 },
      },
    ],
  },
  reglement: {
    speaker: 'company',
    lines: [
      'ARTICLE VÉRIFIÉ.',
      'ASSISTANCE DUE SEULEMENT SI LA PERTE DE LA CARGAISON EST ÉVITABLE.',
    ],
    prompt: 'Que réponds-tu ?',
    choices: [
      {
        label: 'Rappeler que la cargaison, c’est aussi la créature.',
        next: 'verdict',
        effects: { value: 1 },
      },
      {
        label: 'Joindre l’état de santé de l’équipage en pièce jointe.',
        next: 'verdict',
        effects: { cred: 1 },
      },
      {
        label: 'Dire que le règlement les oblige à répondre.',
        next: 'verdict',
        effects: { heat: 1 },
      },
    ],
  },
  menace: {
    speaker: 'company',
    lines: [
      'MENACE ENREGISTRÉE. DOSSIER TRANSMIS AU SERVICE JURIDIQUE.',
      'LIAISON SOUS SURVEILLANCE.',
    ],
    prompt: 'Que fais-tu ?',
    choices: [
      {
        label: 'Retirer la menace et présenter des excuses.',
        next: 'verdict',
        effects: { heat: -1 },
      },
      {
        label: 'Maintenir la menace et exiger une réponse.',
        next: 'verdict',
        effects: { heat: 1 },
      },
    ],
  },
  aveu: {
    speaker: 'company',
    lines: ['CONTRADICTION DÉTECTÉE.', 'CRÉDIBILITÉ DE LA SOURCE : FAIBLE.'],
    prompt: 'Que fais-tu ?',
    choices: [
      {
        label: 'Joindre les enregistrements de bord comme preuve.',
        next: 'verdict',
        effects: { cred: 2 },
      },
      {
        label: 'Supplier encore une fois.',
        next: 'verdict',
      },
    ],
  },
  pieces: {
    speaker: 'company',
    lines: ['PIÈCES PRÉVUES À LA PROCHAINE ESCALE.', 'FIN DE LA TRANSMISSION.'],
    prompt: 'Que fais-tu ?',
    choices: [
      {
        label: 'Insister : il y a un organisme à bord.',
        next: 'verdict',
        effects: { cred: -1, value: 1 },
      },
      {
        label: 'Remercier et couper la liaison.',
        next: 'end:renoncement',
      },
    ],
  },
  echec: {
    speaker: 'company',
    lines: [
      'SUPPLICATION NON PRISE EN COMPTE.',
      'PRÉCISER LA NATURE DU SERVICE DEMANDÉ.',
    ],
    prompt: 'Que réponds-tu ?',
    choices: [
      {
        label: 'Demander une équipe de secours.',
        next: 'verdict',
      },
      {
        label: 'Décrire la créature en détail.',
        next: 'verdict',
        effects: { cred: 1, value: 1 },
      },
    ],
  },
};

export const endings: Record<string, Ending> = {
  aide_acceptee: {
    result: 'win',
    title: 'AIDE ACCEPTÉE',
    lines: [
      'COMPAGNIE : DEMANDE APPROUVÉE. UN VAISSEAU DE SECOURS EST DÉPÊCHÉ.',
      'MU/TH/UR : ARRIVÉE ESTIMÉE DANS 41 JOURS.',
      'Tu as tenu la ligne jusqu’au bout et la Compagnie a cédé. Il reste à survivre jusque-là.',
    ],
  },
  aide_interessee: {
    result: 'win',
    title: 'AIDE ACCEPTÉE, À UN PRIX',
    lines: [
      'COMPAGNIE : MISSION DE RÉCUPÉRATION APPROUVÉE. L’ÉQUIPAGE SERA PRIS EN CHARGE SI LES CONDITIONS SONT RESPECTÉES.',
      'Tu as obtenu de l’aide, mais pas par bonté : ils viennent pour la créature. À toi de faire en sorte que ça serve aussi à l’équipage.',
    ],
  },
  refus: {
    result: 'lose',
    title: 'DEMANDE REFUSÉE',
    lines: [
      'COMPAGNIE : DEMANDE REFUSÉE. COÛT SUPÉRIEUR AU BÉNÉFICE ATTENDU.',
      'Personne ne viendra. Il faudra s’en sortir seul.',
    ],
  },
  banni: {
    result: 'lose',
    title: 'LIAISON COUPÉE',
    lines: [
      'COMPAGNIE : PROTOCOLE DE SILENCE ACTIVÉ.',
      'Tu as poussé trop loin. Plus aucun message ne passe.',
    ],
  },
  coupure: {
    result: 'lose',
    title: 'SIGNAL PERDU',
    lines: [
      'Le dernier message est parti sans réponse.',
      'L’antenne ne capte plus rien.',
    ],
  },
  renoncement: {
    result: 'lose',
    title: 'LIAISON ABANDONNÉE',
    lines: [
      'Tu coupes la liaison.',
      'Tu es seul avec ce qui rôde dans les couloirs.',
    ],
  },
};

export function start(): GameState {
  return {
    node: 'ouverture',
    cred: 0,
    value: 0,
    heat: 0,
    signal: START_SIGNAL,
  };
}

// Règle de décision de la Compagnie, une fois l'argumentaire terminé.
export function resolveVerdict(s: GameState): string {
  if (s.heat >= MAX_HEAT) return 'banni';
  if (s.cred >= 3 && s.value >= 2 && s.heat <= 2) return 'aide_acceptee';
  if (s.value >= 3 && s.heat <= 3) return 'aide_interessee';
  return 'refus';
}

export function choose(state: GameState, index: number): GameState {
  if (state.ending) return state;
  const choice = nodes[state.node]?.choices[index];
  if (!choice) return state;
  const e = choice.effects ?? {};
  const next: GameState = {
    ...state,
    cred: state.cred + (e.cred ?? 0),
    value: state.value + (e.value ?? 0),
    heat: state.heat + (e.heat ?? 0),
    signal: state.signal - 1,
  };
  if (choice.next.startsWith('end:'))
    return { ...next, ending: choice.next.slice(4) };
  if (next.heat >= MAX_HEAT) return { ...next, ending: 'banni' };
  if (choice.next === 'verdict')
    return { ...next, ending: resolveVerdict(next) };
  if (next.signal <= 0) return { ...next, ending: 'coupure' };
  return { ...next, node: choice.next };
}
