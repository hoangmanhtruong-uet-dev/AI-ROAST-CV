'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Flame,
  ArrowLeft,
  Loader2,
  Sparkles,
  AlertCircle,
  RotateCcw,
  CheckCircle,
} from 'lucide-react';
import { FileUploader } from '@/components/roast/FileUploader';
import { OcrPreviewModal } from '@/components/roast/OcrPreviewModal';
import { ToneSelector } from '@/components/roast/ToneSelector';
import { RoastReport } from '@/components/roast/RoastReport';
import { RoastData } from '@/lib/schemas/roast';
import { ExtractApiResponse } from '@/lib/schemas/extract';
import { WIPE_DATA_EVENT_NAME } from '@/lib/storage/wipe-data';
import { maskPii } from '@/lib/utils/pii-masker';

type RoastStep = 'INPUT' | 'PREVIEW' | 'ROASTING' | 'RESULT' | 'ERROR';

const ENTERTAINING_HINTS = [
  'Đang bật chế độ cà khịa sát thủ, chuẩn bị vạch trần văn mẫu...',
  'Đang soi từng lỗi ngớ ngẩn khiến CV bị ném vào sọt rác sau 5 giây...',
  'Đang soi kính lúp tìm số liệu chứng minh trong đống từ ngữ mơ hồ...',
  'Đang đếm số lần bạn dùng từ "nhiệt tình, ham học hỏi, chịu áp lực cao"...',
  'Đang pha cà phê để đọc kỹ năng "thành thạo tin học văn phòng" năm 2026...',
  'Đang kiểm tra xem kỹ năng "giao tiếp xuất sắc" có đi kèm lỗi chính tả nào không...',
  'Đang so sánh CV của bạn với bộ lọc ATS khó tính nhất hành tinh...',
  'Đang chuyển hóa những lời chê bai cay đắng thành công thức sửa CV ăn điểm...',
];

