'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { CHAPTER_SCROLL_VH, scrollState } from '@/lib/story';

/**
 * Coreografia de cada cartão, em «alturas de ecrã» de scroll:
 * entra na segunda metade da transição do produto, fica parado,
 * e sai na primeira parte da transição seguinte.
 */
const ENTER = 0.5;
const EXIT = 0.45;
const EXIT_AT = CHAPTER_SCROLL_VH / 100 - 1 + ENTER;

const ENTER_START = `top ${ENTER * 100}%`;
const EXIT_END = `top ${(1 - EXIT) * 100}%`;

/**
 * Liga o scroll à narrativa. Dentro de `rootRef` espera encontrar:
 *   [data-track]     trilho de scroll, com um [data-spacer] por capítulo
 *   [data-panel]     um por capítulo, com um [data-card] e vários [data-reveal]
 *   [data-count=N]   números que contam até N ao entrar
 *   [data-progress]  barra de progresso global
 */
export function useScrollStory(rootRef: RefObject<HTMLElement | null>) {
  const lenisRef = useRef<Lenis | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // O Lenis suaviza o scroll nativo; o ticker do GSAP conduz ambos no mesmo frame.
    const lenis = new Lenis({ lerp: reducedMotion ? 1 : 0.09, smoothWheel: !reducedMotion });
    lenisRef.current = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const ctx = gsap.context(() => {
      const spacers = gsap.utils.toArray<HTMLElement>('[data-spacer]');
      const panels = gsap.utils.toArray<HTMLElement>('[data-panel]');
      const last = spacers.length - 1;

      gsap.to('[data-progress]', {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: { trigger: '[data-track]', start: 'top top', end: 'bottom bottom', scrub: true },
      });

      spacers.forEach((spacer, i) => {
        const panel = panels[i];
        const card = panel.querySelector<HTMLElement>('[data-card]');
        const items = panel.querySelectorAll<HTMLElement>('[data-reveal]');
        if (!card) return;

        // Capítulo ativo → indicadores
        ScrollTrigger.create({
          trigger: spacer,
          start: 'top 50%',
          end: 'bottom 50%',
          onToggle: (self) => {
            if (self.isActive) setActive(i);
          },
        });

        if (i === 0) {
          // Abertura: entra ao carregar a página e sai com o scroll.
          if (!reducedMotion) {
            gsap.from(items, { autoAlpha: 0, y: 40, duration: 1.2, stagger: 0.12, ease: 'power3.out', delay: 0.2 });
          }
          gsap.fromTo(
            card,
            { autoAlpha: 1, y: 0 },
            {
              autoAlpha: 0,
              y: -60,
              ease: 'power1.in',
              scrollTrigger: { trigger: spacers[1], start: 'top bottom', end: EXIT_END, scrub: true },
            },
          );
          return;
        }

        // Progresso de entrada do capítulo → pose do objeto 3D
        const writeProgress = (self: ScrollTrigger) => {
          scrollState.enter[i] = self.progress;
        };
        ScrollTrigger.create({
          trigger: spacer,
          start: 'top bottom',
          end: 'top top',
          onUpdate: writeProgress,
          onRefresh: writeProgress,
        });

        // Uma única timeline por cartão evita dois tweens a disputar as mesmas propriedades.
        // O fade é feito no próprio cartão: um antepassado com opacidade < 1 desligaria o backdrop-filter.
        const isLast = i === last;
        const timeline = gsap.timeline({
          defaults: { ease: 'power2.out' },
          scrollTrigger: {
            trigger: spacer,
            start: ENTER_START,
            ...(isLast ? { end: 'top top' } : { endTrigger: spacers[i + 1], end: EXIT_END }),
            scrub: true,
          },
        });

        timeline.fromTo(
          card,
          { autoAlpha: 0, y: 48, scale: 0.96 },
          { autoAlpha: 1, y: 0, scale: 1, duration: ENTER * 0.6 },
          0,
        );
        timeline.fromTo(
          items,
          { autoAlpha: 0, y: 26 },
          { autoAlpha: 1, y: 0, duration: ENTER * 0.54, stagger: { amount: ENTER * 0.3 } },
          ENTER * 0.16,
        );

        panel.querySelectorAll<HTMLElement>('[data-count]').forEach((element) => {
          const counter = { value: 0 };
          timeline.fromTo(
            counter,
            { value: 0 },
            {
              value: Number(element.dataset.count),
              duration: ENTER * 0.8,
              onUpdate: () => {
                element.textContent = String(Math.round(counter.value));
              },
            },
            ENTER * 0.2,
          );
        });

        if (!isLast) {
          timeline.fromTo(
            card,
            { autoAlpha: 1, y: 0 },
            { autoAlpha: 0, y: -50, duration: EXIT, ease: 'power1.in', immediateRender: false },
            EXIT_AT,
          );
        }
      });
    }, rootRef);

    return () => {
      ctx.revert();
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [rootRef]);

  /** Desliza suavemente até ao capítulo indicado. */
  const goTo = useCallback(
    (index: number) => {
      const spacer = rootRef.current?.querySelectorAll<HTMLElement>('[data-spacer]')[index];
      if (spacer) lenisRef.current?.scrollTo(index === 0 ? 0 : spacer, { duration: 1.6 });
    },
    [rootRef],
  );

  /** Bloqueia ou liberta o scroll da página (por exemplo, com um modal aberto). */
  const setScrollLocked = useCallback((locked: boolean) => {
    if (locked) lenisRef.current?.stop();
    else lenisRef.current?.start();
  }, []);

  return { active, goTo, setScrollLocked };
}
