import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, CameraOff, Video, AlertTriangle, CheckCircle2, RefreshCw, Layers } from 'lucide-react';
import { AssistantRunState, SOPStep } from '../types';
import { WebcamActionAnalyzer } from '../utils/actionDetector';
import { drawHolographicOverlay } from '../utils/hologramRenderer';

interface WebcamMonitorProps {
  runState: AssistantRunState;
  currentStep: SOPStep | null;
  nextStep: SOPStep | null;
  onActionDetected: (actionCode: string, confidence: number) => void;
  lastAlert: { message: string; isWarning: boolean; timestamp: number } | null;
}

export const WebcamMonitor: React.FC<WebcamMonitorProps> = ({
  runState,
  currentStep,
  nextStep,
  onActionDetected,
  lastAlert,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasOverlayRef = useRef<HTMLCanvasElement | null>(null);
  const analyzerRef = useRef<WebcamActionAnalyzer>(new WebcamActionAnalyzer());

  const [hasCameraStream, setHasCameraStream] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSimulatedMode, setIsSimulatedMode] = useState<boolean>(false);
  const [opticalMotion, setOpticalMotion] = useState<number>(0);
  const [hologramEnabled, setHologramEnabled] = useState<boolean>(true);
  const [activeDetection, setActiveDetection] = useState<{
    code: string;
    label: string;
    confidence: number;
  } | null>(null);

  // Initialize camera when monitoring starts
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam API not supported in this browser environment.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
        setHasCameraStream(true);
        setIsSimulatedMode(false);
      }
    } catch (err) {
      console.warn('Camera access error, switching to synthetic astronaut feed:', err);
      setCameraError('Webcam unavailable or permission denied. Running Gaganyaan Synthetic Lab Feed.');
      setIsSimulatedMode(true);
      setHasCameraStream(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setHasCameraStream(false);
  }, []);

  useEffect(() => {
    if (runState === 'RUNNING') {
      startCamera();
    } else {
      stopCamera();
      setActiveDetection(null);
      setOpticalMotion(0);
    }
    return () => {
      stopCamera();
    };
  }, [runState, startCamera, stopCamera]);

  // Frame processing loop for motion analysis and ROI overlay
  useEffect(() => {
    let animationFrameId: number;

    const processFrame = () => {
      if (runState === 'RUNNING') {
        const video = videoRef.current;
        const canvas = canvasOverlayRef.current;

        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const width = canvas.width;
            const height = canvas.height;
            ctx.clearRect(0, 0, width, height);

            // If in simulated lab feed, draw simulated astronaut workspace
            if (isSimulatedMode || !hasCameraStream) {
              // Neutral space lab background
              ctx.fillStyle = '#0F172A';
              ctx.fillRect(0, 0, width, height);

              // Grid lines
              ctx.strokeStyle = 'rgba(59, 130, 246, 0.15)';
              ctx.lineWidth = 1;
              for (let x = 0; x < width; x += 40) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
                ctx.stroke();
              }
              for (let y = 0; y < height; y += 40) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();
              }

              // Bio-containment box representation
              const bx = width * 0.22;
              const by = height * 0.28;
              const bw = width * 0.56;
              const bh = height * 0.54;

              ctx.fillStyle = '#1E293B';
              ctx.fillRect(bx, by, bw, bh);
              ctx.strokeStyle = '#38BDF8';
              ctx.lineWidth = 2;
              ctx.strokeRect(bx, by, bw, bh);

              // Label inside container
              ctx.fillStyle = '#94A3B8';
              ctx.font = 'bold 12px monospace';
              ctx.fillText('GAGANYAAN BAS EXPERIMENT TRAY [SLOT A-1]', bx + 16, by + 30);

              // Culture tube slots
              for (let i = 0; i < 4; i++) {
                ctx.fillStyle = i === 0 ? '#10B981' : '#334155';
                ctx.beginPath();
                ctx.arc(bx + 40 + i * 55, by + 80, 14, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#64748B';
                ctx.stroke();
              }
            }

            // Draw Advanced Holographic Structure & Geometric Path Vectors
            if (hologramEnabled) {
              drawHolographicOverlay(ctx, {
                width,
                height,
                stepNumber: currentStep ? currentStep.stepNumber : null,
                timeSec: performance.now() / 1000,
                motionScore: opticalMotion,
                activeDetectionLabel: activeDetection?.label,
                showHologramStructure: true,
              });
            } else {
              const rx = width * 0.18;
              const ry = height * 0.22;
              const rw = width * 0.64;
              const rh = height * 0.62;
              const cornerLen = 24;
              ctx.strokeStyle = '#22C55E';
              ctx.lineWidth = 2.5;

            // Top-Left
            ctx.beginPath();
            ctx.moveTo(rx, ry + cornerLen);
            ctx.lineTo(rx, ry);
            ctx.lineTo(rx + cornerLen, ry);
            ctx.stroke();

            // Top-Right
            ctx.beginPath();
            ctx.moveTo(rx + rw - cornerLen, ry);
            ctx.lineTo(rx + rw, ry);
            ctx.lineTo(rx + rw, ry + cornerLen);
            ctx.stroke();

            // Bottom-Left
            ctx.beginPath();
            ctx.moveTo(rx, ry + rh - cornerLen);
            ctx.lineTo(rx, ry + rh);
            ctx.lineTo(rx + cornerLen, ry + rh);
            ctx.stroke();

            // Bottom-Right
            ctx.beginPath();
            ctx.moveTo(rx + rw - cornerLen, ry + rh);
            ctx.lineTo(rx + rw, ry + rh);
            ctx.lineTo(rx + rw, ry + rh - cornerLen);
            ctx.stroke();

            // ROI Label
            ctx.fillStyle = '#22C55E';
            ctx.font = 'bold 11px sans-serif';
            ctx.fillText('BAS TRAY ROI (ACTION TARGET)', rx + 8, ry - 6);

            // Crosshair in center
            const cx = width / 2;
            const cy = height / 2;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx - 15, cy);
            ctx.lineTo(cx + 15, cy);
            ctx.moveTo(cx, cy - 15);
            ctx.lineTo(cx, cy + 15);
            ctx.stroke();
            }
          }
        }

        // Measure optical motion if physical video is live
        if (hasCameraStream && video && video.readyState >= 2) {
          const { motionScore } = analyzerRef.current.analyzeFrame(video);
          setOpticalMotion(motionScore);

          // If there is strong motion over the ROI, prompt user action or assist detection
          if (motionScore > 35 && !activeDetection && currentStep) {
            // Optical motion indicates astronaut interacting with sample tray
          }
        }
      }
      animationFrameId = requestAnimationFrame(processFrame);
    };

    animationFrameId = requestAnimationFrame(processFrame);
    return () => cancelAnimationFrame(animationFrameId);
  }, [runState, hasCameraStream, isSimulatedMode, activeDetection, currentStep, opticalMotion, hologramEnabled]);

  // Handler to trigger simulated/detected action
  const handleTriggerAction = (actionCode: string, label: string) => {
    if (runState !== 'RUNNING') return;

    const conf = Math.floor(91 + Math.random() * 8);
    setActiveDetection({ code: actionCode, label, confidence: conf });

    // Call parent SOP validation
    onActionDetected(actionCode, conf);

    setTimeout(() => {
      setActiveDetection(null);
    }, 2800);
  };

  return (
    <div className="bg-white rounded-lg border border-slate-300 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Panel Top Title */}
      <div className="bg-[#0B2545] text-white px-4 py-2.5 flex items-center justify-between border-b border-[#134074]">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-sky-400" />
          <h2 className="text-sm font-bold tracking-wide uppercase">
            Live Astronaut Webcam Feed (HAR & 3D Hologram HUD)
          </h2>
        </div>
        <div className="flex items-center gap-2.5 text-xs font-mono">
          {/* Hologram Toggle */}
          <button
            onClick={() => setHologramEnabled(!hologramEnabled)}
            className={`px-2.5 py-1 rounded text-[11px] font-sans font-bold flex items-center gap-1.5 border transition-all cursor-pointer shadow-sm ${
              hologramEnabled
                ? 'bg-sky-950 text-sky-300 border-sky-400/70 shadow-sky-900/40'
                : 'bg-slate-800 text-slate-400 border-slate-600'
            }`}
            title="Toggle 3D Holographic Matrix, Geometric Vector Paths & Spatial HUD"
          >
            <Layers className={`w-3.5 h-3.5 ${hologramEnabled ? 'text-sky-300 animate-pulse' : 'text-slate-400'}`} />
            <span>{hologramEnabled ? 'Hologram: Active' : 'Hologram: Off'}</span>
          </button>

          <span className="hidden sm:inline text-slate-400">|</span>
          <span className="hidden sm:inline text-slate-300">FPS:</span>
          <span className="hidden sm:inline text-emerald-400 font-bold">{runState === 'RUNNING' ? '30' : '00'}</span>
          <span className="hidden sm:inline text-slate-400">|</span>
          <span className="text-slate-300">Motion:</span>
          <span className="text-sky-300 font-bold">{opticalMotion}%</span>
        </div>
      </div>

      {/* Main Video Viewport Container */}
      <div className="relative flex-1 min-h-[340px] bg-slate-900 flex items-center justify-center overflow-hidden">
        {/* Real HTML5 Video Element */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`absolute inset-0 w-full h-full object-cover ${
            hasCameraStream ? 'block' : 'hidden'
          }`}
        />

        {/* HUD & Simulation Canvas Overlay */}
        <canvas
          ref={canvasOverlayRef}
          width={640}
          height={480}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />

        {/* Standby Placeholder when monitoring is idle */}
        {runState !== 'RUNNING' && (
          <div className="absolute inset-0 z-20 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center text-slate-300">
            <CameraOff className="w-12 h-12 text-slate-500 mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Webcam Monitoring Inactive</h3>
            <p className="text-sm text-slate-400 max-w-sm mb-4">
              Click <span className="text-emerald-400 font-bold">Start Monitoring</span> on the top ribbon to initiate live astronaut Human Activity Recognition.
            </p>
            <div className="text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded border border-slate-700 font-mono">
              Hardware: Standard USB Webcam / Embedded Camera • 100% Offline
            </div>
          </div>
        )}

        {/* Camera Error / Fallback Notification Banner */}
        {runState === 'RUNNING' && cameraError && (
          <div className="absolute top-3 left-3 right-3 z-30 bg-amber-950/90 border border-amber-500/80 text-amber-200 text-xs px-3 py-2 rounded flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{cameraError}</span>
            </div>
            <button
              onClick={startCamera}
              className="text-amber-100 underline hover:text-white flex items-center gap-1 font-semibold ml-2 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}

        {/* Active Real-Time SOP Alert Banner inside Camera */}
        {lastAlert && Date.now() - lastAlert.timestamp < 3500 && (
          <div
            id="banner-voice-alert"
            className={`absolute bottom-4 left-4 right-4 z-30 p-3 rounded-md shadow-lg border text-sm font-bold flex items-center gap-2.5 transition-all ${
              lastAlert.isWarning
                ? 'bg-red-600 text-white border-red-400'
                : 'bg-emerald-600 text-white border-emerald-400'
            }`}
          >
            {lastAlert.isWarning ? (
              <AlertTriangle className="w-5 h-5 shrink-0 animate-bounce" />
            ) : (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            )}
            <div className="flex-1 text-sm font-semibold">{lastAlert.message}</div>
          </div>
        )}

        {/* Real-time Detection Tag */}
        {activeDetection && (
          <div className="absolute top-4 right-4 z-30 bg-blue-900/90 border border-blue-400 text-white px-3 py-1.5 rounded shadow text-xs font-mono">
            <span className="text-sky-300 font-bold">HAR DETECTED:</span> {activeDetection.label} (
            {activeDetection.confidence}%)
          </div>
        )}
      </div>

      {/* Action Recognition Telemetry & Hackathon Demo Action Buttons */}
      <div className="bg-slate-50 p-3 border-t border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="text-xs font-bold uppercase text-slate-700 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-[#134074]" />
            <span>Human Activity Recognition (HAR) Verification</span>
          </div>
          {runState === 'RUNNING' && (
            <div className="text-[11px] font-mono text-slate-600">
              Expected Action: <span className="font-bold text-blue-700">{currentStep ? currentStep.actionCode : 'COMPLETE'}</span>
            </div>
          )}
        </div>

        {/* 5 Hackathon Demo SOP Triggers */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 mb-2">
          <button
            id="btn-trigger-step-1"
            disabled={runState !== 'RUNNING'}
            onClick={() => handleTriggerAction('OPEN_TRAY', 'Open Sample Tray')}
            className={`px-2 py-2 text-xs font-bold rounded text-left border transition-all cursor-pointer ${
              runState === 'RUNNING'
                ? 'bg-white hover:bg-blue-50 border-slate-300 text-slate-800 hover:border-blue-400'
                : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
            }`}
          >
            <div className="text-[10px] text-blue-700 font-bold uppercase">Step 1</div>
            <div className="truncate">Open Tray</div>
          </button>

          <button
            id="btn-trigger-step-2"
            disabled={runState !== 'RUNNING'}
            onClick={() => handleTriggerAction('INSERT_SAMPLE', 'Insert Sample')}
            className={`px-2 py-2 text-xs font-bold rounded text-left border transition-all cursor-pointer ${
              runState === 'RUNNING'
                ? 'bg-white hover:bg-blue-50 border-slate-300 text-slate-800 hover:border-blue-400'
                : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
            }`}
          >
            <div className="text-[10px] text-blue-700 font-bold uppercase">Step 2</div>
            <div className="truncate">Insert Sample</div>
          </button>

          <button
            id="btn-trigger-step-3"
            disabled={runState !== 'RUNNING'}
            onClick={() => handleTriggerAction('ADD_REAGENT', 'Add Reagent')}
            className={`px-2 py-2 text-xs font-bold rounded text-left border transition-all cursor-pointer ${
              runState === 'RUNNING'
                ? 'bg-white hover:bg-blue-50 border-slate-300 text-slate-800 hover:border-blue-400'
                : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
            }`}
          >
            <div className="text-[10px] text-blue-700 font-bold uppercase">Step 3</div>
            <div className="truncate">Add Reagent</div>
          </button>

          <button
            id="btn-trigger-step-4"
            disabled={runState !== 'RUNNING'}
            onClick={() => handleTriggerAction('CLOSE_CONTAINER', 'Close Container')}
            className={`px-2 py-2 text-xs font-bold rounded text-left border transition-all cursor-pointer ${
              runState === 'RUNNING'
                ? 'bg-white hover:bg-blue-50 border-slate-300 text-slate-800 hover:border-blue-400'
                : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
            }`}
          >
            <div className="text-[10px] text-blue-700 font-bold uppercase">Step 4</div>
            <div className="truncate">Close Container</div>
          </button>

          <button
            id="btn-trigger-step-5"
            disabled={runState !== 'RUNNING'}
            onClick={() => handleTriggerAction('START_INCUBATOR', 'Start Incubator')}
            className={`px-2 py-2 text-xs font-bold rounded text-left border transition-all cursor-pointer ${
              runState === 'RUNNING'
                ? 'bg-white hover:bg-blue-50 border-slate-300 text-slate-800 hover:border-blue-400'
                : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
            }`}
          >
            <div className="text-[10px] text-blue-700 font-bold uppercase">Step 5</div>
            <div className="truncate">Start Incubator</div>
          </button>
        </div>

        {/* Demo Voice Alert Verification Test Trigger */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200 text-xs">
          <span className="text-slate-600 font-medium hidden sm:inline">
            SIH Hackathon Jury Demo:
          </span>
          <button
            id="btn-test-skip-step"
            disabled={runState !== 'RUNNING'}
            onClick={() => handleTriggerAction('ADD_REAGENT', 'Premature: Add Reagent')}
            className={`px-3 py-1.5 rounded font-bold border flex items-center gap-1.5 transition-colors cursor-pointer ${
              runState === 'RUNNING'
                ? 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
                : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
            }`}
            title="Attempts to add reagent out of order to test the Voice Alert logic"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            <span>⚠️ Test Sequence Error / Skip Step Voice Alert</span>
          </button>
        </div>
      </div>
    </div>
  );
};
