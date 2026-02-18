import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, Stars, Float, CatmullRomLine, Text } from '@react-three/drei';
import * as THREE from 'three';
import { AudioData, VJState } from '../types';

interface SketchWorldProps {
  audioDataRef: React.MutableRefObject<AudioData>;
  vjState: VJState;
}

// --- DETAILED WIREFRAME HELPERS ---

const SketchBox = ({ args, color = "white", position, rotation }: any) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Main Outline */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(...args)]} />
        <lineBasicMaterial color={color} linewidth={2} toneMapped={false} />
      </lineSegments>
      {/* Internal Structural Bracing (X-Ray view) */}
      <Line points={[[-args[0]/2, -args[1]/2, 0], [args[0]/2, args[1]/2, 0]]} color={color} transparent opacity={0.1} />
      <Line points={[[args[0]/2, -args[1]/2, 0], [-args[0]/2, args[1]/2, 0]]} color={color} transparent opacity={0.1} />
    </group>
  );
};

const Cable = ({ start, end, slack = 0.5, color = "#333", animated = false, audioDataRef }: any) => {
    const lineRef = useRef<any>(null);
    const points = useMemo(() => {
        const s = new THREE.Vector3(...start);
        const e = new THREE.Vector3(...end);
        const mid = s.clone().lerp(e, 0.5);
        mid.y -= slack;
        return [s, mid, e] as THREE.Vector3[];
    }, [start, end, slack]);

    useFrame(() => {
        if (animated && lineRef.current && audioDataRef?.current) {
             const energy = audioDataRef.current.mid / 255;
             // Cables glow with energy
             lineRef.current.material.color.setHSL(0, 0, 0.2 + energy * 0.5);
             if (energy > 0.8) lineRef.current.material.linewidth = 2;
             else lineRef.current.material.linewidth = 1;
        }
    })

    return <CatmullRomLine ref={lineRef} points={points} color={color} lineWidth={1} segments={20} />;
};

const ConstructionLines = ({ count = 20, radius = 15, audioDataRef }: any) => {
    const groupRef = useRef<THREE.Group>(null);
    
    useFrame((state, delta) => {
        if (groupRef.current) {
            // Slow rotation
            groupRef.current.rotation.y += 0.05 * delta;
            
            // Pulse on bass
            if (audioDataRef?.current) {
                const bass = audioDataRef.current.low / 255;
                const targetScale = 1 + bass * 0.05;
                groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
            }
        }
    });

    return (
        <group ref={groupRef}>
            {/* Vertical Longitude Lines */}
            {Array.from({ length: 18 }).map((_, i) => (
                <mesh key={`long-${i}`} rotation={[0, (i / 18) * Math.PI, 0]}>
                    <ringGeometry args={[radius, radius + 0.04, 64]} />
                    <meshBasicMaterial color="#1a1a1a" side={THREE.DoubleSide} />
                </mesh>
            ))}
             {/* Horizontal Latitude Lines */}
             {Array.from({ length: 12 }).map((_, i) => (
                <mesh key={`lat-${i}`} rotation={[Math.PI / 2, 0, 0]} position={[0, (i - 6) * 3, 0]}>
                    <ringGeometry args={[radius, radius + 0.04, 64]} />
                    <meshBasicMaterial color="#1a1a1a" side={THREE.DoubleSide} />
                </mesh>
            ))}
        </group>
    )
}

