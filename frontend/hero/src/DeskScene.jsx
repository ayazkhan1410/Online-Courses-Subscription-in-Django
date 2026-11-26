import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const CODE_LINES = [
  'def lesson_day(n):',
  '    notebook = open_notes(n)',
  '    return practice(notebook)',
];

function useCodeTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#141210';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#c2410c';
    ctx.fillRect(0, 0, 6, canvas.height);
    ctx.font = '22px "JetBrains Mono", monospace';
    ctx.fillStyle = '#b7aea2';
    ctx.fillText('lesson.py', 28, 36);
    ctx.fillStyle = '#efe9de';
    CODE_LINES.forEach((line, i) => {
      ctx.fillText(line, 28, 88 + i * 36);
    });
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }, []);
}

function DeskRig({ children }) {
  const group = useRef();
  useFrame((state) => {
    if (!group.current) return;
    const x = state.pointer.x;
    const y = state.pointer.y;
    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y,
      x * 0.22,
      0.06
    );
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      -0.18 + y * -0.1,
      0.06
    );
  });
  return <group ref={group}>{children}</group>;
}

function Notebook() {
  return (
    <group position={[-0.95, -0.05, 0.2]} rotation={[0, 0.35, 0]}>
      <mesh position={[-0.02, 0, 0]} rotation={[0, 0, 0.08]}>
        <boxGeometry args={[0.95, 0.025, 1.2]} />
        <meshStandardMaterial color="#f3eee6" roughness={0.8} />
      </mesh>
      <mesh position={[0.45, 0.02, 0]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[0.92, 0.02, 1.16]} />
        <meshStandardMaterial color="#faf7f1" roughness={0.88} />
      </mesh>
      <mesh position={[-0.18, 0.02, -0.1]}>
        <boxGeometry args={[0.55, 0.004, 0.02]} />
        <meshStandardMaterial color="#5e554a" roughness={1} />
      </mesh>
      <mesh position={[-0.18, 0.02, 0.05]}>
        <boxGeometry args={[0.48, 0.004, 0.02]} />
        <meshStandardMaterial color="#5e554a" roughness={1} />
      </mesh>
      <mesh position={[-0.18, 0.02, 0.2]}>
        <boxGeometry args={[0.4, 0.004, 0.02]} />
        <meshStandardMaterial color="#5e554a" roughness={1} />
      </mesh>
    </group>
  );
}

function Laptop({ screenMap }) {
  return (
    <group position={[0.55, -0.05, 0]} rotation={[0, -0.4, 0]}>
      <mesh position={[0, 0, 0.1]}>
        <boxGeometry args={[1.45, 0.05, 0.95]} />
        <meshStandardMaterial color="#2a241e" roughness={0.55} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0.55, -0.42]} rotation={[-1.15, 0, 0]}>
        <boxGeometry args={[1.4, 0.9, 0.04]} />
        <meshStandardMaterial color="#1f1b16" roughness={0.5} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.55, -0.39]} rotation={[-1.15, 0, 0]}>
        <planeGeometry args={[1.22, 0.72]} />
        <meshBasicMaterial map={screenMap} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Scene() {
  const screenMap = useCodeTexture();
  return (
    <>
      <color attach="background" args={['#201e1b']} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[2.5, 4.5, 3]} intensity={1.45} color="#fff1dd" />
      <directionalLight position={[-3, 2, 1]} intensity={0.35} color="#ffe0c2" />
      <DeskRig>
        <mesh position={[0, -0.28, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[2.2, 48]} />
          <meshStandardMaterial color="#2f2b26" roughness={0.92} />
        </mesh>
        <Notebook />
        <Laptop screenMap={screenMap} />
      </DeskRig>
    </>
  );
}

export default function DeskScene() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 1.6, 3.2], fov: 38 }}
      gl={{ antialias: true, alpha: false }}
      style={{ width: '100%', height: '100%' }}
      frameloop={reduced ? 'demand' : 'always'}
    >
      <Scene />
    </Canvas>
  );
}
