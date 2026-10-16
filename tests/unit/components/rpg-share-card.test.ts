import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  RpgShareCard,
  calculateRpgProfile,
} from '@/components/share/RpgShareCard';
import { ShareCardPayload } from '@/lib/schemas/share';

describe('RPG / Spotify Wrapped Share Card Component (Milestone 4)', () => {
  let mockContext2D: any;
  let fillTextCalls: string[];

  const rawPiiPayload: ShareCardPayload = {
    type: 'roast',
    title: 'Đánh Giá CV Chuyên Nghiệp',
    score: 82,
    quoteOrHighlight: 'Thiếu số liệu cụ thể cho dự án thương mại điện tử.',
    summary: 'Cần lượng hóa thành tích và bổ sung từ khóa kỹ thuật chuẩn ATS.',
    rawPiiText: 'Ứng viên: Nguyễn Văn A - SĐT: 0912345678 - Email: nguyenvana@gmail.com',
    candidateName: 'Nguyễn Văn A',
  };

  beforeEach(() => {
    fillTextCalls = [];
    mockContext2D = {
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      fillText: vi.fn().mockImplementation((text: string) => {
        fillTextCalls.push(String(text));
      }),
      strokeText: vi.fn(),
      measureText: vi.fn().mockReturnValue({ width: 120 }),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      scale: vi.fn(),
      createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
      createRadialGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
      strokeRect: vi.fn(),
    };

    HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((id: string) => {
      if (id === '2d') return mockContext2D;
      return null;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Deterministic RPG Class Mapping Engine', () => {
    it('maps high score 95 to Tier SSR "Kẻ Hủy Diệt Vòng Gửi Xe"', () => {
      const profile = calculateRpgProfile(95, 'roast');
      expect(profile.tier).toBe('SSR');
      expect(profile.title).toBe('Kẻ Hủy Diệt Vòng Gửi Xe');
      expect(profile.survivalScore).toBe(95);
      expect(profile.attributes.atsAttack).toBeGreaterThanOrEqual(95);
    });

    it('maps score 80 to Tier A "Hiệp Sĩ Fix Bug Gánh Team"', () => {
      const profile = calculateRpgProfile(80, 'roast');
      expect(profile.tier).toBe('A');
      expect(profile.title).toBe('Hiệp Sĩ Fix Bug Gánh Team');
      expect(profile.survivalScore).toBe(80);
    });

    it('maps score 65 to Tier B "Chiến Thần Kỹ Năng Mềm"', () => {
      const profile = calculateRpgProfile(65, 'roast');
      expect(profile.tier).toBe('B');
      expect(profile.title).toBe('Chiến Thần Kỹ Năng Mềm');
      expect(profile.survivalScore).toBe(65);
    });

    it('maps score 50 to Tier C "Chiến Thần Tham Gia"', () => {
      const profile = calculateRpgProfile(50, 'roast');
      expect(profile.tier).toBe('C');
      expect(profile.title).toBe('Chiến Thần Tham Gia');
      expect(profile.survivalScore).toBe(50);
    });

    it('maps low score 30 to Tier F "Phù Thủy Văn Mẫu"', () => {
      const profile = calculateRpgProfile(30, 'roast');
      expect(profile.tier).toBe('F');
      expect(profile.title).toBe('Phù Thủy Văn Mẫu');
      expect(profile.survivalScore).toBe(30);
    });

    it('normalizes interview 10-point scale properly (e.g. 8.5 -> 85)', () => {
      const profile = calculateRpgProfile(8.5, 'interview');
      expect(profile.tier).toBe('A');
      expect(profile.survivalScore).toBe(85);
    });
  });

  describe('2. Canvas Element & Rendering Dimensions', () => {
    it('renders landscape format at 1200x630 resolution', () => {
      const onReady = vi.fn();
      render(React.createElement(RpgShareCard, { payload: rawPiiPayload, format: 'landscape', onCanvasReady: onReady }));

      const canvas = screen.getByTestId('rpg-share-canvas') as HTMLCanvasElement;
      expect(canvas).toBeInTheDocument();
      expect(canvas.width).toBe(1200);
      expect(canvas.height).toBe(630);
      expect(onReady).toHaveBeenCalledWith(canvas);
    });

    it('renders square format at 1080x1080 resolution', () => {
      render(React.createElement(RpgShareCard, { payload: rawPiiPayload, format: 'square' }));

      const canvas = screen.getByTestId('rpg-share-canvas') as HTMLCanvasElement;
      expect(canvas.width).toBe(1080);
      expect(canvas.height).toBe(1080);
    });

    it('draws RPG title, survival score, and stat labels onto canvas', () => {
      render(React.createElement(RpgShareCard, { payload: rawPiiPayload }));

      const allDrawnText = fillTextCalls.join(' ');
      expect(allDrawnText).toMatch(/AI ROAST CV • SPOTIFY WRAPPED EDITION/i);
      expect(allDrawnText).toMatch(/ĐIỂM SINH TỒN CV/i);
      expect(allDrawnText).toMatch(/Hiệp Sĩ Fix Bug Gánh Team/i);
      expect(allDrawnText).toMatch(/Sát thương ATS/i);
      expect(allDrawnText).toMatch(/Độ chống chịu HR/i);
    });
  });

  describe('3. Strict Zero-PII Pre-Render Scrubbing & Zero Network', () => {
    it('never paints raw phone numbers, raw emails, or real full names to canvas', () => {
      render(React.createElement(RpgShareCard, { payload: rawPiiPayload }));

      const allDrawnText = fillTextCalls.join(' ');
      expect(allDrawnText).not.toContain('0912345678');
      expect(allDrawnText).not.toContain('nguyenvana@gmail.com');
      expect(allDrawnText).not.toContain('Nguyễn Văn A');
      // Should contain masked name
      expect(allDrawnText).toMatch(/N\*\*\* A|\[Họ tên ẩn danh\]|Ứng viên ẩn danh/i);
    });

    it('generates card with zero network fetch calls', () => {
      const fetchSpy = vi.spyOn(global, 'fetch');
      render(React.createElement(RpgShareCard, { payload: rawPiiPayload }));

      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });
});
