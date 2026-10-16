import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CheckoutModal } from '@/components/payment/CheckoutModal';
import { ActivateKeyModal } from '@/components/payment/ActivateKeyModal';
import { PRO_STORAGE_KEY, PRO_LICENSE_KEY } from '@/lib/payment/entitlement';

describe('Payment Modals (Milestone 6)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('CheckoutModal', () => {
    it('does not render when isOpen is false', () => {
      render(React.createElement(CheckoutModal, { isOpen: false, onClose: vi.fn() }));
      expect(screen.queryByText(/nâng cấp gói pro/i)).not.toBeInTheDocument();
    });

    it('creates order and displays VietQR details when opened', async () => {
      const mockOrder = {
        orderId: 'RCVTEST1',
        amount: 29000,
        description: 'RCVTEST1',
        status: 'PENDING',
        licenseKey: null,
        createdAt: Date.now(),
        expiresAt: Date.now() + 900000,
        bankInfo: {
          bankId: 'MB',
          bankName: 'MBBank - Ngân hàng Quân Đội',
          accountNo: '0988668899',
          accountName: 'AI ROAST CV TEAM',
          amount: 29000,
          description: 'RCVTEST1',
          qrUrl: 'https://img.vietqr.io/image/MB-0988668899-compact2.png',
        },
      };

      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/payment/create')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, order: mockOrder }),
          });
        }
        if (url.includes('/api/payment/status')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, status: 'PENDING' }),
          });
        }
        return Promise.reject(new Error('Unknown url'));
      });

      render(React.createElement(CheckoutModal, { isOpen: true, onClose: vi.fn() }));

      await waitFor(() => {
        expect(screen.getByText(/nâng cấp gói pro/i)).toBeInTheDocument();
        expect(screen.getByText(/mbbank/i)).toBeInTheDocument();
        expect(screen.getByText(/0988668899/i)).toBeInTheDocument();
        expect(screen.getByText(/RCVTEST1/i)).toBeInTheDocument();
        expect(screen.getByText(/29.000 đ/i)).toBeInTheDocument();
      });
    });

    it('simulates sandbox payment when clicking the dev simulation button', async () => {
      const mockOrder = {
        orderId: 'RCVSIM1',
        amount: 29000,
        description: 'RCVSIM1',
        status: 'PENDING',
        licenseKey: null,
        createdAt: Date.now(),
        expiresAt: Date.now() + 900000,
        bankInfo: {
          bankId: 'MB',
          bankName: 'MBBank',
          accountNo: '0988668899',
          accountName: 'AI ROAST CV',
          amount: 29000,
          description: 'RCVSIM1',
          qrUrl: 'https://img.vietqr.io/image/MB-0988668899-compact2.png',
        },
      };

      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/payment/create')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, order: mockOrder }),
          });
        }
        if (url.includes('/api/payment/simulate')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, status: 'PAID', licenseKey: 'PRO-SANDBOX-KEY' }),
          });
        }
        if (url.includes('/api/payment/status')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, status: 'PENDING' }),
          });
        }
        return Promise.reject(new Error('Unknown url'));
      });

      render(React.createElement(CheckoutModal, { isOpen: true, onClose: vi.fn() }));

      await waitFor(() => {
        expect(screen.getByText(/giả lập thanh toán thành công/i)).toBeInTheDocument();
      });

      const simBtn = screen.getByText(/giả lập thanh toán thành công/i);
      fireEvent.click(simBtn);

      await waitFor(() => {
        expect(screen.getByText(/thanh toán thành công!/i)).toBeInTheDocument();
        expect(screen.getByText(/PRO-SANDBOX-KEY/i)).toBeInTheDocument();
      });

      expect(localStorage.getItem(PRO_STORAGE_KEY)).toBe('true');
      expect(localStorage.getItem(PRO_LICENSE_KEY)).toBe('PRO-SANDBOX-KEY');
    });
  });

  describe('ActivateKeyModal', () => {
    it('validates and activates a license key successfully', async () => {
      const handleSuccess = vi.fn();
      const handleClose = vi.fn();

      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/payment/activate')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, isPro: true, licenseKey: 'PRO-DEMO-2026-VIP' }),
          });
        }
        return Promise.reject(new Error('Unknown url'));
      });

      render(
        React.createElement(ActivateKeyModal, {
          isOpen: true,
          onClose: handleClose,
          onSuccess: handleSuccess,
        })
      );

      const input = screen.getByLabelText(/mã bản quyền pro của bạn/i);
      fireEvent.change(input, { target: { value: 'PRO-DEMO-2026-VIP' } });

      const submitBtn = screen.getByRole('button', { name: /kích hoạt ngay/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/kích hoạt thành công gói pro/i)).toBeInTheDocument();
      });

      expect(localStorage.getItem(PRO_STORAGE_KEY)).toBe('true');
      expect(localStorage.getItem(PRO_LICENSE_KEY)).toBe('PRO-DEMO-2026-VIP');
    });

    it('shows error when license key is rejected by API', async () => {
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/payment/activate')) {
          return Promise.resolve({
            ok: false,
            status: 400,
            json: () => Promise.resolve({ success: false, message: 'Mã kích hoạt không đúng hoặc không tồn tại' }),
          });
        }
        return Promise.reject(new Error('Unknown url'));
      });

      render(
        React.createElement(ActivateKeyModal, {
          isOpen: true,
          onClose: vi.fn(),
        })
      );

      const input = screen.getByLabelText(/mã bản quyền pro của bạn/i);
      fireEvent.change(input, { target: { value: 'PRO-WRONG-KEY' } });

      const submitBtn = screen.getByRole('button', { name: /kích hoạt ngay/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/mã kích hoạt không đúng hoặc không tồn tại/i)).toBeInTheDocument();
      });

      expect(localStorage.getItem(PRO_STORAGE_KEY)).toBeNull();
    });
  });
});
