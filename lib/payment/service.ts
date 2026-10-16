import { BankTransferInfo, PaymentOrder, SePayWebhookPayload } from './types';
import { logger } from '@/lib/logger';

// Default configuration for VietQR & SePay (can be overridden via environment variables)
const DEFAULT_BANK_ID = process.env.VIETQR_BANK_ID || 'MB';
const DEFAULT_BANK_NAME = process.env.VIETQR_BANK_NAME || 'MBBank - Ngân hàng Quân Đội';
const DEFAULT_ACCOUNT_NO = process.env.VIETQR_ACCOUNT_NO || '0988668899';
const DEFAULT_ACCOUNT_NAME = process.env.VIETQR_ACCOUNT_NAME || 'AI ROAST CV TEAM';
export const PRO_PACKAGE_PRICE = 29000;
export const ORDER_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

// In-memory order and license storage
class PaymentStore {
  private orders: Map<string, PaymentOrder> = new Map();
  private validLicenseKeys: Set<string> = new Set();

  constructor() {
    // Seed an initial demo key for verification & sandbox testing
    this.validLicenseKeys.add('PRO-DEMO-2026-VIP');
  }

  setOrder(order: PaymentOrder): void {
    this.orders.set(order.orderId, order);
    if (order.licenseKey) {
      this.validLicenseKeys.add(order.licenseKey);
    }
  }

  getOrder(orderId: string): PaymentOrder | undefined {
    return this.orders.get(orderId);
  }

  findOrderByContent(content: string): PaymentOrder | undefined {
    const normalizedContent = content.toUpperCase().replace(/\s+/g, '');
    for (const order of this.orders.values()) {
      const normalizedOrderId = order.orderId.toUpperCase().replace(/\s+/g, '');
      if (normalizedContent.includes(normalizedOrderId)) {
        return order;
      }
    }
    return undefined;
  }

  addLicenseKey(key: string): void {
    this.validLicenseKeys.add(key.toUpperCase().trim());
  }

  isLicenseKeyValid(key: string): boolean {
    const normalized = key.toUpperCase().trim();
    if (this.validLicenseKeys.has(normalized)) return true;

    // Format validation: PRO-XXXX-YYYY (where XXXX, YYYY are alphanumeric)
    const regex = /^PRO-[A-Z0-9]{4,8}-[A-Z0-9]{4,8}$/i;
    return regex.test(normalized);
  }

  getAllOrders(): PaymentOrder[] {
    return Array.from(this.orders.values());
  }

  clear(): void {
    this.orders.clear();
    this.validLicenseKeys.clear();
    this.validLicenseKeys.add('PRO-DEMO-2026-VIP');
  }
}

// Global singleton instance
const globalStore = (global as unknown as { __paymentStore?: PaymentStore }).__paymentStore || new PaymentStore();
if (process.env.NODE_ENV !== 'production') {
  (global as unknown as { __paymentStore?: PaymentStore }).__paymentStore = globalStore;
}

export function getPaymentStore(): PaymentStore {
  return globalStore;
}

/**
 * Generates an alphanumeric uppercase ID
 */
