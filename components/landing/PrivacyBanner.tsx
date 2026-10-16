import React from 'react';
import { ShieldCheck, DatabaseZap, FileX2, Trash2, EyeOff } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function PrivacyBanner() {
  const pillars = [
    {
      icon: DatabaseZap,
      color: 'text-emerald-400',
      title: 'Xử lý bộ nhớ tạm (In-Memory)',
      description:
        'Tệp CV và câu trả lời chỉ được phân tích tạm thời qua API Google Gemini Flash và giải phóng bộ nhớ ngay sau khi trả kết quả. Hoàn toàn không có cơ sở dữ liệu lưu trữ hồ sơ.',
    },
    {
      icon: FileX2,
      color: 'text-teal-400',
      title: 'Không ghi nội dung vào Log',
      description:
        'Hệ thống máy chủ áp dụng bộ lọc bảo mật nghiêm ngặt: Tuyệt đối không ghi nội dung văn bản CV, câu trả lời phỏng vấn hay thông tin liên hệ vào server log.',
    },
    {
      icon: Trash2,
      color: 'text-rose-400',
      title: 'Xóa dữ liệu một chạm',
      description:
        'Mọi bản nháp và kết quả đánh giá chỉ lưu tạm tại trình duyệt của bạn (LocalStorage). Nút "Xóa sạch dữ liệu" cho phép bạn xóa sổ toàn bộ phiên chỉ bằng một cú nhấp.',
    },
    {
      icon: EyeOff,
      color: 'text-cyan-400',
      title: 'Ẩn danh thông tin cá nhân',
      description:
        'Thẻ chia sẻ kết quả (Share Card) được dựng 100% bằng HTML5 Canvas tại trình duyệt, tự động che mờ số điện thoại, email và liên kết cá nhân trước khi tải ảnh về.',
    },
  ];

  return (
    <section id="privacy-commitment" className="my-12 max-w-5xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-6">
        <Badge variant="emerald" className="mb-3 px-3 py-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Cam kết an toàn thông tin
        </Badge>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Quyền riêng tư là ưu tiên số 1 của chúng tôi
        </h2>
      </div>

      {/* Primary Mandatory Privacy Commitment Statement */}
      <div className="p-4 sm:p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-medium text-center text-sm sm:text-base mb-8 shadow-inner shadow-emerald-950">
        🛡️ <span className="font-semibold">Cam kết không lưu trữ CV hay câu trả lời trên máy chủ, xử lý an toàn tuyệt đối.</span>
      </div>

      {/* 4 Pillars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {pillars.map((pillar, idx) => {
          const Icon = pillar.icon;
          return (
            <Card
              key={idx}
              glow="emerald"
              className="p-5 flex flex-col items-start bg-zinc-900/50 hover:bg-zinc-900/80 transition-all border-zinc-800"
            >
              <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center mb-3">
                <Icon className={`w-5 h-5 ${pillar.color}`} />
              </div>
              <h3 className="text-sm font-semibold text-zinc-100 mb-1.5">{pillar.title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{pillar.description}</p>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
