import { Canvas } from "@react-three/fiber";
import { Float, OrbitControls } from "@react-three/drei";

function Ball() {
  return (
    <Float speed={1.3} rotationIntensity={0.8} floatIntensity={1.2}>
      <mesh castShadow position={[0, 0.6, 0]}>
        <icosahedronGeometry args={[0.62, 1]} />
        <meshStandardMaterial color="#f43f5e" roughness={0.35} metalness={0.25} />
      </mesh>
    </Float>
  );
}

function TurfBase() {
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
      <circleGeometry args={[2.2, 64]} />
      <meshStandardMaterial color="#0ea5e9" roughness={0.9} metalness={0.05} />
    </mesh>
  );
}

export function HeroScene() {
  return (
    <div className="relative h-[360px] w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-fuchsia-950">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-10 -top-10 h-52 w-52 rounded-full bg-rose-400/20 blur-2xl" />
        <div className="absolute -bottom-12 right-0 h-56 w-56 rounded-full bg-sky-400/15 blur-2xl" />
      </div>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [2.6, 1.3, 2.6], fov: 42 }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight
          intensity={1.2}
          position={[3.5, 4, 2]}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight intensity={0.7} position={[-2.5, 1.5, -1.5]} color="#a78bfa" />
        <Ball />
        <TurfBase />
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      </Canvas>
      <div className="absolute bottom-3 left-3 rounded-full bg-black/40 px-3 py-1 text-xs font-semibold text-slate-200 backdrop-blur">
        3D preview
      </div>
    </div>
  );
}

