import { useState, type CSSProperties } from 'react';
import {
  ROOMS,
  exploration,
  roomById,
  type Room,
  type RoomId,
  type RoomTarget,
} from '../../shared/ship.js';

// Cases du plan dans un repère 800 x 340. Les noms des salles sont lus dans les boutons
// en dessous, pas dans le dessin : le dessin est décoratif.
const BOXES: Record<RoomId, { x: number; y: number; w: number; h: number }> = {
  pont: { x: 70, y: 112, w: 130, h: 116 },
  infirmerie: { x: 214, y: 92, w: 150, h: 68 },
  navette: { x: 214, y: 176, w: 150, h: 68 },
  cale: { x: 378, y: 92, w: 190, h: 152 },
  sas: { x: 582, y: 92, w: 110, h: 68 },
  machines: { x: 582, y: 176, w: 110, h: 68 },
};

export default function ShipMap({
  visited,
  onVisit,
  onGo,
}: {
  visited: readonly RoomId[];
  onVisit: (room: Room) => void;
  onGo: (target: RoomTarget) => void;
}) {
  const [current, setCurrent] = useState<RoomId | null>(null);
  const room = current ? roomById(current) : undefined;
  const { done, total } = exploration(visited);

  const pick = (id: RoomId) => {
    setCurrent(id);
    const r = roomById(id);
    if (r) onVisit(r);
  };

  return (
    <div className="al-ship" data-explored={done} data-room={current ?? ''}>
      <svg
        viewBox="0 0 800 340"
        className="al-ship-svg"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        aria-hidden="true"
      >
        <path d="M30 170 L84 86 L700 66 L772 170 L700 274 L84 254 Z" />
        <path d="M700 66 L760 40 L790 40 M700 274 L760 300 L790 300" />
        <path d="M30 170 H70 M692 170 H772" strokeDasharray="4 6" />
        <line className="al-ship-sweep" x1="30" y1="52" x2="30" y2="288" />
        {ROOMS.map((r) => {
          const b = BOXES[r.id];
          const seen = visited.includes(r.id);
          return (
            <g
              key={r.id}
              className={`al-ship-room${current === r.id ? ' is-current' : ''}${seen ? ' is-seen' : ''}`}
              onClick={() => pick(r.id)}
            >
              <rect x={b.x} y={b.y} width={b.w} height={b.h} />
              <text
                x={b.x + b.w / 2}
                y={b.y + b.h / 2 + 5}
                textAnchor="middle"
                className="al-ship-label"
              >
                {r.deck}
              </text>
              {seen && (
                <circle
                  cx={b.x + b.w - 12}
                  cy={b.y + 12}
                  r="4"
                  fill="currentColor"
                />
              )}
            </g>
          );
        })}
      </svg>

      <div
        className="al-ship-rooms"
        role="group"
        aria-label="Salles du vaisseau"
      >
        {ROOMS.map((r) => (
          <button
            key={r.id}
            type="button"
            className="al-term-skip"
            aria-pressed={current === r.id}
            data-seen={visited.includes(r.id) ? 'true' : 'false'}
            onClick={() => pick(r.id)}
          >
            {r.name.toUpperCase()}
          </button>
        ))}
      </div>

      <p
        className="al-ship-count"
        style={{ '--p': done / total } as CSSProperties}
      >
        {`SALLES EXPLORÉES : ${done}/${total}`}
        {done === total && ' · TOUT EST VU'}
      </p>

      <div className="al-ship-panel" aria-live="polite">
        {room ? (
          <>
            <p className="al-ship-deck">{room.deck}</p>
            <h3 className="al-h3">{room.name}</h3>
            <p className="al-ship-story">{room.story}</p>
            {room.target && (
              <button
                type="button"
                className="al-btn"
                onClick={() => onGo(room.target as RoomTarget)}
              >
                {room.action}
              </button>
            )}
          </>
        ) : (
          <p className="al-ship-story">
            Choisis une salle sur le plan, ou dans la liste. Chacune raconte un
            bout de l’histoire, et quatre d’entre elles ouvrent une partie du
            site.
          </p>
        )}
      </div>
    </div>
  );
}
