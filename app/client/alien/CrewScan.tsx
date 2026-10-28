import { useEffect, useState } from 'react';
import { crewScan, scanAlert } from './data.js';
import { reducedMotion } from './shared.js';

const STEP = 8; // un pas du scan = 8 unités ; chaque ligne démarre un peu après la précédente
const LENGTH = 16;
const TICK_MS = 70;

// Faux scan de l'équipage sur l'écran de démarrage. Purement décoratif : caché des lecteurs
// d'écran, et le bouton ENTER reste utilisable pendant tout le scan.
export default function CrewScan({ active }: { active: boolean }) {
  const last = crewScan.length * STEP + LENGTH;
  const [tick, setTick] = useState(reducedMotion() ? last + 8 : 0);

  useEffect(() => {
    if (!active || tick > last + 8) return;
    const id = window.setTimeout(() => setTick((t) => t + 1), TICK_MS);
    return () => window.clearTimeout(id);
  }, [active, tick, last]);

  if (!active && tick === 0) return null;
  const done = tick >= last;
  return (
    <div
      className="al-scanlist"
      aria-hidden="true"
      data-done={done ? 'true' : 'false'}
    >
      <p className="al-scanlist-title">{'// SCAN DE L’ÉQUIPAGE'}</p>
      <ul>
        {crewScan.map((row, i) => {
          const p = Math.max(0, Math.min(1, (tick - i * STEP) / LENGTH));
          if (p === 0) return null;
          const full = p >= 1;
          return (
            <li key={row.name} className={full && row.alert ? 'is-alert' : ''}>
              <span className="al-scan-name">{row.name}</span>
              <span className="al-scan-bar">
                <i style={{ width: `${Math.round(p * 100)}%` }} />
              </span>
              <span className="al-scan-status">
                {full ? row.status : `${Math.round(p * 100)}%`}
              </span>
            </li>
          );
        })}
      </ul>
      {done && <p className="al-scanlist-alert">{`> ${scanAlert}`}</p>}
    </div>
  );
}
