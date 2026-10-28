// Effets liés au défilement : couloir du vaisseau en fond, œuf de l'accueil. Calculs purs
// (aucun accès au navigateur), pour pouvoir les tester.
export const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

// Rapproche progressivement une valeur de sa cible. Le résultat ne dépasse jamais la cible,
// même si le temps écoulé est grand (onglet resté en arrière-plan).
export function follow(
  current: number,
  target: number,
  dt: number,
  rate: number,
): number {
  const k = clamp01(dt * rate);
  return current + (target - current) * k;
}

// Vitesse de défilement en pixels par seconde, jamais négative ni infinie.
export function scrollSpeed(prevY: number, y: number, dt: number): number {
  if (!(dt > 0)) return 0;
  return Math.abs(y - prevY) / dt;
}

// Intensité des traînées, de 0 (immobile) à 1 (défilement très rapide). Elle sature en douceur.
export function streak(speed: number): number {
  const v = Math.max(0, speed);
  return 1 - Math.exp(-v / 1400);
}

// Avancement dans la section d'accueil : 0 en haut de la page, 1 quand l'accueil est passé.
export function heroProgress(scrollY: number, heroHeight: number): number {
  if (!(heroHeight > 0)) return 0;
  return clamp01(scrollY / heroHeight);
}

export interface EggPose {
  open: number; // ouverture des pétales
  spin: number; // vitesse de rotation ajoutée, en radians par seconde
  scale: number;
  opacity: number;
  lift: number; // décalage vertical, en part de la hauteur du canvas
}

// L'œuf s'ouvre en grand, tourne plus vite, grossit un peu, puis s'efface en remontant.
export function eggFromScroll(p: number): EggPose {
  const t = clamp01(p);
  return {
    open: 0.1 + 1.1 * Math.min(1, t * 1.6),
    spin: 2.4 * t,
    scale: 1 + 0.35 * t,
    opacity: 1 - 0.95 * Math.max(0, (t - 0.35) / 0.65),
    lift: -0.18 * t,
  };
}

// Couloir : des anneaux répartis en profondeur, qui défilent vers la caméra.
export const RING_SPACING = 140;
export const FOCAL = 520;

// Distance d'un anneau à la caméra. L'anneau numéro k reste à la même place du monde, et la
// distance se « replie » pour que le couloir paraisse infini.
export function ringDistance(k: number, cam: number, rings: number): number {
  const length = rings * RING_SPACING;
  const raw = (k * RING_SPACING - cam) % length;
  return raw < 0 ? raw + length : raw;
}

// Échelle de perspective : 1 au plus près, de plus en plus petit en s'éloignant.
export function ringScale(distance: number): number {
  return FOCAL / (FOCAL + Math.max(0, distance));
}

// Opacité d'un anneau : invisible très près (il sortirait de l'écran) et très loin.
export function ringAlpha(distance: number, rings: number): number {
  const length = rings * RING_SPACING;
  const near = clamp01(distance / (RING_SPACING * 1.5));
  const far = clamp01(1 - distance / length);
  return near * Math.pow(far, 1.4);
}

// Position de la caméra : avance avec le défilement, et dérive doucement même à l'arrêt.
export function cameraAt(scrollY: number, seconds: number, still: boolean) {
  return scrollY * 1.4 + (still ? 0 : seconds * 24);
}

export interface DepthPose {
  scale: number;
  opacity: number;
  // Décalage vertical en pixels (négatif : la section est retenue en haut de l'écran).
  shiftY: number;
  // Point d'origine de l'échelle : le centre de l'écran, vu depuis le haut de la section.
  originY: number;
  // Vrai quand la section est à sa place normale (aucune transformation à appliquer).
  atRest: boolean;
  // Vrai quand on peut cliquer dedans (elle est arrivée, et pas encore en train de s'effacer).
  interactive: boolean;
}

// Espace vide entre deux sections, en part de la hauteur d'écran : on ne voit que le couloir.
export const GATE = 0.6;

const smooth = (t: number): number => t * t * (3 - 2 * t);

// On avance dans le couloir, la section ne glisse pas vers le haut : elle reste en place en haut de
// l'écran et surgit du fond (petite et transparente, elle grandit jusqu'à sa taille normale), puis
// elle est relâchée et défile normalement. En sortant par le haut elle fonce vers nous : elle
// grossit et s'efface. top et bottom sont les bords de la section par rapport au haut de l'écran
// (sans tenir compte de la transformation), vh la hauteur de l'écran.
export function depthPose(top: number, bottom: number, vh: number): DepthPose {
  if (!(vh > 0))
    return {
      scale: 1,
      opacity: 1,
      shiftY: 0,
      originY: 0,
      atRest: true,
      interactive: true,
    };
  const entering = smooth(clamp01((vh - top) / (vh * 0.7)));
  const leaving = clamp01((vh * 0.4 - bottom) / (vh * 0.4));
  // Tant que le haut de la section n'a pas atteint le haut de l'écran, elle y reste retenue.
  const pinned = top > 0 && top < vh;
  const shiftY = pinned ? -top : 0;
  const renderedTop = pinned ? 0 : top;
  return {
    scale: (0.35 + 0.65 * entering) * (1 + 0.35 * leaving),
    opacity: entering * (1 - leaving),
    shiftY,
    originY: vh / 2 - renderedTop,
    atRest: top <= 0 && entering >= 1 && leaving <= 0,
    interactive: entering >= 1 && leaving < 0.5,
  };
}
