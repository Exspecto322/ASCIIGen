import React from 'react';
import { Ghost, Upload, Download, HelpCircle } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="h-14 border-b border-neutral-800 flex items-center px-4 justify-between bg-neutral-900/50 backdrop-blur-sm z-10 shrink-0">
      <div className="flex items-center gap-2">
        <Ghost className="w-5 h-5 text-indigo-500" />
        <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          ASCIIGen
        </span>
      </div>
      
      <div className="hidden md:flex items-center gap-1">
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-neutral-800 transition-colors text-sm text-neutral-400 hover:text-neutral-200">
          <Upload className="w-4 h-4" />
          <span>Import</span>
        </button>
        
        <div className="w-px h-4 bg-neutral-800 mx-2" />
        
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-neutral-800 transition-colors text-sm text-neutral-400 hover:text-neutral-200">
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>
        
        <button className="p-2 rounded-md hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-neutral-200 ml-2">
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
