import React, { useState, Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Noise, ChromaticAberration, Vignette, Scanline, Glitch, Pixelation } from '@react-three/postprocessing';
import { BlendFunction, GlitchMode, Effect } from 'postprocessing';
import { SketchWorld } from './components/SketchWorld';
import { Overlay } from './components/Overlay';
import { useTechnoGenerator } from './hooks/useTechnoGenerator';
import { VJState } from './types';
import * as THREE from 'three';

// --- Custom 6-Point / Fish-Eye Perspective Effect ---
class FishEyeEffectImpl extends Effect {
  constructor({ strength = 0.0 }) {
    super(
      'FishEyeEffect',
      `
        uniform float strength;
        void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
          vec2 d = uv - 0.5;
          float r = length(d);
          float power = r * r;
          
          // Spherical barrel distortion
          // This bows vertical lines OUTWARDS and horizontal lines curve based on height
          vec2 uvn = uv + d * strength * power;
          
          // Zoom correction handled by Camera distance effectively in this setup
          
          if (uvn.x < 0.0 || uvn.x > 1.0 || uvn.y < 0.0 || uvn.y > 1.0) {
             outputColor = vec4(0.0, 0.0, 0.0, 1.0);
          } else {
             outputColor = texture2D(inputBuffer, uvn); 
          }
        }
      `,
      {
        uniforms: new Map([['strength', new THREE.Uniform(strength)]]),
      }
    )
  }
}

const FishEye = ({ strength }: { strength: number }) => {
  const effect = useMemo(() => new FishEyeEffectImpl({ strength }), [strength]);
  return <primitive object={effect} dispose={null} />;
};

const PostProcessingEffects = ({ vjState }: { vjState: VJState }) => {
    return (
        <EffectComposer disableNormalPass>
            {/* High intensity bloom to simulate glowing pencil lines */}
            <Bloom luminanceThreshold={0.1} mipmapBlur intensity={0.6} radius={0.4} />
            
            <ChromaticAberration 
                offset={new THREE.Vector2(0.004, 0.004)}
                radialModulation={true}
                modulationOffset={0.5}
            />
            
            <Noise opacity={0.3} blendFunction={BlendFunction.OVERLAY} />
            
            {/* Stronger Distortion for the "Wrap" effect */}
            <FishEye strength={0.85} />

            <Vignette eskil={false} offset={0.15} darkness={0.8} />
            
            {vjState.glitchIntensity > 0 && (
                <Glitch 
                    delay={new THREE.Vector2(0.5, 1)} 
                    duration={new THREE.Vector2(0.1, 0.3)} 
                    strength={new THREE.Vector2(0.1 * vjState.glitchIntensity, 1.0 * vjState.glitchIntensity)} 
                    mode={GlitchMode.CONSTANT_MILD}
                />
            )}
            
            <Scanline density={2.5} opacity={0.08} />
        </EffectComposer>
    )
}

function App() {
  const { isPlaying, togglePlay, audioDataRef } = useTechnoGenerator();
  const [hasStarted, setHasStarted] = useState(false);
  
  const [vjState, setVjState] = useState<VJState>({
    visualMode: 'STUDIO',
    glitchIntensity: 0,
    colorShift: 0,
    pixelate: false,
    strobe: false
  });

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <Overlay 
        isPlaying={isPlaying} 
        togglePlay={togglePlay} 
        hasStarted={hasStarted}
        setHasStarted={setHasStarted}
        vjState={vjState}
        setVjState={setVjState}
      />
      
      <Canvas
        gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
        dpr={[1, 2]}
        // CAMERA SETUP:
        // Lower Y (0.8) and Closer Z (1.5) to feel like you are standing AT the desk.
        // Wide FOV (145) to capture the peripheral towers.
        camera={{ fov: 145, position: [0, 0.8, 1.5] }} 
      >
        <Suspense fallback={null}>
          <SketchWorld audioDataRef={audioDataRef} vjState={vjState} />
          <PostProcessingEffects vjState={vjState} />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default App;