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
      <main className="flex-1 md:hidden flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-hidden relative">
           <div className={`absolute inset-0 ${activeTab === 'tune' ? 'z-10' : 'z-0 invisible'}`}>
             <ControlsPanel />
           </div>
           <div className={`absolute inset-0 ${activeTab === 'preview' ? 'z-10' : 'z-0 invisible'}`}>
             <PreviewPanel />
           </div>
           <div className={`absolute inset-0 ${activeTab === 'export' ? 'z-10' : 'z-0 invisible'}`}>
             <PresetsPanel />
           </div>
        </div>

        {/* Mobile Tab Bar */}
        <nav className="h-16 bg-neutral-900 border-t border-neutral-800 grid grid-cols-3 shrink-0 pb-safe">
          <button 
            onClick={() => setActiveTab('tune')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${activeTab === 'tune' ? 'text-indigo-400' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            <Sliders className="w-5 h-5" />
            <span className="text-[10px] font-medium uppercase tracking-wide">Tune</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('preview')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${activeTab === 'preview' ? 'text-indigo-400' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            <Eye className="w-5 h-5" />
            <span className="text-[10px] font-medium uppercase tracking-wide">Preview</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('export')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${activeTab === 'export' ? 'text-indigo-400' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            <Download className="w-5 h-5" />
            <span className="text-[10px] font-medium uppercase tracking-wide">Export</span>
          </button>
        </nav>
      </main>
    </div>
  );
};
