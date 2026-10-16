import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SecurityBentoGrid from '@/components/landing/SecurityBentoGrid';
import { soundEngine } from '@/lib/audio/sound-engine';

describe('Dynamic Security Bento Grid Component (Milestone 3)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    soundEngine.resetForTesting();
  });

  describe('1. Regression Invariants from landing_stress.test.ts:290-301', () => {
    it('verifies exact primary privacy commitment statement is in document', () => {
      render(React.createElement(SecurityBentoGrid));

      const expectedPrivacyStatement =
        'Cam kết không lưu trữ CV hay câu trả lời trên máy chủ, xử lý an toàn tuyệt đối.';
      expect(screen.getByText(new RegExp(expectedPrivacyStatement, 'i'))).toBeInTheDocument();
    });

    it('verifies all 4 mandatory security pillars are in document', () => {
      render(React.createElement(SecurityBentoGrid));

      // Pillar 1: Xử lý bộ nhớ tạm (in-memory)
      expect(screen.getByText(/xử lý bộ nhớ tạm \(in-memory\)/i)).toBeInTheDocument();

      // Pillar 2: Không ghi nội dung vào log
      expect(screen.getByText(/không ghi nội dung vào log/i)).toBeInTheDocument();

      // Pillar 3: Xóa dữ liệu một chạm
      expect(screen.getByText(/xóa dữ liệu một chạm/i)).toBeInTheDocument();

      // Pillar 4: Ẩn danh thông tin cá nhân
      expect(screen.getByText(/ẩn danh thông tin cá nhân/i)).toBeInTheDocument();
    });

    it('verifies badge and section header', () => {
      render(React.createElement(SecurityBentoGrid));

      expect(screen.getByText(/cam kết an toàn thông tin/i)).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: /quyền riêng tư là ưu tiên số 1 của chúng tôi/i })
      ).toBeInTheDocument();
    });
  });

  describe('2. Cell 1: Animated SVG Data Pipeline', () => {
    it('renders pipeline stages and verbatim ephemeral data flow description', () => {
      render(React.createElement(SecurityBentoGrid));

      expect(screen.getByText('CV Upload')).toBeInTheDocument();
      expect(screen.getByText('RAM Server')).toBeInTheDocument();
      expect(screen.getByText('Gemini Flash')).toBeInTheDocument();
      expect(screen.getByText('Giải phóng')).toBeInTheDocument();

      expect(
        screen.getByText(/CV ➔ RAM Server ➔ Google Gemini API \(Mã hóa HTTPS\) ➔ Giải phóng bộ nhớ, không lưu Database/i)
      ).toBeInTheDocument();

      expect(screen.getByText(/lưu trữ database: 0 kb/i)).toBeInTheDocument();
      expect(screen.getByText(/ram tự giải phóng sau khi phản hồi/i)).toBeInTheDocument();
    });
  });

  describe('3. Cell 2: Simulated Live Security Terminal', () => {
    it('renders terminal title and streaming log lines with [REDACTED_BY_ZERO_RETENTION]', () => {
      render(React.createElement(SecurityBentoGrid));

      expect(screen.getByText('zero-retention-monitor.log')).toBeInTheDocument();

      // Verbatim [REDACTED_BY_ZERO_RETENTION] check
      const redactedOccurrences = screen.getAllByText(/\[REDACTED_BY_ZERO_RETENTION\]/i);
      expect(redactedOccurrences.length).toBeGreaterThan(0);

      // Memory freed log check
      expect(screen.getByText(/ram buffer zeroed\. disk writes: 0 bytes/i)).toBeInTheDocument();
    });
  });

  describe('4. Cell 3: Interactive Thanos Snap Demo', () => {
    it('renders mock CV card and dissolves upon clicking Thanos Snap, with recovery button', async () => {
      const user = userEvent.setup();
      render(React.createElement(SecurityBentoGrid));

      // Initial active state
      expect(screen.getByText(/bản nháp cv: lê minh tuấn/i)).toBeInTheDocument();
      const snapBtn = screen.getByRole('button', { name: /thử xóa dữ liệu \(thanos snap\)/i });
      expect(snapBtn).toBeInTheDocument();

      // Trigger snap
      await user.click(snapBtn);

      // Verify transition to dissolved state
      await waitFor(
        () => {
          expect(
            screen.getByText(/dữ liệu đã tan biến hoàn toàn khỏi bộ nhớ trình duyệt/i)
          ).toBeInTheDocument();
        },
        { timeout: 1500 }
      );

      // Restore demo
      const restoreBtn = screen.getByRole('button', { name: /khôi phục demo/i });
      expect(restoreBtn).toBeInTheDocument();
      await user.click(restoreBtn);

      // Verify mock CV card is restored
      expect(screen.getByText(/bản nháp cv: lê minh tuấn/i)).toBeInTheDocument();
    });
  });

  describe('5. Cell 4: Automatic PII Blur Preview on Hover', () => {
    it('masks phone, email and name when hovered or toggled', () => {
      render(React.createElement(SecurityBentoGrid));

      // Find Cell 4 card container
      const cell4 = screen.getByText(/ẩn danh thông tin cá nhân/i).closest('div.rounded-2xl');
      expect(cell4).toBeInTheDocument();

      // Unmasked initial state
      expect(screen.getByText('0987 654 321')).toBeInTheDocument();
      expect(screen.getByText('hoangnam.dev@gmail.com')).toBeInTheDocument();

      // Simulate mouse enter (hover)
      fireEvent.mouseEnter(cell4!);

      // Assert values are now redacted
      expect(screen.getByText('[Họ tên ẩn danh]')).toBeInTheDocument();
      expect(screen.getByText('09****4321')).toBeInTheDocument();
      expect(screen.getByText('h***m@gmail.com')).toBeInTheDocument();
      expect(screen.getByText(/lá chắn pii kích hoạt/i)).toBeInTheDocument();

      // Simulate mouse leave
      fireEvent.mouseLeave(cell4!);
      expect(screen.getByText('0987 654 321')).toBeInTheDocument();
      expect(screen.getByText('hoangnam.dev@gmail.com')).toBeInTheDocument();
    });
  });
});
