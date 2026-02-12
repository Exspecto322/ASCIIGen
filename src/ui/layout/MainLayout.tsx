import React from 'react';
import { Header } from '../components/Header';
import { ControlsPanel } from '../panels/ControlsPanel';
import { PreviewPanel } from '../panels/PreviewPanel';
import { PresetsPanel } from '../panels/PresetsPanel';

export const MainLayout: React.FC = () => {
  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-neutral-200 overflow-hidden selection:bg-indigo-500/30">
      <Header />
      <main className="flex-1 grid grid-cols-[300px_1fr_300px] overflow-hidden">
        <ControlsPanel />
        <PreviewPanel />
        <PresetsPanel />
      </main>
    </div>
  );
};
