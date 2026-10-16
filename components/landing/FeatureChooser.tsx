import React from 'react';
import Link from 'next/link';
import { Flame, Timer, Check, ArrowRight, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function FeatureChooser() {
  const roastChecklist = [
    'Hỗ trợ tệp PDF, PNG, JPG (≤ 5MB) hoặc dán trực tiếp văn bản CV.',
    'Màn hình xem trước & cho phép tự do chỉnh sửa văn bản OCR trước khi phân tích.',
    '2 Chế độ giọng điệu: "Cà khịa / Sát thủ" (thẳng thắn) hoặc "Chuyên gia tận tâm".',
    'Hướng dẫn sửa kèm placeholder [...] (tuyệt đối không tự bịa đặt thành tích).',
    'Khuyến nghị cải thiện cấu trúc, từ khóa và độ tương thích bộ lọc ATS.',
  ];

  const interviewChecklist = [
    '2 Vai trò khởi đầu: IT / Software Engineer hoặc Marketing / Business.',
    '3 Câu hỏi tình huống liên tiếp rèn luyện phản xạ ứng biến.',
    'Đồng hồ đếm ngược (timer 60s - 90s) cho mỗi câu hỏi áp lực.',
    'Nút "Bỏ qua" hoặc "Dừng phỏng vấn" an toàn bất cứ lúc nào.',
    'Chấm điểm Rubric 5 tiêu chí công khai kèm nhận xét chi tiết và điểm mạnh.',
  ];

  return (
    <section id="features" className="my-16 max-w-5xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-10">
        <Badge variant="spicy" className="mb-3 px-3 py-1">
          <Sparkles className="w-3.5 h-3.5" />
          Trải nghiệm thực chiến
        </Badge>
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
          Chọn tính năng bạn muốn thử thách
        </h2>
        <p className="mt-3 text-sm sm:text-base text-zinc-400">
          Bắt đầu hoàn toàn miễn phí, không yêu cầu thẻ tín dụng hay đăng ký tài khoản.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Feature 1: Roast CV */}
        <Card
          id="feature-roast"
          glow="spicy"
          className="flex flex-col justify-between p-6 sm:p-8 bg-zinc-900/60 border-orange-500/30 hover:border-orange-500/60 transition-all duration-300"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500">
                <Flame className="w-6 h-6 fill-orange-500/20" />
              </div>
              <Badge variant="spicy">🔥 Miễn phí 1 trang</Badge>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Roast CV (Cà khịa / Chuyên gia)
            </h3>
            <p className="text-sm text-zinc-300 mb-6 leading-relaxed">
              Vạch trần mọi câu sáo rỗng trong CV và nhận hướng dẫn sửa chi tiết theo chuẩn tuyển dụng.
            </p>

            <ul className="space-y-3 mb-8">
              {roastChecklist.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-300">
                  <div className="w-4 h-4 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center mt-0.5 flex-shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <Link
            href="/roast"
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold transition-all shadow-lg shadow-orange-600/25 hover:scale-[1.02] cursor-pointer"
          >
            <span>Bắt đầu Roast CV ngay</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Card>

        {/* Feature 2: Stress Interview */}
        <Card
          id="feature-interview"
          glow="cyan"
          className="flex flex-col justify-between p-6 sm:p-8 bg-zinc-900/60 border-cyan-500/30 hover:border-cyan-500/60 transition-all duration-300"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Timer className="w-6 h-6" />
              </div>
              <Badge variant="cyan">⏱️ Thử thách bản lĩnh</Badge>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Phỏng vấn áp lực (Stress Interview)
            </h3>
            <p className="text-sm text-zinc-300 mb-6 leading-relaxed">
              Mô phỏng áp lực thực tế trước các câu hỏi tình huống hóc búa từ người phỏng vấn khó tính.
            </p>

            <ul className="space-y-3 mb-8">
              {interviewChecklist.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-300">
                  <div className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mt-0.5 flex-shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <Link
            href="/interview"
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-all shadow-lg shadow-cyan-600/25 hover:scale-[1.02] cursor-pointer"
          >
            <span>Vào phỏng vấn áp lực ngay</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Card>
      </div>
    </section>
  );
}
