import { useEffect, useRef, useState } from 'react';
import {
  APEX,
  HALF,
  RADIUS,
  TRK_H,
  TRK_W,
  beepEvery,
  beepPitch,
  DANGER_TIME,
  classify,
  clampToFan,
  isLost,
  makeContacts,
  nearest,
  proximityText,
  reveal,
  stepContacts,
  sweepAngle,
  toXY,
  updateDanger,
  type Contact,
  type Point,
  type Proximity,
} from '../../shared/tracker.js';

function reducedMotion(): boolean {
  try {
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

interface Look {
  lit: string;
  accent: string;
}

const TOP = -Math.PI / 2;

function fanPath(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.moveTo(APEX.x, APEX.y);
  ctx.arc(APEX.x, APEX.y, RADIUS, TOP - HALF, TOP + HALF);
  ctx.closePath();
}

function draw(
  ctx: CanvasRenderingContext2D,
  look: Look,
  state: {
    contacts: Contact[];
    sweep: number;
    dir: number;
    probe: Point | null;
    calm: boolean;
    danger: number;
  },
) {
  const { lit, accent } = look;
  ctx.clearRect(0, 0, TRK_W, TRK_H);
  ctx.lineCap = 'round';

  // Anneau sous le sommet, comme sur l'appareil.
  ctx.save();
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 12;
  for (let i = 0; i < 3; i++) {
    const s = (i * 2 * Math.PI) / 3 + 0.25;
    ctx.beginPath();
    ctx.arc(APEX.x, APEX.y + 6, 34, s, s + 1.6);
    ctx.stroke();
  }
  ctx.restore();

  // Fond de l'éventail.
  ctx.save();
  fanPath(ctx);
  const bg = ctx.createRadialGradient(
    APEX.x,
    APEX.y,
    20,
    APEX.x,
    APEX.y,
    RADIUS,
  );
  bg.addColorStop(0, 'rgba(60, 110, 45, 0.28)');
  bg.addColorStop(1, 'rgba(16, 30, 14, 0.55)');
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.clip();

  // Arcs de distance en pointillés et lignes radiales fines.
  ctx.strokeStyle = lit;
  ctx.globalAlpha = 0.75;
  ctx.lineWidth = 2;
  ctx.setLineDash([14, 9]);
  for (const k of [0.33, 0.66]) {
    ctx.beginPath();
    ctx.arc(APEX.x, APEX.y, RADIUS * k, TOP - HALF, TOP + HALF);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 1.2;
  for (const deg of [-21, 0, 21]) {
    const a = (deg * Math.PI) / 180;
    const p = toXY(1, a);
    ctx.beginPath();
    ctx.moveTo(APEX.x, APEX.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }

  // Balayage et sa traînée.
  ctx.shadowColor = accent;
  ctx.shadowBlur = 12;
  ctx.strokeStyle = lit;
  const trail = state.calm ? 1 : 14;
  for (let i = 0; i < trail; i++) {
    const a = state.sweep - state.dir * i * 0.014;
    const p = toXY(1, a);
    ctx.globalAlpha = (1 - i / trail) * (i === 0 ? 0.95 : 0.28);
    ctx.lineWidth = i === 0 ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(APEX.x, APEX.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }

  // Contacts : visibles seulement quand le balayage ou une impulsion les révèle.
  for (const c of state.contacts) {
    if (c.seen < 0.02) continue;
    const p = toXY(c.r, c.a);
    ctx.globalAlpha = Math.min(1, c.seen * 1.2);
    const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 26);
    glow.addColorStop(0, lit);
    glow.addColorStop(1, 'rgba(79, 138, 57, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f3ffe9';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sonde : la croix que l'on déplace.
  if (state.probe) {
    const { x, y } = state.probe;
    ctx.globalAlpha = 1;
    const d = Math.min(1, state.danger / DANGER_TIME);
    ctx.strokeStyle = `rgb(${Math.round(243 - 31 * d)}, ${Math.round(233 - 131 * d)}, ${Math.round(210 - 119 * d)})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.moveTo(x - 20, y);
    ctx.lineTo(x - 6, y);
    ctx.moveTo(x + 6, y);
    ctx.lineTo(x + 20, y);
    ctx.moveTo(x, y - 20);
    ctx.lineTo(x, y - 6);
    ctx.moveTo(x, y + 6);
    ctx.lineTo(x, y + 20);
    ctx.stroke();
  }
  ctx.restore();

  // Bords de l'éventail : deux côtés épais et le grand arc.
  ctx.save();
  ctx.shadowColor = accent;
  ctx.shadowBlur = 14;
  ctx.strokeStyle = lit;
  ctx.globalAlpha = 0.95;
  ctx.lineWidth = 4;
  for (const sign of [-1, 1]) {
    const p = toXY(1, sign * HALF);
    ctx.beginPath();
    ctx.moveTo(APEX.x, APEX.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.arc(APEX.x, APEX.y, RADIUS + 4, TOP - HALF, TOP + HALF);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.arc(APEX.x, APEX.y, RADIUS - 10, TOP - HALF, TOP + HALF);
  ctx.stroke();
  ctx.restore();
}

export default function MotionTracker({
  beep,
  onPing,
  onLose,
}: {
  beep: (freq: number) => void;
  onPing: () => void;
  onLose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const readout = useRef<HTMLParagraphElement>(null);
  const box1 = useRef<HTMLSpanElement>(null);
  const box2 = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLElement>(null);
  const probe = useRef<Point | null>(null);
  const keyboard = useRef(false);
  const contacts = useRef<Contact[]>(makeContacts(Math.random, 4));
  const time = useRef(0);
  const charge = useRef(1);
  const pingUntil = useRef(0);
  const proxRef = useRef<Proximity>('far');
  const danger = useRef(0);
  const alive = useRef(0);
  const lost = useRef(false);
  const dangerBar = useRef<HTMLElement>(null);
  const clock = useRef<HTMLSpanElement>(null);
  const warnRef = useRef(false);
  const callbacks = useRef({ beep, onPing, onLose });
  const [prox, setProx] = useState<Proximity>('far');
  const [warn, setWarn] = useState(false);
  const [over, setOver] = useState(false);
  const [best, setBest] = useState(0);

  useEffect(() => {
    callbacks.current = { beep, onPing, onLose };
  }, [beep, onPing, onLose]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const calm = reducedMotion();
    const css = getComputedStyle(canvas);
    const look: Look = {
      lit: css.getPropertyValue('--accent-lit').trim() || '#8bc46a',
      accent: css.getPropertyValue('--accent').trim() || '#4f8a39',
    };
    let raf = 0;
    let last = performance.now();
    let lastSweep = 0;
    let dir = 1;
    let lastBeep = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const playing = !lost.current;
      const p = probe.current;
      if (playing) {
        time.current += dt;
        alive.current += dt;
      }
      const t = time.current;
      const sweep = sweepAngle(t, calm ? 12 : 5);
      if (sweep !== lastSweep) dir = sweep > lastSweep ? 1 : -1;
      if (playing) {
        contacts.current = reveal(
          stepContacts(contacts.current, dt, Math.random, p),
          lastSweep,
          sweep,
          t < pingUntil.current,
        );
        charge.current = Math.min(1, charge.current + dt / 4);
      }
      lastSweep = sweep;
      const wrap = wrapRef.current;
      let category: Proximity = 'far';
      if (p) {
        const n = nearest(contacts.current, p);
        if (n) {
          if (playing) {
            danger.current = updateDanger(danger.current, n.meters, dt);
            if (isLost(danger.current)) {
              lost.current = true;
              setOver(true);
              setBest((b) => Math.max(b, Math.floor(alive.current)));
              callbacks.current.onLose();
            }
          }
          category = classify(n.meters);
          if (readout.current)
            readout.current.textContent = n.meters.toFixed(2).padStart(5, '0');
          if (wrap) wrap.dataset.nearest = n.meters.toFixed(1);
          if (playing && t - lastBeep >= beepEvery(n.meters)) {
            lastBeep = t;
            callbacks.current.beep(beepPitch(n.meters));
          }
        }
      } else {
        if (playing) danger.current = updateDanger(danger.current, null, dt);
        if (readout.current) readout.current.textContent = '--.--';
        if (wrap) wrap.dataset.nearest = 'none';
      }
      const warning = !lost.current && danger.current > 0.25;
      if (warning !== warnRef.current) {
        warnRef.current = warning;
        setWarn(warning);
      }
      if (category !== proxRef.current) {
        proxRef.current = category;
        setProx(category);
      }
      if (wrap) {
        wrap.dataset.probeX = p ? String(Math.round(p.x)) : 'none';
        wrap.dataset.probeY = p ? String(Math.round(p.y)) : 'none';
        wrap.dataset.charge = charge.current.toFixed(2);
        wrap.dataset.danger = danger.current.toFixed(2);
        wrap.dataset.lost = String(lost.current);
        wrap.dataset.alive = alive.current.toFixed(1);
        // Positions des contacts, pour les tests et le débogage.
        wrap.dataset.contacts = JSON.stringify(
          contacts.current.map((c) => {
            const q = toXY(c.r, c.a);
            return [Math.round(q.x), Math.round(q.y)];
          }),
        );
      }
      if (dangerBar.current)
        dangerBar.current.style.width = `${Math.min(100, (danger.current / DANGER_TIME) * 100)}%`;
      if (clock.current) {
        const sec = Math.floor(alive.current);
        clock.current.textContent = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
      }
      if (box1.current)
        box1.current.textContent = String(
          contacts.current.filter((c) => c.seen > 0.3).length,
        );
      if (box2.current)
        box2.current.textContent = String(Math.round(charge.current * 9));
      if (bar.current) bar.current.style.width = `${charge.current * 100}%`;

      draw(ctx, look, {
        contacts: contacts.current,
        sweep,
        dir,
        probe: p,
        calm,
        danger: danger.current,
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const toCanvas = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) * TRK_W) / r.width,
      y: ((e.clientY - r.top) * TRK_H) / r.height,
    };
  };
  const restart = () => {
    contacts.current = makeContacts(Math.random, 4);
    danger.current = 0;
    alive.current = 0;
    charge.current = 1;
    pingUntil.current = 0;
    lost.current = false;
    setOver(false);
    setWarn(false);
    warnRef.current = false;
    canvasRef.current?.focus();
  };
  const ping = () => {
    if (lost.current || charge.current < 1) return;
    charge.current = 0;
    pingUntil.current = time.current + 1.4;
    callbacks.current.onPing();
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = 16;
    const move: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    if (move[e.key]) {
      keyboard.current = true;
      const from = probe.current ?? { x: APEX.x, y: APEX.y - 200 };
      probe.current = clampToFan({
        x: from.x + move[e.key][0],
        y: from.y + move[e.key][1],
      });
    } else if (e.key === ' ' || e.key === 'Enter') {
      ping();
    } else return;
    e.preventDefault();
  };

  return (
    <div className="al-trk-block">
      <div className="al-trk" ref={wrapRef} data-state={prox}>
        <div className="al-trk-leds" aria-hidden="true">
          {Array.from({ length: 11 }, (_, i) => (
            <i key={i} />
          ))}
        </div>
        <div className="al-trk-screen">
          <canvas
            ref={canvasRef}
            className="al-trk-canvas"
            width={TRK_W}
            height={TRK_H}
            tabIndex={0}
            role="application"
            aria-label="Détecteur de mouvement. Déplace la sonde avec la souris ou les flèches. Clic ou espace : impulsion."
            onPointerMove={(e) => {
              keyboard.current = false;
              probe.current = clampToFan(toCanvas(e));
            }}
            onPointerLeave={() => {
              if (!keyboard.current) probe.current = null;
            }}
            onPointerDown={ping}
            onKeyDown={onKeyDown}
            onBlur={() => {
              keyboard.current = false;
              probe.current = null;
            }}
          />
          <span className="al-trk-tag al-trk-tag-top" aria-hidden="true">
            -CN
          </span>
          <div className="al-trk-time" aria-hidden="true">
            <span>
              TEMPS <b ref={clock}>00:00</b>
            </span>
            <span className="al-trk-danger">
              DANGER
              <em>
                <i ref={dangerBar} />
              </em>
            </span>
          </div>
          {over && (
            <div className="al-trk-lost" role="alert">
              <p>CONTACT. LIAISON PERDUE.</p>
              <p>
                Tu as tenu {Math.floor(alive.current)} s. Meilleur temps :{' '}
                {best} s.
              </p>
              <button type="button" className="al-btn" onClick={restart}>
                RELANCER
              </button>
            </div>
          )}
          <div className="al-trk-boxes" aria-hidden="true">
            <span ref={box1}>0</span>
            <span ref={box2}>9</span>
          </div>
          <p className="al-trk-readout" ref={readout} aria-hidden="true">
            --.--
          </p>
          <ul className="al-trk-states" aria-hidden="true">
            <li className={prox === 'far' ? 'on' : ''}>ATT</li>
            <li className={prox === 'suspect' ? 'on' : ''}>SUS</li>
            <li className={prox === 'close' ? 'on' : ''}>DEC</li>
          </ul>
          <div className="al-trk-charge" aria-hidden="true">
            <i ref={bar} />
          </div>
          <span className="al-trk-tag al-trk-tag-l" aria-hidden="true">
            7-772
          </span>
          <span className="al-trk-tag al-trk-tag-r" aria-hidden="true">
            47-CLN
          </span>
        </div>
        <div className="al-trk-leds" aria-hidden="true">
          {Array.from({ length: 11 }, (_, i) => (
            <i key={i} />
          ))}
        </div>
      </div>
      <p className="al-trk-caption" role="status">
        {over
          ? 'Contact. Liaison perdue. Relance une partie.'
          : warn
            ? 'Danger : le contact est sur toi, recule.'
            : proximityText[prox]}
      </p>
    </div>
  );
}
