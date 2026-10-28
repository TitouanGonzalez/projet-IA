import { useCallback, useLayoutEffect, useRef } from 'react';
import {
  activeScene,
  buildTimeline,
  scenePose,
  sceneScrollFor,
  type Timeline,
} from '../../shared/scrollfx.js';

// Moteur de scènes. Chaque élément marqué data-scene est fixé à l'écran. Le défilement de la
// page (une hauteur factice, le « spacer ») ne déplace plus rien : il avance dans le couloir.
// La scène courante fonce vers nous et s'efface, la suivante surgit du fond, et une scène plus
// haute que l'écran se lit sur place. Le clavier, les ancres et les lecteurs d'écran gardent
// le même ordre de lecture que la page.
export function useScenes(enabled: boolean, onActive: (id: string) => void) {
  const spacer = useRef<HTMLDivElement>(null);
  const target = useRef<(el: HTMLElement) => number | null>(() => null);
  const onActiveRef = useRef(onActive);
  useLayoutEffect(() => {
    onActiveRef.current = onActive;
  });

  useLayoutEffect(() => {
    if (!enabled) return;
    const scenes = Array.from(
      document.querySelectorAll<HTMLElement>('[data-scene]'),
    );
    if (scenes.length === 0) return;

    // Les titres commencent cachés et se révèlent quand leur scène arrive.
    const headings = scenes.map((s) =>
      Array.from(
        s.querySelectorAll<HTMLElement>('.al-eyebrow, .al-h2, .al-lead'),
      ),
    );
    headings.forEach((list) => list.forEach((el) => el.classList.add('al-rv')));
    const revealed = scenes.map(() => false);

    let tl: Timeline = buildTimeline([], 1);
    let vh = window.innerHeight;
    let raf = 0;
    let lastActive = -1;

    const apply = () => {
      raf = 0;
      const y = window.scrollY;
      scenes.forEach((el, i) => {
        const p = scenePose(i, y, tl);
        const ty = Math.round(p.shift - p.offset);
        el.style.transformOrigin = `50% ${Math.round(vh / 2 - p.shift + p.offset)}px`;
        el.style.transform =
          p.scale === 1
            ? `translateY(${ty}px)`
            : `translateY(${ty}px) scale(${p.scale.toFixed(4)})`;
        el.style.opacity = p.opacity >= 1 ? '' : p.opacity.toFixed(3);
        el.style.pointerEvents = p.interactive ? '' : 'none';
        // Scène invisible : on met en pause ses animations et ses canvas.
        el.classList.toggle('is-away', p.opacity < 0.02);
        if (!revealed[i] && p.entering >= 0.35) {
          revealed[i] = true;
          headings[i].forEach((h) => h.classList.add('is-in'));
        }
      });
      const idx = activeScene(y, tl);
      if (idx !== lastActive) {
        lastActive = idx;
        onActiveRef.current(scenes[idx].id);
      }
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const measure = () => {
      // Si la scène qu'on lit change de hauteur (filtre, nouveau message…), on garde la même
      // position de lecture au lieu de laisser la scène partir parce que sa fin s'est rapprochée.
      const before = window.scrollY;
      let anchor: { i: number; rel: number } | null = null;
      if (tl.starts.length === scenes.length) {
        const i = activeScene(before, tl);
        if (scenePose(i, before, tl).interactive)
          anchor = { i, rel: before - tl.starts[i] };
      }
      vh = window.innerHeight;
      tl = buildTimeline(
        scenes.map((s) => s.offsetHeight),
        vh,
      );
      if (spacer.current)
        spacer.current.style.height = `${Math.ceil(tl.total)}px`;
      scenes.forEach((s, i) => {
        s.dataset.start = String(Math.round(tl.starts[i]));
        s.dataset.read = String(Math.round(tl.reads[i]));
      });
      if (anchor) {
        const next = Math.round(
          tl.starts[anchor.i] + Math.min(anchor.rel, tl.reads[anchor.i]),
        );
        if (Math.abs(next - before) > 1) window.scrollTo(0, next);
      }
      schedule();
    };

    // Position d'un élément dans sa scène, sans tenir compte de la transformation en cours.
    const within = (el: HTMLElement, scene: HTMLElement) => {
      let top = 0;
      for (
        let n: HTMLElement | null = el;
        n && n !== scene;
        n = n.offsetParent as HTMLElement | null
      )
        top += n.offsetTop;
      return top;
    };
    target.current = (el) => {
      const scene = el.closest<HTMLElement>('[data-scene]');
      const i = scene ? scenes.indexOf(scene) : -1;
      if (!scene || i < 0) return null;
      return sceneScrollFor(tl, i, el === scene ? 0 : within(el, scene));
    };

    // Un élément atteint au clavier dans une scène lointaine, ou hors de la zone lue : on va à lui.
    const onFocus = (e: FocusEvent) => {
      const el = e.target as HTMLElement | null;
      const scene = el?.closest<HTMLElement>('[data-scene]');
      const i = scene ? scenes.indexOf(scene) : -1;
      if (!el || !scene || i < 0) return;
      const p = scenePose(i, window.scrollY, tl);
      const top = within(el, scene) - p.offset + p.shift;
      const out = top < 90 || top + el.offsetHeight > vh - 20;
      if (!p.interactive || out) {
        const y = target.current(el);
        if (y !== null) window.scrollTo({ top: y, behavior: 'auto' });
      }
    };

    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => measure())
        : null;
    scenes.forEach((s) => ro?.observe(s));
    measure();
    apply();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', measure);
    document.addEventListener('focusin', onFocus);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro?.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', measure);
      document.removeEventListener('focusin', onFocus);
      target.current = () => null;
      scenes.forEach((s) => {
        s.style.transform = '';
        s.style.opacity = '';
        s.style.transformOrigin = '';
        s.style.pointerEvents = '';
        s.classList.remove('is-away');
        delete s.dataset.start;
        delete s.dataset.read;
      });
      headings.forEach((list) =>
        list.forEach((el) => el.classList.remove('al-rv', 'is-in')),
      );
      if (spacer.current) spacer.current.style.height = '';
    };
  }, [enabled]);

  // Défilement à atteindre pour amener un élément en vue, ou null hors du mode scènes.
  const scrollFor = useCallback((el: HTMLElement) => target.current(el), []);
  return { spacer, scrollFor };
}
