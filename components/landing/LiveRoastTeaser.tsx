'use client';

import React, { useState, useId } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  AlertCircle,
  Zap,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { soundEngine } from '@/lib/audio/sound-engine';
import { cn } from '@/lib/utils/cn';
import {
  useTeaserUsage,
  TEASER_STORAGE_KEY,
  MAX_TEASER_CALLS_PER_DAY,
} from '@/lib/rate-limit/teaser-limiter';

export interface TeaserPreset {
  id: string;
  pillLabel: string;
  sentence: string;
  roastComment: string;
  actionVerb: string;
  atsRewrite: string;
}

export const PRESET_TEASER_SAMPLES: TeaserPreset[] = [
  {
    id: 'sample_1',
    pillLabel: 'Tham gia phát triển website...',
    sentence: 'Tham gia phát triển website bán hàng cùng nhóm.',
    roastComment:
      'Chữ "tham gia" trong CV thường có nghĩa là bạn chỉ ngồi nhìn người khác gõ code hoặc mở Google Meet đúng giờ. Không số liệu, không vai trò, tỷ lệ bị loại vòng gửi xe là 99%!',
    actionVerb: 'Chủ trì thiết kế và phát triển',
    atsRewrite:
      'Chủ trì phát triển module [tính năng giỏ hàng / thanh toán] cho nền tảng thương mại điện tử bằng [Next.js & TypeScript], giúp rút ngắn [X%] thời gian tải trang và phục vụ [Y] người dùng ổn định.',
  },
  {
    id: 'sample_2',
    pillLabel: 'Hỗ trợ quản lý fanpage...',
    sentence: 'Hỗ trợ quản lý fanpage và đăng bài hàng ngày.',
    roastComment:
      'Lên Canva gõ text rồi bấm nút "Đăng bài" không phải là Digital Marketing! Đừng biến CV thành nhật ký lướt Facebook của bạn!',
    actionVerb: 'Xây dựng và tối ưu chiến lược nội dung',
    atsRewrite:
      'Xây dựng chiến lược nội dung đa kênh cho fanpage [tên thương hiệu], gia tăng tỷ lệ tương tác (ER) lên [X%] và thu hút [Y] khách hàng tiềm năng chất lượng cao mỗi tháng.',
  },
  {
    id: 'sample_3',
    pillLabel: 'Em là sinh viên chăm chỉ...',
    sentence: 'Em là người chăm chỉ, ham học hỏi, chịu được áp lực cao.',
    roastComment:
      'Năm 2026 rồi mà vẫn viết văn mẫu thế kỷ trước! Nhà tuyển dụng tìm nhân sự tạo ra doanh thu và giải quyết vấn đề, không tìm người chịu đựng khổ đau!',
    actionVerb: 'Chủ động làm chủ và ứng dụng',
    atsRewrite:
      'Chủ động nghiên cứu và làm chủ [công nghệ / công cụ mới], áp dụng giải quyết [bài toán thực tế] trong dự án [tên dự án] hoàn thành vượt tiến độ [X tuần].',
  },
  {
    id: 'sample_4',
    pillLabel: 'Có kỹ năng làm việc nhóm tốt...',
    sentence: 'Có kỹ năng giao tiếp tốt và làm việc nhóm hiệu quả.',
    roastComment:
      'Ai sinh ra cũng biết nói và thở! Ghi "kỹ năng giao tiếp tốt" mà không có dự án thực chiến chứng minh thì nhà tuyển dụng chỉ xem là câu nói cho có.',
    actionVerb: 'Phối hợp liên chức năng',
    atsRewrite:
      'Phối hợp hiệu quả liên chức năng theo mô hình [Agile / Scrum] với [X thành viên], quản lý tiến độ công việc qua [Jira] và bàn giao [Y sprint / dự án] đúng hạn 100%.',
  },
];

export const MAX_TEASER_LENGTH = 250;
export const MIN_TEASER_LENGTH = 10;
export const MAX_DAILY_QUOTA = MAX_TEASER_CALLS_PER_DAY;
export const STORAGE_KEY_TEASER_USAGE = TEASER_STORAGE_KEY;

