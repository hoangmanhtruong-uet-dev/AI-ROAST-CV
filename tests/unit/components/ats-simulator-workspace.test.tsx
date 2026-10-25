import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ATSSimulatorWorkspace } from '@/components/ats-diff/ATSSimulatorWorkspace';
import * as entitlementModule from '@/lib/payment/entitlement';

// Mock Web Worker / PII Vault
vi.mock('@/lib/security/usePIIVault', () => ({
  usePIIVault: () => ({
    maskText: vi.fn().mockImplementation(async (text: string) => text),
    unmaskText: vi.fn().mockImplementation((text: string) => text),
    isScrubbing: false,
    stats: { totalMasked: 0 },
  }),
}));

// Mock Sound Engine
vi.mock('@/lib/audio/sound-engine', () => ({
  soundEngine: {
    playBlip: vi.fn(),
    playSuccess: vi.fn(),
    playTick: vi.fn(),
    playWarning: vi.fn(),
  },
}));

describe('ATSSimulatorWorkspace Funnel & Freemium Experience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it('renders initial inputs with default state and privacy guarantee', () => {
    render(<ATSSimulatorWorkspace />);

    expect(screen.getByText(/Cơ chế Zero-Retention PII/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Dán nội dung JD vào đây/i)).toBeInTheDocument();
    expect(screen.getByText(/Các gạch đầu dòng kinh nghiệm trong CV/i)).toBeInTheDocument();
    expect(screen.getByText(/Bắt đầu Quét ATS & Roast/i)).toBeInTheDocument();
  });

  it('hydrates cvText and jdText from sessionStorage when user navigates from Roast page', () => {
    sessionStorage.setItem(
      'airoastcv_diff_context',
      JSON.stringify({
        cvText: `Nguyễn Văn A\n0987654321\n• Phát triển hệ thống microservices phục vụ 100,000 người dùng\n• Tối ưu hóa truy vấn cơ sở dữ liệu PostgreSQL giảm 40% latency\n• Thiết lập CI/CD pipeline tự động với GitHub Actions`,
        jdText: 'Tuyển dụng Backend Engineer Golang / PostgreSQL',
        targetRole: 'Backend Engineer',
      })
    );

    render(<ATSSimulatorWorkspace />);

    // Should display notice that CV was auto-loaded
    expect(screen.getByText(/Đã tự động nạp CV từ lượt Roast của bạn/i)).toBeInTheDocument();

    // Check JD textarea
    const jdTextarea = screen.getByPlaceholderText(/Dán nội dung JD vào đây/i) as HTMLTextAreaElement;
    expect(jdTextarea.value).toContain('Tuyển dụng Backend Engineer Golang');
  });

  it('allows adding and removing experience bullet points', () => {
    render(<ATSSimulatorWorkspace />);

    // Add bullet button
    const addButton = screen.getByText(/Thêm gạch đầu dòng kinh nghiệm/i);
    fireEvent.click(addButton);

    // Initial 3 + 1 new = 4 inputs
    const inputs = screen.getAllByPlaceholderText(/Ví dụ: Phát triển tính năng/i);
    expect(inputs.length).toBe(4);

    // Remove one bullet
    const deleteButtons = screen.getAllByTitle(/Xóa câu này/i);
    expect(deleteButtons.length).toBeGreaterThan(0);
    fireEvent.click(deleteButtons[0]);

    const inputsAfterDelete = screen.getAllByPlaceholderText(/Ví dụ: Phát triển tính năng/i);
    expect(inputsAfterDelete.length).toBe(3);
  });

  it('allows switching to batch paste mode and automatically parsing bullets', () => {
    render(<ATSSimulatorWorkspace />);

    const batchModeToggle = screen.getByText(/Dán nhanh đoạn văn bản/i);
    fireEvent.click(batchModeToggle);

    const batchTextarea = screen.getByPlaceholderText(/Dán toàn bộ phần kinh nghiệm/i);
    fireEvent.change(batchTextarea, {
      target: {
        value: `- Lập trình frontend với Next.js và Tailwind CSS\n- Tích hợp cổng thanh toán VietQR và SePay Webhook\n- Viết unit test đạt độ phủ 95%`,
      },
    });

    const parseBtn = screen.getByText(/Tự động phân tách thành các gạch đầu dòng/i);
    fireEvent.click(parseBtn);

    // Returns to list view with parsed bullets
    const inputs = screen.getAllByPlaceholderText(/Ví dụ: Phát triển tính năng/i) as HTMLInputElement[];
    expect(inputs.length).toBe(3);
    expect(inputs[0].value).toContain('Lập trình frontend với Next.js');
    expect(inputs[1].value).toContain('Tích hợp cổng thanh toán VietQR');
  });

  it('executes ATS simulation and applies freemium gating for free users (> 2 patches)', async () => {
    // Mock fetch for /api/ats-roast
    const mockApiResponse = {
      atsMetrics: {
        beforeScore: 45,
        afterScore: 92,
        knockoutFlags: ['Thiếu định lượng kết quả trong các dự án'],
        missingKeywords: [
          { keyword: 'Next.js App Router', importance: 'critical', category: 'hard_skill' },
          { keyword: 'Web Vitals', importance: 'recommended', category: 'tool' },
        ],
      },
      patches: [
        {
          bulletId: 'bullet-1',
          roastComment: 'Câu này quá chung chung, không có số liệu.',
          suggestedText: 'Tối ưu hóa module giao diện với Next.js giúp tăng [35%] tốc độ hiển thị.',
          addedKeywords: ['Next.js'],
          impactLevel: 'high',
        },
        {
          bulletId: 'bullet-2',
          roastComment: 'Sửa lỗi cho ai? Bao nhiêu lỗi mỗi tuần?',
          suggestedText: 'Giải quyết [150+] lỗi giao diện người dùng, giảm [25%] tỷ lệ khiếu nại.',
          addedKeywords: ['UI Debugging'],
          impactLevel: 'medium',
        },
        {
          bulletId: 'bullet-3',
          roastComment: 'Hỗ trợ đồng nghiệp là công việc cơ bản, không có gì nổi bật.',
          suggestedText: 'Chủ trì hướng dẫn [3] kỹ sư fresher hoàn thành dự án đúng hạn [100%].',
          addedKeywords: ['Mentorship'],
          impactLevel: 'high',
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    } as any);

    render(<ATSSimulatorWorkspace />);

    const runBtn = screen.getByText(/Bắt đầu Quét ATS & Roast/i);
    fireEvent.click(runBtn);

    await waitFor(() => {
      expect(screen.getByText(/Báo cáo Phân tích ATS & Bản vá Google XYZ/i)).toBeInTheDocument();
    });

    // Check Metrics & Flags
    expect(screen.getByText(/Thiếu định lượng kết quả trong các dự án/i)).toBeInTheDocument();
    expect(screen.getByText(/Next.js App Router/i)).toBeInTheDocument();

    // First two patches are unlocked
    expect(screen.getByText(/Câu này quá chung chung/i)).toBeInTheDocument();
    expect(screen.getByText(/Sửa lỗi cho ai/i)).toBeInTheDocument();

    // Third patch is locked behind VietQR Pro paywall for free tier
    expect(screen.getByText(/Câu kinh nghiệm #3 chuẩn Google XYZ \(Bản vá Pro\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Mở khóa Pro 29k \(VietQR 3 giây\)/i)).toBeInTheDocument();
  });

  it('renders all patches unlocked for Pro users without lock overlay', async () => {
    // Spy useProTier to return isPro: true
    vi.spyOn(entitlementModule, 'useProTier').mockReturnValue({
      isPro: true,
      tier: 'master',
      isMaster: true,
      isStarter: false,
      licenseKey: 'PRO-1234-5678',
      isReady: true,
      activatePro: vi.fn(),
      clearPro: vi.fn(),
    } as any);

    const mockApiResponse = {
      atsMetrics: {
        beforeScore: 50,
        afterScore: 95,
        knockoutFlags: [],
        missingKeywords: [],
      },
      patches: [
        {
          bulletId: 'bullet-1',
          roastComment: 'Roast 1',
          suggestedText: 'Suggested 1',
          addedKeywords: [],
          impactLevel: 'high',
        },
        {
          bulletId: 'bullet-2',
          roastComment: 'Roast 2',
          suggestedText: 'Suggested 2',
          addedKeywords: [],
          impactLevel: 'medium',
        },
        {
          bulletId: 'bullet-3',
          roastComment: 'Roast 3',
          suggestedText: 'Suggested 3',
          addedKeywords: [],
          impactLevel: 'high',
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    } as any);

    render(<ATSSimulatorWorkspace />);

    // Pro badge in banner
    expect(screen.getByText(/Gói PRO đã kích hoạt/i)).toBeInTheDocument();

    const runBtn = screen.getByText(/Bắt đầu Quét ATS & Roast/i);
    fireEvent.click(runBtn);

    await waitFor(() => {
      expect(screen.getByText(/Báo cáo Phân tích ATS & Bản vá Google XYZ/i)).toBeInTheDocument();
    });

    // All 3 roast comments are visible, no lock banner
    expect(screen.getByText(/Roast 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Roast 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Roast 3/i)).toBeInTheDocument();
    expect(screen.queryByText(/Bản vá Pro/i)).toBeNull();
  });

  it('renders Next Step bridge to /interview at the bottom of result screen', async () => {
    const mockApiResponse = {
      atsMetrics: { beforeScore: 60, afterScore: 90, knockoutFlags: [], missingKeywords: [] },
      patches: [
        { bulletId: 'bullet-1', roastComment: 'Comment', suggestedText: 'Text', addedKeywords: [], impactLevel: 'high' },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    } as any);

    render(<ATSSimulatorWorkspace />);
    fireEvent.click(screen.getByText(/Bắt đầu Quét ATS & Roast/i));

    await waitFor(() => {
      expect(screen.getByText(/CV chuẩn ATS đã sẵn sàng/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Luyện phỏng vấn áp lực ngay/i)).toBeInTheDocument();
  });
});
