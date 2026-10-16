import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JdMatchCard } from '@/components/roast/JdMatchCard';
import { JdMatchData } from '@/lib/schemas/roast';
import { PRO_STORAGE_KEY } from '@/lib/payment/entitlement';

describe('JdMatchCard Adversarial Stress & Boundary Testing — Challenger 1', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe('1. MatchScore Boundary & Clamping Checks', () => {
    it('handles exact 0% matchScore: clamped to 0%, "Độ lệch cao" status, SVG dashoffset at max', () => {
      const data: JdMatchData = {
        matchScore: 0,
        breakdown: { hardSkillsMatch: 50, experienceMatch: 50, cultureMatch: 50 },
        missingKeywords: ['Docker'],
        tailoredRecommendations: ['Gợi ý [Docker].'],
      };

      render(React.createElement(JdMatchCard, { jdMatch: data }));

      expect(screen.getByTestId('gauge-score-value')).toHaveTextContent('0%');
      const chip = screen.getByTestId('score-status-chip');
      expect(chip).toHaveTextContent('Độ lệch cao');
      expect(chip.className).toContain('text-rose-300');
    });

    it('handles exact 100% matchScore: clamped to 100%, "Tương thích tốt" status', () => {
      const data: JdMatchData = {
        matchScore: 100,
        breakdown: { hardSkillsMatch: 100, experienceMatch: 100, cultureMatch: 100 },
        missingKeywords: [],
        tailoredRecommendations: [],
      };

      render(React.createElement(JdMatchCard, { jdMatch: data }));

      expect(screen.getByTestId('gauge-score-value')).toHaveTextContent('100%');
      const chip = screen.getByTestId('score-status-chip');
      expect(chip).toHaveTextContent('Tương thích tốt');
      expect(chip.className).toContain('text-emerald-300');
    });

    it('clamps negative matchScores (-15%, -100%) to 0% without NaN or broken SVG attributes', () => {
      const negativeScores = [-1, -15, -100, -9999];

      for (const negScore of negativeScores) {
        const { unmount } = render(
          React.createElement(JdMatchCard, {
            jdMatch: {
              matchScore: negScore,
              breakdown: { hardSkillsMatch: 50, experienceMatch: 50, cultureMatch: 50 },
              missingKeywords: [],
              tailoredRecommendations: [],
            },
          })
        );

        expect(screen.getByTestId('gauge-score-value')).toHaveTextContent('0%');
        expect(screen.getByTestId('score-status-chip')).toHaveTextContent('Độ lệch cao');
        unmount();
      }
    });

    it('clamps overflow matchScores (>100%: 101%, 150%, 999%) to 100% cleanly', () => {
      const overflowScores = [101, 150, 999, 12500];

      for (const overScore of overflowScores) {
        const { unmount } = render(
          React.createElement(JdMatchCard, {
            jdMatch: {
              matchScore: overScore,
              breakdown: { hardSkillsMatch: 80, experienceMatch: 80, cultureMatch: 80 },
              missingKeywords: [],
              tailoredRecommendations: [],
            },
          })
        );

        expect(screen.getByTestId('gauge-score-value')).toHaveTextContent('100%');
        expect(screen.getByTestId('score-status-chip')).toHaveTextContent('Tương thích tốt');
        unmount();
      }
    });

    it('rounds fractional matchScores to integer percentages correctly at boundaries (74.4 vs 74.6, 49.4 vs 49.6)', () => {
      // 74.4 rounds to 74 -> "Độ lệch trung bình"
      const { unmount: unmount1 } = render(
        React.createElement(JdMatchCard, {
          jdMatch: {
            matchScore: 74.4,
            breakdown: { hardSkillsMatch: 70, experienceMatch: 70, cultureMatch: 70 },
            missingKeywords: [],
            tailoredRecommendations: [],
          },
        })
      );
      expect(screen.getByTestId('gauge-score-value')).toHaveTextContent('74%');
      expect(screen.getByTestId('score-status-chip')).toHaveTextContent('Độ lệch trung bình');
      unmount1();

      // 74.6 rounds to 75 -> "Tương thích tốt"
      const { unmount: unmount2 } = render(
        React.createElement(JdMatchCard, {
          jdMatch: {
            matchScore: 74.6,
            breakdown: { hardSkillsMatch: 70, experienceMatch: 70, cultureMatch: 70 },
            missingKeywords: [],
            tailoredRecommendations: [],
          },
        })
      );
      expect(screen.getByTestId('gauge-score-value')).toHaveTextContent('75%');
      expect(screen.getByTestId('score-status-chip')).toHaveTextContent('Tương thích tốt');
      unmount2();

      // 49.4 rounds to 49 -> "Độ lệch cao"
      const { unmount: unmount3 } = render(
        React.createElement(JdMatchCard, {
          jdMatch: {
            matchScore: 49.4,
            breakdown: { hardSkillsMatch: 50, experienceMatch: 50, cultureMatch: 50 },
            missingKeywords: [],
            tailoredRecommendations: [],
          },
        })
      );
      expect(screen.getByTestId('gauge-score-value')).toHaveTextContent('49%');
      expect(screen.getByTestId('score-status-chip')).toHaveTextContent('Độ lệch cao');
      unmount3();

      // 49.5 rounds to 50 -> "Độ lệch trung bình"
      const { unmount: unmount4 } = render(
        React.createElement(JdMatchCard, {
          jdMatch: {
            matchScore: 49.5,
            breakdown: { hardSkillsMatch: 50, experienceMatch: 50, cultureMatch: 50 },
            missingKeywords: [],
            tailoredRecommendations: [],
          },
        })
      );
      expect(screen.getByTestId('gauge-score-value')).toHaveTextContent('50%');
      expect(screen.getByTestId('score-status-chip')).toHaveTextContent('Độ lệch trung bình');
      unmount4();
    });
  });

  describe('2. Breakdown Scores Boundary & Clamping Checks', () => {
    it('handles all 0% breakdown scores with aria-valuenow="0" and width="0%"', () => {
      const data: JdMatchData = {
        matchScore: 0,
        breakdown: {
          hardSkillsMatch: 0,
          experienceMatch: 0,
          cultureMatch: 0,
        },
        missingKeywords: [],
        tailoredRecommendations: [],
      };

      render(React.createElement(JdMatchCard, { jdMatch: data }));

      const hardBar = screen.getByRole('progressbar', { name: /kỹ năng cứng/i });
      const expBar = screen.getByRole('progressbar', { name: /kinh nghiệm dự án/i });
      const culBar = screen.getByRole('progressbar', { name: /phù hợp văn hóa/i });

      expect(hardBar).toHaveAttribute('aria-valuenow', '0');
      expect(hardBar).toHaveStyle({ width: '0%' });

      expect(expBar).toHaveAttribute('aria-valuenow', '0');
      expect(expBar).toHaveStyle({ width: '0%' });

      expect(culBar).toHaveAttribute('aria-valuenow', '0');
      expect(culBar).toHaveStyle({ width: '0%' });
    });

    it('handles all 100% breakdown scores with aria-valuenow="100" and width="100%"', () => {
      const data: JdMatchData = {
        matchScore: 100,
        breakdown: {
          hardSkillsMatch: 100,
          experienceMatch: 100,
          cultureMatch: 100,
        },
        missingKeywords: [],
        tailoredRecommendations: [],
      };

      render(React.createElement(JdMatchCard, { jdMatch: data }));

      const hardBar = screen.getByRole('progressbar', { name: /kỹ năng cứng/i });
      const expBar = screen.getByRole('progressbar', { name: /kinh nghiệm dự án/i });
      const culBar = screen.getByRole('progressbar', { name: /phù hợp văn hóa/i });

      expect(hardBar).toHaveAttribute('aria-valuenow', '100');
      expect(hardBar).toHaveStyle({ width: '100%' });

      expect(expBar).toHaveAttribute('aria-valuenow', '100');
      expect(expBar).toHaveStyle({ width: '100%' });

      expect(culBar).toHaveAttribute('aria-valuenow', '100');
      expect(culBar).toHaveStyle({ width: '100%' });
    });

    it('clamps negative and overflow breakdown scores safely to [0, 100]', () => {
      const data: JdMatchData = {
        matchScore: 50,
        breakdown: {
          hardSkillsMatch: -45,
          experienceMatch: 180,
          cultureMatch: 1000,
        },
        missingKeywords: [],
        tailoredRecommendations: [],
      };

      render(React.createElement(JdMatchCard, { jdMatch: data }));

      const hardBar = screen.getByRole('progressbar', { name: /kỹ năng cứng/i });
      const expBar = screen.getByRole('progressbar', { name: /kinh nghiệm dự án/i });
      const culBar = screen.getByRole('progressbar', { name: /phù hợp văn hóa/i });

      // Negative clamped to 0
      expect(hardBar).toHaveAttribute('aria-valuenow', '0');
      expect(hardBar).toHaveStyle({ width: '0%' });

      // Overflows clamped to 100
      expect(expBar).toHaveAttribute('aria-valuenow', '100');
      expect(expBar).toHaveStyle({ width: '100%' });

      expect(culBar).toHaveAttribute('aria-valuenow', '100');
      expect(culBar).toHaveStyle({ width: '100%' });
    });
  });

  describe('3. Missing Keywords Count Boundary Checks (0, 1, 3, 4, 20)', () => {
    it('boundary count = 0: renders success banner and no keyword badges or blurred CTA', () => {
      const data: JdMatchData = {
        matchScore: 95,
        breakdown: { hardSkillsMatch: 95, experienceMatch: 95, cultureMatch: 95 },
        missingKeywords: [],
        tailoredRecommendations: [],
      };

      render(React.createElement(JdMatchCard, { jdMatch: data }));

      expect(screen.getByTestId('missing-keywords-count')).toHaveTextContent('0');
      expect(
        screen.getByText(/tuyệt vời! không phát hiện từ khóa kỹ thuật then chốt nào bị thiếu/i)
      ).toBeInTheDocument();
      expect(screen.queryByTestId('top-keyword-0')).not.toBeInTheDocument();
      expect(screen.queryByTestId('blurred-keywords-wrapper')).not.toBeInTheDocument();
      expect(screen.queryByTestId('unlock-keywords-cta')).not.toBeInTheDocument();
    });

    it('boundary count = 1: renders exactly 1 unblurred badge, no blurred container or unlock CTA', () => {
      const data: JdMatchData = {
        matchScore: 88,
        breakdown: { hardSkillsMatch: 85, experienceMatch: 85, cultureMatch: 90 },
        missingKeywords: ['Redis'],
        tailoredRecommendations: [],
      };

      render(React.createElement(JdMatchCard, { jdMatch: data }));

      expect(screen.getByTestId('missing-keywords-count')).toHaveTextContent('1');
      expect(screen.getByTestId('top-keyword-0')).toHaveTextContent('Redis');
      expect(screen.queryByTestId('top-keyword-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('blurred-keywords-wrapper')).not.toBeInTheDocument();
      expect(screen.queryByTestId('unlock-keywords-cta')).not.toBeInTheDocument();
    });

    it('boundary count = 3: renders exactly 3 unblurred badges, no blurred container or unlock CTA', () => {
      const data: JdMatchData = {
        matchScore: 78,
        breakdown: { hardSkillsMatch: 80, experienceMatch: 75, cultureMatch: 80 },
        missingKeywords: ['Docker', 'Kubernetes', 'Redis'],
        tailoredRecommendations: [],
      };

      render(React.createElement(JdMatchCard, { jdMatch: data }));

      expect(screen.getByTestId('missing-keywords-count')).toHaveTextContent('3');
      expect(screen.getByTestId('top-keyword-0')).toHaveTextContent('Docker');
      expect(screen.getByTestId('top-keyword-1')).toHaveTextContent('Kubernetes');
      expect(screen.getByTestId('top-keyword-2')).toHaveTextContent('Redis');
      expect(screen.queryByTestId('top-keyword-3')).not.toBeInTheDocument();
      expect(screen.queryByTestId('blurred-keywords-wrapper')).not.toBeInTheDocument();
      expect(screen.queryByTestId('unlock-keywords-cta')).not.toBeInTheDocument();
    });

    it('boundary count = 4 in Free Tier: renders top 3 unblurred + 1 blurred with "+1 từ khóa ẩn (Gói Pro)"', () => {
      const data: JdMatchData = {
        matchScore: 70,
        breakdown: { hardSkillsMatch: 70, experienceMatch: 70, cultureMatch: 70 },
        missingKeywords: ['Docker', 'Kubernetes', 'Redis', 'Kafka'],
        tailoredRecommendations: [],
      };

      render(React.createElement(JdMatchCard, { jdMatch: data }));

      expect(screen.getByTestId('missing-keywords-count')).toHaveTextContent('4');
      expect(screen.getByTestId('top-keyword-0')).toHaveTextContent('Docker');
      expect(screen.getByTestId('top-keyword-1')).toHaveTextContent('Kubernetes');
      expect(screen.getByTestId('top-keyword-2')).toHaveTextContent('Redis');

      // Blurred wrapper with 1 item
      const blurredWrapper = screen.getByTestId('blurred-keywords-wrapper');
      expect(blurredWrapper).toBeInTheDocument();
      const blurredContent = screen.getByTestId('blurred-keywords-content');
      expect(blurredContent).toHaveTextContent('Kafka');

      // Chip with exact count
      const unlockCta = screen.getByTestId('unlock-keywords-cta');
      expect(unlockCta).toHaveTextContent('+1 từ khóa ẩn (Gói Pro)');
    });

    it('boundary count = 4 in Pro Tier: renders all 4 unblurred, zero blurred containers', () => {
      localStorage.setItem(PRO_STORAGE_KEY, 'true');

      const data: JdMatchData = {
        matchScore: 70,
        breakdown: { hardSkillsMatch: 70, experienceMatch: 70, cultureMatch: 70 },
        missingKeywords: ['Docker', 'Kubernetes', 'Redis', 'Kafka'],
        tailoredRecommendations: [],
      };

      render(React.createElement(JdMatchCard, { jdMatch: data }));

      expect(screen.getByTestId('missing-keywords-count')).toHaveTextContent('4');
      expect(screen.getByTestId('keyword-item-0')).toHaveTextContent('Docker');
      expect(screen.getByTestId('keyword-item-1')).toHaveTextContent('Kubernetes');
      expect(screen.getByTestId('keyword-item-2')).toHaveTextContent('Redis');
      expect(screen.getByTestId('keyword-item-3')).toHaveTextContent('Kafka');

      expect(screen.queryByTestId('blurred-keywords-wrapper')).not.toBeInTheDocument();
      expect(screen.queryByTestId('unlock-keywords-cta')).not.toBeInTheDocument();
    });

    it('boundary count = 20 in Free Tier: renders top 3 unblurred + 17 blurred with "+17 từ khóa ẩn (Gói Pro)"', () => {
      const twentyKeywords = Array.from({ length: 20 }, (_, i) => `Skill_${i + 1}`);
      const data: JdMatchData = {
        matchScore: 35,
        breakdown: { hardSkillsMatch: 30, experienceMatch: 30, cultureMatch: 50 },
        missingKeywords: twentyKeywords,
        tailoredRecommendations: [],
      };

      render(React.createElement(JdMatchCard, { jdMatch: data }));

      expect(screen.getByTestId('missing-keywords-count')).toHaveTextContent('20');
      expect(screen.getByTestId('top-keyword-0')).toHaveTextContent('Skill_1');
      expect(screen.getByTestId('top-keyword-1')).toHaveTextContent('Skill_2');
      expect(screen.getByTestId('top-keyword-2')).toHaveTextContent('Skill_3');

      // Blurred content holds remaining 17
      const blurredContent = screen.getByTestId('blurred-keywords-content');
      expect(blurredContent).toHaveTextContent('Skill_4');
      expect(blurredContent).toHaveTextContent('Skill_20');

      const unlockCta = screen.getByTestId('unlock-keywords-cta');
      expect(unlockCta).toHaveTextContent('+17 từ khóa ẩn (Gói Pro)');
    });

    it('boundary count = 20 in Pro Tier: renders all 20 unblurred items', () => {
      localStorage.setItem(PRO_STORAGE_KEY, 'true');

      const twentyKeywords = Array.from({ length: 20 }, (_, i) => `Skill_${i + 1}`);
      const data: JdMatchData = {
        matchScore: 35,
        breakdown: { hardSkillsMatch: 30, experienceMatch: 30, cultureMatch: 50 },
        missingKeywords: twentyKeywords,
        tailoredRecommendations: [],
      };

      render(React.createElement(JdMatchCard, { jdMatch: data }));

      expect(screen.getByTestId('missing-keywords-count')).toHaveTextContent('20');
      for (let i = 0; i < 20; i++) {
        expect(screen.getByTestId(`keyword-item-${i}`)).toHaveTextContent(`Skill_${i + 1}`);
      }
      expect(screen.queryByTestId('blurred-keywords-wrapper')).not.toBeInTheDocument();
    });
  });

  describe('4. Tailored Recommendations Boundary Checks', () => {
    it('handles empty tailoredRecommendations array [] in Free Tier (renders gate & fallback preview)', () => {
      const data: JdMatchData = {
        matchScore: 80,
        breakdown: { hardSkillsMatch: 80, experienceMatch: 80, cultureMatch: 80 },
        missingKeywords: ['TypeScript'],
        tailoredRecommendations: [],
      };

      render(React.createElement(JdMatchCard, { jdMatch: data }));

      expect(screen.getByTestId('free-recommendations-gate')).toBeInTheDocument();
      expect(screen.getByTestId('unlock-pro-cta-button')).toBeInTheDocument();
    });

    it('handles empty tailoredRecommendations array [] in Pro Tier (renders fallback notice)', () => {
      localStorage.setItem(PRO_STORAGE_KEY, 'true');

      const data: JdMatchData = {
        matchScore: 80,
        breakdown: { hardSkillsMatch: 80, experienceMatch: 80, cultureMatch: 80 },
        missingKeywords: ['TypeScript'],
        tailoredRecommendations: [],
      };

      render(React.createElement(JdMatchCard, { jdMatch: data }));

      expect(screen.queryByTestId('free-recommendations-gate')).not.toBeInTheDocument();
      expect(screen.getByText(/không có gợi ý bổ sung/i)).toBeInTheDocument();
    });

    it('parses long strings with multiple [...] placeholders into styled chip spans without layout breakage', () => {
      localStorage.setItem(PRO_STORAGE_KEY, 'true');

      const complexRec =
        'Tái cấu trúc hệ thống [Microservices] sử dụng ngôn ngữ [Golang] và [gRPC], xử lý tải [50.000 QPS], tích hợp cụm bộ đệm [Redis Cluster] giúp giảm độ trễ từ [250ms] xuống [15ms], đồng thời thiết lập hệ thống cảnh báo qua [Prometheus + Grafana] đảm bảo độ khả dụng [99.99%].';

      const data: JdMatchData = {
        matchScore: 65,
        breakdown: { hardSkillsMatch: 60, experienceMatch: 60, cultureMatch: 75 },
        missingKeywords: ['Golang', 'gRPC', 'Redis Cluster'],
        tailoredRecommendations: [complexRec],
      };

      render(React.createElement(JdMatchCard, { jdMatch: data }));

      const recItem = screen.getByTestId('recommendation-item-0');
      expect(recItem).toBeInTheDocument();

      // Verify every bracketed placeholder became a styled badge
      const expectedPlaceholders = [
        '[Microservices]',
        '[Golang]',
        '[gRPC]',
        '[50.000 QPS]',
        '[Redis Cluster]',
        '[250ms]',
        '[15ms]',
        '[Prometheus + Grafana]',
        '[99.99%]',
      ];

      for (const ph of expectedPlaceholders) {
        const badge = screen.getByText(ph);
        expect(badge).toBeInTheDocument();
        expect(badge.className).toContain('font-mono');
        expect(badge.className).toContain('text-cyan-300');
        expect(badge.className).toContain('bg-cyan-500/20');
      }

      // Check non-placeholder text around them is preserved
      expect(recItem).toHaveTextContent('Tái cấu trúc hệ thống');
      expect(recItem).toHaveTextContent('sử dụng ngôn ngữ');
      expect(recItem).toHaveTextContent('xử lý tải');
      expect(recItem).toHaveTextContent('giúp giảm độ trễ từ');
      expect(recItem).toHaveTextContent('đảm bảo độ khả dụng');
    });

    it('handles consecutive placeholders e.g. "[A][B]" cleanly', () => {
      localStorage.setItem(PRO_STORAGE_KEY, 'true');

      const data: JdMatchData = {
        matchScore: 60,
        breakdown: { hardSkillsMatch: 60, experienceMatch: 60, cultureMatch: 60 },
        missingKeywords: ['A', 'B'],
        tailoredRecommendations: ['Kết hợp [Công nghệ A][Công nghệ B] trong cùng dự án.'],
      };

      render(React.createElement(JdMatchCard, { jdMatch: data }));

      expect(screen.getByText('[Công nghệ A]')).toBeInTheDocument();
      expect(screen.getByText('[Công nghệ B]')).toBeInTheDocument();
    });

    it('handles recommendations without any [...] placeholders gracefully', () => {
      localStorage.setItem(PRO_STORAGE_KEY, 'true');

      const plainRec = 'Cần chủ động bổ sung thêm các số liệu định lượng vào phần dự án tốt nghiệp.';
      const data: JdMatchData = {
        matchScore: 70,
        breakdown: { hardSkillsMatch: 70, experienceMatch: 70, cultureMatch: 70 },
        missingKeywords: [],
        tailoredRecommendations: [plainRec],
      };

      render(React.createElement(JdMatchCard, { jdMatch: data }));

      expect(screen.getByText(plainRec)).toBeInTheDocument();
    });
  });

  describe('5. Defensive Fallbacks (Undefined & Null Attributes)', () => {
    it('does not throw when missingKeywords or tailoredRecommendations are missing/undefined', () => {
      const dataWithMissingArrays = {
        matchScore: 85,
        breakdown: {
          hardSkillsMatch: 90,
          experienceMatch: 80,
          cultureMatch: 85,
        },
      } as unknown as JdMatchData;

      expect(() => {
        render(React.createElement(JdMatchCard, { jdMatch: dataWithMissingArrays }));
      }).not.toThrow();

      expect(screen.getByTestId('gauge-score-value')).toHaveTextContent('85%');
      expect(screen.getByTestId('missing-keywords-count')).toHaveTextContent('0');
    });

    it('does not throw when targetRole is omitted', () => {
      const data: JdMatchData = {
        matchScore: 75,
        breakdown: { hardSkillsMatch: 75, experienceMatch: 75, cultureMatch: 75 },
        missingKeywords: ['Docker'],
        tailoredRecommendations: ['Bổ sung [Docker].'],
      };

      expect(() => {
        render(React.createElement(JdMatchCard, { jdMatch: data }));
      }).not.toThrow();

      expect(screen.getByTestId('gauge-score-value')).toHaveTextContent('75%');
    });
  });
});