const SketchSpeaker = ({ position, rotation, color = "white", audioDataRef, cableStart }: any) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (!groupRef.current) return;
    const bass = audioDataRef.current.low / 255;
    const scale = 1 + bass * 0.1;
    groupRef.current.scale.set(scale, scale, scale);
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Cabinet with detailed bracing */}
      <SketchBox args={[1.8, 5, 1.8]} color={color} />
      
      {/* Tweeter Housing */}
      <group position={[0, 1.5, 0.9]}>
         <mesh>
            <ringGeometry args={[0.4, 0.45, 32]} />
            <meshBasicMaterial color={color} side={THREE.DoubleSide} toneMapped={false} />
         </mesh>
         <Line points={[[-0.4, 0, 0], [0.4, 0, 0]]} color={color} />
         <Line points={[[0, -0.4, 0], [0, 0.4, 0]]} color={color} />
         {/* Screws */}
         {[0.5, -0.5].map((x, i) => (
            <mesh key={i} position={[x, 0.5, 0]}>
                 <circleGeometry args={[0.05, 8]} />
                 <meshBasicMaterial color={color} />
            </mesh>
         ))}
      </group>

      {/* Woofer Housing */}
      <group position={[0, -0.8, 0.9]}>
         <mesh>
            <ringGeometry args={[0.7, 0.75, 32]} />
            <meshBasicMaterial color={color} side={THREE.DoubleSide} toneMapped={false} />
         </mesh>
         {/* Ribs */}
         <mesh position={[0,0,-0.1]}>
            <ringGeometry args={[0.4, 0.42, 32]} />
            <meshBasicMaterial color={color} opacity={0.6} transparent />
         </mesh>
          <mesh position={[0,0,-0.2]}>
            <ringGeometry args={[0.2, 0.22, 32]} />
            <meshBasicMaterial color={color} opacity={0.4} transparent />
         </mesh>
      </group>
      
      {/* Cable Input Jack on back */}
      <mesh position={[0, -2, -0.9]}>
         <circleGeometry args={[0.1, 8]} />
         <meshBasicMaterial color="#333" />
      </mesh>
    </group>
  );
};

const SketchDeck = ({ position, rotation, audioDataRef }: any) => {
    const platterRef = useRef<THREE.Group>(null);
    useFrame((state, delta) => {
        if(platterRef.current) platterRef.current.rotation.z -= delta * 2; // RPM
    });

    return (
        <group position={position} rotation={rotation}>
            {/* Main Chassis */}
            <SketchBox args={[2.8, 0.3, 2.2]} color="white" />
            
            {/* Platter Detail */}
            <group position={[0.3, 0.15, 0]}>
                <group ref={platterRef}>
                     {/* Outer Ring */}
                     <mesh rotation={[-Math.PI/2, 0, 0]}>
                        <ringGeometry args={[0.9, 0.95, 48]} />
                        <meshBasicMaterial color="white" toneMapped={false} />
                     </mesh>
                     {/* Grooves (Vinyl texture lines) */}
                     {[0.7, 0.5, 0.3].map((r, i) => (
                         <mesh key={i} rotation={[-Math.PI/2, 0, 0]}>
                            <ringGeometry args={[r, r + 0.02, 32]} />
                            <meshBasicMaterial color="#555" />
                         </mesh>
                     ))}
                     {/* Label */}
                     <mesh rotation={[-Math.PI/2, 0, 0]}>
                        <circleGeometry args={[0.25, 16]} />
                        <meshBasicMaterial color="white" />
                     </mesh>
                </group>
                
                {/* Tone Arm Base */}
                <group position={[1.1, 0, -0.9]}>
                     <mesh rotation={[-Math.PI/2, 0, 0]}>
                        <circleGeometry args={[0.2, 16]} />
                        <meshBasicMaterial color="white" wireframe />
                     </mesh>
                     {/* Arm */}
                     <Line points={[[0, 0, 0], [-0.8, 0.1, 0.6]]} color="white" lineWidth={3} />
                     {/* Counterweight */}
                     <mesh position={[0.1, 0, -0.1]}>
                        <boxGeometry args={[0.15, 0.15, 0.2]} />
                        <meshBasicMaterial color="white" wireframe />
                     </mesh>
                </group>
            </group>
            
            {/* Pitch Fader (Right Side) */}
            <group position={[1.2, 0.16, 0.5]}>
                 <Line points={[[0, 0, -0.4], [0, 0, 0.4]]} color="#888" />
                 <mesh position={[0, 0, 0]}>
                     <boxGeometry args={[0.1, 0.05, 0.1]} />
                     <meshBasicMaterial color="white" />
                 </mesh>
                 <Text position={[0.2, 0, 0]} fontSize={0.1} color="#555" rotation={[-Math.PI/2, 0, 0]}>%</Text>
            </group>

            {/* Start/Stop Button */}
            <mesh position={[-1.1, 0.16, 0.8]} rotation={[-Math.PI/2, 0, 0]}>
                 <boxGeometry args={[0.3, 0.3, 0.1]} />
                 <meshBasicMaterial color="white" wireframe />
            </mesh>
        </group>
    )
};

