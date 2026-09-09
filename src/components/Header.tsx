import React from 'react';
import { Play, Square, RotateCcw, Download, Code2, Volume2, VolumeX, ShieldCheck, Activity } from 'lucide-react';
import { AssistantRunState } from '../types';

interface HeaderProps {
  runState: AssistantRunState;
  isMuted: boolean;
  onToggleMute: () => void;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onSaveLog: () => void;
  onOpenPythonModal: () => void;
  totalLogsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  runState,
  isMuted,
  onToggleMute,
  onStart,
  onStop,
  onReset,
  onSaveLog,
  onOpenPythonModal,
  totalLogsCount,
}) => {
  return (
    <header className="bg-[#0B2545] text-white border-b-4 border-[#134074] shadow-md select-none">
      {/* Top ISRO Mission Banner */}
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Emblem & Mission Titles */}
        <div className="flex items-center gap-3.5">
          {/* ISRO/Gaganyaan Inspired Emblem */}
          <div className="w-12 h-12 rounded-lg bg-[#134074] border border-[#3B82F6]/40 flex items-center justify-center p-1 shadow-inner shrink-0">
            <div className="w-full h-full rounded border border-amber-400/50 flex flex-col items-center justify-center text-center">
              <span className="text-[9px] font-black tracking-widest text-amber-300">ISRO</span>
              <span className="text-[8px] font-bold text-sky-200">BAS</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans uppercase">
                AI BAS Assistant
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold bg-[#1E3A8A] text-sky-200 rounded border border-blue-400/30">
                SIH 2026
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              Biological Activity System • Astronaut SOP Action Verification Engine
            </p>
          </div>
        </div>

        {/* Right: Telemetry Badges */}
        <div className="flex items-center gap-2.5">
          {/* Offline / Air-Gapped Pill */}
          <div
            id="badge-offline-status"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0F2A4A] border border-blue-900/60 text-sky-200 text-xs font-semibold"
            title="All CV models and audio operate strictly locally on device"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% Offline</span>
          </div>

          {/* Assistant Status Badge */}
          <div
            id="badge-run-status"
            className={`flex items-center gap-1.5 px-3 py-1 rounded font-bold text-xs tracking-wider border ${
              runState === 'RUNNING'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 animate-pulse'
                : runState === 'COMPLETED'
                ? 'bg-sky-950/80 text-sky-300 border-sky-400/50'
                : runState === 'STOPPED'
                ? 'bg-red-950/80 text-red-300 border-red-500/50'
                : 'bg-slate-800 text-amber-300 border-amber-500/40'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                runState === 'RUNNING'
                  ? 'bg-emerald-400'
                  : runState === 'COMPLETED'
                  ? 'bg-sky-400'
                  : runState === 'STOPPED'
                  ? 'bg-red-400'
                  : 'bg-amber-400'
              }`}
            />
            {runState === 'RUNNING'
              ? 'MONITORING ACTIVE'
              : runState === 'COMPLETED'
              ? 'EXPERIMENT COMPLETE'
              : runState === 'STOPPED'
              ? 'MONITORING STOPPED'
              : 'SYSTEM STANDBY'}
          </div>

          {/* Sound Mute Toggle */}
          <button
            id="btn-toggle-sound"
            onClick={onToggleMute}
            className={`p-2 rounded border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isMuted
                ? 'bg-red-900/40 text-red-200 border-red-700/60 hover:bg-red-900/60'
                : 'bg-[#134074] text-sky-200 border-blue-500/30 hover:bg-[#1e4d8a]'
            }`}
            title={isMuted ? 'Voice Alert Muted' : 'Voice Alert Enabled'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span className="hidden md:inline">{isMuted ? 'Muted' : 'Voice On'}</span>
          </button>
        </div>
      </div>

      {/* Action Control Ribbon (Clean High-Contrast ISRO Nav) */}
      <div className="bg-[#081B33] px-4 py-2 sm:px-6 border-t border-[#163863]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {runState !== 'RUNNING' ? (
              <button
                id="btn-start-monitoring"
                onClick={onStart}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-bold tracking-wide transition-colors shadow-sm cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Monitoring</span>
              </button>
            ) : (
              <button
                id="btn-stop-monitoring"
                onClick={onStop}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-sm font-bold tracking-wide transition-colors shadow-sm cursor-pointer"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>Stop Monitoring</span>
              </button>
            )}

            <button
              id="btn-reset-protocol"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium transition-colors cursor-pointer"
              title="Reset experiment steps to Step 1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              id="btn-save-log"
              onClick={onSaveLog}
              disabled={totalLogsCount === 0}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-sm font-bold transition-colors cursor-pointer ${
                totalLogsCount > 0
                  ? 'bg-[#1D4ED8] hover:bg-[#1e40af] text-white'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
              title="Download full experiment logs as JSON"
            >
              <Download className="w-4 h-4" />
              <span>Save Log (JSON)</span>
            </button>
          </div>

          {/* Python Desktop Code Modal Trigger */}
          <div className="flex items-center gap-2">
            <button
              id="btn-view-python-code"
              onClick={onOpenPythonModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#134074] hover:bg-[#1b4d8a] text-sky-200 hover:text-white border border-blue-400/40 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              <Code2 className="w-4 h-4 text-amber-300" />
              <span>Python Desktop Code (SIH Demo)</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
