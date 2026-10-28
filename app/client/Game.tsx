import { useEffect, useRef, useState } from 'react';
import {
  GAME_HEIGHT,
  GAME_WIDTH,
  createGame,
  score,
  step,
  type Direction,
  type GameState,
} from '../shared/game.js';

type Phase = 'ready' | 'playing' | 'paused' | 'over';

const messages: Record<Phase, string> = {
  ready: 'Appuie sur Entrée ou sur Jouer pour commencer.',
  playing: 'Partie en cours.',
  paused: 'Pause. Appuie sur Espace pour reprendre.',
  over: 'Perdu. Appuie sur Entrée pour rejouer.',
};

function reducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

// Les couleurs viennent des tokens (variables CSS du design system) : changer un token
// change le jeu. Les formes (triangle, losange) s'ajoutent à la couleur pour les distinguer.
function readColors(el: HTMLElement) {
  const css = getComputedStyle(el);
  const get = (name: string) => css.getPropertyValue(name).trim();
  return {
    canvas: get('--color-canvas'),
    border: get('--color-border'),
    brand: get('--color-brand'),
    onBrand: get('--color-onBrand'),
    danger: get('--color-danger'),
    text: get('--color-text'),
  };
}

function draw(canvas: HTMLCanvasElement, game: GameState) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const c = readColors(canvas);
  ctx.fillStyle = c.canvas;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  ctx.strokeStyle = c.border;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, GAME_WIDTH - 2, GAME_HEIGHT - 2);
  for (const o of game.obstacles) {
    ctx.beginPath();
    ctx.moveTo(o.x + o.w / 2, o.y);
    ctx.lineTo(o.x + o.w, o.y + o.h / 2);
    ctx.lineTo(o.x + o.w / 2, o.y + o.h);
    ctx.lineTo(o.x, o.y + o.h / 2);
    ctx.closePath();
    ctx.fillStyle = c.danger;
    ctx.fill();
    ctx.strokeStyle = c.text;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  const s = game.ship;
  ctx.beginPath();
  ctx.moveTo(s.x + s.w / 2, s.y);
  ctx.lineTo(s.x + s.w, s.y + s.h);
  ctx.lineTo(s.x, s.y + s.h);
  ctx.closePath();
  ctx.fillStyle = c.brand;
  ctx.fill();
  ctx.strokeStyle = c.text;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = c.onBrand;
  ctx.fillRect(s.x + s.w / 2 - 3, s.y + s.h * 0.5, 6, 6);
}

export function Game({ caption }: { caption?: string | null } = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const game = useRef<GameState>(createGame());
  const phase = useRef<Phase>('ready');
  const keys = useRef({ left: false, right: false });
  const calm = useRef(reducedMotion());
  const [view, setView] = useState<Phase>('ready');
  const [best, setBest] = useState(0);
  const [lastScore, setLastScore] = useState(0);
  const [calmMode, setCalmMode] = useState(reducedMotion());

  const change = (next: Phase) => {
    phase.current = next;
    setView(next);
  };
  const start = () => {
    game.current = createGame();
    keys.current = { left: false, right: false };
    change('playing');
    canvasRef.current?.focus();
  };
  const togglePause = () => {
    if (phase.current === 'playing') change('paused');
    else if (phase.current === 'paused') change('playing');
  };

  useEffect(() => {
    calm.current = calmMode;
  }, [calmMode]);

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (phase.current === 'playing') {
        const direction: Direction = keys.current.left
          ? keys.current.right
            ? 0
            : -1
          : keys.current.right
            ? 1
            : 0;
        game.current = step(
          game.current,
          dt,
          direction,
          Math.random,
          calm.current ? 0.6 : 1,
        );
        if (game.current.over) {
          const final = score(game.current);
          setLastScore(final);
          setBest((b) => Math.max(b, final));
          change('over');
        }
      }
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (canvas) draw(canvas, game.current);
      if (wrap) {
        wrap.dataset.shipX = String(Math.round(game.current.ship.x));
        wrap.dataset.score = String(score(game.current));
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    const onBlur = () => {
      if (phase.current === 'playing') change('paused');
    };
    window.addEventListener('blur', onBlur);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') keys.current.left = true;
    else if (e.key === 'ArrowRight') keys.current.right = true;
    else if (e.key === 'Enter' && phase.current !== 'playing') start();
    else if (e.key === ' ' || e.key === 'p' || e.key === 'P') togglePause();
    else return;
    e.preventDefault();
  };
  const onKeyUp = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') keys.current.left = false;
    else if (e.key === 'ArrowRight') keys.current.right = false;
  };
  const hold = (side: 'left' | 'right') => ({
    onPointerDown: () => {
      keys.current[side] = true;
    },
    onPointerUp: () => {
      keys.current[side] = false;
    },
    onPointerLeave: () => {
      keys.current[side] = false;
    },
    onPointerCancel: () => {
      keys.current[side] = false;
    },
  });

  return (
    <div
      className="ds-game"
      ref={wrapRef}
      data-state={view}
      data-ship-x="0"
      data-score="0"
    >
      <canvas
        ref={canvasRef}
        className="ds-game-canvas"
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        tabIndex={0}
        role="application"
        aria-label="Jeu d'esquive. Flèches gauche et droite pour piloter, Entrée pour jouer, Espace pour la pause."
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onBlur={() => {
          keys.current = { left: false, right: false };
        }}
      />
      <p className="ds-game-status" role="status">
        {messages[view]}
        {view === 'over' ? ` Score : ${lastScore}.` : ''}
      </p>
      <p className="ds-game-score">
        Meilleur score : {best} (gardé tant que la page reste ouverte)
      </p>
      <div className="ds-game-controls">
        <button
          type="button"
          className="ds-button secondary"
          aria-label="Aller à gauche (maintenir)"
          {...hold('left')}
        >
          Gauche
        </button>
        <button type="button" className="ds-button" onClick={start}>
          {view === 'over' ? 'Rejouer' : 'Jouer'}
        </button>
        <button
          type="button"
          className="ds-button secondary"
          aria-label="Aller à droite (maintenir)"
          {...hold('right')}
        >
          Droite
        </button>
      </div>
      <label className="ds-game-calm">
        <input
          type="checkbox"
          checked={calmMode}
          onChange={(e) => setCalmMode(e.target.checked)}
        />{' '}
        Mode calme : obstacles plus lents
      </label>
      {caption !== null && (
        <p className="ds-caption">
          {caption ??
            'Pas de flash, formes et couleurs distinctes. Le jeu suit les tokens : change color.brand ou color.danger et regarde le vaisseau et les obstacles.'}
        </p>
      )}
    </div>
  );
}
