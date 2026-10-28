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
import MotionTracker from './MotionTracker.js';
import { CollectionView, PackOpening, useCollection } from './Cards.js';
import MuthurTerminal from './MuthurTerminal.js';
import Ovomorph from './Ovomorph.js';
import CrewScan from './CrewScan.js';
import ScrollTunnel from './ScrollTunnel.js';
import ShipMap from './ShipMap.js';
import { BoardLog, useBoardLog } from './BoardLog.js';
import {
  exploration,
  visit,
  type Room,
  type RoomId,
  type RoomTarget,
} from '../../shared/ship.js';
import type { LogSection } from '../../shared/boardlog.js';
import { depthPose } from '../../shared/scrollfx.js';
import { Icon, photoFor, focus, reducedMotion, useTilt } from './shared.js';

type Sfx = (kind: SoundKind) => void;

// Position d'un élément dans la page, sans tenir compte des transformations en cours (scrollIntoView
// viserait le rectangle déformé d'une section encore « loin dans le couloir »).
function layoutTop(el: HTMLElement): number {
  let top = 0;
  for (
    let n: HTMLElement | null = el;
    n;
    n = n.offsetParent as HTMLElement | null
  )
    top += n.offsetTop;
  return top;
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
  const [visited, setVisited] = useState<RoomId[]>([]);
  const beepLine = useCallback(() => sound.current?.beep(330), []);
  const logSection = ({
    ACCUEIL: 'accueil',
    DOSSIERS: 'dossiers',
    PLAN: 'plan',
    DÉTECTEUR: 'detecteur',
    TERMINAL: 'terminal',
    COLLECTION: 'collection',
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

  useEffect(() => {
    if (phase !== 'site') return;
    const ids: Record<string, string> = {
      accueil: 'ACCUEIL',
      dossiers: 'DOSSIERS',
      vaisseau: 'PLAN',
      detecteur: 'DÉTECTEUR',
      terminal: 'TERMINAL',
      collection: 'COLLECTION',
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

  // Les titres et les textes d'introduction se révèlent quand ils entrent à l'écran. Sans
  // mouvement (préférence système) ou sans IntersectionObserver, ils restent affichés tels quels.
  useEffect(() => {
    if (
      phase !== 'site' ||
      reducedMotion() ||
      typeof IntersectionObserver === 'undefined'
    )
      return;
    const items = Array.from(
      document.querySelectorAll<HTMLElement>(
        '.al-section .al-eyebrow, .al-section .al-h2, .al-section .al-lead',
      ),
    );
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
      },
      { threshold: 0.15 },
    );
    for (const el of items) {
      el.classList.add('al-rv');
      io.observe(el);
    }
    return () => {
      io.disconnect();
      for (const el of items) el.classList.remove('al-rv', 'is-in');
    };
  }, [phase]);

  // On avance dans le couloir : une section ne monte pas depuis le bas de l'écran, elle reste
  // retenue en haut et surgit du fond (petite et transparente, elle grandit), puis elle est relâchée
  // et défile normalement. En sortant par le haut elle fonce vers nous et s'efface. Une section posée
  // n'a aucune transformation (sinon ses éléments fixes et ses calculs de position seraient faussés).
  useEffect(() => {
    if (phase !== 'site' || !depthOn) return;
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>('main .al-section'),
    );
    const clear = (el: HTMLElement) => {
      el.style.transform = '';
      el.style.opacity = '';
      el.style.transformOrigin = '';
      el.style.pointerEvents = '';
    };
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      for (const el of sections) {
        const top = layoutTop(el) - window.scrollY;
        const pose = depthPose(top, top + el.offsetHeight, vh);
        if (pose.atRest) {
          clear(el);
        } else {
          el.style.transformOrigin = `50% ${Math.round(pose.originY)}px`;
          el.style.transform = `translateY(${Math.round(pose.shiftY)}px) scale(${pose.scale.toFixed(4)})`;
          el.style.opacity = pose.opacity.toFixed(3);
          el.style.pointerEvents = pose.interactive ? '' : 'none';
        }
      }
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    // Atteindre un élément au clavier dans une section encore « loin » : on va à la section.
    const onFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      const sec = target?.closest<HTMLElement>('main .al-section');
      if (sec && sec.style.pointerEvents === 'none')
        window.scrollTo({ top: layoutTop(sec), behavior: 'auto' });
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    document.addEventListener('focusin', onFocus);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('focusin', onFocus);
      for (const el of sections) clear(el);
    };
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
  const visitRoom = (room: Room) => {
    sfx('open');
    const next = visit(visited, room.id);
    setVisited(next);
    logSay(room.log);
    if (!visited.includes(room.id) && exploration(next).complete)
      window.setTimeout(() => logEvent('explored'), 1200);
  };
  const goTarget = (target: RoomTarget) => go(target);
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
    const top = layoutTop(el);
    window.scrollTo({ top, behavior: reducedMotion() ? 'auto' : 'smooth' });
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
          <button type="button" onClick={() => go('vaisseau')} {...hover}>
            :PLAN
          </button>
          <button type="button" onClick={() => go('detecteur')} {...hover}>
            :DÉTECTEUR
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
        <section id="accueil" className="al-hero">
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

        <section id="vaisseau" className="al-section al-ship-section">
          <p className="al-eyebrow">{'// PLAN DU NOSTROMO'}</p>
          <h2 className="al-h2">Visite le vaisseau.</h2>
          <p className="al-lead">
            Six compartiments, six petits récits. Quatre d’entre eux ouvrent une
            partie du site : le pont mène au terminal, l’infirmerie aux
            dossiers, la cale au détecteur et le sas aux œufs.
          </p>
          <ShipMap visited={visited} onVisit={visitRoom} onGo={goTarget} />
        </section>

        <section id="detecteur" className="al-section al-trk-section">
          <div>
            <p className="al-eyebrow">{'// DÉTECTEUR DE MOUVEMENT'}</p>
            <h2 className="al-h2">Rien ne bouge. Vraiment ?</h2>
            <p className="al-lead">
              Déplace la sonde avec ta souris, ou avec les flèches du clavier.
              Plus tu t’approches d’un contact caché, plus le bip s’accélère et
              monte. Un clic, ou la barre d’espace, lance une impulsion qui
              révèle tout un instant. Mais les contacts s’approchent de ta sonde
              : reste trop longtemps collé à l’un d’eux et la liaison est
              perdue.
            </p>
          </div>
          <MotionTracker
            beep={beep}
            onPing={() => sfx('open')}
            onLose={() => {
              sfx('close');
              logEvent('trackerLost');
            }}
          />
        </section>

        <section id="terminal" className="al-section al-term-section">
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

        <section id="collection" className="al-section al-pack-section">
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

      <BoardLog lines={log.lines} shown={log.shown} onToggle={log.toggle} />
      <Hud
        lines={[`WELCOME USER ${user}`, 'NAV', `> NOSTROMO | ${section}`]}
        session={session}
      />
      {open && <DossierDialog d={open} onClose={closeDossier} />}
    </div>
  );
}
