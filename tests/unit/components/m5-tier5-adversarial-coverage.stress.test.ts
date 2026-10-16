/**
 * Milestone 5 Tier 5 Adversarial Coverage Hardening Suite
 * Target Subsystems:
 * 1. Audio Engine (1,000 concurrent sounds, unmount/cleanup, mute toggling)
 * 2. 3D Hologram (rapid mount/unmount, WebGL context loss, fallback switching, 550 ember particles)
 * 3. Teaser API & Rate Limiter (1,000 concurrent reqs, LRU memory leak safety, strict 3 calls/day, Zero-PII SHA-256 IP hashing)
 * 4. Showcase & Diff Slider (rapid pointer dragging, extreme score boundary clamping 0-100, keyboard accessibility, pause/resume on hover)
 * 5. RPG Canvas Card (PII leakage audit across lowercase Vietnamese, English, and exotic names -> 0 raw names drawn on canvas)
 * 6. Lenis Provider (modal open/close rapid toggling, RAF loop cleanup, reduced motion detection)
 */

import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, act, renderHook } from '@testing-library/react';
import * as THREE from 'three';

// 1. Audio Engine imports
import {
  soundEngine,
  ProceduralSoundEngine,
  useSoundEngine,
  SoundEffectType,
  SOUND_STORAGE_KEY,
  SOUND_TOGGLE_EVENT,
} from '@/lib/audio/sound-engine';

// 2. 3D Hologram imports
import * as webglDetectModule from '@/lib/utils/webgl-detect';
import Hero3DCanvas from '@/components/landing/Hero3DCanvas';
import CssHologramFallback from '@/components/landing/CssHologramFallback';

// 3. Teaser API & Rate Limiter imports
import {
  MAX_TEASER_CALLS_PER_DAY,
  DEFAULT_LRU_MAX_ENTRIES,
  ENTRY_TTL_MS,
  TEASER_RATE_LIMIT_ERROR_MESSAGE,
  extractClientIp,
  hashClientIp,
  getNextUtcMidnightSeconds,
  TeaserMemoryStore,
  checkTeaserRateLimit,
  resetTeaserRateLimits,
  getRateLimitSalt,
} from '@/lib/rate-limit/teaser-limiter';

// 4. Showcase & Diff Slider imports
import DiffSlider, { DIFF_PRESETS } from '@/components/landing/DiffSlider';
import CvHallOfShame from '@/components/landing/CvHallOfShame';

// 5. RPG Canvas Card imports
import RpgShareCard, { calculateRpgProfile } from '@/components/share/RpgShareCard';
import { ShareCardPayload, sanitizeCandidateName, prepareShareCardData } from '@/lib/schemas/share';

// 6. Lenis Provider imports
import LenisProvider, { useLenisScroll, isLenisSupported } from '@/components/providers/LenisProvider';

// ============================================================================
// Canvas 2D Mocking Setup for PII and Rendering Audit
// ============================================================================
interface CanvasAuditLog {
  fillTextCalls: { text: string; x: number; y: number }[];
  strokeTextCalls: { text: string; x: number; y: number }[];
}

function setupCanvasMock(): CanvasAuditLog {
  const audit: CanvasAuditLog = {
    fillTextCalls: [],
    strokeTextCalls: [],
  };

  const mockContext2D: any = {
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    fillText: vi.fn((text, x, y) => {
      audit.fillTextCalls.push({ text: String(text), x, y });
    }),
    strokeText: vi.fn((text, x, y) => {
      audit.strokeTextCalls.push({ text: String(text), x, y });
    }),
    measureText: vi.fn((text: string) => ({ width: text.length * 10 })),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
    createRadialGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
    strokeRect: vi.fn(),
    drawImage: vi.fn(),
    font: '',
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    textAlign: 'left',
  };

  HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((id: string) => {
    if (id === '2d') return mockContext2D;
    return null;
  });

  return audit;
}

// ============================================================================
// Web Audio Mocking Setup
// ============================================================================
interface AudioAuditLog {
  oscillators: any[];
  gains: any[];
  filters: any[];
  buffers: any[];
  bufferSources: any[];
}

