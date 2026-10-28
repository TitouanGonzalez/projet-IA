// Logique pure du détecteur de mouvement : un éventail de 84 degrés, dont le sommet est en bas.
// Aucune dépendance au navigateur, donc testable. Les contacts sont en coordonnées polaires.
export const TRK_W = 560;
export const TRK_H = 480;
export const APEX = { x: 280, y: 440 };
export const RADIUS = 400;
export const HALF = (42 * Math.PI) / 180;
export const METERS = 30;

export interface Contact {
  r: number; // 0 à 1 (fraction du rayon)
  a: number; // angle en radians, de -HALF à +HALF
  vr: number;
  va: number;
  seen: number; // 0 à 1, visibilité sur l'écran
}
export interface Point {
  x: number;
  y: number;
}
export type Proximity = 'far' | 'suspect' | 'close';

export function toXY(r: number, a: number): Point {
  return {
    x: APEX.x + Math.sin(a) * r * RADIUS,
    y: APEX.y - Math.cos(a) * r * RADIUS,
  };
}

export function insideFan(p: Point): boolean {
  const dx = p.x - APEX.x;
  const dy = APEX.y - p.y;
  if (dy < 0) return false;
  if (Math.hypot(dx, dy) > RADIUS) return false;
  return Math.abs(Math.atan2(dx, dy)) <= HALF;
}

// Ramène un point dans l'éventail (utile pour la sonde pilotée au clavier).
export function clampToFan(p: Point): Point {
  const dx = p.x - APEX.x;
  const dy = Math.max(0, APEX.y - p.y);
  let dist = Math.hypot(dx, dy);
  let angle = Math.atan2(dx, dy);
  angle = Math.max(-HALF, Math.min(HALF, angle));
  dist = Math.min(RADIUS, dist);
  return {
    x: APEX.x + Math.sin(angle) * dist,
    y: APEX.y - Math.cos(angle) * dist,
  };
}

export function makeContacts(rng: () => number, count = 4): Contact[] {
  return Array.from({ length: count }, () => ({
    r: 0.2 + rng() * 0.72,
    a: (rng() * 2 - 1) * HALF * 0.9,
    vr: (rng() * 2 - 1) * 0.035,
    va: (rng() * 2 - 1) * 0.05,
    seen: 0,
  }));
}

// Les contacts dérivent lentement et rebondissent sur les bords de l'éventail.
export function stepContacts(
  contacts: Contact[],
  dt: number,
  rng: () => number,
): Contact[] {
  return contacts.map((c) => {
    let { r, a, vr, va } = c;
    r += vr * dt;
    a += va * dt;
    if (r < 0.12 || r > 0.95) {
      vr = -vr;
      r = Math.max(0.12, Math.min(0.95, r));
    }
    if (Math.abs(a) > HALF * 0.92) {
      va = -va;
      a = Math.max(-HALF * 0.92, Math.min(HALF * 0.92, a));
    }
    if (rng() < dt * 0.15) {
      vr += (rng() * 2 - 1) * 0.01;
      va += (rng() * 2 - 1) * 0.015;
    }
    return { ...c, r, a, vr, va, seen: Math.max(0, c.seen - dt / 2.4) };
  });
}

export function sweepAngle(time: number, period = 5): number {
  return Math.sin((time * Math.PI * 2) / period) * HALF;
}

// Un contact devient visible quand la ligne de balayage le traverse, ou pendant une impulsion.
export function reveal(
  contacts: Contact[],
  from: number,
  to: number,
  ping: boolean,
): Contact[] {
  const lo = Math.min(from, to) - 0.03;
  const hi = Math.max(from, to) + 0.03;
  return contacts.map((c) =>
    ping || (c.a >= lo && c.a <= hi) ? { ...c, seen: 1 } : c,
  );
}

export function meters(probe: Point, c: Contact): number {
  const p = toXY(c.r, c.a);
  return (Math.hypot(probe.x - p.x, probe.y - p.y) / RADIUS) * METERS;
}

export function nearest(
  contacts: Contact[],
  probe: Point,
): { index: number; meters: number } | null {
  let best: { index: number; meters: number } | null = null;
  contacts.forEach((c, index) => {
    const m = meters(probe, c);
    if (!best || m < best.meters) best = { index, meters: m };
  });
  return best;
}

export function classify(m: number): Proximity {
  if (m < 4) return 'close';
  if (m < 10) return 'suspect';
  return 'far';
}

// Délai entre deux bips, en secondes : plus on est près, plus ça accélère.
export function beepEvery(m: number): number {
  return Math.max(0.12, Math.min(1.6, 0.12 + m * 0.06));
}

export function beepPitch(m: number): number {
  const near = 1 - Math.min(m, METERS) / METERS;
  return 520 + near * 900;
}

export const proximityText: Record<Proximity, string> = {
  far: 'Aucun contact proche.',
  suspect: 'Contact suspect, rapproche-toi.',
  close: 'Contact très proche.',
};
