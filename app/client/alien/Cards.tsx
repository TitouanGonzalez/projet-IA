import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CARDS,
  MAX_EGGS,
  RARITIES,
  accrue,
  formatCountdown,
  fresh,
  nextEggIn,
  openEgg,
  parseCollection,
  rarityInfo,
  setDemo,
  stats,
  type Card,
  type Collection,
  type Rarity,
} from '../../shared/cards.js';
import Ovomorph from './Ovomorph.js';
import { Icon, focus, photoFor, reducedMotion, useTilt } from './shared.js';

// La collection est gardée dans ce navigateur uniquement : rien n'est envoyé nulle part.
const KEY = 'nostromo-collection-v1';

function readStorage(): { collection: Collection; canSave: boolean } {
  const now = Date.now();
  try {
    const raw = window.localStorage.getItem(KEY);
    return {
      collection: accrue(parseCollection(raw, now), now),
      canSave: true,
    };
  } catch {
    return { collection: fresh(now), canSave: false };
  }
}

export interface OpenResult {
  card: Card;
  isNew: boolean;
  count: number;
}
export interface CollectionApi {
  c: Collection;
  now: number;
  canSave: boolean;
  open(): OpenResult | null;
  toggleDemo(): void;
  reset(): void;
}

export function useCollection(): CollectionApi {
  const [init] = useState(readStorage);
  const [c, setC] = useState(init.collection);
  const [canSave, setCanSave] = useState(init.canSave);
  const [now, setNow] = useState(() => Date.now());
  const ref = useRef(c);
  ref.current = c;

  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(c));
    } catch {
      setCanSave(false);
    }
  }, [c]);

  // Une fois par seconde : le compte à rebours avance, et les œufs gagnés s'ajoutent.
  useEffect(() => {
    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      setC((prev) => accrue(prev, t));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const open = useCallback((): OpenResult | null => {
    const r = openEgg(ref.current, Math.random, Date.now());
    if (!r) return null;
    ref.current = r.collection;
    setC(r.collection);
    return { card: r.card, isNew: r.isNew, count: r.count };
  }, []);
  const toggleDemo = useCallback(() => {
    const next = setDemo(ref.current, !ref.current.demo, Date.now());
    ref.current = next;
    setC(next);
  }, []);
  const reset = useCallback(() => {
    const next = fresh(Date.now());
    ref.current = next;
    setC(next);
  }, []);
  return { c, now, canSave, open, toggleDemo, reset };
}

function Pips({ level }: { level: number }) {
  return (
    <b className="al-pips" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <i key={i} className={i < level ? 'on' : ''} />
      ))}
    </b>
  );
}

export function CardFace({
  card,
  number,
  count,
  large = false,
}: {
  card: Card;
  number: number;
  count?: number;
  large?: boolean;
}) {
  const r = rarityInfo(card.rarity);
  const tilt = useTilt<HTMLElement>(large ? 8 : 10);
  const photo = photoFor(card.id);
  return (
    <article
      className={`al-cf r-${card.rarity}${large ? ' is-large' : ''}`}
      ref={tilt.ref}
      onPointerMove={tilt.onPointerMove}
      onPointerLeave={tilt.onPointerLeave}
      aria-label={`${card.name}, carte ${r.label.toLowerCase()}`}
    >
      <span className="al-glare" aria-hidden="true" />
      <header className="al-cf-top">
        <span>{r.label}</span>
        <Pips level={r.level} />
      </header>
      <div className="al-cf-art" aria-hidden="true">
        {photo ? (
          <img
            className="al-photo"
            src={photo}
            alt=""
            style={{ objectPosition: focus[card.id] }}
          />
        ) : (
          <Icon kind={card.icon} />
        )}
      </div>
      <h3 className="al-cf-name">{card.name}</h3>
      <p className="al-cf-text">{card.text}</p>
      <footer className="al-cf-foot">
        <span>{`CARTE ${String(number).padStart(2, '0')}/${CARDS.length}`}</span>
        {count && count > 1 ? <b>{`x${count}`}</b> : null}
      </footer>
    </article>
  );
}

function LockedCard({ number }: { number: number }) {
  return (
    <article
      className="al-cf is-locked"
      aria-label={`Carte ${number} sur ${CARDS.length}, pas encore obtenue`}
    >
      <div className="al-cf-art" aria-hidden="true">
        <span>?</span>
      </div>
      <p className="al-cf-foot">
        <span>{`CARTE ${String(number).padStart(2, '0')}/${CARDS.length}`}</span>
      </p>
    </article>
  );
}

const numberOf = (card: Card) => CARDS.indexOf(card) + 1;

