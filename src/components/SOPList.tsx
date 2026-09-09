import React from 'react';
import { CheckCircle2, Clock, AlertCircle, ArrowRight, ClipboardList, ShieldAlert, Info } from 'lucide-react';
import { SOPStep, AssistantRunState } from '../types';

interface SOPListProps {
  steps: SOPStep[];
  currentStepIndex: number;
  runState: AssistantRunState;
  onSelectStepManual?: (index: number) => void;
}

export const SOPList: React.FC<SOPListProps> = ({
  steps,
  currentStepIndex,
  runState,
}) => {
  const totalSteps = steps.length;
  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);

  const activeStep = currentStepIndex < totalSteps ? steps[currentStepIndex] : null;
  const nextStep = currentStepIndex + 1 < totalSteps ? steps[currentStepIndex + 1] : null;

  return (
    <div className="bg-white rounded-lg border border-slate-300 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Panel Header */}
      <div className="bg-[#0B2545] text-white px-4 py-2.5 flex items-center justify-between border-b border-[#134074]">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-sky-400" />
          <h2 className="text-sm font-bold tracking-wide uppercase">
            Experiment SOP Protocol
          </h2>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#134074] text-sky-200">
          Step {Math.min(currentStepIndex + 1, totalSteps)} of {totalSteps}
        </span>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        {/* Progress Bar Section */}
        <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
            <span className="uppercase tracking-wider">Protocol Completion</span>
            <span className="text-[#0B2545] font-mono text-sm">{completedCount} / {totalSteps} ({progressPercent}%)</span>
          </div>
          {/* High-visibility Progress Bar */}
          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                progressPercent === 100 ? 'bg-emerald-600' : 'bg-[#1D4ED8]'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Current Active Step Box (Large, High Visibility) */}
        {activeStep ? (
          <div className="bg-[#EFF6FF] border-2 border-[#1D4ED8] rounded-md p-3.5 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1D4ED8] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#1D4ED8] animate-ping" />
                Current Step: Step {activeStep.stepNumber}
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                ACTION REQUIRED
              </span>
            </div>

            <h3 className="text-lg font-black text-[#0B2545] leading-tight mb-1">
              {activeStep.title}
            </h3>

            <p className="text-sm text-slate-700 font-medium leading-normal mb-2.5">
              {activeStep.description}
            </p>

            {/* Astronaut Briefing Instruction for In-Progress Step */}
            {activeStep.briefing && (
              <div className="flex items-start gap-2 p-2.5 rounded bg-sky-50/90 border border-sky-300 text-sky-950 text-xs font-medium mb-2.5 shadow-xs">
                <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-sky-800 mb-0.5">
                    Astronaut Briefing Directive
                  </div>
                  <div className="text-slate-800 leading-relaxed">
                    {activeStep.briefing}
                  </div>
                </div>
              </div>
            )}

            {activeStep.hazardNote && (
              <div className="flex items-start gap-1.5 p-2 rounded bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Safety Note: {activeStep.hazardNote}</span>
              </div>
            )}
          </div>
        ) : (
          /* All Steps Complete State */
          <div className="bg-emerald-50 border-2 border-emerald-600 rounded-md p-4 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <h3 className="text-lg font-black text-emerald-950">BAS Experiment Completed</h3>
            <p className="text-xs text-emerald-800 font-medium mt-1">
              All 5 SOP stages verified by Computer Vision. Biological activity telemetry active.
            </p>
          </div>
        )}

        {/* Next Step Suggestion (As explicitly requested in prompt) */}
        <div className="bg-slate-100 rounded-md p-3 border border-slate-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-[#134074] shrink-0" />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Next Step Suggestion
              </div>
              <div className="text-xs font-bold text-slate-900">
                {nextStep ? `Step ${nextStep.stepNumber}: ${nextStep.title}` : 'Incubation Telemetry Phase'}
              </div>
            </div>
          </div>
          {nextStep && (
            <span className="text-[10px] font-mono text-slate-500">
              Queued
            </span>
          )}
        </div>

        {/* Complete Step Sequence (Steps 1 to 5) */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Standard Operating Procedure (SOP)
          </h4>
          <div className="space-y-2">
            {steps.map((step, idx) => {
              const isCurrent = idx === currentStepIndex && runState === 'RUNNING';
              const isCompleted = step.status === 'completed';
              const isWarning = step.status === 'warning';

              return (
                <div
                  key={step.id}
                  id={`sop-step-card-${step.stepNumber}`}
                  className={`p-2.5 rounded-md border text-xs transition-colors ${
                    isCurrent
                      ? 'bg-blue-50 border-blue-400 font-semibold'
                      : isCompleted
                      ? 'bg-emerald-50/60 border-emerald-300'
                      : isWarning
                      ? 'bg-red-50 border-red-300'
                      : 'bg-white border-slate-200 opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-600 text-white'
                            : isCurrent
                            ? 'bg-[#1D4ED8] text-white'
                            : isWarning
                            ? 'bg-red-600 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isCompleted ? '✓' : step.stepNumber}
                      </span>
                      <span
                        className={`font-bold ${
                          isCompleted
                            ? 'text-emerald-900 line-through'
                            : isCurrent
                            ? 'text-blue-950 font-black'
                            : 'text-slate-800'
                        }`}
                      >
                        Step {step.stepNumber}: {step.title}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isCompleted
                          ? 'bg-emerald-200/80 text-emerald-900'
                          : isCurrent
                          ? 'bg-blue-200 text-blue-900 animate-pulse'
                          : isWarning
                          ? 'bg-red-200 text-red-900'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {step.status === 'completed'
                        ? 'Completed'
                        : isCurrent
                        ? 'In Progress'
                        : step.status === 'warning'
                        ? 'Alert'
                        : 'Pending'}
                    </span>
                  </div>

                  {step.status === 'in_progress' && step.briefing && (
                    <div className="mt-2 ml-7 p-2 rounded bg-sky-100/70 border border-sky-200 text-[11px] text-sky-950 font-normal leading-relaxed">
                      <span className="font-bold text-sky-800 uppercase text-[9px] block">Briefing:</span>
                      {step.briefing}
                    </div>
                  )}

                  {step.completedAt && (
                    <div className="text-[10px] text-emerald-700 mt-1 pl-7 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Verified at {step.completedAt}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
