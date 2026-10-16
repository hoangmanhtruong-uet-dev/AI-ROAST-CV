import { describe, it, expect } from 'vitest';
import {
  interviewRoleSchema,
  customJdGenerateRequestSchema,
  customJdAnalysisResultSchema,
  rubricCriterionNameSchema,
  interviewEvaluateDataSchema,
  interviewEvaluateRequestSchema,
  RUBRIC_CRITERIA_NAMES,
  JOB_MATCH_FIT_CRITERION_NAME,
  ALL_RUBRIC_CRITERIA_NAMES,
} from '@/lib/schemas/interview';

describe('Milestone 8: Custom JD Schemas & 5-Criteria Rubric Verification', () => {
  describe('1. interviewRoleSchema extension', () => {
    it('accepts "custom" in addition to "it" and "marketing"', () => {
      expect(interviewRoleSchema.safeParse('it').success).toBe(true);
      expect(interviewRoleSchema.safeParse('marketing').success).toBe(true);
      expect(interviewRoleSchema.safeParse('custom').success).toBe(true);
    });

    it('rejects unauthorized roles', () => {
      expect(interviewRoleSchema.safeParse('finance').success).toBe(false);
      expect(interviewRoleSchema.safeParse('hr').success).toBe(false);
      expect(interviewRoleSchema.safeParse('').success).toBe(false);
      expect(interviewRoleSchema.safeParse(null).success).toBe(false);
    });
  });

  describe('2. customJdGenerateRequestSchema boundary validation', () => {
    it('accepts valid JD between 50 and 10,000 characters', () => {
      const validText = 'A'.repeat(50);
      const parsed = customJdGenerateRequestSchema.safeParse({
        jdText: validText,
      });
      expect(parsed.success).toBe(true);

      const maxText = 'B'.repeat(10000);
      const parsedMax = customJdGenerateRequestSchema.safeParse({
        jdText: maxText,
        targetRole: 'Senior React Developer',
        company: 'FinTech Corp',
      });
      expect(parsedMax.success).toBe(true);
    });

    it('rejects JD text under 50 characters', () => {
      const shortText = 'Cần tuyển lập trình viên React kinh nghiệm 1 năm';
      expect(shortText.length).toBeLessThan(50);

      const parsed = customJdGenerateRequestSchema.safeParse({
        jdText: shortText,
      });
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.errors[0]?.message).toMatch(/tối thiểu 50 ký tự/i);
      }
    });

    it('rejects JD text exceeding 10,000 characters', () => {
      const hugeText = 'X'.repeat(10001);
      const parsed = customJdGenerateRequestSchema.safeParse({
        jdText: hugeText,
      });
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.errors[0]?.message).toMatch(/10\.000 ký tự/i);
      }
    });

    it('enforces targetRole and company character limits (max 100)', () => {
      const validText = 'D'.repeat(60);
      expect(
        customJdGenerateRequestSchema.safeParse({
          jdText: validText,
          targetRole: 'R'.repeat(101),
        }).success
      ).toBe(false);

      expect(
        customJdGenerateRequestSchema.safeParse({
          jdText: validText,
          company: 'C'.repeat(101),
        }).success
      ).toBe(false);
    });
  });

  describe('3. customJdAnalysisResultSchema validation', () => {
    const validQuestions = [
      {
        questionId: 'custom-q1',
        role: 'custom' as const,
        questionIndex: 1 as const,
        title: 'Release Bug',
        scenario: 'Scenario 1...',
        pressureContext: 'Deadline pressure...',
        timeLimitSeconds: 90,
      },
      {
        questionId: 'custom-q2',
        role: 'custom' as const,
        questionIndex: 2 as const,
        title: 'Senior Conflict',
        scenario: 'Scenario 2...',
        pressureContext: 'Evaluation pressure...',
        timeLimitSeconds: 75,
      },
      {
        questionId: 'custom-q3',
        role: 'custom' as const,
        questionIndex: 3 as const,
        title: 'Data Crisis',
        scenario: 'Scenario 3...',
        pressureContext: 'Ethical dilemma...',
        timeLimitSeconds: 60,
      },
    ];

    it('accepts valid custom JD analysis result with 3 questions', () => {
      const parsed = customJdAnalysisResultSchema.safeParse({
        jobTitle: 'Frontend React Developer',
        companyOrIndustry: 'FinTech Startup',
        extractedSkills: ['React', 'TypeScript', 'Tailwind CSS'],
        extractedCulture: ['Agile nhịp độ nhanh', 'Trách nhiệm cao'],
        questions: validQuestions,
      });
      expect(parsed.success).toBe(true);
    });

    it('rejects when questions count is not exactly 3', () => {
      expect(
        customJdAnalysisResultSchema.safeParse({
          jobTitle: 'Frontend React Developer',
          companyOrIndustry: 'FinTech Startup',
          extractedSkills: ['React'],
          extractedCulture: ['Agile'],
          questions: validQuestions.slice(0, 2),
        }).success
      ).toBe(false);

      expect(
        customJdAnalysisResultSchema.safeParse({
          jobTitle: 'Frontend React Developer',
          companyOrIndustry: 'FinTech Startup',
          extractedSkills: ['React'],
          extractedCulture: ['Agile'],
          questions: [...validQuestions, validQuestions[0]],
        }).success
      ).toBe(false);
    });
  });

  describe('4. Rubric Criterion Names & Job Match Fit schema', () => {
    it('verifies ALL_RUBRIC_CRITERIA_NAMES contains 5 criteria', () => {
      expect(ALL_RUBRIC_CRITERIA_NAMES.length).toBe(5);
      expect(ALL_RUBRIC_CRITERIA_NAMES).toContain(JOB_MATCH_FIT_CRITERION_NAME);
      expect(RUBRIC_CRITERIA_NAMES.length).toBe(4);
    });

    it('accepts JOB_MATCH_FIT_CRITERION_NAME verbatim', () => {
      expect(
        rubricCriterionNameSchema.safeParse(JOB_MATCH_FIT_CRITERION_NAME).success
      ).toBe(true);
    });
  });

  describe('5. interviewEvaluateDataSchema: 4 criteria vs 5 criteria', () => {
    const base4Scores = [
      {
        name: 'Cấu trúc STAR & Mạch lạc' as const,
        score: 8,
        feedback: 'Mạch lạc tốt',
      },
      {
        name: 'Tính cụ thể & Dẫn chứng' as const,
        score: 7,
        feedback: 'Dẫn chứng cụ thể',
      },
      {
        name: 'Mức độ liên quan & Đúng trọng tâm' as const,
        score: 8,
        feedback: 'Đúng trọng tâm',
      },
      {
        name: 'Nhận thức hệ quả & Tư duy xử lý' as const,
        score: 9,
        feedback: 'Tư duy xử lý tốt',
      },
    ];

    const basePayload = {
      questionIndex: 1 as const,
      averageScore: 8.0,
      strengths: ['Tư duy tốt'],
      improvements: ['Cần thực hành thêm'],
      followUpQuestion: 'Bạn xử lý thế nào?',
      simulatedPressureVerdict: 'Bản lĩnh vững vàng.',
    };

    it('accepts exactly 4 standard criteria (backward compatibility)', () => {
      const parsed = interviewEvaluateDataSchema.safeParse({
        ...basePayload,
        rubricScores: base4Scores,
      });
      expect(parsed.success).toBe(true);
    });

    it('accepts exactly 5 criteria including Job Match Fit for custom JD', () => {
      const scores5 = [
        ...base4Scores,
        {
          name: JOB_MATCH_FIT_CRITERION_NAME,
          score: 9,
          feedback: 'Khớp sát yêu cầu JD',
        },
      ];

      const parsed = interviewEvaluateDataSchema.safeParse({
        ...basePayload,
        rubricScores: scores5,
        averageScore: 8.2,
      });
      expect(parsed.success).toBe(true);
    });

    it('rejects duplicate criteria names even if length is 5', () => {
      const duplicateScores = [...base4Scores, base4Scores[0]];
      const parsed = interviewEvaluateDataSchema.safeParse({
        ...basePayload,
        rubricScores: duplicateScores,
      });
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.errors[0]?.message).toMatch(/không được trùng lặp/i);
      }
    });

    it('rejects 3 criteria or 6 criteria', () => {
      expect(
        interviewEvaluateDataSchema.safeParse({
          ...basePayload,
          rubricScores: base4Scores.slice(0, 3),
        }).success
      ).toBe(false);

      const scores6 = [
        ...base4Scores,
        {
          name: JOB_MATCH_FIT_CRITERION_NAME,
          score: 8,
          feedback: 'Fit',
        },
        {
          name: 'Cấu trúc STAR & Mạch lạc' as const,
          score: 8,
          feedback: 'Dup',
        },
      ];
      expect(
        interviewEvaluateDataSchema.safeParse({
          ...basePayload,
          rubricScores: scores6,
        }).success
      ).toBe(false);
    });
  });

  describe('6. interviewEvaluateRequestSchema with customJd', () => {
    it('accepts customJd up to 10,000 characters', () => {
      const parsed = interviewEvaluateRequestSchema.safeParse({
        role: 'custom',
        questionId: 'custom-q1',
        questionIndex: 1,
        questionScenario: 'Scenario',
        candidateAnswer: 'Answer',
        timeSpentSeconds: 45,
        customJd: 'JD Content '.repeat(10),
      });
      expect(parsed.success).toBe(true);
    });

    it('rejects customJd exceeding 10,000 characters', () => {
      const parsed = interviewEvaluateRequestSchema.safeParse({
        role: 'custom',
        questionId: 'custom-q1',
        questionIndex: 1,
        questionScenario: 'Scenario',
        candidateAnswer: 'Answer',
        timeSpentSeconds: 45,
        customJd: 'J'.repeat(10001),
      });
      expect(parsed.success).toBe(false);
    });
  });
});
