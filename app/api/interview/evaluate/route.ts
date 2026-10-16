import { NextResponse } from 'next/server';
import {
  interviewEvaluateRequestSchema,
  InterviewEvaluateResponse,
} from '@/lib/schemas/interview';
import { evaluateInterviewAnswer } from '@/lib/gemini/interview';
import { logger } from '@/lib/logger';

export async function POST(
  req: Request
): Promise<NextResponse<InterviewEvaluateResponse>> {
  const startTime = Date.now();

  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Yêu cầu không chứa dữ liệu JSON hợp lệ.' },
        { status: 400 }
      );
    }

    const parseResult = interviewEvaluateRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError =
        parseResult.error.errors[0]?.message || 'Dữ liệu không hợp lệ.';
      logger.warn('Interview Evaluate API: Validation failed', {
        validationError: firstError,
      });
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      );
    }

    const {
      role,
      questionId,
      questionIndex,
      questionScenario,
      candidateAnswer,
      timeSpentSeconds,
      customJd,
    } = parseResult.data;

    // ZERO-PII LOGGING: strictly log metadata, NEVER log candidateAnswer or customJd
    logger.info('Interview Evaluate API: Evaluating answer', {
      role,
      questionId,
      questionIndex,
      answerLength: candidateAnswer.length,
      timeSpentSeconds,
      hasCustomJd: Boolean(customJd),
      jdLength: customJd ? customJd.length : undefined,
    });

    let evaluationResult;
    try {
      evaluationResult = await evaluateInterviewAnswer({
        role,
        questionId,
        questionIndex,
        questionScenario,
        candidateAnswer,
        timeSpentSeconds,
        customJd,
      });
    } catch (evalError) {
      logger.error('Interview Evaluate API: Evaluation engine error', evalError);
      return NextResponse.json(
        {
          success: false,
          error:
            'Hệ thống AI không thể hoàn thành đánh giá câu trả lời. Vui lòng thử lại.',
        },
        { status: 502 }
      );
    }

    logger.info('Interview Evaluate API: Evaluation completed', {
      role,
      questionIndex,
      averageScore: evaluationResult.averageScore,
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      data: evaluationResult,
    });
  } catch (error) {
    logger.error('Interview Evaluate API: Fatal server error', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Đã xảy ra lỗi máy chủ trong quá trình chấm điểm.',
      },
      { status: 500 }
    );
  }
}
