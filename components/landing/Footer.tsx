import React from 'react';
import Link from 'next/link';
import { Flame, ShieldCheck, Heart } from 'lucide-react';
import { WipeDataButton } from '@/components/privacy/WipeDataButton';

export interface FooterProps {
  onOpenFakeDoor?: () => void;
}

export default function Footer({ onOpenFakeDoor }: FooterProps) {
  return (
    <footer className="border-t border-zinc-800/80 bg-zinc-950/90 text-zinc-400 py-12 px-4 sm:px-6 lg:px-8 mt-16">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Brand & Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
              </div>
              <span className="text-lg font-bold text-white">AI Roast CV</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-md">
              Nền tảng hỗ trợ sinh viên năm cuối và người mới đi làm hoàn thiện CV và rèn luyện bản lĩnh phỏng vấn với tiêu chí minh bạch và bảo mật dữ liệu tuyệt đối.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 pt-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Zero Retention: Không lưu trữ CV hay câu trả lời trên máy chủ</span>
            </div>
          </div>

          {/* Col 2: Features */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
              Tính năng
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/roast" className="hover:text-white transition-colors">
                  Roast CV (Cà khịa / Chuyên gia)
                </Link>
              </li>
              <li>
                <Link href="/interview" className="hover:text-white transition-colors">
                  Phỏng vấn áp lực 3 câu
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenFakeDoor}
                  className="hover:text-orange-400 transition-colors text-left cursor-pointer"
                >
                  Khảo sát tính năng Pro
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Principles & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
              Chính sách & An toàn
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <a href="#privacy-commitment" className="hover:text-white transition-colors">
                  Cam kết bảo mật dữ liệu
                </a>
              </li>
              <li>
                <WipeDataButton
                  variant="ghost"
                  className="p-0 h-auto font-normal text-xs sm:text-sm text-zinc-400 hover:text-rose-400 hover:bg-transparent"
                  label="Xóa sạch dữ liệu trình duyệt"
                />
              </li>
              <li>
                <span className="text-zinc-500">Tiêu chuẩn Rubric 4 tiêu chí</span>
              </li>
              <li>
                <span className="text-zinc-500">Hỗ trợ: support@airoastcv.vn</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal & AI Disclaimer Box */}
        <div className="p-4 sm:p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 leading-relaxed space-y-2">
          <p>
            <strong className="text-zinc-300">Tuyên bố miễn trừ trách nhiệm: </strong>
            Hệ thống sử dụng mô hình trí tuệ nhân tạo (Google Gemini Flash) để phân tích văn bản và mô phỏng tình huống. Mọi nhận xét, điểm số và đánh giá chỉ mang tính chất tham khảo luyện tập cá nhân, không cấu thành cam kết việc làm, bảo đảm đậu phỏng vấn hay đỗ các hệ thống lọc ATS thực tế của bất kỳ doanh nghiệp nào.
          </p>
          <p>
            <strong className="text-zinc-300">Chính sách dữ liệu: </strong>
            Hệ thống hoạt động theo nguyên tắc Zero Retention. Chúng tôi không lưu trữ nội dung CV hay câu trả lời trên máy chủ, không chia sẻ cho bên thứ ba và không sử dụng dữ liệu của bạn để huấn luyện mô hình khi chưa được đồng ý riêng.
          </p>
        </div>

        {/* Bottom copyright line */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 border-t border-zinc-900 pt-6 gap-3">
          <p>© 2026 AI Roast CV. Mọi quyền được bảo lưu.</p>
          <p className="flex items-center gap-1">
            Phát triển với <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> vì thế hệ trẻ Việt Nam
          </p>
        </div>
      </div>
    </footer>
  );
}