const VUMeter = ({ position, audioDataRef, channel = 'left' }: any) => {
    const barRef = useRef<THREE.Group>(null);
    useFrame(() => {
        if (barRef.current && audioDataRef.current) {
            const level = channel === 'left' ? audioDataRef.current.low / 255 : audioDataRef.current.mid / 255;
            const bars = barRef.current.children;
            for (let i = 0; i < bars.length; i++) {
                const mesh = bars[i] as THREE.Mesh;
                // Light up bars based on volume
                const threshold = i / bars.length;
                if (level > threshold) {
                    (mesh.material as THREE.MeshBasicMaterial).color.setHex(0xffffff);
                    (mesh.material as THREE.MeshBasicMaterial).opacity = 1;
                } else {
                    (mesh.material as THREE.MeshBasicMaterial).color.setHex(0x333333);
                    (mesh.material as THREE.MeshBasicMaterial).opacity = 0.5;
                }
            }
        }
    })

    return (
        <group position={position} ref={barRef}>
            {Array.from({length: 8}).map((_, i) => (
                 <mesh key={i} position={[0, 0, -i * 0.1]} rotation={[-Math.PI/2, 0, 0]}>
                     <planeGeometry args={[0.1, 0.05]} />
                     <meshBasicMaterial color="#333" side={THREE.DoubleSide} />
                 </mesh>
            ))}
        </group>
    )
}

const SketchMixer = ({ position, rotation, audioDataRef }: any) => {
    return (
        <group position={position} rotation={rotation}>
             <SketchBox args={[2.2, 0.3, 2.5]} color="white" />
             
             {/* Center VU Meters */}
             <VUMeter position={[-0.2, 0.16, 0.2]} audioDataRef={audioDataRef} channel="left" />
             <VUMeter position={[0.2, 0.16, 0.2]} audioDataRef={audioDataRef} channel="right" />

             {/* EQ Knobs Channels */}
             {[-0.6, 0.6].map((x, i) => (
                 <group key={i} position={[x, 0.15, -0.5]}>
                     {[0, 0.5, 1.0].map((z, j) => (
                         <group key={j} position={[0, 0, -z]}>
                             <mesh rotation={[-Math.PI/2, 0, 0]}>
                                <circleGeometry args={[0.15, 16]} />
                                <meshBasicMaterial color="black" />
                             </mesh>
                             <mesh rotation={[-Math.PI/2, 0, 0]}>
                                <ringGeometry args={[0.14, 0.16, 16]} />
                                <meshBasicMaterial color="white" />
                             </mesh>
                             {/* Knob Indicator Line */}
                             <Line points={[[0, 0, 0], [0, 0.1, 0.1]]} color="white" />
                         </group>
                     ))}
                 </group>
             ))}

             {/* Crossfader */}
             <group position={[0, 0.15, 0.8]}>
                 <Line points={[[-0.5, 0, 0], [0.5, 0, 0]]} color="white" />
                 <mesh position={[0, 0, 0]}>
                     <boxGeometry args={[0.15, 0.1, 0.3]} />
                     <meshBasicMaterial color="white" wireframe />
                 </mesh>
             </group>
        </group>
    )
}

