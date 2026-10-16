'use client';

import React, { useState } from 'react';
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import { CvHallOfShame } from '@/components/landing/CvHallOfShame';
import { LiveRoastTeaser } from '@/components/landing/LiveRoastTeaser';
import { DualPortalCards } from '@/components/landing/DualPortalCards';
import { DiffSlider } from '@/components/landing/DiffSlider';
import { SecurityBentoGrid } from '@/components/landing/SecurityBentoGrid';
import { FaqSection } from '@/components/landing/FaqSection';
import Footer from '@/components/landing/Footer';
import FakeDoorModal from '@/components/landing/FakeDoorModal';
import { CheckoutModal } from '@/components/payment/CheckoutModal';
import { ActivateKeyModal } from '@/components/payment/ActivateKeyModal';
import { LenisProvider } from '@/components/providers/LenisProvider';

export default function Home() {
  const [isFakeDoorOpen, setIsFakeDoorOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isActivateOpen, setIsActivateOpen] = useState<boolean>(false);

  return (
    <LenisProvider>
      <div className="flex flex-col min-h-screen bg-[#0a0f1d] text-gray-100 selection:bg-orange-500 selection:text-white relative overflow-x-hidden">
        {/* 1. Floating Pill Glassmorphism Navbar (Fixed Top, Pro CTA, Sound FX Toggle, Session Popover) */}
        <Navbar
          onOpenFakeDoor={() => setIsFakeDoorOpen(true)}
          onOpenCheckout={() => setIsCheckoutOpen(true)}
          onOpenActivateModal={() => setIsActivateOpen(true)}
        />

        {/* Main Scrollytelling Interactive Flow */}
        <main className="flex-1 w-full mx-auto pt-24 pb-12 space-y-16 sm:space-y-24">
          {/* 2. Hero Section (3D Hologram WebGL Canvas, Persona Switcher, Scramble Title, Magnetic CTAs, AI Limitation Disclaimer) */}
          <HeroSection onOpenFakeDoor={() => setIsFakeDoorOpen(true)} />

          {/* 3. CV Hall of Shame Ticker (Marquee with Pause-on-Hover, Sarcastic Penalties & Sound Blip) */}
          <CvHallOfShame />

          {/* 4. Live Roast Teaser (Instant 1-Sentence Experience Input + 4 Presets, ~500ms Gemini Response, Rate Limit & Offline Fallback) */}
          <LiveRoastTeaser />

          {/* 5. Dual 3D Tilt Portal Cards (Card 1: Roast CV Spicy Slider; Card 2: Stress Interview 00:59 Timer + Typewriter Question) */}
          <DualPortalCards />

          {/* 6. Interactive Diff Slider (Before Cliché Red Strikethrough vs After ATS Emerald [Placeholder] Badges with Pointer Drag) */}
          <DiffSlider />

          {/* 7. Dynamic Security Bento Grid (Zero Retention SVG Pipeline, Terminal Log, Thanos Snap 1-Click Wipe Demo, Hover PII Blur) */}
          <SecurityBentoGrid />

          {/* 8. FAQ Section / Features (Interactive Accordion, Rubric, Privacy & Career Guidance) */}
          <FaqSection
            onOpenFakeDoor={() => setIsFakeDoorOpen(true)}
            onOpenCheckout={() => setIsCheckoutOpen(true)}
          />
        </main>

        {/* Footer (Zero Retention Guarantee, ATS Disclaimer, Navigation Links) */}
        <Footer onOpenFakeDoor={() => setIsFakeDoorOpen(true)} />

        {/* 9. Modal Overlays */}
        {/* Fake Door Research Modal */}
        <FakeDoorModal
          isOpen={isFakeDoorOpen}
          onClose={() => setIsFakeDoorOpen(false)}
        />

        {/* VietQR Pro Checkout Modal */}
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          onOpenActivateModal={() => {
            setIsCheckoutOpen(false);
            setIsActivateOpen(true);
          }}
        />

        {/* License Key Activation Modal */}
        <ActivateKeyModal
          isOpen={isActivateOpen}
          onClose={() => setIsActivateOpen(false)}
        />
      </div>
    </LenisProvider>
  );
}
