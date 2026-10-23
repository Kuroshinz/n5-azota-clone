import { ProctoringEvent, ProctoringReport } from '../types/proctoring';

export interface ProctoringSensorOptions {
  targetWindow?: Window;
  targetDocument?: Document;
  inactivityTimeoutMs?: number;
}

export class ProctoringSensor {
  private targetWindow?: Window;
  private targetDocument?: Document;
  private inactivityTimeoutMs: number;

  private isStarted = false;
  private isOutScreen = false;
  private outScreenStartTime: number | null = null;
  private wasFullscreen = false;

  private outScreenCount = 0;
  private fullscreenExitCount = 0;
  private totalOutDurationSeconds = 0;
  private events: ProctoringEvent[] = [];

  private listeners: ((event: ProctoringEvent) => void)[] = [];
  private inactivityTimer: any = null;

  constructor(options?: ProctoringSensorOptions) {
    this.targetWindow = options?.targetWindow ?? (typeof window !== 'undefined' ? window : undefined);
    this.targetDocument = options?.targetDocument ?? (typeof document !== 'undefined' ? document : undefined);
    this.inactivityTimeoutMs = options?.inactivityTimeoutMs ?? 60000;
  }

  public start(): void {
    if (this.isStarted || !this.targetWindow || !this.targetDocument) return;
    this.isStarted = true;

    // Window events
    this.targetWindow.addEventListener('blur', this.handleBlur);
    this.targetWindow.addEventListener('focus', this.handleFocus);
    this.targetWindow.addEventListener('mousemove', this.resetInactivityTimer);
    this.targetWindow.addEventListener('keydown', this.resetInactivityTimer);
    this.targetWindow.addEventListener('click', this.resetInactivityTimer);
    this.targetWindow.addEventListener('touchstart', this.resetInactivityTimer);

    // Document events
    this.targetDocument.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.targetDocument.addEventListener('fullscreenchange', this.handleFullscreenChange);

    this.wasFullscreen = Boolean(this.targetDocument.fullscreenElement);
    this.resetInactivityTimer();
  }

  public stop(): void {
    if (!this.isStarted || !this.targetWindow || !this.targetDocument) return;
    this.isStarted = false;

    this.targetWindow.removeEventListener('blur', this.handleBlur);
    this.targetWindow.removeEventListener('focus', this.handleFocus);
    this.targetWindow.removeEventListener('mousemove', this.resetInactivityTimer);
    this.targetWindow.removeEventListener('keydown', this.resetInactivityTimer);
    this.targetWindow.removeEventListener('click', this.resetInactivityTimer);
    this.targetWindow.removeEventListener('touchstart', this.resetInactivityTimer);

    this.targetDocument.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.targetDocument.removeEventListener('fullscreenchange', this.handleFullscreenChange);

    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }

    if (this.isOutScreen && this.outScreenStartTime) {
      const duration = Math.round((Date.now() - this.outScreenStartTime) / 1000);
      this.totalOutDurationSeconds += duration;
      this.isOutScreen = false;
      this.outScreenStartTime = null;
    }
  }

  public onViolation(callback: (event: ProctoringEvent) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  public getReport(): ProctoringReport {
    let currentTotalOut = this.totalOutDurationSeconds;
    if (this.isOutScreen && this.outScreenStartTime) {
      currentTotalOut += Math.round((Date.now() - this.outScreenStartTime) / 1000);
    }

    return {
      outScreenCount: this.outScreenCount,
      fullscreenExitCount: this.fullscreenExitCount,
      totalOutDurationSeconds: currentTotalOut,
      events: [...this.events],
    };
  }

  private triggerViolation(event: ProctoringEvent): void {
    this.events.push(event);
    this.listeners.forEach(cb => cb(event));
  }

  private handleBlur = (): void => {
    this.markOutScreen('User switched window or tab (blur)');
  };

  private handleFocus = (): void => {
    this.markReturnScreen();
  };

  private handleVisibilityChange = (): void => {
    if (!this.targetDocument) return;
    if (this.targetDocument.visibilityState === 'hidden') {
      this.markOutScreen('Page visibility hidden');
    } else if (this.targetDocument.visibilityState === 'visible') {
      this.markReturnScreen();
    }
  };

  private markOutScreen(details: string): void {
    if (this.isOutScreen) return;
    this.isOutScreen = true;
    this.outScreenStartTime = Date.now();
    this.outScreenCount += 1;

    this.triggerViolation({
      type: 'out_screen',
      timestamp: Date.now(),
      details,
    });
  }

  private markReturnScreen(): void {
    if (!this.isOutScreen) return;
    if (this.outScreenStartTime) {
      const duration = Math.round((Date.now() - this.outScreenStartTime) / 1000);
      this.totalOutDurationSeconds += duration;
    }
    this.isOutScreen = false;
    this.outScreenStartTime = null;
  }

  private handleFullscreenChange = (): void => {
    if (!this.targetDocument) return;
    const isCurrentlyFullscreen = Boolean(this.targetDocument.fullscreenElement);

    if (this.wasFullscreen && !isCurrentlyFullscreen) {
      this.fullscreenExitCount += 1;
      this.triggerViolation({
        type: 'fullscreen_exit',
        timestamp: Date.now(),
        details: 'User exited fullscreen mode',
      });
    }

    this.wasFullscreen = isCurrentlyFullscreen;
  };

  private resetInactivityTimer = (): void => {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }

    if (!this.isStarted) return;

    this.inactivityTimer = setTimeout(() => {
      this.triggerViolation({
        type: 'inactivity',
        timestamp: Date.now(),
        details: `No interaction for ${Math.round(this.inactivityTimeoutMs / 1000)} seconds`,
      });
    }, this.inactivityTimeoutMs);
  };
}
