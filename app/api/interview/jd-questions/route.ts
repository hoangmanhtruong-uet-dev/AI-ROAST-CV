import { NextResponse } from 'next/server';
import {
  customJdGenerateRequestSchema,
  CustomJdGenerateResponse,
} from '@/lib/schemas/interview';
import { generateCustomJdQuestions } from '@/lib/gemini/interview';
import { logger } from '@/lib/logger';

export async function POST(
  req: Request
): Promise<NextResponse<CustomJdGenerateResponse>> {
  const startTime = Date.now();

  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Yêu cầu không chứa dữ liệu JSON hợp lệ.' },
        { status: 400 }
      );
    }

    const parseResult = customJdGenerateRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError =
        parseResult.error.errors[0]?.message || 'Dữ liệu JD không hợp lệ.';
      logger.warn('Custom JD Questions API: Validation failed', {
        validationError: firstError,
      });
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      );
    }

    const { jdText, targetRole, company } = parseResult.data;

    // ZERO-PII LOGGING: Log metadata ONLY. NEVER log raw jdText.
    logger.info('Custom JD Questions API: Generating situational questions', {
      jdLength: jdText.length,
      targetRole: targetRole || 'unspecified',
      company: company || 'unspecified',
    });

    let questionsResult;
    try {
      questionsResult = await generateCustomJdQuestions({
        jdText,
        targetRole,
        company,
      });
    } catch (engineError) {
      logger.error(
        'Custom JD Questions API: Generation engine error',
        engineError
      );
      return NextResponse.json(
        {
          success: false,
          error:
            'Hệ thống AI không thể hoàn thành tạo câu hỏi từ JD. Vui lòng thử lại với nội dung JD chi tiết hơn.',
        },
        { status: 502 }
      );
    }

    logger.info('Custom JD Questions API: Questions generation completed', {
      jobTitle: questionsResult.jobTitle,
      skillsCount: questionsResult.extractedSkills.length,
      questionsCount: questionsResult.questions.length,
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      data: questionsResult,
    });
  } catch (error) {
    logger.error('Custom JD Questions API: Fatal server error', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Đã xảy ra lỗi máy chủ trong quá trình phân tích JD.',
      },
      { status: 500 }
    );
  }
}
