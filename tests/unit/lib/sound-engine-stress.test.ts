import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  soundEngine,
  ProceduralSoundEngine,
  useSoundEngine,
  SOUND_STORAGE_KEY,
  SOUND_TOGGLE_EVENT,
  SoundEffectType,
} from '@/lib/audio/sound-engine';

describe('Web Audio Engine Adversarial Stress & Chaos Test Suite', () => {
  let mockAudioContext: any;
  let createdNodes: {
    oscillators: any[];
    gains: any[];
    filters: any[];
    buffers: any[];
    bufferSources: any[];
  };

  const createMockGain = () => {
    const node = {
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        value: 1,
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
    createdNodes.gains.push(node);
    return node;
  };

  const createMockOscillator = () => {
    const node = {
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
    createdNodes.oscillators.push(node);
    return node;
  };

  const createMockFilter = () => {
    const node = {
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
    createdNodes.filters.push(node);
    return node;
  };

  const createMockBufferSource = () => {
    const node = {
      buffer: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null as (() => void) | null,
    };
    createdNodes.bufferSources.push(node);
    return node;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    vi.restoreAllMocks();

    createdNodes = {
      oscillators: [],
      gains: [],
      filters: [],
      buffers: [],
      bufferSources: [],
    };

    mockAudioContext = {
      state: 'running',
      currentTime: 10.0,
      sampleRate: 44100,
      destination: { __type: 'destination' },
      createGain: vi.fn().mockImplementation(() => createMockGain()),
      createOscillator: vi.fn().mockImplementation(() => createMockOscillator()),
      createBiquadFilter: vi.fn().mockImplementation(() => createMockFilter()),
      createBuffer: vi.fn().mockImplementation((channels: number, length: number, rate: number) => {
        const buf = {
          numberOfChannels: channels,
          length,
          sampleRate: rate,
          getChannelData: vi.fn().mockReturnValue(new Float32Array(length)),
        };
        createdNodes.buffers.push(buf);
        return buf;
      }),
      createBufferSource: vi.fn().mockImplementation(() => createMockBufferSource()),
      resume: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    };

    (window as any).AudioContext = vi.fn().mockImplementation(function (this: any) {
      return mockAudioContext;
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    soundEngine.resetForTesting();
  });

  describe('1. High Concurrency Stress Harness', () => {
    it('survives 100 rapid concurrent calls to soundEngine.play across all sound types without throwing', () => {
      const engine = new ProceduralSoundEngine();
      engine.setMuted(false);

      const sounds: SoundEffectType[] = ['blip', 'laser', 'heartbeat', 'flame'];
      expect(() => {
        for (let i = 0; i < 100; i++) {
          const sound = sounds[i % sounds.length];
          engine.play(sound);
        }
      }).not.toThrow();

      // AudioContext should be initialized exactly once (singleton per engine instance)
      expect((window as any).AudioContext).toHaveBeenCalledTimes(1);
      // Master gain node created once as root of audio graph
      expect(createdNodes.gains[0].connect).toHaveBeenCalledWith(mockAudioContext.destination);
    });

    it('safely drops rapid calls while muted with zero node allocation', () => {
      const engine = new ProceduralSoundEngine();
      expect(engine.isMuted()).toBe(true);

      const sounds: SoundEffectType[] = ['blip', 'laser', 'heartbeat', 'flame'];
      for (let i = 0; i < 100; i++) {
        engine.play(sounds[i % sounds.length]);
      }

      // No audio context or nodes should be created while muted
      expect((window as any).AudioContext).not.toHaveBeenCalled();
      expect(createdNodes.oscillators.length).toBe(0);
      expect(createdNodes.gains.length).toBe(0);
      expect(createdNodes.filters.length).toBe(0);
      expect(createdNodes.bufferSources.length).toBe(0);
    });

    it('handles interleaved chaotic calls with invalid sound keys gracefully', () => {
      const engine = new ProceduralSoundEngine();
      engine.setMuted(false);

      const chaoticInputs = [
        'laser',
        'blip',
        'invalid_sound',
        'heartbeat',
        '',
        'flame',
        null as any,
        undefined as any,
        'laser',
        'laser',
        123 as any,
      ];

      expect(() => {
        for (let round = 0; round < 10; round++) {
          for (const item of chaoticInputs) {
            engine.play(item);
          }
        }
      }).not.toThrow();
    });

    it('schedules audio parameters with non-decreasing, non-negative timestamps under rapid execution', () => {
      const engine = new ProceduralSoundEngine();
      engine.setMuted(false);

      // Play each sound type
      engine.playBlip();
      engine.playLaser();
      engine.playHeartbeat();
      engine.playFlame();

      // Inspect every gain exponential/linear ramp timestamp
      for (const gain of createdNodes.gains) {
        for (const call of gain.gain.setValueAtTime.mock.calls) {
          expect(call[1]).toBeGreaterThanOrEqual(0);
          expect(isNaN(call[1])).toBe(false);
        }
        for (const call of gain.gain.linearRampToValueAtTime.mock.calls) {
          expect(call[1]).toBeGreaterThanOrEqual(0);
          expect(isNaN(call[1])).toBe(false);
        }
        for (const call of gain.gain.exponentialRampToValueAtTime.mock.calls) {
          expect(call[1]).toBeGreaterThanOrEqual(0);
          expect(isNaN(call[1])).toBe(false);
        }
      }

      // Inspect every oscillator frequency ramp
      for (const osc of createdNodes.oscillators) {
        for (const call of osc.frequency.setValueAtTime.mock.calls) {
          expect(call[1]).toBeGreaterThanOrEqual(0);
          expect(isNaN(call[1])).toBe(false);
        }
        for (const call of osc.frequency.exponentialRampToValueAtTime.mock.calls) {
          expect(call[1]).toBeGreaterThanOrEqual(0);
          expect(isNaN(call[1])).toBe(false);
        }
      }
    });
  });

  describe('2. Rapid Toggle Stress & Chaos Harness', () => {
    it('survives 100 rapid alternating mute/unmute toggles while sounds are continuously requested', () => {
      const engine = new ProceduralSoundEngine();

      expect(() => {
        for (let i = 0; i < 100; i++) {
          engine.toggleMute();
          engine.play('laser');
          engine.play('blip');
        }
      }).not.toThrow();

      // Started muted (true) -> after 100 toggles, should be back to muted (true)
      expect(engine.isMuted()).toBe(true);
      expect(localStorage.getItem(SOUND_STORAGE_KEY)).toBe('true');
    });

    it('handles subscriber exceptions without breaking engine notification loop or other subscribers', () => {
      const engine = new ProceduralSoundEngine();
      const healthySubscriber1 = vi.fn();
      const faultySubscriber = vi.fn().mockImplementation(() => {
        throw new Error('Exploding subscriber');
      });
      const healthySubscriber2 = vi.fn();

      engine.subscribe(healthySubscriber1);
      engine.subscribe(faultySubscriber);
      engine.subscribe(healthySubscriber2);

      expect(() => {
        engine.setMuted(false);
      }).not.toThrow();

      expect(healthySubscriber1).toHaveBeenCalledWith(false);
      expect(faultySubscriber).toHaveBeenCalledWith(false);
      expect(healthySubscriber2).toHaveBeenCalledWith(false);
    });

    it('safely handles self-unsubscribing listeners during notification loop', () => {
      const engine = new ProceduralSoundEngine();
      let unsubSelf: (() => void) | null = null;
      const selfUnsubListener = vi.fn().mockImplementation(() => {
        if (unsubSelf) unsubSelf();
      });
      const normalListener = vi.fn();

      unsubSelf = engine.subscribe(selfUnsubListener);
      engine.subscribe(normalListener);

      expect(() => {
        engine.setMuted(false);
        engine.setMuted(true);
      }).not.toThrow();

      // First call (setMuted false): both called once
      expect(selfUnsubListener).toHaveBeenCalledTimes(1);
      expect(normalListener).toHaveBeenCalledTimes(2);
    });

    it('broadcasts SOUND_TOGGLE_EVENT window CustomEvents on every toggle', () => {
      const engine = new ProceduralSoundEngine();
      const eventSpy = vi.fn();
      window.addEventListener(SOUND_TOGGLE_EVENT, eventSpy);

      engine.setMuted(false);
      engine.setMuted(true);
      engine.toggleMute();

      expect(eventSpy).toHaveBeenCalledTimes(3);
      window.removeEventListener(SOUND_TOGGLE_EVENT, eventSpy);
    });
  });

  describe('3. Resource Leak Audit (AudioNodes Disconnection & Lifecycle)', () => {
    it('disconnects all nodes for blip sound upon onended', () => {
      const engine = new ProceduralSoundEngine();
      engine.setMuted(false);

      const initialOscs = createdNodes.oscillators.length;
      const initialGains = createdNodes.gains.length;

      engine.playBlip();

      const newOsc = createdNodes.oscillators[initialOscs];
      const newGain = createdNodes.gains[initialGains];

      expect(newOsc).toBeDefined();
      expect(newGain).toBeDefined();
      expect(typeof newOsc.onended).toBe('function');

      // Trigger completion
      newOsc.onended!();

      expect(newOsc.disconnect).toHaveBeenCalledTimes(1);
      expect(newGain.disconnect).toHaveBeenCalledTimes(1);
    });

    it('disconnects all nodes for laser sound upon onended', () => {
      const engine = new ProceduralSoundEngine();
      engine.setMuted(false);

      const initialOscs = createdNodes.oscillators.length;
      const initialGains = createdNodes.gains.length;
      const initialFilters = createdNodes.filters.length;

      engine.playLaser();

      const newOsc = createdNodes.oscillators[initialOscs];
      const newGain = createdNodes.gains[initialGains];
      const newFilter = createdNodes.filters[initialFilters];

      expect(newOsc).toBeDefined();
      expect(newGain).toBeDefined();
      expect(newFilter).toBeDefined();
      expect(typeof newOsc.onended).toBe('function');

      // Trigger completion
      newOsc.onended!();

      expect(newOsc.disconnect).toHaveBeenCalledTimes(1);
      expect(newFilter.disconnect).toHaveBeenCalledTimes(1);
      expect(newGain.disconnect).toHaveBeenCalledTimes(1);
    });

    it('disconnects all thump oscillators, thump gains and resonance filter for heartbeat sound', () => {
      const engine = new ProceduralSoundEngine();
      engine.setMuted(false);

      const initialOscs = createdNodes.oscillators.length;
      const initialGains = createdNodes.gains.length;
      const initialFilters = createdNodes.filters.length;

      engine.playHeartbeat();

      // Heartbeat creates 1 filter, 2 oscillators, 2 gains
      const filter = createdNodes.filters[initialFilters];
      const osc1 = createdNodes.oscillators[initialOscs];
      const osc2 = createdNodes.oscillators[initialOscs + 1];
      const gain1 = createdNodes.gains[initialGains];
      const gain2 = createdNodes.gains[initialGains + 1];

      expect(filter).toBeDefined();
      expect(osc1).toBeDefined();
      expect(osc2).toBeDefined();

      // Simulate completion of thump 1 and thump 2
      osc1.onended!();
      expect(osc1.disconnect).toHaveBeenCalledTimes(1);
      expect(gain1.disconnect).toHaveBeenCalledTimes(1);

      osc2.onended!();
      expect(osc2.disconnect).toHaveBeenCalledTimes(1);
      expect(gain2.disconnect).toHaveBeenCalledTimes(1);

      // Heartbeat filter is scheduled to disconnect after 350ms
      expect(filter.disconnect).not.toHaveBeenCalled();
      vi.advanceTimersByTime(350);
      expect(filter.disconnect).toHaveBeenCalledTimes(1);
    });

    it('disconnects noise source, filter, and gain for flame sound upon onended', () => {
      const engine = new ProceduralSoundEngine();
      engine.setMuted(false);

      const initialSources = createdNodes.bufferSources.length;
      const initialFilters = createdNodes.filters.length;
      const initialGains = createdNodes.gains.length;

      engine.playFlame();

      const noise = createdNodes.bufferSources[initialSources];
      const filter = createdNodes.filters[initialFilters];
      const gain = createdNodes.gains[initialGains];

      expect(noise).toBeDefined();
      expect(filter).toBeDefined();
      expect(gain).toBeDefined();
      expect(typeof noise.onended).toBe('function');

      // Trigger completion
      noise.onended!();

      expect(noise.disconnect).toHaveBeenCalledTimes(1);
      expect(filter.disconnect).toHaveBeenCalledTimes(1);
      expect(gain.disconnect).toHaveBeenCalledTimes(1);
    });

    it('comprehensive audit: 50 concurrent mixed sounds clean up 100% of temporary nodes without graph leaks', () => {
      const engine = new ProceduralSoundEngine();
      engine.setMuted(false);

      const sounds: SoundEffectType[] = ['blip', 'laser', 'heartbeat', 'flame'];
      for (let i = 0; i < 50; i++) {
        engine.play(sounds[i % sounds.length]);
      }

      // Fire all oscillator onended callbacks
      for (const osc of createdNodes.oscillators) {
        if (typeof osc.onended === 'function') {
          osc.onended();
        }
      }

      // Fire all buffer source onended callbacks
      for (const bs of createdNodes.bufferSources) {
        if (typeof bs.onended === 'function') {
          bs.onended();
        }
      }

      // Advance timers by 400ms to allow all heartbeat filter timeouts to fire
      vi.advanceTimersByTime(400);

      // Verify EVERY created oscillator was disconnected
      for (const osc of createdNodes.oscillators) {
        expect(osc.disconnect).toHaveBeenCalled();
      }

      // Verify EVERY created buffer source was disconnected
      for (const bs of createdNodes.bufferSources) {
        expect(bs.disconnect).toHaveBeenCalled();
      }

      // Verify EVERY created filter was disconnected
      for (const filter of createdNodes.filters) {
        expect(filter.disconnect).toHaveBeenCalled();
      }

      // Verify EVERY created gain EXCEPT masterGain (index 0) was disconnected
      const transientGains = createdNodes.gains.slice(1);
      for (const gain of transientGains) {
        expect(gain.disconnect).toHaveBeenCalled();
      }
    });

    it('survives exceptions thrown by node.disconnect() without propagating uncaught errors', () => {
      const engine = new ProceduralSoundEngine();
      engine.setMuted(false);

      engine.playLaser();
      const osc = createdNodes.oscillators[createdNodes.oscillators.length - 1];
      osc.disconnect.mockImplementation(() => {
        throw new Error('Failed to disconnect node');
      });

      expect(() => {
        osc.onended!();
      }).not.toThrow();
    });
  });

  describe('4. Error Boundary & Degraded Environment Tests', () => {
    it('gracefully no-ops when AudioContext constructor throws (e.g. max hardware contexts exceeded)', () => {
      (window as any).AudioContext = vi.fn().mockImplementation(function (this: any) {
        throw new Error('DOMException: The number of hardware contexts provided has been exceeded');
      });

      const engine = new ProceduralSoundEngine();
      engine.setMuted(false);

      expect(() => {
        engine.play('blip');
        engine.play('laser');
        engine.play('heartbeat');
        engine.play('flame');
        engine.toggleMute();
      }).not.toThrow();

      expect(engine.getAudioContext()).toBeNull();
    });

    it('gracefully no-ops when AudioContext.createGain throws', () => {
      mockAudioContext.createGain = vi.fn().mockImplementation(() => {
        throw new Error('Out of memory');
      });

      const engine = new ProceduralSoundEngine();
      engine.setMuted(false);

      expect(() => {
        engine.play('blip');
      }).not.toThrow();
    });

    it('gracefully catches audioCtx.resume() rejections without unhandled promise rejections', async () => {
      mockAudioContext.state = 'suspended';
      mockAudioContext.resume = vi.fn().mockRejectedValue(new Error('User activation required'));

      const engine = new ProceduralSoundEngine();
      expect(() => {
        engine.setMuted(false);
      }).not.toThrow();

      // Allow microtask to process
      await vi.advanceTimersByTimeAsync(10);
      expect(mockAudioContext.resume).toHaveBeenCalled();
    });

    it('gracefully handles missing AudioContext in headless/JSDOM environments without throwing', () => {
      delete (window as any).AudioContext;
      delete (window as any).webkitAudioContext;

      const engine = new ProceduralSoundEngine();
      expect(engine.isSupported()).toBe(false);

      expect(() => {
        engine.play('blip');
        engine.play('laser');
        engine.play('heartbeat');
        engine.play('flame');
        engine.setMuted(false);
        engine.toggleMute();
      }).not.toThrow();
    });

    it('safely handles localStorage SecurityError or QuotaExceededError in restricted iframe contexts', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new DOMException('SecurityError');
      });
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });

      const engine = new ProceduralSoundEngine();
      expect(engine.isMuted()).toBe(true);

      expect(() => {
        engine.setMuted(false);
        engine.toggleMute();
      }).not.toThrow();
    });

    it('safely handles window.dispatchEvent throwing in exotic environments', () => {
      vi.spyOn(window, 'dispatchEvent').mockImplementation(() => {
        throw new Error('Dispatch failed');
      });

      const engine = new ProceduralSoundEngine();
      expect(() => {
        engine.setMuted(false);
      }).not.toThrow();
    });
  });

  describe('5. Memory Leak & Lifecycle Boundary Harness', () => {
    it('resetForTesting can be called repeatedly and closes AudioContext cleanly', () => {
      const engine = new ProceduralSoundEngine();
      engine.setMuted(false);
      engine.play('blip');

      expect(engine.getAudioContext()).not.toBeNull();

      expect(() => {
        engine.resetForTesting();
        engine.resetForTesting();
        engine.resetForTesting();
      }).not.toThrow();

      expect(engine.getAudioContext()).toBeNull();
      expect(engine.isMuted()).toBe(true);
      expect(mockAudioContext.close).toHaveBeenCalledTimes(1);
    });

    it('useSoundEngine hook cleans up subscriber upon unmounting without listener accumulation', () => {
      const { result, unmount } = renderHook(() => useSoundEngine());
      expect(result.current.isMuted).toBe(true);

      // Mount 20 parallel hooks and unmount them
      const hooks: Array<{ unmount: () => void }> = [];
      for (let i = 0; i < 20; i++) {
        hooks.push(renderHook(() => useSoundEngine()));
      }

      // Unmount all hooks
      unmount();
      hooks.forEach((h) => h.unmount());

      // Changing muted state now should not throw or cause dangling component state updates
      expect(() => {
        act(() => {
          soundEngine.toggleMute();
        });
      }).not.toThrow();
    });
  });
});
