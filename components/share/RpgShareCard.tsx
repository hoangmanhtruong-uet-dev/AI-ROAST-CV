'use client';

import React, { useRef, useEffect } from 'react';
import {
  ShareCardPayload,
  SanitizedShareCardData,
  prepareShareCardData,
  sanitizeCandidateName,
} from '@/lib/schemas/share';

export type RpgTier = 'SSR' | 'S' | 'A' | 'B' | 'C' | 'F';

export interface RpgAttributes {
  atsAttack: number; // Sát thương ATS (0-100)
  hrArmor: number; // Độ chống chịu HR (0-100)
  evasion: number; // Độ né tránh câu hỏi (0-100)
  precision: number; // Độ cụ thể & Số liệu (0-100)
  charisma: number; // Aura tự tin (0-100)
}

export interface RpgCardProfile {
  title: string;
  subtitle: string;
  tier: RpgTier;
  survivalScore: number;
  attributes: RpgAttributes;
  buff: string;
  debuff: string;
  classIcon: string;
}

export function calculateRpgProfile(
  score: number,
  type: 'roast' | 'interview' = 'roast'
): RpgCardProfile {
  // Normalize interview score (typically 0-10) to 0-100
  const normalizedScore =
    type === 'interview' && score <= 10
      ? Math.min(100, Math.max(0, Math.round(score * 10)))
      : Math.min(100, Math.max(0, Math.round(score)));

  if (normalizedScore >= 90) {
    return {
      title: 'Kẻ Hủy Diệt Vòng Gửi Xe',
      subtitle: 'Đại sư tối ưu hóa ATS & Thực chiến',
      tier: 'SSR',
      survivalScore: normalizedScore,
      attributes: {
        atsAttack: 98,
        hrArmor: 95,
        evasion: 30,
        precision: 96,
        charisma: 92,
      },
      buff: 'Tỷ lệ qua vòng CV 99.8%, khiến HR lập tức mở lịch phỏng vấn.',
      debuff: 'Quá nhiều offer cùng lúc dẫn đến quá tải lựa chọn.',
      classIcon: 'trophy',
    };
  }

  if (normalizedScore >= 75) {
    return {
      title: 'Hiệp Sĩ Fix Bug Gánh Team',
      subtitle: 'Chiến binh cày ải thực tế, thầm lặng vượt khó',
      tier: 'A',
      survivalScore: normalizedScore,
      attributes: {
        atsAttack: 82,
        hrArmor: 78,
        evasion: 45,
        precision: 85,
        charisma: 74,
      },
      buff: 'Chém đứt mọi bug kỳ dị trong dự án mà không cần stack trace.',
      debuff: 'CV còn viết theo kiểu kể khổ hơn là làm nổi bật giá trị kinh doanh.',
      classIcon: 'swords',
    };
  }

  if (normalizedScore >= 60) {
    return {
      title: 'Chiến Thần Kỹ Năng Mềm',
      subtitle: 'Aura ngoại giao cực đỉnh, kỹ thuật đang loading',
      tier: 'B',
      survivalScore: normalizedScore,
      attributes: {
        atsAttack: 65,
        hrArmor: 72,
        evasion: 75,
        precision: 55,
        charisma: 88,
      },
      buff: 'Thuyết phục HR bằng sự nhiệt tình và khả năng hòa nhập team siêu tốc.',
      debuff: 'Dễ tụt huyết áp khi vòng phỏng vấn kỹ thuật bắt live-code thuật toán.',
      classIcon: 'shield',
    };
  }

  if (normalizedScore >= 45) {
    return {
      title: 'Chiến Thần Tham Gia',
      subtitle: 'Có mặt trong mọi dự án nhưng không ai biết làm gì',
      tier: 'C',
      survivalScore: normalizedScore,
      attributes: {
        atsAttack: 48,
        hrArmor: 50,
        evasion: 85,
        precision: 30,
        charisma: 60,
      },
      buff: 'Thành thạo kỹ năng ghi chú biên bản cuộc họp và order trà sữa.',
      debuff: 'CV ngập tràn từ "tham gia", "hỗ trợ", 0 số liệu đo lường cụ thể.',
      classIcon: 'wand',
    };
  }

  return {
    title: 'Phù Thủy Văn Mẫu',
    subtitle: 'Chúa tể sáo rỗng & Trùm sao chép template',
    tier: 'F',
    survivalScore: normalizedScore,
    attributes: {
      atsAttack: 25,
      hrArmor: 20,
      evasion: 98,
      precision: 10,
      charisma: 40,
    },
    buff: 'Bắn từ khóa "năng động, ham học hỏi, chịu áp lực" với vận tốc âm thanh.',
    debuff: 'CV bị loại ngay tại vòng gửi xe bởi bot lọc ATS sau 1.2 giây.',
    classIcon: 'skull',
  };
}

export interface RpgShareCardProps {
  payload?: ShareCardPayload;
  data?: SanitizedShareCardData;
  format?: 'landscape' | 'square';
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
  className?: string;
}

