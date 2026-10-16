import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navbar from '@/components/landing/Navbar';
import Header from '@/components/landing/Header';
import { soundEngine } from '@/lib/audio/sound-engine';
import { WIPE_DATA_EVENT_NAME } from '@/lib/storage/wipe-data';
import * as entitlementModule from '@/lib/payment/entitlement';

// Mock framer-motion for stable headless/JSDOM execution
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

describe('Floating Pill Glassmorphism Navbar Component (Milestone 1)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
    soundEngine.resetForTesting();
  });

  afterEach(() => {
    soundEngine.resetForTesting();
  });

  describe('1. Structure, Classes & Brand Identity', () => {
    it('renders floating pill shell with exact required glassmorphism styling', () => {
      render(React.createElement(Navbar));
      const header = screen.getByRole('banner');

      expect(header).toBeInTheDocument();
      expect(header.className).toContain('fixed top-5 left-1/2 -translate-x-1/2');
      expect(header.className).toContain('rounded-full');
      expect(header.className).toContain('backdrop-blur-md');
      expect(header.className).toContain('border-zinc-800/80');
      expect(header.className).toContain('shadow-2xl');
    });

    it('renders compact brand logo with link to home and BETA badge', () => {
      render(React.createElement(Navbar));
      const logoLink = screen.getByLabelText(/AI Roast CV Trang chủ/i);
      expect(logoLink).toBeInTheDocument();
      expect(logoLink.getAttribute('href')).toBe('/');
      expect(screen.getByText(/AI Roast CV/i)).toBeInTheDocument();
      expect(screen.getByText('BETA')).toBeInTheDocument();
    });

    it('does not render <h1> tag in Navbar to preserve page heading hierarchy', () => {
      render(React.createElement(Navbar));
      expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
    });
  });

  describe('2. Navigation Links & Regression Guardrails', () => {
    it('renders all 3 main navigation targets with exact link attributes', () => {
      render(React.createElement(Navbar));
      const allLinks = screen.getAllByRole('link');

      const roastLink = allLinks.find((l) => l.getAttribute('href') === '/roast');
      expect(roastLink).toBeDefined();
      expect(roastLink?.textContent).toMatch(/roast cv/i);

      const interviewLink = allLinks.find((l) => l.getAttribute('href') === '/interview');
      expect(interviewLink).toBeDefined();
      expect(interviewLink?.textContent).toMatch(/phỏng vấn áp lực/i);

      const privacyLink = allLinks.find((l) => l.getAttribute('href') === '#privacy-commitment');
      expect(privacyLink).toBeDefined();
      expect(privacyLink?.textContent).toMatch(/bảo mật/i);
    });

    it('plays sound blip when a navigation link is clicked', async () => {
      const playBlipSpy = vi.spyOn(soundEngine, 'playBlip');
      render(React.createElement(Navbar));

      const roastLink = screen.getAllByRole('link').find((l) => l.getAttribute('href') === '/roast');
      expect(roastLink).toBeDefined();

      if (roastLink) {
        fireEvent.click(roastLink);
        expect(playBlipSpy).toHaveBeenCalled();
      }
    });
  });

  describe('3. Session State Popover & Regression Invariant', () => {
    it('preserves "Bảo mật 100% • Không lưu CV trên server" in DOM before popover is opened', () => {
      render(React.createElement(Navbar));
      // Regression critical assertion matching landing_stress.test.ts:307
      expect(
        screen.getByText(/bảo mật 100% • không lưu cv trên server/i)
      ).toBeInTheDocument();
    });

    it('toggles session popover dialog on trigger button click', async () => {
      const user = userEvent.setup();
      render(React.createElement(Navbar));

      const popoverTrigger = screen.getByLabelText(/trạng thái phiên & bảo mật/i);
      expect(popoverTrigger).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByRole('dialog')).toBeNull();

      await user.click(popoverTrigger);
      expect(popoverTrigger).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      await user.click(popoverTrigger);
      expect(popoverTrigger).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('displays active pulsing dot when localStorage contains client data', () => {
      localStorage.setItem('airoastcv_test_key', 'some_content');
      render(React.createElement(Navbar));

      expect(screen.getByTestId('session-active-dot')).toBeInTheDocument();
    });

    it('clears pulsing dot dynamically when wipe-data event is fired', async () => {
      localStorage.setItem('airoastcv_test_key', 'some_content');
      render(React.createElement(Navbar));
      expect(screen.getByTestId('session-active-dot')).toBeInTheDocument();

      fireEvent(window, new CustomEvent(WIPE_DATA_EVENT_NAME));
      expect(screen.queryByTestId('session-active-dot')).toBeNull();
    });

    it('closes popover on Escape key press', async () => {
      const user = userEvent.setup();
      render(React.createElement(Navbar));

      const popoverTrigger = screen.getByLabelText(/trạng thái phiên & bảo mật/i);
      await user.click(popoverTrigger);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('renders 1-Click Wipe Data and Nhập Key Pro buttons inside popover', async () => {
      const user = userEvent.setup();
      const onOpenActivateModal = vi.fn();
      render(React.createElement(Navbar, { onOpenActivateModal }));

      const popoverTrigger = screen.getByLabelText(/trạng thái phiên & bảo mật/i);
      await user.click(popoverTrigger);

      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText(/xóa sạch dữ liệu/i)).toBeInTheDocument();

      const activateBtn = within(dialog).getByRole('button', { name: /nhập key pro/i });
      expect(activateBtn).toBeInTheDocument();

      await user.click(activateBtn);
      expect(onOpenActivateModal).toHaveBeenCalled();
    });
  });

  describe('4. Border Beam Pro CTA ("Gói Pro 29k")', () => {
    it('renders Pro CTA button matching /29\\.000|gói pro|mở khóa/i regex', () => {
      render(React.createElement(Navbar));
      const ctaButtons = screen.getAllByRole('button', {
        name: /29\.000|gói pro|mở khóa/i,
      });
      expect(ctaButtons.length).toBeGreaterThan(0);
      expect(ctaButtons[0]).toBeInTheDocument();
    });

    it('calls onOpenFakeDoor when clicked if onOpenFakeDoor is provided', async () => {
      const user = userEvent.setup();
      const onOpenFakeDoor = vi.fn();
      const onOpenCheckout = vi.fn();
      render(React.createElement(Navbar, { onOpenFakeDoor, onOpenCheckout }));

      const ctaButton = screen.getAllByRole('button', {
        name: /29\.000|gói pro|mở khóa/i,
      })[0];
      await user.click(ctaButton);

      expect(onOpenFakeDoor).toHaveBeenCalled();
      expect(onOpenCheckout).not.toHaveBeenCalled();
    });

    it('calls onOpenCheckout when clicked if onOpenFakeDoor is omitted', async () => {
      const user = userEvent.setup();
      const onOpenCheckout = vi.fn();
      render(React.createElement(Navbar, { onOpenCheckout }));

      const ctaButton = screen.getAllByRole('button', {
        name: /29\.000|gói pro|mở khóa/i,
      })[0];
      await user.click(ctaButton);

      expect(onOpenCheckout).toHaveBeenCalled();
    });

    it('renders ProBadge instead of Pro CTA button when isPro is true', () => {
      vi.spyOn(entitlementModule, 'useProTier').mockReturnValue({
        isPro: true,
        licenseKey: 'PRO-TEST-KEY',
        isReady: true,
        activatePro: vi.fn(),
        deactivatePro: vi.fn(),
      });

      render(React.createElement(Navbar));
      expect(screen.queryByRole('button', { name: /29\.000|gói pro|mở khóa/i })).toBeNull();
      expect(screen.getByText('PRO MEMBER')).toBeInTheDocument();
    });
  });

  describe('5. Sound Toggle Button (Web Audio)', () => {
    it('renders sound toggle button with initial muted state', () => {
      render(React.createElement(Navbar));
      const toggleBtn = screen.getByLabelText(/bật âm thanh/i);
      expect(toggleBtn).toBeInTheDocument();
    });

    it('toggles soundEngine mute state and updates icon / label on click', async () => {
      const user = userEvent.setup();
      const toggleMuteSpy = vi.spyOn(soundEngine, 'toggleMute');
      render(React.createElement(Navbar));

      const toggleBtn = screen.getByLabelText(/bật âm thanh/i);
      await user.click(toggleBtn);

      expect(toggleMuteSpy).toHaveBeenCalled();
      expect(screen.getByLabelText(/tắt âm thanh/i)).toBeInTheDocument();
    });
  });

  describe('6. Mobile Responsive Drawer & Header Wrapper', () => {
    it('toggles mobile menu drawer on mobile hamburger button click', async () => {
      const user = userEvent.setup();
      render(React.createElement(Navbar));

      const menuBtn = screen.getByLabelText(/mở menu/i);
      expect(menuBtn).toBeInTheDocument();

      await user.click(menuBtn);
      expect(screen.getByLabelText(/đóng menu/i)).toBeInTheDocument();
    });

    it('verifies Header wrapper renders Navbar seamlessly with identical props', () => {
      const onOpenFakeDoor = vi.fn();
      render(React.createElement(Header, { onOpenFakeDoor }));

      const headerElement = screen.getByRole('banner');
      expect(headerElement).toBeInTheDocument();
      expect(
        screen.getByText(/bảo mật 100% • không lưu cv trên server/i)
      ).toBeInTheDocument();
    });
  });
});
