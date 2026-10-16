'use client';

import React, { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ShieldCheck,
  Flame,
  Timer,
  Sparkles,
  Lock,
  RotateCcw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { soundEngine } from '@/lib/audio/sound-engine';
import { cn } from '@/lib/utils/cn';

export interface FaqItem {
  id: string;
  question: string;
  answer: string | React.ReactNode;
  category: 'security' | 'roast' | 'interview' | 'pro';
  icon: React.ComponentType<{ className?: string }>;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-security',
    category: 'security',
    icon: ShieldCheck,
    question: 'AI Roast CV có thật sự không lưu CV và câu trả lời của tôi trên máy chủ?',
    answer:
      'Chính xác 100%. Hệ thống được kiến trúc theo nguyên tắc Zero Retention tuyệt đối: Tệp CV hoặc văn bản bạn gửi chỉ được nạp tạm thời vào bộ nhớ RAM của server để chuyển tiếp tới Google Gemini Flash và giải phóng bộ nhớ (zero out) ngay sau khi trả kết quả (vòng đời tối đa 0.1s). Chúng tôi không có cơ sở dữ liệu lưu trữ hồ sơ, không lưu file trên ổ cứng và toàn bộ log máy chủ đã bị loại bỏ thông tin nhạy cảm qua bộ lọc [REDACTED_BY_ZERO_RETENTION].',
  },
  {
    id: 'faq-modes',
    category: 'roast',
    icon: Flame,
    question: 'Chế độ "Cà khịa / Mỏ hỗn" và "Chuyên gia tận tâm" khác nhau như thế nào?',
    answer:
      'Chế độ "Cà khịa / Sát thủ" (Spicy Roast) sử dụng văn phong châm biếm, hài hước và gai góc của một nhà tuyển dụng khó tính nhằm chỉ thẳng những điểm sáo rỗng, thiếu thực tế trong CV để giúp bạn "tỉnh ngộ". Ngược lại, chế độ "Chuyên gia tận tâm" (Constructive Review) mang phong thái tư vấn tuyển dụng nghiêm túc, phân tích sâu về cấu trúc ngữ nghĩa, từ khóa chuyên môn và độ tương thích với hệ thống lọc hồ sơ ATS.',
  },
  {
    id: 'faq-interview',
    category: 'interview',
    icon: Timer,
    question: 'Tính năng Phỏng vấn áp lực (Stress Interview) mô phỏng trải nghiệm thực tế ra sao?',
    answer:
      'Bạn sẽ được chọn vị trí khởi đầu (IT / Software Engineer hoặc Marketing / Business, hoặc nhập trực tiếp Job Description công ty mục tiêu nếu có Gói Pro). AI sẽ đưa ra 3 câu hỏi tình huống hóc búa liên tiếp kèm đồng hồ đếm ngược (60s - 90s mỗi câu). Sau khi hoàn thành, hệ thống sẽ chấm điểm chi tiết theo Rubric 4 tiêu chí công khai: Cấu trúc câu trả lời (STAR), Tính cụ thể & dẫn chứng, Mức độ liên quan, và Nhận thức hệ quả & tư duy xử lý vấn đề.',
  },
  {
    id: 'faq-rewrite',
    category: 'roast',
    icon: Sparkles,
    question: 'Trợ lý viết lại CV chuẩn ATS có tự ý bịa đặt thành tích của tôi không?',
    answer:
      'Tuyệt đối không! Nguyên tắc cốt lõi của AI Roast CV là không bao giờ tự ý bịa đặt số liệu hay thành tích giả dối. Mọi đề xuất viết lại đều tuân thủ nghiêm ngặt công thức vàng [Action Verb] + [Context] + [Result] và luôn chừa sẵn các placeholder rõ ràng như [X%], [Y người dùng], [tên công nghệ] để bạn tự điền số liệu chính xác từ kinh nghiệm thực tế của bản thân.',
  },
  {
    id: 'faq-pro',
    category: 'pro',
    icon: Lock,
    question: 'Gói Pro 29.000đ mở khóa những tính năng nâng cao nào?',
    answer:
      'Gói Pro 29.000đ (thanh toán một lần mở khóa bằng VietQR hoặc License Key) giúp bạn mở khóa không giới hạn số lượt viết lại từng gạch đầu dòng CV chuẩn ATS, xuất toàn bộ bản CV cải tiến dưới định dạng văn bản sạch (.md / .txt), và tạo các phiên phỏng vấn áp lực tùy biến theo sát nội dung Job Description (JD) của bất kỳ doanh nghiệp nào.',
  },
  {
    id: 'faq-wipe',
    category: 'security',
    icon: RotateCcw,
    question: 'Làm thế nào để tôi xóa sạch hoàn toàn dữ liệu sau khi sử dụng?',
    answer:
      'Mọi kết quả chấm điểm và bản nháp chỉ được lưu tạm thời trên trình duyệt của chính bạn (LocalStorage / SessionStorage). Bất kỳ lúc nào, bạn chỉ cần bấm nút "Xóa sạch dữ liệu (1-Click Wipe)" trên thanh Navbar hoặc trong phần cài đặt bảo mật để thanh lọc 100% dữ liệu phiên làm việc khỏi thiết bị của mình.',
  },
];

