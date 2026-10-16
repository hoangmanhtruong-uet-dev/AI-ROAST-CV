import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DiffSlider, { DIFF_PRESETS } from '@/components/landing/DiffSlider';
import { soundEngine } from '@/lib/audio/sound-engine';

describe('Interactive Diff Slider Component (Milestone 4)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    soundEngine.resetForTesting();
  });

  it('renders slider element with initial percentage and required badges', () => {
    render(React.createElement(DiffSlider));

    const slider = screen.getByRole('slider', {
      name: /thanh trượt so sánh cv trước và sau/i,
    });
    expect(slider).toBeInTheDocument();
    expect(slider.getAttribute('aria-valuenow')).toBe('50');

    expect(screen.getByText(/bị loại vòng gửi xe/i)).toBeInTheDocument();
    expect(screen.getByText(/qua ải ats 98\/100/i)).toBeInTheDocument();
    expect(screen.getByText(/chủ trì kiến trúc/i)).toBeInTheDocument();
  });

  it('renders all 4 role preset buttons', () => {
    render(React.createElement(DiffSlider));

    expect(screen.getByRole('button', { name: /backend \/ software engineer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /frontend \/ web developer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /marketing \/ growth specialist/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /data analyst \/ bi/i })).toBeInTheDocument();
  });

  it('navigates slider position via keyboard arrows, home, end, and plays blip sound', async () => {
    const playBlipSpy = vi.spyOn(soundEngine, 'playBlip');
    render(React.createElement(DiffSlider));

    const slider = screen.getByRole('slider');

    // ArrowLeft: 50 -> 45
    fireEvent.keyDown(slider, { key: 'ArrowLeft' });
    expect(slider.getAttribute('aria-valuenow')).toBe('45');
    expect(playBlipSpy).toHaveBeenCalled();

    // ArrowRight: 45 -> 50
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(slider.getAttribute('aria-valuenow')).toBe('50');

    // Home: snaps to 5
    fireEvent.keyDown(slider, { key: 'Home' });
    expect(slider.getAttribute('aria-valuenow')).toBe('5');

    // End: snaps to 95
    fireEvent.keyDown(slider, { key: 'End' });
    expect(slider.getAttribute('aria-valuenow')).toBe('95');

    // PageUp: snaps to 80 (95 - 15)
    fireEvent.keyDown(slider, { key: 'PageUp' });
    expect(slider.getAttribute('aria-valuenow')).toBe('80');

    // PageDown: snaps to 95 (80 + 15)
    fireEvent.keyDown(slider, { key: 'PageDown' });
    expect(slider.getAttribute('aria-valuenow')).toBe('95');
  });

  it('switches preset when role buttons are clicked and triggers audio', async () => {
    const user = userEvent.setup();
    const playBlipSpy = vi.spyOn(soundEngine, 'playBlip');
    render(React.createElement(DiffSlider));

    const frontendBtn = screen.getByRole('button', { name: /frontend \/ web developer/i });
    await user.click(frontendBtn);

    expect(playBlipSpy).toHaveBeenCalled();
    expect(screen.getByText(/Làm việc trong team frontend/i)).toBeInTheDocument();
    expect(screen.getByText(/toàn bộ UI Component Library/i)).toBeInTheDocument();
    expect(screen.getByText(/3.2x Performance/i)).toBeInTheDocument();

    const marketingBtn = screen.getByRole('button', { name: /marketing \/ growth specialist/i });
    await user.click(marketingBtn);
    expect(screen.getByText(/Phụ trách chạy quảng cáo Facebook Ads/i)).toBeInTheDocument();
    expect(screen.getByText(/chiến dịch Performance Marketing/i)).toBeInTheDocument();

    const dataBtn = screen.getByRole('button', { name: /data analyst \/ bi/i });
    await user.click(dataBtn);
    expect(screen.getByText(/Hỗ trợ tổng hợp dữ liệu doanh số/i)).toBeInTheDocument();
    expect(screen.getByText(/luồng trích xuất dữ liệu ETL/i)).toBeInTheDocument();
  });

  it('handles pointer down, pointer move, and pointer up drag lifecycle', () => {
    const playBlipSpy = vi.spyOn(soundEngine, 'playBlip');
    const { container } = render(React.createElement(DiffSlider));

    const sliderBox = container.querySelector('.cursor-ew-resize');
    expect(sliderBox).toBeInTheDocument();

    // Mock getBoundingClientRect
    vi.spyOn(sliderBox!, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      width: 1000,
      top: 0,
      bottom: 400,
      height: 400,
      right: 1100,
      x: 100,
      y: 0,
      toJSON: () => {},
    });

    // Pointer down at x=600 -> (600 - 100)/1000 = 50%
    fireEvent.pointerDown(sliderBox!, { clientX: 600, pointerId: 1 });
    expect(playBlipSpy).toHaveBeenCalled();

    // Pointer move to x=300 -> (300 - 100)/1000 = 20%
    fireEvent.pointerMove(sliderBox!, { clientX: 300, pointerId: 1 });

    const slider = screen.getByRole('slider');
    expect(slider.getAttribute('aria-valuenow')).toBe('20');

    // Pointer up
    fireEvent.pointerUp(sliderBox!, { clientX: 300, pointerId: 1 });
  });
});
