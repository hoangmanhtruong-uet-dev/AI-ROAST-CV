'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Flame,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  RotateCcw,
  Edit3,
  ShieldCheck,
  Sparkles,
  Loader2,
  FileDown,
  ChevronRight,
} from 'lucide-react';
import { RoastData, WeaknessItem } from '@/lib/schemas/roast';
import { cn } from '@/lib/utils/cn';
import { WipeDataButton } from '@/components/privacy/WipeDataButton';
import {
  ExportCvModal,
  WeaknessCardState,
  WeaknessRewriteItem,
} from './ExportCvModal';
import { CheckoutModal } from '@/components/payment/CheckoutModal';
import RoastShareModal from './RoastShareModal';
import { JdMatchCard } from './JdMatchCard';
import { useProTier } from '@/lib/payment/entitlement';
import { WIPE_DATA_EVENT_NAME } from '@/lib/storage/wipe-data';
import { getTrialUsage, recordTrialUsage } from '@/lib/payment/trial';

export type { WeaknessCardState, WeaknessRewriteItem };

export interface RoastReportProps {
  data: RoastData;
  cvText?: string;
  targetRole?: string;
  onReset: () => void;
  onChangeTone: (newTone: 'spicy' | 'constructive') => void;
  onEditCv: () => void;
  onShareCard?: () => void;
  onStartInterview?: () => void;
  onGoToAtsDiff?: () => void;
  className?: string;
}

