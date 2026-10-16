'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { soundEngine } from '@/lib/audio/sound-engine';
import { cn } from '@/lib/utils/cn';

export type PersonaMode = 'spicy' | 'expert' | 'stress';

export interface PersonaOption {
  id: PersonaMode;
  label: string;
  sublabel: string;
  shortLabel: string;
  glowColor: string;
  activeTextColor: string;
}

export const PERSONA_OPTIONS: PersonaOption[] = [
  {
    id: 'spicy',
    label: '🔥 Chế độ Mỏ Hỗn',
    sublabel: 'Cà khịa thẳng thừng, bóc trần sáo rỗng',
    shortLabel: '🔥 Mỏ Hỗn',
    glowColor: 'rgba(249, 115, 22, 0.4)',
    activeTextColor: 'text-orange-400',
  },
  {
    id: 'expert',
    label: '🧊 Chế độ Chuyên Gia',
    sublabel: 'Góc nhìn HR Director, tối ưu chuẩn ATS',
    shortLabel: '🧊 Chuyên Gia',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    activeTextColor: 'text-cyan-300',
  },
  {
    id: 'stress',
    label: '⚡ Áp Lực Phòng Thi',
    sublabel: 'Mô phỏng phỏng vấn tình huống dồn dập',
    shortLabel: '⚡ Phòng Thi',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    activeTextColor: 'text-violet-300',
  },
];

export interface PersonaSwitcherProps {
  currentMode: PersonaMode;
  onModeChange: (mode: PersonaMode) => void;
  className?: string;
}

export default function PersonaSwitcher({
  currentMode,
  onModeChange,
  className,
}: PersonaSwitcherProps) {
  const handleSelect = (mode: PersonaMode) => {
    if (mode === currentMode) return;

    // Trigger audio cues
    try {
      soundEngine.play('blip');
      if (mode === 'spicy') {
        soundEngine.playFlame();
      } else if (mode === 'stress') {
        soundEngine.playHeartbeat();
      } else if (mode === 'expert') {
        soundEngine.playLaser();
      }
    } catch {}

    onModeChange(mode);
  };

  const activeOption =
    PERSONA_OPTIONS.find((p) => p.id === currentMode) || PERSONA_OPTIONS[0];

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2.5 w-full max-w-xl mx-auto',
        className
      )}
    >
      {/* Switcher Pills Container */}
      <div
        role="tablist"
        aria-label="Chọn chế độ trải nghiệm AI Roast CV"
        className="relative flex items-center p-1 sm:p-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 backdrop-blur-md shadow-2xl w-full sm:w-auto"
      >
        {PERSONA_OPTIONS.map((option) => {
          const isActive = currentMode === option.id;
          return (
            <button
              key={option.id}
              role="tab"
              aria-selected={isActive}
              aria-controls="hero-persona-view"
              tabIndex={0}
              onClick={() => handleSelect(option.id)}
              className={cn(
                'relative flex-1 sm:flex-initial px-3.5 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors duration-200 select-none z-10 text-center cursor-pointer',
                isActive ? option.activeTextColor : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              {/* Sliding Background Pill */}
              {isActive && (
                <motion.div
                  layoutId="activePersonaPill"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  className="absolute inset-0 rounded-full bg-zinc-800/95 border border-zinc-700 shadow-lg -z-10"
                  style={{
                    boxShadow: `0 0 20px ${option.glowColor}`,
                  }}
                />
              )}
              {/* Responsive Text: full label on sm+, short on mobile */}
              <span className="hidden sm:inline">{option.label}</span>
              <span className="inline sm:hidden">{option.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Mood Subtitle Tagline */}
      <p className="text-xs text-zinc-400 italic text-center min-h-[1.25rem] transition-opacity duration-300">
        {activeOption.sublabel}
      </p>
    </div>
  );
}
