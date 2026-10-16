import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/fakedoor/route';
import { leadStore, getLeadsCount, maskEmail, clearLeads } from '@/lib/storage';
import { logger } from '@/lib/logger';

describe('Adversarial & Edge-Case Stress Testing: POST /api/fakedoor', () => {
  beforeEach(() => {
    clearLeads();
    vi.restoreAllMocks();
  });

  describe('1. Malformed JSON Payloads', () => {
    it('rejects broken/invalid JSON syntax with 400 Bad Request', async () => {
      const malformedBodies = [
        '{',
        '{ invalid json',
        '{"email": "test@example.com", tier: "pro_29k"',
        '{"email": undefined}',
        '{"email": "test@example.com",}',
        '<xml><email>test@example.com</email></xml>',
      ];

      for (const body of malformedBodies) {
        const request = new Request('http://localhost:3000/api/fakedoor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        });

        const res = await POST(request);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.success).toBe(false);
        expect(data.message).toBeDefined();
        expect(data.error).toBeDefined();
      }
      expect(getLeadsCount()).toBe(0);
    });

    it('rejects empty or whitespace-only bodies with 400 Bad Request', async () => {
      const emptyBodies = ['', '   ', '\n\t'];

      for (const body of emptyBodies) {
        const request = new Request('http://localhost:3000/api/fakedoor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        });

        const res = await POST(request);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.success).toBe(false);
      }
    });

    it('rejects JSON primitives and arrays that are not plain objects with 400 Bad Request', async () => {
      const nonObjectBodies = [
        'null',
        'true',
        'false',
        '12345',
        '"just a string"',
        '[]',
        '[1, 2, 3]',
        '[{"email": "user@example.com", "tier": "pro_29k"}]',
      ];

      for (const body of nonObjectBodies) {
        const request = new Request('http://localhost:3000/api/fakedoor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        });

        const res = await POST(request);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.success).toBe(false);
      }
      expect(getLeadsCount()).toBe(0);
    });
  });

  describe('2. SQL & HTML/XSS Injection Attacks', () => {
    it('rejects classic and advanced SQL injection strings in email field with 400', async () => {
      const sqlInjections = [
        "' OR '1'='1",
        "admin'--",
        "admin' /*",
        "' OR 1=1; --",
        "'; DROP TABLE leads; --",
        "1' UNION SELECT * FROM users--",
        "admin' AND 1=0 UNION ALL SELECT 'admin', '81dc9bdb52d04dc20036dbd8313ed055'--",
        "admin') OR ('1'='1",
        "'; WAITFOR DELAY '0:0:5'--",
        "1; EXEC xp_cmdshell('dir')--",
      ];

      for (const sql of sqlInjections) {
        const request = new Request('http://localhost:3000/api/fakedoor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: sql, tier: 'pro_29k' }),
        });

        const res = await POST(request);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.success).toBe(false);
      }
      expect(getLeadsCount()).toBe(0);
    });

    it('rejects HTML and XSS attack vectors in email field with 400', async () => {
      const xssVectors = [
        '<script>alert(1)</script>',
        '<img src=x onerror=alert(1)>',
        '<svg onload=alert(document.cookie)>',
        '<iframe src="javascript:alert(1)"></iframe>',
        '"><script>alert(1)</script>',
        'javascript:alert(1)',
        '<body onload=alert(1)>',
        '&lt;script&gt;alert(1)&lt;/script&gt;',
        '<a href="https://malicious.com">Click me</a>',
      ];

      for (const xss of xssVectors) {
        const request = new Request('http://localhost:3000/api/fakedoor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: xss, tier: 'pro_29k' }),
        });

        const res = await POST(request);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.success).toBe(false);
      }
      expect(getLeadsCount()).toBe(0);
    });

    it('handles RFC-legal email containing single quotes safely without SQL vulnerability', async () => {
      // Single quotes are technically allowed in local parts under RFC 5322
      const legalQuotedEmail = "o'connor@example.com";
      const request = new Request('http://localhost:3000/api/fakedoor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: legalQuotedEmail, tier: 'pro_29k' }),
      });

      const res = await POST(request);
      // Whether Zod accepts it or rejects it, it MUST NOT throw an unhandled exception
      expect([200, 400]).toContain(res.status);
      if (res.status === 200) {
        expect(leadStore).toHaveLength(1);
        expect(leadStore[0].email).toBe("o'connor@example.com");
        // Ensure email is properly hashed and masked
        expect(leadStore[0].hashedEmail).toBeDefined();
        expect(leadStore[0].maskedEmail).toMatch(/o\*\*\*r@example\.com/);
      }
    });
  });

  describe('3. Missing, Invalid, or Defaulted Tier Field', () => {
    it('accepts request when tier is omitted and applies pro_29k default', async () => {
      const request = new Request('http://localhost:3000/api/fakedoor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'missing.tier@example.com' }),
      });

      const res = await POST(request);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      expect(leadStore).toHaveLength(1);
      expect(leadStore[0].tier).toBe('pro_29k');
    });

    it('rejects invalid tier strings with 400 Bad Request', async () => {
      const invalidTiers = [
        'free',
        'pro_50k',
        'enterprise',
        'PRO_29K',
        '',
        'pro_29k ',
        ' pro_29k',
      ];

      for (const tier of invalidTiers) {
        const request = new Request('http://localhost:3000/api/fakedoor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com', tier }),
        });

        const res = await POST(request);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.success).toBe(false);
      }
    });

    it('rejects non-string tier types with 400 Bad Request', async () => {
      const invalidTierTypes = [
        29000,
        29.0,
        true,
        false,
        null,
        [],
        ['pro_29k'],
        { tier: 'pro_29k' },
      ];

      for (const tier of invalidTierTypes) {
        const request = new Request('http://localhost:3000/api/fakedoor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com', tier }),
        });

        const res = await POST(request);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.success).toBe(false);
      }
    });
  });

  describe('4. Non-String Types and Type Pollution in Payload Fields', () => {
    it('rejects non-string email types with 400 Bad Request', async () => {
      const invalidEmailTypes = [
        12345,
        0,
        true,
        false,
        null,
        [],
        ['user@example.com'],
        { address: 'user@example.com' },
      ];

      for (const email of invalidEmailTypes) {
        const request = new Request('http://localhost:3000/api/fakedoor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, tier: 'pro_29k' }),
        });

        const res = await POST(request);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.success).toBe(false);
      }
    });

    it('rejects invalid featureInterest types and values with 400 Bad Request', async () => {
      const invalidFeatureInterests = [
        'invalid_feature',
        'vip_access',
        '',
        123,
        true,
        null,
        [],
        ['deep_interview'],
        { feature: 'deep_interview' },
      ];

      for (const featureInterest of invalidFeatureInterests) {
        const request = new Request('http://localhost:3000/api/fakedoor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            tier: 'pro_29k',
            featureInterest,
          }),
        });

        const res = await POST(request);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.success).toBe(false);
      }
    });

    it('safely ignores unexpected extra properties (prototype pollution / excess keys)', async () => {
      const request = new Request('http://localhost:3000/api/fakedoor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'safe@example.com',
          tier: 'pro_29k',
          featureInterest: 'deep_interview',
          __proto__: { admin: true },
          role: 'superuser',
          isAdmin: true,
          arbitraryNested: { a: 1 },
        }),
      });

      const res = await POST(request);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      // Verify the extra fields were not injected into lead store
      expect(leadStore).toHaveLength(1);
      const lead = leadStore[0];
      expect(lead.email).toBe('safe@example.com');
      expect((lead as unknown as Record<string, unknown>).isAdmin).toBeUndefined();
      expect((lead as unknown as Record<string, unknown>).role).toBeUndefined();
    });
  });

  describe('5. Extremely Long Strings and ReDoS Stress', () => {
    it('rejects email strings exceeding 255 characters with 400 Bad Request', async () => {
      // 256 characters email (244 + 12 = 256)
      const email256 = 'a'.repeat(244) + '@example.com';
      expect(email256.length).toBe(256);

      const request = new Request('http://localhost:3000/api/fakedoor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email256, tier: 'pro_29k' }),
      });

      const res = await POST(request);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toMatch(/vượt quá 255 ký tự/i);
    });

    it('rejects email strings with > 500 characters quickly without ReDoS or crash', async () => {
      const email500 = 'b'.repeat(500) + '@example.com';
      expect(email500.length).toBeGreaterThan(500);

      const startTime = Date.now();
      const request = new Request('http://localhost:3000/api/fakedoor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email500, tier: 'pro_29k' }),
      });

      const res = await POST(request);
      const duration = Date.now() - startTime;

      expect(res.status).toBe(400);
      expect(duration).toBeLessThan(100); // Must be fast, no catastrophic backtracking
    });

    it('rejects massive 100,000 character payload gracefully without crashing', async () => {
      const massiveString = 'c'.repeat(100_000);
      const request = new Request('http://localhost:3000/api/fakedoor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: massiveString, tier: 'pro_29k' }),
      });

      const res = await POST(request);
      expect(res.status).toBe(400);
      expect(getLeadsCount()).toBe(0);
    });
  });

  describe('6. Duplicate Submissions, Normalization, and Idempotency', () => {
    it('normalizes email casing and trims whitespace for duplicate detection', async () => {
      const submissions = [
        'student.BK@hust.edu.vn',
        'STUDENT.BK@HUST.EDU.VN',
        '  student.bk@hust.edu.vn  ',
        'Student.Bk@Hust.Edu.Vn',
      ];

      for (const email of submissions) {
        const request = new Request('http://localhost:3000/api/fakedoor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, tier: 'pro_29k' }),
        });

        const res = await POST(request);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
      }

      // Exactly 1 lead stored despite 4 case/whitespace variations
      expect(getLeadsCount()).toBe(1);
      expect(leadStore[0].email).toBe('student.bk@hust.edu.vn');
    });

    it('handles duplicate submission with different feature interest gracefully', async () => {
      // First submission
      const req1 = new Request('http://localhost:3000/api/fakedoor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'candidate@domain.com',
          tier: 'pro_29k',
          featureInterest: 'deep_interview',
        }),
      });
      const res1 = await POST(req1);
      expect(res1.status).toBe(200);

      // Second submission with different interest
      const req2 = new Request('http://localhost:3000/api/fakedoor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'candidate@domain.com',
          tier: 'pro_29k',
          featureInterest: 'ats_rewrite',
        }),
      });
      const res2 = await POST(req2);
      expect(res2.status).toBe(200);

      // Remains 1 lead, retains initial or existing record
      expect(getLeadsCount()).toBe(1);
      expect(leadStore[0].email).toBe('candidate@domain.com');
    });
  });

  describe('7. FIFO Ring Buffer Stress & Capacity Limits', () => {
    it('handles 1,050 leads without crashing and respects MAX_LEADS_CAPACITY (1,000)', async () => {
      // Direct stress test of the lead store buffer
      for (let i = 0; i < 1050; i++) {
        const email = `candidate${i}@example.com`;
        const request = new Request('http://localhost:3000/api/fakedoor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, tier: 'pro_29k' }),
        });

        const res = await POST(request);
        expect(res.status).toBe(200);
      }

      // Buffer cap is 1,000
      expect(getLeadsCount()).toBe(1000);
      // Oldest 50 leads (0 to 49) should have been shifted out
      expect(leadStore[0].email).toBe('candidate50@example.com');
      expect(leadStore[999].email).toBe('candidate1049@example.com');
    });
  });

  describe('8. Zero-PII Server Logging Enforcement', () => {
    it('never logs raw unmasked email to console on successful lead capture', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');

      const rawEmail = 'secret.student@domain.vn';
      const request = new Request('http://localhost:3000/api/fakedoor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: rawEmail, tier: 'pro_29k' }),
      });

      const res = await POST(request);
      expect(res.status).toBe(200);

      // Verify that no console.log call contains the raw email
      const logCalls = consoleLogSpy.mock.calls.map((call) => call.join(' '));
      for (const logLine of logCalls) {
        expect(logLine).not.toContain(rawEmail);
        expect(logLine).toContain('s***t@domain.vn'); // Masked email
      }
    });

    it('maskEmail utility handles edge-case email formats robustly without crashing', () => {
      expect(maskEmail('a@b.com')).toBe('a***@b.com');
      expect(maskEmail('ab@b.com')).toBe('a***@b.com');
      expect(maskEmail('abc@b.com')).toBe('a***c@b.com');
      expect(maskEmail('single@domain')).toBe('s***e@domain');
      expect(maskEmail('no-at-sign')).toBe('***');
      expect(maskEmail('two@at@signs.com')).toBe('***');
      expect(maskEmail('')).toBe('***');
    });
  });

  describe('9. Unhandled Exception & Crash Resilience', () => {
    it('catches and recovers gracefully when request.json() throws unhandled error', async () => {
      const brokenRequest = {
        json: vi.fn().mockRejectedValue(new Error('Simulated socket hangup or stream error')),
      } as unknown as Request;

      const res = await POST(brokenRequest);
      expect(res.status).toBe(400); // Handler catches and returns 400
      const data = await res.json();
      expect(data.success).toBe(false);
    });

    it('returns 500 with friendly message if internal store throws unexpected error', async () => {
      // Mock logger to avoid polluting stdout
      vi.spyOn(logger, 'error').mockImplementation(() => {});

      // Simulate unexpected storage error by freezing the array
      Object.freeze(leadStore);

      const request = new Request('http://localhost:3000/api/fakedoor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'crash@example.com', tier: 'pro_29k' }),
      });

      const res = await POST(request);
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.message).toMatch(/lỗi xảy ra trên hệ thống/i);

      // Unfreeze for subsequent tests
      // (arrays frozen with Object.freeze cannot be unfrozen directly, but leadStore can be reset if not mutated)
    });
  });
});
