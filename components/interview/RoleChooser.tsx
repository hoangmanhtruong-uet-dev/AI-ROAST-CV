'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Terminal,
  TrendingUp,
  ShieldCheck,
  Timer,
  Award,
  Zap,
  ArrowRight,
  FileText,
  Sparkles,
  RotateCcw,
  AlertCircle,
  Building2,
  Briefcase,
} from 'lucide-react';
import { SAMPLE_JDS } from '@/lib/data/sample-jds';

export type RoleType = 'it' | 'marketing' | 'custom';

export interface RoleChooserProps {
  selectedRole?: RoleType | null;
  onSelectRole: (role: RoleType) => void;
  onSelectCustomJd?: (data: {
    jdText: string;
    targetRole?: string;
    company?: string;
  }) => void;
  isLoading?: boolean;
  className?: string;
}

export function RoleChooser({
  selectedRole,
  onSelectRole,
  onSelectCustomJd,
  isLoading = false,
  className = '',
}: RoleChooserProps) {
  const [activeTab, setActiveTab] = React.useState<'preset' | 'custom'>(
    selectedRole === 'custom' ? 'custom' : 'preset'
  );

  // Custom JD Form State
  const [jdText, setJdText] = React.useState('');
  const [targetRole, setTargetRole] = React.useState('');
  const [company, setCompany] = React.useState('');
  const [formError, setFormError] = React.useState<string | null>(null);

  const charCount = jdText.length;
  const isJdTooShort = charCount > 0 && charCount < 50;
  const isJdTooLong = charCount > 10000;
  const isJdValid = charCount >= 50 && charCount <= 10000;

  const handleQuickFillSample = (sampleId: string) => {
    const sample = SAMPLE_JDS.find((s) => s.id === sampleId);
    if (!sample) return;
    setJdText(sample.jdText);
    setTargetRole(sample.roleTitle);
    setCompany(sample.companyOrIndustry);
    setFormError(null);
  };

  const handleClearJd = () => {
    setJdText('');
    setTargetRole('');
    setCompany('');
    setFormError(null);
  };

  const handleStartCustomJd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isJdValid) {
      if (charCount < 50) {
        setFormError('Nội dung JD phải có tối thiểu 50 ký tự để AI phân tích chính xác.');
      } else {
        setFormError('Nội dung JD vượt quá giới hạn 10.000 ký tự.');
      }
      return;
    }

    setFormError(null);
    if (onSelectCustomJd) {
      onSelectCustomJd({
        jdText: jdText.trim(),
        targetRole: targetRole.trim() || undefined,
        company: company.trim() || undefined,
      });
    } else {
      onSelectRole('custom');
    }
  };

  return (
    <div className={`max-w-4xl mx-auto px-4 py-8 ${className}`}>
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-4">
          <Zap className="w-3.5 h-3.5" />
          <span>Mô phỏng Phỏng Vấn Áp Lực (Stress Interview)</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          Mô phỏng Phỏng Vấn Áp Lực
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Rèn luyện phản xạ ứng biến và tư duy cấu trúc trước những tình huống
          hóc búa, khẩn cấp nhất từ nhà tuyển dụng.
        </p>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center justify-center mb-8">
        <div className="inline-flex p-1.5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-lg">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'preset'}
            aria-label="Chọn vị trí có sẵn"
            onClick={() => setActiveTab('preset')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
              activeTab === 'preset'
                ? 'bg-cyan-500 text-zinc-950 shadow-md shadow-cyan-500/25'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Chọn ngành có sẵn</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'custom'}
            aria-label="Nhập JD tùy biến"
            onClick={() => setActiveTab('custom')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
              activeTab === 'custom'
                ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-md shadow-orange-500/25'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Nhập JD tùy biến</span>
            <Badge variant="spicy" className="ml-1 text-[10px] px-1.5 py-0">
              Mới
            </Badge>
          </button>
        </div>
      </div>

      {/* TAB 1: Preset Roles Selection */}
      {activeTab === 'preset' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Track IT */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onSelectRole('it')}
            aria-label="IT / Software Engineer"
            className="group text-left transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-2xl"
          >
            <Card
              glow={selectedRole === 'it' ? 'cyan' : 'none'}
              className={`h-full border-2 transition-all p-6 ${
                selectedRole === 'it'
                  ? 'border-cyan-500 bg-cyan-950/20 shadow-xl shadow-cyan-500/10'
                  : 'border-zinc-800 hover:border-cyan-500/50 hover:bg-zinc-900/80'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  <Terminal className="w-6 h-6" />
                </div>
                <Badge variant="cyan">60 - 90s/câu</Badge>
              </div>

              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                IT / Software Engineer
              </h3>

              <p className="text-sm text-zinc-400 leading-relaxed mb-5">
                Đối mặt với sự cố sập server production, xung đột kiến trúc với
                Senior, rò rỉ dữ liệu (Data Breach) và áp lực đe dọa tiến độ
                deadline từ PM/Lãnh đạo.
              </p>

              <div className="space-y-2 pt-4 border-t border-zinc-800/80 text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>Q1: Hotfix module thanh toán sát giờ release (90s)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>Q2: Xung đột kiến trúc & Đổ lỗi từ Senior (75s)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>Q3: Rò rỉ dữ liệu S3 & Mệnh lệnh che giấu từ VP (60s)</span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform">
                <span>Bắt đầu phỏng vấn kỹ thuật</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Card>
          </button>

          {/* Track Marketing */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onSelectRole('marketing')}
            aria-label="Marketing / Business"
            className="group text-left transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-rose-500 rounded-2xl"
          >
            <Card
              glow={selectedRole === 'marketing' ? 'spicy' : 'none'}
              className={`h-full border-2 transition-all p-6 ${
                selectedRole === 'marketing'
                  ? 'border-rose-500 bg-rose-950/20 shadow-xl shadow-rose-500/10'
                  : 'border-zinc-800 hover:border-rose-500/50 hover:bg-zinc-900/80'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <Badge variant="amber">60 - 90s/câu</Badge>
              </div>

              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-rose-300 transition-colors">
                Marketing / Business
              </h3>

              <p className="text-sm text-zinc-400 leading-relaxed mb-5">
                Xử lý khủng hoảng truyền thông mạng xã hội do KOL gây ra, áp lực
                bơm lead ảo làm đẹp số liệu từ Trưởng phòng, và đe dọa pháp lý từ
                khách hàng VIP.
              </p>

              <div className="space-y-2 pt-4 border-t border-zinc-800/80 text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span>Q1: Áp lực mua lead ảo để làm đẹp KPI quý (90s)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span>Q2: Khủng hoảng tẩy chay thương hiệu do KOL (75s)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span>Q3: Gian lận thành phần & Đe dọa kiện từ khách (60s)</span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between text-xs font-semibold text-rose-400 group-hover:translate-x-1 transition-transform">
                <span>Bắt đầu phỏng vấn kinh doanh</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Card>
          </button>
        </div>
      )}

      {/* TAB 2: Custom Job Description Input */}
      {activeTab === 'custom' && (
        <Card className="bg-zinc-900/80 border-zinc-800 p-6 sm:p-8 mb-10 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="spicy">Mô phỏng Phỏng vấn theo JD Thực tế</Badge>
                <span className="text-xs text-zinc-400">• Đánh giá 5 tiêu chí</span>
              </div>
              <h3 className="text-xl font-bold text-white">
                Dán Job Description (JD) Công Ty Bạn Muốn Ứng Tuyển
              </h3>
            </div>

            {/* Clear Button */}
            {charCount > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearJd}
                disabled={isLoading}
                className="text-zinc-400 hover:text-rose-400 text-xs self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                <span>Xóa trắng</span>
              </Button>
            )}
          </div>

          {/* Quick-Fill Sample JDs */}
          <div className="mb-6">
            <span className="text-xs text-zinc-400 font-medium block mb-2">
              Dán nhanh JD mẫu tiếng Việt:
            </span>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_JDS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleQuickFillSample(sample.id)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700 text-xs font-medium text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-orange-400" />
                  <span>{sample.roleTitle.split('(')[0].trim()}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleStartCustomJd} className="space-y-4">
            {/* Optional Metadata Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="custom-target-role"
                  className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5"
                >
                  <Briefcase className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Vị trí ứng tuyển (Tùy chọn)</span>
                </label>
                <input
                  id="custom-target-role"
                  type="text"
                  maxLength={100}
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  disabled={isLoading}
                  placeholder="Ví dụ: Frontend React Fresher, Growth Marketing..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label
                  htmlFor="custom-company"
                  className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5"
                >
                  <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Công ty / Ngành nghề (Tùy chọn)</span>
                </label>
                <input
                  id="custom-company"
                  type="text"
                  maxLength={100}
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  disabled={isLoading}
                  placeholder="Ví dụ: Shopee, MoMo, Techcombank, FinTech..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* JD Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="custom-jd-textarea"
                  className="block text-xs font-medium text-zinc-300 flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-orange-400" />
                  <span>Nội dung Job Description (Yêu cầu 50 - 10.000 ký tự) *</span>
                </label>
                <span
                  className={`text-xs ${
                    isJdTooLong
                      ? 'text-rose-400 font-bold'
                      : isJdTooShort
                        ? 'text-amber-400'
                        : 'text-zinc-400'
                  }`}
                >
                  {charCount} / 10.000 ký tự
                </span>
              </div>

              <textarea
                id="custom-jd-textarea"
                rows={7}
                value={jdText}
                onChange={(e) => {
                  setJdText(e.target.value);
                  if (formError) setFormError(null);
                }}
                disabled={isLoading}
                placeholder="Dán toàn bộ nội dung bản tin tuyển dụng / JD vào đây (Mô tả công việc, Yêu cầu kỹ năng, Công nghệ, Trách nhiệm...)..."
                className={`w-full p-4 rounded-xl bg-zinc-950/80 border text-zinc-100 placeholder-zinc-500 text-xs sm:text-sm leading-relaxed focus:outline-none focus:ring-2 resize-y font-mono ${
                  formError || isJdTooLong
                    ? 'border-rose-500 focus:ring-rose-500'
                    : 'border-zinc-700/80 focus:ring-orange-500'
                }`}
              />

              {/* Validation Warning or Helper */}
              {formError ? (
                <p className="mt-2 text-xs text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{formError}</span>
                </p>
              ) : isJdTooShort ? (
                <p className="mt-2 text-xs text-amber-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Nội dung JD cần tối thiểu 50 ký tự để AI phân tích chính xác (còn thiếu {50 - charCount} ký tự).
                  </span>
                </p>
              ) : (
                <p className="mt-2 text-[11px] text-zinc-400">
                  🔒 Dữ liệu JD được xử lý an toàn theo nguyên tắc Zero-PII và không bao giờ được lưu trữ vào cơ sở dữ liệu.
                </p>
              )}
            </div>

            {/* Submit Action */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-zinc-400 flex items-center gap-2">
                <Timer className="w-4 h-4 text-cyan-400" />
                <span>Sinh 3 câu hỏi leo thang: Q1 (90s) → Q2 (75s) → Q3 (60s)</span>
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={!isJdValid || isLoading}
                className="w-full sm:w-auto shadow-lg shadow-orange-500/25"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    <span>Hội đồng AI đang phân tích JD...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    <span>Phân tích JD & Bắt đầu phỏng vấn</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Rules & Transparency Card */}
      <Card className="bg-zinc-900/50 border-zinc-800 p-6">
        <h4 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Quy tắc mô phỏng phỏng vấn minh bạch & bảo mật</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-zinc-400">
          <div className="flex items-start gap-2.5">
            <Timer className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              <strong>3 tình huống áp lực leo thang:</strong> Mỗi câu có thời
              hạn 60s - 90s, tự động nộp bài khi hết giờ để kiểm tra phản xạ.
            </span>
          </div>

          <div className="flex items-start gap-2.5">
            <Award className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Rubric chấm điểm công khai:</strong> STAR, dẫn chứng cụ thể,
              mức độ liên quan, nhận thức hệ quả, và độ phù hợp yêu cầu JD (Job Match Fit).
            </span>
          </div>

          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Bảo mật tuyệt đối:</strong> Câu trả lời và nội dung JD không
              được ghi vào bất kỳ cơ sở dữ liệu hay server log nào.
            </span>
          </div>

          <div className="flex items-start gap-2.5">
            <Zap className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>
              <strong>Quyền chủ động:</strong> Bạn có thể bấm &ldquo;Bỏ qua&rdquo; hoặc
              &ldquo;Dừng phỏng vấn&rdquo; bất kỳ lúc nào nếu cảm thấy áp lực.
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