export default function RoastPage() {
  const [step, setStep] = useState<RoastStep>('INPUT');
  const [selectedTone, setSelectedTone] = useState<'spicy' | 'constructive'>('spicy');
  const [file, setFile] = useState<File | null>(null);
  const [rawExtractedText, setRawExtractedText] = useState<string>('');
  const [confirmedCvText, setConfirmedCvText] = useState<string>('');
  const [targetRole, setTargetRole] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [reportData, setReportData] = useState<RoastData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentHintIndex, setCurrentHintIndex] = useState<number>(0);

  // Listen for data wipe event to reset page state across components
  useEffect(() => {
    const handleDataWiped = () => {
      handleReset();
    };
    window.addEventListener(WIPE_DATA_EVENT_NAME, handleDataWiped);
    return () => window.removeEventListener(WIPE_DATA_EVENT_NAME, handleDataWiped);
  }, []);

  // Rotating hints during ROASTING step
  useEffect(() => {
    if (step !== 'ROASTING') return;

    const timer = setInterval(() => {
      setCurrentHintIndex((prev) => (prev + 1) % ENTERTAINING_HINTS.length);
    }, 2500);

    return () => clearInterval(timer);
  }, [step]);

  // Handle file selection from FileUploader -> call /api/extract
  const handleFileSelected = async (selectedFile: File) => {
    setFile(selectedFile);
    setErrorMessage(null);
    setIsExtracting(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      });

      const json: ExtractApiResponse = await res.json();

      if (!res.ok || !json.success || !json.extractedText) {
        throw new Error(json.error || 'Không thể trích xuất văn bản từ tệp tin.');
      }

      setRawExtractedText(json.extractedText);
      setConfirmedCvText(json.extractedText);
      setStep('PREVIEW');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Lỗi không xác định khi tải tệp.');
    } finally {
      setIsExtracting(false);
    }
  };

  // Handle direct text submission from FileUploader
  const handleTextSubmit = (pastedText: string) => {
    setFile(null);
    setRawExtractedText(pastedText);
    const maskingResult = maskPii(pastedText);
    const sanitized = maskingResult.sanitizedText;
    setConfirmedCvText(sanitized);
    setErrorMessage(null);
    executeRoast(sanitized, selectedTone);
  };

  // User confirms text in OCR Preview Screen
  const handleConfirmPreview = (editedText: string) => {
    const maskingResult = maskPii(editedText);
    const sanitized = maskingResult.sanitizedText;
    setConfirmedCvText(sanitized);
    executeRoast(sanitized, selectedTone);
  };

  // Execute Roast API call
  const executeRoast = async (cvText: string, tone: 'spicy' | 'constructive') => {
    setStep('ROASTING');
    setErrorMessage(null);

    // Defense-in-depth: Ensure payload is sanitized before transmission
    const payloadText = maskPii(cvText).sanitizedText;

    try {
      const res = await fetch('/api/roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvText: payloadText,
          tone,
          targetRole: targetRole.trim() || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || 'Không thể phân tích CV với AI.');
      }

      setReportData(json.data);
      setStep('RESULT');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi phân tích CV.');
      setStep('ERROR');
    }
  };

  // Quick switch tone from result page
  const handleChangeTone = (newTone: 'spicy' | 'constructive') => {
    setSelectedTone(newTone);
    if (confirmedCvText) {
      executeRoast(confirmedCvText, newTone);
    }
  };

  // Reset to initial input
  const handleReset = () => {
    setStep('INPUT');
    setFile(null);
    setRawExtractedText('');
    setConfirmedCvText('');
    setReportData(null);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-zinc-100 flex flex-col justify-between selection:bg-orange-500/30">
      {/* Top Navigation */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Trang chủ</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Flame className="w-4 h-4 fill-orange-500 text-orange-500" />
            </div>
            <span className="font-bold text-sm tracking-tight text-zinc-100">AI Roast CV</span>
          </div>

          <div className="text-xs text-zinc-500 hidden sm:block">
            Gemini Flash 2.5
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12 w-full flex-1 flex flex-col">
        {/* Step Indicator Header (visible in INPUT / PREVIEW) */}
        {step !== 'RESULT' && step !== 'ROASTING' && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Chế độ Đa Giọng Điệu</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-zinc-100 mb-3 tracking-tight">
              Roast CV — Nhận Xét Thẳng Thắn
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
              Tải CV lên hoặc dán nội dung để nhận bản mổ xẻ sắc bén từ AI, vạch trần điểm yếu và tối ưu hóa vượt qua bộ lọc ATS.
            </p>
          </div>
        )}

        {/* STEP 1: INPUT FLOW */}
        {step === 'INPUT' && (
          <div className="flex flex-col gap-8">
            {/* Tone Selector Component */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-zinc-200">
                1. Chọn giọng điệu phân tích:
              </label>
              <ToneSelector
                selectedTone={selectedTone}
                onSelectTone={setSelectedTone}
                disabled={isExtracting}
              />
            </div>

            {/* Target Role (Optional) */}
            <div className="flex flex-col gap-2">
              <label htmlFor="target-role-input" className="text-sm font-semibold text-zinc-200">
                2. Vị trí bạn đang ứng tuyển (Tùy chọn):
              </label>
              <input
                id="target-role-input"
                type="text"
                placeholder="Ví dụ: Frontend Developer, Marketing Executive, Data Analyst..."
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                maxLength={100}
                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>

            {/* File & Text Uploader */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-zinc-200">
                3. Tải lên tệp hoặc dán nội dung CV:
              </label>
              <FileUploader
                onFileSelected={handleFileSelected}
                onTextSubmit={handleTextSubmit}
                isExtracting={isExtracting}
                error={errorMessage}
              />

              {/* Direct Roast Button for pasted text or already provided text */}
              {confirmedCvText.length >= 30 && (
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => executeRoast(confirmedCvText, selectedTone)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-orange-500/20"
                  >
                    <span>Bắt đầu Roast CV ngay</span>
                  </button>
                </div>
              )}
            </div>

            {/* Extraction Loader Notice */}
            {isExtracting && (
              <div className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-orange-950/30 border border-orange-500/30 text-orange-300 text-sm">
                <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
                <span>Đang trích xuất nội dung văn bản qua Gemini Flash OCR...</span>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: EDITABLE OCR PREVIEW (Requirement R2) */}
        {step === 'PREVIEW' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-zinc-100">
                  Bước 2: Rà soát & Chỉnh sửa trước khi gửi AI
                </h2>
                <p className="text-xs text-zinc-400">
                  Rà soát kỹ nội dung OCR trích xuất để đảm bảo kết quả phân tích chuẩn xác nhất.
                </p>
              </div>
            </div>

            <OcrPreviewModal
              isOpen={true}
              extractedText={rawExtractedText}
              fileName={file?.name}
              fileSize={file?.size}
              onClose={() => setStep('INPUT')}
              onConfirm={handleConfirmPreview}
              onReUpload={() => setStep('INPUT')}
            />
          </div>
        )}

        {/* STEP 3 & 4: ROASTING LOADING SCREEN WITH ROTATING VIETNAMESE HINTS */}
        {step === 'ROASTING' && (
          <div className="flex flex-col items-center justify-center p-8 sm:p-16 my-auto text-center rounded-3xl bg-zinc-900/60 border border-zinc-800/80 shadow-2xl relative overflow-hidden">
            {/* Glowing animated background orb */}
            <div className="absolute w-72 h-72 rounded-full bg-orange-500/10 blur-3xl pointer-events-none -top-10 -left-10" />
            <div className="absolute w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none -bottom-10 -right-10" />

            <div className="relative w-20 h-20 rounded-3xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mb-6 shadow-inner">
              <Flame className="w-10 h-10 text-orange-500 fill-orange-500 animate-pulse" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 mb-2">
              AI đang mổ xẻ từng dòng trong CV của bạn...
            </h2>

            <div className="min-h-[48px] flex items-center justify-center my-4 max-w-md px-4">
              <p className="text-sm sm:text-base font-medium text-orange-300 leading-relaxed italic animate-fade-in">
                &ldquo;{ENTERTAINING_HINTS[currentHintIndex]}&rdquo;
              </p>
            </div>

            <div className="flex items-center gap-2 mt-4 text-xs text-zinc-500">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Cam kết Zero-PII: Dữ liệu CV không bao giờ lưu trữ trên máy chủ</span>
            </div>
          </div>
        )}

        {/* STEP 5: STRUCTURED RESULT PRESENTATION */}
        {step === 'RESULT' && reportData && (
          <RoastReport
            data={reportData}
            cvText={confirmedCvText}
            targetRole={targetRole}
            onReset={handleReset}
            onChangeTone={handleChangeTone}
            onEditCv={() => setStep('PREVIEW')}
          />
        )}

        {/* ERROR STATE */}
        {step === 'ERROR' && (
          <div className="p-8 rounded-3xl bg-zinc-900 border border-rose-500/30 flex flex-col items-center justify-center text-center max-w-lg mx-auto my-auto">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-zinc-100 mb-2">
              Không thể phân tích CV
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mb-6 leading-relaxed">
              {errorMessage || 'Đã xảy ra sự cố trong quá trình kết nối đến máy chủ AI. Dữ liệu CV của bạn vẫn an toàn.'}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => executeRoast(confirmedCvText, selectedTone)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 transition-all shadow-md"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Thử phân tích lại</span>
              </button>
              <button
                type="button"
                onClick={() => setStep('PREVIEW')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors border border-zinc-700"
              >
                <span>Chỉnh sửa lại CV</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer Disclaimer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950/40 py-6 text-center text-xs text-zinc-500">
        <p>AI Roast CV — Sản phẩm dành cho sinh viên năm cuối & fresher tại Việt Nam.</p>
      </footer>
    </div>
  );
}
