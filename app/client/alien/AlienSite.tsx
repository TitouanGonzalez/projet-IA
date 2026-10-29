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
import { CollectionView, PackOpening, useCollection } from './Cards.js';
import MuthurTerminal from './MuthurTerminal.js';
import Ovomorph from './Ovomorph.js';
import CrewScan from './CrewScan.js';
import ScrollTunnel from './ScrollTunnel.js';
import { BoardLog, useBoardLog } from './BoardLog.js';
import type { LogSection } from '../../shared/boardlog.js';
import { useScenes } from './useScenes.js';
import { Icon, photoFor, focus, reducedMotion, useTilt } from './shared.js';

type Sfx = (kind: SoundKind) => void;

// Nom de la scène affiché dans les repères, selon l'identifiant de la section.
const SECTION_NAMES: Record<string, string> = {
  accueil: 'ACCUEIL',
  dossiers: 'DOSSIERS',
  terminal: 'TERMINAL',
  collection: 'COLLECTION',
  apropos: 'À PROPOS',
};

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
      if (e.pointerType !== 'mouse') {
        el.style.opacity = '0';
        return;
      }
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [depthOn] = useState(() => !reducedMotion());
  const sound = useRef<Soundtrack | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const coll = useCollection();
  const beepLine = useCallback(() => sound.current?.beep(330), []);
  const logSection = ({
    ACCUEIL: 'accueil',
    DOSSIERS: 'dossiers',
    TERMINAL: 'terminal',
    COLLECTION: 'collection',
    'À PROPOS': 'apropos',
  }[section] ?? 'accueil') as LogSection;
  const log = useBoardLog(logSection, phase === 'site', beepLine);
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

  // Mode scènes : chaque section est une scène plein écran, le défilement avance dans le couloir.
  const scenes = useScenes(phase === 'site' && depthOn, (id) =>
    setSection(SECTION_NAMES[id] ?? 'ACCUEIL'),
  );

  // Sans le mode scènes (mouvements réduits) : page classique, avec repères et titres révélés.
  useEffect(() => {
    if (
      phase !== 'site' ||
      depthOn ||
      typeof IntersectionObserver === 'undefined'
    )
      return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting)
            setSection(SECTION_NAMES[e.target.id] ?? 'ACCUEIL');
      },
      { threshold: 0.5 },
    );
    for (const id of Object.keys(SECTION_NAMES)) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [phase, depthOn]);

  // Échap referme le menu des petits écrans.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

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
    log.event('enter');
  };
  const sfx = useCallback<Sfx>((kind) => sound.current?.play(kind), []);
  const beep = useCallback((freq: number) => sound.current?.beep(freq), []);
  const { event: logEvent, say: logSay } = log;
  const chime = useCallback(
    (level: number) => {
      sound.current?.chime(level);
      if (level >= 5) logEvent('legendary');
    },
    [logEvent],
  );
  const toggleSound = () => {
    const s = sound.current;
    if (!s) return;
    if (s.on) s.play('click');
    s.setOn(!s.on);
    if (s.on) s.play('click');
    setSoundOn(s.on);
  };
  const go = (id: string) => {
    setMenuOpen(false);
    sfx('click');
    const el = document.getElementById(id);
    if (!el) return;
    const behavior = reducedMotion() ? 'auto' : 'smooth';
    const y = depthOn ? scenes.scrollFor(el) : null;
    if (y !== null) window.scrollTo({ top: y, behavior });
    else el.scrollIntoView({ behavior });
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
    logEvent('dossier');
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
          <CrewScan active={intro.done} />
          <button type="button" className="al-btn" autoFocus onClick={enter}>
            ENTER
          </button>
        </main>
        <Hud lines={intro.out} session={session} />
      </div>
    );
  }

  return (
    <div className={`al-root${depthOn ? ' al-depth' : ''}`} data-phase="site">
      <ScrollTunnel />
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
        <button
          type="button"
          className="al-burger"
          aria-expanded={menuOpen}
          aria-controls="al-nav"
          onClick={() => {
            sfx('click');
            setMenuOpen((o) => !o);
          }}
        >
          {menuOpen ? 'FERMER' : 'MENU'}
        </button>
        <nav
          id="al-nav"
          aria-label="Navigation"
          className={`al-nav${menuOpen ? ' is-open' : ''}`}
        >
          <button type="button" onClick={() => go('dossiers')} {...hover}>
            :DOSSIERS
          </button>
          <button type="button" onClick={() => go('terminal')} {...hover}>
            :TERMINAL
          </button>
          <button type="button" onClick={() => go('collection')} {...hover}>
            :COLLECTION
            {coll.c.eggs > 0 && (
              <span className="al-badge" aria-label={`${coll.c.eggs} œufs`}>
                {coll.c.eggs}
              </span>
            )}
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
        <section id="accueil" className="al-hero al-scene" data-scene>
          <p className="al-ghost" aria-hidden="true">
            NOSTROMO
          </p>
          <Ovomorph hot={hot} reactive />
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

        <section id="dossiers" className="al-section al-scene" data-scene>
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

        <section
          id="terminal"
          className="al-section al-term-section al-scene"
          data-scene
        >
          <p className="al-eyebrow">{'// TERMINAL MU/TH/UR'}</p>
          <h2 className="al-h2">Appelle la Compagnie.</h2>
          <p className="al-lead">
            Tu as six messages pour la convaincre d’envoyer de l’aide. Tu
            réponds en cliquant sur une phrase, et pour les deux derniers
            messages tu peux aussi écrire le tien. Chaque réponse change sa
            crédibilité, son intérêt et son irritation. Si elle accepte, tu
            gagnes. Sinon, personne ne viendra.
          </p>
          <MuthurTerminal beep={beep} sfx={sfx} />
        </section>

        <section
          id="collection"
          className="al-section al-pack-section al-scene"
          data-scene
        >
          <p className="al-eyebrow">{'// ŒUFS ET COLLECTION'}</p>
          <h2 className="al-h2">Ouvre un œuf.</h2>
          <p className="al-lead">
            Un nouvel œuf arrive toutes les 10 minutes, et tu peux en garder
            jusqu’à 10. Chacun cache une carte : commune, peu commune, rare,
            super rare ou légendaire. Retrouve toutes tes cartes dans la
            collection.
          </p>
          <PackOpening
            api={coll}
            sfx={sfx}
            chime={chime}
            onSeeCollection={() => go('cartes')}
          />
          <div id="cartes" className="al-coll-block">
            <h3 className="al-h3">Ta collection</h3>
            <CollectionView api={coll} />
          </div>
        </section>
      </main>

      <footer id="apropos" className="al-footer al-scene" data-scene>
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
      <div ref={scenes.spacer} className="al-spacer" aria-hidden="true" />

      <BoardLog lines={log.lines} shown={log.shown} onToggle={log.toggle} />
      <Hud
        lines={[`WELCOME USER ${user}`, 'NAV', `> NOSTROMO | ${section}`]}
        session={session}
      />
      {open && <DossierDialog d={open} onClose={closeDossier} />}
    </div>
  );
}
