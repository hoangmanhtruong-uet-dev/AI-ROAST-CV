import { NextRequest, NextResponse } from 'next/server';
import { processSePayWebhook } from '@/lib/payment/service';
import { SePayWebhookPayload } from '@/lib/payment/types';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as SePayWebhookPayload;
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || undefined;

    const result = processSePayWebhook(payload, authHeader);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      orderId: result.order?.orderId,
      status: result.order?.status,
    });
  } catch (error) {
    logger.error('SePay Webhook Processing Error', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error processing webhook' },
      { status: 500 }
    );
  }
}
