/**
 * Fonte única da narrativa: capítulos, poses do produto e acabamentos.
 * O DOM (Showcase) e o WebGL (Scene) leem daqui, por isso ficam sempre sincronizados.
 */

export type Pose = {
  /** Inclinação, em radianos. */
  rx: number;
  /** Rotação sobre o eixo vertical, em radianos. */
  ry: number;
  /** Rotação no plano do ecrã, em radianos. */
  rz: number;
  /** Fração da meia-largura visível (-1 a 1). */
  x: number;
  y: number;
  /** Escala. */
  s: number;
  /** 0 = montado, 1 = vista explodida. */
  explode: number;
  /** Intensidade do anel luminoso. */
  glow: number;
  /** Oscilação lenta do capítulo final. */
  sway: number;
};

export type Chapter = {
  id: string;
  label: string;
  /** Lado do TEXTO; o produto fica no lado oposto. */
  side: 'center' | 'left' | 'right';
  pose: Pose;
};

const TAU = Math.PI * 2;

export const CHAPTERS: readonly Chapter[] = [
  {
    id: 'inicio',
    label: 'Início',
    side: 'center',
    pose: { rx: 0.12, ry: -0.45, rz: 0, x: 0, y: -0.85, s: 0.9, explode: 0, glow: 0.6, sway: 0 },
  },
  {
    id: 'acustica',
    label: 'Acústica',
    side: 'left',
    pose: { rx: 0.05, ry: -1.0, rz: 0, x: 0.5, y: 0.4, s: 1.25, explode: 0, glow: 1.2, sway: 0 },
  },
  {
    id: 'engenharia',
    label: 'Engenharia',
    side: 'right',
    pose: { rx: 0.18, ry: -2.3, rz: 0, x: -0.5, y: 0.1, s: 0.92, explode: 1, glow: 0.8, sway: 0 },
  },
  {
    id: 'silencio',
    label: 'Silêncio',
    side: 'left',
    pose: { rx: 0.08, ry: -3.65, rz: -0.06, x: 0.5, y: 0, s: 1.05, explode: 0, glow: 3.2, sway: 0 },
  },
  {
    id: 'conforto',
    label: 'Conforto',
    side: 'right',
    pose: { rx: 0.8, ry: -4.5, rz: 0, x: -0.5, y: -0.55, s: 1.25, explode: 0, glow: 0.6, sway: 0 },
  },
  {
    id: 'bateria',
    label: 'Bateria',
    side: 'left',
    pose: { rx: 0.05, ry: -5.7, rz: 0.28, x: 0.5, y: 0, s: 1, explode: 0, glow: 1.6, sway: 0 },
  },
  {
    id: 'acabamentos',
    label: 'Acabamentos',
    side: 'center',
    pose: { rx: 0.1, ry: -TAU - 0.45, rz: 0, x: 0, y: 1.02, s: 0.7, explode: 0, glow: 1, sway: 1 },
  },
];

/**
 * Altura de scroll de cada capítulo, em vh:
 * 100 de transição (o produto roda) + 80 de permanência (o texto fica parado).
 */
export const CHAPTER_SCROLL_VH = 180;

export type Finish = { id: string; name: string; body: string; accent: string };

export const FINISHES: readonly Finish[] = [
  { id: 'grafite', name: 'Grafite', body: '#2b2d33', accent: '#7aa7ff' },
  { id: 'areia', name: 'Areia', body: '#cdbfa8', accent: '#ffb46b' },
  { id: 'meia-noite', name: 'Meia-noite', body: '#1c2e52', accent: '#6fe3ff' },
  { id: 'terracota', name: 'Terracota', body: '#b3543a', accent: '#ff8a5c' },
];

export const PRICE_EUR = 449;

/** Preço formatado à portuguesa: «449 €». */
export const PRICE = new Intl.NumberFormat('pt-PT', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
}).format(PRICE_EUR);

/**
 * Estado de scroll partilhado. É mutável e vive fora do React de propósito:
 * muda a cada frame e não deve provocar re-renderizações.
 * enter[i] = quanto o capítulo i já «entrou» (0 → 1). O ScrollTrigger escreve,
 * o ciclo de renderização do Three.js lê.
 */
export const scrollState = {
  enter: CHAPTERS.map((_, i): number => (i === 0 ? 1 : 0)),
};
