'use client';

import * as THREE from 'three';
import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Pose } from '@/lib/story';

type LivePose = RefObject<Pose>;

type Materials = {
  body: THREE.MeshPhysicalMaterial;
  metal: THREE.MeshStandardMaterial;
  soft: THREE.MeshStandardMaterial;
  dark: THREE.MeshStandardMaterial;
  ring: THREE.MeshStandardMaterial;
  cone: THREE.MeshStandardMaterial;
};

// Geometria base do auscultador, em unidades de cena.
const BAND_RADIUS = 1.12;
const BAND_Y = 0.25;
const CUP_Y = -0.55;
const YOKE_RADIUS = 0.63;
/** Desvio vertical que centra o modelo na origem. */
const MODEL_CENTER_Y = -0.11;
/** Velocidade (1/s) com que as cores acompanham a mudança de acabamento. */
const COLOR_DAMPING = 5;

function createMaterials(color: string, accent: string): Materials {
  return {
    body: new THREE.MeshPhysicalMaterial({ color, metalness: 0.55, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.35 }),
    metal: new THREE.MeshStandardMaterial({ color: '#c9ccd2', metalness: 1, roughness: 0.22 }),
    soft: new THREE.MeshStandardMaterial({ color: '#17181b', metalness: 0, roughness: 0.92 }),
    dark: new THREE.MeshStandardMaterial({ color: '#0d0e10', metalness: 0.3, roughness: 0.7 }),
    ring: new THREE.MeshStandardMaterial({ color: '#111111', emissive: accent, emissiveIntensity: 1, toneMapped: false }),
    cone: new THREE.MeshStandardMaterial({ color: '#d9b36c', metalness: 0.9, roughness: 0.3, side: THREE.DoubleSide }),
  };
}

type LayerProps = {
  /** Posição ao longo do eixo com o auscultador montado. */
  base: number;
  /** Deslocamento adicional na vista explodida. */
  shift: number;
  live: LivePose;
  children: ReactNode;
};

/** Uma camada da concha, que desliza ao longo do eixo na vista explodida. */
function Layer({ base, shift, live, children }: LayerProps) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current) ref.current.position.y = base + shift * live.current.explode;
  });
  return <group ref={ref}>{children}</group>;
}

type SideProps = { side: 1 | -1; materials: Materials };

/** Concha. No espaço local, +Y aponta para FORA da cabeça. */
function Cup({ side, materials, live }: SideProps & { live: LivePose }) {
  return (
    <group position={[side * BAND_RADIUS, CUP_Y, 0]} rotation={[0, 0, (-side * Math.PI) / 2]} scale={[1.15, 1, 1]}>
      {/* Tampa exterior */}
      <Layer base={0.11} shift={0.5} live={live}>
        <mesh material={materials.body} scale={[1, 0.28, 1]}>
          <sphereGeometry args={[0.5, 64, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh material={materials.body} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.5, 64]} />
        </mesh>
        <mesh material={materials.metal} position={[0, 0.132, 0]}>
          <cylinderGeometry args={[0.17, 0.17, 0.02, 48]} />
        </mesh>
      </Layer>

      {/* Anel luminoso */}
      <Layer base={0.11} shift={0.28} live={live}>
        <mesh material={materials.ring} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.5, 0.014, 12, 96]} />
        </mesh>
      </Layer>

      {/* Carcaça */}
      <mesh material={materials.body}>
        <cylinderGeometry args={[0.5, 0.48, 0.22, 64]} />
      </mesh>

      {/* Defletor */}
      <Layer base={-0.09} shift={-0.18} live={live}>
        <mesh material={materials.dark}>
          <cylinderGeometry args={[0.46, 0.46, 0.03, 64]} />
        </mesh>
      </Layer>

      {/* Altifalante */}
      <Layer base={-0.12} shift={-0.4} live={live}>
        <mesh material={materials.metal}>
          <cylinderGeometry args={[0.3, 0.3, 0.04, 64]} />
        </mesh>
        <mesh material={materials.cone} position={[0, -0.035, 0]}>
          <cylinderGeometry args={[0.08, 0.25, 0.04, 64, 1, true]} />
        </mesh>
        <mesh material={materials.cone} position={[0, -0.02, 0]} scale={[1, 0.5, 1]} rotation={[Math.PI, 0, 0]}>
          <sphereGeometry args={[0.085, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh material={materials.metal} position={[0, -0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.27, 0.018, 12, 64]} />
        </mesh>
      </Layer>

      {/* Malha acústica */}
      <Layer base={-0.165} shift={-0.58} live={live}>
        <mesh material={materials.dark}>
          <cylinderGeometry args={[0.31, 0.31, 0.012, 48]} />
        </mesh>
      </Layer>

      {/* Almofada */}
      <Layer base={-0.23} shift={-0.75} live={live}>
        <mesh material={materials.soft} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.8]}>
          <torusGeometry args={[0.34, 0.14, 24, 72]} />
        </mesh>
      </Layer>
    </group>
  );
}

