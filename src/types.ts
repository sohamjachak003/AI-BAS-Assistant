export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'warning';

export interface SOPStep {
  id: number;
  stepNumber: number;
  title: string;
  description: string;
  actionCode: string;
  expectedObject: string;
  hazardNote?: string;
  status: StepStatus;
  completedAt?: string;
}

export type LogStatus = 'COMPLETED' | 'WARNING' | 'INFO' | 'ACTION_DETECTED';

export interface MissionLogEntry {
  id: string;
  timestamp: string;
  isoTime: string;
  stepNumber: number | null;
  action: string;
  status: LogStatus;
  message: string;
  confidence?: number;
}

export type AssistantRunState = 'IDLE' | 'RUNNING' | 'STOPPED' | 'COMPLETED';

export interface DetectionResult {
  actionCode: string;
  actionName: string;
  confidence: number;
  timestamp: string;
  motionIntensity: number;
}
