import React from 'react';
import { VJState, VisualMode } from '../types';

interface OverlayProps {
  isPlaying: boolean;
  togglePlay: () => void;
  hasStarted: boolean;
  setHasStarted: (v: boolean) => void;
  vjState: VJState;
  setVjState: React.Dispatch<React.SetStateAction<VJState>>;
}

export const Overlay: React.FC<OverlayProps> = ({ 
    isPlaying, 
    togglePlay, 
    hasStarted, 
    setHasStarted,
    vjState,
    setVjState 
}) => {
  
  if (!hasStarted) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-black text-white p-8">
        <div className="max-w-md text-center space-y-8 border border-white/20 p-12 bg-neutral-900/50 backdrop-blur-sm shadow-[0_0_50px_rgba(255,255,255,0.1)]">
          <h1 className="text-4xl font-bold tracking-tighter uppercase font-mono">
            Techno Construct
          </h1>
          <p className="text-gray-400 font-mono text-sm leading-relaxed">
            VJ Tool & Interactive Installation.
            <br/>
            6-Point Perspective Interpretation.
          </p>
          <button 
            onClick={() => {
              setHasStarted(true);
              togglePlay();
            }}
            className="group relative px-8 py-3 bg-white text-black font-bold uppercase tracking-widest hover:bg-cyan-400 transition-colors duration-300"
          >
            INITIALIZE SYSTEM
            <div className="absolute inset-0 border border-white translate-x-1 translate-y-1 -z-10 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform" />
          </button>
        </div>
      </div>
    );
  }

  const updateState = (key: keyof VJState, value: any) => {
      setVjState(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="absolute inset-0 z-40 pointer-events-none flex flex-col justify-between p-6">
      {/* Header */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="space-y-1">
            <h2 className="text-white/50 text-xs font-mono uppercase tracking-widest">VJ INTERFACE</h2>
            <div className="text-white font-bold tracking-tighter">MODE: {vjState.visualMode}</div>
        </div>
        
        {/* Play/Pause */}
        <button onClick={togglePlay} className="px-4 py-1 bg-white/10 border border-white/20 text-xs font-mono uppercase hover:bg-white/20">
            {isPlaying ? "STOP AUDIO" : "START AUDIO"}
        </button>
      </div>

      {/* VJ DASHBOARD - Right Side */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-auto flex flex-col gap-4">
        
        {/* Scene Select */}
        <div className="flex flex-col gap-2 bg-black/50 p-4 border border-white/10 backdrop-blur-md w-32">
            <div className="text-[10px] text-white/50 font-mono">SCENE SELECT</div>
            {(['STUDIO', 'TUNNEL', 'GRID'] as VisualMode[]).map(mode => (
                <button
                    key={mode}
                    onClick={() => updateState('visualMode', mode)}
                    className={`text-xs text-left px-2 py-1 font-mono border-l-2 ${vjState.visualMode === mode ? 'border-cyan-400 text-cyan-400 bg-cyan-900/20' : 'border-transparent text-white hover:text-cyan-200'}`}
                >
                    {mode}
                </button>
            ))}
        </div>

        {/* Effects */}
        <div className="flex flex-col gap-2 bg-black/50 p-4 border border-white/10 backdrop-blur-md w-32">
            <div className="text-[10px] text-white/50 font-mono">FX UNIT</div>
            
            <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-xs font-mono text-white group-hover:text-cyan-400">PIXELATE</span>
                <input 
                    type="checkbox" 
                    checked={vjState.pixelate} 
                    onChange={(e) => updateState('pixelate', e.target.checked)}
                    className="accent-cyan-400" 
                />
            </label>

            <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-xs font-mono text-white group-hover:text-cyan-400">STROBE</span>
                <input 
                    type="checkbox" 
                    checked={vjState.strobe} 
                    onChange={(e) => updateState('strobe', e.target.checked)}
                    className="accent-cyan-400" 
                />
            </label>

            <div className="pt-2">
                 <div className="text-[9px] text-white/50 font-mono mb-1">GLITCH INTENSITY</div>
                 <input 
                    type="range" 
                    min="0" max="1" step="0.1" 
                    value={vjState.glitchIntensity}
                    onChange={(e) => updateState('glitchIntensity', parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyan-400"
                 />
            </div>
        </div>

      </div>

      {/* Footer Info */}
      <div className="flex justify-between items-end text-white/30 text-[10px] font-mono pointer-events-auto w-full">
        <div>
           SYSTEM READY
        </div>
        <div>
            6-POINT-PERSPECTIVE EMULATION
        </div>
      </div>
    </div>
  );
};
