import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RoastPage from '@/app/roast/page';

describe('Roast CV Interactive Flow (/roast)', () => {
  const mockExtractedText = `
    Nguyễn Văn A - Sinh viên năm cuối Đại học Bách Khoa
    Kỹ năng: React, TypeScript, Next.js
    Kinh nghiệm: Tham gia dự án thương mại điện tử
  `.trim();

  const mockRoastResponse = {
    success: true,
    data: {
      overallScore: 72,
      tone: 'spicy',
      summaryVerdict: 'CV trình bày quá khiêm tốn, thiếu số liệu đo lường cụ thể.',
      topStrengths: ['Có nền tảng kỹ thuật tốt', 'Biết dùng Next.js hiện đại'],
      weaknesses: [
        {
          quote: 'Tham gia dự án thương mại điện tử',
          issue: 'Không có số liệu chứng minh thành tựu',
          severity: 'Cao',
          rejectionReason: 'Nhà tuyển dụng không đo lường được kết quả',
          fixGuideline:
            'Thay bằng: Đảm nhận module [tên module], tối ưu tốc độ [X%] cho [10.000] người dùng.',
        },
      ],
      atsRecommendations: [
        {
          category: 'Cấu trúc',
          recommendation: 'Sử dụng tiêu đề chuẩn ATS cho từng mục',
          impact: 'Quan trọng',
        },
      ],
      disclaimer:
        'Kết quả chỉ mang tính tham khảo luyện tập, không cam kết việc làm hay đỗ ATS.',
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('Step 1: Renders initial file upload area and dual tone selector', () => {
    render(React.createElement(RoastPage));

    // Headline & instructions
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Roast CV/i);

    // Tone selector buttons
    expect(screen.getByRole('button', { name: /cà khịa|sát thủ/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /chuyên gia tận tâm/i })).toBeInTheDocument();

    // File input and drag & drop zone
    expect(screen.getByText(/kéo thả tệp tin|chọn tệp/i)).toBeInTheDocument();
    expect(screen.getByText(/hỗ trợ pdf, png, jpg.*5mb/i)).toBeInTheDocument();
  });

  it('Step 2: Allows switching tone between "Cà khịa / Sát thủ" and "Chuyên gia tận tâm"', async () => {
    const user = userEvent.setup();
    render(React.createElement(RoastPage));

    const spicyBtn = screen.getByRole('button', { name: /cà khịa|sát thủ/i });
    const constructiveBtn = screen.getByRole('button', { name: /chuyên gia tận tâm/i });

    // Switch to constructive
    await user.click(constructiveBtn);
    expect(constructiveBtn).toHaveAttribute('data-active', 'true');

    // Switch back to spicy
    await user.click(spicyBtn);
    expect(spicyBtn).toHaveAttribute('data-active', 'true');
  });

  it('Step 3: Uploads file, transitions to Editable Preview, and allows manual text editing (CRITICAL R2)', async () => {
    const user = userEvent.setup();

    // Mock fetch for /api/extract
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/extract')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            extractedText: mockExtractedText,
          }),
        });
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });
    global.fetch = fetchMock;

    render(React.createElement(RoastPage));

    // Upload mock PDF file
    const pdfBuffer = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);
    const mockFile = new File([pdfBuffer], 'my_resume.pdf', { type: 'application/pdf' });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    await user.upload(fileInput, mockFile);

    // Verify /api/extract was called
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/extract', expect.anything());
    });

    // Step 2: Editable OCR Preview screen must appear (R2)
    const textarea = await screen.findByRole('textbox', { name: /xem trước|nội dung cv/i });
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue(mockExtractedText);

    // User edits the extracted text to fix an OCR typo
    await user.type(textarea, ' Bổ sung: Đạt chứng chỉ AWS Cloud Practitioner.');
    expect(textarea).toHaveValue(mockExtractedText + ' Bổ sung: Đạt chứng chỉ AWS Cloud Practitioner.');
  });

  it('Step 4 & 5: Submits edited CV, shows roast loading hints, and renders structured report', async () => {
    const user = userEvent.setup();

    // Mock fetch for /api/extract and /api/roast
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/extract')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true, extractedText: mockExtractedText }),
        });
      }
      if (url.includes('/api/roast')) {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              status: 200,
              json: async () => mockRoastResponse,
            });
          }, 50);
        });
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });
    global.fetch = fetchMock;

    render(React.createElement(RoastPage));

    // Direct paste into text input tab
    const pasteTab = screen.getByRole('tab', { name: /dán văn bản|nhập trực tiếp/i });
    await user.click(pasteTab);

    const textarea = screen.getByRole('textbox', { name: /nội dung cv/i });
    await user.type(textarea, mockExtractedText);

    // Click submit button
    const submitBtn = screen.getByRole('button', { name: /bắt đầu roast|phân tích cv/i });
    fireEvent.click(submitBtn);

    // Step 4: Loading state with roast entertaining hints appears
    expect(screen.getByText(/đang bật chế độ cà khịa|đang soi từng lỗi/i)).toBeInTheDocument();

    // Step 5: Structured Results Presentation
    await waitFor(() => {
      // Score badge
      expect(screen.getByText('72')).toBeInTheDocument();
      // Summary verdict
      expect(screen.getByText(mockRoastResponse.data.summaryVerdict)).toBeInTheDocument();
      // Strengths
      expect(screen.getByText(mockRoastResponse.data.topStrengths[0])).toBeInTheDocument();
      // Weakness with severity badge
      expect(screen.getByText('Cao')).toBeInTheDocument();
      expect(screen.getByText(mockRoastResponse.data.weaknesses[0].quote)).toBeInTheDocument();
      expect(
        screen.getByText(mockRoastResponse.data.weaknesses[0].rejectionReason)
      ).toBeInTheDocument();
      // Fix guideline with placeholder
      expect(screen.getByText(/\[tên module\]/)).toBeInTheDocument();
      // ATS recommendations
      expect(
        screen.getByText(mockRoastResponse.data.atsRecommendations[0].recommendation)
      ).toBeInTheDocument();
      // AI disclaimer
      expect(screen.getByText(/chỉ mang tính tham khảo luyện tập/i)).toBeInTheDocument();
    });
  });

  it('Validates file size on client-side and blocks files > 5MB', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    global.fetch = fetchMock;

    render(React.createElement(RoastPage));

    // Construct an oversized mock file (> 5MB)
    const largeBuffer = new Uint8Array(5 * 1024 * 1024 + 1024);
    const oversizedFile = new File([largeBuffer], 'too_large.pdf', { type: 'application/pdf' });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, oversizedFile);

    // Fetch must NOT be called
    expect(fetchMock).not.toHaveBeenCalled();

    // Client-side error message must be shown
    expect(await screen.findByText(/dung lượng tệp vượt quá 5mb/i)).toBeInTheDocument();
  });
});
