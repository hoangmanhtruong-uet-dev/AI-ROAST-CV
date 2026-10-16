import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  TargetRoleSelector,
  sanitizeJdText,
  TargetRoleSelectorChange,
} from '@/components/roast/TargetRoleSelector';
import { SAMPLE_JDS } from '@/lib/data/sample-jds';

describe('TargetRoleSelector Component (Milestone 2)', () => {
  let onChangeMock: (value: TargetRoleSelectorChange) => void;

  beforeEach(() => {
    vi.restoreAllMocks();
    onChangeMock = vi.fn();
  });

  describe('Mode 1: Quick Role Title (Nhập nhanh)', () => {
    it('renders by default in quick mode with target-role-input', () => {
      render(React.createElement(TargetRoleSelector, { onChange: onChangeMock }));

      const quickTab = screen.getByRole('tab', { name: /nhập nhanh chức danh/i });
      expect(quickTab).toHaveAttribute('aria-selected', 'true');

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'target-role-input');
      expect(input).toHaveAttribute('maxLength', '100');
    });

    it('emits targetRole change with empty jdText in quick mode', async () => {
      const user = userEvent.setup();
      render(React.createElement(TargetRoleSelector, { onChange: onChangeMock }));

      const input = screen.getByRole('textbox');
      await user.type(input, 'Frontend Fresher');

      expect(onChangeMock).toHaveBeenCalled();
      const lastCall = (onChangeMock as any).mock.calls.at(-1)[0];
      expect(lastCall).toEqual({
        targetRole: 'Frontend Fresher',
        jdText: '',
        mode: 'quick',
        selectedSampleId: null,
      });
    });

    it('enforces 100 character maximum length on role title input', () => {
      render(React.createElement(TargetRoleSelector, { onChange: onChangeMock }));

      const input = screen.getByRole('textbox') as HTMLInputElement;
      const longText = 'A'.repeat(120);
      fireEvent.change(input, { target: { value: longText } });

      const lastCall = (onChangeMock as any).mock.calls.at(-1)[0];
      expect(lastCall.targetRole.length).toBeLessThanOrEqual(100);
      expect(lastCall.targetRole).toBe('A'.repeat(100));
    });
  });

  describe('Mode 2: Custom Pasted JD (Dán toàn bộ JD)', () => {
    it('switches to custom mode when clicking the custom tab', async () => {
      const user = userEvent.setup();
      render(React.createElement(TargetRoleSelector, { onChange: onChangeMock }));

      const customTab = screen.getByRole('tab', { name: /dán toàn bộ jd/i });
      await user.click(customTab);

      expect(customTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByPlaceholderText(/dán toàn bộ nội dung job description/i)).toBeInTheDocument();
      expect(screen.getByTestId('jd-char-counter')).toHaveTextContent('0/3000 ký tự');

      expect(onChangeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'custom',
          selectedSampleId: null,
        })
      );
    });

    it('updates character counter live when typing in textarea', () => {
      render(React.createElement(TargetRoleSelector, { mode: 'custom', onChange: onChangeMock }));

      const textarea = screen.getByPlaceholderText(/dán toàn bộ nội dung job description/i);
      const testText = 'Tuyển dụng kỹ sư phần mềm React & Node.js kinh nghiệm 1 năm.';

      fireEvent.change(textarea, { target: { value: testText } });

      const counter = screen.getByTestId('jd-char-counter');
      expect(counter).toHaveTextContent(`${testText.length}/3000 ký tự`);

      expect(onChangeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          jdText: testText,
          mode: 'custom',
        })
      );
    });

    it('allows entering an optional role title in custom mode', () => {
      render(React.createElement(TargetRoleSelector, { mode: 'custom', onChange: onChangeMock }));

      const roleInput = screen.getByPlaceholderText(/ví dụ: junior react developer/i);
      fireEvent.change(roleInput, { target: { value: 'Junior Go Developer' } });

      expect(onChangeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          targetRole: 'Junior Go Developer',
          mode: 'custom',
        })
      );
    });

    it('clears custom JD text when clean button is clicked', () => {
      render(
        React.createElement(TargetRoleSelector, {
          mode: 'custom',
          jdText: 'Nội dung JD ban đầu...',
          onChange: onChangeMock,
        })
      );

      const clearBtn = screen.getByRole('button', { name: /xóa trắng/i });
      fireEvent.click(clearBtn);

      const counter = screen.getByTestId('jd-char-counter');
      expect(counter).toHaveTextContent('0/3000 ký tự');

      expect(onChangeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          jdText: '',
          mode: 'custom',
        })
      );
    });

    it('enforces 3000 character maximum length on custom JD textarea', () => {
      render(React.createElement(TargetRoleSelector, { mode: 'custom', onChange: onChangeMock }));

      const textarea = screen.getByPlaceholderText(/dán toàn bộ nội dung job description/i);
      const oversizedText = 'X'.repeat(3500);

      fireEvent.change(textarea, { target: { value: oversizedText } });

      const counter = screen.getByTestId('jd-char-counter');
      expect(counter).toHaveTextContent('3000/3000 ký tự');

      const lastCall = (onChangeMock as any).mock.calls.at(-1)[0];
      expect(lastCall.jdText.length).toBe(3000);
    });
  });

  describe('Client-Side PII Sanitization in JD Input', () => {
    it('automatically sanitizes phone numbers and emails before emitting onChange', () => {
      render(React.createElement(TargetRoleSelector, { mode: 'custom', onChange: onChangeMock }));

      const textarea = screen.getByPlaceholderText(/dán toàn bộ nội dung job description/i);
      const rawJdWithPii = `
        Tuyển dụng Frontend Developer.
        CV gửi về: hr-contact@fintechcorp.vn hoặc sđt hotline 0987654321.
        Xem dự án tại https://github.com/my-awesome-repo
      `;

      fireEvent.change(textarea, { target: { value: rawJdWithPii } });

      const lastCall = (onChangeMock as any).mock.calls.at(-1)[0];
      // Email masked
      expect(lastCall.jdText).toContain('[EMAIL_REDACTED]');
      expect(lastCall.jdText).not.toContain('hr-contact@fintechcorp.vn');
      // Phone masked
      expect(lastCall.jdText).toContain('[PHONE_REDACTED]');
      expect(lastCall.jdText).not.toContain('0987654321');
      // URL masked
      expect(lastCall.jdText).toContain('[URL_REDACTED]');
      expect(lastCall.jdText).not.toContain('https://github.com/my-awesome-repo');
    });

    it('displays PII detection badge and allows 1-click masking in textarea', async () => {
      const user = userEvent.setup();
      render(React.createElement(TargetRoleSelector, { mode: 'custom', onChange: onChangeMock }));

      const textarea = screen.getByPlaceholderText(/dán toàn bộ nội dung job description/i) as HTMLTextAreaElement;
      const rawText = 'Liên hệ: tuyển dụng 0912345678, email hr@company.com';

      fireEvent.change(textarea, { target: { value: rawText } });

      // Badge must appear indicating PII detected
      const piiBadge = await screen.findByRole('button', { name: /đã phát hiện .* thông tin pii/i });
      expect(piiBadge).toBeInTheDocument();

      // Click badge to apply masking directly to textarea
      await user.click(piiBadge);

      expect(textarea.value).toContain('[PHONE_REDACTED]');
      expect(textarea.value).toContain('[EMAIL_REDACTED]');
    });

    it('pastes and sanitizes clipboard text when clipboard helper is clicked', async () => {
      const mockClipboardText = 'JD FinTech: hotline 0988123456 email apply@fintech.com';
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          readText: vi.fn().mockResolvedValue(mockClipboardText),
        },
        configurable: true,
      });

      render(React.createElement(TargetRoleSelector, { mode: 'custom', onChange: onChangeMock }));

      const pasteBtn = screen.getByRole('button', { name: /dán clipboard/i });
      fireEvent.click(pasteBtn);

      await waitFor(() => {
        expect(navigator.clipboard.readText).toHaveBeenCalled();
        const lastCall = (onChangeMock as any).mock.calls.at(-1)[0];
        expect(lastCall.jdText).toContain('[PHONE_REDACTED]');
        expect(lastCall.jdText).toContain('[EMAIL_REDACTED]');
      });
    });

    it('provides sanitizeJdText utility that masks PII accurately', () => {
      const text = 'Gọi ngay 0903123456 hoặc gửi mail tới recruiter@work.com';
      const sanitized = sanitizeJdText(text);

      expect(sanitized).toContain('[PHONE_REDACTED]');
      expect(sanitized).toContain('[EMAIL_REDACTED]');
      expect(sanitized).not.toContain('0903123456');
      expect(sanitized).not.toContain('recruiter@work.com');
    });
  });

  describe('Mode 3: Curated Sample JDs (Bộ mẫu JD thực chiến)', () => {
    it('switches to sample mode and renders all 3 curated sample cards', async () => {
      const user = userEvent.setup();
      render(React.createElement(TargetRoleSelector, { onChange: onChangeMock }));

      const sampleTab = screen.getByRole('tab', { name: /bộ mẫu jd thực chiến/i });
      await user.click(sampleTab);

      expect(sampleTab).toHaveAttribute('aria-selected', 'true');

      // Check all 3 sample cards exist
      expect(screen.getByText('Frontend React / Next.js Fresher')).toBeInTheDocument();
      expect(screen.getByText('Backend Engineer Fresher (Node.js / Go)')).toBeInTheDocument();
      expect(screen.getByText('Digital Marketing & Growth Executive')).toBeInTheDocument();
    });

    it('selects a sample JD, fills in title and text, and emits onChange', async () => {
      const user = userEvent.setup();
      render(React.createElement(TargetRoleSelector, { mode: 'sample', onChange: onChangeMock }));

      const backendCard = screen.getByRole('button', {
        name: /backend engineer fresher \(node\.js \/ go\)/i,
      });

      await user.click(backendCard);

      expect(backendCard).toHaveAttribute('data-selected', 'true');
      expect(screen.getByText(/đang chọn: backend engineer fresher \(node\.js \/ go\)/i)).toBeInTheDocument();

      const lastCall = (onChangeMock as any).mock.calls.at(-1)[0];
      expect(lastCall.mode).toBe('sample');
      expect(lastCall.selectedSampleId).toBe('backend-golang-node');
      expect(lastCall.targetRole).toBe('Backend Engineer Fresher (Node.js / Go)');
      expect(lastCall.jdText).toContain('V-Logistics Cloud Platform');
      expect(lastCall.jdText).toContain('PostgreSQL');
    });

    it('toggles full JD text view when clicking accordion button', async () => {
      const user = userEvent.setup();
      render(
        React.createElement(TargetRoleSelector, {
          mode: 'sample',
          selectedSampleId: 'frontend-react-fresher',
          onChange: onChangeMock,
        })
      );

      const expandBtn = screen.getByRole('button', { name: /xem toàn bộ jd mẫu/i });
      expect(expandBtn).toBeInTheDocument();

      await user.click(expandBtn);

      // Accordion expanded
      expect(screen.getByText(/thu gọn jd/i)).toBeInTheDocument();
      expect(screen.getByText(/VỊ TRÍ: FRONTEND DEVELOPER/i)).toBeInTheDocument();

      // Click to collapse
      await user.click(screen.getByRole('button', { name: /thu gọn jd/i }));
      expect(screen.queryByText(/VỊ TRÍ: FRONTEND DEVELOPER/i)).toBeNull();
    });
  });

  describe('Tab Switching State Preservation', () => {
    it('switches between all 3 modes seamlessly and updates state', async () => {
      const user = userEvent.setup();
      render(React.createElement(TargetRoleSelector, { onChange: onChangeMock }));

      // 1. In quick mode, type role
      const input = screen.getByRole('textbox');
      await user.type(input, 'DevOps Fresher');

      // 2. Switch to custom mode
      const customTab = screen.getByRole('tab', { name: /dán toàn bộ jd/i });
      await user.click(customTab);
      expect(onChangeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'custom',
          targetRole: 'DevOps Fresher',
        })
      );

      // 3. Switch to sample mode
      const sampleTab = screen.getByRole('tab', { name: /bộ mẫu jd thực chiến/i });
      await user.click(sampleTab);
      expect(onChangeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'sample',
        })
      );

      // 4. Switch back to quick mode
      const quickTab = screen.getByRole('tab', { name: /nhập nhanh chức danh/i });
      await user.click(quickTab);
      expect(onChangeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'quick',
          jdText: '',
        })
      );
    });
  });
});
