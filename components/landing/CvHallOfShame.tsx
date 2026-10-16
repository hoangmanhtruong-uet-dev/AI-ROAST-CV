'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Skull, AlertOctagon, Flame, Pause, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { soundEngine } from '@/lib/audio/sound-engine';
import { cn } from '@/lib/utils/cn';

export interface ShameItem {
  id: string;
  category: string;
  role: string;
  quote: string;
  penaltyChip: string;
  penaltyScore: string;
  roastComment: string;
}

export const HALL_OF_SHAME_ITEMS: ShameItem[] = [
  {
    id: 'shame-01',
    category: 'Văn hóa bàn nhậu',
    role: 'Ứng viên Quản trị Kinh doanh',
    quote: 'Trưởng ban nhậu kiêm tổ chức sự kiện liên hoan lớp suốt 4 năm đại học.',
    penaltyChip: 'HR đóng tab sau 2s',
    penaltyScore: '-50 điểm ATS',
    roastComment: 'Kỹ năng quản lý tài chính quán bia rất tốt, nhưng doanh nghiệp tìm Project Manager chứ không tuyển Idol bàn nhậu!',
  },
  {
    id: 'shame-02',
    category: 'Ảo tưởng thời gian',
    role: 'Fresher AI & Data',
    quote: 'Kinh nghiệm 10 năm sử dụng và prompt ChatGPT chuyên nghiệp.',
    penaltyChip: '-30đ timeline',
    penaltyScore: '-70 uy tín',
    roastComment: 'ChatGPT mới ra mắt cuối năm 2022, bạn prompt bằng cỗ máy thời gian của Doraemon từ thời tiểu học à?',
  },
  {
    id: 'shame-03',
    category: 'Startup gia đình',
    role: 'Thực tập sinh Marketing',
    quote: 'Từng làm Tổng Giám Đốc (CEO) tại công ty TNHH Bố Mẹ Nuôi.',
    penaltyChip: 'Đưa vào blacklist ngay',
    penaltyScore: 'Loại thẳng tay',
    roastComment: 'Chức danh CEO nghe oai như cóc, thực tế là phụ mẹ đóng gói hàng Shopee và quét kho sau giờ tan học.',
  },
  {
    id: 'shame-04',
    category: 'Kỹ năng thế kỷ 20',
    role: 'Ứng viên Nhân sự (HR)',
    quote: 'Biết sử dụng thành thạo Google Tìm Kiếm và lướt Facebook đa nhiệm.',
    penaltyChip: 'Thảm họa văn bản',
    penaltyScore: '-40 điểm ATS',
    roastComment: 'Ai sinh ra cũng biết bấm nút Search! Kỹ năng này chỉ có giá trị nếu bạn ứng tuyển chân tra cứu sổ hộ khẩu phường.',
  },
  {
    id: 'shame-05',
    category: 'Văn mẫu đa cấp',
    role: 'Ứng viên Sales BĐS',
    quote: 'Chịu khó tăng ca 24/7 không cần lương cứng (nhưng cần thưởng hoa hồng cao).',
    penaltyChip: 'Nghi ngờ đa cấp',
    penaltyScore: 'Cảnh báo đỏ',
    roastComment: 'Văn mẫu nghe như sắp rủ HR đi du thuyền hoặc mở khóa học tư duy làm giàu không lối thoát.',
  },
  {
    id: 'shame-06',
    category: 'Ký sinh đồ án',
    role: 'Sinh viên IT năm cuối',
    quote: 'Tham gia đồ án tốt nghiệp với vai trò cổ vũ tinh thần và động viên đồng đội.',
    penaltyChip: 'Nghi ngờ copy đồ án',
    penaltyScore: '-90 điểm uy tín',
    roastComment: 'Trong khi 3 đứa bạn gánh còng lưng code backend, bạn chỉ việc order trà sữa rồi ghi tên lên bìa báo cáo?',
  },
  {
    id: 'shame-07',
    category: 'Ngoại ngữ đường phố',
    role: 'Fresher Xuất Nhập Khẩu',
    quote: 'Trình độ tiếng Anh: Giao tiếp cực kỳ lưu loát và tự tin khi đã uống đủ 3 lon bia.',
    penaltyChip: 'Bay màu vòng phỏng vấn',
    penaltyScore: '-60 điểm ATS',
    roastComment: 'Bằng cấp này chỉ dùng được ở quán lẩu vỉa hè. Vào phòng phỏng vấn nghiêm túc là cứng lưỡi "Hello my name is..."!',
  },
  {
    id: 'shame-08',
    category: 'Thảm họa Font chữ',
    role: 'Thực tập sinh Thiết kế UI',
    quote: 'Thành thạo công cụ văn phòng: Biết mở Word, gõ văn bản 2 ngón và đổi font Comic Sans.',
    penaltyChip: 'Mù mắt tuyển dụng',
    penaltyScore: '-50 điểm ATS',
    roastComment: 'Dùng font Comic Sans trong CV là con đường ngắn nhất để hồ sơ của bạn bay thẳng vào thùng rác không kịp cứu.',
  },
  {
    id: 'shame-09',
    category: 'Hồ sơ hẹn hò',
    role: 'Ứng viên Ngân hàng',
    quote: 'Sở thích: Ngủ nướng ngày mưa, xem anime chữa lành và theo đuổi đam mê tài chính bất định.',
    penaltyChip: 'Nhầm app hẹn hò',
    penaltyScore: 'HR đóng tab sau 2s',
    roastComment: 'CV là bản chào bán giá trị sinh lời cho công ty, không phải bản confession tìm bạn bốn phương qua mạng!',
  },
  {
    id: 'shame-10',
    category: 'Giấc mơ Shark Tank',
    role: 'Sinh viên Tài chính',
    quote: 'Mục tiêu nghề nghiệp: Trở thành Shark đầu tư triệu USD sau 6 tháng thực tập.',
    penaltyChip: 'Tỉnh ngủ đi em',
    penaltyScore: '-80 điểm thực tế',
    roastComment: 'Chưa phân biệt nổi bảng cân đối kế toán với hóa đơn tiền điện mà đã mơ ngồi ghế xoay phán deal triệu đô.',
  },
  {
    id: 'shame-11',
    category: 'Khắc tinh Deadline',
    role: 'Junior Content Creator',
    quote: 'Điểm mạnh: Chịu được áp lực cao (với điều kiện sếp và khách hàng đừng giục deadline).',
    penaltyChip: 'Khắc tinh quản lý',
    penaltyScore: '-50 điểm ATS',
    roastComment: 'Áp lực duy nhất bạn chịu nổi là áp lực khí quyển khi nằm bật điều hòa 16 độ lướt TikTok!',
  },
  {
    id: 'shame-12',
    category: 'Thánh Fork Code',
    role: 'Fresher Web Dev',
    quote: 'Kỹ năng lập trình: Từng clone repo Github 10k stars của người khác và chạy mã thành công.',
    penaltyChip: 'Thánh copy-paste',
    penaltyScore: '-75 điểm ATS',
    roastComment: 'Fork mã nguồn của người khác về rồi sửa tên author không biến bạn thành Fullstack Developer được đâu em ơi!',
  },
];

