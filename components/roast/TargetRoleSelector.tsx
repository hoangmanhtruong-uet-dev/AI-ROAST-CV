'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Zap,
  FileText,
  Sparkles,
  ClipboardPaste,
  Trash2,
  ShieldCheck,
  Check,
  ChevronDown,
  ChevronUp,
  Building2,
  Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { SAMPLE_JDS, SampleJd, getSampleJd } from '@/lib/data/sample-jds';
import { maskPii } from '@/lib/utils/pii-masker';

export type JdInputMode = 'quick' | 'custom' | 'sample';

export interface TargetRoleSelectorChange {
  targetRole: string;
  jdText: string;
  mode: JdInputMode;
  selectedSampleId?: string | null;
}

export interface TargetRoleSelectorProps {
  targetRole?: string;
  jdText?: string;
  mode?: JdInputMode;
  selectedSampleId?: string | null;
  onChange: (value: TargetRoleSelectorChange) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Helper to sanitize JD text before submission to maintain Zero-PII principles.
 */
export function sanitizeJdText(text: string): string {
  return maskPii(text).sanitizedText;
}

const MAX_JD_LENGTH = 3000;
const MAX_ROLE_LENGTH = 100;

export function TargetRoleSelector({
  targetRole: propTargetRole = '',
  jdText: propJdText = '',
  mode: propMode = 'quick',
  selectedSampleId: propSelectedSampleId = null,
  onChange,
  disabled = false,
  className,
}: TargetRoleSelectorProps) {
  const [activeMode, setActiveMode] = useState<JdInputMode>(propMode);
  const [localTargetRole, setLocalTargetRole] = useState<string>(propTargetRole);
  const [localJdText, setLocalJdText] = useState<string>(propJdText);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(propSelectedSampleId);
  const [isSampleJdExpanded, setIsSampleJdExpanded] = useState<boolean>(false);
  const [pasteNotice, setPasteNotice] = useState<string | null>(null);

  // Sync external props changes (e.g. form reset)
  useEffect(() => {
    setActiveMode(propMode);
  }, [propMode]);

  useEffect(() => {
    setLocalTargetRole(propTargetRole);
  }, [propTargetRole]);

  useEffect(() => {
    setLocalJdText(propJdText);
  }, [propJdText]);

  useEffect(() => {
    setSelectedSampleId(propSelectedSampleId);
  }, [propSelectedSampleId]);

  // Check detected PII in custom JD text
  const piiStats = localJdText ? maskPii(localJdText).stats : null;

  // Mode change handler
  const handleModeChange = (newMode: JdInputMode) => {
    if (disabled) return;
    setActiveMode(newMode);

    if (newMode === 'quick') {
      onChange({
        targetRole: localTargetRole,
        jdText: '',
        mode: 'quick',
        selectedSampleId: null,
      });
    } else if (newMode === 'custom') {
      const sanitized = sanitizeJdText(localJdText);
      onChange({
        targetRole: localTargetRole,
        jdText: sanitized,
        mode: 'custom',
        selectedSampleId: null,
      });
    } else if (newMode === 'sample') {
      const currentSample = selectedSampleId ? getSampleJd(selectedSampleId) : SAMPLE_JDS[0];
      const sampleId = currentSample ? currentSample.id : null;
      const role = currentSample ? currentSample.roleTitle : localTargetRole;
      const jd = currentSample ? sanitizeJdText(currentSample.jdText) : '';

      if (currentSample) {
        setSelectedSampleId(sampleId);
        setLocalTargetRole(role);
        setLocalJdText(jd);
      }

      onChange({
        targetRole: role,
        jdText: jd,
        mode: 'sample',
        selectedSampleId: sampleId,
      });
    }
  };

  // Quick mode: target role change
  const handleQuickRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.slice(0, MAX_ROLE_LENGTH);
    setLocalTargetRole(val);
    onChange({
      targetRole: val,
      jdText: '',
      mode: 'quick',
      selectedSampleId: null,
    });
  };

