import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CvHallOfShame, { HALL_OF_SHAME_ITEMS } from '@/components/landing/CvHallOfShame';
import { soundEngine } from '@/lib/audio/sound-engine';

describe('CV Hall of Shame Ticker Marquee Component (Milestone 4)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    soundEngine.resetForTesting();
  });

  it('renders section landmark, heading and initial shame cards', () => {
    render(React.createElement(CvHallOfShame));

    const region = screen.getByRole('region', {
      name: /CV Hall of Shame - Những câu chém gió kinh điển/i,
    });
    expect(region).toBeInTheDocument();

    expect(screen.getByText(/CV Hall of Shame/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Trưởng ban nhậu kiêm tổ chức sự kiện/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Kinh nghiệm 10 năm sử dụng và prompt ChatGPT/i).length).toBeGreaterThan(0);
  });

  it('verifies all curated shame items contain quote, penalty chip, and sarcastic roast', () => {
    expect(HALL_OF_SHAME_ITEMS.length).toBeGreaterThanOrEqual(12);
    for (const item of HALL_OF_SHAME_ITEMS) {
      expect(item.quote.length).toBeGreaterThan(10);
      expect(item.penaltyChip.length).toBeGreaterThan(0);
      expect(item.roastComment.length).toBeGreaterThan(15);
      expect(item.penaltyScore.length).toBeGreaterThan(0);
    }
  });

  it('toggles pause state on play/pause control button click and triggers sound', async () => {
    const user = userEvent.setup();
    const playBlipSpy = vi.spyOn(soundEngine, 'playBlip');
    render(React.createElement(CvHallOfShame));

    const pauseBtn = screen.getByRole('button', { name: /tạm dừng cuộn ticker/i });
    expect(pauseBtn).toBeInTheDocument();

    await user.click(pauseBtn);
    expect(playBlipSpy).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /tiếp tục cuộn ticker/i })).toBeInTheDocument();

    const resumeBtn = screen.getByRole('button', { name: /tiếp tục cuộn ticker/i });
    await user.click(resumeBtn);
    expect(screen.getByRole('button', { name: /tạm dừng cuộn ticker/i })).toBeInTheDocument();
  });

  it('triggers sound blip when a shame card is clicked or activated via keyboard', async () => {
    const playBlipSpy = vi.spyOn(soundEngine, 'playBlip');
    render(React.createElement(CvHallOfShame));

    const cards = screen.getAllByRole('article');
    expect(cards.length).toBeGreaterThan(0);
    fireEvent.click(cards[0]);

    expect(playBlipSpy).toHaveBeenCalled();

    // Test Enter key activation
    fireEvent.keyDown(cards[1], { key: 'Enter' });
    expect(playBlipSpy).toHaveBeenCalledTimes(2);

    // Test Space key activation
    fireEvent.keyDown(cards[2], { key: ' ' });
    expect(playBlipSpy).toHaveBeenCalledTimes(3);
  });

  it('handles mouse hover and touch events to pause/resume marquee', () => {
    const { container } = render(React.createElement(CvHallOfShame));
    const marqueeContainer = container.querySelector('.group');
    expect(marqueeContainer).toBeInTheDocument();

    fireEvent.mouseEnter(marqueeContainer!);
    fireEvent.mouseLeave(marqueeContainer!);
    fireEvent.touchStart(marqueeContainer!);
    fireEvent.touchEnd(marqueeContainer!);
  });
});
