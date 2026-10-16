'use client';

import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { toPng, toBlob } from 'html-to-image';
import {
  Download,
  Copy,
  Check,
  Share2,
  EyeOff,
  Eye,
  Sparkles,
  Flame,
  ShieldAlert,
  X,
  Smartphone,
  Square,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { RoastData, WeaknessItem } from '@/lib/schemas/roast';
import { maskPii } from '@/lib/utils/pii-masker';

export const FUNNY_ALIASES = [
  'Fresher Hệ Tâm Linh',
  'Chiến Thần Rải CV',
  'Kẻ Hủy Diệt Vòng Gửi Xe',
  'Chiến Thần Kỹ Năng Mềm',
  'Hiệp Sĩ Fix Bug Gánh Team',
];

export interface RoastShareData {
  candidateName?: string;
  targetRole?: string;
  atsScore?: number;
  score?: number;
  survivalScore?: number;
  funnyTitle?: string;
  tone?: 'spicy' | 'constructive';
  metrics?: {
    impact: number;
    keywords: number;
    zeroCliche: number;
  };
  roastItem?: {
    category: string;
    badgeWarning?: string;
    originalQuote: string;
    aiRoastText: string;
    pointDeduction?: string;
  };
  weaknesses?: WeaknessItem[] | Array<{
    quote: string;
    issue: string;
    severity?: 'Cao' | 'Trung bình' | 'Thấp';
    rejectionReason?: string;
    rejectReason?: string;
    fixGuideline?: string;
  }>;
}

export interface RoastShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData?: RoastData;
  data?: RoastShareData;
  candidateName?: string;
  targetRole?: string;
  score?: number;
  survivalScore?: number;
  funnyTitle?: string;
  weaknesses?: WeaknessItem[];
  tone?: 'spicy' | 'constructive';
}

