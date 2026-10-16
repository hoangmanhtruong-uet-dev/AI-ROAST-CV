import { RoastTeaserResult } from '@/lib/schemas/roast-teaser';

export interface TeaserPreset {
  id: string;
  label: string;
  sentence: string;
  roastComment: string;
  actionVerb: string;
  atsRewrite: string;
}

export const TEASER_PRESETS: TeaserPreset[] = [
  {
    id: 'preset_web_dev',
    label: '💻 Dev "tham gia"',
    sentence: 'Tham gia phát triển website bán hàng cùng nhóm.',
    roastComment:
      'Chữ "tham gia" trong CV thường có nghĩa là bạn chỉ ngồi nhìn người khác gõ code hoặc mở Google Meet đúng giờ. Không số liệu, không vai trò, tỷ lệ bị loại vòng gửi xe là 99%!',
    actionVerb: 'Chủ trì thiết kế và phát triển',
    atsRewrite:
      'Chủ trì phát triển module [tính năng giỏ hàng / thanh toán] cho nền tảng thương mại điện tử bằng [Next.js & TypeScript], giúp rút ngắn [X%] thời gian tải trang và phục vụ [Y] người dùng ổn định.',
  },
  {
    id: 'preset_marketing',
    label: '📢 Marketing "đăng bài"',
    sentence: 'Hỗ trợ quản lý fanpage và đăng bài hàng ngày.',
    roastComment:
      'Lên Canva gõ text rồi bấm nút "Đăng bài" không phải là Digital Marketing! Đừng biến CV thành nhật ký lướt Facebook của bạn!',
    actionVerb: 'Xây dựng và tối ưu chiến lược nội dung',
    atsRewrite:
      'Xây dựng chiến lược nội dung đa kênh cho fanpage [tên thương hiệu], gia tăng tỷ lệ tương tác (ER) lên [X%] và thu hút [Y] khách hàng tiềm năng chất lượng cao mỗi tháng.',
  },
  {
    id: 'preset_cliche_fluff',
    label: '🧘 Văn mẫu "chăm chỉ"',
    sentence: 'Em là người chăm chỉ, ham học hỏi, chịu được áp lực cao.',
    roastComment:
      'Năm 2026 rồi mà vẫn viết văn mẫu thế kỷ trước! Nhà tuyển dụng tìm nhân sự tạo ra doanh thu và giải quyết vấn đề, không tìm người chịu đựng khổ đau!',
    actionVerb: 'Chủ động làm chủ và ứng dụng',
    atsRewrite:
      'Chủ động nghiên cứu và làm chủ [công nghệ / công cụ mới], áp dụng giải quyết [bài toán thực tế] trong dự án [tên dự án] hoàn thành vượt tiến độ [X tuần].',
  },
  {
    id: 'preset_soft_skills',
    label: '🤝 Kỹ năng "giao tiếp"',
    sentence: 'Có kỹ năng giao tiếp tốt và làm việc nhóm hiệu quả.',
    roastComment:
      'Ai sinh ra cũng biết nói và thở! Ghi "kỹ năng giao tiếp tốt" mà không có dự án thực chiến chứng minh thì nhà tuyển dụng chỉ xem là câu nói cho có.',
    actionVerb: 'Phối hợp liên chức năng',
    atsRewrite:
      'Phối hợp hiệu quả liên chức năng theo mô hình [Agile / Scrum] với [X thành viên], quản lý tiến độ công việc qua [Jira] và bàn giao [Y sprint / dự án] đúng hạn 100%.',
  },
];

/**
 * Normalizes user input for instant O(1) cache matching:
 * Lowercases, strips punctuation, collapses whitespace.
 */
export function normalizeSentence(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:…]+$/, '')
    .replace(/\s+/g, ' ');
}

const PRESET_MAP = new Map<string, TeaserPreset>();
for (const p of TEASER_PRESETS) {
  PRESET_MAP.set(normalizeSentence(p.sentence), p);
}
// Add common variation alias for preset 3
const studentAlias = 'Em là sinh viên chăm chỉ, ham học hỏi, chịu được áp lực cao.';
const preset3 = TEASER_PRESETS.find((p) => p.id === 'preset_cliche_fluff');
if (preset3) {
  PRESET_MAP.set(normalizeSentence(studentAlias), preset3);
}

/**
 * Instant preset lookup (< 1ms). Returns pre-warmed result if matched.
 */
export function findPresetMatch(sentence: string): RoastTeaserResult | null {
  const match = PRESET_MAP.get(normalizeSentence(sentence));
  if (!match) return null;

  return {
    originalSentence: sentence,
    roastComment: match.roastComment,
    actionVerb: match.actionVerb,
    atsRewrite: match.atsRewrite,
  };
}