export interface LiveRoastTeaserProps {
  className?: string;
  onRoastFullCv?: () => void;
}

export function LiveRoastTeaser({ className, onRoastFullCv }: LiveRoastTeaserProps) {
  const { remaining: remainingQuota, recordUsage, syncRemaining } = useTeaserUsage();
  const [inputSentence, setInputSentence] = useState<string>('');
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [roastResult, setRoastResult] = useState<{
    roastComment: string;
    atsRewrite: string;
    actionVerb?: string;
    isFallback?: boolean;
  } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const inputId = useId();

  const generateDeterministicFallback = (text: string) => {
    const lower = text.toLowerCase();
    let roast =
      'Câu này dùng quá nhiều từ ngữ chung chung, hoàn toàn thiếu số liệu chứng minh hiệu quả và vị trí thực sự trong dự án!';
    let actionVerb = 'Tối ưu hóa và triển khai';
    let ats =
      'Tối ưu hóa quy trình [nghiệp vụ / dự án] bằng [công cụ / kỹ năng], đạt hiệu quả [số liệu cụ thể %] và được đánh giá cao bởi [quản lý / khách hàng].';

    if (lower.includes('chăm chỉ') || lower.includes('ham học')) {
      roast =
        'Chăm chỉ và ham học hỏi là tiêu chuẩn tối thiểu để sinh tồn, không phải là thành tích tạo ra doanh thu để ghi vào CV!';
      actionVerb = 'Chủ động nghiên cứu và áp dụng';
      ats =
        'Chủ động làm chủ [công nghệ / kỹ năng mới] trong vòng [X tuần], áp dụng tối ưu [tính năng / quy trình] đạt tiến độ [100%].';
    } else if (lower.includes('nhóm') || lower.includes('giao tiếp')) {
      roast =
        'Làm việc nhóm tốt nhưng không chứng minh được bạn đã giải quyết mâu thuẫn hay tăng năng suất nhóm lên bao nhiêu % thì chỉ là sáo rỗng!';
      actionVerb = 'Điều phối và liên kết';
      ats =
        'Điều phối hiệu quả [dự án / nhiệm vụ] cùng [X thành viên], quản lý tiến độ qua [Jira / Trello] và bàn giao đúng hạn [100%].';
    }

    return {
      roastComment: roast,
      atsRewrite: ats,
      actionVerb,
      isFallback: true,
    };
  };

  const executeRoast = async (sentenceToRoast: string, presetSample?: TeaserPreset) => {
    const trimmed = sentenceToRoast.trim();
    if (trimmed.length < MIN_TEASER_LENGTH) {
      setErrorMessage(`Câu kinh nghiệm cần tối thiểu ${MIN_TEASER_LENGTH} ký tự.`);
      return;
    }

    if (remainingQuota <= 0) {
      setErrorMessage('Bạn đã sử dụng hết 3/3 lượt thử miễn phí hôm nay.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    soundEngine.playFlame();

    // Fast-path: Check preset match locally for sub-10ms response
    const matchedPreset =
      presetSample ||
      PRESET_TEASER_SAMPLES.find(
        (p) => p.sentence.trim().toLowerCase() === trimmed.toLowerCase()
      );

    if (matchedPreset) {
      setTimeout(() => {
        setRoastResult({
          roastComment: matchedPreset.roastComment,
          atsRewrite: matchedPreset.atsRewrite,
          actionVerb: matchedPreset.actionVerb,
          isFallback: false,
        });
        setIsLoading(false);
        recordUsage();
      }, 50);
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1400);

      const res = await fetch('/api/roast/teaser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence: trimmed }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setRoastResult({
            roastComment: data.data.roastComment,
            atsRewrite: data.data.atsRewrite,
            actionVerb: data.data.actionVerb,
            isFallback: data.isFallback,
          });
          if (typeof data.remainingCalls === 'number') {
            syncRemaining(data.remainingCalls);
          } else {
            recordUsage();
          }
          return;
        }
      }

      if (res.status === 429) {
        syncRemaining(0);
        setErrorMessage('Bạn đã sử dụng hết 3/3 lượt thử miễn phí hôm nay.');
        return;
      }

      throw new Error('API fallback required');
    } catch {
      // Deterministic Offline Heuristic Fallback
      const fallbackResult = generateDeterministicFallback(trimmed);
      setRoastResult(fallbackResult);
      recordUsage();
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetClick = (preset: TeaserPreset) => {
    setInputSentence(preset.sentence);
    setActivePresetId(preset.id);
    soundEngine.playBlip();
    executeRoast(preset.sentence, preset);
  };

  const handleCopy = async () => {
    if (!roastResult?.atsRewrite) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(roastResult.atsRewrite);
        setCopied(true);
        soundEngine.playBlip();
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  };

  const handleClear = () => {
    setInputSentence('');
    setActivePresetId(null);
    setRoastResult(null);
    setErrorMessage(null);
    soundEngine.playBlip();
  };

  const renderHighlightedAts = (text: string) => {
    const parts = text.split(/(\[[^\]]+\])/g);
    return parts.map((part, index) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        return (
          <span
            key={index}
            className="inline-block px-1.5 py-0.5 mx-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 text-xs sm:text-sm tracking-wide"
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const canSubmit = inputSentence.trim().length >= MIN_TEASER_LENGTH && remainingQuota > 0 && !isLoading;

  return (
    <section
      id="live-roast-teaser"
      className={cn('relative max-w-4xl mx-auto px-4 sm:px-6 my-16', className)}
    >
      <div className="text-center mb-6">
        <Badge variant="spicy" className="mb-2 px-3 py-1">
          <Zap className="w-3.5 h-3.5 text-orange-400" />
          Trải nghiệm siêu tốc &lt; 1.5s
        </Badge>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Test Thử 1 Câu CV — Nhận Roast Sâu Cay &amp; Viết Lại ATS
        </h2>
        <p className="text-sm text-zinc-400 mt-2 max-w-xl mx-auto">
          Dán 1 câu mô tả kinh nghiệm bất kỳ hoặc chọn câu mẫu bên dưới để xem AI mổ xẻ sự thật
          trần trụi và nâng cấp thành bullet chuẩn ATS.
        </p>
      </div>

      {/* Main Teaser Box */}
      <div className="relative rounded-2xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-md p-5 sm:p-6 shadow-2xl">
        {/* Preset Pills */}
        <div className="mb-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            Chọn nhanh 4 câu mẫu kinh điển:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PRESET_TEASER_SAMPLES.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetClick(preset)}
                className={cn(
                  'text-left px-3.5 py-2 rounded-xl text-xs sm:text-sm transition-all border flex items-center justify-between gap-2',
                  activePresetId === preset.id
                    ? 'bg-orange-500/15 border-orange-500/50 text-orange-300 font-medium'
                    : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600'
                )}
                aria-label={`Thử câu mẫu: ${preset.pillLabel}`}
              >
                <span className="truncate">&ldquo;{preset.pillLabel}&rdquo;</span>
                <span className="text-[10px] uppercase font-bold text-orange-400/80 shrink-0">
                  Thử ngay ➔
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <div className="relative mt-4">
          <label htmlFor={inputId} className="sr-only">
            Nhập 1 câu kinh nghiệm trong CV (tối đa 250 ký tự)
          </label>
          <div className="relative rounded-xl border border-zinc-700 bg-zinc-950/60 focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500 transition-all">
            <textarea
              id={inputId}
              value={inputSentence}
              onChange={(e) => setInputSentence(e.target.value.slice(0, MAX_TEASER_LENGTH))}
              placeholder="Hoặc dán 1 câu kinh nghiệm của bạn vào đây (ví dụ: 'Tham gia dự án phát triển hệ thống...')"
              rows={2}
              maxLength={MAX_TEASER_LENGTH}
              className="w-full bg-transparent px-4 py-3 text-sm sm:text-base text-zinc-100 placeholder:text-zinc-500 resize-none outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (canSubmit) executeRoast(inputSentence);
                }
              }}
            />

            {/* Input Controls Bar */}
            <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-800/80 bg-zinc-900/40 text-xs">
              <div className="flex items-center gap-3">
                {/* Character Counter */}
                <span
                  className={cn(
                    'font-mono text-xs',
                    inputSentence.length >= MAX_TEASER_LENGTH
                      ? 'text-rose-400 font-bold'
                      : inputSentence.length > 0 && inputSentence.trim().length < MIN_TEASER_LENGTH
                      ? 'text-amber-400'
                      : 'text-zinc-400'
                  )}
                >
                  {inputSentence.length}/{MAX_TEASER_LENGTH} ký tự
                </span>

                {/* Quota Indicator */}
                <span className="text-zinc-400 border-l border-zinc-700 pl-3">
                  {`Còn ${remainingQuota}/${MAX_DAILY_QUOTA} lượt thử miễn phí hôm nay`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {inputSentence.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                    aria-label="Xóa nội dung đã nhập"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  disabled={!canSubmit}
                  onClick={() => executeRoast(inputSentence)}
                  className={cn(
                    'px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all shadow-md',
                    canSubmit
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white active:scale-95 shadow-orange-500/20'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
                  )}
                  aria-label="Bấm để Roast câu này"
                >
                  {isLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Đang roast...</span>
                    </>
                  ) : (
                    <>
                      <Flame className="w-3.5 h-3.5" />
                      <span>Roast ngay</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error / Quota Notice */}
        {errorMessage && (
          <div
            role="alert"
            className="mt-3 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs sm:text-sm flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            {remainingQuota <= 0 && (
              <Link
                href="/roast"
                onClick={onRoastFullCv}
                className="text-xs font-semibold text-rose-300 hover:text-white underline underline-offset-2 shrink-0"
              >
                Tải toàn bộ CV (Miễn phí) ➔
              </Link>
            )}
          </div>
        )}

        {/* Results Presentation Area */}
        <AnimatePresence>
          {roastResult && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mt-6 pt-6 border-t border-zinc-800 space-y-4"
              aria-live="polite"
            >
              {/* Spicy Roast Card */}
              <div className="p-4 sm:p-5 rounded-xl bg-orange-950/20 border border-orange-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                    Nhận xét sắc bén (Spicy Roast)
                  </span>
                </div>
                <p className="text-sm sm:text-base text-zinc-100 italic leading-relaxed">
                  &ldquo;{roastResult.roastComment}&rdquo;
                </p>
              </div>

              {/* ATS Rewrite Card */}
              <div className="p-4 sm:p-5 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Gợi ý viết lại chuẩn ATS (Action Verb + [Số liệu])
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-900/40 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900/60 transition-colors"
                    aria-label="Sao chép câu viết lại chuẩn ATS"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Đã sao chép!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-sm sm:text-base text-zinc-100 leading-relaxed">
                  • {renderHighlightedAts(roastResult.atsRewrite)}
                </p>
                <p className="text-[11px] text-zinc-400 mt-2">
                  💡 <em>Lưu ý: Thay thế các phần <code className="text-emerald-300">[...]</code> bằng số liệu thực tế từ công việc của bạn. Tuyệt đối không bịa đặt số liệu.</em>
                </p>
              </div>

              {/* Bottom CTA to Full Roast */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <span className="text-xs text-zinc-400">
                  Muốn AI mổ xẻ toàn bộ CV kèm điểm số ATS và lỗi nghiêm trọng?
                </span>
                <Link
                  href="/roast"
                  onClick={onRoastFullCv}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 transition-all hover:border-orange-500/50 shadow-sm"
                >
                  <span>Roast toàn bộ CV của bạn</span>
                  <ArrowRight className="w-4 h-4 text-orange-400" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

export default LiveRoastTeaser;
