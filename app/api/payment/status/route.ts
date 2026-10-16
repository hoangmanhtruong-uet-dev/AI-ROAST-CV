import { NextRequest, NextResponse } from 'next/server';
import { checkOrderStatus } from '@/lib/payment/service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('orderId');

  if (!orderId) {
    return NextResponse.json(
      { success: false, error: 'Thiếu mã đơn hàng orderId' },
      { status: 400 }
    );
  }

  const order = checkOrderStatus(orderId);
  if (!order) {
    return NextResponse.json(
      { success: false, error: 'Không tìm thấy đơn hàng hoặc đơn đã hết hạn' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    orderId: order.orderId,
    status: order.status,
    licenseKey: order.licenseKey,
    paidAt: order.paidAt,
    expiresAt: order.expiresAt,
  });
}
