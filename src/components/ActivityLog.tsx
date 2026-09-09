import React, { useState } from 'react';
import { FileText, CheckCircle, AlertTriangle, Info, Download, Trash2, Code } from 'lucide-react';
import { MissionLogEntry } from '../types';

interface ActivityLogProps {
  logs: MissionLogEntry[];
  onSaveLog: () => void;
  onClearLogs?: () => void;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ logs, onSaveLog }) => {
  const [filter, setFilter] = useState<'ALL' | 'COMPLETED' | 'WARNING'>('ALL');
  const [showJsonPreview, setShowJsonPreview] = useState<boolean>(false);

  const filteredLogs = logs.filter((log) => {
    if (filter === 'ALL') return true;
    return log.status === filter;
  });

  return (
    <div className="bg-white rounded-lg border border-slate-300 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Panel Header */}
      <div className="bg-[#0B2545] text-white px-4 py-2.5 flex items-center justify-between border-b border-[#134074]">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-sky-400" />
          <h2 className="text-sm font-bold tracking-wide uppercase">
            Protocol Audit Log
          </h2>
        </div>
        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#134074] text-sky-200">
          {logs.length} Events
        </span>
      </div>

      {/* Filter and JSON quick toggle bar */}
      <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-xs">
          <button
            id="btn-filter-all"
            onClick={() => setFilter('ALL')}
            className={`px-2 py-1 rounded font-semibold cursor-pointer ${
              filter === 'ALL'
                ? 'bg-[#0B2545] text-white'
                : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            All ({logs.length})
          </button>
          <button
            id="btn-filter-completed"
            onClick={() => setFilter('COMPLETED')}
            className={`px-2 py-1 rounded font-semibold cursor-pointer ${
              filter === 'COMPLETED'
                ? 'bg-emerald-700 text-white'
                : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-slate-300'
            }`}
          >
            Completed ({logs.filter((l) => l.status === 'COMPLETED').length})
          </button>
          <button
            id="btn-filter-warning"
            onClick={() => setFilter('WARNING')}
            className={`px-2 py-1 rounded font-semibold cursor-pointer ${
              filter === 'WARNING'
                ? 'bg-red-700 text-white'
                : 'bg-white text-red-800 hover:bg-red-50 border border-slate-300'
            }`}
          >
            Warnings ({logs.filter((l) => l.status === 'WARNING').length})
          </button>
        </div>

        <button
          id="btn-toggle-json-preview"
          onClick={() => setShowJsonPreview(!showJsonPreview)}
          className="text-xs font-medium text-slate-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          title="Inspect raw JSON structure"
        >
          <Code className="w-3.5 h-3.5" />
          <span>{showJsonPreview ? 'Hide JSON' : 'JSON Preview'}</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3">
        {showJsonPreview ? (
          <div className="h-full bg-slate-900 text-emerald-400 p-3 rounded font-mono text-xs overflow-auto">
            <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-700">
              <span className="text-slate-400 font-bold">bas_experiment_log.json Preview</span>
              <button
                onClick={onSaveLog}
                className="text-sky-300 hover:text-white flex items-center gap-1 font-sans cursor-pointer text-xs"
              >
                <Download className="w-3 h-3" /> Download JSON
              </button>
            </div>
            <pre className="whitespace-pre-wrap">{JSON.stringify(logs, null, 2)}</pre>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <FileText className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">No events logged yet</p>
            <p className="text-xs text-slate-400 max-w-xs mt-1">
              Actions detected from the webcam feed or triggered in the simulator will appear here with live timestamps.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLogs.map((entry) => {
              const isCompleted = entry.status === 'COMPLETED';
              const isWarning = entry.status === 'WARNING';
              const isInfo = entry.status === 'INFO';

              return (
                <div
                  key={entry.id}
                  id={`log-entry-${entry.id}`}
                  className={`p-2.5 rounded border text-xs transition-colors ${
                    isCompleted
                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                      : isWarning
                      ? 'bg-red-50 border-red-300 text-red-950'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5">
                      {isCompleted && <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                      {isWarning && <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />}
                      {isInfo && <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />}

                      <span
                        className={`font-mono font-bold text-[10px] px-1.5 py-0.5 rounded ${
                          isCompleted
                            ? 'bg-emerald-200 text-emerald-900'
                            : isWarning
                            ? 'bg-red-200 text-red-900'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        [{entry.status}]
                      </span>

                      {entry.stepNumber && (
                        <span className="font-semibold text-slate-600 text-[11px]">
                          Step {entry.stepNumber}
                        </span>
                      )}
                    </div>

                    <span className="font-mono text-slate-500 text-[11px]">{entry.timestamp}</span>
                  </div>

                  <p className="text-xs font-medium pl-5 leading-relaxed">{entry.message}</p>

                  {entry.confidence && (
                    <div className="pl-5 mt-1 text-[10px] text-slate-500 font-mono">
                      HAR Confidence: {entry.confidence}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Export Bar */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <span className="text-xs text-slate-500 font-mono">
          Format: JSON (ISO 8601 Timestamps)
        </span>
        <button
          id="btn-bottom-save-log"
          onClick={onSaveLog}
          disabled={logs.length === 0}
          className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
            logs.length > 0
              ? 'bg-[#0B2545] hover:bg-[#134074] text-white'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Save Log (JSON)</span>
        </button>
      </div>
    </div>
  );
};