export interface CvHallOfShameProps {
  className?: string;
  items?: ShameItem[];
  speedSeconds?: number;
}

export function CvHallOfShame({
  className,
  items = HALL_OF_SHAME_ITEMS,
  speedSeconds = 40,
}: CvHallOfShameProps) {
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  // Duplicate items array for seamless infinite marquee wrap
  const tickerItems = [...items, ...items];

  const handleCardClick = (item: ShameItem) => {
    setActiveCardId(item.id);
    try {
      soundEngine.playBlip();
    } catch {}
    setTimeout(() => setActiveCardId(null), 2500);
  };

  const togglePause = () => {
    setIsPaused((prev) => !prev);
    try {
      soundEngine.playBlip();
    } catch {}
  };

  return (
    <section
      id="cv-hall-of-shame"
      role="region"
      aria-label="CV Hall of Shame - Những câu chém gió kinh điển"
      className={cn('my-16 max-w-7xl mx-auto px-4 sm:px-6 overflow-hidden relative', className)}
    >
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 text-center sm:text-left">
        <div>
          <Badge variant="spicy" className="mb-2 px-3 py-1">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            Góc Cười Ra Nước Mắt
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            CV Hall of Shame — Những Câu Chém Gió &ldquo;Bay Màu&rdquo; Vòng Gửi Xe
          </h2>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Tuyển tập những câu mô tả kinh điển khiến nhà tuyển dụng bấm &ldquo;Reject&rdquo; sau 2 giây. Rê chuột hoặc chạm để tạm dừng đọc chi tiết.
          </p>
        </div>

        {/* Marquee Play/Pause Control Button */}
        <button
          type="button"
          onClick={togglePause}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700/80 hover:border-zinc-500 text-xs font-medium text-zinc-300 hover:text-white transition-all shadow-sm cursor-pointer"
          aria-label={isPaused ? 'Tiếp tục cuộn ticker' : 'Tạm dừng cuộn ticker'}
        >
          {isPaused ? (
            <>
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tiếp tục</span>
            </>
          ) : (
            <>
              <Pause className="w-3.5 h-3.5 text-amber-400" />
              <span>Tạm dừng</span>
            </>
          )}
        </button>
      </div>

      {/* Marquee Container with Left/Right Ambient Gradient Fades */}
      <div
        className="relative w-full overflow-hidden py-4 select-none group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Left Fade */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-r from-[#0a0f1d] to-transparent z-10"
        />
        {/* Right Fade */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-l from-[#0a0f1d] to-transparent z-10"
        />

        {/* Scrolling Track */}
        <motion.div
          className="flex gap-5 w-max"
          animate={{ x: isPaused ? undefined : ['0%', '-50%'] }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: 'loop',
              duration: speedSeconds,
              ease: 'linear',
            },
          }}
          data-testid="hall-of-shame-track"
        >
          {tickerItems.map((item, index) => {
            const isSelected = activeCardId === item.id;
            return (
              <div
                key={`${item.id}-${index}`}
                onClick={() => handleCardClick(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardClick(item);
                  }
                }}
                tabIndex={0}
                role="article"
                aria-label={`Lỗi CV: ${item.quote}`}
                className={cn(
                  'w-[320px] sm:w-[380px] shrink-0 p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between backdrop-blur-md',
                  isSelected
                    ? 'bg-zinc-900 border-orange-500 shadow-xl shadow-orange-500/20 scale-[1.02]'
                    : 'bg-zinc-900/70 border-zinc-800/80 hover:border-orange-500/50 hover:bg-zinc-900/90 hover:shadow-lg'
                )}
              >
                <div>
                  {/* Top Row: Category + Penalty Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                      <Skull className="w-3 h-3 text-rose-400" />
                      {item.category}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1 shadow-sm">
                      <AlertOctagon className="w-3 h-3 text-rose-400" />
                      {item.penaltyChip}
                    </span>
                  </div>

                  {/* Blunder Quote */}
                  <blockquote className="text-sm sm:text-base font-semibold text-zinc-100 italic mb-3 leading-snug">
                    &ldquo;{item.quote}&rdquo;
                  </blockquote>

                  {/* Sarcastic AI Roast Commentary */}
                  <div className="p-3 rounded-xl bg-orange-950/25 border border-orange-500/20 text-xs text-orange-200/90 leading-relaxed">
                    <span className="font-bold text-orange-400 block mb-1">
                      🔥 AI Roast:
                    </span>
                    {item.roastComment}
                  </div>
                </div>

                {/* Bottom Row: Candidate Context & Severity Score */}
                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400 truncate max-w-[200px]">
                    👤 {item.role}
                  </span>
                  <span className="font-mono font-bold text-rose-400">
                    {item.penaltyScore}
                  </span>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

export default CvHallOfShame;
