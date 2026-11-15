'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import FinishPicker from './FinishPicker';
import { Body, Eyebrow, Panel, Title } from './Panel';
import ReserveModal from './ReserveModal';
import { useScrollStory } from '@/hooks/useScrollStory';
import type { Reservation } from '@/lib/reservation';
import { CHAPTERS, CHAPTER_SCROLL_VH, FINISHES, PRICE, type Finish } from '@/lib/story';

// O WebGL só existe no browser: carrega-se à parte e fora do HTML do servidor.
const Scene = dynamic(() => import('./three/Scene'), { ssr: false });

const SPECS = [
  ['Altifalante', '40 mm'],
  ['Resposta', '4 Hz – 40 kHz'],
  ['Distorção', '< 0,08%'],
] as const;

const LAYERS = [
  'Tampa em alumínio maquinado',
  'Anel de luz e sensores táteis',
  'Altifalante de berílio de 40 mm',
  'Malha acústica de precisão',
  'Almofada em espuma viscoelástica',
] as const;

const pad = (n: number) => String(n).padStart(2, '0');

export default function Showcase() {
  const rootRef = useRef<HTMLDivElement>(null);
  const { active, goTo, setScrollLocked } = useScrollStory(rootRef);
  const [finish, setFinish] = useState<Finish>(FINISHES[0]);
  const [modalOpen, setModalOpen] = useState(false);
  const [reservation, setReservation] = useState<Reservation | null>(null);

  // Com o modal aberto, a página não desliza por trás.
  useEffect(() => {
    setScrollLocked(modalOpen);
  }, [modalOpen, setScrollLocked]);

  const chapter = CHAPTERS[active];
  const openModal = () => setModalOpen(true);

  return (
    <div ref={rootRef} style={{ '--accent': finish.accent } as CSSProperties}>
      {/* Brilho de fundo: é ele que dá cor ao desfoque dos cartões de vidro. */}
      <div
        aria-hidden
        data-side={chapter.side}
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(42vmax_42vmax_at_50%_50%,color-mix(in_srgb,var(--accent)_26%,transparent),transparent_70%)] transition-[translate,background] duration-[1400ms] ease-expo data-[side=left]:translate-x-[22vw] data-[side=right]:-translate-x-[22vw] tall:translate-x-0! tall:-translate-y-[18vh] motion-reduce:transition-none"
      />

      <div aria-hidden className="pointer-events-none fixed inset-0 z-1 animate-fade-in">
        <Scene finish={finish} />
      </div>

      <header className="fixed inset-x-0 top-0 z-5 flex items-center justify-between px-[clamp(16px,4vw,48px)] py-4">
        <button
          type="button"
          onClick={() => goTo(0)}
          aria-label="ORBE — voltar ao início"
          className="flex items-center gap-2.5 text-[13px] font-semibold tracking-[0.28em]"
        >
          <span className="size-3.5 rounded-full border-2 border-fg shadow-[0_0_14px_var(--accent)] transition-shadow duration-700" />
          ORBE
        </button>
        <button
          type="button"
          onClick={openModal}
          className="glass rounded-full px-[18px] py-[9px] text-[13px] font-medium transition-colors hover:border-white/30 hover:bg-white/15"
        >
          {reservation ? 'Ver reserva' : 'Reservar'}
        </button>
      </header>

      <div aria-hidden className="fixed inset-x-0 top-0 z-6 h-0.5 bg-white/5">
        <div data-progress className="h-full origin-left scale-x-0 bg-linear-to-r from-fg to-accent" />
      </div>

      <nav
        aria-label="Capítulos"
        className="glass fixed right-[clamp(10px,2vw,28px)] top-1/2 z-5 flex -translate-y-1/2 flex-col items-center rounded-full px-1.5 py-2.5 tall:top-[27%]"
      >
        {CHAPTERS.map((c, i) => (
          <button
            key={c.id}
            type="button"
            data-active={i === active}
            aria-current={i === active ? 'step' : undefined}
            aria-label={c.label}
            onClick={() => goTo(i)}
            className="group relative flex items-center justify-center px-2 py-[7px]"
          >
            <span className="pointer-events-none absolute right-full mr-3 translate-x-1.5 whitespace-nowrap text-[11px] uppercase tracking-[0.14em] text-muted opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 tall:hidden">
              {c.label}
            </span>
            <span className="block h-3.5 w-0.5 rounded-full bg-white/30 transition-[height,background-color] duration-500 ease-expo group-hover:bg-white/70 group-data-[active=true]:h-[30px] group-data-[active=true]:bg-accent" />
          </button>
        ))}
      </nav>

      <div
        aria-hidden
        className="glass fixed bottom-5 left-[clamp(16px,4vw,48px)] z-5 flex items-center gap-2.5 rounded-full px-4 py-2 text-xs tabular-nums tracking-[0.12em] text-muted tall:bottom-3 tall:py-1.5"
      >
        <span className="text-fg">{pad(active + 1)}</span>
        <span className="h-px w-6 bg-line" />
        <span>{pad(CHAPTERS.length)}</span>
        <span className="ml-2 uppercase tall:hidden">{chapter.label}</span>
      </div>

      {/* Palco fixo: os cartões trocam no mesmo sítio enquanto o produto roda. */}
      <main className="pointer-events-none fixed inset-0 z-2">
        {/* 01 — Início */}
        <section data-panel className="absolute inset-0">
          <div
            data-card
            className="absolute inset-0 flex flex-col items-center px-6 pt-[15vh] text-center tall:justify-end tall:pb-[170px] tall:pt-0"
          >
            <p data-reveal className="mb-4 text-[13px] font-semibold uppercase tracking-[0.22em] text-accent">
              Novo
            </p>
            <h1
              data-reveal
              className="bg-linear-to-b from-white from-30% to-white/35 bg-clip-text text-[clamp(64px,13vw,200px)] font-bold leading-[0.92] tracking-[-0.045em] text-transparent"
            >
              ORBE One
            </h1>
            <p data-reveal className="mt-5 text-[clamp(18px,2vw,26px)] text-muted">
              O silêncio ganhou uma nova forma.
            </p>
            <div
              data-reveal
              className="absolute bottom-7 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 whitespace-nowrap text-[11px] uppercase tracking-[0.2em] text-muted tall:bottom-16"
            >
              <span className="h-11 w-px origin-top animate-hint bg-linear-to-b from-fg to-transparent motion-reduce:animate-none" />
              Deslize para descobrir
            </div>
          </div>
        </section>

        {/* 02 — Acústica */}
        <Panel side="left">
          <Eyebrow>Acústica</Eyebrow>
          <Title>Som que se sente antes de se ouvir.</Title>
          <Body>
            Altifalantes de 40&nbsp;mm com diafragma de berílio oferecem graves profundos sem distorção e agudos que
            respiram, dos 4&nbsp;Hz aos 40&nbsp;kHz.
          </Body>
          <dl data-reveal className="mt-7 flex gap-6 border-t border-line pt-5 tall:gap-4">
            {SPECS.map(([term, value]) => (
              <div key={term}>
                <dt className="mb-1.5 text-[11px] uppercase tracking-[0.14em] text-muted">{term}</dt>
                <dd className="whitespace-nowrap text-base font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        {/* 03 — Engenharia */}
        <Panel side="right">
          <Eyebrow>Engenharia</Eyebrow>
          <Title>Cada camada, um propósito.</Title>
          <ol className="mt-6">
            {LAYERS.map((layer, n) => (
              <li
                key={layer}
                data-reveal
                className="flex items-baseline gap-4 border-t border-line py-3 text-[clamp(14px,1.15vw,17px)] tall:py-2"
              >
                <span className="text-[11px] tabular-nums tracking-widest text-accent transition-colors duration-700">
                  {pad(n + 1)}
                </span>
                {layer}
              </li>
            ))}
          </ol>
        </Panel>

        {/* 04 — Silêncio */}
        <Panel side="left">
          <Eyebrow>Silêncio</Eyebrow>
          <Title>Oito microfones. Zero distrações.</Title>
          <Body>
            O cancelamento de ruído adaptativo analisa o ambiente 48 mil vezes por segundo e apaga o mundo à sua
            volta. Um toque no anel e ele regressa, em modo de transparência.
          </Body>
        </Panel>

        {/* 05 — Conforto */}
        <Panel side="right">
          <Eyebrow>Conforto</Eyebrow>
          <Title>254 gramas que desaparecem.</Title>
          <Body>
            O arco em aço de mola, com almofada respirável, distribui o peso de forma uniforme. Ao fim de alguns
            minutos, esquece-se de que os tem postos.
          </Body>
        </Panel>

        {/* 06 — Bateria */}
        <Panel side="left">
          <Eyebrow>Bateria</Eyebrow>
          <p
            data-reveal
            className="mb-4 flex items-baseline gap-3 text-[clamp(84px,11vw,170px)] font-bold leading-[0.9] tracking-[-0.05em] tabular-nums"
          >
            <span data-count="40">40</span>
            <small className="text-[0.17em] font-medium tracking-normal text-muted">horas</small>
          </p>
          <Title small>Uma semana inteira de música.</Title>
          <Body>E quando acabar, 5 minutos de carregamento devolvem 4 horas de reprodução.</Body>
        </Panel>

        {/* 07 — Acabamentos */}
        <section data-panel className="absolute inset-0 flex items-end justify-center px-4 pb-[7vh] tall:pb-16">
          <div
            data-card
            className="glass invisible w-[min(100%,30rem)] rounded-[28px] px-8 py-7 text-center tall:rounded-3xl tall:p-6"
          >
            <Eyebrow>Acabamentos</Eyebrow>
            <Title small>Escolha o seu.</Title>
            <div data-reveal className="mt-5">
              <FinishPicker name="acabamento-pagina" value={finish} onChange={setFinish} className="justify-center" />
            </div>
            <p data-reveal aria-live="polite" className="mt-3 text-sm text-muted">
              {finish.name}
            </p>
            <div data-reveal className="mt-5 flex items-center justify-center gap-5">
              <span className="text-xl font-semibold">{PRICE}</span>
              <button
                type="button"
                onClick={openModal}
                className="pointer-events-auto whitespace-nowrap rounded-full bg-fg px-6 py-3 text-[15px] font-medium text-black transition-transform hover:scale-[1.03]"
              >
                {reservation ? 'Reservado ✓' : 'Reservar agora'}
              </button>
            </div>
            <p data-reveal className="mt-5 text-[11px] text-white/35">
              O ORBE One é um produto conceptual — demonstração de scrollytelling 3D.
            </p>
          </div>
        </section>
      </main>

      {/* Trilho de scroll: só tem altura. Cada bloco é o acionador de um capítulo. */}
      <div data-track aria-hidden className="relative z-0">
        {CHAPTERS.map((c, i) => (
          <div key={c.id} data-spacer style={{ height: `${i === 0 ? 100 : CHAPTER_SCROLL_VH}vh` }} />
        ))}
      </div>

      <ReserveModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        finish={finish}
        onFinishChange={setFinish}
        price={PRICE}
        reservation={reservation}
        onReserved={setReservation}
      />
    </div>
  );
}
