import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, sanitizeMeta } from '@/lib/logger';

describe('Milestone 4: Zero-PII Logger Hardening (Feature 22 & §R4)', () => {
  let logSpy: any;
  let warnSpy: any;
  let errorSpy: any;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Metadata Forbidden Key Sanitization', () => {
    it('redacts forbidden keys in top-level meta regardless of case and hyphens/underscores', () => {
      const meta = {
        cvText: 'Nguyễn Văn An - 0912345678',
        CV_CONTENT: 'Sensitive CV details',
        candidate_answer: 'My situational answer',
        unmaskedEmail: 'le.van.c@gmail.com',
        phone: '0987654321',
        safeKey: 'normal_value',
      };

      const sanitized = sanitizeMeta(meta);

      expect(sanitized?.cvText).toBe('[REDACTED_PII]');
      expect(sanitized?.CV_CONTENT).toBe('[REDACTED_PII]');
      expect(sanitized?.candidate_answer).toBe('[REDACTED_PII]');
      expect(sanitized?.unmaskedEmail).toBe('[REDACTED_PII]');
      expect(sanitized?.phone).toBe('[REDACTED_PII]');
      expect(sanitized?.safeKey).toBe('normal_value');
    });

    it('recursively sanitizes arrays and nested objects within metadata', () => {
      const meta = {
        items: [
          {
            candidateName: 'Trần Văn Nam',
            phone: '0912345678',
            prose: 'Ứng viên tại https://github.com/my-repo',
          },
          'Plain string with phone 0987654321',
        ],
      };

      const sanitized = sanitizeMeta(meta);
      const items = sanitized?.items as any[];

      expect(items[0].phone).toBe('[REDACTED_PII]');
      expect(items[0].prose).toContain('[Link ẩn danh]');
      expect(items[1]).toContain('09****4321');
    });
  });

  describe('2. Direct Message and Error String PII Redaction', () => {
    it('sanitizes embedded phone and email from logger.info messages', () => {
      logger.info('Processing user 0912345678 with email test.user@gmail.com');

      expect(logSpy).toHaveBeenCalledTimes(1);
      const logged = logSpy.mock.calls[0].join(' ');
      expect(logged).not.toContain('0912345678');
      expect(logged).not.toContain('test.user@gmail.com');
      expect(logged).toContain('09****5678');
      expect(logged).toContain('t***r@gmail.com');
    });

    it('sanitizes embedded PII from logger.warn messages', () => {
      logger.warn('Warning: user le.van.c@gmail.com exceeded rate limit');

      expect(warnSpy).toHaveBeenCalledTimes(1);
      const logged = warnSpy.mock.calls[0].join(' ');
      expect(logged).not.toContain('le.van.c@gmail.com');
      expect(logged).toContain('l***c@gmail.com');
    });

    it('sanitizes embedded PII from error details and truncates long error messages', () => {
      const sensitiveError = new Error(
        `Failed to parse candidate answer for phone 0912345678: ${'A'.repeat(600)}`
      );

      logger.error('Analysis failed', sensitiveError);

      expect(errorSpy).toHaveBeenCalledTimes(1);
      const logged = errorSpy.mock.calls[0].join(' ');
      expect(logged).not.toContain('0912345678');
      expect(logged).toContain('09****5678');
      expect(logged).toContain('[truncated]');
    });
  });
});