export default function RoastShareModal({
  isOpen,
  onClose,
  reportData,
  data,
  candidateName: propCandidateName,
  targetRole: propTargetRole,
  score: propScore,
  survivalScore: propSurvivalScore,
  funnyTitle: propFunnyTitle,
  weaknesses: propWeaknesses,
  tone: propTone,
}: RoastShareModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // States
  const [isAnonymous, setIsAnonymous] = useState<boolean>(true);
  const [aliasIndex, setAliasIndex] = useState<number>(0);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '9:16'>('1:1');
  const [activeWeaknessIndex, setActiveWeaknessIndex] = useState<number>(0);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [captionCopied, setCaptionCopied] = useState<boolean>(false);
  const [isNativeShareAvailable, setIsNativeShareAvailable] = useState<boolean>(false);

  // Detect native share support on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setIsNativeShareAvailable(true);
    }
  }, []);

  // Safari iOS font pre-rasterization warm-up
  useEffect(() => {
    if (isOpen && cardRef.current) {
      try {
        toPng(cardRef.current, { pixelRatio: 1, cacheBust: true }).catch(() => {
          // Warmup silent ignore
        });
      } catch {
        // Warmup silent ignore
      }
    }
  }, [isOpen]);

  // Normalize Data
  const effectiveScore =
    propScore ??
    reportData?.roastScore ??
    reportData?.overallScore ??
    data?.atsScore ??
    data?.score ??
    45;

  const effectiveSurvivalScore =
    propSurvivalScore ??
    reportData?.survivalScore ??
    data?.survivalScore ??
    Math.max(10, Math.min(95, effectiveScore > 50 ? effectiveScore - 4 : effectiveScore - 1));

  const effectiveTone = propTone ?? reportData?.tone ?? data?.tone ?? 'spicy';

  const effectiveFunnyTitle = useMemo(() => {
    if (propFunnyTitle) return propFunnyTitle;
    if (reportData?.funnyTitle) return reportData.funnyTitle;
    if (data?.funnyTitle) return data.funnyTitle;
    if (effectiveScore >= 75) return 'Con Nhà Người Ta Hệ ATS';
    if (effectiveScore >= 50) return 'Chiến Binh Vượt Vòng Gửi Xe';
    return 'Huyền Thoại Rải Truyền Đơn';
  }, [propFunnyTitle, reportData?.funnyTitle, data?.funnyTitle, effectiveScore]);

  const rawCandidateName =
    propCandidateName ||
    data?.candidateName ||
    'Ứng viên Fresher';

  const effectiveRole =
    propTargetRole ||
    data?.targetRole ||
    'Ứng viên Fresher / Sinh viên';

  // Normalize Weakness items list
  const weaknessesList = useMemo(() => {
    const list =
      propWeaknesses ||
      reportData?.weaknesses ||
      (data?.weaknesses as WeaknessItem[]) ||
      [];
    if (list.length > 0) return list;

    if (data?.roastItem) {
      return [
        {
          quote: data.roastItem.originalQuote,
          issue: data.roastItem.category,
          severity: 'Cao' as const,
          rejectionReason: data.roastItem.aiRoastText,
          fixGuideline: 'Tối ưu số liệu [số liệu cụ thể]...',
        },
      ];
    }

    return [
      {
        quote: 'Thành thạo tin học văn phòng và có tinh thần ham học hỏi, cầu tiến.',
        issue: 'Kỹ năng sáo rỗng thiếu bằng chứng',
        severity: 'Cao' as const,
        rejectionReason: 'Câu văn kinh điển của 90% fresher bị HR lướt qua trong 3 giây.',
        fixGuideline: 'Bổ sung dự án thực chiến với [số liệu cụ thể]...',
      },
    ];
  }, [propWeaknesses, reportData?.weaknesses, data?.weaknesses, data?.roastItem]);

  const currentWeakness = weaknessesList[activeWeaknessIndex % weaknessesList.length] || weaknessesList[0];

  // PII Decontamination on quote
  const sanitizedQuote = useMemo(() => {
    const rawQuote = currentWeakness?.quote || '';
    const masked = maskPii(rawQuote);
    return masked.sanitizedText;
  }, [currentWeakness?.quote]);

  // PII Sanitization on candidate name if shown
  const sanitizedCandidateName = useMemo(() => {
    return maskPii(rawCandidateName).sanitizedText;
  }, [rawCandidateName]);

  const displayName = isAnonymous
    ? FUNNY_ALIASES[aliasIndex % FUNNY_ALIASES.length]
    : sanitizedCandidateName;

  const cycleAlias = useCallback(() => {
    setAliasIndex((prev) => (prev + 1) % FUNNY_ALIASES.length);
  }, []);

  const getScoreTheme = (score: number) => {
    if (score >= 75) {
      return {
        badge: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
        ring: 'from-emerald-500 to-teal-600',
        label: 'Vượt ATS',
      };
    }
    if (score >= 50) {
      return {
        badge: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
        ring: 'from-amber-500 to-orange-600',
        label: 'Tạm ổn',
      };
    }
    return {
      badge: 'text-rose-400 border-rose-500/40 bg-rose-500/10',
      ring: 'from-rose-500 to-red-700',
      label: 'Báo động đỏ',
    };
  };

  const scoreTheme = getScoreTheme(effectiveScore);

  // 1-Click Download PNG
  const handleDownloadImage = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      setIsGenerating(true);
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: '#09090b',
      });

      const timestamp = Date.now();
      const link = document.createElement('a');
      link.download = `airoastcv-roast-${timestamp}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Lỗi khi xuất ảnh Roast Card PNG:', err);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // 1-Click Copy Image to Clipboard (Desktop) with smooth fallback
  const handleCopyImage = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      setIsGenerating(true);

      const blob = await toBlob(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2.5,
        backgroundColor: '#09090b',
      });

      if (!blob) throw new Error('Blob generation failed');

      // Check for mobile share first if canShare with files is available
      if (
        typeof navigator !== 'undefined' &&
        typeof navigator.canShare === 'function' &&
        typeof navigator.share === 'function'
      ) {
        try {
          const file = new File([blob], `airoastcv-roast-${Date.now()}.png`, {
            type: 'image/png',
          });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: 'AI Roast CV — Mổ xẻ CV không kiêng nể',
              text: `CV mình vừa bị AI Roast: Điểm ATS ${effectiveScore}/100, Điểm sinh tồn ${effectiveSurvivalScore}/100 💀 Danh hiệu: "${effectiveFunnyTitle}". Thử ngay tại https://airoastcv.vn`,
              files: [file],
            });
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
            return;
          }
        } catch (shareErr) {
          // If user aborted or rejected share, fall through to clipboard
          if ((shareErr as Error)?.name === 'AbortError') {
            return;
          }
        }
      }

      // Desktop: ClipboardItem
      if (
        typeof ClipboardItem !== 'undefined' &&
        navigator.clipboard &&
        typeof navigator.clipboard.write === 'function'
      ) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } else {
        // Fallback to download
        await handleDownloadImage();
      }
    } catch (err) {
      console.warn('Clipboard write thất bại, chuyển sang tải ảnh:', err);
      await handleDownloadImage();
    } finally {
      setIsGenerating(false);
    }
  }, [effectiveScore, effectiveSurvivalScore, effectiveFunnyTitle, handleDownloadImage]);

  // Mobile Native Share
  const handleNativeShare = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      setIsGenerating(true);
      const blob = await toBlob(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2.5,
        backgroundColor: '#09090b',
      });

      if (blob && typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        const file = new File([blob], `airoastcv-roast-${Date.now()}.png`, {
          type: 'image/png',
        });
        if (
          typeof navigator.canShare === 'function' &&
          navigator.canShare({ files: [file] })
        ) {
          await navigator.share({
            title: 'AI Roast CV — Mổ xẻ CV không kiêng nể',
            text: `CV mình vừa bị AI Roast: Điểm ATS ${effectiveScore}/100, Điểm sinh tồn ${effectiveSurvivalScore}/100 💀 "${sanitizedQuote}"\nKhám phá tại: https://airoastcv.vn`,
            files: [file],
          });
          return;
        } else {
          // Fallback share without file
          await navigator.share({
            title: 'AI Roast CV — Mổ xẻ CV không kiêng nể',
            text: `CV mình vừa bị AI Roast: Điểm ATS ${effectiveScore}/100 (Điểm sinh tồn: ${effectiveSurvivalScore}/100) 💀 Danh hiệu: "${effectiveFunnyTitle}". Khám phá tại: https://airoastcv.vn`,
            url: 'https://airoastcv.vn',
          });
          return;
        }
      }

      await handleCopyImage();
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        console.warn('Lỗi native share, kích hoạt tải ảnh:', err);
        await handleDownloadImage();
      }
    } finally {
      setIsGenerating(false);
    }
  }, [
    effectiveScore,
    effectiveSurvivalScore,
    effectiveFunnyTitle,
    sanitizedQuote,
    handleCopyImage,
    handleDownloadImage,
  ]);

  // Copy Viral Caption
  const handleCopyCaption = () => {
    const roastReason = currentWeakness?.rejectionReason || currentWeakness?.issue || 'Không có gì nổi bật';
    const caption = `Vừa đưa CV cho AI Roast chấm thử, kết quả còn đúng ${effectiveScore}/100 điểm (Điểm sinh tồn: ${effectiveSurvivalScore}/100) 💀\n\nNó chê câu "${sanitizedQuote}" của mình là: "${roastReason}" 😭\n\nDanh hiệu nhận được: "${effectiveFunnyTitle}".\nAnh em vào test nhân phẩm CV miễn phí tại: https://airoastcv.vn`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(caption);
      setCaptionCopied(true);
      setTimeout(() => setCaptionCopied(false), 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Xuất ảnh Roast Card chia sẻ mạng xã hội"
      data-testid="roast-share-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 overflow-y-auto"
    >
      <div className="relative w-full max-w-4xl rounded-3xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-6 my-auto max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng cửa sổ"
          className="absolute right-4 top-4 z-20 rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ================= LEFT COLUMN: CARD PREVIEW ================= */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center bg-zinc-900/60 rounded-2xl p-4 sm:p-6 border border-zinc-800/80 overflow-hidden">
          <div className="text-xs text-zinc-400 mb-3 flex items-center gap-1.5 self-start">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            <span>Bản xem trước thẻ ảnh (100% Client-Side Privacy)</span>
          </div>

          {/* ================= DOM TO CAPTURE ================= */}
          <div
            ref={cardRef}
            data-testid="roast-card-capture"
            className={`relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 text-white shadow-2xl transition-all duration-300 flex flex-col justify-between ${
              aspectRatio === '1:1'
                ? 'w-[340px] sm:w-[400px] min-h-[400px] sm:min-h-[420px] p-5 sm:p-6'
                : 'w-[310px] sm:w-[350px] min-h-[560px] sm:min-h-[620px] p-5 sm:p-6 py-7'
            }`}
          >
            {/* Dark Cyberpunk Ambient Glows */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-orange-600/20 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-rose-600/15 blur-3xl"
            />

            {/* 1. Header */}
            <div className="relative z-10">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-2.5 w-2.5 rounded-full animate-pulse ${
                      effectiveTone === 'spicy' ? 'bg-orange-500' : 'bg-cyan-500'
                    }`}
                  />
                  <span
                    className={`font-mono text-[11px] font-bold tracking-wider uppercase ${
                      effectiveTone === 'spicy' ? 'text-orange-400' : 'text-cyan-400'
                    }`}
                  >
                    {effectiveTone === 'spicy' ? 'MỎ HỖN ROAST // V2.0' : 'CHUYÊN GIA ROAST // V2.0'}
                  </span>
                </div>
                <span className="rounded bg-zinc-900 border border-zinc-700/70 px-2 py-0.5 font-mono text-[10px] text-zinc-300 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  AI SCANNED
                </span>
              </div>

              {/* 2. Candidate Persona & Score Badges */}
              <div className="mt-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-zinc-400">👤 Hồ sơ:</span>
                    <h3
                      data-testid="share-display-name"
                      className="font-bold text-sm sm:text-base text-zinc-100 truncate max-w-[170px]"
                    >
                      {displayName}
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5 truncate max-w-[190px]">
                    {effectiveRole}
                  </p>
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900/90 border border-orange-500/30 text-[11px] font-semibold text-orange-300">
                    <span>🏷️ {effectiveFunnyTitle}</span>
                  </div>
                </div>

                {/* Score & Survival score badges */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <div
                    className={`flex flex-col items-end rounded-xl border px-2.5 py-1 ${scoreTheme.badge}`}
                  >
                    <span className="text-[9px] font-mono uppercase opacity-80">
                      Điểm ATS
                    </span>
                    <span className="text-base sm:text-lg font-extrabold font-mono leading-tight">
                      {effectiveScore}/100
                    </span>
                  </div>

                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-900/90 border border-zinc-700/60 text-[10px] font-mono text-zinc-300">
                    <span className="text-rose-400">⚡ Sinh tồn:</span>
                    <span className="font-bold text-rose-300">
                      {effectiveSurvivalScore}/100
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Roast Quote & Commentary */}
            <div className="my-3 sm:my-4 space-y-2.5 relative z-10">
              {/* Category tag */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-md bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 text-[11px] font-medium text-rose-300">
                  {currentWeakness.issue}
                </span>
                <span className="rounded-md bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                  ⚠️ {currentWeakness.severity ? `Mức độ: ${currentWeakness.severity}` : 'Cần sửa gấp'}
                </span>
              </div>

              {/* Original Quote in CV (Decontaminated) */}
              <div className="rounded-xl bg-zinc-900/90 border border-zinc-800 p-3">
                <div className="text-[10px] text-zinc-400 mb-1 font-medium">
                  Trích dẫn trong CV:
                </div>
                <blockquote
                  data-testid="share-sanitized-quote"
                  className="text-xs sm:text-sm italic text-zinc-200 line-clamp-3 leading-snug"
                >
                  &ldquo;{sanitizedQuote}&rdquo;
                </blockquote>
              </div>

              {/* AI Roast Commentary */}
              <div className="rounded-xl bg-gradient-to-br from-orange-500/15 via-rose-500/10 to-zinc-900 border border-orange-500/40 p-3 shadow-inner">
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1 text-xs font-bold text-orange-400">
                    <Flame className="w-3.5 h-3.5 fill-orange-400" />
                    {effectiveTone === 'spicy' ? 'AI Roast:' : 'Nhận xét AI:'}
                  </span>
                  <span className="font-mono text-[10px] font-semibold text-rose-400">
                    -{Math.max(15, 100 - effectiveScore)} điểm
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-zinc-100 leading-relaxed line-clamp-3">
                  {currentWeakness.rejectionReason || currentWeakness.issue}
                </p>
              </div>
            </div>

            {/* 4. Mini Metrics & Watermark */}
            <div className="relative z-10 pt-1">
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3">
                <div className="rounded-lg bg-zinc-900/80 border border-zinc-800/80 p-1.5 text-center">
                  <div className="text-[9px] text-zinc-400">Tác động</div>
                  <div className="font-mono text-xs font-bold text-zinc-100">
                    {data?.metrics?.impact ?? Math.max(20, Math.min(95, effectiveScore - 8))}%
                  </div>
                </div>
                <div className="rounded-lg bg-zinc-900/80 border border-zinc-800/80 p-1.5 text-center">
                  <div className="text-[9px] text-zinc-400">Từ khóa ATS</div>
                  <div className="font-mono text-xs font-bold text-zinc-100">
                    {data?.metrics?.keywords ?? Math.max(30, Math.min(98, effectiveScore + 6))}%
                  </div>
                </div>
                <div className="rounded-lg bg-zinc-900/80 border border-zinc-800/80 p-1.5 text-center">
                  <div className="text-[9px] text-zinc-400">Zero Cliché</div>
                  <div className="font-mono text-xs font-bold text-zinc-100">
                    {data?.metrics?.zeroCliche ?? Math.max(15, Math.min(92, effectiveSurvivalScore))}%
                  </div>
                </div>
              </div>

              {/* Watermark Logo */}
              <div className="flex items-center justify-between border-t border-zinc-800/80 pt-2.5 text-[10px] font-mono text-zinc-400">
                <span className="text-zinc-300 font-semibold flex items-center gap-1">
                  🔥 AI Roast CV • airoastcv.vn
                </span>
                <span className="text-[9px] text-zinc-500 uppercase">
                  100% Client-Side Privacy
                </span>
              </div>
            </div>
          </div>
          {/* ================= END DOM TO CAPTURE ================= */}
        </div>

        {/* ================= RIGHT COLUMN: CONTROLS & ACTIONS ================= */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 px-3 py-1 text-xs font-semibold text-orange-400">
                <Flame className="w-3.5 h-3.5" /> Thẻ Chia Sẻ Viral
              </span>
              <h2 className="mt-2 text-lg sm:text-xl font-bold text-white">
                Tạo thẻ &ldquo;Roast Card&rdquo;
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Khoe độ phũ của AI lên Threads, Facebook hoặc Story với bảo mật danh tính tự động.
              </p>
            </div>

            {/* Control 1: Aspect Ratio Switcher */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                1. Kích thước đăng bài
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  data-testid="ratio-1-1-btn"
                  onClick={() => setAspectRatio('1:1')}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-medium transition cursor-pointer ${
                    aspectRatio === '1:1'
                      ? 'border-orange-500 bg-orange-500/15 text-orange-300'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  <Square className="w-4 h-4" />
                  Vuông 1:1 (Threads/FB)
                </button>
                <button
                  type="button"
                  data-testid="ratio-9-16-btn"
                  onClick={() => setAspectRatio('9:16')}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-medium transition cursor-pointer ${
                    aspectRatio === '9:16'
                      ? 'border-orange-500 bg-orange-500/15 text-orange-300'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  Dọc 9:16 (Story/TikTok)
                </button>
              </div>
            </div>

            {/* Control 2: Anonymous Mode */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                2. Chế độ danh tính
              </label>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isAnonymous ? (
                      <EyeOff className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-amber-400" />
                    )}
                    <span className="text-xs font-medium text-zinc-200">
                      Chế độ ẩn danh
                    </span>
                  </div>

                  <button
                    type="button"
                    data-testid="toggle-anonymous-btn"
                    onClick={() => setIsAnonymous(!isAnonymous)}
                    className="rounded-lg bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition cursor-pointer"
                  >
                    {isAnonymous ? 'Hiện tên thật' : 'Bật ẩn danh'}
                  </button>
                </div>

                {isAnonymous && (
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                    <span className="text-xs text-zinc-400 truncate max-w-[190px]">
                      Biệt danh: <strong className="text-orange-300">{displayName}</strong>
                    </span>
                    <button
                      type="button"
                      data-testid="cycle-alias-btn"
                      onClick={cycleAlias}
                      className="text-xs text-orange-400 hover:text-orange-300 font-medium cursor-pointer"
                    >
                      🎲 Đổi biệt danh khác
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Control 3: Weakness selector (if multiple) */}
            {weaknessesList.length > 1 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    3. Chọn câu Roast muốn khoe
                  </label>
                  <span className="text-xs text-zinc-500">
                    {activeWeaknessIndex + 1}/{weaknessesList.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Câu trước"
                    onClick={() =>
                      setActiveWeaknessIndex(
                        (prev) => (prev - 1 + weaknessesList.length) % weaknessesList.length
                      )
                    }
                    className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex-1 truncate rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-300">
                    {currentWeakness.issue}
                  </div>

                  <button
                    type="button"
                    aria-label="Câu tiếp theo"
                    onClick={() =>
                      setActiveWeaknessIndex((prev) => (prev + 1) % weaknessesList.length)
                    }
                    className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Control 4: Viral Caption for Threads */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Caption mẫu đăng Threads
                </label>
                <button
                  type="button"
                  data-testid="copy-caption-btn"
                  onClick={handleCopyCaption}
                  className="text-xs font-medium text-orange-400 hover:text-orange-300 flex items-center gap-1 cursor-pointer"
                >
                  {captionCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Đã copy!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy văn mẫu
                    </>
                  )}
                </button>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-2.5 text-xs text-zinc-400 italic line-clamp-2">
                &ldquo;Vừa đưa CV cho AI Roast chấm thử, kết quả còn đúng {effectiveScore}/100 điểm...&rdquo;
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            {/* Primary Action: 1-Click Copy Image to Clipboard */}
            <button
              type="button"
              data-testid="copy-image-btn"
              disabled={isGenerating}
              onClick={handleCopyImage}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 hover:opacity-95 disabled:opacity-50 transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Đã sao chép ảnh! Dán ngay lên Threads / FB</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>
                    {isGenerating ? 'Đang xuất ảnh...' : 'Sao chép ảnh (Clipboard)'}
                  </span>
                </>
              )}
            </button>

            {/* Secondary Action: Mobile Native Share (or button) */}
            {isNativeShareAvailable && (
              <button
                type="button"
                data-testid="native-share-btn"
                disabled={isGenerating}
                onClick={handleNativeShare}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-purple-500/40 bg-purple-950/30 px-4 py-2.5 text-xs font-semibold text-purple-200 hover:bg-purple-900/40 disabled:opacity-50 transition cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-purple-400" />
                <span>Chia sẻ qua ứng dụng (Story/Zalo/Threads)</span>
              </button>
            )}

            {/* Download PNG Button */}
            <button
              type="button"
              data-testid="download-png-btn"
              disabled={isGenerating}
              onClick={handleDownloadImage}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 disabled:opacity-50 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Tải ảnh PNG</span>
            </button>

            <p className="text-[11px] text-center text-zinc-500 flex items-center justify-center gap-1 pt-1">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-500" />
              <span>Ảnh tạo trực tiếp tại trình duyệt, không lưu máy chủ.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
