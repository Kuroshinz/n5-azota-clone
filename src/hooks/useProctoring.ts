'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ProctoringSensor, ProctoringSensorOptions } from '../proctoring/ProctoringSensor';
import { ProctoringEvent, ProctoringReport } from '../types/proctoring';

export interface UseProctoringOptions extends ProctoringSensorOptions {
  enabled?: boolean;
  onViolation?: (event: ProctoringEvent) => void;
}

export function useProctoring(options?: UseProctoringOptions) {
  const { enabled = true, onViolation, ...sensorOptions } = options || {};

  const sensorRef = useRef<ProctoringSensor | null>(null);
  const [report, setReport] = useState<ProctoringReport>({
    outScreenCount: 0,
    fullscreenExitCount: 0,
    totalOutDurationSeconds: 0,
    events: [],
  });
  const [isOutScreen, setIsOutScreen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [latestViolation, setLatestViolation] = useState<ProctoringEvent | null>(null);

  const updateState = useCallback(() => {
    if (sensorRef.current) {
      setReport(sensorRef.current.getReport());
    }
    if (typeof document !== 'undefined') {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
  }, []);

  const requestFullscreen = useCallback(async (element?: HTMLElement) => {
    if (typeof document === 'undefined') return;
    const target = element || document.documentElement;
    if (target.requestFullscreen) {
      try {
        await target.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.error('Failed to enter fullscreen:', err);
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const sensor = new ProctoringSensor(sensorOptions);
    sensorRef.current = sensor;

    const unsubscribe = sensor.onViolation(event => {
      setLatestViolation(event);
      if (event.type === 'out_screen') {
        setIsOutScreen(true);
      }
      updateState();
      onViolation?.(event);
    });

    sensor.start();
    updateState();

    const handleFocusReturn = () => {
      setIsOutScreen(false);
      updateState();
    };

    window.addEventListener('focus', handleFocusReturn);

    return () => {
      unsubscribe();
      window.removeEventListener('focus', handleFocusReturn);
      sensor.stop();
    };
  }, [enabled, onViolation, updateState]);

  return {
    report,
    isOutScreen,
    isFullscreen,
    latestViolation,
    requestFullscreen,
    getReport: () => sensorRef.current?.getReport() || report,
  };
}
