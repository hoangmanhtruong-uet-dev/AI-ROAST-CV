'use client';

import React, { useEffect, useRef } from 'react';
import {
  ShareCardPayload,
  SanitizedShareCardData,
  prepareShareCardData,
} from '@/lib/schemas/share';
import { redactPiiFromText } from '@/lib/utils/pii-redactor';

export interface CanvasShareCardProps {
  payload?: ShareCardPayload;
  data?: SanitizedShareCardData;
  format?: 'landscape' | 'square';
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
  className?: string;
}

export function CanvasShareCard({
  payload,
  data: directData,
  format = 'landscape',
  onCanvasReady,
  className = '',
}: CanvasShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Fallback default payload if neither data nor payload provided
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
    title: 'Đánh Giá CV Chuyên Nghiệp',
    score: 80,
    quoteOrHighlight: 'CV có cấu trúc khá tốt nhưng cần tối ưu thêm số liệu đo lường.',
    summary: 'Phân tích tổng thể đạt mức khá, cần lượng hóa thành tích để vượt qua bộ lọc ATS.',
  });

  // Prepare sanitized share card data defensively
  const cardData = prepareShareCardData(resolvedPayload);

  // Double-defensive: ensure all rendered text strings are strictly scrubbed of any PII
  const cleanTitle = redactPiiFromText(cardData.title).sanitizedText;
  const cleanQuote = redactPiiFromText(cardData.sanitizedQuote || cardData.quoteOrHighlight).sanitizedText;
  const cleanSummary = redactPiiFromText(cardData.sanitizedSummary || cardData.summary).sanitizedText;
  const cleanMaskedName = redactPiiFromText(cardData.maskedName).sanitizedText;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isLandscape = format === 'landscape';
    const width = isLandscape ? 1200 : 1080;
    const height = isLandscape ? 630 : 1080;

    const dpr = typeof window !== 'undefined' ? Math.max(1, window.devicePixelRatio || 1) : 1;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = '100%';
    canvas.style.height = 'auto';

    ctx.save();
    if (dpr !== 1) {
      ctx.scale(dpr, dpr);
    }

    // 1. Dark Gradient Background
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#090d16');
    bgGradient.addColorStop(0.5, '#0f172a');
    bgGradient.addColorStop(1, '#020617');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // 2. Cyber Glow Accents
    const glow = ctx.createRadialGradient(200, 150, 20, 200, 150, 450);
    glow.addColorStop(0, 'rgba(249, 115, 22, 0.15)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    // 3. Card Frame Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    // 4. Brand Header
    ctx.font = 'bold 24px Inter, -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#f97316';
    ctx.fillText('🔥 AI ROAST CV', 70, 85);

    ctx.font = 'bold 14px Inter, -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#10b981';
    ctx.fillText('● BẢO MẬT & ĐÃ ẨN DANH PII', 270, 84);

    ctx.font = '14px Inter, -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(cardData.generatedDate, width - 170, 84);

    // Divider Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.moveTo(70, 110);
    ctx.lineTo(width - 70, 110);
    ctx.stroke();

    // 5. Hero Metric Score (Left Column)
    const scoreX = isLandscape ? 180 : width / 2;
    const scoreY = isLandscape ? 280 : 260;
    const scoreRadius = isLandscape ? 90 : 100;

    // Circle background
    ctx.beginPath();
    ctx.arc(scoreX, scoreY, scoreRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(24, 24, 27, 0.8)';
    ctx.fill();

    const isInterview = cardData.type === 'interview';
    const scoreVal = cardData.score;
    const isPassing = isInterview ? scoreVal >= 7.0 : scoreVal >= 70;
    const isModerate = isInterview ? scoreVal >= 5.0 : scoreVal >= 50;

    ctx.strokeStyle = isPassing ? '#10b981' : isModerate ? '#f59e0b' : '#f43f5e';
    ctx.lineWidth = 8;
    ctx.stroke();

    // Score Text
    ctx.textAlign = 'center';
    ctx.font = 'bold 64px Inter, -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';

    const formattedScore = isInterview
      ? (scoreVal % 1 !== 0 ? scoreVal.toFixed(1) : `${scoreVal}`)
      : `${Math.round(scoreVal)}`;

    ctx.fillText(formattedScore, scoreX, scoreY + 16);

    ctx.font = 'bold 16px Inter, -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(isInterview ? '/ 10 ĐIỂM' : '/ 100 ĐIỂM', scoreX, scoreY + 45);

    // Badge Under Score
    ctx.font = 'bold 13px Inter, -apple-system, system-ui, sans-serif';
    ctx.fillStyle = isInterview ? '#06b6d4' : '#f97316';
    const badgeText = isInterview ? 'AI ROAST CV • PHỎNG VẤN ÁP LỰC STAR' : cardData.badgeLabel;
    ctx.fillText(badgeText, scoreX, scoreY + 115);

    // Candidate Anonymized Name
    ctx.font = '14px Inter, -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(cleanMaskedName, scoreX, scoreY + 140);

    // 6. Content Section
    ctx.textAlign = 'left';
    const textStartX = isLandscape ? 340 : 80;
    const contentStartY = isLandscape ? 170 : 450;
    const contentWidth = isLandscape ? width - textStartX - 70 : width - 160;

    // Title / Verdict Header
    ctx.font = 'bold 26px Inter, -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#f1f5f9';
    const titleSnippet = cleanTitle.length > 50 ? `${cleanTitle.slice(0, 50)}...` : cleanTitle;
    ctx.fillText(titleSnippet, textStartX, contentStartY);

    // Quote Box (Highlight punchline)
    const quoteBoxY = contentStartY + 30;
    const quoteBoxHeight = 110;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(textStartX, quoteBoxY, contentWidth, quoteBoxHeight);

    // Orange left border
    ctx.fillStyle = isInterview ? '#06b6d4' : '#f97316';
    ctx.fillRect(textStartX, quoteBoxY, 4, quoteBoxHeight);

    ctx.font = 'italic 16px Inter, -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#e2e8f0';
    wrapText(
      ctx,
      `"${cleanQuote}"`,
      textStartX + 20,
      quoteBoxY + 35,
      contentWidth - 40,
      24,
      3
    );

    // Summary Critique
    const summaryLabelY = quoteBoxY + quoteBoxHeight + 40;
    ctx.font = 'bold 16px Inter, -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('Đánh giá tổng quan:', textStartX, summaryLabelY);

    ctx.font = '16px Inter, -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    wrapText(
      ctx,
      cleanSummary,
      textStartX,
      summaryLabelY + 30,
      contentWidth,
      26,
      isLandscape ? 4 : 6
    );

    // 7. Footer Watermark & Safety Disclaimer
    const footerLineY = height - 90;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.moveTo(70, footerLineY);
    ctx.lineTo(width - 70, footerLineY);
    ctx.stroke();

    ctx.font = '13px Inter, -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(
      'airoastcv.vn • Luyện tập phản xạ & tối ưu CV • Dữ liệu tự hủy sau phiên',
      70,
      height - 55
    );

    ctx.textAlign = 'right';
    ctx.fillText(
      'Thẻ đã che toàn bộ SĐT, Email & Liên kết cá nhân',
      width - 70,
      height - 55
    );

    ctx.restore();

    if (onCanvasReady) {
      onCanvasReady(canvas);
    }
  }, [
    cardData.score,
    cardData.type,
    cardData.badgeLabel,
    cardData.generatedDate,
    cleanTitle,
    cleanQuote,
    cleanSummary,
    cleanMaskedName,
    format,
    onCanvasReady,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-auto rounded-2xl shadow-2xl border border-zinc-800 ${className}`}
    />
  );
}

// Text wrapping utility with ellipsis truncation
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
) {
  const words = text.split(/\s+/);
  let line = '';
  let currentY = y;
  let lineCount = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line ? `${line} ${words[n]}` : words[n];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      lineCount++;
      if (lineCount >= maxLines) {
        let truncated = line;
        while (ctx.measureText(`${truncated}...`).width > maxWidth && truncated.length > 0) {
          truncated = truncated.slice(0, -1);
        }
        ctx.fillText(`${truncated}...`, x, currentY);
        return;
      }
      ctx.fillText(line, x, currentY);
      line = words[n];
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line && lineCount < maxLines) {
    ctx.fillText(line, x, currentY);
  }
}
