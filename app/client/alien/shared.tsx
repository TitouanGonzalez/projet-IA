import {
  useCallback,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import type { CardIcon } from '../../shared/cards.js';

// Portraits facultatifs : il suffit de déposer un fichier nommé comme le dossier
// (ripley.jpg, xenomorphe.png, ash.webp...) dans app/client/alien/images/.
const photos = import.meta.glob('./images/*.{jpg,jpeg,png,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;
// Cadrage des portraits (object-position), pour garder le visage dans la carte.
export const focus: Record<string, string> = {
  ripley: '50% 50%',
  xenomorphe: '50% 50%',
  ash: '50% 50%',
  bishop: '50% 50%',
  jonesy: '50% 50%',
  mother: '50% 50%',
};
export function photoFor(id: string): string | undefined {
  for (const [path, url] of Object.entries(photos))
    if (
      path
        .split('/')
        .pop()!
        .replace(/\.[^.]+$/, '') === id
    )
      return url;
  return undefined;
}

export function reducedMotion(): boolean {
  try {
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function Icon({ kind }: { kind: CardIcon }) {
  const paths: Record<CardIcon, ReactNode> = {
    visor: (
      <>
        <path d="M14 44V30C14 18 22 10 32 10s18 8 18 20v14" />
        <path d="M14 44h36" />
        <rect x="20" y="26" width="24" height="10" rx="2" />
        <path d="M26 44v8M38 44v8" />
      </>
    ),
    creature: (
      <>
        <path d="M6 42C12 22 28 12 58 14c-4 12-12 20-24 22l-6 12-7-7-14 3z" />
        <path d="M30 26l16-3M30 31l14 0" />
      </>
    ),
    android: (
      <>
        <circle cx="32" cy="28" r="16" />
        <path d="M23 26h18M23 32h18M32 44v10M22 54h20" />
      </>
    ),
    synthetic: (
      <>
        <rect x="16" y="10" width="32" height="34" rx="4" />
        <path d="M22 22h20M22 28h20M22 34h12M32 44v10M20 54h24" />
      </>
    ),
    cat: (
      <>
        <path d="M12 14l9 10h22l9-10v30c0 8-9 12-20 12S12 52 12 44z" />
        <circle cx="25" cy="34" r="2" />
        <circle cx="39" cy="34" r="2" />
        <path d="M29 43l3 3 3-3M32 46v5" />
      </>
    ),
    terminal: (
      <>
        <rect x="8" y="12" width="48" height="32" rx="3" />
        <path d="M16 22l8 6-8 6M30 36h16M24 54h16M32 44v10" />
      </>
    ),
    queen: (
      <>
        <path d="M6 44C10 24 24 12 42 10l10 6-6 8 8 10-14 2-6 14-8-8-14 2z" />
        <path d="M24 10l4-6M32 10l4-6M40 10l4-6" />
      </>
    ),
    child: (
      <>
        <circle cx="32" cy="26" r="13" />
        <path d="M18 14c4-6 24-6 28 0M22 52c2-8 18-8 20 0M26 28h2M36 28h2M29 34c2 2 4 2 6 0" />
      </>
    ),
    officer: (
      <>
        <circle cx="32" cy="26" r="13" />
        <path d="M16 18h32M20 18c2-8 22-8 24 0M22 54c2-10 18-10 20 0M27 28h2M35 28h2" />
      </>
    ),
    marine: (
      <>
        <path d="M14 38V28C14 16 22 8 32 8s18 8 18 20v10z" />
        <path d="M14 38h36M22 24h20M32 8v10M24 38v10h16V38" />
      </>
    ),
    engineer: (
      <>
        <circle cx="32" cy="32" r="12" />
        <path d="M32 8v8M32 48v8M8 32h8M48 32h8M15 15l6 6M43 43l6 6M49 15l-6 6M21 43l-6 6" />
        <circle cx="32" cy="32" r="4" />
      </>
    ),
    suit: (
      <>
        <circle cx="32" cy="22" r="11" />
        <path d="M12 56c2-14 10-20 20-20s18 6 20 20M32 36l-4 8 4 12 4-12z" />
      </>
    ),
    egg: (
      <>
        <path d="M32 6C20 6 12 26 12 38c0 10 9 18 20 18s20-8 20-18C52 26 44 6 32 6z" />
        <path d="M22 18l10 8 10-8M32 26v22" />
      </>
    ),
    facehugger: (
      <>
        <ellipse cx="32" cy="30" rx="12" ry="9" />
        <path d="M20 32L6 44M24 36L12 54M44 32l14 12M40 36l12 18M32 39c0 8 4 14 12 16" />
      </>
    ),
    chestburster: (
      <>
        <path d="M12 52c4-8 14-10 22-6 8 4 12-2 14-12 2-8-2-14-8-14s-10 6-6 12" />
        <circle cx="42" cy="24" r="2" />
        <path d="M40 30l4 1M38 33l5 1" />
      </>
    ),
    rifle: (
      <>
        <path d="M4 34h40l4-8h10v14H44l-4 8H24v-8H4z" />
        <path d="M26 44v10M10 34v-6h8" />
      </>
    ),
    tracker: (
      <>
        <path d="M32 54L12 18C22 6 42 6 52 18z" />
        <path d="M22 28c6-4 14-4 20 0M26 38c4-3 8-3 12 0" />
        <circle cx="38" cy="22" r="2" />
      </>
    ),
    shuttle: (
      <>
        <path d="M8 36l22-18 26 8-4 12-14 8H18z" />
        <path d="M30 18v26M18 44l-8 10M46 38l8 10" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 64 64"
      className="al-icon"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[kind]}
    </svg>
  );
}

// Inclinaison 3D qui suit la souris. On écrit directement dans le style : pas de rendu React
// à chaque mouvement.
export function useTilt<T extends HTMLElement>(max = 14) {
  const ref = useRef<T>(null);
  const still = useRef(reducedMotion());
  const onMove = useCallback(
    (e: ReactPointerEvent<T>) => {
      const el = ref.current;
      if (!el || still.current) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.setProperty('--ry', `${(px - 0.5) * max * 2}deg`);
      el.style.setProperty('--rx', `${-(py - 0.5) * max * 2}deg`);
      el.style.setProperty('--gx', `${px * 100}%`);
      el.style.setProperty('--gy', `${py * 100}%`);
      el.dataset.tilt = 'on';
    },
    [max],
  );
  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--ry', '0deg');
    el.style.setProperty('--rx', '0deg');
    el.dataset.tilt = 'off';
  }, []);
  return { ref, onPointerMove: onMove, onPointerLeave: onLeave };
}