export function PackOpening({
  api,
  sfx,
  chime,
  onSeeCollection,
}: {
  api: CollectionApi;
  sfx: (kind: 'open' | 'click') => void;
  chime: (level: number) => void;
  onSeeCollection: () => void;
}) {
  const [phase, setPhase] = useState<'idle' | 'cracking' | 'revealed'>('idle');
  const [result, setResult] = useState<OpenResult | null>(null);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const crack = () => {
    if (phase === 'cracking' || api.c.eggs <= 0) return;
    const r = api.open();
    if (!r) return;
    setResult(r);
    setPhase('cracking');
    sfx('open');
    timer.current = window.setTimeout(
      () => {
        setPhase('revealed');
        chime(rarityInfo(r.card.rarity).level);
      },
      reducedMotion() ? 0 : 1500,
    );
  };

  const eggs = api.c.eggs;
  const wait = nextEggIn(api.c, api.now);
  const message =
    phase === 'revealed' && result
      ? `Carte obtenue : ${result.card.name}, ${rarityInfo(result.card.rarity).label.toLowerCase()}, ${
          result.isNew
            ? 'nouvelle carte'
            : `doublon, ${result.count} exemplaires`
        }.`
      : phase === 'cracking'
        ? 'L’œuf s’ouvre.'
        : '';

  return (
    <div className="al-pack" data-phase={phase} data-eggs={eggs}>
      <div className="al-pack-stage">
        {phase !== 'revealed' && (
          <button
            type="button"
            className={`al-egg-btn${phase === 'cracking' ? ' is-cracking' : ''}`}
            onClick={crack}
            disabled={phase === 'cracking' || eggs <= 0}
            aria-label={
              eggs > 0
                ? `Ouvrir un œuf, ${eggs} en stock`
                : 'Aucun œuf disponible pour le moment'
            }
          >
            <Ovomorph hot={phase === 'cracking'} />
          </button>
        )}
        {phase === 'revealed' && result && (
          <div
            className={`al-reveal r-${result.card.rarity}`}
            data-rarity={result.card.rarity}
          >
            <p className="al-reveal-tag">
              {result.isNew
                ? 'NOUVELLE CARTE'
                : `DOUBLON, ${result.count} EXEMPLAIRES`}
            </p>
            <CardFace
              card={result.card}
              number={numberOf(result.card)}
              count={result.count}
              large
            />
            <div className="al-reveal-actions">
              {eggs > 0 && (
                <button type="button" className="al-btn" onClick={crack}>
                  {`OUVRIR UN AUTRE ŒUF (${eggs})`}
                </button>
              )}
              <button
                type="button"
                className="al-term-skip"
                onClick={onSeeCollection}
              >
                VOIR LA COLLECTION
              </button>
              <button
                type="button"
                className="al-term-skip"
                onClick={() => setPhase('idle')}
              >
                FERMER
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="al-pack-info">
        <ul className="al-pack-stock" aria-hidden="true">
          {Array.from({ length: MAX_EGGS }, (_, i) => (
            <li key={i} className={i < eggs ? 'on' : ''} />
          ))}
        </ul>
        <p className="al-pack-count">
          {`ŒUFS : ${eggs}/${MAX_EGGS}`}
          {phase === 'idle' && eggs > 0 ? ' · CLIQUE SUR L’ŒUF' : ''}
        </p>
        <p className="al-pack-next">
          {wait === null
            ? 'STOCK PLEIN. LE COMPTEUR EST EN PAUSE.'
            : `PROCHAIN ŒUF DANS ${formatCountdown(wait)}${api.c.demo ? ' (MODE DÉMO)' : ''}`}
        </p>
      </div>
      <p className="al-sr" role="status">
        {message}
      </p>
    </div>
  );
}

export function CollectionView({ api }: { api: CollectionApi }) {
  const [filter, setFilter] = useState<'all' | Rarity>('all');
  const [confirm, setConfirm] = useState(false);
  const s = stats(api.c);
  const shown = CARDS.filter((c) => filter === 'all' || c.rarity === filter);
  const filters: { id: 'all' | Rarity; label: string }[] = [
    { id: 'all', label: 'TOUTES' },
    ...RARITIES.map((r) => ({ id: r.id, label: r.label })),
  ];
  return (
    <div className="al-coll" data-owned={s.owned} data-copies={s.copies}>
      <p className="al-coll-count" role="status">
        {`${s.owned} / ${s.total} CARTES · ${s.copies} EXEMPLAIRES`}
      </p>
      <div
        className="al-coll-filters"
        role="group"
        aria-label="Filtrer par rareté"
      >
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <ul className="al-coll-grid" aria-label="Cartes">
        {shown.map((card) => {
          const count = api.c.owned[card.id] ?? 0;
          return (
            <li key={card.id} className="al-coll-cell">
              {count > 0 ? (
                <CardFace card={card} number={numberOf(card)} count={count} />
              ) : (
                <LockedCard number={numberOf(card)} />
              )}
            </li>
          );
        })}
      </ul>
      <div className="al-coll-tools">
        <button
          type="button"
          className="al-term-skip"
          aria-pressed={api.c.demo}
          onClick={api.toggleDemo}
        >
          {api.c.demo
            ? 'MODE DÉMO ACTIVÉ : UN ŒUF TOUTES LES 10 SECONDES'
            : 'MODE DÉMO : UN ŒUF TOUTES LES 10 SECONDES'}
        </button>
        <button
          type="button"
          className="al-term-skip"
          onClick={() => {
            if (!confirm) {
              setConfirm(true);
              return;
            }
            api.reset();
            setConfirm(false);
          }}
          onBlur={() => setConfirm(false)}
        >
          {confirm ? 'CONFIRMER : TOUT EFFACER' : 'RÉINITIALISER LA COLLECTION'}
        </button>
      </div>
      <p className="al-coll-note">
        {api.canSave
          ? 'Ta collection reste dans ce navigateur : rien n’est envoyé nulle part.'
          : 'Ce navigateur refuse l’enregistrement : la collection ne sera pas gardée.'}
      </p>
    </div>
  );
}
