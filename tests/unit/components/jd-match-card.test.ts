import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JdMatchCard } from '@/components/roast/JdMatchCard';
import { RoastReport } from '@/components/roast/RoastReport';
import { JdMatchData, RoastData } from '@/lib/schemas/roast';
import { PRO_STORAGE_KEY, setClientProStatus, PRO_STATUS_EVENT } from '@/lib/payment/entitlement';
import { WIPE_DATA_EVENT_NAME, wipeAllSessionData } from '@/lib/storage/wipe-data';

describe('JdMatchCard Component & Freemium Gate (Milestone 3)', () => {
  const sampleJdMatch: JdMatchData = {
    matchScore: 82,
    breakdown: {
      hardSkillsMatch: 85,
      experienceMatch: 80,
      cultureMatch: 75,
    },
    missingKeywords: ['Docker', 'Kubernetes', 'Redis', 'Kafka', 'CI/CD'],
    tailoredRecommendations: [
      'Chủ trì phát triển module đặt hàng, tích hợp [Redis caching] giúp giảm thời gian phản hồi [45%].',
      'Đóng gói ứng dụng thành [Docker container] và thiết lập pipeline [CI/CD với GitHub Actions].',
    ],
  };

  const mockRoastDataWithJd: RoastData = {
    overallScore: 75,
    tone: 'spicy',
    summaryVerdict: 'CV bám sát JD nhưng còn thiếu một số từ khóa trọng điểm.',
    topStrengths: ['Kiến thức React tốt'],
    weaknesses: [
      {
        quote: 'Làm việc với React',
        issue: 'Chưa có số liệu',
        severity: 'Cao',
        rejectionReason: 'Thiếu kết quả đo lường',
        fixGuideline: 'Tối ưu hiệu năng [20%].',
      },
    ],
    atsRecommendations: [
      {
        category: 'Từ khóa',
        recommendation: 'Bổ sung từ khóa chuyên môn',
        impact: 'Quan trọng',
      },
    ],
    jdMatch: sampleJdMatch,
    disclaimer: 'Chỉ mang tính chất tham khảo.',
  };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe('1. Gauge & Progress Bars Rendering', () => {
    it('renders circular score gauge with correct match score and status chip', () => {
      render(
        React.createElement(JdMatchCard, {
          jdMatch: sampleJdMatch,
          targetRole: 'Backend Fresher',
          onOpenCheckout: vi.fn(),
        })
      );

      // Match score percentage
      expect(screen.getByTestId('gauge-score-value')).toHaveTextContent('82%');
      expect(screen.getByText(/chỉ số tương thích tổng thể/i)).toBeInTheDocument();

      // Status chip for 82 (>= 75 is "Tương thích tốt")
      const statusChip = screen.getByTestId('score-status-chip');
      expect(statusChip).toHaveTextContent('Tương thích tốt');

      // Target role
      expect(screen.getByText('Backend Fresher')).toBeInTheDocument();
    });

    it('renders 3 detail progress bars with correct labels and percentages', () => {
      render(
        React.createElement(JdMatchCard, {
          jdMatch: sampleJdMatch,
          onOpenCheckout: vi.fn(),
        })
      );

      // Kỹ năng cứng
      const hardSkillsBar = screen.getByRole('progressbar', { name: /kỹ năng cứng/i });
      expect(hardSkillsBar).toHaveAttribute('aria-valuenow', '85');
      expect(screen.getByText('85%')).toBeInTheDocument();

      // Kinh nghiệm dự án
      const experienceBar = screen.getByRole('progressbar', { name: /kinh nghiệm dự án/i });
      expect(experienceBar).toHaveAttribute('aria-valuenow', '80');
      expect(screen.getByText('80%')).toBeInTheDocument();

      // Phù hợp văn hóa
      const cultureBar = screen.getByRole('progressbar', { name: /phù hợp văn hóa/i });
      expect(cultureBar).toHaveAttribute('aria-valuenow', '75');
      expect(screen.getByText('75%')).toBeInTheDocument();
    });
  });

  describe('2. Free Tier: Keywords & Recommendations Freemium Gate', () => {
    it('renders top 3 keywords unblurred and remaining keywords blurred with upgrade chip', () => {
      render(
        React.createElement(JdMatchCard, {
          jdMatch: sampleJdMatch,
          onOpenCheckout: vi.fn(),
        })
      );

      // Top 3 keywords rendered unblurred
      expect(screen.getByTestId('top-keyword-0')).toHaveTextContent('Docker');
      expect(screen.getByTestId('top-keyword-1')).toHaveTextContent('Kubernetes');
      expect(screen.getByTestId('top-keyword-2')).toHaveTextContent('Redis');

      // Remaining 2 keywords are inside blurred container
      const blurredWrapper = screen.getByTestId('blurred-keywords-wrapper');
      expect(blurredWrapper).toBeInTheDocument();

      const blurredContent = screen.getByTestId('blurred-keywords-content');
      expect(blurredContent).toHaveClass('blur-sm');
      expect(blurredContent).toHaveTextContent('Kafka');
      expect(blurredContent).toHaveTextContent('CI/CD');

      // Padlock chip with count
      const unlockChip = screen.getByTestId('unlock-keywords-cta');
      expect(unlockChip).toHaveTextContent('+2 từ khóa ẩn (Gói Pro)');
    });

    it('blurs tailored recommendations and displays Pro 29k upgrade CTA', () => {
      render(
        React.createElement(JdMatchCard, {
          jdMatch: sampleJdMatch,
          onOpenCheckout: vi.fn(),
        })
      );

      const freeGate = screen.getByTestId('free-recommendations-gate');
      expect(freeGate).toBeInTheDocument();

      // Blurred recommendations content
      const blurredContent = screen.getByTestId('blurred-recommendations-content');
      expect(blurredContent).toHaveClass('blur-sm');

      // Upgrade CTA button with exact required text
      const ctaBtn = screen.getByTestId('unlock-pro-cta-button');
      expect(ctaBtn).toHaveTextContent(
        'Mở khóa toàn bộ gợi ý ATS & câu hỏi phỏng vấn với Gói Pro 29k'
      );
    });

    it('calls onOpenCheckout when user clicks the upgrade CTA or unlock chip', async () => {
      const user = userEvent.setup();
      const onOpenCheckoutMock = vi.fn();

      render(
        React.createElement(JdMatchCard, {
          jdMatch: sampleJdMatch,
          onOpenCheckout: onOpenCheckoutMock,
        })
      );

      // Click upgrade CTA button
      const ctaBtn = screen.getByTestId('unlock-pro-cta-button');
      await user.click(ctaBtn);
      expect(onOpenCheckoutMock).toHaveBeenCalledTimes(1);

      // Click hidden keywords chip
      const unlockKeywordsChip = screen.getByTestId('unlock-keywords-cta');
      await user.click(unlockKeywordsChip);
      expect(onOpenCheckoutMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('3. Pro Tier: 100% Unlocked Experience', () => {
    it('reveals all missing keywords unblurred for Pro user', () => {
      localStorage.setItem(PRO_STORAGE_KEY, 'true');

      render(
        React.createElement(JdMatchCard, {
          jdMatch: sampleJdMatch,
          onOpenCheckout: vi.fn(),
        })
      );

      // No blurred keywords wrapper
      expect(screen.queryByTestId('blurred-keywords-wrapper')).not.toBeInTheDocument();
      expect(screen.queryByTestId('unlock-keywords-cta')).not.toBeInTheDocument();

      // All 5 keywords rendered directly
      expect(screen.getByTestId('keyword-item-0')).toHaveTextContent('Docker');
      expect(screen.getByTestId('keyword-item-1')).toHaveTextContent('Kubernetes');
      expect(screen.getByTestId('keyword-item-2')).toHaveTextContent('Redis');
      expect(screen.getByTestId('keyword-item-3')).toHaveTextContent('Kafka');
      expect(screen.getByTestId('keyword-item-4')).toHaveTextContent('CI/CD');
    });

    it('reveals all tailored recommendations with highlighted placeholders for Pro user', () => {
      localStorage.setItem(PRO_STORAGE_KEY, 'true');

      render(
        React.createElement(JdMatchCard, {
          jdMatch: sampleJdMatch,
          onOpenCheckout: vi.fn(),
        })
      );

      // No free gate with lock
      expect(screen.queryByTestId('free-recommendations-gate')).not.toBeInTheDocument();
      expect(screen.queryByTestId('unlock-pro-cta-button')).not.toBeInTheDocument();

      // Pro recommendations visible
      const proList = screen.getByTestId('pro-recommendations');
      expect(proList).toBeInTheDocument();
      expect(screen.getByTestId('recommendation-item-0')).toHaveTextContent(
        'Chủ trì phát triển module đặt hàng'
      );
      expect(screen.getByText('[Redis caching]')).toBeInTheDocument();
      expect(screen.getByText('[45%]')).toBeInTheDocument();
      expect(screen.getByText('[Docker container]')).toBeInTheDocument();
    });
  });

  describe('4. Edge Cases & Boundary Values', () => {
    it('handles 0 match score with "Độ lệch cao" status and 0% progress bars', () => {
      const zeroJdMatch: JdMatchData = {
        matchScore: 0,
        breakdown: {
          hardSkillsMatch: 0,
          experienceMatch: 0,
          cultureMatch: 0,
        },
        missingKeywords: ['React', 'TypeScript'],
        tailoredRecommendations: ['Bổ sung kỹ năng [React] vào dự án.'],
      };

      render(
        React.createElement(JdMatchCard, {
          jdMatch: zeroJdMatch,
          onOpenCheckout: vi.fn(),
        })
      );

      expect(screen.getByTestId('gauge-score-value')).toHaveTextContent('0%');
      expect(screen.getByTestId('score-status-chip')).toHaveTextContent('Độ lệch cao');

      const hardSkillsBar = screen.getByRole('progressbar', { name: /kỹ năng cứng/i });
      expect(hardSkillsBar).toHaveAttribute('aria-valuenow', '0');
    });

    it('handles 100 match score with "Tương thích tốt" status and 100% progress bars', () => {
      const perfectJdMatch: JdMatchData = {
        matchScore: 100,
        breakdown: {
          hardSkillsMatch: 100,
          experienceMatch: 100,
          cultureMatch: 100,
        },
        missingKeywords: [],
        tailoredRecommendations: [],
      };

      render(
        React.createElement(JdMatchCard, {
          jdMatch: perfectJdMatch,
          onOpenCheckout: vi.fn(),
        })
      );

      expect(screen.getByTestId('gauge-score-value')).toHaveTextContent('100%');
      expect(screen.getByTestId('score-status-chip')).toHaveTextContent('Tương thích tốt');

      const hardSkillsBar = screen.getByRole('progressbar', { name: /kỹ năng cứng/i });
      expect(hardSkillsBar).toHaveAttribute('aria-valuenow', '100');

      // Empty keywords state
      expect(
        screen.getByText(/không phát hiện từ khóa kỹ thuật then chốt nào bị thiếu/i)
      ).toBeInTheDocument();
    });

    it('handles intermediate match score (62) with "Độ lệch trung bình"', () => {
      const midJdMatch: JdMatchData = {
        matchScore: 62,
        breakdown: {
          hardSkillsMatch: 60,
          experienceMatch: 65,
          cultureMatch: 60,
        },
        missingKeywords: ['Node.js'],
        tailoredRecommendations: ['Cần bổ sung [Node.js].'],
      };

      render(
        React.createElement(JdMatchCard, {
          jdMatch: midJdMatch,
          onOpenCheckout: vi.fn(),
        })
      );

      expect(screen.getByTestId('gauge-score-value')).toHaveTextContent('62%');
      expect(screen.getByTestId('score-status-chip')).toHaveTextContent('Độ lệch trung bình');
    });

    it('handles exactly 3 keywords without rendering blurred chip', () => {
      const exactThreeMatch: JdMatchData = {
        matchScore: 70,
        breakdown: {
          hardSkillsMatch: 70,
          experienceMatch: 70,
          cultureMatch: 70,
        },
        missingKeywords: ['AWS', 'GCP', 'Azure'],
        tailoredRecommendations: ['Học thêm điện toán đám mây.'],
      };

      render(
        React.createElement(JdMatchCard, {
          jdMatch: exactThreeMatch,
          onOpenCheckout: vi.fn(),
        })
      );

      expect(screen.getByTestId('top-keyword-0')).toHaveTextContent('AWS');
      expect(screen.getByTestId('top-keyword-1')).toHaveTextContent('GCP');
      expect(screen.getByTestId('top-keyword-2')).toHaveTextContent('Azure');

      // No blurred keywords wrapper because length <= 3
      expect(screen.queryByTestId('blurred-keywords-wrapper')).not.toBeInTheDocument();
      expect(screen.queryByTestId('unlock-keywords-cta')).not.toBeInTheDocument();
    });

    it('clamps scores that exceed 100 or drop below 0 safely', () => {
      const clampedMatch: JdMatchData = {
        matchScore: 125,
        breakdown: {
          hardSkillsMatch: -15,
          experienceMatch: 150,
          cultureMatch: 80,
        },
        missingKeywords: ['Python'],
        tailoredRecommendations: ['Bổ sung [Python].'],
      };

      render(
        React.createElement(JdMatchCard, {
          jdMatch: clampedMatch,
          onOpenCheckout: vi.fn(),
        })
      );

      expect(screen.getByTestId('gauge-score-value')).toHaveTextContent('100%');

      const hardSkillsBar = screen.getByRole('progressbar', { name: /kỹ năng cứng/i });
      expect(hardSkillsBar).toHaveAttribute('aria-valuenow', '0');

      const expBar = screen.getByRole('progressbar', { name: /kinh nghiệm dự án/i });
      expect(expBar).toHaveAttribute('aria-valuenow', '100');
    });
  });

  describe('5. Integration in RoastReport', () => {
    it('renders JdMatchCard inside RoastReport when data.jdMatch is present', () => {
      render(
        React.createElement(RoastReport, {
          data: mockRoastDataWithJd,
          targetRole: 'Backend Engineer',
          onReset: vi.fn(),
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );

      expect(screen.getByTestId('jd-match-card')).toBeInTheDocument();
      expect(screen.getByText(/phân tích độ lệch jd & lỗ hổng kỹ năng/i)).toBeInTheDocument();
      expect(screen.getByTestId('gauge-score-value')).toHaveTextContent('82%');
    });

    it('does NOT render JdMatchCard when data.jdMatch is undefined', () => {
      const mockRoastDataWithoutJd: RoastData = {
        ...mockRoastDataWithJd,
        jdMatch: undefined,
      };

      render(
        React.createElement(RoastReport, {
          data: mockRoastDataWithoutJd,
          onReset: vi.fn(),
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );

      expect(screen.queryByTestId('jd-match-card')).not.toBeInTheDocument();
    });

    it('opens CheckoutModal when clicking upgrade CTA inside JdMatchCard in RoastReport', async () => {
      const user = userEvent.setup();

      render(
        React.createElement(RoastReport, {
          data: mockRoastDataWithJd,
          onReset: vi.fn(),
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );

      const ctaBtn = screen.getByTestId('unlock-pro-cta-button');
      await user.click(ctaBtn);

      // CheckoutModal opens
      await waitFor(() => {
        expect(screen.getByText(/nâng cấp gói pro/i)).toBeInTheDocument();
      });
    });
  });

  describe('6. Adversarial State Switching Challenge (Free -> Pro -> Wipe Data -> Free)', () => {
    it('switches state dynamically: Free (blur & top 3) -> Pro (unblur & 100%) -> Wipe Data (re-blur & top 3)', () => {
      render(
        React.createElement(JdMatchCard, {
          jdMatch: sampleJdMatch,
          onOpenCheckout: vi.fn(),
        })
      );

      // Phase 1: Free Tier State
      expect(screen.getByTestId('free-recommendations-gate')).toBeInTheDocument();
      expect(screen.getByTestId('blurred-recommendations-content')).toHaveClass('blur-sm');
      expect(screen.getByTestId('unlock-pro-cta-button')).toBeInTheDocument();
      expect(screen.queryByTestId('pro-recommendations')).not.toBeInTheDocument();

      // Verify unblurred keywords count is exactly 3
      expect(screen.getByTestId('top-keyword-0')).toHaveTextContent('Docker');
      expect(screen.getByTestId('top-keyword-1')).toHaveTextContent('Kubernetes');
      expect(screen.getByTestId('top-keyword-2')).toHaveTextContent('Redis');
      expect(screen.queryByTestId('top-keyword-3')).not.toBeInTheDocument();

      // Blurred wrapper with exactly 2 hidden keywords
      expect(screen.getByTestId('blurred-keywords-wrapper')).toBeInTheDocument();
      expect(screen.getByTestId('unlock-keywords-cta')).toHaveTextContent('+2 từ khóa ẩn (Gói Pro)');

      // Phase 2: User Activates Pro License
      act(() => {
        setClientProStatus(true, 'AIROAST-PRO-VALID-KEY');
      });

      // Verify blur overlay disappears
      expect(screen.queryByTestId('free-recommendations-gate')).not.toBeInTheDocument();
      expect(screen.queryByTestId('blurred-recommendations-content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('unlock-pro-cta-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('blurred-keywords-wrapper')).not.toBeInTheDocument();
      expect(screen.queryByTestId('unlock-keywords-cta')).not.toBeInTheDocument();

      // Verify 100% of keywords are visible
      expect(screen.getByTestId('keyword-item-0')).toHaveTextContent('Docker');
      expect(screen.getByTestId('keyword-item-1')).toHaveTextContent('Kubernetes');
      expect(screen.getByTestId('keyword-item-2')).toHaveTextContent('Redis');
      expect(screen.getByTestId('keyword-item-3')).toHaveTextContent('Kafka');
      expect(screen.getByTestId('keyword-item-4')).toHaveTextContent('CI/CD');

      // Verify 100% of recommendations are visible
      expect(screen.getByTestId('pro-recommendations')).toBeInTheDocument();
      expect(screen.getByTestId('recommendation-item-0')).toHaveTextContent('Redis caching');
      expect(screen.getByTestId('recommendation-item-1')).toHaveTextContent('Docker container');

      // Phase 3: User Wipes Data (WIPE_DATA_EVENT_NAME)
      act(() => {
        wipeAllSessionData();
      });

      // Verify Pro state resets in storage
      expect(localStorage.getItem(PRO_STORAGE_KEY)).toBeNull();

      // Verify blur overlay re-activates
      expect(screen.getByTestId('free-recommendations-gate')).toBeInTheDocument();
      expect(screen.getByTestId('blurred-recommendations-content')).toHaveClass('blur-sm');
      expect(screen.getByTestId('unlock-pro-cta-button')).toBeInTheDocument();
      expect(screen.queryByTestId('pro-recommendations')).not.toBeInTheDocument();

      // Verify unblurred keywords count resets to exactly 3
      expect(screen.getByTestId('top-keyword-0')).toHaveTextContent('Docker');
      expect(screen.getByTestId('top-keyword-1')).toHaveTextContent('Kubernetes');
      expect(screen.getByTestId('top-keyword-2')).toHaveTextContent('Redis');
      expect(screen.queryByTestId('top-keyword-3')).not.toBeInTheDocument();

      // Padlock chip is restored
      expect(screen.getByTestId('blurred-keywords-wrapper')).toBeInTheDocument();
      expect(screen.getByTestId('unlock-keywords-cta')).toHaveTextContent('+2 từ khóa ẩn (Gói Pro)');
    });

    it('handles direct CustomEvent dispatching of WIPE_DATA_EVENT_NAME without helper wrapper', () => {
      // Start in Pro state
      localStorage.setItem(PRO_STORAGE_KEY, 'true');

      render(
        React.createElement(JdMatchCard, {
          jdMatch: sampleJdMatch,
          onOpenCheckout: vi.fn(),
        })
      );

      // Initially Pro
      expect(screen.getByTestId('pro-recommendations')).toBeInTheDocument();
      expect(screen.queryByTestId('free-recommendations-gate')).not.toBeInTheDocument();
      expect(screen.getByTestId('keyword-item-4')).toHaveTextContent('CI/CD');

      // Dispatch raw WIPE_DATA_EVENT_NAME
      act(() => {
        window.dispatchEvent(
          new CustomEvent(WIPE_DATA_EVENT_NAME, {
            detail: { timestamp: Date.now() },
          })
        );
      });

      // Blur overlay re-activates
      expect(screen.getByTestId('free-recommendations-gate')).toBeInTheDocument();
      expect(screen.queryByTestId('pro-recommendations')).not.toBeInTheDocument();

      // Top 3 keywords only
      expect(screen.getByTestId('top-keyword-0')).toHaveTextContent('Docker');
      expect(screen.getByTestId('top-keyword-1')).toHaveTextContent('Kubernetes');
      expect(screen.getByTestId('top-keyword-2')).toHaveTextContent('Redis');
      expect(screen.queryByTestId('top-keyword-3')).not.toBeInTheDocument();
      expect(screen.getByTestId('unlock-keywords-cta')).toHaveTextContent('+2 từ khóa ẩn (Gói Pro)');
    });

    it('resists rapid multi-cycle state flapping (Free -> Pro -> Wipe -> Pro -> Wipe -> Pro)', () => {
      render(
        React.createElement(JdMatchCard, {
          jdMatch: sampleJdMatch,
          onOpenCheckout: vi.fn(),
        })
      );

      for (let cycle = 1; cycle <= 3; cycle++) {
        // Toggle to Pro
        act(() => {
          setClientProStatus(true, `KEY-${cycle}`);
        });
        expect(screen.queryByTestId('free-recommendations-gate')).not.toBeInTheDocument();
        expect(screen.getByTestId('pro-recommendations')).toBeInTheDocument();
        expect(screen.getByTestId('keyword-item-4')).toBeInTheDocument();

        // Toggle to Free via Wipe
        act(() => {
          wipeAllSessionData();
        });
        expect(screen.getByTestId('free-recommendations-gate')).toBeInTheDocument();
        expect(screen.queryByTestId('pro-recommendations')).not.toBeInTheDocument();
        expect(screen.getByTestId('top-keyword-2')).toBeInTheDocument();
        expect(screen.queryByTestId('top-keyword-3')).not.toBeInTheDocument();
      }
    });

    it('maintains keyword boundary constraints (<3, ==3, >3) across state transitions', () => {
      const eightKeywordMatch: JdMatchData = {
        ...sampleJdMatch,
        missingKeywords: ['K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7', 'K8'],
      };

      const { unmount } = render(
        React.createElement(JdMatchCard, {
          jdMatch: eightKeywordMatch,
          onOpenCheckout: vi.fn(),
        })
      );

      // Free: Top 3 unblurred, 5 blurred
      expect(screen.getByTestId('top-keyword-0')).toHaveTextContent('K1');
      expect(screen.getByTestId('top-keyword-1')).toHaveTextContent('K2');
      expect(screen.getByTestId('top-keyword-2')).toHaveTextContent('K3');
      expect(screen.queryByTestId('top-keyword-3')).not.toBeInTheDocument();
      expect(screen.getByTestId('unlock-keywords-cta')).toHaveTextContent('+5 từ khóa ẩn (Gói Pro)');

      // Activate Pro
      act(() => {
        setClientProStatus(true, 'PRO-EIGHT');
      });
      for (let i = 0; i < 8; i++) {
        expect(screen.getByTestId(`keyword-item-${i}`)).toHaveTextContent(`K${i + 1}`);
      }

      // Wipe data -> reset
      act(() => {
        wipeAllSessionData();
      });
      expect(screen.getByTestId('top-keyword-0')).toHaveTextContent('K1');
      expect(screen.getByTestId('top-keyword-1')).toHaveTextContent('K2');
      expect(screen.getByTestId('top-keyword-2')).toHaveTextContent('K3');
      expect(screen.queryByTestId('top-keyword-3')).not.toBeInTheDocument();
      expect(screen.getByTestId('unlock-keywords-cta')).toHaveTextContent('+5 từ khóa ẩn (Gói Pro)');

      unmount();
    });

    it('preserves full parent state in RoastReport across Pro activation and data wipe cycles', () => {
      render(
        React.createElement(RoastReport, {
          data: mockRoastDataWithJd,
          targetRole: 'Backend Engineer',
          onReset: vi.fn(),
          onChangeTone: vi.fn(),
          onEditCv: vi.fn(),
        })
      );

      // Starts Free
      expect(screen.getByTestId('free-recommendations-gate')).toBeInTheDocument();
      expect(screen.getByTestId('top-keyword-0')).toHaveTextContent('Docker');

      // Activate Pro
      act(() => {
        setClientProStatus(true, 'REPORT-PRO-KEY');
      });
      expect(screen.queryByTestId('free-recommendations-gate')).not.toBeInTheDocument();
      expect(screen.getByTestId('pro-recommendations')).toBeInTheDocument();
      expect(screen.getByTestId('keyword-item-4')).toHaveTextContent('CI/CD');

      // Wipe data
      act(() => {
        wipeAllSessionData();
      });
      expect(screen.getByTestId('free-recommendations-gate')).toBeInTheDocument();
      expect(screen.queryByTestId('pro-recommendations')).not.toBeInTheDocument();
      expect(screen.getByTestId('top-keyword-0')).toHaveTextContent('Docker');
    });
  });
});
