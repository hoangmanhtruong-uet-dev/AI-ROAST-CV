import { NextRequest, NextResponse } from 'next/server';
import { createPaymentOrder, PRO_PACKAGE_PRICE } from '@/lib/payment/service';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    let customAmount = PRO_PACKAGE_PRICE;
    try {
      const body = await req.json();
      if (body && typeof body.amount === 'number' && body.amount > 0) {
        customAmount = body.amount;
      }
    } catch {
      // Body is optional
    }

    const order = createPaymentOrder(customAmount);

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    logger.error('Failed to create payment order', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Không thể tạo đơn thanh toán. Vui lòng thử lại sau ít phút.',
      },
      { status: 500 }
    );
  }
}