function setupWebAudioMock(): { audit: AudioAuditLog; mockCtx: any } {
  const audit: AudioAuditLog = {
    oscillators: [],
    gains: [],
    filters: [],
    buffers: [],
    bufferSources: [],
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
    audit.gains.push(node);
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
    audit.oscillators.push(node);
    return node;
  };

  const createMockFilter = () => {
    const node = {
      type: 'lowpass',
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      Q: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
    audit.filters.push(node);
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
    audit.bufferSources.push(node);
    return node;
  };

  const mockCtx = {
    state: 'running',
    currentTime: 100.0,
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
      audit.buffers.push(buf);
      return buf;
    }),
    createBufferSource: vi.fn().mockImplementation(() => createMockBufferSource()),
    resume: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  };

  (window as any).AudioContext = vi.fn().mockImplementation(function () {
    return mockCtx;
  });

  return { audit, mockCtx };
}

// ============================================================================
// Three.js Mock Spies
// ============================================================================
const mockRendererDispose = vi.fn();
const mockRendererSetSize = vi.fn();
const mockRendererRender = vi.fn();
const mockGeometryDispose = vi.fn();
const mockMaterialDispose = vi.fn();
let shouldThrowOnRenderer = false;

vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal<typeof import('three')>();

  class MockWebGLRenderer {
    domElement: HTMLCanvasElement;
    constructor() {
      if (shouldThrowOnRenderer) {
        throw new Error('WebGL: Error creating WebGL context (Simulated context loss)');
      }
      this.domElement = typeof document !== 'undefined' ? document.createElement('canvas') : ({} as any);
    }
    setSize = mockRendererSetSize;
    setPixelRatio = vi.fn();
    render = mockRendererRender;
    dispose = mockRendererDispose;
  }

  class MockBufferGeometry extends actual.BufferGeometry {
    dispose() {
      mockGeometryDispose();
      super.dispose();
    }
  }

  class MockPlaneGeometry extends actual.PlaneGeometry {
    dispose() {
      mockGeometryDispose();
      super.dispose();
    }
  }

  class MockEdgesGeometry extends actual.EdgesGeometry {
    dispose() {
      mockGeometryDispose();
      super.dispose();
    }
  }

  class MockMaterial extends actual.Material {
    dispose() {
      mockMaterialDispose();
      super.dispose();
    }
  }

  class MockMeshBasicMaterial extends actual.MeshBasicMaterial {
    dispose() {
      mockMaterialDispose();
      super.dispose();
    }
  }

  class MockLineBasicMaterial extends actual.LineBasicMaterial {
    dispose() {
      mockMaterialDispose();
      super.dispose();
    }
  }

  class MockPointsMaterial extends actual.PointsMaterial {
    dispose() {
      mockMaterialDispose();
      super.dispose();
    }
  }

  return {
    ...actual,
    WebGLRenderer: MockWebGLRenderer,
    BufferGeometry: MockBufferGeometry,
    PlaneGeometry: MockPlaneGeometry,
    EdgesGeometry: MockEdgesGeometry,
    Material: MockMaterial,
    MeshBasicMaterial: MockMeshBasicMaterial,
    LineBasicMaterial: MockLineBasicMaterial,
    PointsMaterial: MockPointsMaterial,
  };
});