export interface FaqSectionProps {
  className?: string;
  onOpenFakeDoor?: () => void;
  onOpenCheckout?: () => void;
}

export function FaqSection({ className, onOpenFakeDoor, onOpenCheckout }: FaqSectionProps) {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    'faq-security': true, // Open first item by default
  });

  const toggleItem = (id: string) => {
    try {
      soundEngine.playBlip();
    } catch {}
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <section id="faq" className={cn('my-16 max-w-4xl mx-auto px-4 sm:px-6', className)}>
      {/* Section Header */}
      <div className="text-center mb-10">
        <Badge variant="cyan" className="mb-3 px-3 py-1">
          <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
          Giải Đáp Thắc Mắc
        </Badge>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Những câu hỏi thường gặp (FAQ)
        </h2>
        <p className="mt-2 text-sm text-zinc-400 max-w-lg mx-auto">
          Mọi điều bạn cần biết về nguyên tắc bảo mật, công nghệ AI và cách tận dụng AI Roast CV để đột phá sự nghiệp.
        </p>
      </div>

      {/* Accordion List */}
      <div className="space-y-3.5">
        {FAQ_ITEMS.map((item) => {
          const isOpen = Boolean(openItems[item.id]);
          const Icon = item.icon;

          return (
            <Card
              key={item.id}
              className={cn(
                'border transition-all duration-200 overflow-hidden',
                isOpen
                  ? 'bg-zinc-900/80 border-zinc-700 shadow-lg'
                  : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700/80'
              )}
            >
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${item.id}`}
                className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                      isOpen
                        ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm sm:text-base font-semibold text-zinc-100 leading-snug">
                    {item.question}
                  </span>
                </div>
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-zinc-400 transition-transform duration-200',
                    isOpen && 'rotate-180 text-orange-400'
                  )}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {isOpen && (
                <div
                  id={`faq-answer-${item.id}`}
                  className="px-5 pb-5 pt-1 text-xs sm:text-sm text-zinc-300 leading-relaxed border-t border-zinc-800/60 mt-1"
                >
                  {item.answer}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Support Sub-CTA */}
      <div className="mt-8 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-center text-xs text-zinc-400 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span>Vẫn còn thắc mắc về cách tối ưu CV hoặc phỏng vấn?</span>
        <button
          type="button"
          onClick={() => {
            try {
              soundEngine.playBlip();
            } catch {}
            if (onOpenFakeDoor) onOpenFakeDoor();
            else if (onOpenCheckout) onOpenCheckout();
          }}
          className="px-4 py-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 border border-orange-500/30 font-semibold transition-all cursor-pointer whitespace-nowrap"
        >
          Khảo sát Gói Pro 29k & Đóng góp ý kiến
        </button>
      </div>
    </section>
  );
}

export default FaqSection;
