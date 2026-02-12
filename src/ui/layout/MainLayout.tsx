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
      <main className="flex-1 hidden md:grid grid-cols-[300px_1fr_300px] overflow-hidden">
        <div className="border-r border-neutral-800 h-full overflow-hidden">
          <ControlsPanel />
        </div>
        <div className="h-full overflow-hidden">
          <PreviewPanel />
        </div>
        <div className="border-l border-neutral-800 h-full overflow-hidden">
          <PresetsPanel />
        </div>
      </main>

      {/* Mobile Flex Layout */}
      <main className="flex-1 md:hidden flex flex-col overflow-hidden relative bg-neutral-950">
        <div className="flex-1 overflow-hidden relative">
           {/* Tune Panel */}
           <div 
             className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${activeTab === 'tune' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}
           >
             <ControlsPanel />
           </div>

           {/* Preview Panel */}
           <div 
             className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${activeTab === 'preview' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}
           >
             <PreviewPanel />
           </div>

           {/* Export Panel */}
           <div 
             className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${activeTab === 'export' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}
           >
             <PresetsPanel />
           </div>
        </div>

        {/* Mobile Tab Bar */}
        <nav className="h-20 bg-black/80 backdrop-blur-xl border-t border-white/10 grid grid-cols-3 shrink-0 pb-6 px-2 relative z-50">
          <button 
            onClick={() => setActiveTab('tune')}
            className="flex flex-col items-center justify-center gap-1.5 group"
          >
            <div className={`p-1.5 rounded-full transition-all duration-300 ${activeTab === 'tune' ? 'bg-indigo-500/20 text-indigo-400 scale-110' : 'text-neutral-500 group-hover:text-neutral-300'}`}>
              <Sliders className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-semibold tracking-wide transition-colors ${activeTab === 'tune' ? 'text-indigo-400' : 'text-neutral-600'}`}>
              TUNE
            </span>
          </button>
          
          <button 
            onClick={() => setActiveTab('preview')}
            className="flex flex-col items-center justify-center gap-1.5 group"
          >
            <div className={`p-1.5 rounded-full transition-all duration-300 ${activeTab === 'preview' ? 'bg-indigo-500/20 text-indigo-400 scale-110' : 'text-neutral-500 group-hover:text-neutral-300'}`}>
              <Eye className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-semibold tracking-wide transition-colors ${activeTab === 'preview' ? 'text-indigo-400' : 'text-neutral-600'}`}>
              PREVIEW
            </span>
          </button>
          
          <button 
            onClick={() => setActiveTab('export')}
            className="flex flex-col items-center justify-center gap-1.5 group"
          >
            <div className={`p-1.5 rounded-full transition-all duration-300 ${activeTab === 'export' ? 'bg-indigo-500/20 text-indigo-400 scale-110' : 'text-neutral-500 group-hover:text-neutral-300'}`}>
              <Download className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-semibold tracking-wide transition-colors ${activeTab === 'export' ? 'text-indigo-400' : 'text-neutral-600'}`}>
              EXPORT
            </span>
          </button>
        </nav>
      </main>
    </div>
  );
};
