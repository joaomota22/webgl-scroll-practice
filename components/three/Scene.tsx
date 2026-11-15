'use client';

import * as THREE from 'three';
import { useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import gsap from 'gsap';
import Headphones from './Headphones';
import { CHAPTERS, scrollState, type Finish, type Pose } from '@/lib/story';

const POSE_KEYS = Object.keys(CHAPTERS[0].pose) as (keyof Pose)[];
const ease = gsap.parseEase('power2.inOut');

/** Abaixo desta proporção o ecrã conta como «ao alto». Igual à variante `tall` do CSS. */
const PORTRAIT_ASPECT = 9 / 10;
/** Meia-largura visível num ecrã 16:9, para a qual as poses foram desenhadas. */
const REFERENCE_HALF_WIDTH = 4.48;
const MIN_FIT = 0.62;
const PORTRAIT_SCALE = 0.6;
/** Rapidez (1/s) com que o modelo e o ponteiro alcançam o alvo. */
const POSE_DAMPING = 7;
const POINTER_DAMPING = 3;
/** Limite de delta: evita saltos depois de o separador estar em segundo plano. */
const MAX_DELTA = 0.05;

/**
 * Pose alvo = interpolação encadeada entre capítulos.
 * Como os capítulos entram em sequência, basta aplicar os lerps uns sobre os outros.
 */
function computeTargetPose(out: Pose) {
  Object.assign(out, CHAPTERS[0].pose);
  for (let i = 1; i < CHAPTERS.length; i++) {
    const t = ease(scrollState.enter[i]);
    if (t <= 0) continue;
    const pose = CHAPTERS[i].pose;
    for (const key of POSE_KEYS) out[key] += (pose[key] - out[key]) * t;
  }
}

function Rig({ finish }: { finish: Finish }) {
  const outer = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const target = useRef<Pose>({ ...CHAPTERS[0].pose });
  const live = useRef<Pose>({ ...CHAPTERS[0].pose });
  const pointer = useRef({ x: 0, y: 0, smoothX: 0, smoothY: 0 });
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const onPointerMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, []);

  useFrame((state, delta) => {
    if (!outer.current || !inner.current) return;
    const dt = Math.min(delta, MAX_DELTA);
    const time = state.clock.elapsedTime;
    const pose = live.current;

    computeTargetPose(target.current);
    for (const key of POSE_KEYS) pose[key] = THREE.MathUtils.damp(pose[key], target.current[key], POSE_DAMPING, dt);

    const p = pointer.current;
    p.smoothX = THREE.MathUtils.damp(p.smoothX, p.x, POINTER_DAMPING, dt);
    p.smoothY = THREE.MathUtils.damp(p.smoothY, p.y, POINTER_DAMPING, dt);

    // Em ecrãs ao alto, o produto fica centrado em cima e o texto em baixo.
    // pose.x é uma fração da meia-largura visível; a escala encolhe em janelas mais estreitas que 16:9.
    const portrait = state.size.width / state.size.height < PORTRAIT_ASPECT;
    const halfWidth = state.viewport.width / 2;
    const fit = THREE.MathUtils.clamp(halfWidth / REFERENCE_HALF_WIDTH, MIN_FIT, 1);
    const x = portrait ? 0 : pose.x * halfWidth;
    const y = portrait ? pose.y * 0.35 + 0.75 : pose.y;
    const scale = portrait ? pose.s * PORTRAIT_SCALE : pose.s * fit;
    const float = reducedMotion.current ? 0 : Math.sin(time * 1.1) * 0.04;

    outer.current.position.set(x, y + float, 0);
    outer.current.rotation.set(pose.rx + p.smoothY * 0.06, 0, pose.rz);
    outer.current.scale.setScalar(scale);
    inner.current.rotation.y = pose.ry + p.smoothX * 0.14 + pose.sway * Math.sin(time * 0.45) * 0.7;
  });

  return (
    <group ref={outer}>
      <group ref={inner}>
        <Headphones color={finish.body} accent={finish.accent} live={live} />
      </group>
    </group>
  );
}

export default function Scene({ finish }: { finish: Finish }) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ fov: 35, position: [0, 0, 8], near: 0.1, far: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <ambientLight intensity={0.25} />
      <directionalLight position={[4, 6, 5]} intensity={1.6} />
      <directionalLight position={[-5, 2, -4]} intensity={0.8} color={finish.accent} />
      <Rig finish={finish} />
      {/* Estúdio procedural: sem HDRI externo, funciona offline. */}
      <Environment resolution={256} frames={1}>
        <color attach="background" args={['#050506']} />
        <Lightformer form="rect" intensity={5} position={[0, 6, 2]} rotation={[Math.PI / 2, 0, 0]} scale={[10, 6, 1]} />
        <Lightformer form="rect" intensity={3} position={[-7, 1, 2]} rotation={[0, Math.PI / 2, 0]} scale={[8, 1.2, 1]} />
        <Lightformer form="rect" intensity={3} position={[7, 1, -2]} rotation={[0, -Math.PI / 2, 0]} scale={[8, 1.2, 1]} />
        <Lightformer form="ring" intensity={2} position={[0, 0, 8]} scale={3} />
        <Lightformer form="rect" intensity={1.2} position={[0, -5, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[10, 10, 1]} color="#33363d" />
      </Environment>
    </Canvas>
  );
}
