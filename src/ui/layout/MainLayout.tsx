import React, { useState } from 'react';
import { Header } from '../components/Header';
import { ControlsPanel } from '../panels/ControlsPanel';
import { PreviewPanel } from '../panels/PreviewPanel';
import { PresetsPanel } from '../panels/PresetsPanel';
import { Sliders, Eye, Download } from 'lucide-react';

export const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tune' | 'preview' | 'export'>('preview');

  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-neutral-200 overflow-hidden selection:bg-indigo-500/30">
      <Header />
      
      {/* Desktop Grid Layout */}
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

      {/* Mobile Layout */}
      <main className="flex-1 md:hidden flex flex-col overflow-hidden relative bg-neutral-950">
        <div className="flex-1 overflow-hidden relative min-h-0">
          {/* Tune Panel */}
          <div 
            className={`absolute inset-0 overflow-y-auto custom-scrollbar transition-all duration-300 ease-in-out ${activeTab === 'tune' ? 'opacity-100 translate-x-0 z-10 pointer-events-auto' : '-translate-x-4 opacity-0 z-0 pointer-events-none'}`}
          >
            <ControlsPanel />
          </div>

          {/* Preview Panel */}
          <div 
            className={`absolute inset-0 transition-all duration-300 ease-in-out ${activeTab === 'preview' ? 'opacity-100 translate-x-0 z-10 pointer-events-auto' : 'translate-x-4 opacity-0 z-0 pointer-events-none'}`}
          >
            <PreviewPanel />
          </div>

          {/* Export Panel */}
          <div 
            className={`absolute inset-0 overflow-y-auto custom-scrollbar transition-all duration-300 ease-in-out ${activeTab === 'export' ? 'opacity-100 translate-x-0 z-10 pointer-events-auto' : 'translate-x-4 opacity-0 z-0 pointer-events-none'}`}
          >
            <PresetsPanel />
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <nav className="shrink-0 bg-neutral-950/90 backdrop-blur-2xl border-t border-white/[0.06] grid grid-cols-3 relative z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom, 4px)' }}>
          {([
            { key: 'tune' as const, icon: Sliders, label: 'Tune' },
            { key: 'preview' as const, icon: Eye, label: 'Preview' },
            { key: 'export' as const, icon: Download, label: 'Export' },
          ]).map(({ key, icon: TabIcon, label }) => (
            <button 
              key={key}
              onClick={() => setActiveTab(key)}
              className="flex flex-col items-center justify-center gap-1 py-2.5 relative group"
            >
              {activeTab === key && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
              )}
              <TabIcon className={`w-[18px] h-[18px] transition-colors duration-200 ${activeTab === key ? 'text-indigo-400' : 'text-neutral-600 group-active:text-neutral-400'}`} />
              <span className={`text-[9px] font-semibold uppercase tracking-widest transition-colors duration-200 ${activeTab === key ? 'text-indigo-400' : 'text-neutral-700'}`}>
                {label}
              </span>
            </button>
          ))}
        </nav>
      </main>
    </div>
  );
};
