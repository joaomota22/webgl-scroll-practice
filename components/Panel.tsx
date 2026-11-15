import type { ReactNode } from 'react';

/**
 * Blocos de texto dos capítulos. Os atributos data-* são os pontos de ligação
 * usados pelo hook useScrollStory para animar cada peça.
 */

type PanelProps = { side: 'left' | 'right'; children: ReactNode };

export function Panel({ side, children }: PanelProps) {
  return (
    <section
      data-panel
      className={`absolute inset-0 flex items-center px-[clamp(24px,8vw,140px)] tall:items-end tall:justify-start tall:px-4 tall:pb-16 ${
        side === 'right' ? 'justify-end' : ''
      }`}
    >
      {/* `invisible` evita o flash do cartão antes de o GSAP assumir a visibilidade. */}
      <div
        data-card
        className="glass invisible max-w-[min(31rem,42vw)] rounded-[28px] p-8 lg:p-10 tall:w-full tall:max-w-none tall:rounded-3xl tall:p-6"
      >
        {children}
      </div>
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p data-reveal className="mb-4 text-[13px] font-semibold uppercase tracking-[0.22em] text-accent transition-colors duration-700">
      {children}
    </p>
  );
}

export function Title({ children, small = false }: { children: ReactNode; small?: boolean }) {
  return (
    <h2
      data-reveal
      className={`text-balance font-semibold leading-[1.04] tracking-[-0.03em] ${
        small ? 'text-[clamp(22px,2.4vw,34px)]' : 'text-[clamp(30px,4vw,58px)]'
      }`}
    >
      {children}
    </h2>
  );
}

export function Body({ children }: { children: ReactNode }) {
  return (
    <p data-reveal className="mt-5 text-pretty text-[clamp(15px,1.2vw,18px)] leading-[1.55] text-muted">
      {children}
    </p>
  );
}
