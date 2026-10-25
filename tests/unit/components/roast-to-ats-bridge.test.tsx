import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RoastReport } from '@/components/roast/RoastReport';
import { RoastData } from '@/lib/schemas/roast';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const sampleRoastData: RoastData = {
  roastScore: 42,
  overallScore: 42,
  survivalScore: 35,
  funnyTitle: 'Chiến Thần Rải CV',
  tone: 'spicy',
  summaryVerdict: 'CV này nhìn như bản nháp chưa kịp sửa lỗi chính tả.',
  topStrengths: ['Biết dùng Git cơ bản'],
  weaknesses: [
    {
      quote: 'Tham gia phát triển dự án',
      issue: 'Mơ hồ, không có kết quả đo lường',
      severity: 'Cao',
      rejectionReason: 'HR không thấy bạn đóng góp được gì cụ thể',
      fixGuideline: 'Áp dụng công thức Google XYZ: Đạt được [X] đo bằng [Y]',
    },
  ],
  atsRecommendations: [
    {
      category: 'Từ khóa',
      recommendation: 'Bổ sung thêm từ khóa về công nghệ frontend',
      impact: 'Quan trọng',
    },
  ],
  disclaimer: 'Kết quả chỉ mang tính tham khảo.',
};

describe('RoastReport to ATS Diff Funnel Bridge Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('renders prominent ATS Simulator Bridge Card right beneath Hero verdict', () => {
    render(
      <RoastReport
        data={sampleRoastData}
        cvText="Dòng 1 kinh nghiệm\nDòng 2 kinh nghiệm"
        targetRole="Frontend Engineer"
        onReset={vi.fn()}
        onChangeTone={vi.fn()}
        onEditCv={vi.fn()}
      />
    );

    expect(screen.getByText(/Cầu nối cứu nguy hồ sơ xin việc \(ATS Simulator\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Cười xong rồi\? Đừng để CV bị HR & ATS gạt bỏ sau 6 giây!/i)).toBeInTheDocument();
    expect(screen.getByTestId('hero-go-to-ats-diff-btn')).toBeInTheDocument();
  });

  it('saves cvText and targetRole into sessionStorage and navigates to /ats-diff when clicking hero bridge button', () => {
    const onGoToAtsDiff = vi.fn();
    render(
      <RoastReport
        data={sampleRoastData}
        cvText="Kinh nghiệm làm React và Next.js"
        targetRole="Frontend Engineer"
        onReset={vi.fn()}
        onChangeTone={vi.fn()}
        onEditCv={vi.fn()}
        onGoToAtsDiff={onGoToAtsDiff}
      />
    );

    const bridgeBtn = screen.getByTestId('hero-go-to-ats-diff-btn');
    fireEvent.click(bridgeBtn);

    // Verify sessionStorage was populated
    const stored = sessionStorage.getItem('airoastcv_diff_context');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.cvText).toBe('Kinh nghiệm làm React và Next.js');
    expect(parsed.targetRole).toBe('Frontend Engineer');

    // Verify callback and router navigation
    expect(onGoToAtsDiff).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/ats-diff');
  });

  it('saves context and navigates when clicking toolbar ATS button', () => {
    render(
      <RoastReport
        data={sampleRoastData}
        cvText="Kinh nghiệm lập trình Backend"
        targetRole="Backend Engineer"
        onReset={vi.fn()}
        onChangeTone={vi.fn()}
        onEditCv={vi.fn()}
      />
    );

    const toolbarBtn = screen.getByTestId('toolbar-go-to-ats-diff-btn');
    fireEvent.click(toolbarBtn);

    const stored = sessionStorage.getItem('airoastcv_diff_context');
    expect(stored).not.toBeNull();
    expect(mockPush).toHaveBeenCalledWith('/ats-diff');
  });
});
