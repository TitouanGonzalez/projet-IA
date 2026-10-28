import { useEffect, useRef } from 'react';

// Œuf en fil de fer, dessiné et projeté à la main sur un canvas 2D (aucune bibliothèque 3D).
// Il suit la souris, respire doucement, et ses quatre pétales s'ouvrent quand on approche.
const RINGS = 18;
const MERIDIANS = 24;
interface V {
  x: number;
  y: number;
  z: number;
}

function buildEgg(open: number): V[][] {
  const rings: V[][] = [];
  for (let i = 0; i <= RINGS; i++) {
    const t = (i / RINGS) * Math.PI; // 0 au sommet, pi à la base
    const baseY = Math.cos(t) * 1.3;
    const r = Math.sin(t) * (0.82 - 0.2 * Math.cos(t));
    const ring: V[] = [];
    for (let j = 0; j < MERIDIANS; j++) {
      const phi = (j / MERIDIANS) * Math.PI * 2;
      let radius = r;
      let y = baseY;
      if (baseY > 0.3 && open > 0) {
        const k = (baseY - 0.3) / 1.0; // 0 à 1 du bas vers le sommet des pétales
        const edge = j % (MERIDIANS / 4) === 0 ? 1.35 : 1;
        radius = r + open * k * k * 0.5 * edge;
        y = baseY - open * k * 0.5;
      }
      ring.push({ x: Math.cos(phi) * radius, y, z: Math.sin(phi) * radius });
    }
    rings.push(ring);
  }
  return rings;
}

export default function Ovomorph({ hot }: { hot: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const hotRef = useRef(hot);
  useEffect(() => {
    hotRef.current = hot;
  }, [hot]);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const still = (() => {
      try {
        return matchMedia('(prefers-reduced-motion: reduce)').matches;
      } catch {
        return false;
      }
    })();
    const mouse = { x: 0, y: 0 };
    let width = 0;
    let height = 0;
    let ink = '#f3e9d2';
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ink =
        getComputedStyle(canvas).getPropertyValue('--ink').trim() || '#f3e9d2';
    };
    resize();
    const onMove = (e: PointerEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('resize', resize);

    let open = 0.1;
    let yaw = 0.7;
    let smoothX = 0;
    let smoothY = 0;
    let last = performance.now();
    let frames = 0;
    let raf = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      frames++;
      canvas.dataset.frames = String(frames);
      if (!still) yaw += dt * 0.35;
      smoothX += (mouse.x - smoothX) * Math.min(1, dt * 4);
      smoothY += (mouse.y - smoothY) * Math.min(1, dt * 4);
      const breath = still ? 0.1 : 0.1 + 0.05 * Math.sin(now / 900);
      const target = hotRef.current ? 0.95 : breath;
      open += (target - open) * Math.min(1, dt * 3);
      const a = yaw + smoothX * 0.9;
      const b = 0.28 + smoothY * 0.45;
      const sinA = Math.sin(a);
      const cosA = Math.cos(a);
      const sinB = Math.sin(b);
      const cosB = Math.cos(b);
      const scale = Math.min(width, height) * 0.36;
      const project = (v: V) => {
        const x1 = v.x * cosA + v.z * sinA;
        const z1 = -v.x * sinA + v.z * cosA;
        const y2 = v.y * cosB - z1 * sinB;
        const z2 = v.y * sinB + z1 * cosB;
        const f = 3.4 / (3.4 - z2);
        return {
          x: width / 2 + x1 * scale * f,
          y: height / 2 - y2 * scale * f,
          z: z2,
        };
      };
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = ink;
      ctx.shadowColor = ink;
      ctx.shadowBlur = 6;
      const grid = buildEgg(open).map((ring) => ring.map(project));
      const seg = (p: { x: number; y: number; z: number }, q: typeof p) => {
        ctx.globalAlpha = Math.max(
          0.12,
          Math.min(1, 0.55 + (p.z + q.z) * 0.32),
        );
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      };
      for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < MERIDIANS; j++) {
          seg(grid[i][j], grid[i][(j + 1) % MERIDIANS]);
          if (i < grid.length - 1) seg(grid[i][j], grid[i + 1][j]);
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas ref={ref} className="al-egg" aria-hidden="true" data-frames="0" />
  );
}
