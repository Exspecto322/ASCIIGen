import React, { useRef } from 'react';
import { useStore } from '../../state/store';
import { Ghost, Upload, Github } from 'lucide-react';

export const Header: React.FC = () => {
  const setFile = useStore((s) => s.setFile);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      e.target.value = '';
    }
  };

  return (
    <header className="h-12 border-b border-white/5 flex items-center px-4 justify-between bg-neutral-950/80 backdrop-blur-xl z-10 shrink-0">
      <div className="flex items-center gap-2.5">
        <Ghost className="w-5 h-5 text-indigo-500" />
        <span className="font-bold text-base tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          ASCIIGen
        </span>
        <span className="text-[10px] text-neutral-600 font-mono hidden sm:inline">v2.0</span>
      </div>
      
      <div className="flex items-center gap-1">
        <input 
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <button 
          onClick={handleImport}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all text-sm text-indigo-300 hover:text-indigo-200"
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Import</span>
        </button>
        
        <a 
          href="https://github.com/Exspecto322/ASCIIGen" 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-2 rounded-lg hover:bg-white/5 transition-colors text-neutral-500 hover:text-neutral-300 ml-1"
        >
          <Github className="w-4 h-4" />
        </a>
      </div>
    </header>
  );
};
