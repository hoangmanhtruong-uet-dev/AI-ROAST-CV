import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DualPortalCards from '@/components/landing/DualPortalCards';
import { soundEngine } from '@/lib/audio/sound-engine';

describe('Dual 3D Tilt Portal Cards Component (Milestone 4)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    soundEngine.resetForTesting();
  });

  it('renders both portal cards with required feature titles and badges', () => {
    render(React.createElement(DualPortalCards));

    expect(screen.getByText(/Roast CV Siêu Cay/i)).toBeInTheDocument();
    expect(screen.getByText(/Phỏng Vấn Áp Lực \(Stress Interview\)/i)).toBeInTheDocument();
    expect(screen.getByText(/🔥 Miễn phí 1 trang/i)).toBeInTheDocument();
    expect(screen.getByText(/⏱️ Thử thách bản lĩnh/i)).toBeInTheDocument();
  });

  it('preserves strict navigation link targets and regex invariants', () => {
    render(React.createElement(DualPortalCards));

    const roastLink = screen.getByRole('link', { name: /bắt đầu roast cv ngay/i });
    expect(roastLink).toBeInTheDocument();
    expect(roastLink.getAttribute('href')).toBe('/roast');
    expect(roastLink.textContent).toMatch(/roast cv/i);

    const interviewLink = screen.getByRole('link', { name: /vào phỏng vấn áp lực ngay/i });
    expect(interviewLink).toBeInTheDocument();
    expect(interviewLink.getAttribute('href')).toBe('/interview');
    expect(interviewLink.textContent).toMatch(/phỏng vấn áp lực|thử thách phỏng vấn/i);
  });

  it('triggers soundEngine.playFlame() on Roast CTA click and calls callback', () => {
    const playFlameSpy = vi.spyOn(soundEngine, 'playFlame');
    const onRoastClick = vi.fn();
    render(React.createElement(DualPortalCards, { onRoastClick }));

    const roastLink = screen.getByRole('link', { name: /bắt đầu roast cv ngay/i });
    fireEvent.click(roastLink);

    expect(playFlameSpy).toHaveBeenCalled();
    expect(onRoastClick).toHaveBeenCalled();
  });

  it('triggers soundEngine.playLaser() on Interview CTA click and calls callback', () => {
    const playLaserSpy = vi.spyOn(soundEngine, 'playLaser');
    const onInterviewClick = vi.fn();
    render(React.createElement(DualPortalCards, { onInterviewClick }));

    const interviewLink = screen.getByRole('link', { name: /vào phỏng vấn áp lực ngay/i });
    fireEvent.click(interviewLink);

    expect(playLaserSpy).toHaveBeenCalled();
    expect(onInterviewClick).toHaveBeenCalled();
  });

  it('switches spice tone preview on button click and plays blip sound', async () => {
    const user = userEvent.setup();
    const playBlipSpy = vi.spyOn(soundEngine, 'playBlip');
    render(React.createElement(DualPortalCards));

    const expertBtn = screen.getByRole('button', { name: /chuyên gia/i });
    await user.click(expertBtn);

    expect(playBlipSpy).toHaveBeenCalled();
    expect(screen.getByText(/cụ thể hóa bằng các dự án số liệu/i)).toBeInTheDocument();

    const spicyBtn = screen.getByRole('button', { name: /mỏ hỗn/i });
    await user.click(spicyBtn);
    expect(screen.getByText(/khác gì khoe mình biết thở/i)).toBeInTheDocument();
  });

  it('triggers simulated heartbeat audio when countdown demo button is clicked', async () => {
    const user = userEvent.setup();
    const playHeartbeatSpy = vi.spyOn(soundEngine, 'playHeartbeat');
    render(React.createElement(DualPortalCards));

    const countdownBtn = screen.getByRole('button', { name: /thử đếm 3s/i });
    await user.click(countdownBtn);

    expect(playHeartbeatSpy).toHaveBeenCalled();
    expect(screen.getByText(/đang đo nhịp tim/i)).toBeInTheDocument();
  });

  it('safely handles mouse move and mouse leave for 3D tilt without JSDOM crash', () => {
    render(React.createElement(DualPortalCards));

    const roastCardContainer = screen.getByText(/Roast CV Siêu Cay/i).closest('.relative.rounded-2xl.group');
    expect(roastCardContainer).toBeInTheDocument();

    fireEvent.mouseMove(roastCardContainer!, { clientX: 100, clientY: 150 });
    fireEvent.mouseLeave(roastCardContainer!);
  });
});
