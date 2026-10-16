import { NextResponse } from 'next/server';
import {
  interviewQuestionRequestSchema,
  InterviewQuestionResponse,
} from '@/lib/schemas/interview';
import { getInterviewQuestion } from '@/lib/data/interview-questions';
import { logger } from '@/lib/logger';

export async function POST(
  req: Request
): Promise<NextResponse<InterviewQuestionResponse>> {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Yêu cầu không chứa dữ liệu JSON hợp lệ.' },
        { status: 400 }
      );
    }

    const parseResult = interviewQuestionRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError =
        parseResult.error.errors[0]?.message || 'Dữ liệu không hợp lệ.';
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      );
    }

    const { role, questionIndex } = parseResult.data;
    const question = getInterviewQuestion(role, questionIndex);
    if (!question) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy câu hỏi tương ứng.' },
        { status: 404 }
      );
    }

    // Zero-PII safe logging
    logger.info('Interview Question API: Question retrieved', {
      role,
      questionIndex,
      questionId: question.questionId,
    });

    return NextResponse.json({
      success: true,
      data: question,
    });
  } catch (error) {
    logger.error('Interview Question API: Unexpected error', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Đã xảy ra lỗi máy chủ khi lấy câu hỏi phỏng vấn.',
      },
      { status: 500 }
    );
  }
}
