import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { bootLines, dossiers, type Dossier } from './data.js';
import { createSoundtrack, type SoundKind, type Soundtrack } from './audio.js';
import Ovomorph from './Ovomorph.js';

type Sfx = (kind: SoundKind) => void;

// Portraits facultatifs : il suffit de déposer un fichier nommé comme le dossier
// (ripley.jpg, xenomorphe.png, ash.webp...) dans app/client/alien/images/.
const photos = import.meta.glob('./images/*.{jpg,jpeg,png,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;
// Cadrage des portraits (object-position), pour garder le visage dans la carte.
const focus: Record<string, string> = {
  ripley: '50% 18%',
  xenomorphe: '40% 45%',
  ash: '58% 30%',
  bishop: '50% 28%',
  jonesy: '72% 55%',
  mother: '50% 50%',
};
function photoFor(id: string): string | undefined {
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

function reducedMotion(): boolean {
  try {
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

function Icon({ kind }: { kind: Dossier['icon'] }) {
  const paths: Record<Dossier['icon'], ReactNode> = {
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

// Écrit les lignes de démarrage lettre par lettre, comme un terminal.
function useTypewriter(lines: string[], speed = 34) {
  const total = lines.reduce((n, l) => n + l.length + 1, 0);
  const [count, setCount] = useState(reducedMotion() ? total : 0);
  useEffect(() => {
    if (count >= total) return;
    const id = window.setTimeout(() => setCount((c) => c + 1), speed);
    return () => window.clearTimeout(id);
  }, [count, total, speed]);
  const out: string[] = [];
  let left = count;
  for (const line of lines) {
    if (left <= 0) break;
    out.push(line.slice(0, left));
    left -= line.length + 1;
  }
  return { out, done: count >= total };
}

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 10000);
    return () => window.clearInterval(id);
  }, []);
  const time = now.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const date = now
    .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
    .toUpperCase();
  return { time, date };
}

function Hud({ lines, session }: { lines: string[]; session: string }) {
  const { time, date } = useClock();
  return (
    <>
      <div className="al-hud al-hud-left" aria-hidden="true">
        {lines.map((l, i) => (
          <p key={i}>{l}</p>
        ))}
      </div>
      <div className="al-hud al-hud-right" aria-hidden="true">
        <p>{`// ${time}`}</p>
        <p>{`// ${date}`}</p>
        <p>{`// SESSION ${session}`}</p>
      </div>
    </>
  );
}

// Curseur rouge façon terminal. Il vient en plus du curseur système, caché seulement
// sur les écrans à souris.
function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const move = (e: PointerEvent) => {
      el.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      el.style.opacity = '1';
      const target = e.target as Element | null;
      el.classList.toggle(
        'is-link',
        !!target?.closest('button, a, [role="button"], canvas'),
      );
    };
    const leave = () => {
      el.style.opacity = '0';
    };
    window.addEventListener('pointermove', move);
    document.addEventListener('pointerleave', leave);
    return () => {
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerleave', leave);
    };
  }, []);
  return (
    <div className="al-cursor" ref={ref} aria-hidden="true">
      <svg viewBox="0 0 24 24" width="24" height="24">
        <path d="M2 2l18 9-8 2-3 8z" fill="currentColor" />
      </svg>
    </div>
  );
}

