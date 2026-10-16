import { describe, it, expect, beforeEach } from 'vitest';
import crypto from 'crypto';
import {
  checkRoastRateLimit,
  validateRoastPayload,
  signQuotaPayload,
  verifyQuotaCookie,
  extractClientIp,
  hashClientIp,
  RoastMemoryStore,
  ROAST_DAILY_QUOTA,
  ROAST_BURST_LIMIT,
  ROAST_BURST_WINDOW_MS,
  ROAST_MIN_PAYLOAD_CHARS,
  ROAST_MAX_PAYLOAD_CHARS,
  ROAST_RATE_LIMIT_ERROR_MESSAGE,
  ROAST_BURST_LIMIT_ERROR_MESSAGE,
  ROAST_QUOTA_COOKIE_NAME,
  SessionQuotaPayload,
} from '@/lib/rate-limit/roast-limiter';
import { POST as roastHandler } from '@/app/api/roast/route';

describe('Adversarial Roast Rate Limiter Stress Suite (Challenger M7.1)', () => {
  let memoryStore: RoastMemoryStore;
  const testSecret = 'adversarial_test_secret_hmac_2026_super_safe';
  const testSalt = 'adversarial_test_salt_roast_2026';
  const baseNow = 1792150000000; // Fixed timestamp for deterministic testing

  beforeEach(() => {
    memoryStore = new RoastMemoryStore();
  });

  describe('Dimension 1: Payload Boundary Stress Testing (Tier 1)', () => {
    it('rejects payload at exactly 119 characters (boundary minus 1)', () => {
      const text119 = 'a'.repeat(119);
      expect(text119.length).toBe(119);

      const res = validateRoastPayload(text119);
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/tối thiểu 120 ký tự/i);
    });

    it('accepts payload at exactly 120 characters (boundary exact min)', () => {
      const text120 = 'a'.repeat(120);
      expect(text120.length).toBe(120);

      const res = validateRoastPayload(text120);
      expect(res.valid).toBe(true);
      expect(res.sanitizedLength).toBe(120);
      expect(res.truncatedText?.length).toBe(120);
    });

    it('accepts payload at exactly 121 characters (boundary plus 1)', () => {
      const text121 = 'b'.repeat(121);
      const res = validateRoastPayload(text121);
      expect(res.valid).toBe(true);
      expect(res.sanitizedLength).toBe(121);
    });

    it('rejects text where raw length >= 120 but trimmed length < 120 (whitespace padding attack)', () => {
      // 50 spaces + 100 chars + 50 spaces = 200 raw chars, but trimmed = 100 < 120
      const sneakyWhitespace = ' '.repeat(50) + 'c'.repeat(100) + ' '.repeat(50);
      expect(sneakyWhitespace.length).toBe(200);

      const res = validateRoastPayload(sneakyWhitespace);
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/tối thiểu 120 ký tự/i);
    });

    it('rejects massive pure-whitespace payload (e.g. 2,000 spaces and newlines)', () => {
      const pureWhitespace = ' \n\t  \r\n'.repeat(300);
      const res = validateRoastPayload(pureWhitespace);
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/tối thiểu 120 ký tự/i);
    });

    it('accepts valid 120 Vietnamese characters with complex diacritics', () => {
      const vietnameseCv =
        'Nguyễn Văn Bình, cử nhân Công nghệ thông tin trường Đại học Bách Khoa. Mục tiêu trở thành Fullstack Engineer chuyên sâu Next.js!';
      expect(vietnameseCv.trim().length).toBeGreaterThanOrEqual(120);

      const res = validateRoastPayload(vietnameseCv);
      expect(res.valid).toBe(true);
    });

    it('accepts payload at exactly 5,000 characters without truncation (boundary exact max)', () => {
      const text5000 = 'x'.repeat(5000);
      const res = validateRoastPayload(text5000);

      expect(res.valid).toBe(true);
      expect(res.sanitizedLength).toBe(5000);
      expect(res.truncatedText?.length).toBe(5000);
    });

    it('cleanly truncates payload at exactly 5,001 characters to 5,000 characters (boundary max plus 1)', () => {
      const text5001 = 'y'.repeat(5001);
      const res = validateRoastPayload(text5001);

      expect(res.valid).toBe(true);
      expect(res.sanitizedLength).toBe(5000);
      expect(res.truncatedText?.length).toBe(5000);
    });

    it('safely truncates massive payload (20,000 characters) to exactly 5,000 characters', () => {
      const text20k = 'z'.repeat(20_000);
      const res = validateRoastPayload(text20k);

      expect(res.valid).toBe(true);
      expect(res.sanitizedLength).toBe(5000);
      expect(res.truncatedText?.length).toBe(5000);
    });

    it('gracefully handles adversarial non-string and falsy types', () => {
      expect(validateRoastPayload('').valid).toBe(false);
      // @ts-expect-error test null
      expect(validateRoastPayload(null).valid).toBe(false);
      // @ts-expect-error test undefined
      expect(validateRoastPayload(undefined).valid).toBe(false);
      // @ts-expect-error test object
      expect(validateRoastPayload({ text: 'cv' }).valid).toBe(false);
      // @ts-expect-error test number
      expect(validateRoastPayload(12345).valid).toBe(false);
    });
  });

  describe('Dimension 2: Cryptographic Cookie Forgery & Tampering (Tier 2)', () => {
    const validPayload: SessionQuotaPayload = {
      used: 5,
      resetAt: Math.floor(baseNow / 1000) + 7200,
      day: '2026-10-16',
    };

    it('detects and rejects payload tampering: changing used from 5 to 0', () => {
      const validSigned = signQuotaPayload(validPayload, testSecret);
      const [origB64, origSig] = validSigned.split('.');

      // Attacker decodes JSON, modifies used to 0, encodes back
      const tamperedJson = JSON.stringify({ ...validPayload, used: 0 });
      const tamperedB64 = Buffer.from(tamperedJson, 'utf-8').toString('base64url');
      const forgedCookie = `${tamperedB64}.${origSig}`;

      const verified = verifyQuotaCookie(forgedCookie, testSecret, baseNow);
      expect(verified).toBeNull();
    });

    it('detects and rejects signature bit-flipping attack', () => {
      const validSigned = signQuotaPayload(validPayload, testSecret);
      const [origB64, origSig] = validSigned.split('.');

      // Flip 1 character in the 64-char hex signature
      const flippedChar = origSig[0] === 'a' ? 'b' : 'a';
      const flippedSig = flippedChar + origSig.slice(1);
      const forgedCookie = `${origB64}.${flippedSig}`;

      const verified = verifyQuotaCookie(forgedCookie, testSecret, baseNow);
      expect(verified).toBeNull();
    });

    it('detects and rejects truncated signature length attacks', () => {
      const validSigned = signQuotaPayload(validPayload, testSecret);
      const [origB64, origSig] = validSigned.split('.');

      // Truncate signature to 16 hex chars
      const truncatedCookie = `${origB64}.${origSig.slice(0, 16)}`;
      const verified = verifyQuotaCookie(truncatedCookie, testSecret, baseNow);
      expect(verified).toBeNull();
    });

    it('detects and rejects extended signature length attacks', () => {
      const validSigned = signQuotaPayload(validPayload, testSecret);
      const [origB64, origSig] = validSigned.split('.');

      // Append extra hex bytes
      const extendedCookie = `${origB64}.${origSig}001122`;
      const verified = verifyQuotaCookie(extendedCookie, testSecret, baseNow);
      expect(verified).toBeNull();
    });

    it('rejects cookies signed with a different secret key', () => {
      const forgedSecret = 'attacker_secret_key_12345';
      const forgedCookie = signQuotaPayload(validPayload, forgedSecret);

      const verified = verifyQuotaCookie(forgedCookie, testSecret, baseNow);
      expect(verified).toBeNull();
    });

    it('rejects expired quota cookie (replay attack from previous day)', () => {
      const expiredPayload: SessionQuotaPayload = {
        used: 2,
        resetAt: Math.floor(baseNow / 1000) - 100, // 100s in the past
        day: '2026-10-15',
      };
      const signedExpired = signQuotaPayload(expiredPayload, testSecret);

      const verified = verifyQuotaCookie(signedExpired, testSecret, baseNow);
      expect(verified).toBeNull();
    });

    it('gracefully handles malformed, garbage or multi-dot cookie strings', () => {
      expect(verifyQuotaCookie('not_a_valid_cookie', testSecret, baseNow)).toBeNull();
      expect(verifyQuotaCookie('part1.part2.part3', testSecret, baseNow)).toBeNull();
      expect(verifyQuotaCookie('', testSecret, baseNow)).toBeNull();
      expect(verifyQuotaCookie('...a.b.c...', testSecret, baseNow)).toBeNull();
      expect(verifyQuotaCookie(null, testSecret, baseNow)).toBeNull();
    });
  });

  describe('Dimension 3: Rapid Burst Attacks & Token Bucket Exhaustion (Tier 3)', () => {
    it('blocks rapid-fire burst attacks: allows 2, blocks requests 3 through 10', () => {
      const ip = '10.0.0.1';

      // 1st request at t=0
      const r1 = checkRoastRateLimit(undefined, {
        customIp: ip,
        now: baseNow,
        store: memoryStore,
        secret: testSecret,
        salt: testSalt,
        forceEnforce: true,
      });
      expect(r1.allowed).toBe(true);
      expect(r1.remaining).toBe(4);

      // 2nd request at t=200ms
      const r2 = checkRoastRateLimit(undefined, {
        customIp: ip,
        now: baseNow + 200,
        store: memoryStore,
        secret: testSecret,
        salt: testSalt,
        forceEnforce: true,
      });
      expect(r2.allowed).toBe(true);
      expect(r2.remaining).toBe(3);

      // Requests 3 through 10 in rapid fire (within 1 second)
      for (let i = 3; i <= 10; i++) {
        const burstRes = checkRoastRateLimit(undefined, {
          customIp: ip,
          now: baseNow + i * 100,
          store: memoryStore,
          secret: testSecret,
          salt: testSalt,
          forceEnforce: true,
        });
        expect(burstRes.allowed, `Request ${i} should be blocked`).toBe(false);
        expect(burstRes.status).toBe(429);
        expect(burstRes.error).toBe(ROAST_BURST_LIMIT_ERROR_MESSAGE);
        expect(burstRes.retryAfterSeconds).toBeGreaterThan(0);
        expect(burstRes.retryAfterSeconds).toBeLessThanOrEqual(60);
      }
    });

    it('dynamically slides burst window: unblocks after 60s has elapsed from oldest request', () => {
      const ip = '10.0.0.2';

      // Request 1 at t = 0
      checkRoastRateLimit(undefined, {
        customIp: ip,
        now: baseNow,
        store: memoryStore,
        secret: testSecret,
        salt: testSalt,
        forceEnforce: true,
      });

      // Request 2 at t = 30s
      checkRoastRateLimit(undefined, {
        customIp: ip,
        now: baseNow + 30_000,
        store: memoryStore,
        secret: testSecret,
        salt: testSalt,
        forceEnforce: true,
      });

      // Request 3 at t = 45s: BLOCKED (2 requests already in [0, 45s])
      const blocked = checkRoastRateLimit(undefined, {
        customIp: ip,
        now: baseNow + 45_000,
        store: memoryStore,
        secret: testSecret,
        salt: testSalt,
        forceEnforce: true,
      });
      expect(blocked.allowed).toBe(false);
      expect(blocked.status).toBe(429);

      // Request 4 at t = 61s: Request 1 at t=0 has aged out (>60s). Only Request 2 at t=30s is active.
      // Therefore, burst count = 1 < 2 -> ALLOWED!
      const unblocked = checkRoastRateLimit(undefined, {
        customIp: ip,
        now: baseNow + 61_000,
        store: memoryStore,
        secret: testSecret,
        salt: testSalt,
        forceEnforce: true,
      });
      expect(unblocked.allowed).toBe(true);
      expect(unblocked.status).toBe(200);
    });

    it('exhausts daily limit of 5 requests and strictly enforces blocking on 6th request', () => {
      const ip = '10.0.0.3';
      let t = baseNow;

      for (let i = 1; i <= 5; i++) {
        const res = checkRoastRateLimit(undefined, {
          customIp: ip,
          now: t,
          store: memoryStore,
          secret: testSecret,
          salt: testSalt,
          forceEnforce: true,
        });
        expect(res.allowed).toBe(true);
        expect(res.remaining).toBe(5 - i);
        t += 65_000; // Spaced 65s apart to avoid burst limit
      }

      // 6th request: BLOCKED by daily quota
      const res6 = checkRoastRateLimit(undefined, {
        customIp: ip,
        now: t,
        store: memoryStore,
        secret: testSecret,
        salt: testSalt,
        forceEnforce: true,
      });
      expect(res6.allowed).toBe(false);
      expect(res6.status).toBe(429);
      expect(res6.error).toBe(ROAST_RATE_LIMIT_ERROR_MESSAGE);
      expect(res6.remaining).toBe(0);
      expect(res6.headers['Retry-After']).toBeDefined();
    });
  });

  describe('Dimension 4: Dual-Tier Synchronization Attacks (Cookie vs IP Store)', () => {
    it('prevents Incognito / Cookie Deletion attack: blocks if IP token bucket is exhausted', () => {
      const ip = '10.0.0.4';
      let t = baseNow;

      // Exhaust 5 requests
      for (let i = 0; i < 5; i++) {
        checkRoastRateLimit(undefined, {
          customIp: ip,
          now: t,
          store: memoryStore,
          secret: testSecret,
          salt: testSalt,
          forceEnforce: true,
        });
        t += 65_000;
      }

      // Attacker opens incognito tab (no cookie header sent at all)
      const incognitoReq = new Request('http://localhost:3000/api/roast');
      const res = checkRoastRateLimit(incognitoReq, {
        customIp: ip,
        now: t,
        store: memoryStore,
        secret: testSecret,
        salt: testSalt,
        forceEnforce: true,
      });

      expect(res.allowed).toBe(false);
      expect(res.status).toBe(429);
      expect(res.error).toBe(ROAST_RATE_LIMIT_ERROR_MESSAGE);
    });

    it('prevents IP rotation / Proxy Hopping attack if signed quota cookie is present', () => {
      const nextMidnightSec = Math.floor(baseNow / 1000) + 3600;
      const exhaustedCookie = signQuotaPayload(
        {
          used: 5,
          resetAt: nextMidnightSec,
          day: '2026-10-16',
        },
        testSecret
      );

      // Attacker hops to a fresh new IP
      const freshProxyIp = '198.51.100.99';
      const reqWithCookie = new Request('http://localhost:3000/api/roast', {
        headers: {
          cookie: `${ROAST_QUOTA_COOKIE_NAME}=${exhaustedCookie}`,
        },
      });

      const res = checkRoastRateLimit(reqWithCookie, {
        customIp: freshProxyIp,
        now: baseNow,
        store: memoryStore,
        secret: testSecret,
        salt: testSalt,
        forceEnforce: true,
      });

      expect(res.allowed).toBe(false);
      expect(res.status).toBe(429);
      expect(res.error).toBe(ROAST_RATE_LIMIT_ERROR_MESSAGE);
    });
  });

  describe('Dimension 5: Pro Entitlement Immunity & Zero-PII IP Invariants', () => {
    it('bypasses burst and daily limits completely when Pro key header is presented', () => {
      const ip = '10.0.0.5';
      const proReq = new Request('http://localhost:3000/api/roast', {
        headers: {
          'x-pro-license-key': 'PRO-VIP-UNLIMITED-2026',
        },
      });

      // Blast 10 rapid calls
      for (let i = 0; i < 10; i++) {
        const res = checkRoastRateLimit(proReq, {
          customIp: ip,
          now: baseNow + i * 50,
          store: memoryStore,
          secret: testSecret,
          salt: testSalt,
          forceEnforce: true,
        });

        expect(res.allowed).toBe(true);
        expect(res.status).toBe(200);
        expect(res.isPro).toBe(true);
        expect(res.limit).toBe(9999);
      }
    });

    it('verifies Zero-PII invariant: IP address is strictly one-way hashed with salt and date', () => {
      const rawSensitiveIp = '123.45.67.89';
      const dayStr = '2026-10-16';
      const hashed = hashClientIp(rawSensitiveIp, dayStr, testSalt);

      expect(hashed.length).toBe(64);
      expect(hashed).toMatch(/^[0-9a-f]{64}$/);
      expect(hashed).not.toContain('123.45.67.89');

      // Changing salt produces completely different hash
      const differentSaltHash = hashClientIp(rawSensitiveIp, dayStr, 'different_salt');
      expect(differentSaltHash).not.toBe(hashed);

      // Changing date produces completely different hash (prevents cross-day IP tracking)
      const differentDateHash = hashClientIp(rawSensitiveIp, '2026-10-17', testSalt);
      expect(differentDateHash).not.toBe(hashed);
    });
  });

  describe('Dimension 6: Integration Route Handler POST /api/roast Stress Testing', () => {
    it('returns 400 Bad Request when cvText is shorter than 30 chars (Zod schema level)', async () => {
      const shortBody = JSON.stringify({
        cvText: 'Ngắn',
        tone: 'spicy',
      });

      const req = new Request('http://localhost:3000/api/roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: shortBody,
      });

      const res = await roastHandler(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toMatch(/tối thiểu 30 ký tự/i);
    });

    it('enforces Tier 1 validation in route: rejects cvText between 30 and 119 chars with 400 Bad Request', async () => {
      const text50Chars = 'Nguyễn Văn A - Lập trình viên React tìm việc làm.';
      expect(text50Chars.length).toBeLessThan(ROAST_MIN_PAYLOAD_CHARS);

      // Unit check: Tier 1 validateRoastPayload correctly rejects
      const tier1Result = validateRoastPayload(text50Chars);
      expect(tier1Result.valid).toBe(false);
      expect(tier1Result.error).toMatch(/tối thiểu 120 ký tự/i);

      // Route check: route calls validateRoastPayload and returns 400 Bad Request
      const req = new Request('http://localhost:3000/api/roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvText: text50Chars, tone: 'spicy' }),
      });

      const res = await roastHandler(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toMatch(/tối thiểu 120 ký tự/i);
    });

    it('blocks route handler immediately on 3rd rapid call with 429 Retry-After headers', async () => {
      const validCv = `
        Nguyễn Văn C - Kỹ sư phần mềm Fullstack Next.js và Node.js.
        Có 1 năm kinh nghiệm phát triển hệ thống web, tối ưu cơ sở dữ liệu.
        Thành thạo TypeScript, React, Docker, CI/CD pipeline và RESTful API.
      `.trim();

      const headers = {
        'Content-Type': 'application/json',
        'x-enforce-rate-limit': 'true',
        'x-forwarded-for': '198.51.100.42',
      };

      // Call 1
      await roastHandler(
        new Request('http://localhost:3000/api/roast', {
          method: 'POST',
          headers,
          body: JSON.stringify({ cvText: validCv, tone: 'spicy' }),
        })
      );

      // Call 2
      await roastHandler(
        new Request('http://localhost:3000/api/roast', {
          method: 'POST',
          headers,
          body: JSON.stringify({ cvText: validCv, tone: 'spicy' }),
        })
      );

      // Call 3 (Burst Limit Exceeded)
      const res3 = await roastHandler(
        new Request('http://localhost:3000/api/roast', {
          method: 'POST',
          headers,
          body: JSON.stringify({ cvText: validCv, tone: 'spicy' }),
        })
      );

      expect(res3.status).toBe(429);
      const json3 = await res3.json();
      expect(json3.success).toBe(false);
      expect(json3.error).toMatch(/vui lòng đợi|hôm nay/i);
      expect(res3.headers.get('Retry-After')).toBeDefined();
      expect(res3.headers.get('X-RateLimit-Limit')).toBe(String(ROAST_BURST_LIMIT));
      expect(res3.headers.get('X-RateLimit-Remaining')).toBe('0');
    });
  });
});
