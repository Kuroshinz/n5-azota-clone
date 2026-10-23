export type ProctoringEventType =
  | 'out_screen'
  | 'fullscreen_exit'
  | 'inactivity'
  | 'blur'
  | 'visibility_hidden';

export interface ProctoringEvent {
  type: ProctoringEventType;
  timestamp: number;
  details?: string;
}

export interface ProctoringReport {
  outScreenCount: number;
  fullscreenExitCount: number;
  totalOutDurationSeconds: number;
  events: ProctoringEvent[];
}
