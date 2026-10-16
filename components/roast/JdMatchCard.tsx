'use client';

import React from 'react';
import {
  Target,
  Sparkles,
  AlertTriangle,
  AlertCircle,
  Lock,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { JdMatchData } from '@/lib/schemas/roast';
import { useProTier } from '@/lib/payment/entitlement';
import { cn } from '@/lib/utils/cn';

export interface JdMatchCardProps {
  jdMatch: JdMatchData;
  targetRole?: string;
  onOpenCheckout?: () => void;
  className?: string;
}

export function JdMatchCard({
  jdMatch,
  targetRole,
  onOpenCheckout,
  className,
}: JdMatchCardProps) {
  const { isPro } = useProTier();

  const clampedScore = Math.min(100, Math.max(0, Math.round(jdMatch.matchScore)));

  // Determine status chip styling & label based on score
  const getScoreStatus = (score: number) => {
    if (score >= 75) {
      return {
        label: 'Tương thích tốt',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        textColor: 'text-emerald-400',
        description: 'CV bám rất sát các tiêu chí cốt lõi trong JD mục tiêu.',
      };
    }
    if (score >= 50) {
      return {
        label: 'Độ lệch trung bình',
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        textColor: 'text-amber-400',
        description: 'Có nền tảng cơ bản nhưng thiếu một số từ khóa kỹ thuật then chốt.',
      };
    }
    return {
      label: 'Độ lệch cao',
      badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      textColor: 'text-rose-400',
      description: 'Khoảng trống kỹ năng và kinh nghiệm khá lớn so với yêu cầu của JD.',
    };
  };

  const scoreStatus = getScoreStatus(clampedScore);

  // Circular gauge SVG calculations
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  // Breakdown progress bars config
  const breakdownBars = [
    {
      label: 'Kỹ năng cứng',
      score: Math.min(100, Math.max(0, Math.round(jdMatch.breakdown.hardSkillsMatch))),
      gradient: 'from-cyan-500 to-blue-500',
      textColor: 'text-cyan-400',
    },
    {
      label: 'Kinh nghiệm dự án',
      score: Math.min(100, Math.max(0, Math.round(jdMatch.breakdown.experienceMatch))),
      gradient: 'from-blue-500 to-indigo-500',
      textColor: 'text-blue-400',
    },
    {
      label: 'Phù hợp văn hóa',
      score: Math.min(100, Math.max(0, Math.round(jdMatch.breakdown.cultureMatch))),
      gradient: 'from-emerald-500 to-teal-500',
      textColor: 'text-emerald-400',
    },
  ];

  // Helper to highlight [...] placeholders in recommendations
  const renderWithPlaceholders = (text: string) => {
    const parts = text.split(/(\[[^\]]+\])/g);
    return parts.map((part, i) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        return (
          <span
            key={i}
            className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-xs border border-cyan-500/40 font-semibold"
          >
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const missingKeywords = jdMatch.missingKeywords || [];
  const topKeywords = missingKeywords.slice(0, 3);
  const hiddenKeywords = missingKeywords.slice(3);
  const recommendations = jdMatch.tailoredRecommendations || [];

  return (
    <div
      data-testid="jd-match-card"
      className={cn(
        'relative overflow-hidden rounded-3xl bg-zinc-900/90 border border-cyan-500/30 shadow-2xl shadow-cyan-950/20 p-6 sm:p-8 backdrop-blur-md flex flex-col gap-6',
        className
      )}
    >
      {/* Decorative Cyberpunk Background Glows */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase tracking-wider">
              <Target className="w-3.5 h-3.5" />
              <span>Phân Tích Độ Lệch JD & Lỗ Hổng Kỹ Năng</span>
            </span>
            <span
              data-testid="score-status-chip"
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                scoreStatus.badgeClass
              )}
            >
              <Zap className="w-3 h-3" />
              <span>{scoreStatus.label}</span>
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Độ tương thích với JD thực tế
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {scoreStatus.description}
          </p>
        </div>

        {targetRole && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-300 self-start sm:self-center shrink-0">
            <span className="text-zinc-500 font-medium">Vị trí:</span>
            <span className="font-semibold text-cyan-300 font-mono">{targetRole}</span>
          </div>
        )}
      </div>

      {/* Bento Grid: Gauge + 3 Detail Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left: Cyberpunk Circular Gauge */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 relative">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg
              className="w-36 h-36"
              viewBox="0 0 120 120"
              role="img"
              aria-label={`Điểm tương thích JD: ${clampedScore}%`}
            >
              <defs>
                <linearGradient id="cyberpunkJdGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>

              {/* Background Track */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                className="stroke-zinc-800 fill-none"
                strokeWidth="8"
              />

              {/* Glowing Dynamic Gauge */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="url(#cyberpunkJdGradient)"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
                className="transition-all duration-1000 ease-out"
                style={{
                  filter: 'drop-shadow(0 0 6px rgba(6, 182, 212, 0.4))',
                }}
              />
            </svg>

            {/* Inner Gauge Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span
                data-testid="gauge-score-value"
                className="text-4xl sm:text-5xl font-black tracking-tight text-white font-mono"
              >
                {clampedScore}%
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 mt-0.5">
                Match Score
              </span>
            </div>
          </div>

          <div className="mt-3 text-center">
            <span className="text-xs text-zinc-400 font-medium">
              Chỉ số tương thích tổng thể
            </span>
          </div>
        </div>

        {/* Right: 3 Detail Progress Bars */}
        <div className="md:col-span-7 flex flex-col justify-center gap-4 p-5 sm:p-6 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Chi tiết 3 trụ cột đánh giá
            </span>
            <span className="text-[11px] text-zinc-500">Thang điểm 0 - 100%</span>
          </div>

          <div className="space-y-4">
            {breakdownBars.map((bar) => (
              <div key={bar.label} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-300 font-medium">{bar.label}</span>
                  <span className={cn('font-mono font-bold', bar.textColor)}>
                    {bar.score}%
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden p-0.5">
                  <div
                    role="progressbar"
                    aria-valuenow={bar.score}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={bar.label}
                    className={cn(
                      'h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out',
                      bar.gradient
                    )}
                    style={{ width: `${bar.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Missing ATS Keywords Section */}
      <div className="space-y-3 pt-4 border-t border-zinc-800/80">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <h4 className="text-sm sm:text-base font-bold text-zinc-100">
              Từ khóa tử huyệt thiếu trong CV
            </h4>
            <span
              data-testid="missing-keywords-count"
              className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30"
            >
              {missingKeywords.length}
            </span>
          </div>
          <span className="text-[11px] text-zinc-400">
            Từ khóa có trong JD nhưng chưa xuất hiện trong CV
          </span>
        </div>

        {missingKeywords.length === 0 ? (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Tuyệt vời! Không phát hiện từ khóa kỹ thuật then chốt nào bị thiếu.</span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2" data-testid="keywords-container">
            {isPro ? (
              /* Pro tier: 100% unblurred */
              missingKeywords.map((kw, idx) => (
                <span
                  key={idx}
                  data-testid={`keyword-item-${idx}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30 shadow-sm"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>{kw}</span>
                </span>
              ))
            ) : (
              /* Free tier: Top 3 visible, remaining blurred */
              <>
                {topKeywords.map((kw, idx) => (
                  <span
                    key={idx}
                    data-testid={`top-keyword-${idx}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30 shadow-sm"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>{kw}</span>
                  </span>
                ))}

                {hiddenKeywords.length > 0 && (
                  <div
                    data-testid="blurred-keywords-wrapper"
                    className="relative inline-flex items-center gap-2 flex-wrap"
                  >
                    {/* Blurred items */}
                    <div
                      data-testid="blurred-keywords-content"
                      className="inline-flex items-center gap-2 flex-wrap select-none filter blur-sm backdrop-blur-sm opacity-50 pointer-events-none"
                      aria-hidden="true"
                    >
                      {hiddenKeywords.map((kw, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700"
                        >
                          <span>{kw}</span>
                        </span>
                      ))}
                    </div>

                    {/* Padlock upgrade chip */}
                    <button
                      type="button"
                      onClick={onOpenCheckout}
                      data-testid="unlock-keywords-cta"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors cursor-pointer shadow-sm"
                      title="Mở khóa toàn bộ từ khóa thiếu với Gói Pro 29k"
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>+{hiddenKeywords.length} từ khóa ẩn (Gói Pro)</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Tailored ATS Recommendations Section */}
      <div className="space-y-3 pt-4 border-t border-zinc-800/80">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm sm:text-base font-bold text-zinc-100">
              Gợi ý tái cấu trúc dự án chuẩn ATS
            </h4>
          </div>
          <span className="text-[11px] text-zinc-400">
            Chiến thuật chèn từ khóa vào dự án cũ mà không bịa đặt số liệu
          </span>
        </div>

        {isPro ? (
          /* Pro tier: Full recommendations display */
          <div className="space-y-3" data-testid="pro-recommendations">
            {recommendations.length > 0 ? (
              recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  data-testid={`recommendation-item-${idx}`}
                  className="p-4 rounded-2xl bg-zinc-950/80 border border-cyan-500/30 flex items-start gap-3 text-xs sm:text-sm text-zinc-200 leading-relaxed font-sans shadow-sm"
                >
                  <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 shrink-0 shadow-sm shadow-cyan-400" />
                  <div className="flex-1">{renderWithPlaceholders(rec)}</div>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-400 italic">Không có gợi ý bổ sung.</p>
            )}
          </div>
        ) : (
          /* Free tier: Blurred recommendations behind padlock with prominent CTA */
          <div
            data-testid="free-recommendations-gate"
            className="relative rounded-2xl overflow-hidden border border-zinc-800/90 bg-zinc-950/60 p-4 sm:p-6"
          >
            {/* Blurred background preview */}
            <div
              data-testid="blurred-recommendations-content"
              className="select-none filter blur-sm backdrop-blur-sm opacity-30 pointer-events-none space-y-3"
              aria-hidden="true"
            >
              {(recommendations.length > 0
                ? recommendations
                : [
                    'Tối ưu hóa module [tên module] bằng việc áp dụng kiến trúc [công nghệ JD yêu cầu], cải thiện tốc độ tải [X%].',
                    'Định lượng kết quả triển khai [tính năng] phục vụ [Y] người dùng đồng thời, đáp ứng hoàn toàn tiêu chuẩn hiệu năng trong JD.',
                  ]
              ).map((rec, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 font-mono"
                >
                  {rec}
                </div>
              ))}
            </div>

            {/* Lock Overlay & Prominent CTA */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 sm:p-6 text-center bg-zinc-950/80 backdrop-blur-[2px]">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-2.5 shadow-lg shadow-amber-500/10">
                <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h5 className="text-xs sm:text-sm font-bold text-white mb-1">
                Gợi ý chèn từ khóa ATS & Kịch bản bảo vệ trước nhà tuyển dụng
              </h5>
              <p className="text-[11px] sm:text-xs text-zinc-400 max-w-md mb-3.5">
                Mở khóa toàn bộ gợi ý cách viết lại dự án và kịch bản câu hỏi áp lực xoáy trực diện vào JD này.
              </p>
              <button
                type="button"
                onClick={onOpenCheckout}
                data-testid="unlock-pro-cta-button"
                className="inline-flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-zinc-950 transition-all shadow-lg shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Sparkles className="w-4 h-4 fill-zinc-950 shrink-0" />
                <span>Mở khóa toàn bộ gợi ý ATS & câu hỏi phỏng vấn với Gói Pro 29k</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default JdMatchCard;
