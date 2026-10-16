import { describe, it, expect } from 'vitest';
import {
  redactPiiFromText,
  maskPhoneNumber,
  maskEmail,
  maskUrl,
  maskCandidateName,
  VIETNAMESE_PHONE_REGEX,
  EMAIL_REGEX,
  URL_REGEX,
} from '@/lib/utils/pii-redactor';

describe('Milestone 4: PII Redactor Engine (Feature 24 & §R4)', () => {
  // =========================================================================
  // 1. Vietnamese Mobile Phone Numbers
  // =========================================================================
  describe('1. Vietnamese Phone Number Masking (03x, 05x, 07x, 08x, 09x & +84)', () => {
    const validPhones = [
      // Viettel
      { input: '0981234567', expected: '09****4567' },
      { input: '0868123456', expected: '08****3456' },
      { input: '0389123456', expected: '03****3456' },
      // Mobifone
      { input: '0903123456', expected: '09****3456' },
      { input: '0707123456', expected: '07****3456' },
      { input: '0798123456', expected: '07****3456' },
      // Vinaphone
      { input: '0912345678', expected: '09****5678' },
      { input: '0888123456', expected: '08****3456' },
      { input: '0834123456', expected: '08****3456' },
      // Vietnamobile & Gmobile & Wintel
      { input: '0922123456', expected: '09****3456' },
      { input: '0567123456', expected: '05****3456' },
      { input: '0598123456', expected: '05****3456' },
      { input: '0559123456', expected: '05****3456' },
      // International +84 formats
      { input: '+84912345678', expected: '+84****5678' },
      { input: '+84 903 123 456', expected: '+84****3456' },
      { input: '84987654321', expected: '84****4321' },
      { input: '(+84) 912 345 678', expected: '+84****5678' },
      // Separators: hyphens, dots, spaces
      { input: '098-765-4321', expected: '09****4321' },
      { input: '038.123.4567', expected: '03****4567' },
      { input: '090 123 4567', expected: '09****4567' },
    ];

    it.each(validPhones)(
      'correctly masks phone number: $input -> $expected',
      ({ input, expected }) => {
        const masked = maskPhoneNumber(input);
        expect(masked).toBe(expected);
      }
    );

    it('redacts phones embedded in prose without losing surrounding sentence structure', () => {
      const text = 'Liên hệ với tôi qua SĐT 0912345678 hoặc hotline +84 987 654 321 khi có kết quả.';
      const result = redactPiiFromText(text);

      expect(result.sanitizedText).not.toContain('0912345678');
      expect(result.sanitizedText).not.toContain('987 654 321');
      expect(result.sanitizedText).toContain('09****5678');
      expect(result.redactionSummary.phones).toBe(2);
    });

    it('does NOT corrupt non-phone numbers, years, percentages, or metrics', () => {
      const nonPhones = [
        'Năm tốt nghiệp: 2026',
        'Tối ưu hóa 35% hiệu năng ứng dụng',
        'Phục vụ 50.000 người dùng hoạt động mỗi ngày',
        'Chạy container trên port 8080 và 3000',
        'Đạt giải thưởng 50.000.000 VNĐ trong cuộc thi Hackathon',
        'Xử lý 10.000 QPS với Redis cache',
      ];

      for (const line of nonPhones) {
        const result = redactPiiFromText(line);
        expect(result.sanitizedText).toBe(line);
        expect(result.redactionSummary.phones).toBe(0);
      }
    });
  });

  // =========================================================================
  // 2. Email Addresses
  // =========================================================================
  describe('2. Email Address Masking (Simple, Multi-Dot, Plus-Addressing)', () => {
    const validEmails = [
      { input: 'nguyenvana@gmail.com', expected: 'n***a@gmail.com' },
      { input: 'student.hust@edu.vn', expected: 's***t@edu.vn' },
      { input: 'dev.frontend+job@domain.co.uk', expected: 'd***b@domain.co.uk' },
      { input: 'a@example.com', expected: 'a***@example.com' },
      { input: 'candidate_v2@subdomain.tech-company.org', expected: 'c***2@subdomain.tech-company.org' },
      { input: 'UPPERCASE.TEST@DOMAIN.VN', expected: 'U***T@DOMAIN.VN' },
    ];

    it.each(validEmails)(
      'masks email: $input -> $expected',
      ({ input, expected }) => {
        const masked = maskEmail(input);
        expect(masked).toBe(expected);
      }
    );

    it('redacts multiple emails in a single CV block', () => {
      const text = 'Email chính: tuan.le@gmail.com, Email trường: tuan.le@hust.edu.vn';
      const result = redactPiiFromText(text);

      expect(result.sanitizedText).not.toContain('tuan.le@gmail.com');
      expect(result.sanitizedText).not.toContain('tuan.le@hust.edu.vn');
      expect(result.redactionSummary.emails).toBe(2);
    });

    it('does not falsely redact technical terms with @ symbol (e.g. package versions)', () => {
      const codeText = 'Cài đặt thư viện: npm install @google/genai@2.29.1 và react@19';
      const result = redactPiiFromText(codeText);

      expect(result.sanitizedText).toBe(codeText);
      expect(result.redactionSummary.emails).toBe(0);
    });
  });

  // =========================================================================
  // 3. URLs and Social Profile Links
  // =========================================================================
  describe('3. URLs & Social Profile Masking (GitHub, LinkedIn, Portfolios)', () => {
    const validUrls = [
      'https://github.com/nguyenvan-a',
      'http://github.com/my-profile',
      'https://linkedin.com/in/nguyen-van-a-12345',
      'https://www.linkedin.com/in/candidate',
      'https://nguyenvana.dev',
      'http://myportfolio.io/resume',
      'https://tuan-cv.vercel.app',
      'github.com/coder-fresher',
      'linkedin.com/in/developer-vn',
      'https://gitlab.com/dev_team',
      'https://behance.net/design_portfolio',
    ];

    it.each(validUrls)('masks URL to [Link ẩn danh]: %s', (url) => {
      const masked = maskUrl(url);
      expect(masked).toBe('[Link ẩn danh]');
    });

    it('redacts URLs embedded inside markdown and plain text', () => {
      const text = 'Xem sản phẩm demo tại https://my-app.vercel.app hoặc mã nguồn https://github.com/demo/repo';
      const result = redactPiiFromText(text);

      expect(result.sanitizedText).not.toContain('https://my-app.vercel.app');
      expect(result.sanitizedText).not.toContain('https://github.com/demo/repo');
      expect(result.sanitizedText).toContain('[Link ẩn danh]');
      expect(result.redactionSummary.urls).toBe(2);
    });

    it('does not mask standard file extensions or library names in sentences', () => {
      const text = 'Tôi có kinh nghiệm xuất tệp định dạng resume.pdf và xây dựng web với Next.js.';
      const result = redactPiiFromText(text);

      expect(result.sanitizedText).toBe(text);
      expect(result.redactionSummary.urls).toBe(0);
    });
  });

  // =========================================================================
  // 4. Candidate Names & Complex Mixed CV Paragraphs
  // =========================================================================
  describe('4. Candidate Names & Mixed CV Paragraph Redaction', () => {
    it('masks Vietnamese names with explicit key prefixes', () => {
      const cases = [
        { text: 'Họ và tên: Nguyễn Văn An', expectedSnippet: 'Họ và tên: [Họ tên ẩn danh]' },
        { text: 'Họ tên: Trần Thị Thu Trang', expectedSnippet: 'Họ tên: [Họ tên ẩn danh]' },
        { text: 'Ứng viên: Lê Hoàng Nam', expectedSnippet: 'Ứng viên: [Họ tên ẩn danh]' },
        { text: 'Full Name: Pham Minh Tuan', expectedSnippet: 'Full Name: [Họ tên ẩn danh]' },
        { text: 'Candidate: Đỗ Hải Đăng', expectedSnippet: 'Candidate: [Họ tên ẩn danh]' },
      ];

      for (const c of cases) {
        const result = redactPiiFromText(c.text);
        expect(result.sanitizedText).toContain(c.expectedSnippet);
        expect(result.redactionSummary.names).toBeGreaterThanOrEqual(1);
      }
    });

    it('redacts a realistic, complex mixed CV header with 100% PII isolation', () => {
      const cvHeader = `
        NGUYỄN VĂN AN
        Họ và tên: Nguyễn Văn An
        Vị trí ứng tuyển: Frontend Developer (Fresher)
        Email: nguyen.van.an@gmail.com | SĐT: +84 912 345 678
        Địa chỉ: Cầu Giấy, Hà Nội
        Portfolio: https://annguyen.dev | GitHub: https://github.com/annguyen
        
        TÓM TẮT MỤC TIÊU:
        Sinh viên năm cuối Đại học Bách Khoa Hà Nội, chuyên ngành Công nghệ Thông tin (GPA: 3.4/4.0).
        Thành thạo React 19, Next.js App Router, TypeScript và Tailwind CSS.
        
        KINH NGHIỆM DỰ ÁN:
        1. Website Thương Mại Điện Tử (06/2025 - 12/2025)
        - Đảm nhận thiết kế responsive UI và tích hợp API thanh toán VNPay.
        - Tối ưu hóa điểm số Core Web Vitals đạt 95+, giảm thời gian tải trang 40%.
        - Phục vụ lưu lượng truy cập hơn 20.000 lượt xem/ngày.
      `.trim();

      const result = redactPiiFromText(cvHeader);

      // 1. Verify all sensitive PII is wiped
      expect(result.sanitizedText).not.toContain('0912 345 678');
      expect(result.sanitizedText).not.toContain('nguyen.van.an@gmail.com');
      expect(result.sanitizedText).not.toContain('https://annguyen.dev');
      expect(result.sanitizedText).not.toContain('https://github.com/annguyen');
      expect(result.sanitizedText).not.toContain('Họ và tên: Nguyễn Văn An');

      // 2. Verify all professional skills, metrics, and text remain 100% intact
      expect(result.sanitizedText).toContain('Frontend Developer (Fresher)');
      expect(result.sanitizedText).toContain('React 19, Next.js App Router, TypeScript và Tailwind CSS');
      expect(result.sanitizedText).toContain('Core Web Vitals đạt 95+');
      expect(result.sanitizedText).toContain('giảm thời gian tải trang 40%');
      expect(result.sanitizedText).toContain('hơn 20.000 lượt xem/ngày');

      // 3. Verify counts
      expect(result.redactedCount).toBeGreaterThanOrEqual(4);
      expect(result.redactionSummary.phones).toBe(1);
      expect(result.redactionSummary.emails).toBe(1);
      expect(result.redactionSummary.urls).toBe(2);
    });

    it('returns empty result when input text is empty or blank', () => {
      const result = redactPiiFromText('');
      expect(result.sanitizedText).toBe('');
      expect(result.redactedCount).toBe(0);
      expect(result.redactionSummary).toEqual({
        phones: 0,
        emails: 0,
        urls: 0,
        names: 0,
      });
    });
  });
});
