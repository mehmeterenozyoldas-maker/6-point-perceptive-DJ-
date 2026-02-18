import { useRef, useState, useCallback, useEffect } from 'react';
import { AudioData } from '../types';

export const useTechnoGenerator = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const timerIDRef = useRef<number | null>(null);
  const beatCountRef = useRef<number>(0);
  const lastBeatTimeRef = useRef<number>(0); // For visual sync

  // Data bucket
  const dataArrayRef = useRef<Uint8Array>(new Uint8Array(64));
  const audioDataRef = useRef<AudioData>({
    frequency: new Uint8Array(64),
    average: 0,
    low: 0,
    mid: 0,
    high: 0,
  });

  const setupAudio = useCallback(async () => {
    if (audioContextRef.current) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    audioContextRef.current = ctx;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256; 
    analyser.smoothingTimeConstant = 0.8;
    analyserRef.current = analyser;

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.4;
    masterGain.connect(analyser);
    analyser.connect(ctx.destination);
    gainNodeRef.current = masterGain;
    
    dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
  }, []);

  // Scheduler parameters
  const tempo = 138; // Slightly faster for techno
  const lookahead = 25.0; 
  const scheduleAheadTime = 0.1; 

  const playKick = (time: number) => {
    if (!audioContextRef.current || !gainNodeRef.current) return;
    const ctx = audioContextRef.current;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(gainNodeRef.current);
    
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
    
    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
    
    osc.start(time);
    osc.stop(time + 0.5);
    
    // Mark beat time for visuals
    lastBeatTimeRef.current = time;
  };

  const playHiHat = (time: number) => {
    if (!audioContextRef.current || !gainNodeRef.current) return;
    const ctx = audioContextRef.current;

    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.value = 10000;

    const gain = ctx.createGain();
    
    noise.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(gainNodeRef.current);

    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

    noise.start(time);
  };

  const playBass = (time: number, note: number) => {
    if (!audioContextRef.current || !gainNodeRef.current) return;
    const ctx = audioContextRef.current;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.connect(gain);
    gain.connect(gainNodeRef.current);
    
    osc.frequency.setValueAtTime(note, time);
    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
    
    osc.start(time);
    osc.stop(time + 0.3);
  }

  const scheduleNote = (beatNumber: number, time: number) => {
    if (beatNumber % 4 === 0) {
      playKick(time);
    }
    if (beatNumber % 4 === 2) {
      playHiHat(time);
    }
    if (Math.random() > 0.4) {
        const notes = [55, 65, 55, 110];
        playBass(time, notes[Math.floor(Math.random() * notes.length)]);
    }
  };

  const scheduler = () => {
    if (!audioContextRef.current) return;
    
    while (nextNoteTimeRef.current < audioContextRef.current.currentTime + scheduleAheadTime) {
      scheduleNote(beatCountRef.current, nextNoteTimeRef.current);
      const secondsPerBeat = 60.0 / tempo;
      nextNoteTimeRef.current += 0.25 * secondsPerBeat;
      beatCountRef.current = (beatCountRef.current + 1) % 16;
    }
    timerIDRef.current = window.setTimeout(scheduler, lookahead);
  };

  const updateAnalysis = () => {
    if (!analyserRef.current) return;
    
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    
    const length = dataArrayRef.current.length;
    let sum = 0;
    let lowSum = 0;
    let midSum = 0;
    let highSum = 0;
    
    const lowBound = Math.floor(length * 0.1);
    const midBound = Math.floor(length * 0.5);

    for (let i = 0; i < length; i++) {
        const val = dataArrayRef.current[i];
        sum += val;
        if (i < lowBound) lowSum += val;
        else if (i < midBound) midSum += val;
        else highSum += val;
    }

    audioDataRef.current = {
        frequency: dataArrayRef.current,
        average: sum / length,
        low: lowSum / lowBound,
        mid: midSum / (midBound - lowBound),
        high: highSum / (length - midBound)
    };

    if (isPlaying) {
        requestAnimationFrame(updateAnalysis);
    }
  };

  const togglePlay = async () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (audioContextRef.current) {
        audioContextRef.current.suspend();
      }
      if (timerIDRef.current) {
        clearTimeout(timerIDRef.current);
      }
    } else {
      await setupAudio();
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      setIsPlaying(true);
      
      nextNoteTimeRef.current = audioContextRef.current!.currentTime + 0.1;
      beatCountRef.current = 0;
      scheduler();
      updateAnalysis();
    }
  };

  return {
    isPlaying,
    togglePlay,
    audioDataRef,
    lastBeatTimeRef,
    initAudio: setupAudio
  };
};