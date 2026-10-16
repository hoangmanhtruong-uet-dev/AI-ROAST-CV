/**
 * Unit and Adversarial Tests for Dual-Layer Teaser Rate Limiter (Milestone 3)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  MAX_TEASER_CALLS_PER_DAY,
  TEASER_STORAGE_KEY,
  TEASER_COOKIE_NAME,
  TEASER_RATE_LIMIT_ERROR_MESSAGE,
  extractClientIp,
  hashClientIp,
  getNextUtcMidnightSeconds,
  TeaserMemoryStore,
  checkTeaserRateLimit,
  getClientTeaserUsage,
  recordClientTeaserUsage,
  resetClientTeaserUsage,
  useTeaserUsage,
} from '@/lib/rate-limit/teaser-limiter';
import { WIPE_DATA_EVENT_NAME } from '@/lib/storage/wipe-data';

describe('Milestone 3: Dual-Layer Teaser Rate Limiter (lib/rate-limit/teaser-limiter.ts)', () => {
  let memoryStore: TeaserMemoryStore;

  beforeEach(() => {
    memoryStore = new TeaserMemoryStore(10, 24 * 60 * 60 * 1000);
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    if (typeof document !== 'undefined') {
      document.cookie = `${TEASER_COOKIE_NAME}=; Path=/; Max-Age=0`;
    }
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    if (typeof document !== 'undefined') {
      document.cookie = `${TEASER_COOKIE_NAME}=; Path=/; Max-Age=0`;
    }
  });

  // ==========================================================================
  // 1. IP Extraction & Header Parsing
  // ==========================================================================
  describe('1. IP Extraction & Header Parsing', () => {
    it('extracts first client IP from comma-separated x-forwarded-for header', () => {
      const headers = new Headers();
      headers.set('x-forwarded-for', '203.0.113.195, 70.41.3.18, 150.172.238.178');
      const ip = extractClientIp(new Request('http://localhost', { headers }));
      expect(ip).toBe('203.0.113.195');
    });

    it('falls back to x-real-ip if x-forwarded-for is missing', () => {
      const headers = new Headers();
      headers.set('x-real-ip', '198.51.100.42');
      const ip = extractClientIp(new Request('http://localhost', { headers }));
      expect(ip).toBe('198.51.100.42');
    });

    it('falls back to cf-connecting-ip if others are missing', () => {
      const headers = new Headers();
      headers.set('cf-connecting-ip', '172.64.100.5');
      const ip = extractClientIp(new Request('http://localhost', { headers }));
      expect(ip).toBe('172.64.100.5');
    });

    it('defaults to 127.0.0.1 when no IP headers are present', () => {
      const ip = extractClientIp(new Request('http://localhost'));
      expect(ip).toBe('127.0.0.1');
    });
  });

  // ==========================================================================
  // 2. Zero-PII Cryptographic Hashing Invariants
  // ==========================================================================
  describe('2. Zero-PII Cryptographic Hashing Invariants', () => {
    const rawIp = '14.248.82.112'; // Vietnamese ISP IP
    const dateStr = '2026-10-15';

    it('produces a 64-character SHA-256 hexadecimal hash', () => {
      const hash = hashClientIp(rawIp, dateStr, 'test_salt');
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('different salts produce completely different hashes for the same IP and date', () => {
      const hash1 = hashClientIp(rawIp, dateStr, 'salt_alpha');
      const hash2 = hashClientIp(rawIp, dateStr, 'salt_beta');
      expect(hash1).not.toBe(hash2);
    });

    it('consecutive calendar dates produce different hashes (forward secrecy & automatic daily rollover)', () => {
      const hashToday = hashClientIp(rawIp, '2026-10-15', 'fixed_salt');
      const hashTomorrow = hashClientIp(rawIp, '2026-10-16', 'fixed_salt');
      expect(hashToday).not.toBe(hashTomorrow);
    });

    it('NEVER stores raw IP in memory store or console logs', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const warnSpy = vi.spyOn(console, 'warn');
      const errSpy = vi.spyOn(console, 'error');

      checkTeaserRateLimit(undefined, { customIp: rawIp, salt: 'salt_pii' }, memoryStore);

      // Verify no console method leaked the raw IP
      for (const spy of [consoleSpy, warnSpy, errSpy]) {
        for (const call of spy.mock.calls) {
          const stringified = JSON.stringify(call);
          expect(stringified).not.toContain(rawIp);
        }
      }

      // Verify memoryStore keys are hashes and values contain no rawIp
      for (const key of (memoryStore as any).entries.keys()) {
        expect(key).toMatch(/^[a-f0-9]{64}$/);
        expect(key).not.toBe(rawIp);
      }
    });
  });

  // ==========================================================================
  // 3. Server-Side Rate Limiter Quota & Header Enforcement
  // ==========================================================================
  describe('3. Server-Side Rate Limiter Quota & Header Enforcement', () => {
    const testIp = '103.28.36.99';
    const fakeNow = new Date('2026-10-15T10:00:00.000Z').getTime();

    it('allows 3 requests within a calendar day and decrements remaining', () => {
      // 1st Call
      const res1 = checkTeaserRateLimit(undefined, { customIp: testIp, now: fakeNow }, memoryStore);
      expect(res1.allowed).toBe(true);
      expect(res1.status).toBe(200);
      expect(res1.limit).toBe(3);
      expect(res1.remaining).toBe(2);
      expect(res1.headers['X-RateLimit-Limit']).toBe('3');
      expect(res1.headers['X-RateLimit-Remaining']).toBe('2');
      expect(res1.headers['X-RateLimit-Reset']).toBe(String(res1.resetAt));

      // 2nd Call
      const res2 = checkTeaserRateLimit(undefined, { customIp: testIp, now: fakeNow + 1000 }, memoryStore);
      expect(res2.allowed).toBe(true);
      expect(res2.remaining).toBe(1);
      expect(res2.headers['X-RateLimit-Remaining']).toBe('1');

      // 3rd Call
      const res3 = checkTeaserRateLimit(undefined, { customIp: testIp, now: fakeNow + 2000 }, memoryStore);
      expect(res3.allowed).toBe(true);
      expect(res3.remaining).toBe(0);
      expect(res3.headers['X-RateLimit-Remaining']).toBe('0');
    });

    it('blocks the 4th request with HTTP 429 and returns required rate limit headers', () => {
      // Execute 3 calls
      checkTeaserRateLimit(undefined, { customIp: testIp, now: fakeNow }, memoryStore);
      checkTeaserRateLimit(undefined, { customIp: testIp, now: fakeNow + 100 }, memoryStore);
      checkTeaserRateLimit(undefined, { customIp: testIp, now: fakeNow + 200 }, memoryStore);

      // 4th Call
      const res4 = checkTeaserRateLimit(undefined, { customIp: testIp, now: fakeNow + 300 }, memoryStore);
      expect(res4.allowed).toBe(false);
      expect(res4.status).toBe(429);
      expect(res4.remaining).toBe(0);
      expect(res4.error).toBe(TEASER_RATE_LIMIT_ERROR_MESSAGE);
      expect(res4.headers['X-RateLimit-Limit']).toBe('3');
      expect(res4.headers['X-RateLimit-Remaining']).toBe('0');
      expect(res4.headers['X-RateLimit-Reset']).toBeDefined();
      expect(Number(res4.headers['Retry-After'])).toBeGreaterThan(0);
    });

    it('isolates rate limits per IP address', () => {
      const ipA = '1.1.1.1';
      const ipB = '2.2.2.2';

      // Exhaust ipA
      for (let i = 0; i < 3; i++) {
        checkTeaserRateLimit(undefined, { customIp: ipA, now: fakeNow }, memoryStore);
      }
      const resA = checkTeaserRateLimit(undefined, { customIp: ipA, now: fakeNow }, memoryStore);
      expect(resA.allowed).toBe(false);

      // ipB should still have 3 calls remaining
      const resB = checkTeaserRateLimit(undefined, { customIp: ipB, now: fakeNow }, memoryStore);
      expect(resB.allowed).toBe(true);
      expect(resB.remaining).toBe(2);
    });

    it('resets rate limit on next calendar day UTC', () => {
      // Day 1
      for (let i = 0; i < 3; i++) {
        checkTeaserRateLimit(undefined, { customIp: testIp, now: fakeNow }, memoryStore);
      }
      expect(checkTeaserRateLimit(undefined, { customIp: testIp, now: fakeNow }, memoryStore).allowed).toBe(false);

      // Day 2 (24 hours later)
      const day2Now = fakeNow + 24 * 60 * 60 * 1000;
      const resDay2 = checkTeaserRateLimit(undefined, { customIp: testIp, now: day2Now }, memoryStore);
      expect(resDay2.allowed).toBe(true);
      expect(resDay2.remaining).toBe(2);
    });
  });

  // ==========================================================================
  // 4. Memory Safety & LRU Eviction
  // ==========================================================================
  describe('4. Memory Safety & LRU Eviction', () => {
    it('caps total entries at maxEntries and evicts least recently accessed', () => {
      const smallStore = new TeaserMemoryStore(3, 24 * 60 * 60 * 1000);
      const now = Date.now();

      smallStore.set('key1', { count: 1, resetAt: now + 10000, lastAccessed: now });
      smallStore.set('key2', { count: 1, resetAt: now + 10000, lastAccessed: now });
      smallStore.set('key3', { count: 1, resetAt: now + 10000, lastAccessed: now });
      expect(smallStore.size).toBe(3);

      // Touch key1 to make it most recently accessed
      smallStore.get('key1', now);

      // Insert key4 -> should evict key2 (the oldest untouched key)
      smallStore.set('key4', { count: 1, resetAt: now + 10000, lastAccessed: now });
      expect(smallStore.size).toBe(3);
      expect(smallStore.get('key1')).toBeDefined();
      expect(smallStore.get('key2')).toBeUndefined(); // evicted
      expect(smallStore.get('key3')).toBeDefined();
      expect(smallStore.get('key4')).toBeDefined();
    });

    it('automatically purges entries older than 24h during sweep', () => {
      const store = new TeaserMemoryStore(100, 24 * 60 * 60 * 1000);
      const now = Date.now();
      const past25h = now - 25 * 60 * 60 * 1000;

      store.set('expired_key', { count: 1, resetAt: Math.floor(now / 1000), lastAccessed: past25h });
      store.set('active_key', { count: 1, resetAt: Math.floor(now / 1000) + 3600, lastAccessed: now });
      expect(store.size).toBe(2);

      const purged = store.sweepStale(now);
      expect(purged).toBe(1);
      expect(store.size).toBe(1);
      expect(store.get('expired_key')).toBeUndefined();
      expect(store.get('active_key')).toBeDefined();
    });
  });

  // ==========================================================================
  // 5. Client-Side Layer (LocalStorage + Cookie Cross-Check)
  // ==========================================================================
  describe('5. Client-Side Layer (LocalStorage + Cookie Cross-Check)', () => {
    it('initializes client storage with 3 remaining calls', () => {
      const usage = getClientTeaserUsage();
      expect(usage.count).toBe(0);
      expect(usage.remaining).toBe(3);
      expect(usage.canSubmit).toBe(true);
    });

    it('records usage into LocalStorage and Cookie', () => {
      recordClientTeaserUsage();
      const usage = getClientTeaserUsage();
      expect(usage.count).toBe(1);
      expect(usage.remaining).toBe(2);
      expect(usage.canSubmit).toBe(true);

      const rawStorage = localStorage.getItem(TEASER_STORAGE_KEY);
      expect(rawStorage).toContain('"count":1');
      expect(document.cookie).toContain(`${TEASER_COOKIE_NAME}=1`);
    });

    it('enforces defense-in-depth: highest count between LocalStorage and Cookie wins', () => {
      // Adversary tampers with LocalStorage to set count=0, but Cookie has 3
      localStorage.setItem(TEASER_STORAGE_KEY, JSON.stringify({ date: new Date().toISOString().slice(0, 10), count: 0 }));
      document.cookie = `${TEASER_COOKIE_NAME}=3; Path=/; Max-Age=86400`;

      const usage = getClientTeaserUsage();
      expect(usage.count).toBe(3);
      expect(usage.remaining).toBe(0);
      expect(usage.canSubmit).toBe(false);
    });

    it('server rejects request if cookie has count >= 3 even with fresh IP', () => {
      const headers = new Headers();
      headers.set('cookie', `${TEASER_COOKIE_NAME}=3`);
      headers.set('x-forwarded-for', '99.99.99.99');

      const res = checkTeaserRateLimit(new Request('http://localhost', { headers }), undefined, memoryStore);
      expect(res.allowed).toBe(false);
      expect(res.status).toBe(429);
      expect(res.remaining).toBe(0);
    });
  });

  // ==========================================================================
  // 6. React Hook useTeaserUsage() Integration
  // ==========================================================================
  describe('6. React Hook useTeaserUsage() Integration', () => {
    it('provides initial hook state with 3 remaining', () => {
      const { result } = renderHook(() => useTeaserUsage());
      expect(result.current.remaining).toBe(3);
      expect(result.current.canSubmit).toBe(true);
      expect(result.current.count).toBe(0);
      expect(result.current.isReady).toBe(true);
    });

    it('decrements remaining when recordUsage() is called', () => {
      const { result } = renderHook(() => useTeaserUsage());

      act(() => {
        result.current.recordUsage();
      });

      expect(result.current.count).toBe(1);
      expect(result.current.remaining).toBe(2);
      expect(result.current.canSubmit).toBe(true);
    });

    it('syncRemaining updates client state directly from server headers', () => {
      const { result } = renderHook(() => useTeaserUsage());

      act(() => {
        result.current.syncRemaining(0);
      });

      expect(result.current.remaining).toBe(0);
      expect(result.current.canSubmit).toBe(false);
      expect(result.current.count).toBe(3);
    });

    it('resets usage when 1-Click Wipe Data event fires', () => {
      const { result } = renderHook(() => useTeaserUsage());

      act(() => {
        result.current.recordUsage();
        result.current.recordUsage();
      });
      expect(result.current.remaining).toBe(1);

      // Trigger 1-Click Wipe Data
      act(() => {
        window.dispatchEvent(new CustomEvent(WIPE_DATA_EVENT_NAME, { detail: { timestamp: Date.now() } }));
      });

      expect(result.current.remaining).toBe(3);
      expect(result.current.count).toBe(0);
      expect(result.current.canSubmit).toBe(true);
    });
  });
});