/** Forquilha em C que abraça a concha, mais a haste até ao arco. */
function Yoke({ side, materials }: SideProps) {
  const x = side * (BAND_RADIUS + 0.03);
  const yokeTop = CUP_Y + YOKE_RADIUS;
  return (
    <group>
      <mesh material={materials.metal} position={[x, CUP_Y, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[YOKE_RADIUS, 0.028, 12, 64, Math.PI]} />
      </mesh>
      {[1, -1].map((z) => (
        <mesh key={z} material={materials.metal} position={[x, CUP_Y, z * YOKE_RADIUS]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.07, 24]} />
        </mesh>
      ))}
      <mesh material={materials.metal} position={[x, (BAND_Y + yokeTop) / 2 + 0.02, 0]}>
        <cylinderGeometry args={[0.032, 0.032, BAND_Y - yokeTop + 0.1, 16]} />
      </mesh>
      <mesh material={materials.body} position={[side * BAND_RADIUS, BAND_Y + 0.02, 0]} scale={[1, 1, 1.7]}>
        <cylinderGeometry args={[0.07, 0.07, 0.2, 24]} />
      </mesh>
    </group>
  );
}

type Props = {
  /** Cor do corpo (hex). */
  color: string;
  /** Cor do anel luminoso (hex). */
  accent: string;
  /** Pose interpolada no frame atual; só `explode` e `glow` são lidos aqui. */
  live: LivePose;
};

/** Auscultador procedural: construído só com primitivas, sem ficheiros de modelo. */
export default function Headphones({ color, accent, live }: Props) {
  // Criados uma única vez com as cores iniciais; as mudanças são interpoladas no useFrame.
  const [materials] = useState(() => createMaterials(color, accent));
  useEffect(
    () => () => {
      for (const material of Object.values(materials)) material.dispose();
    },
    [materials],
  );

  const targetBody = useMemo(() => new THREE.Color(color), [color]);
  const targetAccent = useMemo(() => new THREE.Color(accent), [accent]);

  // Os materiais do Three.js são objetos mutáveis por natureza: o ciclo de frames
  // altera-os através de um ref, sem tocar no valor de estado do React.
  const frameMaterials = useRef(materials);

  useFrame((state, delta) => {
    const { body, ring } = frameMaterials.current;
    const k = 1 - Math.exp(-COLOR_DAMPING * delta);
    body.color.lerp(targetBody, k);
    ring.emissive.lerp(targetAccent, k);
    const pulse = 1 + 0.25 * Math.sin(state.clock.elapsedTime * 3);
    ring.emissiveIntensity = live.current.glow * pulse;
  });

  return (
    <group position={[0, MODEL_CENTER_Y, 0]}>
      {/* Arco */}
      <mesh material={materials.body} position={[0, BAND_Y, 0]} scale={[1, 1, 1.9]}>
        <torusGeometry args={[BAND_RADIUS, 0.05, 16, 96, Math.PI]} />
      </mesh>
      {/* Almofada do arco */}
      <mesh material={materials.soft} position={[0, BAND_Y, 0]} rotation={[0, 0, Math.PI / 4]} scale={[1, 1, 1.6]}>
        <torusGeometry args={[BAND_RADIUS - 0.06, 0.065, 16, 64, Math.PI / 2]} />
      </mesh>

      <Yoke side={1} materials={materials} />
      <Yoke side={-1} materials={materials} />
      <Cup side={1} materials={materials} live={live} />
      <Cup side={-1} materials={materials} live={live} />
    </group>
  );
}