const SketchDJ = ({ audioDataRef }: any) => {
    const headRef = useRef<THREE.Group>(null);
    const leftArmRef = useRef<any>(null);
    const rightArmRef = useRef<any>(null);

    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        const beat = audioDataRef.current.low / 255;
        
        if (headRef.current) {
            headRef.current.position.y = 1.0 + Math.sin(time * 10) * 0.05 + beat * 0.05;
            headRef.current.rotation.z = Math.sin(time * 2) * 0.1;
            headRef.current.rotation.x = Math.sin(time * 4) * 0.05;
        }
    });

    const armWidth = 4;

    return (
        <group position={[0, -0.5, -1]}> 
             {/* HEAD DETAIL */}
             <group ref={headRef} position={[0, 1.0, 0]}>
                 <mesh>
                     <sphereGeometry args={[0.55, 16, 16]} />
                     <meshBasicMaterial color="black" />
                 </mesh>
                 <mesh>
                     <sphereGeometry args={[0.55, 16, 16]} />
                     <meshBasicMaterial color="white" wireframe />
                 </mesh>
                 
                 {/* HEADPHONES - Thicker band */}
                 <group rotation={[0, Math.PI/2, 0]}>
                     <mesh>
                         <torusGeometry args={[0.6, 0.1, 8, 24]} />
                         <meshBasicMaterial color="white" wireframe />
                     </mesh>
                     {/* Ear Cups */}
                     <mesh position={[0.6, 0, 0]} rotation={[0, Math.PI/2, 0]}>
                         <cylinderGeometry args={[0.2, 0.2, 0.1, 16]} />
                         <meshBasicMaterial color="white" wireframe />
                     </mesh>
                     <mesh position={[-0.6, 0, 0]} rotation={[0, Math.PI/2, 0]}>
                         <cylinderGeometry args={[0.2, 0.2, 0.1, 16]} />
                         <meshBasicMaterial color="white" wireframe />
                     </mesh>
                 </group>

                 {/* FACE - VISOR STYLE */}
                 <group position={[0, 0.05, 0.5]}>
                     <Line points={[[-0.3, 0, 0], [0.3, 0, 0]]} color="white" lineWidth={2} />
                     <mesh position={[-0.2, 0, 0]}>
                         <circleGeometry args={[0.1, 16]} />
                         <meshBasicMaterial color="white" />
                     </mesh>
                     <mesh position={[0.2, 0, 0]}>
                         <circleGeometry args={[0.1, 16]} />
                         <meshBasicMaterial color="white" />
                     </mesh>
                 </group>
             </group>

             {/* BODY DETAIL */}
             <group>
                 {/* Spine */}
                 <Line points={[[0, 1.0, 0], [0, -1, 0]]} color="white" lineWidth={armWidth} />
                 {/* Shoulders */}
                 <Line points={[[-0.6, 0.8, 0], [0.6, 0.8, 0]]} color="white" lineWidth={armWidth} />
                 {/* Shoulder Joints */}
                 <mesh position={[-0.6, 0.8, 0]}>
                     <sphereGeometry args={[0.1, 8, 8]} />
                     <meshBasicMaterial color="white" wireframe />
                 </mesh>
                 <mesh position={[0.6, 0.8, 0]}>
                     <sphereGeometry args={[0.1, 8, 8]} />
                     <meshBasicMaterial color="white" wireframe />
                 </mesh>
                 
                 {/* ARMS with Elbows */}
                 {/* Left Arm */}
                 <group>
                     <Line points={[[-0.6, 0.8, 0], [-1.0, 0.4, 0.5]]} color="white" lineWidth={3} /> {/* Upper */}
                     <mesh position={[-1.0, 0.4, 0.5]}>
                        <sphereGeometry args={[0.08, 8, 8]} />
                        <meshBasicMaterial color="white" />
                     </mesh>
                     <Line points={[[-1.0, 0.4, 0.5], [-1.5, 0.2, 1.5]]} color="white" lineWidth={3} /> {/* Lower */}
                     {/* Hand */}
                     <mesh position={[-1.5, 0.2, 1.5]}>
                         <sphereGeometry args={[0.12, 8, 8]} />
                         <meshBasicMaterial color="white" wireframe />
                     </mesh>
                 </group>

                 {/* Right Arm */}
                 <group>
                     <Line points={[[0.6, 0.8, 0], [1.0, 0.4, 0.5]]} color="white" lineWidth={3} />
                     <mesh position={[1.0, 0.4, 0.5]}>
                        <sphereGeometry args={[0.08, 8, 8]} />
                        <meshBasicMaterial color="white" />
                     </mesh>
                     <Line points={[[1.0, 0.4, 0.5], [1.5, 0.2, 1.5]]} color="white" lineWidth={3} />
                     <mesh position={[1.5, 0.2, 1.5]}>
                         <sphereGeometry args={[0.12, 8, 8]} />
                         <meshBasicMaterial color="white" wireframe />
                     </mesh>
                 </group>
             </group>
        </group>
    )
}

