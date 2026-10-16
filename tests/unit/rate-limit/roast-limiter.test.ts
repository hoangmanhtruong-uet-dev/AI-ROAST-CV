import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkRoastRateLimit,
  validateRoastPayload,
  signQuotaPayload,
  verifyQuotaCookie,
  RoastMemoryStore,
  ROAST_DAILY_QUOTA,
  ROAST_BURST_LIMIT,
  ROAST_BURST_WINDOW_MS,
  ROAST_MIN_PAYLOAD_CHARS,
  ROAST_MAX_PAYLOAD_CHARS,
  ROAST_RATE_LIMIT_ERROR_MESSAGE,
  ROAST_BURST_LIMIT_ERROR_MESSAGE,
} from '@/lib/rate-limit/roast-limiter';
import { POST as roastHandler } from '@/app/api/roast/route';

describe('Self-Contained Roast Rate Limiter (Milestone 7 / Requirement R1)', () => {
  let memoryStore: RoastMemoryStore;
  const testSecret = 'test_secret_hmac_2026';
  const testSalt = 'test_salt_roast_2026';
  const baseNow = 1792150000000; // Fixed timestamp for reproducible testing

  beforeEach(() => {
    memoryStore = new RoastMemoryStore();
  });

  describe('1. Tier 1: Payload Guard & Input Length Limiter', () => {
    it('rejects CV text below 120 characters with descriptive error', () => {
      const shortText = 'Nguyễn Văn A - Lập trình viên React. Tìm kiếm việc làm.';
      expect(shortText.length).toBeLessThan(ROAST_MIN_PAYLOAD_CHARS);

      const result = validateRoastPayload(shortText);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/tối thiểu 120 ký tự/i);
    });

    it('accepts valid CV text between 120 and 5,000 characters', () => {
      const validText = `
        Nguyễn Văn A - Sinh viên Đại học Bách Khoa Hà Nội.
        Mục tiêu: Trở thành kỹ sư phần mềm Fullstack chất lượng cao.
        Kỹ năng: React, Next.js, Node.js, TypeScript, PostgreSQL, Docker.
        Dự án: Xây dựng ứng dụng E-commerce phục vụ 5.000 người dùng thử nghiệm.
      `.trim();
      expect(validText.length).toBeGreaterThanOrEqual(ROAST_MIN_PAYLOAD_CHARS);
      expect(validText.length).toBeLessThanOrEqual(ROAST_MAX_PAYLOAD_CHARS);

      const result = validateRoastPayload(validText);
      expect(result.valid).toBe(true);
      expect(result.sanitizedLength).toBe(validText.length);
      expect(result.truncatedText).toBe(validText);
    });

    it('safely truncates CV text exceeding 5,000 characters (1-page CV limit)', () => {
      const hugeText = 'a'.repeat(6000);
      const result = validateRoastPayload(hugeText);

      expect(result.valid).toBe(true);
      expect(result.sanitizedLength).toBe(5000);
      expect(result.truncatedText?.length).toBe(5000);
    });

    it('rejects empty or null text', () => {
      expect(validateRoastPayload('').valid).toBe(false);
      // @ts-expect-error test non-string
      expect(validateRoastPayload(null).valid).toBe(false);
    });
  });

  describe('2. Tier 2: HMAC-SHA256 Signed Cookie Quota Carrier', () => {
    it('signs and verifies a valid quota payload successfully', () => {
      const payload = {
        used: 2,
        resetAt: Math.floor(baseNow / 1000) + 3600,
        day: '2026-10-16',
      };

      const signedCookie = signQuotaPayload(payload, testSecret);
      expect(signedCookie).toContain('.');

      const verified = verifyQuotaCookie(signedCookie, testSecret, baseNow);
      expect(verified).not.toBeNull();
      expect(verified?.used).toBe(2);
      expect(verified?.day).toBe('2026-10-16');
    });

    it('rejects tampered cookie where payload was manipulated', () => {
      const payload = {
        used: 5,
        resetAt: Math.floor(baseNow / 1000) + 3600,
        day: '2026-10-16',
      };
      const signedCookie = signQuotaPayload(payload, testSecret);
      const [dataB64, sig] = signedCookie.split('.');

      // Attacker attempts to change used from 5 to 0
      const tamperedJson = JSON.stringify({ ...payload, used: 0 });
      const tamperedB64 = Buffer.from(tamperedJson, 'utf-8').toString('base64url');
      const tamperedCookie = `${tamperedB64}.${sig}`;

      const verified = verifyQuotaCookie(tamperedCookie, testSecret, baseNow);
      expect(verified).toBeNull();
    });

    it('rejects expired quota cookie past resetAt', () => {
      const expiredPayload = {
        used: 3,
        resetAt: Math.floor(baseNow / 1000) - 10, // 10s in the past
        day: '2026-10-15',
      };
      const signedCookie = signQuotaPayload(expiredPayload, testSecret);
      const verified = verifyQuotaCookie(signedCookie, testSecret, baseNow);

      expect(verified).toBeNull();
    });
  });

  describe('3. Tier 3: In-Memory Salted Token Bucket & Dual-Window Limits', () => {
    it('enforces burst limit: maximum 2 requests within 60 seconds', () => {
      const ip = '192.168.1.100';

      // Request 1: allowed
      const res1 = checkRoastRateLimit(undefined, {
        customIp: ip,
        now: baseNow,
        store: memoryStore,
        secret: testSecret,
        salt: testSalt,
        forceEnforce: true,
      });
      expect(res1.allowed).toBe(true);
      expect(res1.status).toBe(200);
      expect(res1.remaining).toBe(4);

      // Request 2 (10s later): allowed
      const res2 = checkRoastRateLimit(undefined, {
        customIp: ip,
        now: baseNow + 10_000,
        store: memoryStore,
        secret: testSecret,
        salt: testSalt,
        forceEnforce: true,
      });
      expect(res2.allowed).toBe(true);
      expect(res2.remaining).toBe(3);

      // Request 3 (20s later, within 60s window): BLOCKED by burst limit
      const res3 = checkRoastRateLimit(undefined, {
        customIp: ip,
        now: baseNow + 20_000,
        store: memoryStore,
        secret: testSecret,
        salt: testSalt,
        forceEnforce: true,
      });
      expect(res3.allowed).toBe(false);
      expect(res3.status).toBe(429);
      expect(res3.error).toBe(ROAST_BURST_LIMIT_ERROR_MESSAGE);
      expect(res3.retryAfterSeconds).toBeGreaterThan(0);
      expect(res3.headers['Retry-After']).toBeDefined();
    });

    it('allows request after burst window (60s) has elapsed', () => {
      const ip = '192.168.1.101';

      // 2 quick requests
      checkRoastRateLimit(undefined, {
        customIp: ip,
        now: baseNow,
        store: memoryStore,
        secret: testSecret,
        salt: testSalt,
        forceEnforce: true,
      });
      checkRoastRateLimit(undefined, {
        customIp: ip,
        now: baseNow + 5000,
        store: memoryStore,
        secret: testSecret,
        salt: testSalt,
        forceEnforce: true,
      });

      // 3rd request 65 seconds later: allowed
      const resAfterBurst = checkRoastRateLimit(undefined, {
        customIp: ip,
        now: baseNow + 65_000,
        store: memoryStore,
        secret: testSecret,
        salt: testSalt,
        forceEnforce: true,
      });
      expect(resAfterBurst.allowed).toBe(true);
      expect(resAfterBurst.remaining).toBe(2);
    });

    it('enforces daily quota: maximum 5 requests per 24 hours', () => {
      const ip = '192.168.1.102';
      let currentTime = baseNow;

      // Make 5 spaced-out requests (every 70s to avoid burst limit)
      for (let i = 1; i <= 5; i++) {
        const res = checkRoastRateLimit(undefined, {
          customIp: ip,
          now: currentTime,
          store: memoryStore,
          secret: testSecret,
          salt: testSalt,
          forceEnforce: true,
        });
        expect(res.allowed).toBe(true);
        expect(res.remaining).toBe(5 - i);
        currentTime += 70_000;
      }

      // 6th request: BLOCKED by daily quota
      const res6 = checkRoastRateLimit(undefined, {
        customIp: ip,
        now: currentTime,
        store: memoryStore,
        secret: testSecret,
        salt: testSalt,
        forceEnforce: true,
      });
      expect(res6.allowed).toBe(false);
      expect(res6.status).toBe(429);
      expect(res6.error).toBe(ROAST_RATE_LIMIT_ERROR_MESSAGE);
      expect(res6.remaining).toBe(0);
    });

    it('resets daily quota on next UTC midnight', () => {
      const ip = '192.168.1.103';

      // Exhaust all 5 calls
      let t = baseNow;
      for (let i = 0; i < 5; i++) {
        checkRoastRateLimit(undefined, {
          customIp: ip,
          now: t,
          store: memoryStore,
          secret: testSecret,
          salt: testSalt,
          forceEnforce: true,
        });
        t += 70_000;
      }

      // Advance 25 hours (next day)
      const nextDayTime = baseNow + 25 * 60 * 60 * 1000;
      const resNextDay = checkRoastRateLimit(undefined, {
        customIp: ip,
        now: nextDayTime,
        store: memoryStore,
        secret: testSecret,
        salt: testSalt,
        forceEnforce: true,
      });

      expect(resNextDay.allowed).toBe(true);
      expect(resNextDay.remaining).toBe(4);
    });

    it('protects privacy: clientIpHash is a 64-character hex string and never leaks raw IP', () => {
      const sensitiveIp = '113.190.234.56';
      const res = checkRoastRateLimit(undefined, {
        customIp: sensitiveIp,
        now: baseNow,
        store: memoryStore,
        secret: testSecret,
        salt: testSalt,
        forceEnforce: true,
      });

      expect(res.clientIpHash).toBeDefined();
      expect(res.clientIpHash?.length).toBe(64);
      expect(res.clientIpHash).toMatch(/^[0-9a-f]{64}$/);
      expect(res.clientIpHash).not.toContain('113.190');
    });
  });

  describe('4. Pro License Exemption', () => {
    it('bypasses rate limit completely when Pro key header is provided', () => {
      const req = new Request('http://localhost:3000/api/roast', {
        headers: {
          'x-pro-license-key': 'PRO-ABCD-1234',
        },
      });

      const res = checkRoastRateLimit(req, {
        now: baseNow,
        store: memoryStore,
        forceEnforce: true,
      });

      expect(res.allowed).toBe(true);
      expect(res.isPro).toBe(true);
      expect(res.limit).toBe(9999);
      expect(res.remaining).toBe(9999);
    });
  });

  describe('5. Integration with Route Handler POST /api/roast', () => {
    it('returns 429 when client exceeds rate limit with enforce header', async () => {
      const cvText = `
        Nguyễn Văn B - Kỹ sư phần mềm Fullstack React và Node.js.
        Có 1 năm kinh nghiệm phát triển hệ thống web, tối ưu cơ sở dữ liệu.
        Thành thạo TypeScript, Next.js, Docker, CI/CD pipeline và RESTful API.
      `.trim();

      const headers = {
        'Content-Type': 'application/json',
        'x-enforce-rate-limit': 'true',
        'x-forwarded-for': '203.0.113.42',
      };

      // Exhaust burst limit (2 rapid calls)
      const req1 = new Request('http://localhost:3000/api/roast', {
        method: 'POST',
        headers,
        body: JSON.stringify({ cvText, tone: 'spicy' }),
      });
      await roastHandler(req1);

      const req2 = new Request('http://localhost:3000/api/roast', {
        method: 'POST',
        headers,
        body: JSON.stringify({ cvText, tone: 'spicy' }),
      });
      await roastHandler(req2);

      // 3rd rapid call: should return 429
      const req3 = new Request('http://localhost:3000/api/roast', {
        method: 'POST',
        headers,
        body: JSON.stringify({ cvText, tone: 'spicy' }),
      });
      const res3 = await roastHandler(req3);

      expect(res3.status).toBe(429);
      const json = await res3.json();
      expect(json.success).toBe(false);
      expect(json.error).toMatch(/vui lòng đợi|hôm nay/i);
      expect(res3.headers.get('Retry-After')).toBeDefined();
    });
  });
});
