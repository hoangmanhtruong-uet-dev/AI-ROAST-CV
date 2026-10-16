import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WipeDataButton } from '@/components/privacy/WipeDataButton';

describe('Milestone 4: Wipe Data UI Component (Feature 23 & §R4)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. Accessible Button Rendering
  // =========================================================================
  describe('1. Accessible Button Rendering & Placement', () => {
    it('renders with accessible button label and icon', () => {
      render(React.createElement(WipeDataButton, { showLabel: true }));

      const button = screen.getByRole('button', { name: /xóa sạch dữ liệu/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('type', 'button');
    });

    it('renders icon-only variant with appropriate aria-label', () => {
      render(React.createElement(WipeDataButton, { showLabel: false }));

      const button = screen.getByRole('button', { name: /xóa sạch dữ liệu phiên|wipe data/i });
      expect(button).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 2. Direct 1-Click Wipe Flow & Toast Notification
  // =========================================================================
  describe('2. Direct One-Click Wipe Action & Visual Feedback Toast', () => {
    it('clears storage and displays Vietnamese confirmation toast', async () => {
      const user = userEvent.setup();
      const onWipedSpy = vi.fn();

      // Pre-fill storage
      localStorage.setItem('airoastcv_test_key', 'test_data');
      sessionStorage.setItem('airoastcv_session_key', 'session_data');

      render(
        React.createElement(WipeDataButton, {
          confirmFirst: false,
          onWiped: onWipedSpy,
        })
      );

      const button = screen.getByRole('button', { name: /xóa sạch dữ liệu/i });
      await user.click(button);

      // 1. Verify storage is purged
      expect(localStorage.length).toBe(0);
      expect(sessionStorage.length).toBe(0);

      // 2. Verify visual feedback toast is rendered in DOM
      await waitFor(() => {
        expect(
          screen.getByText(/đã xóa toàn bộ dữ liệu cv và phỏng vấn trên thiết bị này/i)
        ).toBeInTheDocument();
      });

      // 3. Verify callback fired
      expect(onWipedSpy).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // 3. Confirmation Dialog Flow
  // =========================================================================
  describe('3. Confirmation Modal Flow (confirmFirst=true)', () => {
    it('opens confirmation modal and does NOT wipe when user cancels', async () => {
      const user = userEvent.setup();
      localStorage.setItem('keep_this_key', 'persisted');

      render(React.createElement(WipeDataButton, { confirmFirst: true }));

      const button = screen.getByRole('button', { name: /xóa sạch dữ liệu/i });
      await user.click(button);

      // Modal dialog must open
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(
        screen.getByText(/bạn có chắc chắn muốn xóa sạch toàn bộ dữ liệu/i)
      ).toBeInTheDocument();

      // Click "Hủy" / Cancel button
      const cancelBtn = screen.getByRole('button', { name: /hủy|quay lại/i });
      await user.click(cancelBtn);

      // Storage must remain intact
      expect(localStorage.getItem('keep_this_key')).toBe('persisted');
    });

    it('purges storage and shows toast when user confirms deletion in modal', async () => {
      const user = userEvent.setup();
      localStorage.setItem('delete_this_key', 'transient');

      render(React.createElement(WipeDataButton, { confirmFirst: true }));

      // Open dialog
      await user.click(screen.getByRole('button', { name: /xóa sạch dữ liệu/i }));

      // Confirm deletion
      const confirmBtn = screen.getByRole('button', { name: /xác nhận xóa|xóa vĩnh viễn/i });
      await user.click(confirmBtn);

      // Storage must be purged
      expect(localStorage.length).toBe(0);
      expect(
        await screen.findByText(/đã xóa toàn bộ dữ liệu cv và phỏng vấn trên thiết bị này/i)
      ).toBeInTheDocument();
    });
  });
});
