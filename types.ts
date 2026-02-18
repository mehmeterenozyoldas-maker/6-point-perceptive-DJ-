export interface AudioData {
  frequency: Uint8Array;
  average: number;
  low: number;   // Bass
  mid: number;   // Mids
  high: number;  // Treble
}

export type VisualMode = 'STUDIO' | 'TUNNEL' | 'GRID';

export interface VJState {
  visualMode: VisualMode;
  glitchIntensity: number;
  colorShift: number;
  pixelate: boolean;
  strobe: boolean;
}

export interface AudioContextState {
  isPlaying: boolean;
  togglePlay: () => void;
  audioData: AudioData;
  initAudio: () => Promise<void>;
}