export function RpgShareCard({
  payload,
  data: directData,
  format = 'landscape',
  onCanvasReady,
  className = '',
}: RpgShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const resolvedPayload: ShareCardPayload = payload || (directData ? {
    type: directData.type,
    title: directData.title,
    score: directData.score,
    quoteOrHighlight: directData.quoteOrHighlight,
    summary: directData.summary,
    candidateName: directData.maskedName,
    toneOrRole: directData.toneOrRole,
  } : {
    type: 'roast',
    title: 'Hồ Sơ Sinh Tồn CV',
    score: 75,
    quoteOrHighlight: 'Cần bổ sung số liệu định lượng cho các thành tích thực tế.',
    summary: 'Điểm sinh tồn đạt mức khá, cần tối ưu thêm từ khóa ATS.',
  });

  const cardData = prepareShareCardData(resolvedPayload);
  const rpgProfile = calculateRpgProfile(cardData.score, cardData.type);
  const maskedName = sanitizeCandidateName(cardData.maskedName);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = format === 'landscape' ? 1200 : 1080;
    const height = format === 'landscape' ? 630 : 1080;
    const dpr = typeof window !== 'undefined' ? Math.max(1, window.devicePixelRatio || 1) : 1;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = '100%';
    canvas.style.height = 'auto';

    ctx.save();
    if (dpr !== 1) ctx.scale(dpr, dpr);

    // 1. Cyber-Fantasy Dungeon Gradient Background
    const bg = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width);
    bg.addColorStop(0, '#160829');
    bg.addColorStop(0.5, '#0b0d1b');
    bg.addColorStop(1, '#05070e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // 2. Neon Outer Border
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.25)';
    ctx.lineWidth = 3;
    ctx.strokeRect(28, 28, width - 56, height - 56);

    // 3. Header Banner
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.fillStyle = '#f97316';
    ctx.fillText('🔥 AI ROAST CV • SPOTIFY WRAPPED EDITION', 60, 75);

    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillStyle = '#a855f7';
    ctx.fillText(`TIER ${rpgProfile.tier} • HỒ SƠ SINH TỒN NĂM`, width - 360, 75);

    // 4. Survival Score & RPG Title (Left side)
    const isLand = format === 'landscape';
    const centerX = isLand ? 240 : width / 2;
    const centerY = isLand ? 280 : 320;

    // Survival Score Ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, 95, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(24, 18, 38, 0.9)';
    ctx.fill();
    ctx.strokeStyle =
      rpgProfile.tier === 'SSR' || rpgProfile.tier === 'S'
        ? '#10b981'
        : rpgProfile.tier === 'A' || rpgProfile.tier === 'B'
        ? '#38bdf8'
        : '#f59e0b';
    ctx.lineWidth = 8;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = 'bold 64px Inter, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${rpgProfile.survivalScore}`, centerX, centerY + 18);

    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillStyle = '#a855f7';
    ctx.fillText('ĐIỂM SINH TỒN CV', centerX, centerY + 46);

    ctx.font = '14px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(maskedName, centerX, centerY + 130);

    // 5. RPG Class Title & Subtitle
    ctx.textAlign = 'left';
    const textX = isLand ? 420 : 80;
    const textY = isLand ? 150 : 540;

    ctx.font = 'extrabold 32px Inter, sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(rpgProfile.title, textX, textY);

    ctx.font = 'italic 16px Inter, sans-serif';
    ctx.fillStyle = '#c084fc';
    ctx.fillText(`"${rpgProfile.subtitle}"`, textX, textY + 30);

    // 6. Draw 5-Axis Stat Bars
    const stats = [
      { label: 'Sát thương ATS', val: rpgProfile.attributes.atsAttack },
      { label: 'Độ chống chịu HR', val: rpgProfile.attributes.hrArmor },
      { label: 'Né tránh câu hỏi', val: rpgProfile.attributes.evasion },
      { label: 'Độ cụ thể số liệu', val: rpgProfile.attributes.precision },
      { label: 'Aura tự tin', val: rpgProfile.attributes.charisma },
    ];

    let barY = textY + 70;
    const barWidth = isLand ? width - textX - 80 : width - 160;

    stats.forEach((st) => {
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(st.label, textX, barY);

      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`${st.val}/100`, textX + barWidth - 45, barY);

      // Background Bar
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(textX, barY + 8, barWidth, 8);

      // Value Bar
      const fillW = (st.val / 100) * barWidth;
      const barGrad = ctx.createLinearGradient(textX, 0, textX + fillW, 0);
      barGrad.addColorStop(0, '#a855f7');
      barGrad.addColorStop(1, '#ec4899');
      ctx.fillStyle = barGrad;
      ctx.fillRect(textX, barY + 8, fillW, 8);

      barY += 32;
    });

    // 7. Perks & Debuffs
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillStyle = '#4ade80';
    ctx.fillText(`+ Nội tại: ${rpgProfile.buff}`, textX, barY + 25);

    ctx.fillStyle = '#f87171';
    ctx.fillText(`- Điểm yếu: ${rpgProfile.debuff}`, textX, barY + 50);

    // 8. Footer Watermark
    ctx.font = '12px Inter, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(
      'airoastcv.vn • Đã tự động ẩn danh toàn bộ PII • Zero Server Logging',
      60,
      height - 45
    );

    ctx.restore();

    if (onCanvasReady) onCanvasReady(canvas);
  }, [cardData.score, cardData.type, format, maskedName, onCanvasReady, rpgProfile]);

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <canvas
        ref={canvasRef}
        data-testid="rpg-share-canvas"
        className="w-full h-auto rounded-2xl shadow-2xl border border-purple-900/40"
      />
    </div>
  );
}

export default RpgShareCard;
