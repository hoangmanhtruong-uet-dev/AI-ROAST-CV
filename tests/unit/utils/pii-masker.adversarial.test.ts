import { describe, it, expect } from 'vitest';
import {
  maskPii,
  maskCVPII,
  previewPhone,
  previewEmail,
  previewId,
  previewUrl,
  VN_PHONE_REGEX,
  EMAIL_REGEX,
  CCCD_12_DIGIT_REGEX,
  ID_WITH_PREFIX_REGEX,
  FULL_URL_REGEX,
  PORTFOLIO_DOMAIN_REGEX,
} from '@/lib/utils/pii-masker';

describe('Adversarial PII Masker Stress Suite (Challenger M7.1)', () => {
  describe('Dimension 1: Vietnamese Phone Variations & Complex Permutations', () => {
    it('masks phone with international prefix +84 and leading 0: "+84 098 765 4321"', () => {
      const input = 'Số điện thoại: +84 098 765 4321 cần liên lạc gấp';
      const result = maskPii(input);

      expect(result.sanitizedText).toBe('Số điện thoại: [PHONE_REDACTED] cần liên lạc gấp');
      expect(result.stats.phones).toBe(1);
      expect(result.detectedItems[0].preview).toMatch(/\+84\*{4}\d{3}/);
    });

    it('masks phone with international parenthesis +84 (0): "+84 (0) 987 654 321"', () => {
      const input = 'Hotline: +84 (0) 987 654 321';
      const result = maskPii(input);

      expect(result.sanitizedText).toBe('Hotline: [PHONE_REDACTED]');
      expect(result.stats.phones).toBe(1);
    });

    it('masks phone with bracketed international code: "(+84) 912 345 678"', () => {
      const input = 'Call (+84) 912 345 678 for details';
      const result = maskPii(input);

      expect(result.sanitizedText).toBe('Call [PHONE_REDACTED] for details');
      expect(result.stats.phones).toBe(1);
    });

    it('masks raw country code 84 without plus: "84987654321" and "84 987 654 321"', () => {
      const input1 = 'Zalo: 84987654321';
      const res1 = maskPii(input1);
      expect(res1.sanitizedText).toBe('Zalo: [PHONE_REDACTED]');
      expect(res1.stats.phones).toBe(1);

      const input2 = 'Phone: 84 987 654 321';
      const res2 = maskPii(input2);
      expect(res2.sanitizedText).toBe('Phone: [PHONE_REDACTED]');
      expect(res2.stats.phones).toBe(1);
    });

    it('masks country code with dots: "84.987.654.321"', () => {
      const input = 'Liên hệ: 84.987.654.321 qua Zalo';
      const result = maskPii(input);

      expect(result.sanitizedText).toBe('Liên hệ: [PHONE_REDACTED] qua Zalo');
      expect(result.stats.phones).toBe(1);
    });

    it('masks double-zero international format: "0084987654321" and "0084 987 654 321"', () => {
      const input = 'Tel: 0084 987 654 321 hoặc 0084912345678';
      const result = maskPii(input);

      expect(result.sanitizedText).toBe('Tel: [PHONE_REDACTED] hoặc [PHONE_REDACTED]');
      expect(result.stats.phones).toBe(2);
    });

    it('masks all modern Vietnamese mobile operator prefixes (03x, 05x, 07x, 08x, 09x)', () => {
      const testCases = [
        { name: 'Viettel 038', phone: '0381234567' },
        { name: 'Viettel 086', phone: '0868123456' },
        { name: 'Viettel 098', phone: '0987654321' },
        { name: 'Vinaphone 081', phone: '0812345678' },
        { name: 'Vinaphone 088', phone: '0888123456' },
        { name: 'Vinaphone 091', phone: '0912345678' },
        { name: 'Mobifone 070', phone: '0701234567' },
        { name: 'Mobifone 079', phone: '0798765432' },
        { name: 'Mobifone 090', phone: '0903123456' },
        { name: 'Vietnamobile 056', phone: '0567123456' },
        { name: 'Vietnamobile 092', phone: '0922123456' },
        { name: 'Gmobile 099', phone: '0993123456' },
        { name: 'Gmobile 059', phone: '0598123456' },
        { name: 'Itelecom 087', phone: '0877123456' },
        { name: 'Wintel 055', phone: '0559123456' },
      ];

      for (const tc of testCases) {
        const text = `Ứng viên: Nguyễn Văn A. SĐT ${tc.name}: ${tc.phone} sẵn sàng phỏng vấn.`;
        const res = maskPii(text);
        expect(res.sanitizedText, `Failed on operator ${tc.name}`).toBe(
          'Ứng viên: Nguyễn Văn A. SĐT ' + tc.name + ': [PHONE_REDACTED] sẵn sàng phỏng vấn.'
        );
        expect(res.stats.phones).toBe(1);
      }
    });

    it('masks phone numbers with various separators (dashes, dots, spaces, mixed)', () => {
      const input = `
        1. 098-765-4321
        2. 098.765.4321
        3. 098 765 4321
        4. 098.765 4321
        5. +84-98-765-4321
      `;
      const result = maskPii(input);

      expect(result.sanitizedText).not.toContain('098-765-4321');
      expect(result.sanitizedText).not.toContain('098.765.4321');
      expect(result.sanitizedText).not.toContain('098 765 4321');
      expect(result.sanitizedText).not.toContain('098.765 4321');
      expect(result.sanitizedText).not.toContain('+84-98-765-4321');
      expect(result.stats.phones).toBe(5);
    });

    it('masks phone wrapped in punctuation, brackets or quotes', () => {
      const input = 'Liên hệ: [0987654321], "0912345678", (0398765432)!';
      const result = maskPii(input);

      expect(result.sanitizedText).toBe('Liên hệ: [[PHONE_REDACTED]], "[PHONE_REDACTED]", ([PHONE_REDACTED])!');
      expect(result.stats.phones).toBe(3);
    });

    it('does NOT mask shortcodes or customer service numbers that are not personal mobile numbers', () => {
      const input = 'Tổng đài hỗ trợ 1900 1000 hoặc 1800 1500 hoạt động 24/7.';
      const result = maskPii(input);

      expect(result.sanitizedText).toContain('1900 1000');
      expect(result.sanitizedText).toContain('1800 1500');
      expect(result.stats.phones).toBe(0);
    });
  });

  describe('Dimension 2: Varied & Complex Email Formats', () => {
    it('masks email with plus-tag addressing (sub-addressing)', () => {
      const input = 'CV gửi về: nguyen.van.a+roast-cv-2026@gmail.com để nhận review';
      const result = maskPii(input);

      expect(result.sanitizedText).toBe('CV gửi về: [EMAIL_REDACTED] để nhận review');
      expect(result.stats.emails).toBe(1);
      expect(result.detectedItems[0].preview).toBe('ngu***@gmail.com');
    });

    it('masks email with multi-tier subdomains and national TLDs (.edu.vn, .co.uk)', () => {
      const input = 'Contact: hoang.le@alumni.it.hust.edu.vn and dev@tech.firm.co.uk';
      const result = maskPii(input);

      expect(result.sanitizedText).toBe('Contact: [EMAIL_REDACTED] and [EMAIL_REDACTED]');
      expect(result.stats.emails).toBe(2);
    });

    it('masks uppercase and mixed-case emails', () => {
      const input = 'Email: NGUYEN_VAN_AN.TECH@OUTLOOK.COM.VN';
      const result = maskPii(input);

      expect(result.sanitizedText).toBe('Email: [EMAIL_REDACTED]');
      expect(result.stats.emails).toBe(1);
    });

    it('masks email enclosed in angle brackets or quotes', () => {
      const input = 'From: "John Doe" <john.doe.work@company.vn>';
      const result = maskPii(input);

      expect(result.sanitizedText).toBe('From: "John Doe" <[EMAIL_REDACTED]>');
      expect(result.stats.emails).toBe(1);
    });

    it('masks ultra-short local parts cleanly with previewEmail', () => {
      expect(previewEmail('x@domain.com')).toBe('x***@domain.com');
      expect(previewEmail('ab@domain.com')).toBe('ab***@domain.com');
      expect(previewEmail('abc@domain.com')).toBe('ab***@domain.com');
      expect(previewEmail('abcd@domain.com')).toBe('ab***@domain.com');
      expect(previewEmail('abcde@domain.com')).toBe('abc***@domain.com');
    });

    it('does NOT mask version tags or handles that lack domains: "@john_doe", "gemini@2.0"', () => {
      const input = 'Twitter handle: @johndoe, using gemini@2.0-flash model';
      const result = maskPii(input);

      expect(result.sanitizedText).toContain('@johndoe');
      expect(result.sanitizedText).toContain('gemini@2.0-flash');
      expect(result.stats.emails).toBe(0);
    });
  });

  describe('Dimension 3: 12-Digit CCCD (Leading Zeros & Provinces) and 9-Digit CMND', () => {
    it('masks standalone 12-digit CCCD with leading zeros (Hanoi 001, Ha Giang 002, Cao Bang 004)', () => {
      const hanoi = 'CCCD Hà Nội: 001099123456 (Nam 1999)';
      const resHanoi = maskPii(hanoi);
      expect(resHanoi.sanitizedText).toBe('CCCD Hà Nội: [ID_REDACTED] (Nam 1999)');
      expect(resHanoi.stats.ids).toBe(1);
      expect(resHanoi.detectedItems[0].preview).toBe('001099******');

      const hagiang = '002202000001 sinh tại Hà Giang';
      const resHaGiang = maskPii(hagiang);
      expect(resHaGiang.sanitizedText).toBe('[ID_REDACTED] sinh tại Hà Giang');
      expect(resHaGiang.stats.ids).toBe(1);
      expect(resHaGiang.detectedItems[0].preview).toBe('002202******');

      const caobang = 'Số 004301987654 (Nữ 2001)';
      const resCaoBang = maskPii(caobang);
      expect(resCaoBang.sanitizedText).toBe('Số [ID_REDACTED] (Nữ 2001)');
      expect(resCaoBang.stats.ids).toBe(1);
    });

    it('masks southernmost province CCCD: 096 (Ca Mau)', () => {
      const input = 'Công dân Cà Mau: 096200001234';
      const result = maskPii(input);

      expect(result.sanitizedText).toBe('Công dân Cà Mau: [ID_REDACTED]');
      expect(result.stats.ids).toBe(1);
      expect(result.detectedItems[0].preview).toBe('096200******');
    });

    it('masks century/gender digits 0, 1, 2, 3 for 20th and 21st centuries', () => {
      const input = `
        - Male 20th c (0): 001098123456
        - Female 20th c (1): 001198123456
        - Male 21st c (2): 001202123456
        - Female 21st c (3): 001302123456
      `;
      const result = maskPii(input);

      expect(result.sanitizedText).not.toContain('001098123456');
      expect(result.sanitizedText).not.toContain('001198123456');
      expect(result.sanitizedText).not.toContain('001202123456');
      expect(result.sanitizedText).not.toContain('001302123456');
      expect(result.stats.ids).toBe(4);
    });

    it('does NOT mask standalone 12-digit numbers that have invalid Vietnamese province codes (000, 097-999)', () => {
      const invalidProvince = 'Mã vận đơn: 000123456789 và serial: 097123456789 và 999123456789';
      const result = maskPii(invalidProvince);

      // Standalone numbers with province code 000 or >096 are not valid Vietnamese CCCDs
      expect(result.sanitizedText).toContain('000123456789');
      expect(result.sanitizedText).toContain('097123456789');
      expect(result.sanitizedText).toContain('999123456789');
      expect(result.stats.ids).toBe(0);
    });

    it('masks 9 to 12 digit IDs when preceded by explicit identity labels even if non-standard', () => {
      const testCases = [
        'CCCD: 999123456789',
        'CMND: 023456789',
        'Căn cước công dân số: 001202012345',
        'Số định danh: 079201012345',
        'ID Card - 123456789',
        'Số CMND: 123456789',
      ];

      for (const tc of testCases) {
        const res = maskPii(tc);
        expect(res.sanitizedText).toContain('[ID_REDACTED]');
        expect(res.stats.ids).toBe(1);
      }
    });

    it('formats 9-digit CMND preview correctly with previewId', () => {
      expect(previewId('123456789')).toBe('123****789');
      expect(previewId('023456789')).toBe('023****789');
      expect(previewId('001099123456')).toBe('001099******');
    });
  });

  describe('Dimension 4: URL & Portfolio Permutations', () => {
    it('masks full HTTPS and HTTP URLs with path, query params, and anchors', () => {
      const input = `
        - https://github.com/my-profile/project?query=1&sort=desc#readme
        - http://my-portfolio.com/cv.pdf
      `;
      const result = maskPii(input);

      expect(result.sanitizedText).not.toContain('https://github.com');
      expect(result.sanitizedText).not.toContain('http://my-portfolio.com');
      expect(result.sanitizedText).toContain('[URL_REDACTED]');
      expect(result.stats.urls).toBe(2);
    });

    it('masks naked portfolio links (github.com, linkedin.com, behance.com, vercel.app, dev)', () => {
      const input = `
        GitHub: github.com/username
        LinkedIn: linkedin.com/in/username-dev
        Behance: behance.com/designer
        Demo: my-awesome-app.vercel.app
        Blog: dev-portfolio.github.io
        Profile: candidate.dev
        Web: www.candidate-cv.vn
      `;
      const result = maskPii(input);

      expect(result.sanitizedText).not.toContain('github.com/username');
      expect(result.sanitizedText).not.toContain('linkedin.com/in/username-dev');
      expect(result.sanitizedText).not.toContain('behance.com/designer');
      expect(result.sanitizedText).not.toContain('my-awesome-app.vercel.app');
      expect(result.sanitizedText).not.toContain('dev-portfolio.github.io');
      expect(result.sanitizedText).not.toContain('candidate.dev');
      expect(result.sanitizedText).not.toContain('www.candidate-cv.vn');
      expect(result.stats.urls).toBe(7);
    });

    it('preserves surrounding sentence punctuation when URL is at end of sentence or in parentheses', () => {
      const input = 'Xem dự án tại (https://github.com/dev/repo).';
      const result = maskPii(input);

      expect(result.sanitizedText).toBe('Xem dự án tại ([URL_REDACTED]).');
      expect(result.stats.urls).toBe(1);
    });
  });

  describe('Dimension 5: Technical Metrics Preservation (Zero False Positives)', () => {
    it('NEVER falsely masks date ranges: "2021-2025", "2022 - 2026", "05/2020 - 11/2024"', () => {
      const input = `
        Học vấn:
        - Đại học Bách Khoa Hà Nội (2021-2025)
        - Thực tập sinh tại CMC Global (06/2023 - 12/2023)
        - Niên khóa 2020 - 2024
      `;
      const result = maskPii(input);

      expect(result.sanitizedText).toContain('2021-2025');
      expect(result.sanitizedText).toContain('06/2023 - 12/2023');
      expect(result.sanitizedText).toContain('2020 - 2024');
      expect(result.stats.total).toBe(0);
    });

    it('NEVER falsely masks GPA, scores, and academic benchmarks: "GPA 3.8/4.0", "95/100", "850/990"', () => {
      const input = `
        Thành tích:
        - GPA 3.8/4.0 (Top 5% khoa CNTT)
        - GPA: 3.9/4.0
        - Điểm rèn luyện: 95/100
        - Chứng chỉ TOEIC: 850/990
        - Chứng chỉ IELTS: 7.5
      `;
      const result = maskPii(input);

      expect(result.sanitizedText).toContain('GPA 3.8/4.0');
      expect(result.sanitizedText).toContain('GPA: 3.9/4.0');
      expect(result.sanitizedText).toContain('95/100');
      expect(result.sanitizedText).toContain('850/990');
      expect(result.sanitizedText).toContain('IELTS: 7.5');
      expect(result.stats.total).toBe(0);
    });

    it('NEVER falsely masks percentages and optimization gains: "45%", "+120%", "99.99% SLA"', () => {
      const input = `
        Kết quả:
        - Tăng tốc độ load trang lên 45%.
        - Tăng trưởng người dùng đạt +120% QoQ.
        - Giảm tỷ lệ lỗi crash xuống còn 0.05%.
        - Duy trì hệ thống đạt 99.99% SLA.
      `;
      const result = maskPii(input);

      expect(result.sanitizedText).toContain('45%');
      expect(result.sanitizedText).toContain('+120%');
      expect(result.sanitizedText).toContain('0.05%');
      expect(result.sanitizedText).toContain('99.99% SLA');
      expect(result.stats.total).toBe(0);
    });

    it('NEVER falsely masks currency and monetary amounts: "20.000.000 VNĐ", "15.000.000 đ", "50.000 USD", "84.000.000 VNĐ"', () => {
      const input = `
        Ngân sách & Doanh thu:
        - Tiết kiệm 20.000.000 VNĐ ngân sách server mỗi quý.
        - Quản lý quỹ dự án 15.000.000 đ.
        - Hợp đồng khách hàng trị giá 50.000 USD.
        - Đạt doanh thu 84.000.000 VNĐ cho công ty trong chiến dịch Tết.
      `;
      const result = maskPii(input);

      expect(result.sanitizedText).toContain('20.000.000 VNĐ');
      expect(result.sanitizedText).toContain('15.000.000 đ');
      expect(result.sanitizedText).toContain('50.000 USD');
      expect(result.sanitizedText).toContain('84.000.000 VNĐ');
      expect(result.stats.total).toBe(0);
    });

    it('NEVER falsely masks technical latencies, frequencies, and capacities: "150ms", "500ms", "60 FPS", "16 GB RAM"', () => {
      const input = `
        Hiệu năng:
        - Giảm thời gian phản hồi API từ 500ms xuống còn 150ms.
        - Tối ưu rendering Three.js duy trì ổn định 60 FPS.
        - Cấu hình server 8 vCPU, 16 GB RAM, 250 GB NVMe SSD.
        - Xử lý 10.000 RPS đồng thời với Redis cluster.
      `;
      const result = maskPii(input);

      expect(result.sanitizedText).toContain('500ms');
      expect(result.sanitizedText).toContain('150ms');
      expect(result.sanitizedText).toContain('60 FPS');
      expect(result.sanitizedText).toContain('16 GB RAM');
      expect(result.sanitizedText).toContain('10.000 RPS');
      expect(result.stats.total).toBe(0);
    });

    it('NEVER falsely masks tech stack versions: "Next.js 15.1.0", "React 19.0.0", "Python 3.11"', () => {
      const input = 'Công nghệ sử dụng: Next.js 15.1.0, React 19.0.0, Node.js 20.10.0, Python 3.11.';
      const result = maskPii(input);

      expect(result.sanitizedText).toContain('Next.js 15.1.0');
      expect(result.sanitizedText).toContain('React 19.0.0');
      expect(result.sanitizedText).toContain('Node.js 20.10.0');
      expect(result.sanitizedText).toContain('Python 3.11');
      expect(result.stats.total).toBe(0);
    });
  });

  describe('Dimension 6: Mixed & Adversarial Multi-PII CV Text', () => {
    it('accurately masks all PII in a dense, adversarial CV paragraph while preserving all achievements', () => {
      const complexCv = `
        ỨNG VIÊN: NGUYỄN VĂN BÌNH
        Thông tin liên lạc:
        - Email: binh.nv+portfolio@tech.hust.edu.vn
        - Mobile: +84 098 765 4321 hoặc 84.912.345.678
        - Số định danh CCCD: 001202099999 (Hà Nội, Nam, sinh năm 2002)
        - CMND: 012345678
        - Hồ sơ: https://github.com/binh-dev-2026?tab=repositories và linkedin.com/in/binh-nv

        TÓM TẮT KINH NGHIỆM:
        - Tốt nghiệp Đại học Bách Khoa (2020-2024) chuyên ngành CNTT với GPA 3.85/4.0.
        - Đạt TOEIC 865/990 và IELTS 7.0.
        - Phát triển hệ thống microservices xử lý 50.000 req/s, giảm API latency từ 600ms xuống 150ms.
        - Tiết kiệm 45.000.000 VNĐ chi phí hạ tầng cloud (tương đương giảm 35% chi phí hàng tháng).
        - Đạt giải Nhì Hackathon Tech 2023 với dự án AI nhận diện hình ảnh đạt độ chính xác 98.5%.
      `;

      const result = maskPii(complexCv);

      // PII must be completely sanitized
      expect(result.sanitizedText).not.toContain('binh.nv+portfolio@tech.hust.edu.vn');
      expect(result.sanitizedText).not.toContain('+84 098 765 4321');
      expect(result.sanitizedText).not.toContain('84.912.345.678');
      expect(result.sanitizedText).not.toContain('001202099999');
      expect(result.sanitizedText).not.toContain('012345678');
      expect(result.sanitizedText).not.toContain('https://github.com/binh-dev-2026');
      expect(result.sanitizedText).not.toContain('linkedin.com/in/binh-nv');

      // Tokens must be in place
      expect(result.sanitizedText).toContain('[EMAIL_REDACTED]');
      expect(result.sanitizedText).toContain('[PHONE_REDACTED]');
      expect(result.sanitizedText).toContain('[ID_REDACTED]');
      expect(result.sanitizedText).toContain('[URL_REDACTED]');

      // Metrics and technical achievements must remain 100% intact
      expect(result.sanitizedText).toContain('2020-2024');
      expect(result.sanitizedText).toContain('GPA 3.85/4.0');
      expect(result.sanitizedText).toContain('TOEIC 865/990');
      expect(result.sanitizedText).toContain('IELTS 7.0');
      expect(result.sanitizedText).toContain('50.000 req/s');
      expect(result.sanitizedText).toContain('600ms');
      expect(result.sanitizedText).toContain('150ms');
      expect(result.sanitizedText).toContain('45.000.000 VNĐ');
      expect(result.sanitizedText).toContain('35%');
      expect(result.sanitizedText).toContain('98.5%');

      // Exact count verification
      expect(result.stats.emails).toBe(1);
      expect(result.stats.phones).toBe(2);
      expect(result.stats.ids).toBe(2);
      expect(result.stats.urls).toBe(2);
      expect(result.stats.total).toBe(7);
    });
  });

  describe('Dimension 7: Adversarial Edge Cases & Vulnerability Probing (Empirical Verification)', () => {
    it('correctly masks emails containing portfolio domains as [EMAIL_REDACTED] without leaking username', () => {
      // In maskPii, EMAIL_REGEX executes BEFORE PORTFOLIO_DOMAIN_REGEX, with (?<!@) negative lookbehind.
      // When an email uses a domain matching portfolio domains (github.com, *.dev, *.vercel.app),
      // the whole email is sanitized as [EMAIL_REDACTED], preventing plain-text username leakage.
      const input = 'Email me at john.doe@github.com or alice.smith@frontend.dev';
      const result = maskPii(input);

      expect(result.sanitizedText).toBe('Email me at [EMAIL_REDACTED] or [EMAIL_REDACTED]');
      expect(result.sanitizedText).not.toContain('john.doe');
      expect(result.sanitizedText).not.toContain('alice.smith');
      expect(result.stats.emails).toBe(2);
      expect(result.stats.urls).toBe(0);
    });

    it('demonstrates edge case: parenthesized (84) without plus is not masked due to unmatched closing parenthesis', () => {
      // VN_PHONE_REGEX has \(\+84\) but not \(84\)
      const phoneNoPlus = '(84) 987654321';
      const result = maskPii(phoneNoPlus);

      // (84) 987654321 remains unmasked
      expect(result.sanitizedText).toBe('(84) 987654321');
      expect(result.stats.phones).toBe(0);

      // Whereas (+84) 987654321 is masked
      const phoneWithPlus = '(+84) 987654321';
      expect(maskPii(phoneWithPlus).sanitizedText).toBe('[PHONE_REDACTED]');
    });

    it('correctly masks 9-digit CMND with intervening descriptor word like "cũ" or "(cũ)"', () => {
      // ID_WITH_PREFIX_REGEX accepts modifiers (cũ, mới, gốc, tạm, etc.) between prefix and digits.
      const input = 'CMND cũ: 012345678';
      const result = maskPii(input);

      expect(result.sanitizedText).toBe('CMND cũ: [ID_REDACTED]');
      expect(result.sanitizedText).not.toContain('012345678');
      expect(result.stats.ids).toBe(1);

      // Parenthesized modifier
      expect(maskPii('CMND (cũ): 012345678').sanitizedText).toBe('CMND (cũ): [ID_REDACTED]');

      // Standard prefix
      expect(maskPii('CMND: 012345678').sanitizedText).toBe('CMND: [ID_REDACTED]');
    });
  });
});
