import { describe, it, expect, beforeEach } from 'vitest';
import {
  createPaymentOrder,
  checkOrderStatus,
  processSePayWebhook,
  simulateSandboxPayment,
  activateLicenseKey,
  getPaymentStore,
  PRO_PACKAGE_PRICE,
  ORDER_EXPIRY_MS,
} from '@/lib/payment/service';
import { SePayWebhookPayload } from '@/lib/payment/types';

describe('Payment Service & Store (Milestone 6)', () => {
  beforeEach(() => {
    getPaymentStore().clear();
  });

  describe('createPaymentOrder', () => {
    it('creates a new payment order with default 29k price and valid VietQR URL', () => {
      const order = createPaymentOrder();

      expect(order).toBeDefined();
      expect(order.orderId).toMatch(/^RCV[A-Z0-9]{6}$/);
      expect(order.amount).toBe(PRO_PACKAGE_PRICE);
      expect(order.status).toBe('PENDING');
      expect(order.licenseKey).toBeNull();
      expect(order.expiresAt).toBeGreaterThan(Date.now() + ORDER_EXPIRY_MS - 2000);

      // Verify bankInfo and VietQR URL
      expect(order.bankInfo.bankId).toBeDefined();
      expect(order.bankInfo.accountNo).toBeDefined();
      expect(order.bankInfo.accountName).toBeDefined();
      expect(order.bankInfo.qrUrl).toContain('img.vietqr.io');
      expect(order.bankInfo.qrUrl).toContain(`amount=${PRO_PACKAGE_PRICE}`);
      expect(order.bankInfo.qrUrl).toContain(encodeURIComponent(order.description));
    });

    it('supports custom price amount if specified', () => {
      const order = createPaymentOrder(19000);
      expect(order.amount).toBe(19000);
      expect(order.bankInfo.amount).toBe(19000);
    });
  });

  describe('checkOrderStatus', () => {
    it('returns order details for existing order', () => {
      const order = createPaymentOrder();
      const fetched = checkOrderStatus(order.orderId);
      expect(fetched).not.toBeNull();
      expect(fetched?.orderId).toBe(order.orderId);
      expect(fetched?.status).toBe('PENDING');
    });

    it('returns null for nonexistent orderId', () => {
      const fetched = checkOrderStatus('NONEXISTENT_123');
      expect(fetched).toBeNull();
    });

    it('marks pending order as EXPIRED if past expiresAt', () => {
      const order = createPaymentOrder();
      order.expiresAt = Date.now() - 1000; // Past
      getPaymentStore().setOrder(order);

      const fetched = checkOrderStatus(order.orderId);
      expect(fetched?.status).toBe('EXPIRED');
    });
  });

  describe('processSePayWebhook', () => {
    it('successfully confirms payment when transfer content matches orderId and amount', () => {
      const order = createPaymentOrder(29000);

      const webhookPayload: SePayWebhookPayload = {
        id: 123456,
        gateway: 'MBBank',
        transactionDate: '2026-10-14 21:00:00',
        accountNumber: '0988668899',
        content: `Chuyen tien ung ho ${order.orderId} thanh toan pro`,
        transferType: 'in',
        transferAmount: 29000,
        accumulated: 100000,
        referenceCode: 'FT261014999',
      };

      const result = processSePayWebhook(webhookPayload);

      expect(result.success).toBe(true);
      expect(result.order).toBeDefined();
      expect(result.order?.status).toBe('PAID');
      expect(result.order?.licenseKey).toMatch(/^PRO-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
      expect(result.order?.paidAt).toBeDefined();

      // Check order in store
      const updated = checkOrderStatus(order.orderId);
      expect(updated?.status).toBe('PAID');
      expect(updated?.licenseKey).toBe(result.order?.licenseKey);
    });

    it('handles idempotent webhook delivery without re-generating license key', () => {
      const order = createPaymentOrder(29000);

      const payload: SePayWebhookPayload = {
        id: 123456,
        gateway: 'MBBank',
        transactionDate: '2026-10-14 21:00:00',
        accountNumber: '0988668899',
        content: `Thanh toan don hang ${order.orderId}`,
        transferType: 'in',
        transferAmount: 29000,
        accumulated: 100000,
      };

      const firstCall = processSePayWebhook(payload);
      expect(firstCall.success).toBe(true);
      const initialKey = firstCall.order?.licenseKey;

      // Second identical webhook
      const secondCall = processSePayWebhook(payload);
      expect(secondCall.success).toBe(true);
      expect(secondCall.order?.licenseKey).toBe(initialKey);
    });

    it('ignores outbound transfers (transferType: out)', () => {
      const payload: SePayWebhookPayload = {
        id: 123456,
        gateway: 'MBBank',
        transactionDate: '2026-10-14 21:00:00',
        accountNumber: '0988668899',
        content: 'Chuyen tien tra hang',
        transferType: 'out',
        transferAmount: 29000,
        accumulated: 100000,
      };

      const result = processSePayWebhook(payload);
      expect(result.success).toBe(true);
      expect(result.message).toContain('Ignored outbound transfer');
    });

    it('rejects underpaid transfer amounts', () => {
      const order = createPaymentOrder(29000);

      const payload: SePayWebhookPayload = {
        id: 123456,
        gateway: 'MBBank',
        transactionDate: '2026-10-14 21:00:00',
        accountNumber: '0988668899',
        content: `Chuyen tien ${order.orderId}`,
        transferType: 'in',
        transferAmount: 10000, // Less than 29000
        accumulated: 100000,
      };

      const result = processSePayWebhook(payload);
      expect(result.success).toBe(false);
      expect(result.message).toContain('is less than order amount');
    });

    it('rejects unknown content without matching orderId', () => {
      const payload: SePayWebhookPayload = {
        id: 123456,
        gateway: 'MBBank',
        transactionDate: '2026-10-14 21:00:00',
        accountNumber: '0988668899',
        content: 'Chuyen khoan khong co ma don',
        transferType: 'in',
        transferAmount: 29000,
        accumulated: 100000,
      };

      const result = processSePayWebhook(payload);
      expect(result.success).toBe(false);
      expect(result.message).toContain('No matching pending order found');
    });
  });

  describe('simulateSandboxPayment', () => {
    it('instantly marks order as PAID and generates license key in sandbox dev mode', () => {
      const order = createPaymentOrder();
      expect(order.status).toBe('PENDING');

      const result = simulateSandboxPayment(order.orderId);
      expect(result.success).toBe(true);
      expect(result.order?.status).toBe('PAID');
      expect(result.order?.licenseKey).toMatch(/^PRO-[A-Z0-9]{4}-[A-Z0-9]{4}$/);

      const updated = checkOrderStatus(order.orderId);
      expect(updated?.status).toBe('PAID');
      expect(updated?.licenseKey).toBe(result.order?.licenseKey);
    });

    it('returns error for invalid orderId in simulation', () => {
      const result = simulateSandboxPayment('INVALID_ORDER_ID');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('activateLicenseKey', () => {
    it('accepts seeded demo key PRO-DEMO-2026-VIP', () => {
      const result = activateLicenseKey('PRO-DEMO-2026-VIP');
      expect(result.success).toBe(true);
      expect(result.key).toBe('PRO-DEMO-2026-VIP');
    });

    it('accepts dynamically generated license keys from paid orders', () => {
      const order = createPaymentOrder();
      const sim = simulateSandboxPayment(order.orderId);
      const generatedKey = sim.order!.licenseKey!;

      const result = activateLicenseKey(generatedKey);
      expect(result.success).toBe(true);
      expect(result.key).toBe(generatedKey);
    });

    it('accepts any valid PRO-XXXX-YYYY format key', () => {
      const result = activateLicenseKey('PRO-ABCD-1234');
      expect(result.success).toBe(true);
    });

    it('rejects malformed or empty license keys', () => {
      expect(activateLicenseKey('').success).toBe(false);
      expect(activateLicenseKey('INVALID').success).toBe(false);
      expect(activateLicenseKey('12345').success).toBe(false);
      expect(activateLicenseKey('PRO-SHORT').success).toBe(false);
    });
  });
});
