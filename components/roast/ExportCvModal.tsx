'use client';

import React, { useState, useMemo } from 'react';
import {
  Download,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { RoastData } from '@/lib/schemas/roast';
import { cn } from '@/lib/utils/cn';

export interface WeaknessRewriteItem {
  originalQuote: string;
  rewrittenText: string;
  customizedText: string;
  actionVerb: string;
  actionVerbCategory?: string;
  context: string;
  result: string;
  explanation: string;
  atsKeywords: string[];
}

export interface WeaknessCardState {
  status: 'idle' | 'loading' | 'success' | 'error';
  data?: WeaknessRewriteItem;
  isEditing?: boolean;
  draftText?: string;
  errorMessage?: string;
}

export interface ExportCvModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalCvText: string;
  reportData: RoastData;
  rewriteStates: Record<number, WeaknessCardState>;
  targetRole?: string;
}

export function ExportCvModal({
  isOpen,
  onClose,
  originalCvText,
  reportData,
  rewriteStates,
  targetRole,
}: ExportCvModalProps) {
  const [activeTab, setActiveTab] = useState<'md' | 'txt'>('md');
  const [isCopied, setIsCopied] = useState(false);

  // Filter optimized weaknesses
  const optimizedItems = useMemo(() => {
    return Object.entries(rewriteStates).filter(
      ([, state]) => state.status === 'success' && state.data
    );
  }, [rewriteStates]);

  // Generate Improved Markdown CV
  const markdownContent = useMemo(() => {
    let baseText = (originalCvText || '').trim();
    if (!baseText) {
      baseText = `# CV ỨNG TUYỂN${targetRole ? ` — ${targetRole.toUpperCase()}` : ''}\n\n${reportData.summaryVerdict}`;
    }

    // Substitute optimized quotes
    optimizedItems.forEach(([idxStr, state]) => {
      const idx = parseInt(idxStr, 10);
      const weakness = reportData.weaknesses[idx];
      if (weakness && state.data) {
        const replacement = state.data.customizedText;
        if (baseText.includes(weakness.quote)) {
          baseText = baseText.replace(weakness.quote, replacement);
        } else {
          // Normalized whitespace replacement fallback
          const normalizedQuote = weakness.quote.replace(/\s+/g, ' ').trim();
          const escaped = normalizedQuote.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          baseText = baseText.replace(new RegExp(escaped, 'g'), replacement);
        }
      }
    });

    // Append ATS Optimization Appendix
    let appendix = `\n\n---\n\n## BẢNG TỔNG HỢP CẢI TIẾN CHUẨN ATS (ACTION VERB + CONTEXT + RESULT)\n\n`;
    if (optimizedItems.length === 0) {
      appendix += `*Chưa có mục nào được tối ưu qua trợ lý ATS.*\n`;
    } else {
      optimizedItems.forEach(([idxStr, state]) => {
        const idx = parseInt(idxStr, 10);
        const w = reportData.weaknesses[idx];
        const d = state.data!;
        appendix += `### Mục ${idx + 1}: ${w.issue}\n`;
        appendix += `- **Đoạn gốc:** *"${w.quote}"*\n`;
        appendix += `- **Đoạn đã tối ưu ATS:** **${d.customizedText}**\n`;
        appendix += `- **Động từ hành động (Action Verb):** ${d.actionVerb}\n`;
        appendix += `- **Bối cảnh (Context):** ${d.context}\n`;
        appendix += `- **Kết quả đo lường (Result):** ${d.result}\n`;
        if (d.atsKeywords && d.atsKeywords.length > 0) {
          appendix += `- **Từ khóa ATS:** \`${d.atsKeywords.join('`, `')}\`\n`;
        }
        appendix += `\n`;
      });
    }

    return baseText + appendix;
  }, [originalCvText, targetRole, reportData, optimizedItems]);

  // Generate Improved Plain Text CV
  const plainTextContent = useMemo(() => {
    let baseText = (originalCvText || '').trim();
    if (!baseText) {
      baseText = `CV UNG TUYEN${targetRole ? ` - ${targetRole.toUpperCase()}` : ''}\n\n${reportData.summaryVerdict}`;
    }

    optimizedItems.forEach(([idxStr, state]) => {
      const idx = parseInt(idxStr, 10);
      const weakness = reportData.weaknesses[idx];
      if (weakness && state.data) {
        const replacement = state.data.customizedText;
        if (baseText.includes(weakness.quote)) {
          baseText = baseText.replace(weakness.quote, replacement);
        } else {
          const normalizedQuote = weakness.quote.replace(/\s+/g, ' ').trim();
          const escaped = normalizedQuote.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          baseText = baseText.replace(new RegExp(escaped, 'g'), replacement);
        }
      }
    });

    let appendix = `\n\n=======================================================\nBANG TONG HOP CAC MUC DA TOI UU HOA CHUAN ATS\nCong thuc: Action Verb + Context + Result\n=======================================================\n\n`;
    if (optimizedItems.length === 0) {
      appendix += `Chua co muc nao duoc toi uu qua tro ly ATS.\n`;
    } else {
      optimizedItems.forEach(([idxStr, state]) => {
        const idx = parseInt(idxStr, 10);
        const w = reportData.weaknesses[idx];
        const d = state.data!;
        appendix += `[Muc ${idx + 1}: ${w.issue}]\n`;
        appendix += `- Doan goc: "${w.quote}"\n`;
        appendix += `- Doan toi uu ATS: ${d.customizedText}\n`;
        appendix += `- Dong tu hanh dong: ${d.actionVerb}\n`;
        appendix += `- Boi canh: ${d.context}\n`;
        appendix += `- Ket qua do luong: ${d.result}\n`;
        if (d.atsKeywords && d.atsKeywords.length > 0) {
          appendix += `- Tu khoa ATS: ${d.atsKeywords.join(', ')}\n`;
        }
        appendix += `\n`;
      });
    }

    return baseText + appendix;
  }, [originalCvText, targetRole, reportData, optimizedItems]);

  const displayedContent = activeTab === 'md' ? markdownContent : plainTextContent;

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(displayedContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownload = (format: 'md' | 'txt') => {
    const content = format === 'md' ? markdownContent : plainTextContent;
    const filename = `CV_ToiUu_ATS.${format}`;
    const mimeType = format === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8';

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Xuất CV Đã Cải Tiến Chuẩn ATS" className="max-w-2xl">
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="text-lg font-bold text-zinc-100">Xuất CV Đã Cải Tiến Chuẩn ATS</h3>
            </div>
            <p className="text-xs text-zinc-400">
              Toàn bộ các điểm yếu đã tối ưu sẽ được tự động thay thế vào bản CV của bạn.
            </p>
          </div>

          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
            {optimizedItems.length}/{reportData.weaknesses.length} mục đã tối ưu
          </span>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('md')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
                activeTab === 'md'
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              Markdown (.md)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('txt')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
                activeTab === 'txt'
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              Văn bản thuần (.txt)
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Xử lý 100% tại trình duyệt</span>
          </div>
        </div>

        {/* Preview Container */}
        <div className="relative">
          <pre className="max-h-72 overflow-y-auto p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs font-mono text-zinc-300 leading-relaxed whitespace-pre-wrap select-all">
            {displayedContent}
          </pre>
        </div>

        {/* Actions Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800">
          <button
            type="button"
            onClick={handleCopyAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors border border-zinc-700 cursor-pointer"
          >
            {isCopied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Đã sao chép</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-zinc-400" />
                <span>Sao chép toàn bộ</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleDownload(activeTab)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Tải tệp .{activeTab}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
