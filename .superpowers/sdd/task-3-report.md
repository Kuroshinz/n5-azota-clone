# Task 3 Report: Proctoring & Anti-Cheat Engine (Client-side Sensor)

## Overview
Successfully implemented the client-side ProctoringSensor class and React hook `useProctoring` providing real-time anti-cheat detection for tab switching, window blur, exiting fullscreen, and inactivity tracking.

## Files Created & Configured
1. **`src/proctoring/ProctoringSensor.ts`**:
   - Class `ProctoringSensor` supporting DOM event listeners on `window` and `document`.
   - Accurately tracks `out_screen` violations without duplicate counts if `blur` and `visibilitychange (hidden)` fire in tandem.
   - Computes precise elapsed duration in seconds upon returning (`focus` / `visibilitychange (visible)`).
   - Monitors `fullscreenchange` and logs `fullscreen_exit` events whenever the active fullscreen element is dismissed.
   - Implements inactivity timer monitoring touch, mouse, and keyboard interactions with configurable thresholds.
   - Clean lifecycle with `start()`, `stop()`, `onViolation()`, and `getReport()`.
2. **`src/hooks/useProctoring.ts`**:
   - Client-side React hook managing sensor state (`report`, `isOutScreen`, `isFullscreen`, `latestViolation`).
   - Includes `requestFullscreen()` utility helper for exam containers.
3. **`tests/proctoring.test.ts`**:
   - 5 comprehensive tests validating out-screen blur/focus duration calculation, double-event deduplication, fullscreen exit tracking, user inactivity detection, and listener cleanup.

## Verification Results
- **Test execution**: `npx vitest run tests/proctoring.test.ts`
  - Result: 5 passed (100%), 0 failed
- **Full Suite**: `npx vitest run`
  - Result: 15 passed across 3 test files, 0 failed
- **Typecheck**: `npx tsc --noEmit`
  - Result: Exit code 0, 0 errors
