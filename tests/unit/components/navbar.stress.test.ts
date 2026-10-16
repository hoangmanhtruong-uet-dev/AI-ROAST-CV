import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within, act, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navbar from '@/components/landing/Navbar';
import { soundEngine, SOUND_TOGGLE_EVENT } from '@/lib/audio/sound-engine';
import {
  WIPE_DATA_EVENT_NAME,
  wipeAllSessionData,
} from '@/lib/storage/wipe-data';
import * as entitlementModule from '@/lib/payment/entitlement';

// Mock framer-motion for reliable headless execution without animation frame stalls
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, layoutId, ...props }: any) =>
      React.createElement('div', { className, style, ...props }, children),
    span: ({ children, className, style, layoutId, ...props }: any) =>
      React.createElement('span', { className, style, ...props }, children),
    button: ({ children, className, style, layoutId, ...props }: any) =>
      React.createElement('button', { className, style, ...props }, children),
    header: ({ children, className, style, layoutId, ...props }: any) =>
      React.createElement('header', { className, style, ...props }, children),
  },
  AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
}));

describe('Adversarial Stress Testing: Floating Pill Navbar & Session Popover (Challenger M1)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
    soundEngine.resetForTesting();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    sessionStorage.clear();
    soundEngine.resetForTesting();
  });

  // =========================================================================
  // 1. RAPID POPOVER INTERACTION & CONCURRENCY STRESS
  // =========================================================================
  describe('1. Rapid Popover Interaction & State Concurrency', () => {
    it('survives rapid successive burst clicking (30 clicks) on popover trigger without state desync', async () => {
      render(React.createElement(Navbar));
      const trigger = screen.getByLabelText(/trạng thái phiên & bảo mật/i);

      // Rapidly fire 30 clicks
      for (let i = 1; i <= 30; i++) {
        fireEvent.click(trigger);
        const isOpen = i % 2 !== 0;
        expect(trigger.getAttribute('aria-expanded')).toBe(isOpen ? 'true' : 'false');
        if (isOpen) {
          const dialogs = screen.getAllByRole('dialog');
          expect(dialogs).toHaveLength(1);
        } else {
          expect(screen.queryByRole('dialog')).toBeNull();
        }
      }

      // After exactly 30 clicks (even number), popover must be closed
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('correctly closes popover on outside clicks across disparate DOM elements', async () => {
      const onOpenFakeDoor = vi.fn();
      render(
        React.createElement('div', { 'data-testid': 'outer-container' },
          React.createElement('div', { 'data-testid': 'external-boundary' }, 'Outside Boundary'),
          React.createElement(Navbar, { onOpenFakeDoor })
        )
      );

      const trigger = screen.getByLabelText(/trạng thái phiên & bảo mật/i);

      // Scenario A: Click on external boundary outside Navbar
      fireEvent.click(trigger);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      fireEvent.mouseDown(screen.getByTestId('external-boundary'));
      expect(screen.queryByRole('dialog')).toBeNull();

      // Scenario B: Click on brand logo link while open
      fireEvent.click(trigger);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      const logoLink = screen.getByLabelText(/AI Roast CV Trang chủ/i);
      fireEvent.mouseDown(logoLink);
      expect(screen.queryByRole('dialog')).toBeNull();

      // Scenario C: Click on sound toggle button while open
      fireEvent.click(trigger);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      const soundBtn = screen.getByLabelText(/bật âm thanh/i);
      fireEvent.mouseDown(soundBtn);
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('does NOT close popover when clicking inside the popover dialog card', async () => {
      render(React.createElement(Navbar));
      const trigger = screen.getByLabelText(/trạng thái phiên & bảo mật/i);

      fireEvent.click(trigger);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // Click on text content inside popover dialog
      const headerText = within(dialog).getByText(/bảo mật dữ liệu phiên/i);
      fireEvent.mouseDown(headerText);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      const storageIndicator = within(dialog).getByText(/dữ liệu trên máy:/i);
      fireEvent.mouseDown(storageIndicator);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('handles clicking SVG child elements inside trigger button without double-toggling or glitch', async () => {
      render(React.createElement(Navbar));
      const trigger = screen.getByLabelText(/trạng thái phiên & bảo mật/i);

      // Find SVG inside trigger button
      const svgIcon = trigger.querySelector('svg');
      expect(svgIcon).not.toBeNull();

      // Click SVG icon directly
      fireEvent.click(svgIcon!);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(trigger.getAttribute('aria-expanded')).toBe('true');

      // Click SVG icon again to close
      fireEvent.click(svgIcon!);
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('survives rapid Escape key bursts and returns focus to popover trigger', async () => {
      render(React.createElement(Navbar));
      const trigger = screen.getByLabelText(/trạng thái phiên & bảo mật/i);

      fireEvent.click(trigger);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Burst of 10 Escape key presses
      for (let i = 0; i < 10; i++) {
        fireEvent.keyDown(document, { key: 'Escape' });
      }

      expect(screen.queryByRole('dialog')).toBeNull();
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(document.activeElement).toBe(trigger);
    });

    it('Escape key when popover is already closed causes no error and does not hijack focus', () => {
      render(React.createElement(Navbar));
      const soundBtn = screen.getByLabelText(/bật âm thanh/i);
      soundBtn.focus();
      expect(document.activeElement).toBe(soundBtn);

      // Fire Escape when closed
      expect(() => {
        fireEvent.keyDown(document, { key: 'Escape' });
      }).not.toThrow();

      // Focus should remain undisturbed
      expect(document.activeElement).toBe(soundBtn);
    });

    it('simultaneous modal interactions: clicking "Nhập Key Pro" invokes callback and closes popover', async () => {
      const onOpenActivateModal = vi.fn();
      render(React.createElement(Navbar, { onOpenActivateModal }));
      const trigger = screen.getByLabelText(/trạng thái phiên & bảo mật/i);

      fireEvent.click(trigger);
      const dialog = screen.getByRole('dialog');
      const activateBtn = within(dialog).getByRole('button', { name: /nhập key pro/i });

      fireEvent.click(activateBtn);
      expect(onOpenActivateModal).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('simultaneous triggers: opening mobile menu while popover is open closes popover cleanly', async () => {
      render(React.createElement(Navbar));
      const trigger = screen.getByLabelText(/trạng thái phiên & bảo mật/i);

      // Open popover first
      fireEvent.click(trigger);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Click mobile hamburger menu
      const mobileBtn = screen.getByLabelText(/mở menu/i);
      fireEvent.mouseDown(mobileBtn); // outside click closes popover
      fireEvent.click(mobileBtn);

      expect(screen.queryByRole('dialog')).toBeNull();
      expect(screen.getByLabelText(/đóng menu/i)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 2. STORAGE SYNCHRONIZATION & EVENT STORM STRESS
  // =========================================================================
  describe('2. Storage Synchronization & Event Storm Stress', () => {
    it('survives an alternating storm of 50 storage and data-wiped events without stale dot state', () => {
      render(React.createElement(Navbar));

      // Initial state: no data -> no active dot
      expect(screen.queryByTestId('session-active-dot')).toBeNull();

      // Stress loop: rapidly alternate between adding data + storage event, and wiping data
      for (let i = 0; i < 50; i++) {
        // Step A: Set storage and dispatch 'storage' event
        localStorage.setItem(`stress_key_${i}`, `stress_data_${i}`);
        fireEvent(window, new Event('storage'));
        expect(screen.getByTestId('session-active-dot')).toBeInTheDocument();

        // Step B: Dispatch WIPE_DATA_EVENT_NAME
        localStorage.clear();
        fireEvent(window, new CustomEvent(WIPE_DATA_EVENT_NAME));
        expect(screen.queryByTestId('session-active-dot')).toBeNull();
      }

      // Final affirmation: set storage one last time
      localStorage.setItem('final_check', 'persisted');
      fireEvent(window, new Event('storage'));
      expect(screen.getByTestId('session-active-dot')).toBeInTheDocument();

      // Final wipe
      localStorage.clear();
      fireEvent(window, new CustomEvent(WIPE_DATA_EVENT_NAME));
      expect(screen.queryByTestId('session-active-dot')).toBeNull();
    });

    it('clears active pulsing dot when real wipeAllSessionData() is invoked', () => {
      localStorage.setItem('airoastcv_recent_cv', 'Test CV text data');
      sessionStorage.setItem('airoastcv_timer_state', 'active');

      render(React.createElement(Navbar));
      expect(screen.getByTestId('session-active-dot')).toBeInTheDocument();

      // Execute actual business logic wipe function
      act(() => {
        wipeAllSessionData();
      });

      expect(screen.queryByTestId('session-active-dot')).toBeNull();
      expect(localStorage.length).toBe(0);
      expect(sessionStorage.length).toBe(0);
    });

    it('detects presence of data in sessionStorage alone when localStorage is empty', () => {
      localStorage.clear();
      sessionStorage.setItem('airoastcv_interview_state', 'in_progress');

      render(React.createElement(Navbar));
      expect(screen.getByTestId('session-active-dot')).toBeInTheDocument();

      // Clearing sessionStorage and dispatching storage updates the dot
      sessionStorage.clear();
      fireEvent(window, new Event('storage'));
      expect(screen.queryByTestId('session-active-dot')).toBeNull();
    });

    it('updates indicator and triggers onWiped callback when WipeDataButton inside popover is clicked', async () => {
      localStorage.setItem('airoastcv_recent_cv', 'Candidate CV content');
      render(React.createElement(Navbar));

      expect(screen.getByTestId('session-active-dot')).toBeInTheDocument();

      // Open popover
      const trigger = screen.getByLabelText(/trạng thái phiên & bảo mật/i);
      fireEvent.click(trigger);

      const dialog = screen.getByRole('dialog');
      const wipeBtn = within(dialog).getByRole('button', { name: /xóa sạch dữ liệu/i });

      // Click wipe data button inside popover
      fireEvent.click(wipeBtn);

      // Verify indicator is removed
      expect(screen.queryByTestId('session-active-dot')).toBeNull();
      expect(localStorage.length).toBe(0);
    });

    it('gracefully degrades when localStorage throws SecurityError (Incognito/Blocked Storage)', () => {
      // Mock localStorage to simulate security restriction
      const originalLength = Object.getOwnPropertyDescriptor(Storage.prototype, 'length');
      Object.defineProperty(Storage.prototype, 'length', {
        get: () => {
          throw new DOMException('The operation is insecure.', 'SecurityError');
        },
        configurable: true,
      });

      try {
        expect(() => {
          render(React.createElement(Navbar));
        }).not.toThrow();

        // Pulsing dot should be safely absent instead of crashing
        expect(screen.queryByTestId('session-active-dot')).toBeNull();

        // Firing storage event should not crash either
        expect(() => {
          fireEvent(window, new Event('storage'));
        }).not.toThrow();
      } finally {
        if (originalLength) {
          Object.defineProperty(Storage.prototype, 'length', originalLength);
        }
      }
    });
  });

  // =========================================================================
  // 3. KEYBOARD NAVIGATION & ACCESSIBILITY (A11Y)
  // =========================================================================
  describe('3. Keyboard Navigation & Accessibility (a11y)', () => {
    it('verifies logical Tab navigation order across all interactive elements', async () => {
      const user = userEvent.setup();
      render(React.createElement(Navbar));

      // Tab 1: Brand logo
      await user.tab();
      expect(document.activeElement).toBe(screen.getByLabelText(/AI Roast CV Trang chủ/i));

      // Tab 2, 3, 4: Main navigation links
      await user.tab();
      expect(document.activeElement).toBe(screen.getByRole('link', { name: /^roast cv$/i }));

      await user.tab();
      expect(document.activeElement).toBe(screen.getByRole('link', { name: /^phỏng vấn áp lực$/i }));

      await user.tab();
      expect(document.activeElement).toBe(screen.getByRole('link', { name: /^bảo mật$/i }));

      // Tab 5: Sound Toggle button
      await user.tab();
      expect(document.activeElement).toBe(screen.getByLabelText(/bật âm thanh/i));

      // Tab 6: Popover trigger button
      await user.tab();
      expect(document.activeElement).toBe(screen.getByLabelText(/trạng thái phiên & bảo mật/i));

      // Tab 7: Pro CTA button
      await user.tab();
      expect(document.activeElement).toBe(screen.getByRole('button', { name: /29\.000|gói pro|mở khóa/i }));

      // Tab 8: Mobile hamburger button
      await user.tab();
      expect(document.activeElement).toBe(screen.getByLabelText(/mở menu/i));
    });

    it('activates Popover trigger button via keyboard Enter and Space keys', async () => {
      render(React.createElement(Navbar));
      const trigger = screen.getByLabelText(/trạng thái phiên & bảo mật/i);
      trigger.focus();

      // Space key opens popover
      fireEvent.keyDown(trigger, { key: ' ', code: 'Space' });
      fireEvent.click(trigger); // standard browser behavior on key activation
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(trigger.getAttribute('aria-expanded')).toBe('true');

      // Escape closes popover
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(trigger.getAttribute('aria-expanded')).toBe('false');

      // Enter key opens popover
      fireEvent.keyDown(trigger, { key: 'Enter', code: 'Enter' });
      fireEvent.click(trigger);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });

    it('activates Pro CTA button via keyboard Enter key', async () => {
      const onOpenFakeDoor = vi.fn();
      render(React.createElement(Navbar, { onOpenFakeDoor }));

      const ctaButton = screen.getByRole('button', { name: /29\.000|gói pro|mở khóa/i });
      ctaButton.focus();

      fireEvent.keyDown(ctaButton, { key: 'Enter', code: 'Enter' });
      fireEvent.click(ctaButton);

      expect(onOpenFakeDoor).toHaveBeenCalledTimes(1);
    });

    it('validates all required ARIA attributes and roles for WCAG compliance', () => {
      render(React.createElement(Navbar));

      // Header landmark
      const banner = screen.getByRole('banner');
      expect(banner).toBeInTheDocument();

      // Main nav landmark
      const mainNav = screen.getByRole('navigation', { name: /điều hướng chính/i });
      expect(mainNav).toBeInTheDocument();

      // Popover trigger
      const trigger = screen.getByLabelText(/trạng thái phiên & bảo mật/i);
      expect(trigger).toHaveAttribute('type', 'button');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      // Sound button
      const soundBtn = screen.getByLabelText(/bật âm thanh/i);
      expect(soundBtn).toHaveAttribute('type', 'button');

      // Mobile button
      const mobileBtn = screen.getByLabelText(/mở menu/i);
      expect(mobileBtn).toHaveAttribute('type', 'button');
      expect(mobileBtn).toHaveAttribute('aria-expanded', 'false');
    });

    it('confirms popover dialog attributes match dialog role and accessible name', () => {
      render(React.createElement(Navbar));
      const trigger = screen.getByLabelText(/trạng thái phiên & bảo mật/i);

      fireEvent.click(trigger);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-label', 'Trạng thái phiên làm việc');
    });
  });

  // =========================================================================
  // 4. REGRESSION RESILIENCE & LAYOUT INVARIANTS
  // =========================================================================
  describe('4. Regression Resilience & Layout Invariants', () => {
    it('verifies mandatory links (/roast and /interview) remain available across mobile drawer toggle', () => {
      render(React.createElement(Navbar));

      // In initial desktop view, both links must be present
      const roastLinksInitial = screen.getAllByRole('link').filter((l) => l.getAttribute('href') === '/roast');
      const interviewLinksInitial = screen.getAllByRole('link').filter((l) => l.getAttribute('href') === '/interview');
      expect(roastLinksInitial.length).toBeGreaterThanOrEqual(1);
      expect(interviewLinksInitial.length).toBeGreaterThanOrEqual(1);

      // Open mobile drawer
      const mobileBtn = screen.getByLabelText(/mở menu/i);
      fireEvent.click(mobileBtn);

      // In mobile view, additional links exist for mobile navigation
      const roastLinksMobile = screen.getAllByRole('link').filter((l) => l.getAttribute('href') === '/roast');
      const interviewLinksMobile = screen.getAllByRole('link').filter((l) => l.getAttribute('href') === '/interview');
      expect(roastLinksMobile.length).toBeGreaterThan(roastLinksInitial.length);
      expect(interviewLinksMobile.length).toBeGreaterThan(interviewLinksInitial.length);

      // Close mobile drawer
      fireEvent.click(mobileBtn);
      const roastLinksClosed = screen.getAllByRole('link').filter((l) => l.getAttribute('href') === '/roast');
      expect(roastLinksClosed.length).toBe(roastLinksInitial.length);
    });

    it('strictly preserves the unique DOM presence of "Bảo mật 100% • Không lưu CV trên server" across all states', () => {
      const { rerender } = render(React.createElement(Navbar));
      const privacyPattern = /bảo mật 100% • không lưu cv trên server/i;

      // Closed state: exactly 1 element
      expect(screen.getByText(privacyPattern)).toBeInTheDocument();
      expect(screen.getAllByText(privacyPattern)).toHaveLength(1);

      const trigger = screen.getByLabelText(/trạng thái phiên & bảo mật/i);

      // Rapidly toggle popover 20 times: must NEVER throw "multiple elements found" or "element not found"
      for (let i = 0; i < 20; i++) {
        fireEvent.click(trigger);
        expect(screen.getByText(privacyPattern)).toBeInTheDocument();
        expect(screen.getAllByText(privacyPattern)).toHaveLength(1);
      }

      // Close popover
      if (trigger.getAttribute('aria-expanded') === 'true') {
        fireEvent.click(trigger);
      }
      expect(screen.getAllByText(privacyPattern)).toHaveLength(1);

      // State transition to Pro: still exactly 1 element
      act(() => {
        entitlementModule.setClientProStatus(true, 'PRO-123456');
      });

      expect(screen.getByText(privacyPattern)).toBeInTheDocument();
      expect(screen.getAllByText(privacyPattern)).toHaveLength(1);
    });

    it('cleans up all document and window listeners on unmount (zero memory leak / setState after unmount)', () => {
      const { unmount } = render(React.createElement(Navbar));

      // Open popover to mount document-level listeners
      const trigger = screen.getByLabelText(/trạng thái phiên & bảo mật/i);
      fireEvent.click(trigger);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Spy on console.error to catch any React state update warnings
      const consoleErrorSpy = vi.spyOn(console, 'error');

      // Unmount the component while popover is open
      unmount();

      // Fire events that would have triggered state updates if listeners leaked
      fireEvent.keyDown(document, { key: 'Escape' });
      fireEvent.mouseDown(document);
      fireEvent(window, new Event('storage'));
      fireEvent(window, new CustomEvent(WIPE_DATA_EVENT_NAME));
      fireEvent(window, new CustomEvent(SOUND_TOGGLE_EVENT, { detail: { muted: false } }));

      // No error or warning should be emitted
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('reacts to external SOUND_TOGGLE_EVENT custom event dispatched from other modules', () => {
      render(React.createElement(Navbar));

      // Initial state: muted
      expect(screen.getByLabelText(/bật âm thanh/i)).toBeInTheDocument();

      // External soundEngine toggle broadcasts SOUND_TOGGLE_EVENT
      act(() => {
        window.dispatchEvent(
          new CustomEvent(SOUND_TOGGLE_EVENT, { detail: { muted: false } })
        );
      });

      // Navbar should reflect unmuted state
      expect(screen.getByLabelText(/tắt âm thanh/i)).toBeInTheDocument();

      // Broadcast muted: true
      act(() => {
        window.dispatchEvent(
          new CustomEvent(SOUND_TOGGLE_EVENT, { detail: { muted: true } })
        );
      });

      expect(screen.getByLabelText(/bật âm thanh/i)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 5. CHAOS MONKEY INTERLEAVING & STRESS FUZZING
  // =========================================================================
  describe('5. Chaos Monkey Interleaving & Stress Fuzzing', () => {
    it('survives 100 interleaved chaotic user and system events without crashing or leaking state', async () => {
      render(React.createElement(Navbar));

      const popoverTrigger = screen.getByLabelText(/trạng thái phiên & bảo mật/i);
      const soundBtn = screen.getByLabelText(/bật âm thanh|tắt âm thanh/i);
      const ctaBtn = screen.getByRole('button', { name: /29\.000|gói pro|mở khóa/i });
      const mobileBtn = screen.getByLabelText(/mở menu|đóng menu/i);

      // Execute 100 chaotic interleaved operations
      for (let i = 0; i < 100; i++) {
        const action = i % 7;
        switch (action) {
          case 0:
            // Toggle Popover
            fireEvent.click(popoverTrigger);
            break;
          case 1:
            // Toggle Sound
            fireEvent.click(soundBtn);
            break;
          case 2:
            // Storage mutation + event
            localStorage.setItem(`fuzz_key_${i}`, `val_${i}`);
            fireEvent(window, new Event('storage'));
            break;
          case 3:
            // Click outside (document body)
            fireEvent.mouseDown(document.body);
            break;
          case 4:
            // Escape key
            fireEvent.keyDown(document, { key: 'Escape' });
            break;
          case 5:
            // Data wipe event
            localStorage.clear();
            fireEvent(window, new CustomEvent(WIPE_DATA_EVENT_NAME));
            break;
          case 6:
            // Click CTA button without handlers
            fireEvent.click(ctaBtn);
            break;
        }
      }

      // After chaos storm: Ensure DOM is intact and clean
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByText(/bảo mật 100% • không lưu cv trên server/i)).toBeInTheDocument();
    });

    it('safely handles click interactions when all optional handler props are omitted', () => {
      // Mount with completely empty props
      render(React.createElement(Navbar, {}));

      // Click Pro CTA with undefined handlers
      const ctaBtn = screen.getByRole('button', { name: /29\.000|gói pro|mở khóa/i });
      expect(() => {
        fireEvent.click(ctaBtn);
      }).not.toThrow();

      // Open Popover
      const popoverTrigger = screen.getByLabelText(/trạng thái phiên & bảo mật/i);
      fireEvent.click(popoverTrigger);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // "Nhập Key Pro" button should not be rendered if onOpenActivateModal is undefined
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).queryByRole('button', { name: /nhập key pro/i })).toBeNull();
    });

    it('closes mobile drawer immediately upon clicking any navigation link inside it', () => {
      render(React.createElement(Navbar));

      // Open mobile drawer
      const mobileBtn = screen.getByLabelText(/mở menu/i);
      fireEvent.click(mobileBtn);
      expect(screen.getByLabelText(/đóng menu/i)).toBeInTheDocument();

      // Find mobile link for Roast CV
      const roastLinks = screen.getAllByRole('link', { name: /^roast cv$/i });
      expect(roastLinks).toHaveLength(2); // [0] desktop, [1] mobile drawer

      // Click the mobile drawer link
      fireEvent.click(roastLinks[1]);

      // Mobile menu should close
      expect(screen.getByLabelText(/mở menu/i)).toBeInTheDocument();
    });
  });
});
