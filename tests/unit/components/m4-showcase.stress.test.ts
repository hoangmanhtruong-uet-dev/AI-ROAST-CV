import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import DiffSlider, {
  DIFF_PRESETS,
  DiffPreset,
} from '@/components/landing/DiffSlider';
import DualPortalCards from '@/components/landing/DualPortalCards';
import CvHallOfShame, {
  HALL_OF_SHAME_ITEMS,
  ShameItem,
} from '@/components/landing/CvHallOfShame';
import { soundEngine } from '@/lib/audio/sound-engine';

describe('Milestone 4 Adversarial Stress Harness: UI Showcase Components', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    soundEngine.resetForTesting();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // =========================================================================
  // SUITE 1: DiffSlider.tsx Stress & Edge Case Verification
  // =========================================================================
  describe('1. DiffSlider.tsx Stress & Adversarial Suite', () => {
    it('1.1 Boundary clamping: clamps drag position between 5% and 95% on extreme coordinates', () => {
      const { container } = render(React.createElement(DiffSlider));
      const sliderBox = container.querySelector('.cursor-ew-resize') as HTMLElement;
      expect(sliderBox).toBeInTheDocument();

      vi.spyOn(sliderBox, 'getBoundingClientRect').mockReturnValue({
        left: 100,
        top: 50,
        width: 1000,
        height: 400,
        bottom: 450,
        right: 1100,
        x: 100,
        y: 50,
        toJSON: () => {},
      });

      // Pointer down at center
      fireEvent.pointerDown(sliderBox, { clientX: 600, pointerId: 1 });

      const slider = screen.getByRole('slider');
      expect(slider.getAttribute('aria-valuenow')).toBe('50');

      // Test 1: Drag way past left edge (-99999px) -> clamped to 5%
      fireEvent.pointerMove(sliderBox, { clientX: -99999, pointerId: 1 });
      expect(slider.getAttribute('aria-valuenow')).toBe('5');

      // Test 2: Drag exactly at left edge (clientX = 100) -> 0% raw -> clamped to 5%
      fireEvent.pointerMove(sliderBox, { clientX: 100, pointerId: 1 });
      expect(slider.getAttribute('aria-valuenow')).toBe('5');

      // Test 3: Drag at 5% position (clientX = 150) -> exactly 5%
      fireEvent.pointerMove(sliderBox, { clientX: 150, pointerId: 1 });
      expect(slider.getAttribute('aria-valuenow')).toBe('5');

      // Test 4: Drag at 95% position (clientX = 1050) -> exactly 95%
      fireEvent.pointerMove(sliderBox, { clientX: 1050, pointerId: 1 });
      expect(slider.getAttribute('aria-valuenow')).toBe('95');

      // Test 5: Drag exactly at right edge (clientX = 1100) -> 100% raw -> clamped to 95%
      fireEvent.pointerMove(sliderBox, { clientX: 1100, pointerId: 1 });
      expect(slider.getAttribute('aria-valuenow')).toBe('95');

      // Test 6: Drag way past right edge (+99999px) -> clamped to 95%
      fireEvent.pointerMove(sliderBox, { clientX: 99999, pointerId: 1 });
      expect(slider.getAttribute('aria-valuenow')).toBe('95');

      // Release pointer
      fireEvent.pointerUp(sliderBox, { clientX: 99999, pointerId: 1 });
    });

    it('1.2 Clip-path & left divider style integrity: never produces NaN or broken CSS strings', () => {
      const { container } = render(React.createElement(DiffSlider));
      const sliderBox = container.querySelector('.cursor-ew-resize') as HTMLElement;

      vi.spyOn(sliderBox, 'getBoundingClientRect').mockReturnValue({
        left: 200,
        top: 0,
        width: 800,
        height: 300,
        bottom: 300,
        right: 1000,
        x: 200,
        y: 0,
        toJSON: () => {},
      });

      // Pointer down
      fireEvent.pointerDown(sliderBox, { clientX: 600, pointerId: 1 });

      const testCoordinates = [
        200, // 0% raw -> 5% clamped
        240, // 5%
        300, // 12.5%
        400, // 25%
        600, // 50%
        800, // 75%
        960, // 95%
        1000, // 100% raw -> 95% clamped
        -500, // extreme negative
        5000, // extreme positive
      ];

      const clippedOverlay = container.querySelector('[style*="clip-path"]') as HTMLElement;
      expect(clippedOverlay).toBeInTheDocument();

      const dividerBar = container.querySelector('.w-0\\.5') as HTMLElement;
      expect(dividerBar).toBeInTheDocument();

      for (const clientX of testCoordinates) {
        fireEvent.pointerMove(sliderBox, { clientX, pointerId: 1 });

        const clipPathStyle = clippedOverlay.style.clipPath;
        const leftStyle = dividerBar.style.left;

        // Clip-path must match inset(0 0 0 X%) where X is valid number between 5 and 95
        expect(clipPathStyle).toMatch(/^inset\(0px 0px 0px [0-9.]+%?\)$|^inset\(0 0 0 [0-9.]+%?\)$/);
        expect(clipPathStyle).not.toContain('NaN');
        expect(clipPathStyle).not.toContain('undefined');

        // Divider left style must be valid percentage
        expect(leftStyle).toMatch(/^[0-9.]+%$/);
        expect(leftStyle).not.toContain('NaN');
        expect(leftStyle).not.toContain('undefined');

        const parsedPos = parseFloat(leftStyle);
        expect(parsedPos).toBeGreaterThanOrEqual(5);
        expect(parsedPos).toBeLessThanOrEqual(95);
      }

      fireEvent.pointerUp(sliderBox, { clientX: 600, pointerId: 1 });
    });

    it('1.3 Zero-width container resilience: prevents division by zero without NaN', () => {
      const { container } = render(React.createElement(DiffSlider));
      const sliderBox = container.querySelector('.cursor-ew-resize') as HTMLElement;

      // Mock getBoundingClientRect returning 0 width
      vi.spyOn(sliderBox, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        bottom: 0,
        right: 0,
        x: 0,
        y: 0,
        toJSON: () => {},
      });

      // Pointer down on 0-width element
      fireEvent.pointerDown(sliderBox, { clientX: 100, pointerId: 1 });

      const slider = screen.getByRole('slider');
      const val = slider.getAttribute('aria-valuenow');
      expect(val).not.toBe('NaN');
      expect(Number(val)).not.toBeNaN();
      // (100 - 0) / 1 * 100 = 10000 -> clamped to 95
      expect(Number(val)).toBe(95);

      fireEvent.pointerUp(sliderBox, { clientX: 100, pointerId: 1 });
    });

    it('1.4 Rapid pointer drag stream: survives 100 high-frequency pointer moves without crashing', () => {
      const { container } = render(React.createElement(DiffSlider));
      const sliderBox = container.querySelector('.cursor-ew-resize') as HTMLElement;

      vi.spyOn(sliderBox, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 1000,
        height: 400,
        bottom: 400,
        right: 1000,
        x: 0,
        y: 0,
        toJSON: () => {},
      });

      // Start drag
      fireEvent.pointerDown(sliderBox, { clientX: 500, pointerId: 2 });

      // 100 rapid events sweeping back and forth
      for (let i = 0; i < 100; i++) {
        const x = (i % 2 === 0 ? i * 10 : 1000 - i * 10);
        fireEvent.pointerMove(sliderBox, { clientX: x, pointerId: 2 });
      }

      const slider = screen.getByRole('slider');
      const finalVal = Number(slider.getAttribute('aria-valuenow'));
      expect(finalVal).toBeGreaterThanOrEqual(5);
      expect(finalVal).toBeLessThanOrEqual(95);

      // Finish drag
      fireEvent.pointerUp(sliderBox, { clientX: 500, pointerId: 2 });
    });

    it('1.5 Pointer event lifecycle: ignores pointer moves when not dragging and handles pointerCancel', () => {
      const { container } = render(React.createElement(DiffSlider));
      const sliderBox = container.querySelector('.cursor-ew-resize') as HTMLElement;

      vi.spyOn(sliderBox, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 1000,
        height: 400,
        bottom: 400,
        right: 1000,
        x: 0,
        y: 0,
        toJSON: () => {},
      });

      const slider = screen.getByRole('slider');
      expect(slider.getAttribute('aria-valuenow')).toBe('50');

      // Pointer move WITHOUT pointer down -> position must NOT change
      fireEvent.pointerMove(sliderBox, { clientX: 100, pointerId: 1 });
      expect(slider.getAttribute('aria-valuenow')).toBe('50');

      // Pointer down -> position changes to 20%
      fireEvent.pointerDown(sliderBox, { clientX: 200, pointerId: 1 });
      expect(slider.getAttribute('aria-valuenow')).toBe('20');

      // Pointer cancel -> cancels drag
      fireEvent.pointerCancel(sliderBox, { clientX: 200, pointerId: 1 });

      // Subsequent pointer move -> ignored
      fireEvent.pointerMove(sliderBox, { clientX: 800, pointerId: 1 });
      expect(slider.getAttribute('aria-valuenow')).toBe('20');
    });

    it('1.6 Rapid preset cycling: handles 20 fast clicks across presets with sound feedback', async () => {
      const user = userEvent.setup();
      const playBlipSpy = vi.spyOn(soundEngine, 'playBlip');
      render(React.createElement(DiffSlider));

      const backendBtn = screen.getByRole('button', { name: /backend/i });
      const frontendBtn = screen.getByRole('button', { name: /frontend/i });
      const marketingBtn = screen.getByRole('button', { name: /marketing/i });
      const dataBtn = screen.getByRole('button', { name: /data analyst/i });

      const buttons = [backendBtn, frontendBtn, marketingBtn, dataBtn];

      // Rapidly click 20 times cycling through presets
      for (let i = 0; i < 20; i++) {
        await user.click(buttons[i % buttons.length]);
      }

      // 20 blip sounds triggered
      expect(playBlipSpy).toHaveBeenCalledTimes(20);

      // Final state should be index 3 (data analyst)
      expect(screen.getByText(/luồng trích xuất dữ liệu ETL/i)).toBeInTheDocument();
    });

    it('1.7 Keyboard arrow keys boundary stress: clamped at 5% and 95% on repeated presses', () => {
      const playBlipSpy = vi.spyOn(soundEngine, 'playBlip');
      render(React.createElement(DiffSlider, { initialPercentage: 50 }));

      const slider = screen.getByRole('slider');

      // Repeated ArrowLeft: press 25 times from 50 (50 -> 45 -> ... -> 5)
      for (let i = 0; i < 25; i++) {
        fireEvent.keyDown(slider, { key: 'ArrowLeft' });
      }
      expect(slider.getAttribute('aria-valuenow')).toBe('5');
      expect(slider.getAttribute('aria-valuetext')).toBe('5% tối ưu ATS');

      // Press ArrowLeft 10 more times -> remains clamped at 5
      for (let i = 0; i < 10; i++) {
        fireEvent.keyDown(slider, { key: 'ArrowLeft' });
      }
      expect(slider.getAttribute('aria-valuenow')).toBe('5');

      // Repeated ArrowRight: press 25 times from 5 (5 -> 10 -> ... -> 95)
      for (let i = 0; i < 25; i++) {
        fireEvent.keyDown(slider, { key: 'ArrowRight' });
      }
      expect(slider.getAttribute('aria-valuenow')).toBe('95');
      expect(slider.getAttribute('aria-valuetext')).toBe('95% tối ưu ATS');

      // Press ArrowRight 10 more times -> remains clamped at 95
      for (let i = 0; i < 10; i++) {
        fireEvent.keyDown(slider, { key: 'ArrowRight' });
      }
      expect(slider.getAttribute('aria-valuenow')).toBe('95');

      // Home and End jumps
      fireEvent.keyDown(slider, { key: 'Home' });
      expect(slider.getAttribute('aria-valuenow')).toBe('5');

      fireEvent.keyDown(slider, { key: 'End' });
      expect(slider.getAttribute('aria-valuenow')).toBe('95');

      // PageUp (-15) from 95 -> 80
      fireEvent.keyDown(slider, { key: 'PageUp' });
      expect(slider.getAttribute('aria-valuenow')).toBe('80');

      // PageUp multiple times to clamp at 5
      fireEvent.keyDown(slider, { key: 'PageUp' });
      fireEvent.keyDown(slider, { key: 'PageUp' });
      fireEvent.keyDown(slider, { key: 'PageUp' });
      fireEvent.keyDown(slider, { key: 'PageUp' });
      fireEvent.keyDown(slider, { key: 'PageUp' });
      fireEvent.keyDown(slider, { key: 'PageUp' });
      expect(slider.getAttribute('aria-valuenow')).toBe('5');

      // PageDown (+15) multiple times to clamp at 95
      fireEvent.keyDown(slider, { key: 'PageDown' });
      fireEvent.keyDown(slider, { key: 'PageDown' });
      fireEvent.keyDown(slider, { key: 'PageDown' });
      fireEvent.keyDown(slider, { key: 'PageDown' });
      fireEvent.keyDown(slider, { key: 'PageDown' });
      fireEvent.keyDown(slider, { key: 'PageDown' });
      fireEvent.keyDown(slider, { key: 'PageDown' });
      expect(slider.getAttribute('aria-valuenow')).toBe('95');

      // Non-navigation keys must be ignored
      const prevCalls = playBlipSpy.mock.calls.length;
      fireEvent.keyDown(slider, { key: 'Enter' });
      fireEvent.keyDown(slider, { key: 'Escape' });
      fireEvent.keyDown(slider, { key: 'Tab' });
      fireEvent.keyDown(slider, { key: 'KeyA' });
      expect(playBlipSpy).toHaveBeenCalledTimes(prevCalls);
      expect(slider.getAttribute('aria-valuenow')).toBe('95');
    });

    it('1.8 Custom adversarial preset with nested brackets and missing action verb', () => {
      const customPresets: DiffPreset[] = [
        {
          id: 'adversarial',
          role: 'Adversarial Edge Role',
          iconName: 'ShieldAlert',
          before: {
            badge: 'Thảm họa CV',
            score: 0,
            title: 'Trước chỉnh sửa',
            weakVerb: 'Làm',
            bulletText: 'Không có số liệu gì cả.',
            weakPhrases: ['Không có số liệu'],
            critique: 'Cần sửa ngay.',
          },
          after: {
            badge: 'Thần thánh ATS',
            score: 100,
            title: 'Sau chỉnh sửa',
            actionVerb: 'Kiến tạo',
            // Notice: bulletText does NOT start with actionVerb, contains multiple [placeholders]
            bulletText: 'Thực hiện kiến tạo giải pháp [100M+] người dùng với độ trễ [<10ms] và ngân sách [$0].',
            placeholders: ['[100M+]', '[<10ms]', '[$0]'],
            formula: 'Action + Context + Result',
            impactTags: ['100M+ users', '<10ms latency'],
          },
        },
      ];

      render(React.createElement(DiffSlider, { presets: customPresets }));

      expect(screen.getByText(/Thần thánh ATS/i)).toBeInTheDocument();
      expect(screen.getByText('[100M+]')).toBeInTheDocument();
      expect(screen.getByText('[<10ms]')).toBeInTheDocument();
      expect(screen.getByText('[$0]')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // SUITE 2: DualPortalCards.tsx Stress & Re-entrancy Suite
  // =========================================================================
  describe('2. DualPortalCards.tsx Stress & Adversarial Suite', () => {
    it('2.1 High-frequency mousemove events: computes 3D tilt coordinates without NaN', () => {
      render(React.createElement(DualPortalCards));

      const roastCard = screen.getByText(/Roast CV Siêu Cay/i).closest('.relative.rounded-2xl.group') as HTMLElement;
      expect(roastCard).toBeInTheDocument();

      vi.spyOn(roastCard, 'getBoundingClientRect').mockReturnValue({
        left: 50,
        top: 50,
        width: 500,
        height: 600,
        bottom: 650,
        right: 550,
        x: 50,
        y: 50,
        toJSON: () => {},
      });

      // 100 high-frequency mouse moves
      for (let i = 0; i < 100; i++) {
        const clientX = 50 + (i * 5);
        const clientY = 50 + (i * 6);
        fireEvent.mouseMove(roastCard, { clientX, clientY });

        const style = roastCard.style.transform;
        expect(style).toMatch(/rotateX\([0-9.-]+deg\) rotateY\([0-9.-]+deg\)/);
        expect(style).not.toContain('NaN');
        expect(style).not.toContain('undefined');
      }

      // Mouse leave resets tilt
      fireEvent.mouseLeave(roastCard);
      expect(roastCard.style.transform).toBe('rotateX(0deg) rotateY(0deg)');
    });

    it('2.2 Zero-dimension container resilience: avoids division by zero in tilt hook', () => {
      render(React.createElement(DualPortalCards));

      const interviewHeading = screen.getByRole('heading', { name: /Phỏng Vấn Áp Lực/i });
      const interviewCard = interviewHeading.closest('.relative.rounded-2xl.group') as HTMLElement;
      expect(interviewCard).toBeInTheDocument();

      vi.spyOn(interviewCard, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        bottom: 0,
        right: 0,
        x: 0,
        y: 0,
        toJSON: () => {},
      });

      // Mouse move on 0-dimension element
      fireEvent.mouseMove(interviewCard, { clientX: 100, clientY: 100 });

      const transform = interviewCard.style.transform;
      expect(transform).not.toContain('NaN');
      expect(transform).not.toContain('undefined');
    });

    it('2.3 Motion accessibility & touch bypass: respects prefers-reduced-motion', () => {
      // Mock matchMedia to simulate prefers-reduced-motion
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockImplementation((query: string) => {
        if (query.includes('prefers-reduced-motion') || query.includes('pointer: coarse')) {
          return { matches: true, addListener: vi.fn(), removeListener: vi.fn() };
        }
        return { matches: false, addListener: vi.fn(), removeListener: vi.fn() };
      });

      render(React.createElement(DualPortalCards));
      const roastCard = screen.getByText(/Roast CV Siêu Cay/i).closest('.relative.rounded-2xl.group') as HTMLElement;

      fireEvent.mouseMove(roastCard, { clientX: 200, clientY: 200 });

      // Tilt should remain at initial (0, 0)
      expect(roastCard.style.transform).toBe('rotateX(0deg) rotateY(0deg)');

      window.matchMedia = originalMatchMedia;
    });

    it('2.4 Rapid mode switching: alternates 16 times between Expert and Spicy tones', async () => {
      const user = userEvent.setup();
      const playBlipSpy = vi.spyOn(soundEngine, 'playBlip');
      render(React.createElement(DualPortalCards));

      const expertBtn = screen.getByRole('button', { name: /chuyên gia/i });
      const spicyBtn = screen.getByRole('button', { name: /mỏ hỗn/i });

      for (let i = 0; i < 8; i++) {
        await user.click(expertBtn);
        expect(screen.getByText(/cụ thể hóa bằng các dự án số liệu/i)).toBeInTheDocument();

        await user.click(spicyBtn);
        expect(screen.getByText(/khác gì khoe mình biết thở/i)).toBeInTheDocument();
      }

      // 16 blips
      expect(playBlipSpy).toHaveBeenCalledTimes(16);
    });

    it('2.5 Countdown simulator re-entrancy & timer cleanup: survives rapid spam clicks and runs cleanly', async () => {
      vi.useFakeTimers();
      const playHeartbeatSpy = vi.spyOn(soundEngine, 'playHeartbeat');
      render(React.createElement(DualPortalCards));

      const startBtn = screen.getByRole('button', { name: /thử đếm 3s/i });
      expect(startBtn).toBeEnabled();
      expect(screen.getByText('00:59')).toBeInTheDocument();

      // Click to start countdown
      fireEvent.click(startBtn);

      expect(playHeartbeatSpy).toHaveBeenCalledTimes(1);
      expect(startBtn).toBeDisabled();
      expect(screen.getByText(/đang đo nhịp tim/i)).toBeInTheDocument();

      // Attempt to spam click while active (10 clicks) -> must be prevented
      for (let i = 0; i < 10; i++) {
        fireEvent.click(startBtn);
      }
      expect(playHeartbeatSpy).toHaveBeenCalledTimes(1);

      // Tick 1 second -> 00:58
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText('00:58')).toBeInTheDocument();

      // Tick 2 seconds -> 00:57
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText('00:57')).toBeInTheDocument();

      // Tick 3 seconds -> 00:56 (stop condition: current <= 56)
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText('00:56')).toBeInTheDocument();
      expect(startBtn).toBeEnabled();
      expect(screen.getByText(/thử đếm 3s/i)).toBeInTheDocument();

      // Restart immediately: click again to start a 2nd cycle
      fireEvent.click(startBtn);
      expect(playHeartbeatSpy).toHaveBeenCalledTimes(2);
      expect(startBtn).toBeDisabled();

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText('00:58')).toBeInTheDocument();

      // Advance to completion
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(startBtn).toBeEnabled();
    });

    it('2.6 Unmount cleanup during active countdown: clears interval without leak', () => {
      vi.useFakeTimers();
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      const { unmount } = render(React.createElement(DualPortalCards));

      const startBtn = screen.getByRole('button', { name: /thử đếm 3s/i });
      fireEvent.click(startBtn);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Unmount while countdown is mid-flight
      unmount();

      // Verify clearInterval was called on unmount
      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('2.7 Link integrity and sound triggers for Roast and Interview CTAs', () => {
      const playFlameSpy = vi.spyOn(soundEngine, 'playFlame');
      const playLaserSpy = vi.spyOn(soundEngine, 'playLaser');
      const onRoastClick = vi.fn();
      const onInterviewClick = vi.fn();

      render(
        React.createElement(DualPortalCards, {
          onRoastClick,
          onInterviewClick,
        })
      );

      // Verify Card 1 CTA
      const roastLink = screen.getByRole('link', { name: /bắt đầu roast cv ngay/i });
      expect(roastLink).toBeInTheDocument();
      expect(roastLink.getAttribute('href')).toBe('/roast');
      expect(roastLink.textContent).toMatch(/roast cv/i);

      fireEvent.click(roastLink);
      expect(playFlameSpy).toHaveBeenCalled();
      expect(onRoastClick).toHaveBeenCalled();

      // Verify Card 2 CTA
      const interviewLink = screen.getByRole('link', { name: /vào phỏng vấn áp lực ngay/i });
      expect(interviewLink).toBeInTheDocument();
      expect(interviewLink.getAttribute('href')).toBe('/interview');
      expect(interviewLink.textContent).toMatch(/phỏng vấn áp lực|thử thách phỏng vấn/i);

      fireEvent.click(interviewLink);
      expect(playLaserSpy).toHaveBeenCalled();
      expect(onInterviewClick).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // SUITE 3: CvHallOfShame.tsx Stress & Interaction Suite
  // =========================================================================
  describe('3. CvHallOfShame.tsx Stress & Adversarial Suite', () => {
    it('3.1 Rapid hover enter/leave and touch start/end: toggles pause without throwing', () => {
      const { container } = render(React.createElement(CvHallOfShame));
      const marqueeWrapper = container.querySelector('.group') as HTMLElement;
      expect(marqueeWrapper).toBeInTheDocument();

      // Alternate hover 15 times (30 enter/leave events)
      for (let i = 0; i < 15; i++) {
        fireEvent.mouseEnter(marqueeWrapper);
        fireEvent.mouseLeave(marqueeWrapper);
      }

      // Alternate touch 15 times (30 start/end events)
      for (let i = 0; i < 15; i++) {
        fireEvent.touchStart(marqueeWrapper);
        fireEvent.touchEnd(marqueeWrapper);
      }

      // Marquee track should remain intact
      const track = screen.getByTestId('hall-of-shame-track');
      expect(track).toBeInTheDocument();
    });

    it('3.2 Pause toggle button: rapid cycling updates aria-label and triggers audio', async () => {
      const user = userEvent.setup();
      const playBlipSpy = vi.spyOn(soundEngine, 'playBlip');
      render(React.createElement(CvHallOfShame));

      const toggleBtn = screen.getByRole('button', { name: /tạm dừng cuộn ticker/i });

      // Click 10 times to toggle back and forth
      for (let i = 0; i < 10; i++) {
        await user.click(toggleBtn);
      }

      expect(playBlipSpy).toHaveBeenCalledTimes(10);
      // Even number of clicks (10) -> returns to initial "Tạm dừng cuộn ticker"
      expect(screen.getByRole('button', { name: /tạm dừng cuộn ticker/i })).toBeInTheDocument();
    });

    it('3.3 Card click audio triggers and active state timeout re-entrancy', () => {
      vi.useFakeTimers();
      const playBlipSpy = vi.spyOn(soundEngine, 'playBlip');
      render(React.createElement(CvHallOfShame));

      const cards = screen.getAllByRole('article');
      expect(cards.length).toBe(HALL_OF_SHAME_ITEMS.length * 2);

      // Rapidly click 5 cards
      for (let i = 0; i < 5; i++) {
        fireEvent.click(cards[i]);
      }
      expect(playBlipSpy).toHaveBeenCalledTimes(5);

      // Advance timers by 2500ms to clear selection
      act(() => {
        vi.advanceTimersByTime(2500);
      });
    });

    it('3.4 Keyboard Enter and Space activation on shame cards', () => {
      const playBlipSpy = vi.spyOn(soundEngine, 'playBlip');
      render(React.createElement(CvHallOfShame));

      const cards = screen.getAllByRole('article');

      // Enter key
      fireEvent.keyDown(cards[0], { key: 'Enter' });
      expect(playBlipSpy).toHaveBeenCalledTimes(1);

      // Space key
      fireEvent.keyDown(cards[0], { key: ' ' });
      expect(playBlipSpy).toHaveBeenCalledTimes(2);

      // Ignored keys do not trigger blip
      fireEvent.keyDown(cards[0], { key: 'ArrowDown' });
      fireEvent.keyDown(cards[0], { key: 'Tab' });
      fireEvent.keyDown(cards[0], { key: 'Escape' });
      expect(playBlipSpy).toHaveBeenCalledTimes(2);
    });

    it('3.5 Custom shame items prop & duplication integrity: duplicates array for infinite marquee', () => {
      const customItems: ShameItem[] = [
        {
          id: 'custom-1',
          category: 'Test Category',
          role: 'Custom Role',
          quote: 'Custom blunder quote',
          penaltyChip: 'Penalty chip',
          penaltyScore: '-100',
          roastComment: 'Sarcastic roast comment',
        },
      ];

      render(React.createElement(CvHallOfShame, { items: customItems }));

      // Array duplicated: 1 item -> 2 rendered articles
      const articles = screen.getAllByRole('article');
      expect(articles.length).toBe(2);
      expect(screen.getAllByText(/Custom blunder quote/i).length).toBe(2);
    });

    it('3.6 Empty shame items list resilience: renders safely without crashing', () => {
      render(React.createElement(CvHallOfShame, { items: [] }));

      const region = screen.getByRole('region');
      expect(region).toBeInTheDocument();
      expect(screen.queryAllByRole('article').length).toBe(0);
    });
  });
});
