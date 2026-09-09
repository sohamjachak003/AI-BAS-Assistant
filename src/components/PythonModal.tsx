import React, { useState } from 'react';
import { X, Copy, Check, Download, FileCode, Terminal, BookOpen } from 'lucide-react';
import { PYTHON_MAIN_CODE, PYTHON_REQUIREMENTS, PYTHON_README } from '../data/pythonCode';

interface PythonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PythonModal: React.FC<PythonModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'main' | 'req' | 'readme'>('main');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentContent =
    activeTab === 'main'
      ? PYTHON_MAIN_CODE
      : activeTab === 'req'
      ? PYTHON_REQUIREMENTS
      : PYTHON_README;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownload = () => {
    const filename =
      activeTab === 'main'
        ? 'main.py'
        : activeTab === 'req'
        ? 'requirements.txt'
        : 'README.md';

    const blob = new Blob([currentContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-slate-300 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="bg-[#0B2545] text-white px-5 py-3 flex items-center justify-between border-b border-[#134074]">
          <div className="flex items-center gap-2.5">
            <FileCode className="w-5 h-5 text-amber-300" />
            <div>
              <h3 className="font-bold text-base">
                Python Desktop Project (Tkinter + OpenCV + pyttsx3)
              </h3>
              <p className="text-xs text-sky-200">
                Offline Desktop Application for Smart India Hackathon 2026
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection Bar */}
        <div className="bg-slate-100 px-5 py-2 border-b border-slate-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('main')}
              className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'main'
                  ? 'bg-[#0B2545] text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-amber-400" />
              <span>main.py (GUI + OpenCV)</span>
            </button>

            <button
              onClick={() => setActiveTab('req')}
              className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'req'
                  ? 'bg-[#0B2545] text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>requirements.txt</span>
            </button>

            <button
              onClick={() => setActiveTab('readme')}
              className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'readme'
                  ? 'bg-[#0B2545] text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>README.md (SIH Guide)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded bg-[#1D4ED8] hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>

        {/* Code Viewer */}
        <div className="flex-1 bg-slate-950 p-4 overflow-auto">
          <pre className="text-emerald-400 font-mono text-xs leading-relaxed whitespace-pre font-normal">
            {currentContent}
          </pre>
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 px-5 py-2.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>Run locally: <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-slate-900">python main.py</code></span>
          <span className="text-emerald-700 font-semibold">100% Offline • Zero Cloud Dependencies</span>
        </div>
      </div>
    </div>
  );
};