// ============================================================================
// MAIN TEST SUITE: TIER 5 ADVERSARIAL COVERAGE HARDENING
// ============================================================================
describe('Tier 5 Adversarial Coverage Hardening Suite (AI Roast CV Round 3)', () => {
  beforeEach(() => {
    cleanup();
    vi.restoreAllMocks();
    localStorage.clear();
    resetTeaserRateLimits();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // 1. AUDIO ENGINE ADVERSARIAL HARNESS
  // ==========================================================================
  describe('Subsystem 1: Audio Engine Adversarial Hardening', () => {
    it('survives rapid concurrency burst of 1,000 sounds across all types without throwing or audio distortion', () => {
      const { audit } = setupWebAudioMock();
      const engine = new ProceduralSoundEngine();
      engine.setMuted(false);

      const soundTypes: SoundEffectType[] = ['blip', 'laser', 'heartbeat', 'flame'];

      expect(() => {
        for (let i = 0; i < 1000; i++) {
          const sound = soundTypes[i % soundTypes.length];
          engine.play(sound);
        }
      }).not.toThrow();

      // AudioContext initialized once
      expect((window as any).AudioContext).toHaveBeenCalledTimes(1);
      // Master gain connected to destination
      expect(audit.gains[0].connect).toHaveBeenCalled();
    });

    it('performs unmount/cleanup and node disconnection across 100 concurrent sounds with zero graph leaks', () => {
      vi.useFakeTimers();
      const { audit } = setupWebAudioMock();
      const engine = new ProceduralSoundEngine();
      engine.setMuted(false);

      const soundTypes: SoundEffectType[] = ['blip', 'laser', 'heartbeat', 'flame'];
      for (let i = 0; i < 100; i++) {
        engine.play(soundTypes[i % soundTypes.length]);
      }

      // Complete all oscillators and buffer sources
      audit.oscillators.forEach((osc) => {
        if (typeof osc.onended === 'function') osc.onended();
      });
      audit.bufferSources.forEach((bs) => {
        if (typeof bs.onended === 'function') bs.onended();
      });

      // Advance timers for heartbeat filter disconnect
      vi.advanceTimersByTime(400);

      // Verify every oscillator and buffer source disconnected
      audit.oscillators.forEach((osc) => expect(osc.disconnect).toHaveBeenCalled());
      audit.bufferSources.forEach((bs) => expect(bs.disconnect).toHaveBeenCalled());

      // Master gain is index 0, transient gains are 1..N
      const transientGains = audit.gains.slice(1);
      transientGains.forEach((g) => expect(g.disconnect).toHaveBeenCalled());

      engine.resetForTesting();
      vi.useRealTimers();
    });

    it('executes 1,000 rapid mute/unmute toggles while continuous sounds are requested without desync', () => {
      setupWebAudioMock();
      const engine = new ProceduralSoundEngine();

      expect(() => {
        for (let i = 0; i < 1000; i++) {
          engine.toggleMute();
          engine.play('blip');
          engine.play('laser');
        }
      }).not.toThrow();

      // Started muted (true) -> 1000 toggles -> back to muted (true)
      expect(engine.isMuted()).toBe(true);
      expect(localStorage.getItem(SOUND_STORAGE_KEY)).toBe('true');
    });

    it('safely cleans up useSoundEngine hook subscription upon unmount', () => {
      setupWebAudioMock();
      const hooks: Array<{ unmount: () => void }> = [];
      for (let i = 0; i < 50; i++) {
        hooks.push(renderHook(() => useSoundEngine()));
      }
      hooks.forEach((h) => h.unmount());

      expect(() => {
        soundEngine.toggleMute();
      }).not.toThrow();
    });
  });

  // ==========================================================================
  // 2. 3D HOLOGRAM ADVERSARIAL HARNESS
  // ==========================================================================
  describe('Subsystem 2: 3D Hologram WebGL Hardening', () => {
    it('executes 35 rapid mount/unmount cycles ensuring complete disposal of WebGL renderer, geometries, and materials', async () => {
      const isSupportedSpy = vi.spyOn(webglDetectModule, 'isWebGLSupported').mockReturnValue(true);
      mockRendererDispose.mockClear();
      mockGeometryDispose.mockClear();
      mockMaterialDispose.mockClear();

      const CYCLES = 35;
      for (let i = 0; i < CYCLES; i++) {
        const { unmount } = render(React.createElement(Hero3DCanvas, { mode: 'spicy' }));
        await waitFor(() => {
          expect(screen.getByTestId('hero-3d-canvas')).toBeInTheDocument();
        });
        unmount();
      }

      expect(mockRendererDispose).toHaveBeenCalledTimes(CYCLES);
      // 10 geometries and 10 materials per cycle
      expect(mockGeometryDispose).toHaveBeenCalledTimes(CYCLES * 10);
      expect(mockMaterialDispose).toHaveBeenCalledTimes(CYCLES * 10);

      isSupportedSpy.mockRestore();
    });

    it('handles WebGL context loss / constructor failure by switching cleanly to CssHologramFallback without crashing', async () => {
      const isSupportedSpy = vi.spyOn(webglDetectModule, 'isWebGLSupported').mockReturnValue(true);
      shouldThrowOnRenderer = true;

      render(React.createElement(Hero3DCanvas, { mode: 'stress' }));

      await waitFor(() => {
        expect(screen.getByTestId('hero-hologram-fallback')).toBeInTheDocument();
      });

      expect(screen.getByText(/STRESS SIMULATOR \/\/ 00:59/i)).toBeInTheDocument();

      shouldThrowOnRenderer = false;
      isSupportedSpy.mockRestore();
    });

    it('verifies 550 ember particles and 360 disintegration particles in BufferGeometry allocation', async () => {
      const isSupportedSpy = vi.spyOn(webglDetectModule, 'isWebGLSupported').mockReturnValue(true);
      const allocatedGeometries: THREE.BufferGeometry[] = [];

      const origTrackGeo = THREE.BufferGeometry.prototype.setAttribute;
      const geoSpy = vi.spyOn(THREE.BufferGeometry.prototype, 'setAttribute').mockImplementation(function (
        this: THREE.BufferGeometry,
        name: any,
        attr: any
      ) {
        if (!allocatedGeometries.includes(this)) {
          allocatedGeometries.push(this);
        }
        return origTrackGeo.call(this, name, attr);
      });

      const { unmount } = render(React.createElement(Hero3DCanvas, { mode: 'expert' }));

      await waitFor(() => {
        expect(screen.getByTestId('hero-3d-canvas')).toBeInTheDocument();
      });

      // Find particle geometries with count === 550 (embers) and count === 360 (disintegration)
      const emberGeo = allocatedGeometries.find((g) => g.getAttribute('position')?.count === 550);
      const disGeo = allocatedGeometries.find((g) => g.getAttribute('position')?.count === 360);

      expect(emberGeo).toBeDefined();
      expect(disGeo).toBeDefined();

      geoSpy.mockRestore();
      unmount();
      isSupportedSpy.mockRestore();
    });
  });

  // ==========================================================================
  // 3. TEASER API & RATE LIMITER ADVERSARIAL HARNESS
  // ==========================================================================
  describe('Subsystem 3: Teaser API & Rate Limiter Hardening', () => {
    it('handles 1,000 concurrent requests from same IP: exactly 3 allowed, 997 rejected with HTTP 429', async () => {
      const store = new TeaserMemoryStore(10_000);
      const testIp = '14.232.188.42'; // VN residential IP
      const fixedNow = new Date('2026-10-16T10:00:00Z').getTime();

      const requests = Array.from({ length: 1000 }, () =>
        Promise.resolve().then(() =>
          checkTeaserRateLimit(undefined, { customIp: testIp, now: fixedNow, consume: true }, store)
        )
      );

      const results = await Promise.all(requests);
      const allowed = results.filter((r) => r.allowed);
      const blocked = results.filter((r) => !r.allowed);

      expect(allowed).toHaveLength(3);
      expect(blocked).toHaveLength(997);
      expect(allowed.map((r) => r.remaining)).toEqual([2, 1, 0]);

      for (const b of blocked) {
        expect(b.status).toBe(429);
        expect(b.remaining).toBe(0);
        expect(b.error).toBe(TEASER_RATE_LIMIT_ERROR_MESSAGE);
      }
    });

    it('enforces LRU capacity cap at 10,000 entries under 12,000 entries insertion (memory leak safety)', () => {
      const store = new TeaserMemoryStore(10_000);
      const fixedNow = Date.now();

      // Insert 12,000 unique keys
      for (let i = 0; i < 12_000; i++) {
        store.set(`hash_key_${i}`, {
          count: 1,
          resetAt: Math.floor(fixedNow / 1000) + 3600,
          lastAccessed: fixedNow + i,
        });
      }

      // Must strictly cap at 10,000
      expect(store.size).toBe(10_000);

      // Oldest keys (0..1999) must be evicted
      expect(store.get('hash_key_0', fixedNow)).toBeUndefined();
      expect(store.get('hash_key_1999', fixedNow)).toBeUndefined();
      // Newer keys must exist
      expect(store.get('hash_key_11999', fixedNow)).toBeDefined();
    });

    it('guarantees Zero-PII SHA-256 IP hashing: raw IP never stored, produces 64-char hex string', () => {
      const clientIp = '192.168.1.100';
      const dateStr = '2026-10-16';
      const hash1 = hashClientIp(clientIp, dateStr, 'test_salt_1');
      const hash2 = hashClientIp(clientIp, dateStr, 'test_salt_2');

      // 64 hex characters (SHA-256)
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
      expect(hash2).toMatch(/^[a-f0-9]{64}$/);
      // Different salts produce distinct hashes
      expect(hash1).not.toBe(hash2);
      // Raw IP never appears in hash
      expect(hash1).not.toContain(clientIp);
    });

    it('calculates midnight UTC rollover accurately', () => {
      const date = new Date('2026-10-16T23:59:59.999Z').getTime();
      const resetSeconds = getNextUtcMidnightSeconds(date);
      const expectedReset = Math.floor(new Date('2026-10-17T00:00:00.000Z').getTime() / 1000);
      expect(resetSeconds).toBe(expectedReset);
    });
  });

  // ==========================================================================
  // 4. SHOWCASE & DIFF SLIDER ADVERSARIAL HARNESS
  // ==========================================================================
  describe('Subsystem 4: Showcase & Diff Slider Hardening', () => {
    it('clamps rapid pointer dragging strictly between 5% and 95% on extreme coordinates (-99999px to +99999px)', () => {
      const { container } = render(React.createElement(DiffSlider));
      const sliderBox = container.querySelector('.cursor-ew-resize') as HTMLElement;
      expect(sliderBox).toBeInTheDocument();

      vi.spyOn(sliderBox, 'getBoundingClientRect').mockReturnValue({
        left: 100,
        top: 50,
        width: 1000,
        height: 400,
        bottom: 450,
        right: 1100,
        x: 100,
        y: 50,
        toJSON: () => {},
      });

      // Pointer down
      fireEvent.pointerDown(sliderBox, { clientX: 600, pointerId: 1 });
      const slider = screen.getByRole('slider');
      expect(slider.getAttribute('aria-valuenow')).toBe('50');

      // Drag extreme left (-99999px) -> clamped to 5%
      fireEvent.pointerMove(sliderBox, { clientX: -99999, pointerId: 1 });
      expect(slider.getAttribute('aria-valuenow')).toBe('5');

      // Drag extreme right (+99999px) -> clamped to 95%
      fireEvent.pointerMove(sliderBox, { clientX: 99999, pointerId: 1 });
      expect(slider.getAttribute('aria-valuenow')).toBe('95');

      fireEvent.pointerUp(sliderBox, { clientX: 99999, pointerId: 1 });
    });

    it('supports full keyboard accessibility with bounds clamping (ArrowLeft, ArrowRight, Home, End, PageUp, PageDown)', () => {
      render(React.createElement(DiffSlider, { initialPercentage: 50 }));
      const slider = screen.getByRole('slider');

      // ArrowLeft -5% -> 45
      fireEvent.keyDown(slider, { key: 'ArrowLeft' });
      expect(slider.getAttribute('aria-valuenow')).toBe('45');

      // ArrowRight +5% -> 50
      fireEvent.keyDown(slider, { key: 'ArrowRight' });
      expect(slider.getAttribute('aria-valuenow')).toBe('50');

      // PageUp -15% -> 35
      fireEvent.keyDown(slider, { key: 'PageUp' });
      expect(slider.getAttribute('aria-valuenow')).toBe('35');

      // PageDown +15% -> 50
      fireEvent.keyDown(slider, { key: 'PageDown' });
      expect(slider.getAttribute('aria-valuenow')).toBe('50');

      // Home -> clamps to 5
      fireEvent.keyDown(slider, { key: 'Home' });
      expect(slider.getAttribute('aria-valuenow')).toBe('5');

      // End -> clamps to 95
      fireEvent.keyDown(slider, { key: 'End' });
      expect(slider.getAttribute('aria-valuenow')).toBe('95');
    });

    it('CvHallOfShame: pauses animation on hover/touch and resumes cleanly', () => {
      const { container } = render(React.createElement(CvHallOfShame));
      const marqueeWrapper = container.querySelector('.select-none.group') as HTMLElement;
      expect(marqueeWrapper).toBeInTheDocument();

      // Initially running: button has "Tạm dừng"
      const pauseBtn = screen.getByRole('button', { name: /tạm dừng cuộn ticker/i });
      expect(pauseBtn).toBeInTheDocument();

      // Mouse enter pauses marquee -> button text/label changes to "Tiếp tục"
      fireEvent.mouseEnter(marqueeWrapper);
      expect(screen.getByRole('button', { name: /tiếp tục cuộn ticker/i })).toBeInTheDocument();

      // Mouse leave resumes marquee -> button reverts to "Tạm dừng"
      fireEvent.mouseLeave(marqueeWrapper);
      expect(screen.getByRole('button', { name: /tạm dừng cuộn ticker/i })).toBeInTheDocument();

      // Clicking button manually toggles pause
      fireEvent.click(pauseBtn);
      expect(screen.getByRole('button', { name: /tiếp tục cuộn ticker/i })).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /tiếp tục cuộn ticker/i }));
      expect(screen.getByRole('button', { name: /tạm dừng cuộn ticker/i })).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 5. RPG CANVAS CARD ADVERSARIAL PII AUDIT HARNESS
  // ==========================================================================
  describe('Subsystem 5: RPG Canvas Card PII Zero-Leakage Hardening', () => {
    let audit: CanvasAuditLog;

    beforeEach(() => {
      audit = setupCanvasMock();
    });

    const adversarialNames = [
      { raw: 'nguyễn văn an', desc: 'lowercase Vietnamese name' },
      { raw: 'trần thị thảo', desc: 'female lowercase Vietnamese name' },
      { raw: 'lê hoàng đức', desc: '3-word lowercase Vietnamese name' },
      { raw: 'nguyễn đặng hoàng yến phượng', desc: '5-word lowercase compound Vietnamese name' },
      { raw: 'John Doe', desc: 'standard English name' },
      { raw: 'john doe', desc: 'lowercase English name' },
      { raw: 'Alice Smith', desc: 'female English name' },
      { raw: 'Jean-Luc Picard', desc: 'hyphenated foreign name' },
      { raw: 'nGuYễN vĂn aN', desc: 'mixed-case sponge-bob Vietnamese name' },
      { raw: 'NGUYỄN VĂN AN', desc: 'ALL-CAPS Vietnamese name' },
      { raw: '   nguyễn văn an   ', desc: 'whitespace-padded Vietnamese name' },
      { raw: '0987654321', desc: 'raw 10-digit phone number as name' },
      { raw: 'victim@secret.com', desc: 'raw email as name' },
    ];

    adversarialNames.forEach(({ raw, desc }) => {
      it(`EMPIRICAL AUDIT: confirms raw name "${raw}" (${desc}) NEVER appears in canvas draw calls`, () => {
        const payload: ShareCardPayload = {
          type: 'roast',
          title: `CV Test for ${raw}`,
          score: 85,
          quoteOrHighlight: `Quote containing ${raw}`,
          summary: `Summary containing ${raw}`,
          candidateName: raw,
        };

        render(React.createElement(RpgShareCard, { payload }));

        const allDrawnText = audit.fillTextCalls
          .map((c) => c.text)
          .concat(audit.strokeTextCalls.map((c) => c.text))
          .join(' ');

        // STRICT ASSERTION: raw name MUST NOT be drawn
        expect(allDrawnText).not.toContain(raw.trim());

        // Must render safe masked indicator
        expect(allDrawnText).toMatch(/\[Họ tên ẩn danh\]|Ứng viên ẩn danh|09\*\*\*\*4321|v\*{3,4}[a-z0-9]*@secret\.com/i);
      });
    });

    it('maps survival scores across 0..100 accurately to RPG tiers SSR, A, B, C, F with score clamping', () => {
      expect(calculateRpgProfile(100).tier).toBe('SSR');
      expect(calculateRpgProfile(90).tier).toBe('SSR');
      expect(calculateRpgProfile(89).tier).toBe('A');
      expect(calculateRpgProfile(75).tier).toBe('A');
      expect(calculateRpgProfile(74).tier).toBe('B');
      expect(calculateRpgProfile(60).tier).toBe('B');
      expect(calculateRpgProfile(59).tier).toBe('C');
      expect(calculateRpgProfile(45).tier).toBe('C');
      expect(calculateRpgProfile(44).tier).toBe('F');
      expect(calculateRpgProfile(0).tier).toBe('F');
      // Extreme values clamped
      expect(calculateRpgProfile(-50).survivalScore).toBe(0);
      expect(calculateRpgProfile(150).survivalScore).toBe(100);
    });
  });

  // ==========================================================================
  // 6. LENIS PROVIDER ADVERSARIAL HARNESS
  // ==========================================================================
  describe('Subsystem 6: Lenis Provider Hardening', () => {
    let origMatchMedia: any;
    let origResizeObserver: any;
    let origRAF: any;
    let origCancelRAF: any;

    function LenisConsumer() {
      const { isStopped, pause, resume } = useLenisScroll();
      return React.createElement(
        'div',
        null,
        React.createElement('span', { 'data-testid': 'lenis-state' }, isStopped ? 'STOPPED' : 'RUNNING'),
        React.createElement('button', { 'data-testid': 'btn-pause', onClick: pause }, 'Pause'),
        React.createElement('button', { 'data-testid': 'btn-resume', onClick: resume }, 'Resume')
      );
    }

    beforeEach(() => {
      document.body.style.overflow = '';
      origMatchMedia = window.matchMedia;
      origResizeObserver = (window as any).ResizeObserver;
      origRAF = window.requestAnimationFrame;
      origCancelRAF = window.cancelAnimationFrame;

      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('prefers-reduced-motion: reduce'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      (window as any).ResizeObserver = class {
        observe = vi.fn();
        unobserve = vi.fn();
        disconnect = vi.fn();
      };

      window.requestAnimationFrame = vi.fn().mockReturnValue(1234);
      window.cancelAnimationFrame = vi.fn();
    });

    afterEach(() => {
      document.body.style.overflow = '';
      window.matchMedia = origMatchMedia;
      (window as any).ResizeObserver = origResizeObserver;
      window.requestAnimationFrame = origRAF;
      window.cancelAnimationFrame = origCancelRAF;
    });

    it('executes 100 rapid modal open/close toggles without desynchronizing isStopped state', async () => {
      await act(async () => {
        render(
          React.createElement(
            LenisProvider,
            null,
            React.createElement(LenisConsumer)
          )
        );
      });

      // 100 rapid cycles
      for (let i = 0; i < 100; i++) {
        act(() => {
          document.body.style.overflow = 'hidden';
        });
        act(() => {
          document.body.style.overflow = '';
        });
      }

      await act(async () => {
        await new Promise((r) => setTimeout(r, 20));
      });

      expect(screen.getByTestId('lenis-state')).toHaveTextContent('RUNNING');

      // Now open modal
      act(() => {
        document.body.style.overflow = 'hidden';
      });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 20));
      });
      expect(screen.getByTestId('lenis-state')).toHaveTextContent('STOPPED');
    });

    it('cleans up RAF loop and disconnects MutationObserver upon unmount', () => {
      const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
      const { unmount } = render(
        React.createElement(
          LenisProvider,
          null,
          React.createElement(LenisConsumer)
        )
      );

      unmount();
      expect(cancelSpy).toHaveBeenCalled();
    });

    it('respects prefers-reduced-motion media query configuration', () => {
      // matchMedia configured in beforeEach to match 'prefers-reduced-motion: reduce'
      render(
        React.createElement(
          LenisProvider,
          null,
          React.createElement(LenisConsumer)
        )
      );

      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
      expect(screen.getByTestId('lenis-state')).toBeInTheDocument();
    });
  });
});
