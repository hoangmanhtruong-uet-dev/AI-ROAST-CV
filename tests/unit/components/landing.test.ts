import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '@/app/page';
import FeatureChooser from '@/components/landing/FeatureChooser';

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

  describe('Rubric Unification to 5 Criteria & UI Copy Polish (R5)', () => {
    it('unifies rubric criteria to 5 standard criteria across all landing components without any 4-criteria references', () => {
      render(React.createElement(Home));

      // 1. Footer Rubric 5 tiêu chí check
      expect(screen.getByText(/Tiêu chuẩn Rubric 5 tiêu chí/i)).toBeInTheDocument();

      // 2. DualPortalCards Rubric 5 tiêu chí checks
      expect(screen.getByText(/Chấm điểm theo Rubric 5 tiêu chí công khai kèm nhận xét sâu sắc/i)).toBeInTheDocument();
      expect(screen.getByText(/chấm điểm Rubric 5 tiêu chí/i)).toBeInTheDocument();

      // 3. FaqSection contains 5 standardized criteria
      const faqTrigger = screen.getByRole('button', { name: /tính năng phỏng vấn áp lực/i });
      fireEvent.click(faqTrigger);
      const faqAnswer = screen.getByText(/chấm điểm chi tiết theo Rubric 5 tiêu chí công khai/i);
      expect(faqAnswer).toBeInTheDocument();
      expect(faqAnswer.textContent).toContain('Cấu trúc STAR / mạch lạc');
      expect(faqAnswer.textContent).toContain('Tính cụ thể & dẫn chứng cá nhân');
      expect(faqAnswer.textContent).toContain('Mức độ liên quan & đúng trọng tâm');
      expect(faqAnswer.textContent).toContain('Nhận thức hệ quả & tư duy xử lý vấn đề');
      expect(faqAnswer.textContent).toContain('Độ phù hợp vai trò / JD mục tiêu (Job Match Fit)');

      // 4. Absolute guarantee: No outdated "Rubric 4 tiêu chí" on the entire page
      expect(screen.queryByText(/Rubric 4 tiêu chí/i)).toBeNull();
    });

    it('verifies FeatureChooser standalone component renders Rubric 5 tiêu chí', () => {
      const { container } = render(React.createElement(FeatureChooser));
      expect(container.textContent).toContain('Chấm điểm Rubric 5 tiêu chí công khai kèm nhận xét chi tiết');
      expect(container.textContent).not.toContain('Rubric 4 tiêu chí');
    });

    it('verifies UI copy polish: clean whitespace in DiffSlider, accessible heart icon in Footer, and differentiated penaltyChip in CvHallOfShame', () => {
      render(React.createElement(Home));

      // 1. DiffSlider whitespace check: ensure clean separation between actionVerb and bulletText
      const diffAfterText = screen.getByText(/hệ thống Microservices xử lý/i);
      expect(diffAfterText).toBeInTheDocument();
      // Parent container text should have space: "Chủ trì kiến trúc hệ thống" and NOT "Chủ trì kiến trúchệ thống"
      const parentContainer = diffAfterText.closest('.bg-emerald-950\\/20');
      expect(parentContainer).not.toBeNull();
      expect(parentContainer?.textContent).toContain('Chủ trì kiến trúc hệ thống');
      expect(parentContainer?.textContent).not.toContain('Chủ trì kiến trúchệ thống');

      // 2. Footer heart text check: accessible text "Phát triển với ❤️ vì thế hệ trẻ Việt Nam"
      const footerHeart = screen.getByText(/Phát triển với/i);
      expect(footerHeart).toBeInTheDocument();
      expect(footerHeart.textContent).toContain('Phát triển với ❤️ vì thế hệ trẻ Việt Nam');

      // 3. CvHallOfShame #shame-02 card check: penaltyChip differentiated to -30đ timeline
      const shameChips = screen.getAllByText(/-30đ timeline/i);
      expect(shameChips.length).toBeGreaterThan(0);
      expect(shameChips[0]).toBeInTheDocument();
    });
  });
});
