import React from 'react';
import { ATSSimulatorWorkspace } from '@/components/ats-diff/ATSSimulatorWorkspace';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';

export const metadata = {
  title: 'ATS Simulator & Interactive CV Diff Viewer | AI ROAST CV',
  description: 'Tối ưu hóa CV chuẩn ATS với phản hồi châm biếm sâu cay và trình so sánh từ ngữ tương tác.',
};

export default function ATSDiffPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 py-10 px-4">
      <div className="max-w-7xl mx-auto mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại trang chủ
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Thiết kế bởi Core Architect (Gemini 4 Argon)
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              ATS Simulator & Interactive CV Diff
            </h1>
            <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
              Đối chiếu hồ sơ với Job Description theo thuật toán ATS khắt khe, nhận lời chê sâu cay và phê duyệt từng dòng sửa theo công thức Google XYZ.
            </p>
          </div>
        </div>
      </div>

      <ATSSimulatorWorkspace />
    </main>
  );
}