function generateId(length: number = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generates a memorable Pro license key
 */
export function generateLicenseKey(): string {
  return `PRO-${generateId(4)}-${generateId(4)}`;
}

/**
 * Creates a new VietQR payment order
 */
export function createPaymentOrder(customAmount: number = PRO_PACKAGE_PRICE): PaymentOrder {
  const orderId = `RCV${generateId(6)}`;
  const description = `${orderId}`;
  const now = Date.now();
  const expiresAt = now + ORDER_EXPIRY_MS;

  const bankInfo: BankTransferInfo = {
    bankId: DEFAULT_BANK_ID,
    bankName: DEFAULT_BANK_NAME,
    accountNo: DEFAULT_ACCOUNT_NO,
    accountName: DEFAULT_ACCOUNT_NAME,
    amount: customAmount,
    description: description,
    qrUrl: `https://img.vietqr.io/image/${DEFAULT_BANK_ID}-${DEFAULT_ACCOUNT_NO}-compact2.png?amount=${customAmount}&addInfo=${encodeURIComponent(
      description
    )}&accountName=${encodeURIComponent(DEFAULT_ACCOUNT_NAME)}`,
  };

  const order: PaymentOrder = {
    orderId,
    amount: customAmount,
    description,
    status: 'PENDING',
    licenseKey: null,
    createdAt: now,
    expiresAt,
    bankInfo,
  };

  getPaymentStore().setOrder(order);

  logger.info('Payment Order Created', {
    orderId,
    amount: customAmount,
    expiresAt,
  });

  return order;
}

/**
 * Checks and updates order status (handles expiration check)
 */
export function checkOrderStatus(orderId: string): PaymentOrder | null {
  const order = getPaymentStore().getOrder(orderId);
  if (!order) return null;

  if (order.status === 'PENDING' && Date.now() > order.expiresAt) {
    order.status = 'EXPIRED';
    getPaymentStore().setOrder(order);
  }

  return order;
}

/**
 * Processes incoming SePay Webhook
 */
export function processSePayWebhook(
  payload: SePayWebhookPayload,
  apiKeyHeader?: string
): { success: boolean; message: string; order?: PaymentOrder } {
  // Validate SePay API Key if configured
  const expectedSecret = process.env.SEPAY_WEBHOOK_KEY;
  if (expectedSecret && apiKeyHeader !== expectedSecret) {
    logger.warn('SePay Webhook Unauthorized attempt', { hasHeader: !!apiKeyHeader });
    return { success: false, message: 'Invalid or missing Authorization header' };
  }

  if (payload.transferType !== 'in') {
    return { success: true, message: 'Ignored outbound transfer' };
  }

  const order = getPaymentStore().findOrderByContent(payload.content || payload.description || '');
  if (!order) {
    logger.warn('SePay Webhook: No matching order found for content', {
      transferAmount: payload.transferAmount,
    });
    return { success: false, message: 'No matching pending order found for this transfer content' };
  }

  if (order.status === 'PAID') {
    return { success: true, message: 'Order was already processed as paid', order };
  }

  if (payload.transferAmount < order.amount) {
    logger.warn('SePay Webhook: Underpaid transaction', {
      orderId: order.orderId,
      expected: order.amount,
      received: payload.transferAmount,
    });
    return { success: false, message: `Transfer amount (${payload.transferAmount}) is less than order amount (${order.amount})` };
  }

  // Mark as PAID and issue License Key
  const licenseKey = generateLicenseKey();
  order.status = 'PAID';
  order.licenseKey = licenseKey;
  order.paidAt = Date.now();
  order.transactionReference = payload.referenceCode || String(payload.id);

  getPaymentStore().setOrder(order);

  logger.info('Payment Succeeded via SePay Webhook', {
    orderId: order.orderId,
    amount: payload.transferAmount,
    licenseKeyIssued: true,
  });

  return { success: true, message: 'Payment confirmed successfully', order };
}

/**
 * Sandbox Simulator: Force mark order as PAID for developer/demo test
 */
export function simulateSandboxPayment(orderId: string): { success: boolean; order?: PaymentOrder; error?: string } {
  const order = getPaymentStore().getOrder(orderId);
  if (!order) {
    return { success: false, error: 'Không tìm thấy đơn hàng' };
  }

  if (order.status === 'PAID') {
    return { success: true, order };
  }

  const licenseKey = generateLicenseKey();
  order.status = 'PAID';
  order.licenseKey = licenseKey;
  order.paidAt = Date.now();
  order.transactionReference = `SANDBOX-TEST-${Date.now()}`;

  getPaymentStore().setOrder(order);

  logger.info('Sandbox Payment Simulated', {
    orderId: order.orderId,
    licenseKey,
  });

  return { success: true, order };
}

/**
 * Validates and activates a license key
 */
export function activateLicenseKey(key: string): { success: boolean; message: string; key?: string } {
  const cleanKey = key.trim().toUpperCase();
  if (!cleanKey) {
    return { success: false, message: 'Vui lòng nhập mã kích hoạt' };
  }

  const isValid = getPaymentStore().isLicenseKeyValid(cleanKey);
  if (!isValid) {
    return { success: false, message: 'Mã kích hoạt không hợp lệ hoặc đã hết hạn. Định dạng chuẩn: PRO-XXXX-YYYY' };
  }

  return {
    success: true,
    message: 'Kích hoạt gói Pro thành công! Toàn bộ tính năng cao cấp đã được mở khóa.',
    key: cleanKey,
  };
}
