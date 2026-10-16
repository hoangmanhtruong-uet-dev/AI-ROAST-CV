import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  TargetRoleSelector,
  TargetRoleSelectorChange,
  sanitizeJdText,
} from '@/components/roast/TargetRoleSelector';
import { SAMPLE_JDS, getSampleJd } from '@/lib/data/sample-jds';

describe('TargetRoleSelector Adversarial Stress Suite', () => {
  let onChangeMock: (value: TargetRoleSelectorChange) => void;

  beforeEach(() => {
    vi.restoreAllMocks();
    onChangeMock = vi.fn();
  });

  describe('1. Character Overflow & Boundary Capping (>3000 chars)', () => {
    it('strictly caps textarea input at 3000 characters when pasting 5000 characters', () => {
      render(React.createElement(TargetRoleSelector, { mode: 'custom', onChange: onChangeMock }));

      const textarea = screen.getByPlaceholderText(/dán toàn bộ nội dung job description/i) as HTMLTextAreaElement;
      const massiveText = 'A'.repeat(5000);

      fireEvent.change(textarea, { target: { value: massiveText } });

      const lastCall = (onChangeMock as any).mock.calls.at(-1)[0];
      expect(lastCall.jdText.length).toBe(3000);
      expect(lastCall.jdText).toBe('A'.repeat(3000));

      const counter = screen.getByTestId('jd-char-counter');
      expect(counter).toHaveTextContent('3000/3000 ký tự');
      expect(counter.className).toContain('text-rose-400');
    });

    it('has HTML5 maxLength=3000 attribute to prevent native browser overflow', () => {
      render(React.createElement(TargetRoleSelector, { mode: 'custom', onChange: onChangeMock }));
      const textarea = screen.getByPlaceholderText(/dán toàn bộ nội dung job description/i);
      expect(textarea).toHaveAttribute('maxLength', '3000');
    });

    it('has HTML5 maxLength=100 on role input to prevent role title overflow', () => {
      render(React.createElement(TargetRoleSelector, { mode: 'quick', onChange: onChangeMock }));
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('maxLength', '100');
    });

    it('handles clipboard paste exceeding 3000 chars and truncates appropriately', async () => {
      const hugeClipboard = 'Z'.repeat(4500);
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          readText: vi.fn().mockResolvedValue(hugeClipboard),
        },
        configurable: true,
      });

      render(React.createElement(TargetRoleSelector, { mode: 'custom', onChange: onChangeMock }));

      const pasteBtn = screen.getByRole('button', { name: /dán clipboard/i });
      fireEvent.click(pasteBtn);

      await waitFor(() => {
        expect(navigator.clipboard.readText).toHaveBeenCalled();
        const lastCall = (onChangeMock as any).mock.calls.at(-1)[0];
        expect(lastCall.jdText.length).toBeLessThanOrEqual(3000);
        expect(lastCall.jdText).toBe('Z'.repeat(3000));
      });
    });

    it('inspects PII token expansion when text contains multiple phone numbers near 3000 char boundary', async () => {
      // 250 occurrences of 10-digit phone "0912345678" + space = 2750 chars
      const phoneSegment = '0912345678 ';
      const rawText = phoneSegment.repeat(250); // 2750 chars
      expect(rawText.length).toBe(2750);

      render(React.createElement(TargetRoleSelector, { mode: 'custom', onChange: onChangeMock }));
      const textarea = screen.getByPlaceholderText(/dán toàn bộ nội dung job description/i) as HTMLTextAreaElement;

      fireEvent.change(textarea, { target: { value: rawText } });

      const lastCall = (onChangeMock as any).mock.calls.at(-1)[0];
      // Note: [PHONE_REDACTED] is 16 chars vs 10 chars, so 250 * 16 = 4000 chars!
      // In onChange, sanitizeJdText expanded the tokens so server receives redacted tokens
      expect(lastCall.jdText).toContain('[PHONE_REDACTED]');
      expect(lastCall.jdText).not.toContain('0912345678');
    });
  });

  describe('2. Empty and Whitespace-Only Inputs', () => {
    it('handles empty input in quick mode without crashing', () => {
      render(React.createElement(TargetRoleSelector, { targetRole: 'Developer', mode: 'quick', onChange: onChangeMock }));
      const input = screen.getByRole('textbox') as HTMLInputElement;

      fireEvent.change(input, { target: { value: '' } });

      const lastCall = (onChangeMock as any).mock.calls.at(-1)[0];
      expect(lastCall.targetRole).toBe('');
      expect(lastCall.jdText).toBe('');
      expect(lastCall.mode).toBe('quick');
      expect(lastCall.selectedSampleId).toBeNull();
    });

    it('handles whitespace-only input in quick mode', () => {
      render(React.createElement(TargetRoleSelector, { mode: 'quick', onChange: onChangeMock }));
      const input = screen.getByRole('textbox') as HTMLInputElement;

      fireEvent.change(input, { target: { value: '     ' } });

      const lastCall = (onChangeMock as any).mock.calls.at(-1)[0];
      expect(lastCall.targetRole).toBe('     ');
      expect(lastCall.jdText).toBe('');
    });

    it('handles empty input in custom mode and does not show clear button or PII badges', () => {
      render(React.createElement(TargetRoleSelector, { mode: 'custom', onChange: onChangeMock }));
      const textarea = screen.getByPlaceholderText(/dán toàn bộ nội dung job description/i);

      fireEvent.change(textarea, { target: { value: '' } });

      expect(screen.queryByRole('button', { name: /xóa trắng/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /đã phát hiện .* pii/i })).toBeNull();
      expect(screen.getByTestId('jd-char-counter')).toHaveTextContent('0/3000 ký tự');
    });

    it('handles whitespace-only input in custom mode correctly', () => {
      render(React.createElement(TargetRoleSelector, { mode: 'custom', onChange: onChangeMock }));
      const textarea = screen.getByPlaceholderText(/dán toàn bộ nội dung job description/i);

      fireEvent.change(textarea, { target: { value: '   \n\t  \n  ' } });

      const lastCall = (onChangeMock as any).mock.calls.at(-1)[0];
      expect(lastCall.jdText.trim()).toBe('');
      // Clear button should be visible since localJdText is non-empty string
      expect(screen.getByRole('button', { name: /xóa trắng/i })).toBeInTheDocument();
    });
  });

  describe('3. Rapid Tab Switching', () => {
    it('survives rapid tab switching between quick, custom, and sample without throwing or infinite re-renders', async () => {
      const user = userEvent.setup();
      render(React.createElement(TargetRoleSelector, { onChange: onChangeMock }));

      const quickTab = screen.getByRole('tab', { name: /nhập nhanh chức danh/i });
      const customTab = screen.getByRole('tab', { name: /dán toàn bộ jd/i });
      const sampleTab = screen.getByRole('tab', { name: /bộ mẫu jd thực chiến/i });

      // Rapidly switch 10 times in varied sequences
      const sequence = [
        customTab, sampleTab, quickTab,
        sampleTab, customTab, quickTab,
        customTab, sampleTab, customTab, quickTab,
      ];

      for (const tab of sequence) {
        await user.click(tab);
      }

      // Check current tab is quick tab
      expect(quickTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('textbox')).toBeInTheDocument();

      // Ensure onChangeMock was called without error
      expect(onChangeMock).toHaveBeenCalled();
      const lastCall = (onChangeMock as any).mock.calls.at(-1)[0];
      expect(lastCall.mode).toBe('quick');
      expect(lastCall.jdText).toBe('');
      expect(lastCall.selectedSampleId).toBeNull();
    });

    it('preserves targetRole when transitioning between quick and custom mode', async () => {
      const user = userEvent.setup();
      render(React.createElement(TargetRoleSelector, { onChange: onChangeMock }));

      // Type role in quick mode
      const quickInput = screen.getByRole('textbox');
      await user.type(quickInput, 'DevOps Fresher');

      // Switch to custom mode
      const customTab = screen.getByRole('tab', { name: /dán toàn bộ jd/i });
      await user.click(customTab);

      // Verify custom mode role input received the value
      const customRoleInput = screen.getByPlaceholderText(/ví dụ: junior react developer/i) as HTMLInputElement;
      expect(customRoleInput.value).toBe('DevOps Fresher');

      // Edit in custom mode
      await user.clear(customRoleInput);
      await user.type(customRoleInput, 'Cloud SRE Intern');

      // Switch back to quick mode
      const quickTab = screen.getByRole('tab', { name: /nhập nhanh chức danh/i });
      await user.click(quickTab);

      const restoredQuickInput = screen.getByRole('textbox') as HTMLInputElement;
      expect(restoredQuickInput.value).toBe('Cloud SRE Intern');
    });
  });

  describe('4. Sample Selection, Switching & Edge Cases', () => {
    it('allows sequential selection across all sample JDs with accurate state and accordion updates', async () => {
      const user = userEvent.setup();
      const { container } = render(React.createElement(TargetRoleSelector, { mode: 'sample', onChange: onChangeMock }));

      for (const sample of SAMPLE_JDS) {
        const card = container.querySelector(`[data-sample-id="${sample.id}"]`) as HTMLButtonElement;
        expect(card).not.toBeNull();
        await user.click(card);

        expect(card).toHaveAttribute('data-selected', 'true');
        expect(screen.getByText(new RegExp(`Đang chọn: ${sample.roleTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'))).toBeInTheDocument();

        const lastCall = (onChangeMock as any).mock.calls.at(-1)[0];
        expect(lastCall.selectedSampleId).toBe(sample.id);
        expect(lastCall.targetRole).toBe(sample.roleTitle);
        expect(lastCall.jdText).toContain(sanitizeJdText(sample.jdText));
      }
    });

    it('keeps sample selected when re-clicking an already selected sample', async () => {
      const user = userEvent.setup();
      render(React.createElement(TargetRoleSelector, { mode: 'sample', onChange: onChangeMock }));

      const firstSample = SAMPLE_JDS[0];
      const card = screen.getByRole('button', { name: new RegExp(firstSample.roleTitle, 'i') });

      // Click once
      await user.click(card);
      expect(card).toHaveAttribute('data-selected', 'true');

      // Click second time
      await user.click(card);
      expect(card).toHaveAttribute('data-selected', 'true');
      expect(screen.getByText(new RegExp(`Đang chọn: ${firstSample.roleTitle}`, 'i'))).toBeInTheDocument();
    });

    it('safely handles non-existent sample ID passed via prop without crash', () => {
      render(
        React.createElement(TargetRoleSelector, {
          mode: 'sample',
          selectedSampleId: 'invalid-non-existent-id',
          onChange: onChangeMock,
        })
      );

      // Should render without throwing
      expect(screen.getByRole('tab', { name: /bộ mẫu jd thực chiến/i })).toBeInTheDocument();
      // No sample card should have data-selected=true
      const cards = screen.getAllByRole('button', { name: /fresher|executive/i });
      cards.forEach((c) => expect(c).toHaveAttribute('data-selected', 'false'));
    });

    it('safely handles disabled state by preventing interaction', async () => {
      const user = userEvent.setup();
      render(
        React.createElement(TargetRoleSelector, {
          mode: 'quick',
          disabled: true,
          onChange: onChangeMock,
        })
      );

      const quickInput = screen.getByRole('textbox') as HTMLInputElement;
      expect(quickInput).toBeDisabled();

      const customTab = screen.getByRole('tab', { name: /dán toàn bộ jd/i });
      expect(customTab).toBeDisabled();
      await user.click(customTab);

      // Should stay in quick mode
      expect(screen.getByRole('tab', { name: /nhập nhanh chức danh/i })).toHaveAttribute('aria-selected', 'true');
      expect(onChangeMock).not.toHaveBeenCalled();
    });
  });
});
