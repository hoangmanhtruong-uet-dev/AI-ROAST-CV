import { Type } from '@google/genai';

export const geminiRewriteResponseSchema = {
  type: Type.OBJECT,
  properties: {
    rewrittenText: {
      type: Type.STRING,
      description:
        'Câu CV hoàn chỉnh theo công thức Action Verb + Context + Result, BẮT BUỘC có placeholder [...] (ví dụ: [số liệu cụ thể]), TUYỆT ĐỐI không bịa đặt số liệu',
    },
    actionVerb: {
      type: Type.STRING,
      description: 'Động từ hành động mạnh mẽ thể hiện quyền làm chủ / sáng kiến (ví dụ: Chủ trì, Tối ưu hóa, Thiết kế)',
    },
    actionVerbCategory: {
      type: Type.STRING,
      enum: ['Lãnh đạo / Chủ trì', 'Phát triển / Kỹ thuật', 'Tối ưu / Cải tiến', 'Phân tích / Đánh giá'],
      description: 'Phân loại danh mục động từ hành động chuẩn ATS',
    },
    context: {
      type: Type.STRING,
      description: 'Bối cảnh dự án, công nghệ, hoặc vấn đề kỹ thuật / kinh doanh được giải quyết',
    },
    result: {
      type: Type.STRING,
      description: 'Kết quả định lượng có thể đo lường được (chứa placeholder [...], ví dụ: giúp tăng [X%] hiệu năng)',
    },
    explanation: {
      type: Type.STRING,
      description: 'Giải thích ngắn gọn lý do vì sao cách viết này giúp vượt qua bộ lọc ATS và gây ấn tượng với nhà tuyển dụng',
    },
    atsKeywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Các từ khóa kỹ thuật hoặc chuyên môn quan trọng được tích hợp để tối ưu hóa quét ATS',
    },
  },
  required: ['rewrittenText', 'actionVerb', 'context', 'result', 'explanation', 'atsKeywords'],
};
