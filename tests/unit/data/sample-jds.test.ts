import { describe, it, expect } from 'vitest';
import { SAMPLE_JDS, getSampleJd, SampleJd } from '@/lib/data/sample-jds';

describe('SAMPLE_JDS Data & Helpers (Milestone 2)', () => {
  it('contains at least 3 curated Vietnamese sample JDs', () => {
    expect(Array.isArray(SAMPLE_JDS)).toBe(true);
    expect(SAMPLE_JDS.length).toBeGreaterThanOrEqual(3);
  });

  it('contains the 3 expected target roles: Frontend, Backend, and Digital Marketing', () => {
    const ids = SAMPLE_JDS.map((jd) => jd.id);
    expect(ids).toContain('frontend-react-fresher');
    expect(ids).toContain('backend-golang-node');
    expect(ids).toContain('marketing-growth-executive');
  });

  it('ensures all sample JDs have unique IDs', () => {
    const ids = SAMPLE_JDS.map((jd) => jd.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('validates that every sample JD has complete, non-empty fields', () => {
    SAMPLE_JDS.forEach((jd: SampleJd) => {
      expect(typeof jd.id).toBe('string');
      expect(jd.id.trim().length).toBeGreaterThan(0);

      expect(typeof jd.badge).toBe('string');
      expect(jd.badge.trim().length).toBeGreaterThan(0);

      expect(typeof jd.roleTitle).toBe('string');
      expect(jd.roleTitle.trim().length).toBeGreaterThan(0);

      expect(typeof jd.companyOrIndustry).toBe('string');
      expect(jd.companyOrIndustry.trim().length).toBeGreaterThan(0);

      expect(typeof jd.summary).toBe('string');
      expect(jd.summary.trim().length).toBeGreaterThan(0);

      expect(typeof jd.jdText).toBe('string');
      expect(jd.jdText.trim().length).toBeGreaterThan(50);
    });
  });

  it('ensures each sample JD text contains realistic job description sections', () => {
    SAMPLE_JDS.forEach((jd: SampleJd) => {
      // Must contain typical JD keywords
      expect(jd.jdText).toMatch(/MÔ TẢ CÔNG VIỆC|YÊU CẦU|QUYỀN LỢI/i);
      // Must not exceed the 3000 character input boundary
      expect(jd.jdText.length).toBeLessThanOrEqual(3000);
    });
  });

  describe('getSampleJd helper', () => {
    it('retrieves the correct sample by its exact ID', () => {
      const frontend = getSampleJd('frontend-react-fresher');
      expect(frontend).toBeDefined();
      expect(frontend?.roleTitle).toContain('Frontend React');
      expect(frontend?.badge).toContain('FinTech');

      const backend = getSampleJd('backend-golang-node');
      expect(backend).toBeDefined();
      expect(backend?.roleTitle).toContain('Backend Engineer');
      expect(backend?.companyOrIndustry).toContain('Logistics');

      const marketing = getSampleJd('marketing-growth-executive');
      expect(marketing).toBeDefined();
      expect(marketing?.roleTitle).toContain('Digital Marketing');
    });

    it('returns undefined for non-existent or empty IDs', () => {
      expect(getSampleJd('non-existent-id')).toBeUndefined();
      expect(getSampleJd('')).toBeUndefined();
      expect(getSampleJd('random_string')).toBeUndefined();
    });
  });
});
