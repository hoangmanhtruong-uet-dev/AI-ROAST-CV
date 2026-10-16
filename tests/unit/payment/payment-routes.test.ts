import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as handleCreateOrder } from '@/app/api/payment/create/route';
import { GET as handleGetStatus } from '@/app/api/payment/status/route';
import { POST as handleWebhook } from '@/app/api/payment/webhook/route';
import { POST as handleSimulate } from '@/app/api/payment/simulate/route';
import { POST as handleActivate } from '@/app/api/payment/activate/route';
import { getPaymentStore, createPaymentOrder } from '@/lib/payment/service';

describe('Payment API Routes (Milestone 6)', () => {
  beforeEach(() => {
    getPaymentStore().clear();
  });

  describe('POST /api/payment/create', () => {
    it('creates an order and returns 200 with order details', async () => {
      const req = new NextRequest('http://localhost:3000/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 29000 }),
      });

      const res = await handleCreateOrder(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.order).toBeDefined();
      expect(data.order.orderId).toMatch(/^RCV/);
      expect(data.order.amount).toBe(29000);
      expect(data.order.bankInfo.qrUrl).toContain('vietqr.io');
    });
  });

  describe('GET /api/payment/status', () => {
    it('returns 400 if orderId query param is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/payment/status');
      const res = await handleGetStatus(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('returns 404 for nonexistent order', async () => {
      const req = new NextRequest('http://localhost:3000/api/payment/status?orderId=RCVNOTFOUND');
      const res = await handleGetStatus(req);
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.success).toBe(false);
    });

    it('returns order status and details for valid order', async () => {
      const order = createPaymentOrder(29000);
      const req = new NextRequest(`http://localhost:3000/api/payment/status?orderId=${order.orderId}`);
      const res = await handleGetStatus(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.orderId).toBe(order.orderId);
      expect(data.status).toBe('PENDING');
    });
  });

  describe('POST /api/payment/simulate', () => {
    it('simulates sandbox payment and marks order as PAID with license key', async () => {
      const order = createPaymentOrder(29000);
      const req = new NextRequest('http://localhost:3000/api/payment/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.orderId }),
      });

      const res = await handleSimulate(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.status).toBe('PAID');
      expect(data.licenseKey).toMatch(/^PRO-/);

      // Verify status endpoint also reflects PAID
      const statusReq = new NextRequest(`http://localhost:3000/api/payment/status?orderId=${order.orderId}`);
      const statusRes = await handleGetStatus(statusReq);
      const statusData = await statusRes.json();
      expect(statusData.status).toBe('PAID');
      expect(statusData.licenseKey).toBe(data.licenseKey);
    });

    it('returns 400 if orderId is missing or invalid', async () => {
      const req = new NextRequest('http://localhost:3000/api/payment/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const res = await handleSimulate(req);
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/payment/webhook', () => {
    it('processes incoming SePay webhook payload successfully', async () => {
      const order = createPaymentOrder(29000);

      const req = new NextRequest('http://localhost:3000/api/payment/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 998877,
          gateway: 'MBBank',
          transactionDate: '2026-10-14 21:05:00',
          accountNumber: '0988668899',
          content: `ROAST CV CHUYEN KHOAN ${order.orderId}`,
          transferType: 'in',
          transferAmount: 29000,
          accumulated: 500000,
        }),
      });

      const res = await handleWebhook(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.status).toBe('PAID');
      expect(data.orderId).toBe(order.orderId);
    });

    it('returns 400 when transfer amount is insufficient', async () => {
      const order = createPaymentOrder(29000);

      const req = new NextRequest('http://localhost:3000/api/payment/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 998878,
          gateway: 'MBBank',
          transactionDate: '2026-10-14 21:05:00',
          accountNumber: '0988668899',
          content: `ROAST CV ${order.orderId}`,
          transferType: 'in',
          transferAmount: 5000, // Insufficient
          accumulated: 500000,
        }),
      });

      const res = await handleWebhook(req);
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/payment/activate', () => {
    it('activates valid demo key and returns isPro: true', async () => {
      const req = new NextRequest('http://localhost:3000/api/payment/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: 'PRO-DEMO-2026-VIP' }),
      });

      const res = await handleActivate(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.isPro).toBe(true);
      expect(data.licenseKey).toBe('PRO-DEMO-2026-VIP');
    });

    it('rejects invalid license key format', async () => {
      const req = new NextRequest('http://localhost:3000/api/payment/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: 'NOT_A_VALID_KEY' }),
      });

      const res = await handleActivate(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });
});