export function RoastReport({
  data,
  cvText = '',
  targetRole = '',
  onReset,
  onChangeTone,
  onEditCv,
  onShareCard,
  onStartInterview,
  onGoToAtsDiff,
  className,
}: RoastReportProps) {
  const router = useRouter();

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedRewriteIndex, setCopiedRewriteIndex] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Per-card ATS rewrite state machine
  const [rewriteStates, setRewriteStates] = useState<Record<number, WeaknessCardState>>({});
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const { isPro } = useProTier();

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2500);
  }, []);

  // Listen for Wipe Data to reset rewrite state and modals
  useEffect(() => {
    const handleDataWiped = () => {
      setRewriteStates({});
      setIsExportModalOpen(false);
      setIsCheckoutModalOpen(false);
      setIsShareModalOpen(false);
    };
    window.addEventListener(WIPE_DATA_EVENT_NAME, handleDataWiped);
    return () => {
      window.removeEventListener(WIPE_DATA_EVENT_NAME, handleDataWiped);
    };
  }, []);

  const getRewriteUsageCount = (): number => {
    return getTrialUsage().rewriteCount;
  };

  const incrementRewriteUsage = (): void => {
    recordTrialUsage('rewrite');
  };

  const handleCopyFix = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyRewrite = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedRewriteIndex(index);
      showToast('Đã sao chép câu chuẩn ATS vào bộ nhớ tạm!');
      setTimeout(() => setCopiedRewriteIndex(null), 2000);
    } catch {
      // Fallback
    }
  };

  const handleStartInterviewFromCv = () => {
    let questionsToStore = data.interviewQuestions;
    if (!questionsToStore || questionsToStore.length === 0) {
      questionsToStore = (data.weaknesses || []).slice(0, 3).map((w, idx) => ({
        questionId: `cv-q-${idx + 1}-${Date.now()}`,
        role: 'custom' as const,
        questionIndex: ((idx + 1) as 1 | 2 | 3),
        title: `Chất vấn về: ${w.issue}`,
        scenario: `Trong CV bạn ghi: "${w.quote}". Hội đồng tuyển dụng phát hiện vấn đề: ${w.issue}. ${w.rejectionReason || w.rejectReason || ''}`,
        pressureContext: 'Bạn có đúng 90 giây để đưa ra bằng chứng thực tế bảo vệ nội dung này.',
        timeLimitSeconds: 90,
      }));
    }

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(
          'airoastcv_custom_interview_questions',
          JSON.stringify(questionsToStore)
        );
        sessionStorage.setItem(
          'ai_roast_cv_context',
          JSON.stringify({
            customQuestions: questionsToStore,
            hasJdTarget: Boolean(data.jdMatch),
            targetRole: (data as any).targetRole || targetRole,
            jdMatch: data.jdMatch,
          })
        );
      } catch {
        // Safe storage fallback
      }
    }

    if (onStartInterview) {
      onStartInterview();
    }

    if (router?.push) {
      router.push('/interview');
    } else if (typeof window !== 'undefined') {
      window.location.href = '/interview';
    }
  };

  const handleGoToAtsDiff = () => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(
          'airoastcv_diff_context',
          JSON.stringify({
            cvText: cvText || '',
            targetRole: (data as any).targetRole || targetRole || '',
            jdText: (data as any).jdMatch?.targetJdText || '',
            weaknesses: data.weaknesses || [],
          })
        );
      } catch {
        // Safe storage fallback
      }
    }

    if (onGoToAtsDiff) {
      onGoToAtsDiff();
    }

    if (router?.push) {
      router.push('/ats-diff');
    } else if (typeof window !== 'undefined') {
      window.location.href = '/ats-diff';
    }
  };

  const handleTriggerRewrite = async (index: number, weakness: WeaknessItem) => {
    // Entitlement Check: Free users get 1 free trial rewrite, Pro users get unlimited
    const usage = getTrialUsage(isPro);
    if (!usage.canRewrite) {
      setIsCheckoutModalOpen(true);
      return;
    }

    setRewriteStates((prev) => ({
      ...prev,
      [index]: {
        status: 'loading',
      },
    }));

    try {
      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote: weakness.quote,
          issue: weakness.issue,
          rejectionReason: weakness.rejectionReason,
          targetRole: targetRole || undefined,
          cvContext: cvText || undefined,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success || !json?.data) {
        throw new Error(json?.error || 'Không thể tạo câu viết lại chuẩn ATS. Vui lòng thử lại.');
      }

      if (!isPro) {
        incrementRewriteUsage();
      }

      const rewriteResult: WeaknessRewriteItem = {
        originalQuote: json.data.originalQuote || weakness.quote,
        rewrittenText: json.data.rewrittenText,
        customizedText: json.data.rewrittenText,
        actionVerb: json.data.actionVerb,
        actionVerbCategory: json.data.actionVerbCategory,
        context: json.data.context,
        result: json.data.result,
        explanation: json.data.explanation,
        atsKeywords: json.data.atsKeywords || [],
      };

      setRewriteStates((prev) => ({
        ...prev,
        [index]: {
          status: 'success',
          data: rewriteResult,
          isEditing: false,
          draftText: rewriteResult.customizedText,
        },
      }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setRewriteStates((prev) => ({
        ...prev,
        [index]: {
          status: 'error',
          errorMessage: errorMsg,
        },
      }));
    }
  };

  const handleStartEdit = (index: number) => {
    setRewriteStates((prev) => {
      const item = prev[index];
      if (!item || !item.data) return prev;
      return {
        ...prev,
        [index]: {
          ...item,
          isEditing: true,
          draftText: item.data.customizedText,
        },
      };
    });
  };

  const handleDraftChange = (index: number, newDraft: string) => {
    setRewriteStates((prev) => {
      const item = prev[index];
      if (!item) return prev;
      return {
        ...prev,
        [index]: {
          ...item,
          draftText: newDraft,
        },
      };
    });
  };

  const handleSaveEdit = (index: number) => {
    setRewriteStates((prev) => {
      const item = prev[index];
      if (!item || !item.data) return prev;
      const updatedText = (item.draftText || item.data.customizedText).trim();
      return {
        ...prev,
        [index]: {
          ...item,
          isEditing: false,
          data: {
            ...item.data,
            customizedText: updatedText,
          },
        },
      };
    });
    showToast('Đã lưu chỉnh sửa thành công!');
  };

  const handleCancelEdit = (index: number) => {
    setRewriteStates((prev) => {
      const item = prev[index];
      if (!item || !item.data) return prev;
      return {
        ...prev,
        [index]: {
          ...item,
          isEditing: false,
          draftText: item.data.customizedText,
        },
      };
    });
  };

  const handleResetAiDraft = (index: number) => {
    setRewriteStates((prev) => {
      const item = prev[index];
      if (!item || !item.data) return prev;
      return {
        ...prev,
        [index]: {
          ...item,
          draftText: item.data.rewrittenText,
        },
      };
    });
  };

  // Helper to highlight [...] placeholders
  const renderFixWithPlaceholders = (fix: string) => {
    const parts = fix.split(/(\[[^\]]+\])/g);
    return parts.map((part, i) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        return (
          <span
            key={i}
            className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded bg-orange-500/20 text-orange-300 font-mono text-xs border border-orange-500/40 font-semibold"
          >
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const getScoreColor = (score: number) => {
    if (score < 50) {
      return {
        text: 'text-rose-400',
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/30',
        label: 'Nguy cơ cao bị loại',
      };
    }
    if (score < 75) {
      return {
        text: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        label: 'Tạm ổn, cần tối ưu số liệu',
      };
    }
    return {
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      label: 'Sẵn sàng chinh chiến phỏng vấn',
    };
  };

  const scoreTheme = getScoreColor(data.overallScore);

  return (
    <div className={cn('w-full flex flex-col gap-8', className)}>
      {/* 1. Score & Summary Banner */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border',
                  data.tone === 'spicy'
                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                )}
              >
                {data.tone === 'spicy' ? (
                  <>
                    <Flame className="w-3.5 h-3.5" />
                    <span>🔥 Cà khịa / Sát thủ</span>
                  </>
                ) : (
                  <>
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>👔 Chuyên gia tận tâm</span>
                  </>
                )}
              </span>

              <span
                className={cn(
                  'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border',
                  scoreTheme.bg,
                  scoreTheme.text,
                  scoreTheme.border
                )}
              >
                {scoreTheme.label}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 mb-3">
              Phán quyết tổng thể
            </h2>
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed italic bg-zinc-800/40 p-4 rounded-2xl border border-zinc-800">
              {data.summaryVerdict}
            </p>
          </div>

          {/* Numerical Score Gauge */}
          <div className="flex flex-col items-center justify-center shrink-0 p-6 rounded-2xl bg-zinc-950 border border-zinc-800/80">
            <span className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-1">
              Điểm CV
            </span>
            <div className={cn('text-5xl sm:text-6xl font-black tracking-tight', scoreTheme.text)}>
              {data.overallScore}
            </div>
            <span className="text-xs text-zinc-500 font-medium mt-1">/ 100 điểm</span>
          </div>
        </div>
      </div>

      {/* 1.5. CV Bridge to /interview */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-zinc-900 border border-purple-500/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400">
            <Sparkles className="w-4 h-4" />
            <span>Phòng phỏng vấn áp lực cao</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white">
            Dám đối mặt với Tech Lead để bảo vệ các điểm yếu trong CV này không?
          </h3>
          <p className="text-xs text-zinc-300">
            Mô phỏng 3 câu hỏi xoáy trực tiếp vào những chi tiết vừa bị soi trong CV với đồng hồ đếm ngược 90s.
          </p>
        </div>
        <button
          type="button"
          onClick={handleStartInterviewFromCv}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white shadow-lg shadow-orange-500/20 transition-all shrink-0 cursor-pointer"
        >
          <span>⏱️ Luyện phỏng vấn từ chính CV này</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 1.6. CV Bridge to /ats-diff (ATS Simulator & JD Matcher) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-950/40 via-orange-950/30 to-zinc-900 border border-amber-500/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Cầu nối cứu nguy hồ sơ xin việc (ATS Simulator)</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white">
            Cười xong rồi? Đừng để CV bị HR & ATS gạt bỏ sau 6 giây!
          </h3>
          <p className="text-xs text-zinc-300">
            Đối chiếu trực tiếp CV của bạn với Job Description mục tiêu, vạch trần từ khóa còn thiếu và phê duyệt từng câu sửa chuẩn Google XYZ trên giao diện Diff trực quan.
          </p>
        </div>
        <button
          type="button"
          data-testid="hero-go-to-ats-diff-btn"
          onClick={handleGoToAtsDiff}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-zinc-950 shadow-lg shadow-amber-500/20 transition-all shrink-0 cursor-pointer"
        >
          <span>🎯 Quét chuẩn ATS & Sửa câu ngay</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Top Strengths */}
      {data.topStrengths && data.topStrengths.length > 0 && (
        <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800">
          <h3 className="text-base font-bold text-zinc-100 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Điểm sáng hiếm hoi trong CV</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.topStrengths.map((str, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-900 border border-zinc-800/80 text-sm text-zinc-300"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2 shrink-0" />
                <span className="leading-relaxed">{str}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Prioritized Weaknesses with Interactive ATS Rewrite */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <span>Danh sách điểm yếu chí mạng ({data.weaknesses.length})</span>
          </h3>
          <span className="text-xs text-zinc-400">Xếp theo mức độ nghiêm trọng</span>
        </div>

        <div className="flex flex-col gap-5">
          {data.weaknesses.map((w, idx) => {
            const isCopied = copiedIndex === idx;
            const cardState = rewriteStates[idx] || { status: 'idle' };

            return (
              <div
                key={idx}
                className="p-5 sm:p-6 rounded-2xl bg-zinc-900 border border-zinc-800/90 shadow-sm flex flex-col gap-4"
              >
                {/* Header: Issue & Severity Badge */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <h4 className="text-base font-bold text-zinc-100 leading-snug">
                    {idx + 1}. {w.issue}
                  </h4>
                  <span
                    className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0',
                      w.severity === 'Cao'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : w.severity === 'Trung bình'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                    )}
                  >
                    {w.severity}
                  </span>
                </div>

                {/* CV Quote */}
                <div className="p-3.5 rounded-xl bg-zinc-950/80 border-l-4 border-amber-500 text-xs sm:text-sm italic text-zinc-300">
                  <span className="not-italic text-zinc-500 font-mono text-[11px] block mb-1">
                    Trích đoạn gốc trong CV:
                  </span>
                  <span>{w.quote}</span>
                </div>

                {/* Rejection Reason */}
                <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  <span className="font-semibold text-rose-400">Lý do nhà tuyển dụng từ chối: </span>
                  <span>{w.rejectionReason}</span>
                </div>

                {/* Fix Guideline with Placeholder Highlighting */}
                <div className="p-4 rounded-xl bg-orange-950/20 border border-orange-500/30 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-orange-300 flex items-center gap-1.5">
                      <span>💡 Hướng dẫn sửa mẫu:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyFix(w.fixGuideline, idx)}
                      className="inline-flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors cursor-pointer"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-medium">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép mẫu</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-sans">
                    {renderFixWithPlaceholders(w.fixGuideline)}
                  </p>
                </div>

                {/* ATS CV Rewrite Assistant Section */}
                <div className="pt-2 border-t border-zinc-800/80 flex flex-col gap-3">
                  {cardState.status === 'idle' && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-zinc-400">
                        Cần viết lại câu này chuẩn ATS để nộp ứng tuyển?
                      </span>
                      <button
                        type="button"
                        onClick={() => handleTriggerRewrite(idx, w)}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-orange-500/10 to-amber-500/10 hover:from-orange-500/20 hover:to-amber-500/20 text-orange-400 hover:text-orange-300 border border-orange-500/30 transition-all cursor-pointer shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                        <span>Tối ưu hóa theo chuẩn ATS</span>
                      </button>
                    </div>
                  )}

                  {cardState.status === 'loading' && (
                    <div className="p-4 rounded-xl bg-zinc-950/80 border border-orange-500/40 flex items-center gap-3">
                      <Loader2 className="w-4 h-4 animate-spin text-orange-400 shrink-0" />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-semibold text-zinc-200">
                          Đang tối ưu hóa theo chuẩn ATS...
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          Đang áp dụng công thức Action Verb + Context + Result...
                        </span>
                      </div>
                    </div>
                  )}

                  {cardState.status === 'error' && (
                    <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-rose-300">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{cardState.errorMessage || 'Không thể tạo đoạn viết lại ATS. Vui lòng thử lại.'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTriggerRewrite(idx, w)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-colors cursor-pointer shrink-0"
                      >
                        Thử lại
                      </button>
                    </div>
                  )}

                  {cardState.status === 'success' && cardState.data && (
                    <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-zinc-950 to-zinc-900 border border-emerald-500/30 shadow-md flex flex-col gap-3.5">
                      {/* Formula Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                            Action Verb: {cardState.data.actionVerb}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                            Context: {cardState.data.context}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            Result: {cardState.data.result}
                          </span>
                        </div>

                        <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Chuẩn ATS</span>
                        </span>
                      </div>

                      {/* Content: View mode vs Edit mode */}
                      {cardState.isEditing ? (
                        <div className="flex flex-col gap-2">
                          <label className="text-[11px] text-zinc-400 font-medium">
                            Chỉnh sửa câu viết lại (thay thế các thẻ <code className="text-orange-400">[...]</code> bằng số liệu và dự án thực tế của bạn):
                          </label>
                          <textarea
                            value={cardState.draftText ?? cardState.data.customizedText}
                            onChange={(e) => handleDraftChange(idx, e.target.value)}
                            rows={3}
                            className="w-full p-3 rounded-lg bg-zinc-900 border border-zinc-700 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-orange-500 font-mono resize-y"
                          />
                          <div className="flex items-center justify-between gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleResetAiDraft(idx)}
                              className="text-[11px] text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
                            >
                              Khôi phục đề xuất AI
                            </button>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleCancelEdit(idx)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                              >
                                Hủy
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(idx)}
                                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-sm"
                              >
                                Lưu thay đổi
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <p className="text-xs sm:text-sm text-zinc-100 leading-relaxed font-sans font-medium">
                            {renderFixWithPlaceholders(cardState.data.customizedText)}
                          </p>

                          <p className="text-[11px] text-zinc-400 italic">
                            💡 {cardState.data.explanation}
                          </p>

                          {cardState.data.atsKeywords && cardState.data.atsKeywords.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              <span className="text-[10px] text-zinc-500 uppercase font-semibold">Từ khóa ATS:</span>
                              {cardState.data.atsKeywords.map((kw, kwIdx) => (
                                <span
                                  key={kwIdx}
                                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700"
                                >
                                  {kw}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/80">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(idx)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-zinc-400" />
                                <span>Chỉnh sửa</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleTriggerRewrite(idx, w)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                                title="Tạo lại phương án khác"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Tối ưu lại</span>
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleCopyRewrite(cardState.data!.customizedText, idx)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-colors cursor-pointer"
                            >
                              {copiedRewriteIndex === idx ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Đã chép</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Sao chép câu này</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. ATS Recommendations */}
      {data.atsRecommendations && data.atsRecommendations.length > 0 && (
        <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <span>Tối ưu hóa bộ lọc tự động ATS</span>
            </h3>
            <span className="text-xs text-zinc-400">4 tiêu chí cấu trúc & từ khóa</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.atsRecommendations.map((ats, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 flex flex-col justify-between gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    {ats.category}
                  </span>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-[11px] font-semibold border',
                      ats.impact === 'Quan trọng'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                    )}
                  >
                    {ats.impact}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  {ats.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4.5. Targeted JD Match & Skill Gap Analysis */}
      {data.jdMatch && (
        <JdMatchCard
          jdMatch={data.jdMatch}
          targetRole={targetRole}
          onOpenCheckout={() => setIsCheckoutModalOpen(true)}
        />
      )}

      {/* 5. AI Disclaimer Banner */}
      <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-start gap-3 text-xs text-zinc-400 leading-relaxed">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p>{data.disclaimer}</p>
      </div>

      {/* 6. Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-800">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onChangeTone(data.tone === 'spicy' ? 'constructive' : 'spicy')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors border border-zinc-700 cursor-pointer"
          >
            {data.tone === 'spicy' ? (
              <>
                <Briefcase className="w-4 h-4 text-cyan-400" />
                <span>Đổi sang giọng &ldquo;Chuyên gia tận tâm&rdquo;</span>
              </>
            ) : (
              <>
                <Flame className="w-4 h-4 text-orange-400" />
                <span>Đổi sang giọng &ldquo;Cà khịa / Sát thủ&rdquo;</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onEditCv}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors border border-zinc-700 cursor-pointer"
          >
            <Edit3 className="w-4 h-4 text-zinc-400" />
            <span>Sửa lại văn bản CV</span>
          </button>

          <button
            type="button"
            data-testid="open-share-modal-btn"
            onClick={() => {
              setIsShareModalOpen(true);
              onShareCard?.();
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-orange-400 hover:text-orange-300 transition-colors border border-orange-500/30 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span>Tạo ảnh chia sẻ</span>
          </button>

          <button
            type="button"
            data-testid="toolbar-go-to-ats-diff-btn"
            onClick={handleGoToAtsDiff}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500/20 to-emerald-500/20 hover:from-amber-500/30 hover:to-emerald-500/30 text-amber-300 transition-colors border border-amber-500/30 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>🎯 Quét chuẩn ATS & Sửa câu</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            <span>Xuất CV cải tiến (.md / .txt)</span>
          </button>

          <button
            type="button"
            onClick={handleStartInterviewFromCv}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/40 hover:to-indigo-600/40 text-purple-200 transition-colors border border-purple-500/40 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>⏱️ Luyện phỏng vấn từ chính CV này</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <WipeDataButton
            onWiped={onReset}
            className="text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10"
          />

          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 transition-all shadow-md cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Tải lên CV khác</span>
          </button>
        </div>
      </div>

      {/* 7. Export CV Modal */}
      <ExportCvModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        originalCvText={cvText || ''}
        reportData={data}
        rewriteStates={rewriteStates}
        targetRole={targetRole}
      />

      {/* 8. Pro Upgrade Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
      />

      {/* 8.5. Viral Roast Share Modal (html-to-image) */}
      <RoastShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        reportData={data}
        score={data.roastScore ?? data.overallScore}
        survivalScore={data.survivalScore}
        funnyTitle={data.funnyTitle}
        weaknesses={data.weaknesses}
        tone={data.tone}
        targetRole={targetRole}
      />

      {/* 9. Floating Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-zinc-900 border border-emerald-500/40 text-xs font-semibold text-zinc-100 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
