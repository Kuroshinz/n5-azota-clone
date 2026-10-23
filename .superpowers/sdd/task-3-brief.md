# Task 3 Brief: Proctoring & Anti-Cheat Engine (Client-side Sensor)

## Goal
Implement client-side anti-cheat telemetry sensor and React hook that detect tab switching, window blur, exiting fullscreen, and inactivity, and aggregate them into a `ProctoringReport`.

## Files to Create
- `D:/Download/azota-clone/src/proctoring/ProctoringSensor.ts`
- `D:/Download/azota-clone/src/hooks/useProctoring.ts`
- `D:/Download/azota-clone/tests/proctoring.test.ts`

## Requirements
1. `src/proctoring/ProctoringSensor.ts`:
   - Class `ProctoringSensor` with methods:
     - `start()`: registers listeners for `visibilitychange`, `blur`, `focus`, `fullscreenchange` on `window` and `document`.
     - `stop()`: cleans up all event listeners and timers.
     - `onViolation(callback: (event: ProctoringEvent) => void): () => void`: registers a callback for when an anti-cheat event occurs.
     - `getReport(): ProctoringReport`: returns current counts (`outScreenCount`, `fullscreenExitCount`, `totalOutDurationSeconds`, `events`).
     - Tracks `out_screen`:
       - Triggered when `document.visibilityState === 'hidden'` or `blur` event fires.
       - Records duration when user returns (`focus` or `visibilityState === 'visible'`).
     - Tracks `fullscreen_exit`:
       - Triggered when `!document.fullscreenElement` when fullscreen was previously active.
     - Tracks `inactivity`:
       - Triggered after configurable inactive threshold without user interaction.
2. `src/hooks/useProctoring.ts`:
   - React hook `useProctoring(options?: ProctoringOptions)`
3. `tests/proctoring.test.ts`:
   - Unit tests verifying violation tracking and report generation.