const ConsoleFrame = () => (
    <group position={[0, 0, 0]}>
        {/* Main Table Top Frame */}
        <Line 
            points={[
                [-5, 0.5, 3], [-2, 0.5, 0], [2, 0.5, 0], [5, 0.5, 3]
            ]}
            color="#555"
            lineWidth={2}
        />
        {/* Table Thickness */}
         <Line 
            points={[
                [-5, 0.3, 3], [-2, 0.3, 0], [2, 0.3, 0], [5, 0.3, 3]
            ]}
            color="#333"
            lineWidth={1}
        />
        {/* Vertical Supports */}
        <Line points={[[-5, 0.3, 3], [-5, 0.5, 3]]} color="#555" />
        <Line points={[[5, 0.3, 3], [5, 0.5, 3]]} color="#555" />
    </group>
)

// --- SCENES ---

const StudioScene = ({ audioDataRef }: any) => {
    return (
        <group position={[0, -1.5, 0]}>
             <SketchDJ audioDataRef={audioDataRef} />
             
             {/* CONSOLE LAYOUT */}
             <group position={[0, 0, 0.5]}>
                 <ConsoleFrame />

                 {/* CABLES: Mixer to Decks */}
                 <Cable start={[-0.8, 0.2, 0.5]} end={[-2.0, 0.2, 2.0]} slack={0.3} color="#444" />
                 <Cable start={[0.8, 0.2, 0.5]} end={[2.0, 0.2, 2.0]} slack={0.3} color="#444" />
                 
                 {/* CABLES: Main Output to Floor */}
                 <Cable start={[0, 0.2, 0]} end={[0, -2, -2]} slack={0} color="#333" />

                 <SketchMixer 
                    position={[0, 0.2, 0.8]} 
                    rotation={[0.3, 0, 0]} 
                    audioDataRef={audioDataRef} 
                 />
                 
                 <SketchDeck 
                    position={[-3.2, 0.5, 2.5]} 
                    rotation={[0.3, -0.4, 0.1]} 
                    audioDataRef={audioDataRef} 
                 />
                 
                 <SketchDeck 
                    position={[3.2, 0.5, 2.5]} 
                    rotation={[0.3, 0.4, -0.1]} 
                    audioDataRef={audioDataRef} 
                 />
             </group>

             {/* SPEAKERS */}
             <SketchSpeaker 
                position={[-5.5, 2.5, -1]} 
                rotation={[0, 0.6, -0.15]} 
                color="#00ffcc"
                audioDataRef={audioDataRef}
             />
             <Cable start={[-5.5, 0, -1]} end={[-2, -2, 0]} slack={1} color="#00ffcc" animated audioDataRef={audioDataRef} />

             <SketchSpeaker 
                position={[5.5, 2.5, -1]} 
                rotation={[0, -0.6, 0.15]} 
                color="#ff00aa" 
                audioDataRef={audioDataRef} 
             />
             <Cable start={[5.5, 0, -1]} end={[2, -2, 0]} slack={1} color="#ff00aa" animated audioDataRef={audioDataRef} />
        </group>
    )
}

