import { useEffect, useRef } from 'react';
import {
  cameraAt,
  follow,
  ringAlpha,
  ringDistance,
  ringScale,
  scrollSpeed,
  streak,
} from '../../shared/scrollfx.js';
import { reducedMotion } from './shared.js';

// Couloir du vaisseau en fil de fer, dessiné derrière tout le site. La caméra avance quand
// tu défiles, les traînées s'allongent quand tu défiles vite, et le couloir se penche un peu
// dans le sens du défilement. À l'arrêt il dérive très lentement. Si le système demande moins
// de mouvement, une seule image fixe est dessinée.
interface Spark {
  angle: number;
  r: number;
  speed: number;
}

export default function ScrollTunnel() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const still = reducedMotion();
    const mouse = { x: 0, y: 0 };
    let width = 0;
    let height = 0;
    let rings = 18;
    let ink = '#f3e9d2';
    let accent = '#8bc46a';
    let sparks: Spark[] = [];

    const resize = () => {
      const narrow = window.innerWidth < 700;
      const dpr = narrow ? 1 : Math.min(1.5, window.devicePixelRatio || 1);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rings = narrow ? 12 : 18;
      sparks = Array.from({ length: narrow ? 28 : 56 }, () => ({
        angle: Math.random() * Math.PI * 2,
        r: Math.random(),
        speed: 0.5 + Math.random() * 0.8,
      }));
      const css = getComputedStyle(canvas);
      ink = css.getPropertyValue('--ink').trim() || ink;
      accent = css.getPropertyValue('--accent-lit').trim() || accent;
    };
    resize();

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('resize', resize);

    let y = window.scrollY;
    let prevY = y;
    let last = performance.now();
    let sp = 0; // intensité lissée des traînées
    let roll = 0; // inclinaison lissée
    let sx = 0;
    let sy = 0;
    let frames = 0;
    let raf = 0;

    const draw = (now: number, dt: number) => {
      const seconds = now / 1000;
      const cam = cameraAt(y, seconds, still);
      const cx = width / 2 + sx * width * 0.05;
      const cy = height * 0.5 + sy * height * 0.04;
      const hw = width * 0.62;
      const hh = height * 0.62;
      const chamfer = Math.min(hw, hh) * 0.22;
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(roll);
      ctx.translate(-cx, -cy);

      const octagon = (s: number) => {
        const w = hw * s;
        const h = hh * s;
        const c = chamfer * s;
        ctx.beginPath();
        ctx.moveTo(cx - w + c, cy - h);
        ctx.lineTo(cx + w - c, cy - h);
        ctx.lineTo(cx + w, cy - h + c);
        ctx.lineTo(cx + w, cy + h - c);
        ctx.lineTo(cx + w - c, cy + h);
        ctx.lineTo(cx - w + c, cy + h);
        ctx.lineTo(cx - w, cy + h - c);
        ctx.lineTo(cx - w, cy - h + c);
        ctx.closePath();
      };

      // Rails : du point de fuite vers les huit sommets du plus grand anneau.
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.16 + 0.12 * sp;
      const verts: [number, number][] = [
        [-hw + chamfer, -hh],
        [hw - chamfer, -hh],
        [hw, -hh + chamfer],
        [hw, hh - chamfer],
        [hw - chamfer, hh],
        [-hw + chamfer, hh],
        [-hw, hh - chamfer],
        [-hw, -hh + chamfer],
      ];
      ctx.beginPath();
      for (const [vx, vy] of verts) {
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + vx, cy + vy);
      }
      ctx.stroke();

      // Anneaux : les plus proches en premier plan, les plus lointains presque effacés.
      for (let k = 0; k < rings; k++) {
        const d = ringDistance(k, cam, rings);
        const a = ringAlpha(d, rings);
        if (a < 0.01) continue;
        const s = ringScale(d);
        ctx.globalAlpha = Math.min(1, a * (0.55 + 0.45 * sp));
        ctx.strokeStyle = s > 0.55 ? ink : accent;
        ctx.lineWidth = 0.8 + 1.4 * s;
        octagon(s);
        ctx.stroke();
      }

      // Traînées : de petites lignes qui partent du centre, d'autant plus longues qu'on défile vite.
      if (!still) {
        ctx.strokeStyle = ink;
        const reach = Math.hypot(width, height) * 0.6;
        for (const p of sparks) {
          p.r += dt * (0.04 + 1.5 * sp) * p.speed * (0.4 + p.r);
          if (p.r > 1) {
            p.r = 0.02 + Math.random() * 0.1;
            p.angle = Math.random() * Math.PI * 2;
          }
          const len = 0.012 + 0.3 * sp * p.r;
          const r1 = p.r * reach;
          const r0 = Math.max(0, p.r - len) * reach;
          const ca = Math.cos(p.angle);
          const sa = Math.sin(p.angle);
          ctx.globalAlpha = Math.min(1, 0.12 + 0.7 * sp * p.r);
          ctx.lineWidth = 1 + p.r;
          ctx.beginPath();
          ctx.moveTo(cx + ca * r0, cy + sa * r0);
          ctx.lineTo(cx + ca * r1, cy + sa * r1);
          ctx.stroke();
        }
      }
      ctx.restore();
      ctx.globalAlpha = 1;
      canvas.dataset.cam = String(Math.round(cam));
    };

    if (still) {
      draw(performance.now(), 0);
      return () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('resize', resize);
      };
    }

    // Le fond est limité à environ 36 images par seconde : il est discret, et cela laisse de la
    // marge aux autres canvas et aux machines modestes.
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const elapsed = (now - last) / 1000;
      if (document.hidden || elapsed < 1 / 36) return;
      const dt = Math.min(0.05, elapsed);
      last = now;
      frames++;
      canvas.dataset.frames = String(frames);
      prevY = y;
      y = window.scrollY;
      const dir = Math.sign(y - prevY);
      const speed = scrollSpeed(prevY, y, dt);
      sp = follow(sp, streak(speed), dt, 5);
      roll = follow(roll, dir * streak(speed) * 0.06, dt, 4);
      sx = follow(sx, mouse.x, dt, 3);
      sy = follow(sy, mouse.y, dt, 3);
      draw(now, dt);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="al-tunnel"
      aria-hidden="true"
      data-frames="0"
    />
  );
}
