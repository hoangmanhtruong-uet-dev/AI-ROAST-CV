import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '@/app/api/roast/teaser/route';
import { resetTeaserRateLimits } from '@/lib/rate-limit/teaser-limiter';
import { sanitizeMeta } from '@/lib/logger';
import { TEASER_PRESETS } from '@/lib/data/teaser-presets';

describe('Milestone 3: Live Roast Teaser API & Zero-PII Logging', () => {
  beforeEach(() => {
    resetTeaserRateLimits();
    process.env.GEMINI_MOCK = 'true';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Input Validation (10 - 250 chars)', () => {
    it('returns 400 when body is invalid JSON', async () => {
      const req = new Request('http://localhost:3000/api/roast/teaser', {
        method: 'POST',
        body: 'invalid-json',
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it('returns 400 when sentence is shorter than 10 characters', async () => {
      const req = new Request('http://localhost:3000/api/roast/teaser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence: 'Quá ngắn' }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('tối thiểu 10 ký tự');
    });

    it('returns 400 when sentence exceeds 250 characters', async () => {
      const req = new Request('http://localhost:3000/api/roast/teaser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence: 'A'.repeat(251) }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('tối đa 250 ký tự');
    });
  });

  describe('2. Instant Preset Cache (< 5ms)', () => {
    it('returns instant cached response for preset 1', async () => {
      const preset = TEASER_PRESETS[0];
      const start = performance.now();
      const req = new Request('http://localhost:3000/api/roast/teaser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence: preset.sentence }),
      });
      const res = await POST(req);
      const duration = performance.now() - start;

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.isPreset).toBe(true);
      expect(json.data.roastComment).toBe(preset.roastComment);
      expect(json.data.actionVerb).toBe(preset.actionVerb);
      expect(json.data.atsRewrite).toBe(preset.atsRewrite);
      expect(duration).toBeLessThan(100); // In headless test execution
    });

    it('matches presets with normalized case and whitespace', async () => {
      const req = new Request('http://localhost:3000/api/roast/teaser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentence: '  THAM GIA PHÁT TRIỂN WEBSITE BÁN HÀNG CÙNG NHÓM!  ',
        }),
      });
      const res = await POST(req);
      const json = await res.json();
      expect(json.isPreset).toBe(true);
    });
  });

  describe('3. Anti-Hallucination Placeholder Enforcement', () => {
    it('guarantees that atsRewrite contains [...] placeholders', async () => {
      const req = new Request('http://localhost:3000/api/roast/teaser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentence: 'Làm việc chăm chỉ với các công nghệ web hiện đại.',
        }),
      });
      const res = await POST(req);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.atsRewrite).toMatch(/\[[^\]]+\]/);
    });
  });

  describe('4. Dual-Layer Rate Limiting (3 calls / day)', () => {
    it('allows 3 requests and returns 429 on the 4th request', async () => {
      const payload = { sentence: 'Tự thiết kế giao diện cho ứng dụng di động.' };

      for (let i = 1; i <= 3; i++) {
        const req = new Request('http://localhost:3000/api/roast/teaser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '192.168.1.100' },
          body: JSON.stringify(payload),
        });
        const res = await POST(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.remainingCalls).toBe(3 - i);
      }

      // 4th call
      const req4 = new Request('http://localhost:3000/api/roast/teaser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '192.168.1.100' },
        body: JSON.stringify(payload),
      });
      const res4 = await POST(req4);
      expect(res4.status).toBe(429);
      const json4 = await res4.json();
      expect(json4.success).toBe(false);
      expect(json4.error).toContain('3 lượt');
      expect(res4.headers.get('X-RateLimit-Remaining')).toBe('0');
    });
  });

  describe('5. Zero-PII Server Logging Enforcement', () => {
    it('redacts sentence, roastComment, and atsRewrite in sanitizeMeta', () => {
      const meta = {
        sentence: 'Tôi là kỹ sư tại Viettel 0912345678',
        roastComment: 'Sarcastic comment',
        atsRewrite: 'Rewritten text with [metrics]',
        sentenceLength: 35,
        isPreset: false,
      };

      const sanitized = sanitizeMeta(meta);
      expect(sanitized?.sentence).toBe('[REDACTED_PII]');
      expect(sanitized?.roastComment).toBe('[REDACTED_PII]');
      expect(sanitized?.atsRewrite).toBe('[REDACTED_PII]');
      expect(sanitized?.sentenceLength).toBe(35);
      expect(sanitized?.isPreset).toBe(false);
    });

    it('never emits candidate sentence or PII to console logs during API execution', async () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const secretSentence = 'Em là lập trình viên 0987654321 email sinhvien@hust.edu.vn';

      const req = new Request('http://localhost:3000/api/roast/teaser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence: secretSentence }),
      });
      await POST(req);

      const allLogs = logSpy.mock.calls.map((c) => c.join(' ')).join('\n');
      expect(allLogs).not.toContain(secretSentence);
      expect(allLogs).not.toContain('0987654321');
      expect(allLogs).not.toContain('sinhvien@hust.edu.vn');
    });
  });
});
