import React, { useState } from 'react';
import { Header } from '../components/Header';
import { ControlsPanel } from '../panels/ControlsPanel';
import { PreviewPanel } from '../panels/PreviewPanel';
import { PresetsPanel } from '../panels/PresetsPanel';
import { Sliders, Download, X, ChevronUp } from 'lucide-react';

type MobileSheet = null | 'tune' | 'export';

export const MainLayout: React.FC = () => {
  const [sheet, setSheet] = useState<MobileSheet>(null);

  const toggleSheet = (target: 'tune' | 'export') => {
    setSheet(prev => prev === target ? null : target);
  };

  return (
    <div className="flex flex-col h-dvh bg-neutral-950 text-neutral-200 overflow-hidden selection:bg-indigo-500/30">
      <Header />
      
      {/* ==================== DESKTOP ==================== */}
      <main className="flex-1 hidden md:grid grid-cols-[300px_1fr_300px] grid-rows-[1fr] min-h-0 overflow-hidden">
        <div className="border-r border-neutral-800 min-h-0 overflow-y-auto isolate custom-scrollbar">
          <ControlsPanel />
        </div>
        <div className="min-h-0 overflow-hidden isolate">
          <PreviewPanel />
        </div>
        <div className="border-l border-neutral-800 min-h-0 overflow-y-auto isolate custom-scrollbar">
          <PresetsPanel />
        </div>
      </main>

      {/* ==================== MOBILE ==================== */}
      <main className="flex-1 md:hidden flex flex-col overflow-hidden relative">
        {/* Preview — always visible */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <PreviewPanel />
        </div>

        {/* Floating action buttons */}
        <div
          className="absolute left-0 right-0 flex items-center justify-center gap-3 z-30 transition-all duration-300"
          style={{ bottom: sheet ? 'calc(60vh + 8px)' : '12px', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <button
            onClick={() => toggleSheet('tune')}
            className={`flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full border backdrop-blur-xl shadow-lg shadow-black/40 transition-all duration-200 active:scale-95 ${
              sheet === 'tune'
                ? 'bg-indigo-500/25 border-indigo-500/40 text-indigo-300'
                : 'bg-neutral-900/80 border-white/10 text-neutral-300'
            }`}
          >
            {sheet === 'tune' ? <X className="w-4 h-4" /> : <Sliders className="w-4 h-4" />}
            <span className="text-xs font-semibold">Tune</span>
          </button>

          <button
            onClick={() => toggleSheet('export')}
            className={`flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full border backdrop-blur-xl shadow-lg shadow-black/40 transition-all duration-200 active:scale-95 ${
              sheet === 'export'
                ? 'bg-indigo-500/25 border-indigo-500/40 text-indigo-300'
                : 'bg-neutral-900/80 border-white/10 text-neutral-300'
            }`}
          >
            {sheet === 'export' ? <X className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            <span className="text-xs font-semibold">Export</span>
          </button>
        </div>

        {/* Bottom sheet backdrop */}
        {sheet && (
          <div 
            className="absolute inset-0 bg-black/40 z-30 transition-opacity duration-300"
            onClick={() => setSheet(null)}
          />
        )}

        {/* Bottom sheet */}
        <div
          className={`absolute left-0 right-0 bottom-0 z-40 transition-transform duration-300 ease-out ${
            sheet ? 'translate-y-0' : 'translate-y-full'
          }`}
          style={{ 
            height: '60vh',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          <div className="h-full bg-neutral-950/95 backdrop-blur-2xl border-t border-white/10 rounded-t-2xl flex flex-col overflow-hidden shadow-[0_-8px_40px_rgba(0,0,0,0.6)]">
            {/* Sheet handle + header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 rounded-full bg-white/20" />
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-2">
                  {sheet === 'tune' ? 'Settings' : 'Export'}
                </span>
              </div>
              <button
                onClick={() => setSheet(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-500 transition-colors"
              >
                <ChevronUp className="w-4 h-4 rotate-180" />
              </button>
            </div>

            {/* Sheet content */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
              {sheet === 'tune' && <ControlsPanel />}
              {sheet === 'export' && <PresetsPanel />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
