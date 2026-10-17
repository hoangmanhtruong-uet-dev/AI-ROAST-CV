import { Type } from '@google/genai';
import { getGeminiClient, isOfflineOrMockMode, getActiveGeminiModel } from './client';
import {
  INTERVIEW_EVALUATOR_SYSTEM_PROMPT,
  CUSTOM_JD_GENERATOR_SYSTEM_PROMPT,
  buildSanitizedInterviewPrompt,
  buildSanitizedCustomJdPrompt,
} from './interview-prompts';
import {
  getMockInterviewEvaluation,
  getMockCustomJdQuestions,
} from './interview-mock';
import {
  InterviewEvaluateData,
  InterviewEvaluateRequest,
  interviewEvaluateDataSchema,
  CustomJdGenerateRequest,
  CustomJdAnalysisResult,
  customJdAnalysisResultSchema,
} from '@/lib/schemas/interview';

export const geminiStandardInterviewEvaluateSchema = {
  type: Type.OBJECT,
  properties: {
    questionIndex: { type: Type.INTEGER },
    rubricScores: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            enum: [
              'Cấu trúc STAR & Mạch lạc',
              'Tính cụ thể & Dẫn chứng',
              'Mức độ liên quan & Đúng trọng tâm',
              'Nhận thức hệ quả & Tư duy xử lý',
            ],
          },
          score: { type: Type.INTEGER, description: 'Điểm số từ 1 đến 10' },
          feedback: {
            type: Type.STRING,
            description: 'Nhận xét cụ thể cho tiêu chí này',
          },
        },
        required: ['name', 'score', 'feedback'],
      },
    },
    averageScore: {
      type: Type.NUMBER,
      description: 'Điểm trung bình (1.0 - 10.0)',
    },
    strengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '1-3 điểm mạnh nhận thấy từ câu trả lời',
    },
    improvements: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '1-3 điểm cần cải thiện',
    },
    followUpQuestion: {
      type: Type.STRING,
      description: 'Câu hỏi xoáy sâu kiểm tra thêm độ chịu áp lực',
    },
    simulatedPressureVerdict: {
      type: Type.STRING,
      description: 'Phán quyết tổng kết áp lực mô phỏng',
    },
  },
  required: [
    'questionIndex',
    'rubricScores',
    'averageScore',
    'strengths',
    'improvements',
    'followUpQuestion',
    'simulatedPressureVerdict',
  ],
};

export const geminiCustomJdInterviewEvaluateSchema = {
  type: Type.OBJECT,
  properties: {
    questionIndex: { type: Type.INTEGER },
    rubricScores: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            enum: [
              'Cấu trúc STAR & Mạch lạc',
              'Tính cụ thể & Dẫn chứng',
              'Mức độ liên quan & Đúng trọng tâm',
              'Nhận thức hệ quả & Tư duy xử lý',
              'Độ phù hợp yêu cầu JD (Job Match Fit)',
            ],
          },
          score: { type: Type.INTEGER, description: 'Điểm số từ 1 đến 10' },
          feedback: {
            type: Type.STRING,
            description: 'Nhận xét cụ thể cho tiêu chí này',
          },
        },
        required: ['name', 'score', 'feedback'],
      },
    },
    averageScore: {
      type: Type.NUMBER,
      description: 'Điểm trung bình (1.0 - 10.0)',
    },
    strengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '1-3 điểm mạnh nhận thấy từ câu trả lời',
    },
    improvements: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '1-3 điểm cần cải thiện',
    },
    followUpQuestion: {
      type: Type.STRING,
      description: 'Câu hỏi xoáy sâu kiểm tra thêm độ chịu áp lực',
    },
    simulatedPressureVerdict: {
      type: Type.STRING,
      description: 'Phán quyết tổng kết áp lực mô phỏng',
    },
  },
  required: [
    'questionIndex',
    'rubricScores',
    'averageScore',
    'strengths',
    'improvements',
    'followUpQuestion',
    'simulatedPressureVerdict',
  ],
};

export const geminiInterviewEvaluateSchema = geminiStandardInterviewEvaluateSchema;