// Inclinaison 3D qui suit la souris. On écrit directement dans le style : pas de rendu React
// à chaque mouvement.
function useTilt<T extends HTMLElement>(max = 14) {
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

function DossierCard({
  d,
  onOpen,
  sfx,
}: {
  d: Dossier;
  onOpen: (d: Dossier, el: HTMLElement) => void;
  sfx: Sfx;
}) {
  const tilt = useTilt<HTMLButtonElement>(12);
  const photo = photoFor(d.id);
  return (
    <li className="al-cell">
      <button
        type="button"
        className="al-card"
        aria-haspopup="dialog"
        ref={tilt.ref}
        onPointerMove={tilt.onPointerMove}
        onPointerEnter={(e) => {
          if (e.pointerType === 'mouse') sfx('hover');
        }}
        onPointerLeave={tilt.onPointerLeave}
        onClick={(e) => onOpen(d, e.currentTarget)}
      >
        <span className="al-glare" aria-hidden="true" />
        <span className="al-card-top">
          <span>{d.code}</span>
          <span>{d.origin}</span>
        </span>
        <span className={`al-card-icon${photo ? ' has-photo' : ''}`}>
          {photo ? (
            <img
              className="al-photo"
              src={photo}
              alt=""
              style={{ objectPosition: focus[d.id] }}
            />
          ) : (
            <Icon kind={d.icon} />
          )}
        </span>
        <span className="al-card-name">{d.name}</span>
        <span className="al-card-role">{d.role}</span>
        <span className="al-card-open">OUVRIR LE DOSSIER +</span>
      </button>
    </li>
  );
}

function DossierDialog({ d, onClose }: { d: Dossier; onClose: () => void }) {
  const tilt = useTilt<HTMLDivElement>(7);
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        e.preventDefault();
        close.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div
      className="al-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="al-dossier-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="al-sheet"
        ref={tilt.ref}
        onPointerMove={tilt.onPointerMove}
        onPointerLeave={tilt.onPointerLeave}
      >
        <span className="al-glare" aria-hidden="true" />
        <div className="al-sheet-top">
          <span>{`${d.code} // ${d.origin}`}</span>
          <button
            type="button"
            className="al-close"
            ref={close}
            onClick={onClose}
          >
            FERMER [ESC]
          </button>
        </div>
        <div className="al-sheet-body">
          <div className="al-sheet-art" aria-hidden="true">
            {photoFor(d.id) ? (
              <img
                className="al-photo"
                src={photoFor(d.id)}
                alt=""
                style={{ objectPosition: focus[d.id] }}
              />
            ) : (
              <Icon kind={d.icon} />
            )}
          </div>
          <div className="al-sheet-text">
            <p className="al-status">{`STATUT : ${d.status}`}</p>
            <h2 id="al-dossier-title">{d.name}</h2>
            <p className="al-role">{d.role}</p>
            <p className="al-bio">{d.bio}</p>
            <ul className="al-stats">
              {d.stats.map((s) => (
                <li key={s.label}>
                  <span>{s.label}</span>
                  <div
                    className="al-meter"
                    role="meter"
                    aria-label={s.label}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={s.value}
                  >
                    <i style={{ '--v': `${s.value}%` } as CSSProperties} />
                  </div>
                  <b>{s.value}</b>
                </li>
              ))}
            </ul>
            <p className="al-fine">
              Jauges fictives, inventées pour cette page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AlienSite() {
  const [phase, setPhase] = useState<'intro' | 'site'>('intro');
  const [hot, setHot] = useState(false);
  const [open, setOpen] = useState<Dossier | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [soundOk, setSoundOk] = useState(true);
  const [section, setSection] = useState('ACCUEIL');
  const sound = useRef<Soundtrack | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const [session] = useState(() =>
    String(Math.floor(100000 + Math.random() * 900000)),
  );
  const [user] = useState(() => Math.floor(1000 + Math.random() * 9000));
  const intro = useTypewriter(bootLines);

  useEffect(() => {
    document.title = 'Nostromo · Dossiers de l’équipage';
    document.body.classList.add('al-body');
    return () => {
      document.body.classList.remove('al-body');
      sound.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (phase !== 'site') return;
    const ids: Record<string, string> = {
      accueil: 'ACCUEIL',
      dossiers: 'DOSSIERS',
    };
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) setSection(ids[e.target.id] ?? 'ACCUEIL');
      },
      { threshold: 0.5 },
    );
    for (const id of Object.keys(ids)) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [phase]);

  const enter = () => {
    try {
      const s = createSoundtrack();
      sound.current = s;
      if (s) {
        s.setOn(true);
        setSoundOn(true);
      } else setSoundOk(false);
    } catch {
      setSoundOk(false);
    }
    setPhase('site');
  };
  const sfx = useCallback<Sfx>((kind) => sound.current?.play(kind), []);
  const toggleSound = () => {
    const s = sound.current;
    if (!s) return;
    if (s.on) s.play('click');
    s.setOn(!s.on);
    if (s.on) s.play('click');
    setSoundOn(s.on);
  };
  const go = (id: string) => {
    sfx('click');
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' });
  };
  // Son de survol des boutons à la souris seulement (pas au clavier ni au toucher).
  const hover = {
    onPointerEnter: (e: ReactPointerEvent) => {
      if (e.pointerType === 'mouse') sfx('hover');
    },
  };
  const openDossier = (d: Dossier, el: HTMLElement) => {
    trigger.current = el;
    sfx('open');
    setOpen(d);
  };
  const closeDossier = useCallback(() => {
    sfx('close');
    setOpen(null);
    trigger.current?.focus();
  }, [sfx]);

  if (phase === 'intro') {
    return (
      <div className="al-root al-intro" data-phase="intro">
        <div className="al-fog" aria-hidden="true" />
        <div className="al-scan" aria-hidden="true" />
        <Cursor />
        <p className="al-logo" aria-hidden="true">
          NOSTROMO
        </p>
        <main className="al-intro-main">
          <svg
            viewBox="0 0 64 64"
            className="al-dish"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            aria-hidden="true"
          >
            <path d="M8 20c2 16 14 24 24 24s22-8 24-24z" />
            <path d="M32 20V8M30 8h4M26 44l-4 12h20l-4-12" />
            <circle cx="32" cy="50" r="2" />
          </svg>
          <h1 className="al-sr">Nostromo, dossiers de l’équipage</h1>
          <button type="button" className="al-btn" autoFocus onClick={enter}>
            ENTER
          </button>
        </main>
        <Hud lines={intro.out} session={session} />
      </div>
    );
  }

  return (
    <div className="al-root" data-phase="site">
      <div className="al-fog" aria-hidden="true" />
      <div className="al-scan" aria-hidden="true" />
      <Cursor />
      <header className="al-header">
        <button
          type="button"
          className="al-logo"
          onClick={() => go('accueil')}
          aria-label="Nostromo, retour en haut"
        >
          NOSTROMO
        </button>
        <nav aria-label="Navigation" className="al-nav">
          <button type="button" onClick={() => go('dossiers')} {...hover}>
            :DOSSIERS
          </button>
          <button type="button" onClick={() => go('apropos')} {...hover}>
            :À PROPOS
          </button>
          <button
            type="button"
            className="al-sound"
            aria-pressed={soundOn}
            disabled={!soundOk}
            onClick={toggleSound}
            {...hover}
          >
            {soundOk ? `SOUND: ${soundOn ? 'ON' : 'OFF'}` : 'SOUND: N/A'}
          </button>
        </nav>
      </header>

      <main>
        <section id="accueil" className="al-hero">
          <p className="al-ghost" aria-hidden="true">
            NOSTROMO
          </p>
          <Ovomorph hot={hot} />
          <h1 className="al-sr">Nostromo, dossiers de l’équipage</h1>
          <button
            type="button"
            className="al-btn al-hero-left"
            onClick={() => go('dossiers')}
            onPointerEnter={(e) => {
              setHot(true);
              hover.onPointerEnter(e);
            }}
            onPointerLeave={() => setHot(false)}
            onFocus={() => setHot(true)}
            onBlur={() => setHot(false)}
          >
            DÉCOUVRIR
          </button>
          <button
            type="button"
            className="al-btn al-hero-right"
            onClick={() => go('apropos')}
            onPointerEnter={(e) => {
              setHot(true);
              hover.onPointerEnter(e);
            }}
            onPointerLeave={() => setHot(false)}
            onFocus={() => setHot(true)}
            onBlur={() => setHot(false)}
          >
            À PROPOS
          </button>
        </section>

        <section id="dossiers" className="al-section">
          <p className="al-eyebrow">{'// DOSSIERS DE L’ÉQUIPAGE'}</p>
          <h2 className="al-h2">Six dossiers, un seul vol.</h2>
          <p className="al-lead">
            Ouvre un dossier pour lire la fiche. La carte suit ta souris.
          </p>
          <ul className="al-grid">
            {dossiers.map((d) => (
              <DossierCard key={d.id} d={d} onOpen={openDossier} sfx={sfx} />
            ))}
          </ul>
        </section>
      </main>

      <footer id="apropos" className="al-footer">
        <p>
          Page de fan réalisée pour un exercice de design interactif. Alien et
          ses personnages appartiennent à 20th Century Studios. Textes
          originaux, sans extrait du film. Les portraits sont des images tirées
          des films, propriété de leurs ayants droit, montrées ici à titre
          d’illustration pour une présentation privée.
        </p>
        <p>
          La musique est générée en direct dans ton navigateur. Le fil de fer 3D
          est dessiné à la main sur un canvas.
        </p>
      </footer>

      <Hud
        lines={[`WELCOME USER ${user}`, 'NAV', `> NOSTROMO | ${section}`]}
        session={session}
      />
      {open && <DossierDialog d={open} onClose={closeDossier} />}
    </div>
  );
}
