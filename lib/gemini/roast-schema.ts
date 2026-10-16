import { Type } from '@google/genai';

export const geminiRoastResponseSchema = {
  type: Type.OBJECT,
  properties: {
    overallScore: {
      type: Type.INTEGER,
      description: 'Tổng điểm đánh giá CV từ 0 đến 100',
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
          fixGuideline: {
            type: Type.STRING,
            description: 'Hướng dẫn viết lại BẮT BUỘC có placeholder [...] (ví dụ: [số liệu cụ thể]), TUYỆT ĐỐI không bịa đặt số liệu',
          },
        },
        required: ['quote', 'issue', 'severity', 'rejectionReason', 'fixGuideline'],
      },
      description: 'Danh sách các điểm yếu cần khắc phục, xếp theo độ nghiêm trọng giảm dần',
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
    },
    disclaimer: {
      type: Type.STRING,
      description: 'Đánh giá AI chỉ mang tính tham khảo luyện tập, không cam kết việc làm hay đỗ ATS.',
    },
  },
  required: [
    'overallScore',
    'tone',
    'summaryVerdict',
    'topStrengths',
    'weaknesses',
    'atsRecommendations',
    'disclaimer',
  ],
};
