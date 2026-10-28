import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MAX_HEAT,
  MAX_TEXT,
  START_SIGNAL,
  choose,
  endings,
  intro,
  nodes,
  start,
  submit,
  type GameState,
} from '../../shared/terminal.js';

function reducedMotion(): boolean {
  try {
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

type Kind = 'mother' | 'company' | 'you' | 'win' | 'lose';
interface Entry {
  id: number;
  kind: Kind;
  text: string;
}

let counter = 0;
const entry = (kind: Kind, text: string): Entry => ({
  id: ++counter,
  kind,
  text,
});
const label = (kind: 'mother' | 'company') =>
  kind === 'company' ? 'COMPAGNIE > ' : 'MU/TH/UR > ';

function nodeEntries(id: string): Entry[] {
  const n = nodes[id];
  return [
    ...n.lines.map((l) => entry(n.speaker, label(n.speaker) + l)),
    entry('mother', label('mother') + n.prompt),
    ...(n.free
      ? [entry('mother', `${label('mother')}Astuce : ${n.free.hint}`)]
      : []),
  ];
}
function endEntries(id: string): Entry[] {
  const e = endings[id];
  return [
    ...e.lines.map((l) => entry('mother', l)),
    entry(e.result, `RÉSULTAT : ${e.title}`),
  ];
}
function openingEntries(): Entry[] {
  return [
    ...intro.lines.map((l) => entry('mother', label('mother') + l)),
    ...nodeEntries('ouverture'),
  ];
}

// Écrit le texte lettre par lettre. Une version complète reste lisible pour les lecteurs d'écran.
function Typed({
  text,
  onDone,
  tick,
}: {
  text: string;
  onDone: () => void;
  tick: () => void;
}) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (n >= text.length) {
      onDone();
      return;
    }
    const id = window.setTimeout(() => {
      setN(n + 1);
      if ((n + 1) % 6 === 0) tick();
    }, 12);
    return () => window.clearTimeout(id);
  }, [n, text, onDone, tick]);
  return (
    <>
      <span className="al-sr">{text}</span>
      <span aria-hidden="true">
        {text.slice(0, n)}
        <i className="al-term-caret" />
      </span>
    </>
  );
}

function Gauge({
  name,
  value,
  max,
  tone,
}: {
  name: string;
  value: number;
  max: number;
  tone?: 'warn';
}) {
  const filled = Math.max(0, Math.min(max, value));
  return (
    <div
      className={`al-term-gauge${tone ? ` is-${tone}` : ''}`}
      role="meter"
      aria-label={name}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={filled}
    >
      <span>{name}</span>
      <b aria-hidden="true">
        {Array.from({ length: max }, (_, i) => (
          <i key={i} className={i < filled ? 'on' : ''} />
        ))}
      </b>
    </div>
  );
}

