import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PrivacyPolicyPage from '@/app/privacy/page';

describe('/privacy Page Component (Milestone 7 / Requirement R1)', () => {
  it('renders page title and subtitle', () => {
    render(React.createElement(PrivacyPolicyPage));

    expect(
      screen.getByRole('heading', {
        name: /chính sách quyền riêng tư & bảo mật dữ liệu/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText(/minh bạch & quyền riêng tư trung thực/i)
    ).toBeInTheDocument();
  });

  it('renders all 6 required core privacy sections', () => {
    render(React.createElement(PrivacyPolicyPage));

    // Section 1: Zero Database Retention
    expect(
      screen.getByRole('heading', {
        name: /1\. nguyên tắc cốt lõi: zero database retention/i,
      })
    ).toBeInTheDocument();

    // Section 2: Google Gemini API Transmission & Encryption
    expect(
      screen.getByRole('heading', {
        name: /2\. dữ liệu xử lý và cơ chế truyền tới google gemini api qua giao thức mã hóa https/i,
      })
    ).toBeInTheDocument();

    // Section 3: Client-side PII Masker
    expect(
      screen.getByRole('heading', {
        name: /3\. bộ lọc pii client-side: khử khuẩn dữ liệu trước khi gửi lên máy chủ/i,
      })
    ).toBeInTheDocument();

    // Section 4: 1-Click Wipe Data & User Autonomy
    expect(
      screen.getByRole('heading', {
        name: /4\. quyền tự chủ của người dùng: 1-click wipe data & kiểm tra văn bản trước khi gửi/i,
      })
    ).toBeInTheDocument();

    // Section 5: LocalStorage & Rate Limiting Cookies
    expect(
      screen.getByRole('heading', {
        name: /5\. lưu trữ cục bộ \(localstorage\/sessionstorage\) và cookies xác thực hạn mức/i,
      })
    ).toBeInTheDocument();

    // Section 6: Honest Commitment & Contact
    expect(
      screen.getByRole('heading', {
        name: /6\. cam kết trung thực & liên hệ minh bạch/i,
      })
    ).toBeInTheDocument();
  });

  it('explicitly mentions Google Gemini Flash API terms and SSL/TLS encryption', () => {
    render(React.createElement(PrivacyPolicyPage));

    expect(screen.getAllByText(/google gemini/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/https/i).length).toBeGreaterThan(0);
  });

  it('renders WipeDataButton and contact email', () => {
    render(React.createElement(PrivacyPolicyPage));

    expect(screen.getByRole('button', { name: /xóa sạch dữ liệu trình duyệt/i })).toBeInTheDocument();
    expect(screen.getByText(/privacy@airoastcv\.vn/i)).toBeInTheDocument();
  });
});