const TunnelScene = ({ audioDataRef }: any) => {
    const tunnelRef = useRef<THREE.Group>(null);
    
    useFrame((state, delta) => {
        if (tunnelRef.current) {
            const speed = 10 * delta;
            tunnelRef.current.children.forEach((child: any) => {
                child.position.z += speed;
                if (child.position.z > 5) {
                    child.position.z -= 60; // Reset loop
                }
                // Rotate based on audio energy for immersive spin
                if(audioDataRef?.current) {
                     const energy = audioDataRef.current.mid / 255;
                     child.rotation.z += 0.005 + (0.02 * energy);
                }
            });
        }
    });

    return (
        <group ref={tunnelRef}>
            {Array.from({length: 20}).map((_, i) => (
                <group key={i} position={[0, 0, -i * 3]} rotation={[0, 0, i * 0.15]}>
                    <SketchBox args={[5, 3.5, 0.2]} color={i % 2 === 0 ? "white" : "#555"} />
                    {/* Tunnel Details */}
                    <Line points={[[-2.5, 0, 0], [2.5, 0, 0]]} color="#333" opacity={0.5} />
                    <Line points={[[0, -1.75, 0], [0, 1.75, 0]]} color="#333" opacity={0.5} />
                </group>
            ))}
        </group>
    )
}

const ReactivePillar = ({ index, audioDataRef }: any) => {
    const ref = useRef<THREE.Group>(null);
    useFrame(() => {
        if(ref.current && audioDataRef?.current) {
             // Map index to frequency band approximately
             const freqIndex = Math.floor(index * 2);
             const val = audioDataRef.current.frequency[freqIndex] || 0;
             const height = (val / 255) * 8;
             ref.current.scale.y = Math.max(0.1, height);
        }
    });
    
    // Spread pillars
    const x = (index - 5) * 4; 
    
    return (
        <group position={[x, 0, -20]}>
             <group ref={ref}>
                <SketchBox args={[2, 1, 2]} color="cyan" position={[0, 0.5, 0]} />
                <Line points={[[0, 0, 0], [0, 10, 0]]} color="cyan" opacity={0.2} transparent />
             </group>
        </group>
    )
}

const GridScene = ({ audioDataRef }: any) => {
    const gridRef = useRef<THREE.Group>(null);
    
    useFrame((state, delta) => {
        if(gridRef.current) {
            gridRef.current.position.z += 8 * delta;
             if (gridRef.current.position.z > 5) {
                    gridRef.current.position.z = 0;
            }
        }
    });

    return (
        <group position={[0, -2, 0]}>
            {/* Moving Floor/Ceiling */}
            <group ref={gridRef}>
                <gridHelper args={[80, 40, "white", "#222"]} position={[0, 0, -20]} />
                <gridHelper args={[80, 40, "white", "#222"]} position={[0, 10, -20]} />
            </group>
            
            {/* Audio Reactive Pillars on Horizon */}
            {Array.from({length: 12}).map((_, i) => (
               <ReactivePillar key={i} index={i} audioDataRef={audioDataRef} />
            ))}
        </group>
    )
}

export const SketchWorld: React.FC<SketchWorldProps> = ({ audioDataRef, vjState }) => {
  return (
    <>
      <color attach="background" args={['#050505']} />
      
      <ConstructionLines count={24} radius={18} audioDataRef={audioDataRef} />

      {vjState.visualMode === 'STUDIO' && <StudioScene audioDataRef={audioDataRef} />}
      {vjState.visualMode === 'TUNNEL' && <TunnelScene audioDataRef={audioDataRef} />}
      {vjState.visualMode === 'GRID' && <GridScene audioDataRef={audioDataRef} />}
      
      {/* Atmosphere particles */}
      <Stars radius={40} count={1500} factor={2} fade speed={1} opacity={0.4} />
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
         {/* Random floating geometric "notes" */}
         {Array.from({length: 10}).map((_, i) => (
             <mesh key={i} position={[(Math.random()-0.5)*10, Math.random()*5, (Math.random()-0.5)*5]}>
                 <octahedronGeometry args={[0.1, 0]} />
                 <meshBasicMaterial color="white" wireframe transparent opacity={0.3} />
             </mesh>
         ))}
      </Float>
    </>
  );
};