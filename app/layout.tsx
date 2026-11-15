import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'ORBE One — O silêncio ganhou uma nova forma',
  description: 'Apresentação de produto com scrollytelling 3D: Next.js, React Three Fiber, GSAP ScrollTrigger e Lenis.',
};

export const viewport: Viewport = { themeColor: '#050506' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-PT">
      <body>{children}</body>
    </html>
  );
}