export default function MuthurTerminal({
  beep,
  sfx,
}: {
  beep: (freq: number) => void;
  sfx: (kind: 'click' | 'open' | 'close') => void;
}) {
  const [started, setStarted] = useState(false);
  const [game, setGame] = useState<GameState>(start());
  const [entries, setEntries] = useState<Entry[]>([]);
  const [shown, setShown] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const calm = useRef(reducedMotion());

  const typingDone = shown >= entries.length;
  const ending = game.ending ? endings[game.ending] : undefined;
  const phase = !started
    ? 'idle'
    : !typingDone
      ? 'typing'
      : ending
        ? ending.result
        : nodes[game.node]?.free
          ? 'write'
          : 'choice';
  const [draft, setDraft] = useState('');
  const [writing, setWriting] = useState(false);
  const field = useRef<HTMLTextAreaElement>(null);

  const beepFn = useRef(beep);
  useEffect(() => {
    beepFn.current = beep;
  }, [beep]);
  const tick = useCallback(() => beepFn.current(1500), []);
  const advance = useCallback(() => setShown((s) => s + 1), []);

  const begin = () => {
    const first = openingEntries();
    setGame(start());
    setWriting(false);
    setEntries(first);
    setShown(calm.current ? first.length : 0);
    setStarted(true);
    sfx('open');
  };
  const pick = (index: number) => {
    const choice = nodes[game.node]?.choices[index];
    if (!choice || game.ending) return;
    const after = choose(game, index);
    const added = [
      entry('you', `> ${choice.label}`),
      ...(after.ending ? endEntries(after.ending) : nodeEntries(after.node)),
    ];
    sfx('click');
    setGame(after);
    setEntries((old) => [...old, ...added]);
    if (calm.current) setShown((s) => s + added.length);
    if (after.ending)
      window.setTimeout(
        () => sfx(endings[after.ending!].result === 'win' ? 'open' : 'close'),
        400,
      );
  };
  // Envoie le message écrit par le joueur : la Compagnie le lit et réagit.
  const sendText = (raw: string) => {
    const text = raw.trim().slice(0, MAX_TEXT);
    if (!text || game.ending || !nodes[game.node]?.free) return;
    const { state: after, notes } = submit(game, text);
    const added = [
      entry('you', `> ${text}`),
      ...notes.map((n) => entry('company', label('company') + n)),
      ...(after.ending ? endEntries(after.ending) : nodeEntries(after.node)),
    ];
    sfx('click');
    setDraft('');
    setWriting(false);
    setGame(after);
    setEntries((old) => [...old, ...added]);
    if (calm.current) setShown((s) => s + added.length);
    if (after.ending)
      window.setTimeout(
        () => sfx(endings[after.ending!].result === 'win' ? 'open' : 'close'),
        400,
      );
  };
  const send = () => sendText(draft);
  const skip = () => setShown(entries.length);

  // Toujours montrer la fin du journal.
  useEffect(() => {
    const el = log.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [shown, entries.length, phase]);

  // Garde le focus utile quand les choix, ou le bouton rejouer, apparaissent.
  useEffect(() => {
    if (
      phase !== 'choice' &&
      phase !== 'win' &&
      phase !== 'lose' &&
      phase !== 'write'
    )
      return;
    const root = wrap.current;
    if (!root) return;
    const active = document.activeElement;
    if (active && active !== document.body && !root.contains(active)) return;
    if (phase === 'write' && writing) {
      field.current?.focus();
      return;
    }
    root
      .querySelector<HTMLButtonElement>(
        '.al-term-choices button, .al-term-replay',
      )
      ?.focus();
  }, [phase, writing]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (phase === 'typing' && (e.key === ' ' || e.key === 'Enter')) {
      e.preventDefault();
      skip();
    } else if (phase === 'choice' && /^[1-9]$/.test(e.key)) {
      const i = Number(e.key) - 1;
      if (nodes[game.node]?.choices[i]) {
        e.preventDefault();
        pick(i);
      }
    } else if (phase === 'write' && !writing && /^[1-9]$/.test(e.key)) {
      const list = nodes[game.node].free?.suggestions ?? [];
      const i = Number(e.key) - 1;
      if (list[i]) {
        e.preventDefault();
        sendText(list[i]);
      } else if (i === list.length) {
        e.preventDefault();
        setWriting(true);
      }
    }
  };

  const choices = phase === 'choice' ? nodes[game.node].choices : [];
  return (
    <div
      className="al-term"
      ref={wrap}
      data-phase={phase}
      data-signal={game.signal}
      onKeyDown={onKeyDown}
    >
      <div className="al-term-bar" aria-hidden="true">
        <span>MU/TH/UR 6000 // LIAISON COMPAGNIE</span>
        <span>
          {started ? `SIGNAL ${game.signal}/${START_SIGNAL}` : 'HORS LIGNE'}
        </span>
      </div>
      <div className="al-term-gauges">
        <Gauge name="CRÉDIBILITÉ" value={game.cred} max={5} />
        <Gauge name="INTÉRÊT" value={game.value} max={5} />
        <Gauge name="IRRITATION" value={game.heat} max={MAX_HEAT} tone="warn" />
      </div>
      <div
        className="al-term-log"
        ref={log}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Échange avec la Compagnie"
      >
        {!started && (
          <p className="al-term-line" data-kind="mother">
            MU/TH/UR 6000 EN VEILLE. OUVRE LA LIAISON POUR CONTACTER LA
            COMPAGNIE.
          </p>
        )}
        {entries.slice(0, shown).map((e) => (
          <p key={e.id} className="al-term-line" data-kind={e.kind}>
            {e.text}
          </p>
        ))}
        {started && !typingDone && (
          <p className="al-term-line" data-kind={entries[shown].kind}>
            <Typed
              key={entries[shown].id}
              text={entries[shown].text}
              tick={tick}
              onDone={advance}
            />
          </p>
        )}
      </div>
      <div className="al-term-actions">
        {!started && (
          <button type="button" className="al-btn" onClick={begin}>
            OUVRIR LA LIAISON
          </button>
        )}
        {phase === 'typing' && (
          <button type="button" className="al-term-skip" onClick={skip}>
            PASSER L’ANIMATION [ESPACE]
          </button>
        )}
        {phase === 'choice' && (
          <ol className="al-term-choices" aria-label="Ta réponse">
            {choices.map((c, i) => (
              <li key={c.label}>
                <button type="button" onClick={() => pick(i)}>
                  <b>{i + 1}</b>
                  <span>{c.label}</span>
                </button>
              </li>
            ))}
          </ol>
        )}
        {phase === 'write' && !writing && (
          <ol className="al-term-choices" aria-label="Phrases proposées">
            {(nodes[game.node].free?.suggestions ?? []).map((t, i) => (
              <li key={t}>
                <button type="button" onClick={() => sendText(t)}>
                  <b>{i + 1}</b>
                  <span>{t}</span>
                </button>
              </li>
            ))}
            <li>
              <button
                type="button"
                className="al-term-own"
                onClick={() => setWriting(true)}
              >
                <b>{(nodes[game.node].free?.suggestions.length ?? 0) + 1}</b>
                <span>Écrire mon propre message.</span>
              </button>
            </li>
          </ol>
        )}
        {phase === 'write' && writing && (
          <form
            className="al-term-write"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <label htmlFor="al-term-field">Ton message à la Compagnie</label>
            <textarea
              id="al-term-field"
              ref={field}
              rows={3}
              maxLength={MAX_TEXT}
              value={draft}
              placeholder={nodes[game.node].free?.placeholder}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <div className="al-term-write-row">
              <span aria-hidden="true">
                {draft.length}/{MAX_TEXT}
              </span>
              <button
                type="button"
                className="al-term-skip"
                onClick={() => setWriting(false)}
              >
                REVENIR AUX PHRASES PROPOSÉES
              </button>
              <button type="submit" className="al-btn" disabled={!draft.trim()}>
                ENVOYER
              </button>
            </div>
          </form>
        )}
        {(phase === 'win' || phase === 'lose') && (
          <button
            type="button"
            className="al-btn al-term-replay"
            onClick={begin}
          >
            REJOUER
          </button>
        )}
      </div>
      <p className="al-term-hint" aria-hidden="true">
        {phase === 'write' && writing
          ? 'Écris ta réponse, puis Ctrl + Entrée ou le bouton pour l’envoyer.'
          : 'Touches 1 à 4 pour répondre. Espace pour accélérer le texte.'}
      </p>
    </div>
  );
}
