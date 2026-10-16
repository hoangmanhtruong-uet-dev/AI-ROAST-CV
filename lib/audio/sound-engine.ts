'use client';

import { useState, useEffect } from 'react';

/**
 * Procedural Web Audio Engine (AI Roast CV V2.0 - Milestone 1)
 * Generates dynamic sound effects via Web Audio API with 0 KB external audio files.
 * Defaults to MUTED. JSDOM & SSR safe.
 */

export type SoundEffectType = 'blip' | 'laser' | 'heartbeat' | 'flame';

export const SOUND_STORAGE_KEY = 'airoastcv:sound_muted';
export const SOUND_TOGGLE_EVENT = 'airoastcv:sound-toggle';

export interface ISoundEngine {
  isSupported(): boolean;
  isMuted(): boolean;
  getIsMuted(): boolean;
  setMuted(muted: boolean): void;
  toggleMute(): boolean;
  play(sound: SoundEffectType): void;
  playBlip(): void;
  playLaser(): void;
  playHeartbeat(): void;
  playFlame(): void;
  getAudioContext(): AudioContext | null;
  subscribe(listener: (isMuted: boolean) => void): () => void;
  resetForTesting(): void;
}

export class ProceduralSoundEngine implements ISoundEngine {
  private audioCtx: AudioContext | null = null;
  private muted: boolean = true;
  private masterGain: GainNode | null = null;
  private listeners: Set<(isMuted: boolean) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(SOUND_STORAGE_KEY);
        // Default to true (muted) unless explicitly unmuted previously
        this.muted = stored === null ? true : stored === 'true';
      } catch {
        this.muted = true;
      }
    }
  }

  public isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      (typeof window.AudioContext !== 'undefined' ||
        typeof (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext !==
          'undefined')
    );
  }

  private initContext(): boolean {
    if (!this.isSupported()) return false;

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return false;

    try {
      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.3, this.audioCtx.currentTime);
        this.masterGain.connect(this.audioCtx.destination);
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }

      return true;
    } catch {
      return false;
    }
  }

  public resetForTesting(): void {
    if (this.audioCtx) {
      try {
        this.audioCtx.close().catch(() => {});
      } catch {}
    }
    this.audioCtx = null;
    this.masterGain = null;
    this.listeners.clear();
    this.muted = true;
  }

  public getAudioContext(): AudioContext | null {
    return this.audioCtx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public getIsMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(SOUND_STORAGE_KEY, String(muted));
      } catch {}
      try {
        window.dispatchEvent(
          new CustomEvent(SOUND_TOGGLE_EVENT, { detail: { muted: this.muted } })
        );
      } catch {}
    }

    if (this.masterGain && this.audioCtx) {
      try {
        this.masterGain.gain.setValueAtTime(
          this.muted ? 0 : 0.3,
          this.audioCtx.currentTime
        );
      } catch {}
    }

    if (!muted) {
      this.initContext();
    }

    this.notify();
  }

  public toggleMute(): boolean {
    const next = !this.muted;
    this.setMuted(next);
    if (!next) {
      this.playBlip();
    }
    return next;
  }

  public subscribe(listener: (isMuted: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.muted);
      } catch {}
    }
  }

  public play(sound: SoundEffectType): void {
    if (this.muted) return;

    switch (sound) {
      case 'blip':
        this.playBlip();
        break;
      case 'laser':
        this.playLaser();
        break;
      case 'heartbeat':
        this.playHeartbeat();
        break;
      case 'flame':
        this.playFlame();
        break;
      default:
        break;
    }
  }

  /**
   * Tech Blip: short subtle click for UI interactions
   */
  public playBlip(): void {
    if (this.muted) return;
    if (!this.initContext() || !this.audioCtx || !this.masterGain) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.04);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {}
      };

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {}
  }

  /**
   * Laser Scan: Sci-fi frequency sweep for Hologram CV laser analysis
   */
  public playLaser(): void {
    if (this.muted) return;
    if (!this.initContext() || !this.audioCtx || !this.masterGain) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const filter = this.audioCtx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1600, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.2);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.Q.setValueAtTime(3, now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.onended = () => {
        try {
          osc.disconnect();
          filter.disconnect();
          gain.disconnect();
        } catch {}
      };

      osc.start(now);
      osc.stop(now + 0.22);
    } catch {}
  }

  /**
   * Heartbeat Pulse: deep rhythmic double-thud for Stress Interview countdown
   */
  public playHeartbeat(): void {
    if (this.muted) return;
    if (!this.initContext() || !this.audioCtx || !this.masterGain) return;

    try {
      const now = this.audioCtx.currentTime;
      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(160, now);
      filter.connect(this.masterGain);

      const playThump = (offset: number, intensity: number, startFreq: number, endFreq: number) => {
        if (!this.audioCtx) return;
        const t = now + offset;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(startFreq, t);
        osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.12);

        gain.gain.setValueAtTime(0.01, t);
        gain.gain.linearRampToValueAtTime(intensity, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);

        osc.connect(gain);
        gain.connect(filter);

        osc.onended = () => {
          try {
            osc.disconnect();
            gain.disconnect();
          } catch {}
        };

        osc.start(t);
        osc.stop(t + 0.13);
      };

      playThump(0, 0.25, 75, 35);
      playThump(0.14, 0.18, 85, 40);

      // Disconnect filter after both pulses complete
      setTimeout(() => {
        try {
          filter.disconnect();
        } catch {}
      }, 350);
    } catch {}
  }

  /**
   * Flame Whoosh: procedural noise crackle for Spicy Roast persona
   */
  public playFlame(): void {
    if (this.muted) return;
    if (!this.initContext() || !this.audioCtx || !this.masterGain) return;

    try {
      const now = this.audioCtx.currentTime;
      const bufferSize = Math.floor(this.audioCtx.sampleRate * 0.25);
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const data = buffer.getChannelData(0);

      // White noise with pink bias
      let b0 = 0,
        b1 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99 * b0 + white * 0.05;
        b1 = 0.95 * b1 + white * 0.1;
        data[i] = (b0 + b1 + white * 0.1) * 0.3;
      }

      const noise = this.audioCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(500, now);
      filter.frequency.exponentialRampToValueAtTime(180, now + 0.25);

      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.onended = () => {
        try {
          noise.disconnect();
          filter.disconnect();
          gain.disconnect();
        } catch {}
      };

      noise.start(now);
      noise.stop(now + 0.26);
    } catch {}
  }
}

export const soundEngine: ISoundEngine = new ProceduralSoundEngine();

/**
 * React Hook for consuming sound engine state & controls
 */
export function useSoundEngine() {
  const [isMuted, setIsMuted] = useState<boolean>(() => soundEngine.isMuted());

  useEffect(() => {
    setIsMuted(soundEngine.isMuted());
    const unsub = soundEngine.subscribe((muted) => {
      setIsMuted(muted);
    });
    return unsub;
  }, []);

  return {
    isMuted,
    toggleMute: () => soundEngine.toggleMute(),
    setMuted: (muted: boolean) => soundEngine.setMuted(muted),
    play: (sound: SoundEffectType) => soundEngine.play(sound),
    soundEngine,
  };
}
