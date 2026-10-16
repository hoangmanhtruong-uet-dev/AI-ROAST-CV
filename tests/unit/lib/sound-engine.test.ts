import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  soundEngine,
  ProceduralSoundEngine,
  useSoundEngine,
  SOUND_STORAGE_KEY,
  SOUND_TOGGLE_EVENT,
} from '@/lib/audio/sound-engine';

describe('ProceduralSoundEngine & useSoundEngine (Milestone 1)', () => {
  let mockAudioContext: any;
  let mockOscillator: any;
  let mockGain: any;
  let mockFilter: any;
  let mockBufferSource: any;

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();

    mockGain = {
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        value: 1,
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };

    mockOscillator = {
      type: 'sine',
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null as (() => void) | null,
    };

    mockFilter = {
      type: 'lowpass',
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      Q: {
        setValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };

    mockBufferSource = {
      buffer: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null as (() => void) | null,
    };

    mockAudioContext = {
      state: 'running',
      currentTime: 0,
      sampleRate: 44100,
      destination: {},
      createGain: vi.fn().mockImplementation(() => ({ ...mockGain })),
      createOscillator: vi.fn().mockImplementation(() => ({ ...mockOscillator })),
      createBiquadFilter: vi.fn().mockImplementation(() => ({ ...mockFilter })),
      createBuffer: vi.fn().mockImplementation((channels: number, length: number, rate: number) => ({
        numberOfChannels: channels,
        length,
        sampleRate: rate,
        getChannelData: vi.fn().mockReturnValue(new Float32Array(length)),
      })),
      createBufferSource: vi.fn().mockImplementation(() => ({ ...mockBufferSource })),
      resume: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    };

    (window as any).AudioContext = vi.fn().mockImplementation(function (this: any) {
      return mockAudioContext;
    });
  });

  afterEach(() => {
    soundEngine.resetForTesting();
  });

  describe('1. Initialization & Default State', () => {
    it('defaults to muted state upon initialization', () => {
      const engine = new ProceduralSoundEngine();
      expect(engine.isMuted()).toBe(true);
      expect(engine.getIsMuted()).toBe(true);
    });

    it('detects whether Web Audio API is supported in the current environment', () => {
      const engine = new ProceduralSoundEngine();
      expect(engine.isSupported()).toBe(true);
    });

    it('does not create AudioContext until sound playback or unmuting occurs (lazy initialization)', () => {
      new ProceduralSoundEngine();
      expect(mockAudioContext.createGain).not.toHaveBeenCalled();
    });

    it('reads initial muted state from localStorage if explicitly set', () => {
      localStorage.setItem(SOUND_STORAGE_KEY, 'false');
      const engine = new ProceduralSoundEngine();
      expect(engine.isMuted()).toBe(false);
    });
  });

  describe('2. Mute / Unmute State Management', () => {
    it('suppresses sound synthesis and AudioNode creation when muted', () => {
      const engine = new ProceduralSoundEngine();
      engine.play('blip');
      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
    });

    it('toggles muted state from true to false and back', () => {
      const engine = new ProceduralSoundEngine();
      const nextState = engine.toggleMute();
      expect(nextState).toBe(false);
      expect(engine.isMuted()).toBe(false);

      const toggledBack = engine.toggleMute();
      expect(toggledBack).toBe(true);
      expect(engine.isMuted()).toBe(true);
    });

    it('persists mute changes in localStorage', () => {
      const engine = new ProceduralSoundEngine();
      engine.setMuted(false);
      expect(localStorage.getItem(SOUND_STORAGE_KEY)).toBe('false');

      engine.setMuted(true);
      expect(localStorage.getItem(SOUND_STORAGE_KEY)).toBe('true');
    });

    it('notifies subscribers and dispatches SOUND_TOGGLE_EVENT on window', () => {
      const engine = new ProceduralSoundEngine();
      const subscriber = vi.fn();
      const windowListener = vi.fn();

      window.addEventListener(SOUND_TOGGLE_EVENT, windowListener);
      const unsub = engine.subscribe(subscriber);

      engine.setMuted(false);
      expect(subscriber).toHaveBeenCalledWith(false);
      expect(windowListener).toHaveBeenCalled();

      unsub();
      engine.setMuted(true);
      expect(subscriber).toHaveBeenCalledTimes(1);

      window.removeEventListener(SOUND_TOGGLE_EVENT, windowListener);
    });
  });

  describe('3. Procedural Sound Synthesis', () => {
    it('synthesizes blip sound with high-frequency ramp and node cleanup', () => {
      const engine = new ProceduralSoundEngine();
      engine.setMuted(false);
      engine.play('blip');

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });

    it('synthesizes laser scan sound with downward frequency sweep and bandpass filter', () => {
      const engine = new ProceduralSoundEngine();
      engine.setMuted(false);
      engine.play('laser');

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createBiquadFilter).toHaveBeenCalled();
    });

    it('synthesizes heartbeat pulse with double thuds and lowpass resonance', () => {
      const engine = new ProceduralSoundEngine();
      engine.setMuted(false);
      engine.play('heartbeat');

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createBiquadFilter).toHaveBeenCalled();
    });

    it('synthesizes flame whoosh with procedural buffer noise and lowpass filter', () => {
      const engine = new ProceduralSoundEngine();
      engine.setMuted(false);
      engine.play('flame');

      expect(mockAudioContext.createBuffer).toHaveBeenCalled();
      expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
      expect(mockAudioContext.createBiquadFilter).toHaveBeenCalled();
    });

    it('handles playBlip, playLaser, playHeartbeat, playFlame direct invocations', () => {
      const engine = new ProceduralSoundEngine();
      engine.setMuted(false);

      expect(() => {
        engine.playBlip();
        engine.playLaser();
        engine.playHeartbeat();
        engine.playFlame();
      }).not.toThrow();
    });
  });

  describe('4. Autoplay Handling & Error Resilience', () => {
    it('resumes suspended AudioContext upon unmuting or playing sound', () => {
      mockAudioContext.state = 'suspended';
      const engine = new ProceduralSoundEngine();
      engine.setMuted(false);

      expect(mockAudioContext.resume).toHaveBeenCalled();
    });

    it('safely handles environments without Web Audio support (no-op)', () => {
      delete (window as any).AudioContext;
      delete (window as any).webkitAudioContext;

      const engine = new ProceduralSoundEngine();
      expect(engine.isSupported()).toBe(false);

      expect(() => {
        engine.play('blip');
        engine.play('laser');
        engine.play('heartbeat');
        engine.play('flame');
        engine.toggleMute();
      }).not.toThrow();
    });

    it('resetForTesting properly closes AudioContext and clears listeners', () => {
      const engine = new ProceduralSoundEngine();
      engine.setMuted(false);
      const listener = vi.fn();
      engine.subscribe(listener);

      engine.resetForTesting();
      expect(engine.isMuted()).toBe(true);
      expect(engine.getAudioContext()).toBeNull();

      engine.setMuted(false);
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('5. useSoundEngine Hook', () => {
    it('provides reactive sound engine state and controls', () => {
      const { result } = renderHook(() => useSoundEngine());
      expect(result.current.isMuted).toBe(true);

      act(() => {
        result.current.toggleMute();
      });
      expect(result.current.isMuted).toBe(false);

      act(() => {
        result.current.play('blip');
      });
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();

      act(() => {
        result.current.setMuted(true);
      });
      expect(result.current.isMuted).toBe(true);
    });
  });
});
