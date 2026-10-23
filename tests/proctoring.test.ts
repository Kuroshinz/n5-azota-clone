import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ProctoringSensor } from '../src/proctoring/ProctoringSensor';
import { ProctoringEvent } from '../src/types/proctoring';

describe('ProctoringSensor', () => {
  let mockWindow: any;
  let mockDocument: any;
  let windowListeners: Record<string, Function[]>;
  let docListeners: Record<string, Function[]>;

  beforeEach(() => {
    vi.useFakeTimers();

    windowListeners = {};
    docListeners = {};

    mockWindow = {
      addEventListener: vi.fn((event: string, handler: Function) => {
        if (!windowListeners[event]) windowListeners[event] = [];
        windowListeners[event].push(handler);
      }),
      removeEventListener: vi.fn((event: string, handler: Function) => {
        if (windowListeners[event]) {
          windowListeners[event] = windowListeners[event].filter(h => h !== handler);
        }
      }),
    };

    mockDocument = {
      visibilityState: 'visible',
      fullscreenElement: null,
      addEventListener: vi.fn((event: string, handler: Function) => {
        if (!docListeners[event]) docListeners[event] = [];
        docListeners[event].push(handler);
      }),
      removeEventListener: vi.fn((event: string, handler: Function) => {
        if (docListeners[event]) {
          docListeners[event] = docListeners[event].filter(h => h !== handler);
        }
      }),
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const fireWindowEvent = (event: string) => {
    (windowListeners[event] || []).forEach(fn => fn());
  };

  const fireDocEvent = (event: string) => {
    (docListeners[event] || []).forEach(fn => fn());
  };

  it('detects out_screen on window blur and counts duration upon focus', () => {
    const sensor = new ProctoringSensor({
      targetWindow: mockWindow,
      targetDocument: mockDocument,
    });

    const violations: ProctoringEvent[] = [];
    sensor.onViolation(e => violations.push(e));

    sensor.start();

    // Student clicks away from window (blur)
    fireWindowEvent('blur');

    expect(violations).toHaveLength(1);
    expect(violations[0].type).toBe('out_screen');

    // Advance 5 seconds
    vi.advanceTimersByTime(5000);

    // Student returns to window (focus)
    fireWindowEvent('focus');

    const report = sensor.getReport();
    expect(report.outScreenCount).toBe(1);
    expect(report.totalOutDurationSeconds).toBe(5);

    sensor.stop();
  });

  it('avoids double-counting out_screen when blur and visibilitychange occur together', () => {
    const sensor = new ProctoringSensor({
      targetWindow: mockWindow,
      targetDocument: mockDocument,
    });

    sensor.start();

    // Blur followed immediately by visibilitychange
    fireWindowEvent('blur');
    mockDocument.visibilityState = 'hidden';
    fireDocEvent('visibilitychange');

    expect(sensor.getReport().outScreenCount).toBe(1);

    vi.advanceTimersByTime(3000);

    // Return: visibility becomes visible and focus fires
    mockDocument.visibilityState = 'visible';
    fireDocEvent('visibilitychange');
    fireWindowEvent('focus');

    const report = sensor.getReport();
    expect(report.outScreenCount).toBe(1);
    expect(report.totalOutDurationSeconds).toBe(3);

    sensor.stop();
  });

  it('detects fullscreen_exit when user exits fullscreen mode', () => {
    const sensor = new ProctoringSensor({
      targetWindow: mockWindow,
      targetDocument: mockDocument,
    });

    const violations: ProctoringEvent[] = [];
    sensor.onViolation(e => violations.push(e));

    sensor.start();

    // Simulate entering fullscreen
    mockDocument.fullscreenElement = { id: 'exam-container' };
    fireDocEvent('fullscreenchange');

    expect(violations).toHaveLength(0);

    // Simulate exiting fullscreen (e.g. Esc key pressed)
    mockDocument.fullscreenElement = null;
    fireDocEvent('fullscreenchange');

    expect(violations).toHaveLength(1);
    expect(violations[0].type).toBe('fullscreen_exit');
    expect(sensor.getReport().fullscreenExitCount).toBe(1);

    sensor.stop();
  });

  it('detects user inactivity when no input is received within threshold', () => {
    const sensor = new ProctoringSensor({
      targetWindow: mockWindow,
      targetDocument: mockDocument,
      inactivityTimeoutMs: 10000,
    });

    const violations: ProctoringEvent[] = [];
    sensor.onViolation(e => violations.push(e));

    sensor.start();

    // Activity reset at 4s
    vi.advanceTimersByTime(4000);
    fireWindowEvent('mousemove');

    // Inactivity threshold reached 10s after last activity
    vi.advanceTimersByTime(9000);
    expect(violations).toHaveLength(0);

    vi.advanceTimersByTime(1000);
    expect(violations).toHaveLength(1);
    expect(violations[0].type).toBe('inactivity');

    sensor.stop();
  });

  it('cleans up event listeners when stopped', () => {
    const sensor = new ProctoringSensor({
      targetWindow: mockWindow,
      targetDocument: mockDocument,
    });

    sensor.start();
    sensor.stop();

    // Firing events should not update report
    fireWindowEvent('blur');
    expect(sensor.getReport().outScreenCount).toBe(0);
  });
});
