import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Footer from '@/components/landing/Footer';
import FeatureChooser from '@/components/landing/FeatureChooser';
import { DualPortalCards } from '@/components/landing/DualPortalCards';
import { FaqSection } from '@/components/landing/FaqSection';
import { RoleChooser } from '@/components/interview/RoleChooser';
import { ALL_RUBRIC_CRITERIA_NAMES, RUBRIC_CRITERIA_NAMES, JOB_MATCH_FIT_CRITERION_NAME } from '@/lib/schemas/interview';

describe('R5: Rubric Unification to 5 Criteria across UI Components', () => {
  it('1. Footer renders "Tiêu chuẩn Rubric 5 tiêu chí" and clean heart attribution', () => {
    const { container } = render(React.createElement(Footer));
    expect(screen.getByText('Tiêu chuẩn Rubric 5 tiêu chí')).toBeInTheDocument();
    expect(container.textContent).not.toContain('Rubric 4 tiêu chí');
    expect(container.textContent).toContain('Phát triển với ❤️ vì thế hệ trẻ Việt Nam');
  });

  it('2. FeatureChooser renders "Chấm điểm Rubric 5 tiêu chí công khai"', () => {
    const { container } = render(React.createElement(FeatureChooser));
    expect(
      screen.getByText(/Chấm điểm Rubric 5 tiêu chí công khai kèm nhận xét chi tiết/i)
    ).toBeInTheDocument();
    expect(container.textContent).not.toContain('Rubric 4 tiêu chí');
  });

  it('3. DualPortalCards renders "Rubric 5 tiêu chí" in both checklist and stress card description', () => {
    const { container } = render(React.createElement(DualPortalCards));
    expect(
      screen.getByText(/Chấm điểm theo Rubric 5 tiêu chí công khai kèm nhận xét sâu sắc/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/đếm ngược thời gian và chấm điểm Rubric 5 tiêu chí/i)
    ).toBeInTheDocument();
    expect(container.textContent).not.toContain('Rubric 4 tiêu chí');
  });

  it('4. FaqSection details all 5 standardized criteria under interview question', () => {
    const { container } = render(React.createElement(FaqSection));

    // Open interview accordion
    const trigger = screen.getByRole('button', { name: /tính năng phỏng vấn áp lực/i });
    fireEvent.click(trigger);

    const answer = screen.getByText(/chấm điểm chi tiết theo Rubric 5 tiêu chí công khai/i);
    expect(answer).toBeInTheDocument();
    expect(answer.textContent).toContain('Cấu trúc STAR / mạch lạc');
    expect(answer.textContent).toContain('Tính cụ thể & dẫn chứng cá nhân');
    expect(answer.textContent).toContain('Mức độ liên quan & đúng trọng tâm');
    expect(answer.textContent).toContain('Nhận thức hệ quả & tư duy xử lý vấn đề');
    expect(answer.textContent).toContain('Độ phù hợp vai trò / JD mục tiêu (Job Match Fit)');
    expect(container.textContent).not.toContain('Rubric 4 tiêu chí');
  });

  it('5. RoleChooser displays 5 criteria badge and lists all 5 standardized criteria', () => {
    const mockOnSelectRole = vi.fn();
    const mockOnSelectCustomJd = vi.fn();

    const { container } = render(
      React.createElement(RoleChooser, {
        onSelectRole: mockOnSelectRole,
        onSelectCustomJd: mockOnSelectCustomJd,
      })
    );

    expect(container.textContent).toContain('STAR, dẫn chứng cụ thể, mức độ liên quan, nhận thức hệ quả, và độ phù hợp yêu cầu JD (Job Match Fit)');
    expect(container.textContent).not.toContain('Rubric 4 tiêu chí');
  });

  it('6. Schema contract verifies exactly 5 criteria in ALL_RUBRIC_CRITERIA_NAMES', () => {
    expect(ALL_RUBRIC_CRITERIA_NAMES).toHaveLength(5);
    expect(RUBRIC_CRITERIA_NAMES).toHaveLength(4);
    expect(ALL_RUBRIC_CRITERIA_NAMES).toContain(JOB_MATCH_FIT_CRITERION_NAME);
  });
});
