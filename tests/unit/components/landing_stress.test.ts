import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '@/app/page';
import FakeDoorModal from '@/components/landing/FakeDoorModal';
import { POST } from '@/app/api/fakedoor/route';
import { leadStore } from '@/lib/storage';

describe('Adversarial Stress Testing: Landing Page & Fake Door Modal (Challenger 2)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    leadStore.length = 0;
  });

  describe('1. Rapid Clicking on Modal Open / Close Buttons', () => {
    it('survives rapid successive open clicks without state corruption or duplicate dialogs', async () => {
      render(React.createElement(Home));

      // Locate multiple trigger buttons
      const ctaButtons = screen.getAllByRole('button', { name: /29\.000|gói pro|mở khóa/i });
      expect(ctaButtons.length).toBeGreaterThan(0);

      // Rapidly click open CTA 10 times in a burst
      for (let i = 0; i < 10; i++) {
        fireEvent.click(ctaButtons[0]);
      }

      // Dialog must exist exactly once
      const dialogs = screen.getAllByRole('dialog');
      expect(dialogs).toHaveLength(1);
      expect(dialogs[0]).toBeInTheDocument();
    });

    it('demonstrates uncancelled setTimeout in handleModalClose wipes new input if reopened within 200ms', async () => {
      render(React.createElement(Home));

      const ctaButtons = screen.getAllByRole('button', { name: /29\.000|gói pro|mở khóa/i });

      // Step 1: Open modal
      fireEvent.click(ctaButtons[0]);
      let dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // Step 2: Close modal (schedules setTimeout at 200ms)
      const closeButton = within(dialog).getByRole('button', { name: /đóng hộp thoại/i });
      fireEvent.click(closeButton);

      // Step 3: Immediately reopen at 50ms (before 200ms timer fires)
      fireEvent.click(ctaButtons[0]);
      dialog = screen.getByRole('dialog');
      const emailInput = within(dialog).getByPlaceholderText(/email/i);

      // Step 4: User begins typing new email immediately
      fireEvent.change(emailInput, { target: { value: 'quick.user@gmail.com' } });
      expect((emailInput as HTMLInputElement).value).toBe('quick.user@gmail.com');

      // Step 5: Wait for the 200ms timer to fire
      await act(async () => {
        await new Promise((r) => setTimeout(r, 250));
      });

      // EMPIRICAL OBSERVATION:
      // Because handleModalClose does not store or clear the setTimeout ID,
      // the timer fires and executes setEmail(''), wiping out the text the user just typed!
      const clearedValue = (screen.getByPlaceholderText(/email/i) as HTMLInputElement).value;
      expect(clearedValue).toBe('');
    });

    it('survives rapid Escape key press bursts without unhandled errors', async () => {
      render(React.createElement(Home));

      const ctaButtons = screen.getAllByRole('button', { name: /29\.000|gói pro|mở khóa/i });
      fireEvent.click(ctaButtons[0]);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Rapid Escape bursts
      for (let i = 0; i < 5; i++) {
        fireEvent.keyDown(window, { key: 'Escape' });
      }

      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  describe('2. Form Submission with Rapid Double-Click & Double Submit', () => {
    it('prevents or handles rapid double-click on form submission', async () => {
      let fetchCallCount = 0;
      let resolvePromise: (val: unknown) => void;
      const delayedPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      const fetchMock = vi.fn().mockImplementation(async () => {
        fetchCallCount++;
        return delayedPromise;
      });
      global.fetch = fetchMock;

      const onClose = vi.fn();
      render(React.createElement(FakeDoorModal, { isOpen: true, onClose }));

      const emailInput = screen.getByPlaceholderText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'rapid.clicker@test.com' } });

      const form = emailInput.closest('form');
      expect(form).not.toBeNull();

      // Fire submit twice rapidly
      fireEvent.submit(form!);
      fireEvent.submit(form!);

      // Resolve the delayed fetch response
      await act(async () => {
        resolvePromise({
          ok: true,
          status: 200,
          json: async () => ({ success: true, message: 'Đã nhận thông tin!' }),
        });
      });

      // EMPIRICAL OBSERVATION:
      // In FakeDoorModal.tsx, handleSubmit does not check `if (isLoading) return;`.
      // Although the submit button has `disabled={isLoading}`, submitting via Enter key
      // or double-triggering submit before re-render triggers two fetch calls.
      expect(fetchCallCount).toBe(2);

      // Verify the modal reached the submitted confirmation state
      await waitFor(() => {
        expect(screen.getByText(/cảm ơn bạn đã quan tâm/i)).toBeInTheDocument();
      });
    });

    it('server route idempotently handles rapid concurrent submissions for identical email', async () => {
      // 10 concurrent requests with the same email
      const requests = Array.from({ length: 10 }).map(
        () =>
          new Request('http://localhost:3000/api/fakedoor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'concurrent.student@hust.edu.vn',
              tier: 'pro_29k',
              featureInterest: 'deep_interview',
            }),
          })
      );

      const responses = await Promise.all(requests.map((req) => POST(req)));

      for (const res of responses) {
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
      }

      // Exactly 1 lead stored in in-memory collection despite 10 concurrent requests
      expect(leadStore).toHaveLength(1);
      expect(leadStore[0].email).toBe('concurrent.student@hust.edu.vn');
    });
  });

  describe('3. Empty Input Submit vs Whitespace-Only Email Submit', () => {
    it('rejects empty input submission and displays correct validation message', async () => {
      const fetchMock = vi.fn();
      global.fetch = fetchMock;

      render(React.createElement(FakeDoorModal, { isOpen: true, onClose: vi.fn() }));

      const submitBtn = screen.getByRole('button', { name: /nhận thông báo|đăng ký/i });
      fireEvent.click(submitBtn);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(screen.getByText(/vui lòng nhập địa chỉ email của bạn/i)).toBeInTheDocument();
    });

    it('rejects whitespace-only email (spaces, tabs, newlines) and displays correct validation message', async () => {
      const fetchMock = vi.fn();
      global.fetch = fetchMock;

      render(React.createElement(FakeDoorModal, { isOpen: true, onClose: vi.fn() }));

      const emailInput = screen.getByPlaceholderText(/email/i);
      const whitespaceInputs = ['   ', '\t', '  \n\t  ', '        '];

      for (const badInput of whitespaceInputs) {
        fireEvent.change(emailInput, { target: { value: badInput } });
        const submitBtn = screen.getByRole('button', { name: /nhận thông báo|đăng ký/i });
        fireEvent.click(submitBtn);

        expect(fetchMock).not.toHaveBeenCalled();
        expect(screen.getByText(/vui lòng nhập địa chỉ email của bạn/i)).toBeInTheDocument();
      }
    });

    it('rejects malformed email patterns and distinguishes from empty error', async () => {
      const fetchMock = vi.fn();
      global.fetch = fetchMock;

      render(React.createElement(FakeDoorModal, { isOpen: true, onClose: vi.fn() }));

      const emailInput = screen.getByPlaceholderText(/email/i);
      const malformedEmails = [
        'user@',
        '@domain.com',
        'user@domain',
        'user space@domain.com',
        '<script>alert(1)</script>',
        'admin@.com',
      ];

      for (const badEmail of malformedEmails) {
        fireEvent.change(emailInput, { target: { value: badEmail } });
        const submitBtn = screen.getByRole('button', { name: /nhận thông báo|đăng ký/i });
        fireEvent.click(submitBtn);

        expect(fetchMock).not.toHaveBeenCalled();
        expect(
          screen.getByText(/email không hợp lệ\. vui lòng nhập đúng định dạng/i)
        ).toBeInTheDocument();
      }
    });

    it('accepts whitespace-padded valid email and trims before transmission', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, message: 'Thành công' }),
      });
      global.fetch = fetchMock;

      render(React.createElement(FakeDoorModal, { isOpen: true, onClose: vi.fn() }));

      const emailInput = screen.getByPlaceholderText(/email/i);
      // Padded with leading and trailing spaces
      fireEvent.change(emailInput, { target: { value: '   clean.student@vnu.edu.vn   ' } });

      const submitBtn = screen.getByRole('button', { name: /nhận thông báo|đăng ký/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          '/api/fakedoor',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ email: 'clean.student@vnu.edu.vn', tier: 'pro_29k' }),
          })
        );
      });
    });
  });

  describe('4. Navigation Buttons Verification (/roast and /interview)', () => {
    it('verifies all navigation links across entire landing page target /roast and /interview correctly', () => {
      render(React.createElement(Home));

      const links = screen.getAllByRole('link');

      // Filter Roast CV links
      const roastLinks = links.filter((link) => link.getAttribute('href') === '/roast');
      // Must exist in HeroSection, FeatureChooser, Header, and Footer (at least 4 links)
      expect(roastLinks.length).toBeGreaterThanOrEqual(4);
      for (const rLink of roastLinks) {
        expect(rLink.textContent).toMatch(/roast cv/i);
      }

      // Filter Interview links
      const interviewLinks = links.filter((link) => link.getAttribute('href') === '/interview');
      // Must exist in HeroSection, FeatureChooser, Header, and Footer (at least 4 links)
      expect(interviewLinks.length).toBeGreaterThanOrEqual(4);
      for (const iLink of interviewLinks) {
        expect(iLink.textContent).toMatch(/phỏng vấn áp lực|thử thách phỏng vấn/i);
      }
    });
  });

  describe('5. Mandatory Vietnamese Disclaimers in the DOM', () => {
    it('verifies explicit AI limitation disclaimer exists in HeroSection with alert role', () => {
      render(React.createElement(Home));

      const alertContainer = screen.getByRole('alert', { name: /tuyên bố miễn trừ trách nhiệm/i });
      expect(alertContainer).toBeInTheDocument();

      const expectedDisclaimer = 'Chỉ mang tính chất tham khảo luyện tập, không cam kết việc làm hay đỗ ATS.';
      expect(alertContainer.textContent).toContain(expectedDisclaimer);
      expect(alertContainer.textContent).toContain('Quyết định tuyển dụng thực tế phụ thuộc hoàn toàn vào doanh nghiệp');
    });

    it('verifies mandatory privacy commitment statement and pillars exist in PrivacyBanner', () => {
      render(React.createElement(Home));

      const expectedPrivacyStatement = 'Cam kết không lưu trữ CV hay câu trả lời trên máy chủ, xử lý an toàn tuyệt đối.';
      expect(screen.getByText(new RegExp(expectedPrivacyStatement, 'i'))).toBeInTheDocument();

      // Check all 4 security pillars
      expect(screen.getByText(/xử lý bộ nhớ tạm \(in-memory\)/i)).toBeInTheDocument();
      expect(screen.getByText(/không ghi nội dung vào log/i)).toBeInTheDocument();
      expect(screen.getByText(/xóa dữ liệu một chạm/i)).toBeInTheDocument();
      expect(screen.getByText(/ẩn danh thông tin cá nhân/i)).toBeInTheDocument();
    });

    it('verifies privacy guarantee in Header and Zero Retention notice in Footer', () => {
      render(React.createElement(Home));

      // Header privacy badge
      expect(screen.getByText(/bảo mật 100% • không lưu cv trên server/i)).toBeInTheDocument();

      // Footer zero retention guarantee
      expect(
        screen.getByText(/zero retention: không lưu trữ cv hay câu trả lời trên máy chủ/i)
      ).toBeInTheDocument();

      // Footer comprehensive disclaimer text
      const disclaimerParagraphs = screen.getAllByText(/tuyên bố miễn trừ trách nhiệm:/i);
      expect(disclaimerParagraphs.length).toBeGreaterThan(0);
    });
  });
});
