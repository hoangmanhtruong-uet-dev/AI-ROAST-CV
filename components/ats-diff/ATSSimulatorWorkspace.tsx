'use client';

import React, { useState, useEffect } from 'react';
import { usePIIVault } from '@/lib/security/usePIIVault';
import { ATSScoreGauge } from './ATSScoreGauge';
import { InteractiveDiffCard, DiffPatchData } from './InteractiveDiffCard';
import type { ATSRoastResponse } from '@/lib/schemas/ats-diff';
import { useProTier } from '@/lib/payment/entitlement';
import { CheckoutModal } from '@/components/payment/CheckoutModal';
import { ActivateKeyModal } from '@/components/payment/ActivateKeyModal';
import {
  Shield,
  Sparkles,
  Copy,
  CheckCheck,
  AlertTriangle,
  FileText,
  ArrowRight,
  Lock,
  Crown,
  Plus,
  Trash2,
  ListPlus,
  RotateCcw,
} from 'lucide-react';

interface ATSSimulatorWorkspaceProps {
  initialJobDescription?: string;
  initialCVBullets?: { bulletId: string; text: string }[];
}

export function ATSSimulatorWorkspace({
  initialJobDescription = '',
  initialCVBullets = [
    { bulletId: 'bullet-1', text: 'Chịu trách nhiệm phát triển tính năng frontend cho ứng dụng web.' },
    { bulletId: 'bullet-2', text: 'Tham gia sửa lỗi và cải thiện giao diện cho người dùng.' },
    { bulletId: 'bullet-3', text: 'Hỗ trợ đồng nghiệp trong nhóm hoàn thành các task được giao.' },
  ],
}: ATSSimulatorWorkspaceProps) {
  const { maskText, unmaskText, isScrubbing, stats } = usePIIVault();
  const { isPro } = useProTier();

  const [jobDescription, setJobDescription] = useState(
    initialJobDescription ||
      'Tuyển dụng Frontend Engineer: Yêu cầu thành thạo Next.js App Router, TypeScript, Tailwind CSS. Có kinh nghiệm tối ưu hiệu năng Web Vitals, xây dựng kiến trúc Web Worker, tư duy bảo mật Zero-Retention PII.'
  );

  const [cvBullets, setCvBullets] = useState(initialCVBullets);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ATSRoastResponse | null>(null);
  const [acceptedBullets, setAcceptedBullets] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  // Hydration state from /roast
  const [loadedFromRoast, setLoadedFromRoast] = useState(false);

  // Modals state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isActivateOpen, setIsActivateOpen] = useState(false);

  // Quick batch paste state
  const [isBatchPasteMode, setIsBatchPasteMode] = useState(false);
  const [batchPasteContent, setBatchPasteContent] = useState('');

  // Hydrate context from /roast if available in sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = sessionStorage.getItem('airoastcv_diff_context');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.jdText && typeof parsed.jdText === 'string' && parsed.jdText.trim()) {
          setJobDescription(parsed.jdText.trim());
        }
        if (parsed.cvText && typeof parsed.cvText === 'string') {
          const lines = parsed.cvText
            .split('\n')
            .map((l: string) => l.trim())
            .filter((l: string) => {
              if (l.length < 15) return false;
              if (l.startsWith('#')) return false;
              const lower = l.toLowerCase();
              if (
                lower.startsWith('họ và tên') ||
                lower.startsWith('email') ||
                lower.startsWith('số điện thoại') ||
                lower.startsWith('sđt')
              ) {
                return false;
              }
              return true;
            });
          if (lines.length >= 2) {
            const parsedBullets = lines
              .slice(0, 8)
              .map((line: string, idx: number) => ({
                bulletId: `bullet-${idx + 1}`,
                text: line.replace(/^[•\-\*\d\.\)\s]+/, '').trim(),
              }))
              .filter((b: { bulletId: string; text: string }) => b.text.length >= 8);
            if (parsedBullets.length >= 2) {
              setCvBullets(parsedBullets);
              setLoadedFromRoast(true);
            }
          }
        }
      }
    } catch {
      // Safe fallback
    }
  }, []);

  // Tính điểm ATS hiện tại theo số lượng câu người dùng đã chấp nhận
  const currentATSScore = React.useMemo(() => {
    if (!result) return 0;
    const { beforeScore, afterScore } = result.atsMetrics;
    const total = result.patches.length;
    if (total === 0) return beforeScore;
    const acceptedCount = Object.keys(acceptedBullets).length;
    const progress = acceptedCount / total;
    return Math.round(beforeScore + (afterScore - beforeScore) * progress);
  }, [result, acceptedBullets]);

  const handleAddBullet = () => {
    setCvBullets((prev) => [
      ...prev,
      { bulletId: `bullet-${Date.now()}`, text: '' },
    ]);
  };

  const handleRemoveBullet = (index: number) => {
    if (cvBullets.length <= 1) return;
    setCvBullets((prev) => prev.filter((_, i) => i !== index));
  };

  const handleApplyBatchPaste = () => {
    const lines = batchPasteContent
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length >= 8);

    if (lines.length > 0) {
      const newBullets = lines.slice(0, 10).map((l, idx) => ({
        bulletId: `bullet-${idx + 1}-${Date.now()}`,
        text: l.replace(/^[•\-\*\d\.\)\s]+/, '').trim(),
      }));
      setCvBullets(newBullets);
      setIsBatchPasteMode(false);
      setBatchPasteContent('');
    }
  };

  const handleRunSimulator = async () => {
    const validBullets = cvBullets.filter((b) => b.text.trim().length > 0);
    if (validBullets.length === 0) {
      alert('Vui lòng nhập ít nhất 1 gạch đầu dòng kinh nghiệm để phân tích.');
      return;
    }

    setIsLoading(true);
    try {
      // Bước 1: Ẩn danh toàn bộ PII trên trình duyệt bằng Web Worker
      const sanitizedBullets = await Promise.all(
        validBullets.map(async (b) => ({
          bulletId: b.bulletId,
          sectionTitle: 'Experience',
          originalText: await maskText(b.text),
        }))
      );

      // Bước 2: Gửi dữ liệu đã che PII lên API
      const res = await fetch('/api/ats-roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription,
          cvBullets: sanitizedBullets,
        }),
      });

      if (!res.ok) {
        throw new Error('API phân tích ATS trả về lỗi');
      }

      const data: ATSRoastResponse = await res.json();

      // Bước 3: Re-hydrate giải mã Token PII về tên thật từ RAM
      const rehydratedPatches = data.patches.map((p) => ({
        ...p,
        suggestedText: unmaskText(p.suggestedText),
      }));

      setResult({
        ...data,
        patches: rehydratedPatches,
      });
      setAcceptedBullets({});
    } catch (err) {
      console.error('Error analyzing ATS:', err);
      alert('Không thể hoàn tất phân tích ATS. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptPatch = (bulletId: string, finalText: string) => {
    setAcceptedBullets((prev) => ({ ...prev, [bulletId]: finalText }));
  };

  const handleRejectPatch = (bulletId: string) => {
    setAcceptedBullets((prev) => {
      const next = { ...prev };
      delete next[bulletId];
      return next;
    });
  };

  const handleAutoAcceptAll = () => {
    if (!result) return;
    if (!isPro && result.patches.length > 2) {
      setIsCheckoutOpen(true);
      return;
    }
    const all: Record<string, string> = {};
    result.patches.forEach((p) => {
      all[p.bulletId] = p.suggestedText;
    });
    setAcceptedBullets(all);
  };

  const handleCopyCleanCV = () => {
    const text = cvBullets
      .map((b) => acceptedBullets[b.bulletId] || b.text)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Top Banner: Status & Privacy */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 text-xs text-neutral-300">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <b>Cơ chế Zero-Retention PII:</b> Thông tin cá nhân được tách mã định danh tạm thời trong RAM trình duyệt trước khi gửi đi.
          </span>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {isPro ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Gói PRO đã kích hoạt</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setIsCheckoutOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/30 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Nâng cấp Pro 29k (VietQR)</span>
            </button>
          )}

          {stats.totalMasked > 0 && (
            <span className="font-semibold text-emerald-400 text-xs">
              🛡️ Đã che {stats.totalMasked} PII
            </span>
          )}
        </div>
      </div>

      {/* Notice if loaded from /roast */}
      {loadedFromRoast && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-xs text-orange-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-400 shrink-0" />
            <span>
              <b>Đã tự động nạp CV từ lượt Roast của bạn ({cvBullets.length} gạch đầu dòng kinh nghiệm).</b> Bạn có thể điều chỉnh thêm hoặc dán JD để đối chiếu ngay.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setLoadedFromRoast(false)}
            className="text-orange-400 hover:text-orange-200 text-xs underline cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Input Section */}
      {!result && (
        <div className="grid md:grid-cols-2 gap-6 bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800">
          <div>
            <label className="block text-sm font-bold text-neutral-200 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              1. Job Description (Mô tả công việc mục tiêu)
            </label>
            <textarea
              rows={8}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-neutral-100 focus:outline-none focus:border-amber-400 resize-y"
              placeholder="Dán nội dung JD vào đây để đối soát từ khóa ATS..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-neutral-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                2. Các gạch đầu dòng kinh nghiệm trong CV
              </label>

              <button
                type="button"
                onClick={() => setIsBatchPasteMode(!isBatchPasteMode)}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer font-medium"
              >
                <ListPlus className="w-3.5 h-3.5" />
                <span>{isBatchPasteMode ? 'Quay lại dạng danh sách' : 'Dán nhanh đoạn văn bản'}</span>
              </button>
            </div>

            {isBatchPasteMode ? (
              <div className="space-y-2">
                <textarea
                  rows={6}
                  value={batchPasteContent}
                  onChange={(e) => setBatchPasteContent(e.target.value)}
                  placeholder="Dán toàn bộ phần kinh nghiệm hoặc các gạch đầu dòng CV của bạn vào đây. Hệ thống sẽ tự động tách câu theo từng dòng..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 focus:outline-none focus:border-emerald-400 resize-y"
                />
                <button
                  type="button"
                  onClick={handleApplyBatchPaste}
                  className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-emerald-300 text-xs font-bold rounded-lg border border-emerald-500/30 transition cursor-pointer"
                >
                  Tự động phân tách thành các gạch đầu dòng
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {cvBullets.map((b, idx) => (
                  <div key={b.bulletId} className="flex items-center gap-2">
                    <span className="text-xs font-mono text-neutral-500 w-5 shrink-0 text-right">
                      {idx + 1}.
                    </span>
                    <input
                      type="text"
                      value={b.text}
                      onChange={(e) => {
                        const updated = [...cvBullets];
                        updated[idx].text = e.target.value;
                        setCvBullets(updated);
                      }}
                      placeholder={`Ví dụ: Phát triển tính năng giao diện bằng React...`}
                      className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-emerald-400"
                    />
                    {cvBullets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveBullet(idx)}
                        className="p-1.5 text-neutral-500 hover:text-rose-400 transition cursor-pointer"
                        title="Xóa câu này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddBullet}
                  className="w-full py-1.5 mt-2 bg-neutral-950 hover:bg-neutral-900 border border-dashed border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm gạch đầu dòng kinh nghiệm</span>
                </button>
              </div>
            )}

            <button
              onClick={handleRunSimulator}
              disabled={isLoading || isScrubbing}
              className="w-full mt-4 py-3 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-neutral-950 font-extrabold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Đang phân tích ATS & Roast từng dòng...</span>
              ) : (
                <>
                  <span>Bắt đầu Quét ATS & Roast</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Kết quả phân tích & Interactive Diff */}
      {result && (
        <div className="space-y-8">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-xl font-bold text-neutral-100">
                Báo cáo Phân tích ATS & Bản vá Google XYZ
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setResult(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Chỉnh sửa lại JD & CV</span>
            </button>
          </div>

          <div className="grid lg:grid-cols-12 gap-6">
            {/* Cột trái: ATS Gauge & Flags */}
            <div className="lg:col-span-5 space-y-6">
              <ATSScoreGauge
                beforeScore={result.atsMetrics.beforeScore}
                currentScore={currentATSScore}
                targetScore={result.atsMetrics.afterScore}
                acceptedCount={Object.keys(acceptedBullets).length}
                totalPatches={result.patches.length}
              />

              {/* Knockout Flags */}
              {result.atsMetrics.knockoutFlags.length > 0 && (
                <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-5">
                  <h4 className="text-sm font-bold text-rose-300 flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    Cảnh báo loại hồ sơ (Knockout Flags)
                  </h4>
                  <ul className="space-y-2 text-xs text-rose-200/90 list-disc list-inside">
                    {result.atsMetrics.knockoutFlags.map((flag, i) => (
                      <li key={i}>{flag}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Missing Keywords */}
              <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-5">
                <h4 className="text-sm font-bold text-neutral-200 mb-3">
                  Từ khóa cốt lõi cần bổ sung từ JD
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.atsMetrics.missingKeywords.map((kw, i) => (
                    <span
                      key={i}
                      className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                        kw.importance === 'critical'
                          ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {kw.importance === 'critical' ? '⚡ ' : ''}
                      {kw.keyword}
                    </span>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleAutoAcceptAll}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Áp dụng tất cả (89+ điểm)</span>
                  {!isPro && result.patches.length > 2 && (
                    <span className="px-1.5 py-0.2 bg-amber-400 text-neutral-950 rounded text-[10px] font-black uppercase">
                      PRO
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCopyCleanCV}
                  className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-neutral-700"
                >
                  {copied ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Đã sao chép' : 'Copy CV'}</span>
                </button>
              </div>
            </div>

            {/* Cột phải: Danh sách Interactive Diff Cards & Freemium Paywall */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Interactive Diff Viewer
                </h3>
                <span className="text-xs text-neutral-400">
                  Nhấn chấp nhận từng câu để điểm ATS tăng tự động
                </span>
              </div>

              <div className="space-y-4">
                {result.patches.map((patch, idx) => {
                  const isLocked = !isPro && idx >= 2;
                  const original = cvBullets.find((b) => b.bulletId === patch.bulletId)?.text || '';
                  const diffData: DiffPatchData = {
                    ...patch,
                    originalText: original,
                  };

                  if (isLocked) {
                    return (
                      <div
                        key={patch.bulletId}
                        className="relative border border-amber-500/30 rounded-2xl p-5 bg-neutral-900/40 overflow-hidden shadow-lg"
                      >
                        {/* Blurred preview of patch content */}
                        <div className="filter blur-sm select-none opacity-25 pointer-events-none space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">
                              #{patch.bulletId}
                            </span>
                            <span className="text-xs text-rose-400 font-bold">🔥 Tác động lớn</span>
                          </div>
                          <div className="p-3 bg-neutral-950 rounded-lg text-xs text-amber-300">
                            {patch.roastComment}
                          </div>
                          <div className="p-4 bg-neutral-950 rounded-lg text-sm text-neutral-300">
                            {patch.suggestedText}
                          </div>
                        </div>

                        {/* Locked Call to Action */}
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-5 text-center bg-neutral-950/85 backdrop-blur-[2px]">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-2">
                            <Lock className="w-5 h-5" />
                          </div>
                          <h4 className="text-sm font-bold text-white mb-1">
                            Câu kinh nghiệm #{idx + 1} chuẩn Google XYZ (Bản vá Pro)
                          </h4>
                          <p className="text-xs text-neutral-400 max-w-sm mb-3">
                            Mở khóa toàn bộ {result.patches.length - 2} câu sửa còn lại và tính năng tự động nâng điểm ATS lên 89+ chỉ với 1 cốc trà sữa (29k).
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setIsCheckoutOpen(true)}
                              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-neutral-950 text-xs font-extrabold rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Mở khóa Pro 29k (VietQR 3 giây)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsActivateOpen(true)}
                              className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-xl border border-neutral-700 transition cursor-pointer"
                            >
                              <span>Nhập mã kích hoạt</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <InteractiveDiffCard
                      key={patch.bulletId}
                      patch={diffData}
                      isAccepted={!!acceptedBullets[patch.bulletId]}
                      onAccept={handleAcceptPatch}
                      onReject={handleRejectPatch}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Upsell: Luyện phỏng vấn áp lực 60s */}
          <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-neutral-900 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Bước tiếp theo sau khi sửa CV</span>
              </div>
              <h4 className="text-base font-bold text-white">
                CV chuẩn ATS đã sẵn sàng. Bạn đã đủ tự tin trước vòng phỏng vấn thực tế?
              </h4>
              <p className="text-xs text-neutral-300">
                Mô phỏng 3 câu hỏi tình huống áp lực cao theo đúng JD này với đồng hồ đếm ngược 60s.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem(
                    'airoastcv_interview_target',
                    JSON.stringify({
                      jobDescription,
                      cvBullets,
                    })
                  );
                  window.location.href = '/interview';
                }
              }}
              className="px-5 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/20 transition-all shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <span>⏱️ Luyện phỏng vấn áp lực ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOpenActivateModal={() => {
          setIsCheckoutOpen(false);
          setIsActivateOpen(true);
        }}
      />

      {/* Activate Key Modal */}
      <ActivateKeyModal
        isOpen={isActivateOpen}
        onClose={() => setIsActivateOpen(false)}
        onSuccess={() => setIsActivateOpen(false)}
      />
    </div>
  );
}
