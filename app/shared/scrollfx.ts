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

// Scènes plein écran : chaque section de la page est une scène fixe à l'écran. Le défilement ne
// fait plus glisser la page, il fait avancer dans le couloir : la scène courante fonce vers nous et
// s'efface pendant que la suivante surgit du fond. Une scène plus haute que l'écran se lit sur place
// (son contenu défile à l'intérieur) avant de passer à la suivante.
export interface Timeline {
  starts: number[]; // défilement auquel la scène est entièrement arrivée
  ends: number[]; // défilement auquel elle commence à repartir
  reads: number[]; // hauteur de contenu à faire défiler à l'intérieur de la scène
  shifts: number[]; // décalage pour centrer les scènes plus basses que l'écran
  gate: number; // longueur de défilement pour qu'une scène parte, ou pour que la suivante arrive
  gap: number; // vide entre les deux, où l'on ne voit que le couloir
  total: number; // hauteur totale à donner à la page
}

const HOLD_FIRST = 0.35;
const HOLD = 0.2;
const HOLD_LAST = 0.1;
export const GATE = 0.7;
export const GAP = 0.6;

export function buildTimeline(heights: number[], vh: number): Timeline {
  const gate = GATE * vh;
  const gap = GAP * vh;
  const starts: number[] = [];
  const ends: number[] = [];
  const reads: number[] = [];
  const shifts: number[] = [];
  let cursor = 0;
  heights.forEach((h, i) => {
    const read = Math.max(0, h - vh);
    const hold =
      (i === 0 ? HOLD_FIRST : i === heights.length - 1 ? HOLD_LAST : HOLD) * vh;
    starts.push(cursor);
    reads.push(read);
    shifts.push(h < vh ? (vh - h) / 2 : 0);
    const end = cursor + read + hold;
    ends.push(end);
    cursor = end + 2 * gate + gap;
  });
  const last = ends.length > 0 ? ends[ends.length - 1] : 0;
  return { starts, ends, reads, shifts, gate, gap, total: last + vh };
}

export interface ScenePose {
  offset: number; // défilement interne, en pixels
  shift: number; // centrage vertical, en pixels
  scale: number;
  opacity: number;
  entering: number; // 0 loin dans le couloir, 1 arrivée
  leaving: number; // 0 en place, 1 passée derrière nous
  interactive: boolean;
}

const smooth = (n: number): number => n * n * (3 - 2 * n);

export function scenePose(i: number, y: number, t: Timeline): ScenePose {
  const gate = t.gate > 0 ? t.gate : 1;
  // La scène précédente part, puis un vide, puis celle-ci arrive : jamais deux scènes en même temps.
  const entering =
    i === 0 ? 1 : smooth(clamp01((y - t.ends[i - 1] - gate - t.gap) / gate));
  const leaving =
    i === t.ends.length - 1 ? 0 : smooth(clamp01((y - t.ends[i]) / gate));
  return {
    offset: Math.min(t.reads[i], Math.max(0, y - t.starts[i])),
    shift: t.shifts[i],
    scale: (0.35 + 0.65 * entering) * (1 + 0.6 * leaving),
    opacity: entering * (1 - leaving),
    entering,
    leaving,
    interactive: entering >= 0.999 && leaving <= 0.001,
  };
}

// Scène à afficher comme « courante » (pour les repères et le journal) : la première arrivée à
// moitié et pas encore à moitié repartie.
export function activeScene(y: number, t: Timeline): number {
  for (let i = 0; i < t.starts.length; i++) {
    const p = scenePose(i, y, t);
    if (p.entering >= 0.5 && p.leaving < 0.5) return i;
  }
  // Dans le vide entre deux scènes : on garde la dernière scène quittée.
  let last = 0;
  for (let i = 0; i < t.starts.length; i++) if (t.starts[i] <= y) last = i;
  return last;
}

// Défilement à atteindre pour amener un élément (à elTop pixels du haut de sa scène) sous
// l'en-tête, en restant dans la scène.
export function sceneScrollFor(
  t: Timeline,
  i: number,
  elTop: number,
  margin = 120,
): number {
  const offset = Math.min(t.reads[i], Math.max(0, elTop - margin));
  return t.starts[i] + offset;
}
