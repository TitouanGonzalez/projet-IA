import { useCallback, useEffect, useRef, useState } from 'react';
import {
  EVENTS,
  FIRST_DELAY,
  LINE_LIFETIME,
  dropLine,
  nextDelay,
  pickAmbient,
  pushLine,
  type LogEvent,
  type LogLine,
  type LogSection,
} from '../../shared/boardlog.js';

// Journal de bord : des phrases de MU/TH/UR apparaissent seules selon la section, et en
// réaction à certaines actions. Une seule ligne de plus à la fois, jamais de son fort.
export function useBoardLog(
  section: LogSection,
  active: boolean,
  onLine?: () => void,
) {
  const [lines, setLines] = useState<LogLine[]>([]);
  const [shown, setShown] = useState(true);
  const id = useRef(0);
  const recent = useRef<string[]>([]);
  const timers = useRef<number[]>([]);
  const sectionRef = useRef(section);
  const shownRef = useRef(shown);
  const onLineRef = useRef(onLine);
  useEffect(() => {
    sectionRef.current = section;
    shownRef.current = shown;
    onLineRef.current = onLine;
  });

  const say = useCallback((text: string) => {
    if (!shownRef.current) return;
    const mine = ++id.current;
    recent.current = [text, ...recent.current].slice(0, 4);
    setLines((l) => pushLine(l, text, mine));
    onLineRef.current?.();
    timers.current.push(
      window.setTimeout(
        () => setLines((l) => dropLine(l, mine)),
        LINE_LIFETIME,
      ),
    );
  }, []);

  const event = useCallback((e: LogEvent) => say(EVENTS[e]), [say]);

  // Phrases spontanées : une première après quelques secondes, puis toutes les 22 à 38 s.
  useEffect(() => {
    if (!active || !shown) return;
    let timer = 0;
    const loop = (delay: number) => {
      timer = window.setTimeout(() => {
        say(pickAmbient(sectionRef.current, recent.current, Math.random));
        loop(nextDelay(Math.random));
      }, delay);
    };
    loop(FIRST_DELAY);
    return () => window.clearTimeout(timer);
  }, [active, shown, say]);

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach((t) => window.clearTimeout(t));
  }, []);

  const toggle = useCallback(() => {
    setShown((s) => {
      if (s) setLines([]);
      return !s;
    });
  }, []);

  return { lines, shown, say, event, toggle };
}

export function BoardLog({
  lines,
  shown,
  onToggle,
}: {
  lines: LogLine[];
  shown: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="al-log" data-shown={shown ? 'true' : 'false'}>
      <div
        className="al-log-lines"
        role="log"
        aria-label="Journal de bord de MU/TH/UR"
        aria-live="off"
      >
        {lines.map((l) => (
          <p key={l.id} className="al-log-line">
            {`> ${l.text}`}
          </p>
        ))}
      </div>
      <button
        type="button"
        className="al-log-toggle"
        aria-pressed={shown}
        onClick={onToggle}
      >
        {shown ? 'JOURNAL : ON' : 'JOURNAL : OFF'}
      </button>
    </div>
  );
}