  // Custom mode: target role change
  const handleCustomRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.slice(0, MAX_ROLE_LENGTH);
    setLocalTargetRole(val);
    const sanitized = sanitizeJdText(localJdText);
    onChange({
      targetRole: val,
      jdText: sanitized,
      mode: 'custom',
      selectedSampleId: null,
    });
  };

  // Custom mode: JD text change
  const handleCustomJdChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const rawVal = e.target.value.slice(0, MAX_JD_LENGTH);
    setLocalJdText(rawVal);
    const sanitized = sanitizeJdText(rawVal);
    onChange({
      targetRole: localTargetRole,
      jdText: sanitized,
      mode: 'custom',
      selectedSampleId: null,
    });
  };

  // Helper: Paste from clipboard
  const handlePasteClipboard = async () => {
    if (disabled) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          const truncated = text.slice(0, MAX_JD_LENGTH);
          const sanitized = sanitizeJdText(truncated);
          setLocalJdText(sanitized);
          setPasteNotice('Đã dán và tự động khử khuẩn PII từ clipboard!');
          setTimeout(() => setPasteNotice(null), 3000);
          onChange({
            targetRole: localTargetRole,
            jdText: sanitized,
            mode: 'custom',
            selectedSampleId: null,
          });
        }
      }
    } catch {
      setPasteNotice('Vui lòng cấp quyền truy cập clipboard hoặc dán trực tiếp bằng phím tắt Ctrl+V.');
      setTimeout(() => setPasteNotice(null), 4000);
    }
  };

  // Helper: Clean custom JD
  const handleClearCustomJd = () => {
    if (disabled) return;
    setLocalJdText('');
    onChange({
      targetRole: localTargetRole,
      jdText: '',
      mode: 'custom',
      selectedSampleId: null,
    });
  };

  // Helper: Mask PII explicitly in textarea
  const handleMaskPiiNow = () => {
    if (disabled || !localJdText) return;
    const sanitized = sanitizeJdText(localJdText);
    setLocalJdText(sanitized);
    setPasteNotice('Đã che toàn bộ SĐT, Email, CCCD và link cá nhân!');
    setTimeout(() => setPasteNotice(null), 3000);
    onChange({
      targetRole: localTargetRole,
      jdText: sanitized,
      mode: 'custom',
      selectedSampleId: null,
    });
  };

  // Sample mode: Select a sample JD
  const handleSelectSample = (sample: SampleJd) => {
    if (disabled) return;
    const sanitized = sanitizeJdText(sample.jdText);
    setSelectedSampleId(sample.id);
    setLocalTargetRole(sample.roleTitle);
    setLocalJdText(sanitized);
    onChange({
      targetRole: sample.roleTitle,
      jdText: sanitized,
      mode: 'sample',
      selectedSampleId: sample.id,
    });
  };

  const selectedSample = selectedSampleId ? getSampleJd(selectedSampleId) : null;

  return (
    <div
      className={cn(
        'w-full rounded-2xl bg-zinc-900/70 border border-zinc-800 p-4 sm:p-5 shadow-xl transition-all',
        className
      )}
      data-testid="target-role-selector"
    >
      {/* Tab Switcher */}
      <div
        className="flex items-center gap-1.5 p-1 bg-zinc-950/70 rounded-xl border border-zinc-800/80 mb-4 overflow-x-auto"
        role="tablist"
        aria-label="Chọn chế độ nhập vị trí và JD"
      >
        {/* Mode 1: Quick Title */}
        <button
          type="button"
          role="tab"
          aria-selected={activeMode === 'quick'}
          data-mode="quick"
          disabled={disabled}
          onClick={() => handleModeChange('quick')}
          className={cn(
            'flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 select-none whitespace-nowrap',
            activeMode === 'quick'
              ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-purple-200 border border-purple-500/40 shadow-sm shadow-purple-500/10'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
          )}
        >
          <Zap className={cn('w-3.5 h-3.5', activeMode === 'quick' ? 'text-purple-400' : 'text-zinc-400')} />
          <span>Nhập nhanh chức danh</span>
        </button>

        {/* Mode 2: Custom Pasted JD */}
        <button
          type="button"
          role="tab"
          aria-selected={activeMode === 'custom'}
          data-mode="custom"
          disabled={disabled}
          onClick={() => handleModeChange('custom')}
          className={cn(
            'flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 select-none whitespace-nowrap',
            activeMode === 'custom'
              ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-purple-200 border border-purple-500/40 shadow-sm shadow-purple-500/10'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
          )}
        >
          <FileText className={cn('w-3.5 h-3.5', activeMode === 'custom' ? 'text-purple-400' : 'text-zinc-400')} />
          <span>Dán toàn bộ JD</span>
        </button>

        {/* Mode 3: Curated Sample JDs */}
        <button
          type="button"
          role="tab"
          aria-selected={activeMode === 'sample'}
          data-mode="sample"
          disabled={disabled}
          onClick={() => handleModeChange('sample')}
          className={cn(
            'flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 select-none whitespace-nowrap',
            activeMode === 'sample'
              ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-purple-200 border border-purple-500/40 shadow-sm shadow-purple-500/10'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
          )}
        >
          <Sparkles className={cn('w-3.5 h-3.5', activeMode === 'sample' ? 'text-purple-400' : 'text-zinc-400')} />
          <span>Bộ mẫu JD thực chiến</span>
        </button>
      </div>

      {/* Tab Content: Mode 1 - Quick Role Title */}
      {activeMode === 'quick' && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-0.5">
            <span>Tên vị trí hoặc vai trò công việc bạn hướng tới:</span>
            <span className="font-mono text-zinc-500">{localTargetRole.length}/{MAX_ROLE_LENGTH}</span>
          </div>
          <div className="relative">
            <input
              id="target-role-input"
              type="text"
              disabled={disabled}
              placeholder="Ví dụ: Frontend Developer, Marketing Executive, Data Analyst..."
              value={localTargetRole}
              onChange={handleQuickRoleChange}
              maxLength={MAX_ROLE_LENGTH}
              className="w-full px-4 py-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
            />
          </div>
          <p className="text-[11px] text-zinc-500 italic mt-0.5">
            💡 AI sẽ căn cứ vào chức danh này để đánh giá mức độ phù hợp của kinh nghiệm và kỹ năng trong CV.
          </p>
        </div>
      )}

      {/* Tab Content: Mode 2 - Custom Pasted JD */}
      {activeMode === 'custom' && (
        <div className="flex flex-col gap-3">
          {/* Optional Role Title Header */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="custom-target-role" className="text-xs font-medium text-zinc-300">
              Chức danh tuyển dụng trong JD (Tùy chọn):
            </label>
            <input
              id="custom-target-role"
              type="text"
              disabled={disabled}
              placeholder="Ví dụ: Junior React Developer, Thực tập sinh Golang..."
              value={localTargetRole}
              onChange={handleCustomRoleChange}
              maxLength={MAX_ROLE_LENGTH}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
            />
          </div>

          {/* JD Textarea with Actions Header */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
              <label htmlFor="custom-jd-textarea" className="font-medium text-zinc-300">
                Nội dung Job Description (JD):
              </label>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={handlePasteClipboard}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800/80 hover:bg-zinc-800 text-[11px] font-medium text-zinc-300 border border-zinc-700/60 transition-colors"
                  title="Dán từ Clipboard"
                >
                  <ClipboardPaste className="w-3 h-3 text-purple-400" />
                  <span>Dán clipboard</span>
                </button>

                {localJdText && (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={handleClearCustomJd}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800/80 hover:bg-rose-950/40 text-[11px] font-medium text-zinc-300 hover:text-rose-300 border border-zinc-700/60 hover:border-rose-500/30 transition-colors"
                    title="Xóa nội dung JD"
                  >
                    <Trash2 className="w-3 h-3 text-zinc-400 hover:text-rose-400" />
                    <span>Xóa trắng</span>
                  </button>
                )}
              </div>
            </div>

            {/* Textarea */}
            <div className="relative">
              <textarea
                id="custom-jd-textarea"
                rows={6}
                disabled={disabled}
                placeholder="Dán toàn bộ nội dung Job Description (JD) của công ty mục tiêu tại đây (yêu cầu công việc, kỹ năng, trách nhiệm, quyền lợi)..."
                value={localJdText}
                onChange={handleCustomJdChange}
                maxLength={MAX_JD_LENGTH}
                className="w-full px-4 py-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors font-mono resize-y min-h-[140px]"
              />
            </div>

            {/* Live Character Counter & PII Notice */}
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
              {/* PII Sanitization Status Badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Zero-PII: Tự động che SĐT, Email, CCCD</span>
                </span>

                {piiStats && piiStats.total > 0 && (
                  <button
                    type="button"
                    onClick={handleMaskPiiNow}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px] font-medium hover:bg-emerald-500/20 transition-colors"
                    title="Bấm để che trực tiếp trên ô nhập"
                  >
                    <span>🛡️ Đã phát hiện {piiStats.total} thông tin PII (Bấm để áp dụng)</span>
                  </button>
                )}
              </div>

              {/* Character Counter */}
              <div
                data-testid="jd-char-counter"
                className={cn(
                  'font-mono text-xs font-semibold ml-auto',
                  localJdText.length >= MAX_JD_LENGTH
                    ? 'text-rose-400'
                    : localJdText.length > 2500
                    ? 'text-amber-400'
                    : 'text-zinc-400'
                )}
              >
                {localJdText.length}/{MAX_JD_LENGTH} ký tự
              </div>
            </div>

            {pasteNotice && (
              <p className="text-[11px] text-purple-300 bg-purple-950/30 border border-purple-500/30 rounded-lg px-3 py-1.5 animate-fade-in">
                {pasteNotice}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tab Content: Mode 3 - Curated Sample JDs */}
      {activeMode === 'sample' && (
        <div className="flex flex-col gap-4">
          <div className="text-xs text-zinc-400">
            Chọn 1 trong 3 bản JD thực chiến tiếng Việt được biên soạn từ các công ty công nghệ & bán lẻ hàng đầu:
          </div>

          {/* 3 Sample Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SAMPLE_JDS.map((sample) => {
              const isSelected = selectedSampleId === sample.id;
              return (
                <button
                  key={sample.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelectSample(sample)}
                  data-sample-id={sample.id}
                  data-selected={isSelected ? 'true' : 'false'}
                  aria-pressed={isSelected}
                  className={cn(
                    'relative flex flex-col text-left p-3.5 rounded-xl border transition-all duration-200 outline-none select-none',
                    isSelected
                      ? 'border-purple-500/80 bg-purple-950/25 shadow-md shadow-purple-500/10 ring-1 ring-purple-500/40'
                      : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-900/60'
                  )}
                >
                  {/* Badge & Check Indicator */}
                  <div className="flex items-center justify-between w-full mb-2">
                    <span
                      className={cn(
                        'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                        isSelected
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700/50'
                      )}
                    >
                      {sample.badge}
                    </span>

                    <div
                      className={cn(
                        'w-4 h-4 rounded-full border flex items-center justify-center transition-colors',
                        isSelected
                          ? 'border-purple-400 bg-purple-500 text-white'
                          : 'border-zinc-700 bg-zinc-900'
                      )}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </div>

                  {/* Title & Industry */}
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-100 mb-1 line-clamp-1">
                    {sample.roleTitle}
                  </h4>
                  <div className="flex items-center gap-1 text-[11px] text-zinc-400 mb-2">
                    <Building2 className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="truncate">{sample.companyOrIndustry}</span>
                  </div>

                  {/* Summary */}
                  <p className="text-[11px] text-zinc-400/90 leading-relaxed line-clamp-2 mt-auto">
                    {sample.summary}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Selected Sample Preview & Full Content Accordion */}
          {selectedSample && (
            <div className="rounded-xl bg-zinc-950/80 border border-purple-500/30 p-3.5 flex flex-col gap-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  <span className="text-xs font-semibold text-purple-200">
                    Đang chọn: {selectedSample.roleTitle}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSampleJdExpanded((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-xs text-purple-300 hover:text-purple-200 transition-colors"
                >
                  <span>{isSampleJdExpanded ? 'Thu gọn JD' : 'Xem toàn bộ JD mẫu'}</span>
                  {isSampleJdExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                {selectedSample.summary}
              </p>

              {isSampleJdExpanded && (
                <div className="mt-2 pt-2 border-t border-zinc-800">
                  <pre className="text-[11px] font-mono text-zinc-300 whitespace-pre-wrap bg-zinc-900/80 p-3 rounded-lg max-h-60 overflow-y-auto leading-relaxed">
                    {selectedSample.jdText}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
