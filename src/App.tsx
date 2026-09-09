import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { SOPList } from './components/SOPList';
import { WebcamMonitor } from './components/WebcamMonitor';
import { ActivityLog } from './components/ActivityLog';
import { PythonModal } from './components/PythonModal';
import { INITIAL_SOP_STEPS } from './data/sopData';
import { SOPStep, MissionLogEntry, AssistantRunState } from './types';
import { audioAlert } from './utils/speech';

export default function App() {
  const [runState, setRunState] = useState<AssistantRunState>('IDLE');
  const [steps, setSteps] = useState<SOPStep[]>(INITIAL_SOP_STEPS);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [logs, setLogs] = useState<MissionLogEntry[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPythonModalOpen, setIsPythonModalOpen] = useState<boolean>(false);
  const [lastAlert, setLastAlert] = useState<{
    message: string;
    isWarning: boolean;
    timestamp: number;
  } | null>(null);

  // Initial startup log
  useEffect(() => {
    const startupEntry: MissionLogEntry = {
      id: 'log-startup',
      timestamp: new Date().toLocaleTimeString('en-GB'),
      isoTime: new Date().toISOString(),
      stepNumber: null,
      action: 'SYSTEM_INITIALIZATION',
      status: 'INFO',
      message: 'AI BAS Assistant initialized in offline environment. Ready for SOP verification.',
    };
    setLogs([startupEntry]);
  }, []);

  const addLog = useCallback(
    (
      stepNumber: number | null,
      action: string,
      status: 'COMPLETED' | 'WARNING' | 'INFO',
      message: string,
      confidence?: number
    ) => {
      const newEntry: MissionLogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toLocaleTimeString('en-GB'),
        isoTime: new Date().toISOString(),
        stepNumber,
        action,
        status,
        message,
        confidence,
      };
      setLogs((prev) => [newEntry, ...prev]);
    },
    []
  );

  // Toggle audio mute
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioAlert.setMuted(nextMuted);
  };

  // Start Monitoring
  const handleStart = () => {
    setRunState('RUNNING');
    const firstStep = steps[currentStepIndex] || steps[0];
    addLog(
      firstStep.stepNumber,
      'MONITORING_START',
      'INFO',
      `Webcam surveillance activated. Awaiting Step ${firstStep.stepNumber}: ${firstStep.title}.`
    );
    audioAlert.speak(
      `Monitoring activated. Astronaut, please perform Step ${firstStep.stepNumber}: ${firstStep.title}.`
    );
  };

  // Stop Monitoring
  const handleStop = () => {
    setRunState('STOPPED');
    addLog(null, 'MONITORING_STOP', 'INFO', 'Webcam activity monitoring suspended by operator.');
    audioAlert.playTone('info');
  };

  // Reset Experiment
  const handleReset = () => {
    setRunState('IDLE');
    setCurrentStepIndex(0);
    setSteps(
      INITIAL_SOP_STEPS.map((s, idx) => ({
        ...s,
        status: idx === 0 ? 'in_progress' : 'pending',
        completedAt: undefined,
      }))
    );
    setLastAlert(null);
    addLog(null, 'RESET_PROTOCOL', 'INFO', 'Experiment SOP protocol reset to initial state.');
  };

  // Save Log as JSON (Downloads file directly to astronaut's machine)
  const handleSaveLog = () => {
    if (logs.length === 0) return;

    const dataStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `bas_mission_log_${dateStr}.json`;

    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);

    addLog(null, 'LOG_EXPORTED', 'INFO', `Protocol telemetry exported to ${filename}.`);
  };

  // AI Human Activity Recognition & SOP Verification Logic
  const handleActionDetected = (actionCode: string, confidence: number) => {
    if (runState !== 'RUNNING') return;

    const expectedStep = steps[currentStepIndex];

    if (!expectedStep) {
      // Already finished
      return;
    }

    // Find which step in SOP corresponds to the detected action
    const matchedStepIndex = steps.findIndex((s) => s.actionCode === actionCode);
    const matchedStep = matchedStepIndex !== -1 ? steps[matchedStepIndex] : null;

    if (matchedStep && matchedStep.stepNumber === expectedStep.stepNumber) {
      // -------------------------------------------------------------
      // CORRECT ACTION: Mark current step completed, suggest next step
      // -------------------------------------------------------------
      const timeStr = new Date().toLocaleTimeString('en-GB');

      const nextIndex = currentStepIndex + 1;
      const isLastStep = nextIndex >= steps.length;
      const nextStepObj = !isLastStep ? steps[nextIndex] : null;

      // Update steps status
      setSteps((prev) =>
        prev.map((step, idx) => {
          if (idx === currentStepIndex) {
            return { ...step, status: 'completed', completedAt: timeStr };
          }
          if (idx === nextIndex) {
            return { ...step, status: 'in_progress' };
          }
          return step;
        })
      );

      setCurrentStepIndex(nextIndex);

      if (isLastStep) {
        setRunState('COMPLETED');
        const alertMsg = `Mission SOP Complete: All 5 BAS steps verified!`;
        setLastAlert({ message: alertMsg, isWarning: false, timestamp: Date.now() });
        addLog(
          expectedStep.stepNumber,
          actionCode,
          'COMPLETED',
          `Step ${expectedStep.stepNumber} (${expectedStep.title}) verified. Protocol 100% completed.`,
          confidence
        );
        audioAlert.speakStepCompleted(expectedStep.stepNumber, expectedStep.title);
      } else {
        const alertMsg = `Step ${expectedStep.stepNumber} Verified: ${expectedStep.title}`;
        setLastAlert({ message: alertMsg, isWarning: false, timestamp: Date.now() });
        addLog(
          expectedStep.stepNumber,
          actionCode,
          'COMPLETED',
          `Step ${expectedStep.stepNumber} (${expectedStep.title}) verified successfully.`,
          confidence
        );
        audioAlert.speakStepCompleted(
          expectedStep.stepNumber,
          expectedStep.title,
          nextStepObj?.title
        );
      }
    } else {
      // -------------------------------------------------------------
      // WRONG ACTION / SKIPPED STEP: Trigger Voice Alert & Warning Log
      // -------------------------------------------------------------
      const warningText = `Warning! Please complete Step ${expectedStep.stepNumber} first.`;
      const detailedMsg = `Sequence Violation! Detected: ${
        matchedStep ? `Step ${matchedStep.stepNumber} (${matchedStep.title})` : actionCode
      } before completing Step ${expectedStep.stepNumber} (${expectedStep.title}).`;

      setLastAlert({ message: warningText, isWarning: true, timestamp: Date.now() });

      // Mark the expected step as warning temporarily
      setSteps((prev) =>
        prev.map((s, idx) => (idx === currentStepIndex ? { ...s, status: 'warning' } : s))
      );

      addLog(expectedStep.stepNumber, actionCode, 'WARNING', detailedMsg, confidence);

      // Trigger offline voice alert
      audioAlert.speakWarning(expectedStep.stepNumber, expectedStep.title);
    }
  };

  const currentStep = currentStepIndex < steps.length ? steps[currentStepIndex] : null;
  const nextStep = currentStepIndex + 1 < steps.length ? steps[currentStepIndex + 1] : null;

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-slate-900 flex flex-col font-sans select-none">
      {/* ISRO Top Header & Mission Control Ribbon */}
      <Header
        runState={runState}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onStart={handleStart}
        onStop={handleStop}
        onReset={handleReset}
        onSaveLog={handleSaveLog}
        onOpenPythonModal={() => setIsPythonModalOpen(true)}
        totalLogsCount={logs.length}
      />

      {/* Main Single Dashboard Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Predefined SOP Protocol (Steps 1 to 5) */}
        <div className="lg:col-span-4 flex flex-col min-h-[480px]">
          <SOPList
            steps={steps}
            currentStepIndex={currentStepIndex}
            runState={runState}
          />
        </div>

        {/* Center Column: Live Astronaut Webcam Feed (Activity Recognition) */}
        <div className="lg:col-span-5 flex flex-col min-h-[480px]">
          <WebcamMonitor
            runState={runState}
            currentStep={currentStep}
            nextStep={nextStep}
            onActionDetected={handleActionDetected}
            lastAlert={lastAlert}
          />
        </div>

        {/* Right Column: Real-time Timestamp Audit Log */}
        <div className="lg:col-span-3 flex flex-col min-h-[480px]">
          <ActivityLog logs={logs} onSaveLog={handleSaveLog} />
        </div>
      </main>

      {/* Clean Mission Footer */}
      <footer className="bg-white border-t border-slate-300 py-2.5 px-4 text-center text-xs text-slate-600">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#0B2545]">ISRO Gaganyaan Mission Support</span>
            <span className="text-slate-300">|</span>
            <span>Biological Activity System (BAS) Experiment Protocol</span>
          </div>
          <div className="flex items-center gap-3 text-slate-500 font-mono text-[11px]">
            <span>100% Offline AI Action Recognition</span>
            <span>•</span>
            <span>Smart India Hackathon 2026</span>
          </div>
        </div>
      </footer>

      {/* Python Desktop Code Modal */}
      <PythonModal
        isOpen={isPythonModalOpen}
        onClose={() => setIsPythonModalOpen(false)}
      />
    </div>
  );
}
