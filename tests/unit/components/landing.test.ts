import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '@/app/page';

describe('Landing Page UI & Verification Checks (R1)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders Hero Section with explicit AI limitation disclaimer', () => {
    render(React.createElement(Home));

    // Brand headline
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/AI Roast CV/i);

    // Hero AI limitation disclaimer check (R1)
    const disclaimers = screen.getAllByText(/chỉ mang tính chất tham khảo luyện tập|không cam kết việc làm hay đỗ ats/i);
    expect(disclaimers.length).toBeGreaterThan(0);
    expect(disclaimers[0]).toBeInTheDocument();
  });

  it('renders prominent Privacy Commitment Banner', () => {
    render(React.createElement(Home));

    // Privacy commitment check (R1 & R4)
    const privacyNotices = screen.getAllByText(/không lưu trữ cv hay câu trả lời trên máy chủ/i);
    expect(privacyNotices.length).toBeGreaterThan(0);
    expect(privacyNotices[0]).toBeInTheDocument();
  });

  it('renders Dual Feature Chooser with links to Roast CV and Stress Interview', () => {
    render(React.createElement(Home));

    // Find links pointing to /roast and /interview
    const allLinks = screen.getAllByRole('link');
    const roastLink = allLinks.find((link) => link.getAttribute('href') === '/roast');
    expect(roastLink).toBeDefined();
    expect(roastLink?.textContent).toMatch(/roast cv/i);

    const interviewLink = allLinks.find((link) => link.getAttribute('href') === '/interview');
    expect(interviewLink).toBeDefined();
    expect(interviewLink?.textContent).toMatch(/phỏng vấn áp lực|stress interview/i);
  });

  it('triggers Fake Door Modal and successfully submits email interest', async () => {
    const user = userEvent.setup();

    // Mock fetch for /api/fakedoor
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        message: 'Cảm ơn bạn đã quan tâm! Chúng tôi đã ghi nhận email quan tâm gói Pro 29.000đ.',
      }),
    });
    global.fetch = fetchMock;

    render(React.createElement(Home));

    // Find and click the Fake Door CTA trigger button in header
    const ctaButtons = screen.getAllByRole('button', { name: /29\.000|gói pro|mở khóa/i });
    expect(ctaButtons.length).toBeGreaterThan(0);
    await user.click(ctaButtons[0]);

    // Modal should now be visible
    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
    expect(within(modal).getByText(/gói pro 29\.000|đăng ký sớm/i)).toBeInTheDocument();

    // Find input and submit valid email
    const emailInput = within(modal).getByPlaceholderText(/email/i);
    expect(emailInput).toBeInTheDocument();
    await user.type(emailInput, 'student.test@gmail.com');

    const submitBtn = within(modal).getByRole('button', { name: /nhận thông báo|đăng ký/i });
    await user.click(submitBtn);

    // Verify API request payload
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/fakedoor',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ email: 'student.test@gmail.com', tier: 'pro_29k' }),
        })
      );
    });

    // Verify thank-you confirmation state is shown in DOM
    await waitFor(() => {
      expect(within(modal).getByText(/cảm ơn bạn đã quan tâm/i)).toBeInTheDocument();
    });
  });

  it('validates email input and prevents submission when invalid', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    global.fetch = fetchMock;

    render(React.createElement(Home));

    const ctaButtons = screen.getAllByRole('button', { name: /29\.000|gói pro|mở khóa/i });
    await user.click(ctaButtons[0]);

    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();

    const emailInput = within(modal).getByPlaceholderText(/email/i);
    await user.type(emailInput, 'not-a-valid-email');

    const submitBtn = within(modal).getByRole('button', { name: /nhận thông báo|đăng ký/i });
    await user.click(submitBtn);

    // Fetch should not have been called due to client-side validation
    expect(fetchMock).not.toHaveBeenCalled();

    // Validation error message should appear
    expect(within(modal).getByText(/email không hợp lệ/i)).toBeInTheDocument();
  });
});
