import { describe, it, expect } from 'vitest';
import {
  interviewRoleSchema,
  questionIndexSchema,
  interviewQuestionRequestSchema,
  interviewQuestionDataSchema,
  interviewQuestionResponseSchema,
  rubricCriterionScoreSchema,
  interviewEvaluateRequestSchema,
  interviewEvaluateDataSchema,
} from '@/lib/schemas/interview';

describe('Milestone 3: Interview Zod Schemas Verification', () => {
  // -------------------------------------------------------------------------
  // 1. Role & Question Index Enum Boundaries
  // -------------------------------------------------------------------------
  describe('1. Role & Index Schemas', () => {
    it('accepts valid interview roles ("it", "marketing")', () => {
      expect(interviewRoleSchema.safeParse('it').success).toBe(true);
      expect(interviewRoleSchema.safeParse('marketing').success).toBe(true);
    });

    it('rejects invalid interview roles ("finance", "sales", "", 123)', () => {
      expect(interviewRoleSchema.safeParse('finance').success).toBe(false);
      expect(interviewRoleSchema.safeParse('sales').success).toBe(false);
      expect(interviewRoleSchema.safeParse('').success).toBe(false);
      expect(interviewRoleSchema.safeParse(123).success).toBe(false);
    });

    it('accepts valid question indices (1, 2, 3)', () => {
      expect(questionIndexSchema.safeParse(1).success).toBe(true);
      expect(questionIndexSchema.safeParse(2).success).toBe(true);
      expect(questionIndexSchema.safeParse(3).success).toBe(true);
    });

    it('rejects out-of-boundary question indices (0, 4, -1, 1.5, "1")', () => {
      expect(questionIndexSchema.safeParse(0).success).toBe(false);
      expect(questionIndexSchema.safeParse(4).success).toBe(false);
      expect(questionIndexSchema.safeParse(-1).success).toBe(false);
      expect(questionIndexSchema.safeParse(1.5).success).toBe(false);
      expect(questionIndexSchema.safeParse('1').success).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Question Request & Response Schemas
  // -------------------------------------------------------------------------
  describe('2. POST /api/interview/question Schemas', () => {
    it('accepts valid question request payload', () => {
      const validReq = { role: 'it', questionIndex: 1 };
      const parsed = interviewQuestionRequestSchema.safeParse(validReq);
      expect(parsed.success).toBe(true);
    });

    it('rejects question request with missing or invalid fields', () => {
      expect(
        interviewQuestionRequestSchema.safeParse({ role: 'it' }).success
      ).toBe(false);
      expect(
        interviewQuestionRequestSchema.safeParse({ questionIndex: 2 }).success
      ).toBe(false);
      expect(
        interviewQuestionRequestSchema.safeParse({
          role: 'hr',
          questionIndex: 1,
        }).success
      ).toBe(false);
    });

    it('validates question data schema and time limit boundaries (60s - 90s)', () => {
      const validData = {
        questionId: 'it-q1',
        role: 'it',
        questionIndex: 1,
        title: 'Bug nghiêm trọng sát giờ Release',
        scenario: '17:30 chiều thứ Sáu, phát hiện race condition thanh toán...',
        pressureContext:
          'PM giục deploy ngay, đe dọa phạt tiến độ 50 triệu...',
        timeLimitSeconds: 90,
      };
      expect(interviewQuestionDataSchema.safeParse(validData).success).toBe(
        true
      );

      // Boundary tests for timeLimitSeconds
      expect(
        interviewQuestionDataSchema.safeParse({
          ...validData,
          timeLimitSeconds: 60,
        }).success
      ).toBe(true);
      expect(
        interviewQuestionDataSchema.safeParse({
          ...validData,
          timeLimitSeconds: 75,
        }).success
      ).toBe(true);
      expect(
        interviewQuestionDataSchema.safeParse({
          ...validData,
          timeLimitSeconds: 59,
        }).success
      ).toBe(false);
      expect(
        interviewQuestionDataSchema.safeParse({
          ...validData,
          timeLimitSeconds: 91,
        }).success
      ).toBe(false);
      expect(
        interviewQuestionDataSchema.safeParse({
          ...validData,
          timeLimitSeconds: 75.5,
        }).success
      ).toBe(false);
    });

    it('validates full interviewQuestionResponseSchema wrapper', () => {
      const successResp = {
        success: true,
        data: {
          questionId: 'marketing-q1',
          role: 'marketing',
          questionIndex: 1,
          title: 'Khủng hoảng ngân sách',
          scenario: 'Tiêu 70% ngân sách...',
          pressureContext: 'Trưởng phòng ép mua lead ảo...',
          timeLimitSeconds: 90,
        },
      };
      expect(
        interviewQuestionResponseSchema.safeParse(successResp).success
      ).toBe(true);

      const errorResp = {
        success: false,
        error: 'Không tìm thấy câu hỏi tương ứng.',
      };
      expect(interviewQuestionResponseSchema.safeParse(errorResp).success).toBe(
        true
      );
    });
  });

  // -------------------------------------------------------------------------
  // 3. Rubric Evaluation & Score Schemas
  // -------------------------------------------------------------------------
  describe('3. Rubric Evaluation Schemas (4 Criteria & 1-10 Scores)', () => {
    const validRubricCriterion = {
      name: 'Cấu trúc STAR & Mạch lạc' as const,
      score: 8,
      feedback:
        'Ứng viên phân định rõ ràng giữa hành động kỹ thuật và kết quả.',
    };

    it('validates all 4 authorized rubric criteria names verbatim', () => {
      const allowedNames = [
        'Cấu trúc STAR & Mạch lạc',
        'Tính cụ thể & Dẫn chứng',
        'Mức độ liên quan & Đúng trọng tâm',
        'Nhận thức hệ quả & Tư duy xử lý',
      ] as const;

      for (const name of allowedNames) {
        const parsed = rubricCriterionScoreSchema.safeParse({
          ...validRubricCriterion,
          name,
        });
        expect(parsed.success).toBe(true);
      }
    });

    it('rejects unauthorized rubric criteria names', () => {
      const invalidNames = [
        'STAR',
        'Giao tiếp',
        'Kỹ năng mềm',
        'Thái độ',
        '',
      ];
      for (const name of invalidNames) {
        const parsed = rubricCriterionScoreSchema.safeParse({
          ...validRubricCriterion,
          name: name as any,
        });
        expect(parsed.success).toBe(false);
      }
    });

    it('enforces score boundaries [1, 10] for rubric criteria', () => {
      expect(
        rubricCriterionScoreSchema.safeParse({
          ...validRubricCriterion,
          score: 1,
        }).success
      ).toBe(true);
      expect(
        rubricCriterionScoreSchema.safeParse({
          ...validRubricCriterion,
          score: 10,
        }).success
      ).toBe(true);
      expect(
        rubricCriterionScoreSchema.safeParse({
          ...validRubricCriterion,
          score: 0,
        }).success
      ).toBe(false);
      expect(
        rubricCriterionScoreSchema.safeParse({
          ...validRubricCriterion,
          score: 11,
        }).success
      ).toBe(false);
      expect(
        rubricCriterionScoreSchema.safeParse({
          ...validRubricCriterion,
          score: -1,
        }).success
      ).toBe(false);
      expect(
        rubricCriterionScoreSchema.safeParse({
          ...validRubricCriterion,
          score: 7.5,
        }).success
      ).toBe(false);
      expect(
        rubricCriterionScoreSchema.safeParse({
          ...validRubricCriterion,
          score: '8' as any,
        }).success
      ).toBe(false);
    });

    it('rejects empty feedback string in rubric criterion', () => {
      expect(
        rubricCriterionScoreSchema.safeParse({
          ...validRubricCriterion,
          feedback: '',
        }).success
      ).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // 4. POST /api/interview/evaluate Request & Payload Schemas
  // -------------------------------------------------------------------------
  describe('4. POST /api/interview/evaluate Request & Payload Schemas', () => {
    const validEvaluateReq = {
      role: 'it' as const,
      questionId: 'it-q1',
      questionIndex: 1 as const,
      questionScenario: 'Bối cảnh lỗi thanh toán sát giờ release...',
      candidateAnswer: 'Tôi sẽ trao đổi ngay với PM để giải thích rủi ro...',
      timeSpentSeconds: 65,
    };

    it('accepts valid evaluation request payload', () => {
      const parsed = interviewEvaluateRequestSchema.safeParse(validEvaluateReq);
      expect(parsed.success).toBe(true);
    });

    it('accepts empty candidate answer for timeout and skip scenarios', () => {
      const emptyReq = { ...validEvaluateReq, candidateAnswer: '' };
      expect(interviewEvaluateRequestSchema.safeParse(emptyReq).success).toBe(
        true
      );
    });

    it('rejects negative timeSpentSeconds or non-numeric values', () => {
      expect(
        interviewEvaluateRequestSchema.safeParse({
          ...validEvaluateReq,
          timeSpentSeconds: -1,
        }).success
      ).toBe(false);
      expect(
        interviewEvaluateRequestSchema.safeParse({
          ...validEvaluateReq,
          timeSpentSeconds: '60' as any,
        }).success
      ).toBe(false);
    });

    it('validates interviewEvaluateDataSchema with exactly 4 rubric scores', () => {
      const validData = {
        questionIndex: 1 as const,
        rubricScores: [
          {
            name: 'Cấu trúc STAR & Mạch lạc' as const,
            score: 8,
            feedback: 'Mạch lạc',
          },
          {
            name: 'Tính cụ thể & Dẫn chứng' as const,
            score: 7,
            feedback: 'Có công cụ cụ thể',
          },
          {
            name: 'Mức độ liên quan & Đúng trọng tâm' as const,
            score: 8,
            feedback: 'Đúng trọng tâm',
          },
          {
            name: 'Nhận thức hệ quả & Tư duy xử lý' as const,
            score: 9,
            feedback: 'Nhận thức rủi ro tốt',
          },
        ],
        averageScore: 8.0,
        strengths: [
          'Bình tĩnh phân tích nguyên nhân kỹ thuật',
          'Giao tiếp rõ ràng với PM',
        ],
        improvements: ['Cần đề xuất phương án rollback cụ thể hơn'],
        followUpQuestion:
          'Nếu PM vẫn khăng khăng ép release, bạn sẽ làm gì tiếp theo?',
        simulatedPressureVerdict:
          'Thể hiện bản lĩnh kỹ thuật tốt dưới sức ép deadline.',
      };

      expect(interviewEvaluateDataSchema.safeParse(validData).success).toBe(
        true
      );

      // Rejects when rubricScores contains fewer than 4 or more than 4 items
      expect(
        interviewEvaluateDataSchema.safeParse({
          ...validData,
          rubricScores: validData.rubricScores.slice(0, 3),
        }).success
      ).toBe(false);

      expect(
        interviewEvaluateDataSchema.safeParse({
          ...validData,
          rubricScores: [...validData.rubricScores, validData.rubricScores[0]],
        }).success
      ).toBe(false);
    });
  });
});
