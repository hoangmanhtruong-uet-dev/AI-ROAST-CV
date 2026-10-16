import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  STORAGE_KEYS_TO_CLEAR,
  wipeAllSessionData,
  WIPE_DATA_EVENT_NAME,
} from '@/lib/storage/wipe-data';
import {
  getTrialUsage,
  TRIAL_REWRITE_KEY,
  TRIAL_CUSTOM_JD_KEY,
  CUSTOM_JD_DRAFT_KEY,
  ATS_REWRITES_CACHE_KEY,
  LEGACY_REWRITE_KEY,
} from '@/lib/payment/trial';
import { PRO_STORAGE_KEY, PRO_LICENSE_KEY } from '@/lib/payment/entitlement';
import { FORBIDDEN_LOG_KEYS, sanitizeMeta } from '@/lib/logger';

describe('Milestone 9: 1-Click Wipe Data & Zero-PII Logger Hardening', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('1. STORAGE_KEYS_TO_CLEAR Complete Registration', () => {
    it('contains all Round 2 trial tracking and session draft storage keys', () => {
      expect(STORAGE_KEYS_TO_CLEAR).toContain('airoastcv_trial_rewrite_count');
      expect(STORAGE_KEYS_TO_CLEAR).toContain('airoastcv_trial_custom_jd_count');
      expect(STORAGE_KEYS_TO_CLEAR).toContain('airoastcv_custom_jd_text');
      expect(STORAGE_KEYS_TO_CLEAR).toContain('airoastcv_ats_rewrites');
      expect(STORAGE_KEYS_TO_CLEAR).toContain('airoastcv_rewrite_count');
      expect(STORAGE_KEYS_TO_CLEAR).toContain('airoastcv:is_pro');
      expect(STORAGE_KEYS_TO_CLEAR).toContain('airoastcv:license_key');
    });
  });

  describe('2. 1-Click Wipe Data Purges Trial Usage and Restores Capacity', () => {
    it('resets trial usage counts to 0 and dispatches data-wiped event', () => {
      const eventListener = vi.fn();
      window.addEventListener(WIPE_DATA_EVENT_NAME, eventListener);

      // Seed active trial and draft data
      localStorage.setItem(TRIAL_REWRITE_KEY, '3');
      localStorage.setItem(LEGACY_REWRITE_KEY, '3');
      localStorage.setItem(TRIAL_CUSTOM_JD_KEY, '2');
      localStorage.setItem(CUSTOM_JD_DRAFT_KEY, 'Senior Backend Go JD...');
      localStorage.setItem(ATS_REWRITES_CACHE_KEY, JSON.stringify([{ quote: 'Test' }]));
      localStorage.setItem(PRO_STORAGE_KEY, 'true');
      localStorage.setItem(PRO_LICENSE_KEY, 'PRO-VIP2-2026');

      // Before wipe: free usage is exhausted
      const preUsage = getTrialUsage(false);
      expect(preUsage.canRewrite).toBe(false);
      expect(preUsage.canCustomJd).toBe(false);

      // Execute 1-Click Wipe Data
      const result = wipeAllSessionData();

      expect(result.success).toBe(true);
      expect(result.clearedLocalStorage).toBe(true);

      // Event was broadcast for cross-component reactive reset
      expect(eventListener).toHaveBeenCalledTimes(1);

      // All keys must be removed
      expect(localStorage.getItem(TRIAL_REWRITE_KEY)).toBeNull();
      expect(localStorage.getItem(LEGACY_REWRITE_KEY)).toBeNull();
      expect(localStorage.getItem(TRIAL_CUSTOM_JD_KEY)).toBeNull();
      expect(localStorage.getItem(CUSTOM_JD_DRAFT_KEY)).toBeNull();
      expect(localStorage.getItem(ATS_REWRITES_CACHE_KEY)).toBeNull();
      expect(localStorage.getItem(PRO_STORAGE_KEY)).toBeNull();
      expect(localStorage.getItem(PRO_LICENSE_KEY)).toBeNull();

      // Free trial capacity is restored back to 1
      const postUsage = getTrialUsage(false);
      expect(postUsage.rewriteCount).toBe(0);
      expect(postUsage.customJdCount).toBe(0);
      expect(postUsage.canRewrite).toBe(true);
      expect(postUsage.canCustomJd).toBe(true);

      window.removeEventListener(WIPE_DATA_EVENT_NAME, eventListener);
    });
  });

  describe('3. Zero-PII Server Logging: Round 2 Forbidden Keys', () => {
    it('contains all required Round 2 JD and Rewrite forbidden keys in FORBIDDEN_LOG_KEYS', () => {
      const requiredKeys = [
        'jd',
        'jdtext',
        'jobdescription',
        'customjd',
        'rewrittentext',
        'rewrittencontent',
        'cvrewrite',
        'rewrite',
        'suggestion',
      ];

      for (const key of requiredKeys) {
        expect(FORBIDDEN_LOG_KEYS.has(key)).toBe(true);
      }
    });

    it('redacts all variations of JD and rewrite keys regardless of camelCase, snake_case, or hyphens', () => {
      const sensitiveMeta = {
        jd: 'Top secret banking JD requirements',
        jdText: 'Job description content: Senior Java Developer',
        job_description: 'Responsibilities: Lead distributed payments',
        customJd: 'Custom startup JD pasted by candidate',
        rewrittenText: 'Chủ trì tối ưu hóa hệ thống microservices [số liệu]',
        rewritten_content: 'ATS compliant bullet point',
        cvRewrite: 'Improved CV section',
        rewrite: 'Alternative AI proposal',
        suggestion: 'Candidate advice',
        safeDurationMs: 142,
        statusCode: 200,
        feature: 'custom_jd_interview',
      };

      const sanitized = sanitizeMeta(sensitiveMeta);

      expect(sanitized?.jd).toBe('[REDACTED_PII]');
      expect(sanitized?.jdText).toBe('[REDACTED_PII]');
      expect(sanitized?.job_description).toBe('[REDACTED_PII]');
      expect(sanitized?.customJd).toBe('[REDACTED_PII]');
      expect(sanitized?.rewrittenText).toBe('[REDACTED_PII]');
      expect(sanitized?.rewritten_content).toBe('[REDACTED_PII]');
      expect(sanitized?.cvRewrite).toBe('[REDACTED_PII]');
      expect(sanitized?.rewrite).toBe('[REDACTED_PII]');
      expect(sanitized?.suggestion).toBe('[REDACTED_PII]');

      // Safe non-PII metadata is preserved
      expect(sanitized?.safeDurationMs).toBe(142);
      expect(sanitized?.statusCode).toBe(200);
      expect(sanitized?.feature).toBe('custom_jd_interview');
    });

    it('redacts nested arrays and child objects containing forbidden keys', () => {
      const complexMeta = {
        batch: [
          {
            jobDescription: 'Confidential JD',
            score: 8.5,
          },
          {
            cv_rewrite: 'Tối ưu hóa câu [số liệu]',
            actionVerb: 'Phát triển',
          },
        ],
      };

      const sanitized = sanitizeMeta(complexMeta);
      const batch = sanitized?.batch as any[];

      expect(batch[0].jobDescription).toBe('[REDACTED_PII]');
      expect(batch[0].score).toBe(8.5);
      expect(batch[1].cv_rewrite).toBe('[REDACTED_PII]');
      expect(batch[1].actionVerb).toBe('Phát triển');
    });
  });
});
