import { NextRequest, NextResponse } from 'next/server';
import { ATSRoastRequestSchema, ATSRoastResponse, ATSRoastResponseSchema } from '@/lib/schemas/ats-diff';
import { getGeminiClient, isOfflineOrMockMode, getActiveGeminiModel } from '@/lib/gemini/client';
import { logger } from '@/lib/logger';

export const runtime = 'edge';

const SYSTEM_PROMPT = `Bạn là Core ATS Architect & Senior Tech Recruiter cực kỳ khắt khe nhưng hài hước của nền tảng "AI ROAST CV".
Nhiệm vụ của bạn là phân tích danh sách các gạch đầu dòng (bullets) từ CV (đã được ẩn danh PII bằng các token như [PII_NAME_1], [PII_EMAIL_1], [PII_PHONE_1]...) đối chiếu với Job Description (JD).

QUY TẮC BẮT BUỘC:
1. BẢO MẬT PII: Giữ nguyên vẹn mọi token dạng [PII_...] nếu chúng xuất hiện trong câu gốc. Tuyệt đối không xóa hoặc biến đổi cấu trúc token này.
2. CHẤM ĐIỂM ATS (atsMetrics):
   - beforeScore: Điểm khớp ATS hiện tại (0-100) dựa trên mật độ từ khóa, ngữ cảnh kỹ năng và tính định lượng.
   - afterScore: Điểm ATS dự kiến (0-100) sau khi người dùng áp dụng toàn bộ các bản vá (patches) của bạn.
   - knockoutFlags: Liệt kê các lỗi chí mạng khiến hệ thống ATS hoặc HR loại ngay lập tức (VD: câu văn thụ động "Tham gia vào...", thiếu số liệu đo lường kết quả, thiếu kỹ năng cốt lõi bắt buộc trong JD).
   - missingKeywords: Các từ khóa quan trọng trong JD mà CV đang thiếu hoặc dùng sai thuật ngữ (phân loại category: hard_skill, tool, domain, soft_skill).
3. ROAST & VIẾT LẠI TỪNG DÒNG (patches):
   - bulletId: Giữ nguyên bulletId tương ứng của câu.
   - roastComment: Chê bai sâu cay, hài hước, đúng trọng tâm lý do vì sao câu gốc yếu kém dưới góc nhìn nhà tuyển dụng.
   - suggestedText: Viết lại câu đó theo đúng công thức Google XYZ ("Đạt được [X] được đo lường bằng [Y], thông qua việc triển khai [Z]") hoặc STAR. Tích hợp tự nhiên các từ khóa còn thiếu từ JD vào câu.
   - KHÔNG BỊA SỐ LIỆU ẢO: Nếu câu gốc thiếu con số đo lường, hãy dùng placeholder rõ ràng trong ngoặc vuông như [X%], [Y ms], [Z người dùng] để ứng viên tự điền số thật.
   - addedKeywords: Mảng chứa các từ khóa ATS đã được bạn chèn thêm vào câu suggestedText.
   - impactLevel: Đánh giá mức độ cải thiện của câu này ('high' | 'medium' | 'low').

Chỉ trả về DUY NHẤT một chuỗi JSON hợp lệ khớp với cấu trúc sau, không kèm bất kỳ lời giải thích hay markdown codeblock nào:
{
  "atsMetrics": {
    "beforeScore": number,
    "afterScore": number,
    "knockoutFlags": string[],
    "missingKeywords": [
      { "keyword": string, "importance": "critical" | "recommended", "category": "hard_skill" | "tool" | "domain" | "soft_skill" }
    ]
  },
  "patches": [
    {
      "bulletId": string,
      "roastComment": string,
      "suggestedText": string,
      "addedKeywords": string[],
      "impactLevel": "high" | "medium" | "low"
    }
  ]
}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Yêu cầu không chứa dữ liệu JSON hợp lệ.' }, { status: 400 });
    }

    const parseResult = ATSRoastRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || 'Dữ liệu không hợp lệ.';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { jobDescription, cvBullets } = parseResult.data;

    // Chế độ Offline / Mock Fallback
    if (isOfflineOrMockMode()) {
      const mockResult: ATSRoastResponse = {
        atsMetrics: {
          beforeScore: 48,
          afterScore: 89,
          knockoutFlags: [
            'Câu văn mô tả dạng kể lể, thiếu chỉ số đo lường ROI/kết quả thực tế.',
            'Thiếu từ khóa then chốt về tối ưu hiệu năng và kiến trúc hệ thống.',
          ],
          missingKeywords: [
            { keyword: 'Next.js App Router', importance: 'critical', category: 'hard_skill' },
            { keyword: 'Web Worker & Concurrency', importance: 'recommended', category: 'hard_skill' },
            { keyword: 'Zero-Retention Security', importance: 'critical', category: 'domain' },
            { keyword: 'Tailwind CSS', importance: 'recommended', category: 'tool' },
          ],
        },
        patches: cvBullets.map((b, idx) => ({
          bulletId: b.bulletId,
          roastComment: `Câu này viết như nhật ký thực tập sinh! HR đọc lướt 3 giây là quăng sọt rác vì không có số liệu đo lường cụ thể.`,
          suggestedText: `Triển khai tối ưu hóa kiến trúc, gia tăng tốc độ phản hồi thêm [X%] và giảm [Y%] chi phí hạ tầng thông qua việc áp dụng chuẩn công nghệ hiện đại.`,
          addedKeywords: ['Tối ưu hóa', 'Kiến trúc hệ thống'],
          impactLevel: idx === 0 ? 'high' : 'medium',
        })),
      };

      return NextResponse.json(mockResult, {
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      });
    }

    const client = getGeminiClient();
    const userPrompt = JSON.stringify({
      jobDescription,
      candidateBullets: cvBullets,
    });

    const response = await client.models.generateContent({
      model: getActiveGeminiModel(),
      contents: [
        { role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\nDữ liệu đầu vào:\n${userPrompt}` }] },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '{}';
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawText);
    } catch {
      const cleaned = rawText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
      parsedJson = JSON.parse(cleaned);
    }

    const validatedResponse = ATSRoastResponseSchema.safeParse(parsedJson);
    if (!validatedResponse.success) {
      logger.warn('ATS Roast: LLM response schema mismatch, falling back to basic patch structure');
      return NextResponse.json(
        { error: 'Phản hồi từ AI không khớp schema định dạng.' },
        { status: 502 }
      );
    }

    return NextResponse.json(validatedResponse.data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    logger.error('ATS Roast API Exception', { error: String(error) });
    return NextResponse.json({ error: 'Đã có lỗi xảy ra trong quá trình phân tích ATS.' }, { status: 500 });
  }
}
