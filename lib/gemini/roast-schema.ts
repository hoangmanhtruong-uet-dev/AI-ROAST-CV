import { Type } from '@google/genai';

/**
 * Gemini GenAI Schema for Targeted Job Description (JD) Match Analysis.
 * Implements Milestone 1 (Targeted JD Match & ATS Keyword Gap Analyzer).
 */
export const geminiJdMatchSchema = {
  type: Type.OBJECT,
  description:
    'Kết quả phân tích tương thích CV x JD (chỉ sinh khi có thông tin target_job_description)',
  properties: {
    matchScore: {
      type: Type.INTEGER,
      description: 'Điểm phần trăm tương thích tổng thể giữa CV và JD từ 0 đến 100',
    },
    breakdown: {
      type: Type.OBJECT,
      description: 'Điểm chi tiết từng khía cạnh tương thích từ 0 đến 100',
      properties: {
        hardSkillsMatch: {
          type: Type.INTEGER,
          description: 'Mức độ đáp ứng kỹ năng cứng và công nghệ từ 0 đến 100',
        },
        experienceMatch: {
          type: Type.INTEGER,
          description: 'Mức độ đáp ứng kinh nghiệm dự án và thực chiến từ 0 đến 100',
        },
        cultureMatch: {
          type: Type.INTEGER,
          description: 'Mức độ phù hợp với văn hóa và môi trường làm việc từ 0 đến 100',
        },
      },
      required: ['hardSkillsMatch', 'experienceMatch', 'cultureMatch'],
    },
    missingKeywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        'Danh sách các từ khóa công nghệ, kỹ năng cứng, chứng chỉ có trong JD nhưng CV hoàn toàn thiếu hoặc thể hiện quá mờ nhạt',
    },
    tailoredRecommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        'Danh sách gợi ý cách bổ sung dự án hoặc viết lại câu để đưa từ khóa còn thiếu vào CV chuẩn ATS (tuân thủ placeholder [...], tuyệt đối không bịa đặt số liệu)',
    },
  },
  required: ['matchScore', 'breakdown', 'missingKeywords', 'tailoredRecommendations'],
};

export const geminiJdMatchProperty = geminiJdMatchSchema;

export const geminiRoastResponseSchema = {
  type: Type.OBJECT,
  properties: {
    overallScore: {
      type: Type.INTEGER,
      description: 'Tổng điểm đánh giá CV từ 0 đến 100',
    },
    roastScore: {
      type: Type.INTEGER,
      description: 'Điểm đánh giá CV từ 0 đến 100 (đồng nghĩa overallScore)',
    },
    survivalScore: {
      type: Type.INTEGER,
      description: 'Điểm sinh tồn CV từ 0 đến 100 (tỷ lệ sống sót qua vòng lọc sơ tuyển HR)',
    },
    funnyTitle: {
      type: Type.STRING,
      description: 'Danh hiệu hài hước sắc sảo (ví dụ: "Chiến thần rải CV", "Fresher hệ tâm linh", "Kẻ hủy diệt vòng gửi xe", "Hiệp sĩ fix bug gánh team", "Chúa tể sáo rỗng")',
    },
    tone: {
      type: Type.STRING,
      enum: ['spicy', 'constructive'],
      description: 'Giọng điệu phân tích',
    },
    summaryVerdict: {
      type: Type.STRING,
      description: 'Nhận xét tổng quan sắc sảo (2-3 câu)',
    },
    verdict: {
      type: Type.STRING,
      description: 'Phán quyết tổng quan (2-3 câu, đồng nghĩa summaryVerdict)',
    },
    topStrengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Danh sách 2-4 điểm mạnh thực sự của CV',
    },
    weaknesses: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          quote: { type: Type.STRING, description: 'Trích đoạn chính xác từ CV cần sửa' },
          issue: { type: Type.STRING, description: 'Vấn đề phát hiện (sáo rỗng, thiếu dẫn chứng, mâu thuẫn)' },
          severity: { type: Type.STRING, enum: ['Cao', 'Trung bình', 'Thấp'] },
          rejectionReason: { type: Type.STRING, description: 'Lý do nhà tuyển dụng từ chối khi đọc đoạn này' },
          rejectReason: { type: Type.STRING, description: 'Lý do từ chối (đồng nghĩa rejectionReason)' },
          fixGuideline: {
            type: Type.STRING,
            description: 'Hướng dẫn viết lại BẮT BUỘC có placeholder [...] (ví dụ: [X]%, [A]ms → [B]ms, [số liệu cụ thể], [tên công nghệ]), TUYỆT ĐỐI không bịa đặt số liệu',
          },
        },
        required: ['quote', 'issue', 'severity', 'rejectionReason', 'fixGuideline'],
      },
      description: 'Danh sách từ 3 đến 5 điểm yếu chí mạng, xếp theo mức độ nghiêm trọng giảm dần',
    },
    atsRecommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING, enum: ['Cấu trúc', 'Từ khóa', 'Định dạng', 'Độ dài'] },
          recommendation: { type: Type.STRING, description: 'Lời khuyên cụ thể để tối ưu hóa quét ATS' },
          impact: { type: Type.STRING, enum: ['Quan trọng', 'Nên làm'] },
        },
        required: ['category', 'recommendation', 'impact'],
      },
      description: 'Khuyến nghị tối ưu hóa bộ lọc ATS (cấu trúc, từ khóa, định dạng, độ dài)',
    },
    jdMatch: geminiJdMatchSchema,
    interviewQuestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          questionId: { type: Type.STRING, description: 'ID duy nhất cho câu hỏi, ví dụ cv-q1, cv-q2, cv-q3 hoặc jd-q1, jd-q2, jd-q3' },
          role: { type: Type.STRING, enum: ['custom'] },
          questionIndex: { type: Type.INTEGER, description: 'Thứ tự câu hỏi (1, 2, hoặc 3)' },
          title: { type: Type.STRING, description: 'Tiêu đề ngắn gọn cho tình huống áp lực' },
          scenario: { type: Type.STRING, description: 'Tình huống phỏng vấn áp lực bắt nguồn trực tiếp từ công nghệ, dự án trong CV hoặc khoảng cách kỹ năng giữa CV và JD' },
          pressureContext: { type: Type.STRING, description: 'Bối cảnh dồn ép nghẹt thở từ sếp, khách hàng hoặc deadline' },
          timeLimitSeconds: { type: Type.INTEGER, enum: [90, 75, 60], description: 'Thời gian đếm ngược: 90s cho Q1, 75s cho Q2, 60s cho Q3' },
        },
        required: ['questionId', 'role', 'questionIndex', 'title', 'scenario', 'pressureContext', 'timeLimitSeconds'],
      },
      description: 'Bộ đúng 3 câu hỏi phỏng vấn áp lực leo thang (90s -> 75s -> 60s) cá nhân hóa theo các điểm yếu trong CV hoặc xoáy trực diện 100% vào khoảng cách giữa CV và JD',
    },
    disclaimer: {
      type: Type.STRING,
      description: 'Đánh giá AI chỉ mang tính tham khảo luyện tập, không cam kết việc làm hay đỗ ATS.',
    },
  },
  required: [
    'overallScore',
    'survivalScore',
    'funnyTitle',
    'tone',
    'summaryVerdict',
    'topStrengths',
    'weaknesses',
    'atsRecommendations',
    'interviewQuestions',
    'disclaimer',
  ],
};

export const geminiUnifiedRoastResponseSchema = geminiRoastResponseSchema;
