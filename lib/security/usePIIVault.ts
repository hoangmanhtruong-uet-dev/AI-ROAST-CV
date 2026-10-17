'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import type { ScrubRequest, ScrubResponse } from '@/lib/workers/pii-scrubber.worker';

export interface PIIStats {
  totalMasked: number;
  byType: Record<string, number>;
}

export function usePIIVault() {
  const vaultRef = useRef<Map<string, string>>(new Map());
  const workerRef = useRef<Worker | null>(null);

  const [isScrubbing, setIsScrubbing] = useState(false);
  const [stats, setStats] = useState<PIIStats>({ totalMasked: 0, byType: {} });

  useEffect(() => {
    // Khởi tạo Web Worker an toàn trên môi trường Browser
    if (typeof window !== 'undefined') {
      try {
        workerRef.current = new Worker(
          new URL('../workers/pii-scrubber.worker.ts', import.meta.url)
        );
      } catch (err) {
        console.warn('Web Worker initialization fallback:', err);
      }
    }

    const currentWorker = workerRef.current;
    const currentVault = vaultRef.current;
    return () => {
      currentWorker?.terminate();
      currentVault.clear();
    };
  }, []);

  const maskText = useCallback(
    (rawText: string, candidateNameHint?: string): Promise<string> => {
      return new Promise((resolve) => {
        if (!workerRef.current) {
          // Fallback đơn giản nếu trình duyệt không hỗ trợ Worker
          resolve(rawText);
          return;
        }

        setIsScrubbing(true);
        const requestId = crypto.randomUUID();

        const handleMessage = (event: MessageEvent<ScrubResponse>) => {
          if (event.data.id !== requestId) return;

          workerRef.current?.removeEventListener('message', handleMessage);
          const { sanitizedText, piiMap, stats: newStats } = event.data;

          Object.entries(piiMap).forEach(([token, originalValue]) => {
            vaultRef.current.set(token, originalValue);
          });

          setStats(newStats);
          setIsScrubbing(false);
          resolve(sanitizedText);
        };

        workerRef.current.addEventListener('message', handleMessage);
        const payload: ScrubRequest = { id: requestId, rawText, candidateNameHint };
        workerRef.current.postMessage(payload);
      });
    },
    []
  );

  const unmaskText = useCallback((sanitizedText: string): string => {
    if (!sanitizedText || vaultRef.current.size === 0) return sanitizedText;

    let restored = sanitizedText;
    vaultRef.current.forEach((originalValue, token) => {
      const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      restored = restored.replace(new RegExp(escapedToken, 'g'), originalValue);
    });

    return restored;
  }, []);

  const clearVault = useCallback(() => {
    vaultRef.current.clear();
    setStats({ totalMasked: 0, byType: {} });
  }, []);

  return {
    maskText,
    unmaskText,
    clearVault,
    isScrubbing,
    stats,
  };
}
