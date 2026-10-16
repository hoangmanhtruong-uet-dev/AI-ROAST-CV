import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  soundEngine,
  ProceduralSoundEngine,
  SOUND_STORAGE_KEY,
  SOUND_TOGGLE_EVENT,
  SoundEffectType,
} from '@/lib/audio/sound-engine';

describe('M1 Empirical Challenger: Web Audio Sound Engine Stress & Edge Cases', () => {
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

  const setupMockAudioContext = (currentTime = 100.0, sampleRate = 44100) => {
    createdNodes = {
      oscillators: [],
      gains: [],
      filters: [],
      buffers: [],
      bufferSources: [],
    };

    mockAudioContext = {
      state: 'running',
      currentTime,
      sampleRate,
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
  };

  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    vi.restoreAllMocks();
    setupMockAudioContext();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    soundEngine.resetForTesting();
  });

  // =========================================================================
  // 1. ULTRA-HIGH BURST STRESS HARNESS (1,000 INVOCATIONS)
  // =========================================================================
  describe('1. Ultra-High Burst Stress (1,000 Invocations)', () => {
    it('executes 1,000 rapid sound requests without unhandled errors, node leaks, or memory stalls', () => {
      const engine = new ProceduralSoundEngine();
      engine.setMuted(false);

      const sounds: SoundEffectType[] = ['blip', 'laser', 'heartbeat', 'flame'];

      expect(() => {
        for (let i = 0; i < 1000; i++) {
          engine.play(sounds[i % sounds.length]);
        }
      }).not.toThrow();

      // AudioContext instantiated only once
      expect((window as any).AudioContext).toHaveBeenCalledTimes(1);

      // Trigger all oscillator onended
      for (const osc of createdNodes.oscillators) {
        if (typeof osc.onended === 'function') {
          osc.onended();
        }
      }

      // Trigger all buffer source onended
      for (const bs of createdNodes.bufferSources) {
        if (typeof bs.onended === 'function') {
          bs.onended();
        }
      }

      // Fast forward fake timers for all heartbeat filter timeouts
      vi.advanceTimersByTime(400);

      // 100% of temporary oscillators disconnected
      for (const osc of createdNodes.oscillators) {
        expect(osc.disconnect).toHaveBeenCalled();
      }

      // 100% of buffer sources disconnected
      for (const bs of createdNodes.bufferSources) {
        expect(bs.disconnect).toHaveBeenCalled();
      }

      // 100% of filters disconnected
      for (const filter of createdNodes.filters) {
        expect(filter.disconnect).toHaveBeenCalled();
      }

      // 100% of transient gains disconnected (excluding masterGain index 0)
      const transientGains = createdNodes.gains.slice(1);
      for (const gain of transientGains) {
        expect(gain.disconnect).toHaveBeenCalled();
      }
    });
  });

  // =========================================================================
  // 2. EXOTIC SAMPLE RATES AUDIT (22.05 kHz to 192 kHz)
  // =========================================================================
  describe('2. Exotic Sample Rates Verification', () => {
    const sampleRates = [22050, 44100, 48000, 88200, 96000, 192000];

    sampleRates.forEach((rate) => {
      it(`correctly computes buffer sizes and noise envelopes at ${rate} Hz`, () => {
        setupMockAudioContext(10.0, rate);
        const engine = new ProceduralSoundEngine();
        engine.setMuted(false);

        engine.playFlame();

        expect(mockAudioContext.createBuffer).toHaveBeenCalledWith(
          1,
          Math.floor(rate * 0.25),
          rate
        );

        const createdBuffer = createdNodes.buffers[0];
        expect(createdBuffer.length).toBe(Math.floor(rate * 0.25));
        expect(createdBuffer.sampleRate).toBe(rate);
        expect(createdBuffer.length).toBeGreaterThan(0);
      });
    });
  });

  // =========================================================================
  // 3. LONG-RUNNING SESSION SIMULATION (LARGE currentTime)
  // =========================================================================
  describe('3. Long-Running Session Simulation (Large currentTime)', () => {
    it('schedules ramps accurately when audio context currentTime is very large (e.g. 86,400s / 24h)', () => {
      const hugeTime = 86400.0;
      setupMockAudioContext(hugeTime, 44100);

      const engine = new ProceduralSoundEngine();
      engine.setMuted(false);

      engine.playBlip();
      engine.playLaser();
      engine.playHeartbeat();
      engine.playFlame();

      // Check all gain ramp timestamps are >= hugeTime
      for (const gain of createdNodes.gains) {
        for (const call of gain.gain.setValueAtTime.mock.calls) {
          expect(call[1]).toBeGreaterThanOrEqual(hugeTime);
        }
        for (const call of gain.gain.exponentialRampToValueAtTime.mock.calls) {
          expect(call[1]).toBeGreaterThan(hugeTime);
        }
      }

      // Check all oscillator timestamps
      for (const osc of createdNodes.oscillators) {
        for (const call of osc.frequency.setValueAtTime.mock.calls) {
          expect(call[1]).toBeGreaterThanOrEqual(hugeTime);
        }
        for (const call of osc.frequency.exponentialRampToValueAtTime.mock.calls) {
          expect(call[1]).toBeGreaterThan(hugeTime);
        }
      }
    });
  });

  // =========================================================================
  // 4. WEB AUDIO SPEC COMPLIANCE (EXPONENTIAL RAMP NON-ZERO RULE)
  // =========================================================================
  describe('4. Web Audio API Specification Conformance', () => {
    it('strictly satisfies Web Audio spec: NO exponentialRampToValueAtTime target value is 0 (which throws DOMException)', () => {
      const engine = new ProceduralSoundEngine();
      engine.setMuted(false);

      engine.playBlip();
      engine.playLaser();
      engine.playHeartbeat();
      engine.playFlame();

      // Verify every exponential ramp target value across all gains is strictly > 0
      for (const gain of createdNodes.gains) {
        for (const call of gain.gain.exponentialRampToValueAtTime.mock.calls) {
          const targetValue = call[0];
          expect(targetValue).toBeGreaterThan(0);
        }
      }

      // Verify every exponential ramp target value across all oscillators is strictly > 0
      for (const osc of createdNodes.oscillators) {
        for (const call of osc.frequency.exponentialRampToValueAtTime.mock.calls) {
          const targetFreq = call[0];
          expect(targetFreq).toBeGreaterThan(0);
        }
      }

      // Verify filter frequency exponential ramps are strictly > 0
      for (const filter of createdNodes.filters) {
        for (const call of filter.frequency.exponentialRampToValueAtTime.mock.calls) {
          const targetFreq = call[0];
          expect(targetFreq).toBeGreaterThan(0);
        }
      }
    });

    it('ensures all procedural frequencies stay within human audible bounds (20 Hz - 20,000 Hz)', () => {
      const engine = new ProceduralSoundEngine();
      engine.setMuted(false);

      engine.playBlip();
      engine.playLaser();
      engine.playHeartbeat();
      engine.playFlame();

      for (const osc of createdNodes.oscillators) {
        for (const call of osc.frequency.setValueAtTime.mock.calls) {
          expect(call[0]).toBeGreaterThanOrEqual(20);
          expect(call[0]).toBeLessThanOrEqual(20000);
        }
        for (const call of osc.frequency.exponentialRampToValueAtTime.mock.calls) {
          expect(call[0]).toBeGreaterThanOrEqual(20);
          expect(call[0]).toBeLessThanOrEqual(20000);
        }
      }
    });
  });

  // =========================================================================
  // 5. STORAGE RESILIENCE & TERNARY LOGIC EVALUATION
  // =========================================================================
  describe('5. Storage Resilience & Ternary Logic Evaluation', () => {
    it('initializes muted to true when localStorage is null (first visit)', () => {
      localStorage.removeItem(SOUND_STORAGE_KEY);
      const engine = new ProceduralSoundEngine();
      expect(engine.isMuted()).toBe(true);
    });

    it('initializes muted to true when localStorage is explicitly "true"', () => {
      localStorage.setItem(SOUND_STORAGE_KEY, 'true');
      const engine = new ProceduralSoundEngine();
      expect(engine.isMuted()).toBe(true);
    });

    it('initializes muted to false when localStorage is explicitly "false"', () => {
      localStorage.setItem(SOUND_STORAGE_KEY, 'false');
      const engine = new ProceduralSoundEngine();
      expect(engine.isMuted()).toBe(false);
    });

    it('empirically demonstrates that non-null strings other than "true" evaluate to false due to ternary', () => {
      // Due to: stored === null ? true : stored === 'true'
      // any non-null string that is not 'true' results in false (unmuted)
      const nonNullNonTrue = ['undefined', 'null', '0', ''];
      for (const val of nonNullNonTrue) {
        localStorage.setItem(SOUND_STORAGE_KEY, val);
        const engine = new ProceduralSoundEngine();
        expect(engine.isMuted()).toBe(false);
      }
    });
  });

  // =========================================================================
  // 6. RAPID MUTE FLAPPING UNDER CONTINUOUS LOAD (500 TOGGLES)
  // =========================================================================
  describe('6. Rapid Mute Flapping Under Continuous Load', () => {
    it('maintains consistent state and master gain volume across 500 rapid toggles', () => {
      const engine = new ProceduralSoundEngine();
      let lastReportedState = engine.isMuted();

      engine.subscribe((muted) => {
        lastReportedState = muted;
      });

      for (let i = 0; i < 500; i++) {
        const next = engine.toggleMute();
        expect(next).toBe(lastReportedState);
        expect(engine.isMuted()).toBe(next);

        // Rapid fire random sound
        engine.play(i % 2 === 0 ? 'laser' : 'flame');
      }

      // After 500 toggles starting from true (muted), should end back at true (muted)
      expect(engine.isMuted()).toBe(true);
      expect(localStorage.getItem(SOUND_STORAGE_KEY)).toBe('true');
    });
  });

  // =========================================================================
  // 7. HEARTBEAT DOUBLE-THUMP LIFECYCLE & RESET INTERLEAVING
  // =========================================================================
  describe('7. Heartbeat Double-Thump Lifecycle & Timers', () => {
    it('correctly schedules thump 1 at offset 0 and thump 2 at offset 0.14', () => {
      const baseTime = 50.0;
      setupMockAudioContext(baseTime, 44100);

      const engine = new ProceduralSoundEngine();
      engine.setMuted(false);

      engine.playHeartbeat();

      expect(createdNodes.oscillators).toHaveLength(2);
      const osc1 = createdNodes.oscillators[0];
      const osc2 = createdNodes.oscillators[1];

      // Thump 1: starts at 50, stops at 50.13
      expect(osc1.start).toHaveBeenCalledWith(baseTime);
      expect(osc1.stop).toHaveBeenCalledWith(baseTime + 0.13);

      // Thump 2: starts at 50.14, stops at 50.27
      expect(osc2.start).toHaveBeenCalledWith(baseTime + 0.14);
      expect(osc2.stop).toHaveBeenCalledWith(baseTime + 0.27);
    });

    it('safely handles engine reset while heartbeat 350ms filter disconnect timer is in flight', () => {
      const engine = new ProceduralSoundEngine();
      engine.setMuted(false);

      engine.playHeartbeat();
      expect(createdNodes.filters).toHaveLength(1);
      const filter = createdNodes.filters[0];

      // Reset engine immediately while 350ms timer is pending
      expect(() => {
        engine.resetForTesting();
      }).not.toThrow();

      // Advancing timer should execute filter.disconnect() without throwing
      expect(() => {
        vi.advanceTimersByTime(400);
      }).not.toThrow();

      expect(filter.disconnect).toHaveBeenCalledTimes(1);
      expect(engine.getAudioContext()).toBeNull();
    });

    it('empirically records heartbeat filter disconnection if context was suspended during wall-clock timeout', () => {
      mockAudioContext.state = 'suspended';
      const engine = new ProceduralSoundEngine();
      engine.setMuted(false);

      engine.playHeartbeat();
      const filter = createdNodes.filters[0];

      // Wall-clock time advances 350ms while context is suspended
      vi.advanceTimersByTime(350);
      expect(filter.disconnect).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // 8. DEGRADED AUDIO CONTEXT SUBSYSTEMS
  // =========================================================================
  describe('8. Degraded Audio Subsystem Error Resilience', () => {
    it('gracefully handles audioCtx.destination being null/undefined', () => {
      mockAudioContext.destination = null;
      const engine = new ProceduralSoundEngine();
      engine.setMuted(false);

      expect(() => {
        engine.play('blip');
      }).not.toThrow();
    });

    it('gracefully handles createBiquadFilter throwing out of memory', () => {
      mockAudioContext.createBiquadFilter = vi.fn().mockImplementation(() => {
        throw new Error('Hardware filter limit reached');
      });

      const engine = new ProceduralSoundEngine();
      engine.setMuted(false);

      expect(() => {
        engine.playLaser();
        engine.playHeartbeat();
        engine.playFlame();
      }).not.toThrow();
    });

    it('gracefully handles createBuffer throwing', () => {
      mockAudioContext.createBuffer = vi.fn().mockImplementation(() => {
        throw new Error('Memory allocation failed');
      });

      const engine = new ProceduralSoundEngine();
      engine.setMuted(false);

      expect(() => {
        engine.playFlame();
      }).not.toThrow();
    });

    it('gracefully handles audioCtx.close() throwing on resetForTesting', () => {
      mockAudioContext.close = vi.fn().mockImplementation(() => {
        throw new Error('Context already closed');
      });

      const engine = new ProceduralSoundEngine();
      engine.setMuted(false);
      engine.playBlip();

      expect(() => {
        engine.resetForTesting();
      }).not.toThrow();

      expect(engine.getAudioContext()).toBeNull();
    });
  });

  // =========================================================================
  // 9. SIMULATED PURE SSR / HEADLESS ENVIRONMENT
  // =========================================================================
  describe('9. Pure SSR / Headless Safety Verification', () => {
    it('all methods gracefully execute as no-ops when window is undefined or lacks Web Audio', () => {
      // Simulate environment without AudioContext or webkitAudioContext
      delete (window as any).AudioContext;
      delete (window as any).webkitAudioContext;

      const engine = new ProceduralSoundEngine();
      expect(engine.isSupported()).toBe(false);

      // Verify all getters and operations execute without throwing
      expect(engine.isMuted()).toBe(true);
      expect(engine.getIsMuted()).toBe(true);
      expect(engine.getAudioContext()).toBeNull();

      expect(() => {
        engine.setMuted(false);
        engine.toggleMute();
        engine.play('blip');
        engine.play('laser');
        engine.play('heartbeat');
        engine.play('flame');
        engine.playBlip();
        engine.playLaser();
        engine.playHeartbeat();
        engine.playFlame();
        engine.resetForTesting();
      }).not.toThrow();
    });
  });
});