export const geminiCustomJdQuestionsSchema = {
  type: Type.OBJECT,
  properties: {
    jobTitle: {
      type: Type.STRING,
      description: 'Chức danh vị trí tuyển dụng trích xuất từ JD',
    },
    companyOrIndustry: {
      type: Type.STRING,
      description: 'Tên công ty hoặc ngành nghề đặc thù',
    },
    extractedSkills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Danh sách kỹ năng trọng tâm yêu cầu trong JD',
    },
    extractedCulture: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Đặc trưng văn hóa và môi trường làm việc',
    },
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          questionId: { type: Type.STRING },
          role: { type: Type.STRING, enum: ['custom'] },
          questionIndex: { type: Type.INTEGER },
          title: { type: Type.STRING },
          scenario: { type: Type.STRING },
          pressureContext: { type: Type.STRING },
          timeLimitSeconds: { type: Type.INTEGER },
        },
        required: [
          'questionId',
          'role',
          'questionIndex',
          'title',
          'scenario',
          'pressureContext',
          'timeLimitSeconds',
        ],
      },
    },
  },
  required: [
    'jobTitle',
    'companyOrIndustry',
    'extractedSkills',
    'extractedCulture',
    'questions',
  ],
};

export async function evaluateInterviewAnswer(
  params: InterviewEvaluateRequest
): Promise<InterviewEvaluateData> {
  const answer = params.candidateAnswer.trim();
  const isCustom = params.role === 'custom' || Boolean(params.customJd);

  // Edge cases: Empty answers, timeouts, or explicit skip tokens are handled deterministically
  if (
    answer === '' ||
    answer.includes('[Bỏ qua') ||
    answer.includes('[Hết giờ')
  ) {
    return getMockInterviewEvaluation(params);
  }

  // Offline mock fallback if explicitly configured
  if (isOfflineOrMockMode()) {
    return getMockInterviewEvaluation(params);
  }

  const ai = getGeminiClient();
  const prompt = buildSanitizedInterviewPrompt({
    role: params.role,
    questionIndex: params.questionIndex,
    questionScenario: params.questionScenario,
    candidateAnswer: params.candidateAnswer,
    timeSpentSeconds: params.timeSpentSeconds,
    customJd: params.customJd,
  });

  const response = await ai.models.generateContent({
    model: getActiveGeminiModel(),
    contents: prompt,
    config: {
      systemInstruction: INTERVIEW_EVALUATOR_SYSTEM_PROMPT,
      responseMimeType: 'application/json',
      responseSchema: isCustom
        ? geminiCustomJdInterviewEvaluateSchema
        : geminiStandardInterviewEvaluateSchema,
      temperature: 0.3,
    },
  });

  const rawJson = response.text;
  if (!rawJson) {
    throw new Error('Gemini không phản hồi dữ liệu chấm điểm phỏng vấn.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch (err) {
    throw new Error(
      `Dữ liệu JSON từ AI bị lỗi định dạng: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }

  const validated = interviewEvaluateDataSchema.parse(parsed);

  return validated;
}

export async function generateCustomJdQuestions(
  params: CustomJdGenerateRequest
): Promise<CustomJdAnalysisResult> {
  if (isOfflineOrMockMode()) {
    return getMockCustomJdQuestions(params);
  }

  const ai = getGeminiClient();
  const prompt = buildSanitizedCustomJdPrompt(params);

  const response = await ai.models.generateContent({
    model: getActiveGeminiModel(),
    contents: prompt,
    config: {
      systemInstruction: CUSTOM_JD_GENERATOR_SYSTEM_PROMPT,
      responseMimeType: 'application/json',
      responseSchema: geminiCustomJdQuestionsSchema,
      temperature: 0.4,
    },
  });

  const rawJson = response.text;
  if (!rawJson) {
    throw new Error('Gemini không phản hồi dữ liệu câu hỏi phỏng vấn theo JD.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch (err) {
    throw new Error(
      `Dữ liệu JSON câu hỏi JD từ AI bị lỗi định dạng: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }

  const validated = customJdAnalysisResultSchema.parse(parsed);

  return validated;
}
