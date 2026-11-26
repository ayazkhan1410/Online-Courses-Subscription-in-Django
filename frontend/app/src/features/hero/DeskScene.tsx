import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef, type RefObject } from 'react'
import type { Group } from 'three'
import * as THREE from 'three'

function screenTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 320
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = '#1b1815'
    ctx.fillRect(0, 0, 512, 320)
    ctx.font = '22px monospace'
    const lines = [
      'def greet(name):',
      '    return f"Hello, {name}"',
      '',
      'print(greet("desk"))',
    ]
    lines.forEach((line, index) => {
      ctx.fillStyle = index === 0 ? '#5fbf83' : '#efe6d6'
      ctx.fillText(line, 28, 72 + index * 36)
    })
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

function Desk({ pointer }: { pointer: RefObject<{ x: number; y: number }> }) {
  const group = useRef<Group>(null)
  const texture = useMemo(() => screenTexture(), [])

  useFrame((_, delta) => {
    const node = group.current
    const aim = pointer.current
    if (!node || !aim) return
    const max = (6 * Math.PI) / 180
    const targetX = aim.y * max
    const targetY = aim.x * max
    const k = 1 - Math.exp(-4 * delta)
    node.rotation.x += (targetX - node.rotation.x) * k
    node.rotation.y += (targetY - node.rotation.y) * k
  })

  return (
    <group ref={group}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]}>
        <circleGeometry args={[2.6, 48]} />
        <meshStandardMaterial color="#3a332c" roughness={0.92} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.05, -0.11, 0.15]}>
        <circleGeometry args={[1.15, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.18} />
      </mesh>

      <group position={[0.2, 0.34, -0.45]} rotation={[-0.2, -0.25, 0]}>
        <mesh position={[0, -0.02, 0.18]}>
          <boxGeometry args={[1.2, 0.045, 0.8]} />
          <meshStandardMaterial color="#2a2520" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.42, -0.18]}>
          <boxGeometry args={[1.2, 0.74, 0.04]} />
          <meshStandardMaterial color="#1b1815" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.42, -0.155]}>
          <planeGeometry args={[1.02, 0.58]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
      </group>

      <group position={[-0.15, 0.02, 0.35]} rotation={[-0.55, 0.2, 0.02]}>
        <mesh position={[-0.46, 0, 0]}>
          <boxGeometry args={[0.88, 0.02, 1.12]} />
          <meshStandardMaterial color="#efe6d6" roughness={0.96} />
        </mesh>
        <mesh position={[0.46, 0, 0]}>
          <boxGeometry args={[0.88, 0.02, 1.12]} />
          <meshStandardMaterial color="#f6efe3" roughness={0.96} />
        </mesh>
        <mesh position={[0, -0.008, 0]}>
          <boxGeometry args={[0.05, 0.028, 1.12]} />
          <meshStandardMaterial color="#c4b6a2" roughness={1} />
        </mesh>
        {Array.from({ length: 7 }, (_, index) => (
          <mesh key={index} position={[0.46, 0.012, -0.42 + index * 0.14]}>
            <boxGeometry args={[0.72, 0.002, 0.006]} />
            <meshStandardMaterial color="#d5cbbd" />
          </mesh>
        ))}
      </group>

      <ambientLight intensity={0.28} />
      <spotLight
        position={[-1.8, 2.6, 1.4]}
        angle={0.55}
        penumbra={0.85}
        intensity={18}
        color="#f3d2a6"
      />
    </group>
  )
}

export default function DeskScene({
  pointer,
}: {
  pointer: RefObject<{ x: number; y: number }>
}) {
  return (
    <Canvas
      className="h-full w-full"
      camera={{ position: [0.35, 1.35, 2.7], fov: 35 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
    >
      <Desk pointer={pointer} />
    </Canvas>
  )
}
