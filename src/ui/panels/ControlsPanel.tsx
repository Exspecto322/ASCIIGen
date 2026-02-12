import React, { useState } from 'react';
import { useStore } from '../../state/store';
import { CHARSETS, sortCharsByDensity } from '../../features/ascii/charsets';
import { Sliders, Type, Grid, Sun, Moon, Droplet, ChevronDown, ChevronRight, ArrowUpDown } from 'lucide-react';

interface ControlSectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const ControlSection = ({ title, icon: Icon, children, defaultOpen = true }: ControlSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-neutral-800 bg-neutral-900/40 rounded-lg overflow-hidden transition-all duration-200">
       <button 
         onClick={() => setIsOpen(!isOpen)}
         className="w-full flex items-center justify-between p-3 bg-neutral-900/60 hover:bg-neutral-800/80 transition-colors"
       >
         <div className="flex items-center gap-2 text-sm font-medium text-neutral-300">
           <Icon className="w-4 h-4 text-indigo-400" />
           {title}
         </div>
         {isOpen ? <ChevronDown className="w-4 h-4 text-neutral-500" /> : <ChevronRight className="w-4 h-4 text-neutral-500" />}
       </button>
       
       {isOpen && (
         <div className="p-4 space-y-4 border-t border-neutral-800/50">
           {children}
         </div>
       )}
    </div>
  );
};

export const ControlsPanel: React.FC = () => {
  const { 
    columns, charset, dither, isInverted, brightness, contrast,
    updateSettings 
  } = useStore();

  const handlePresetChange = (name: string) => {
    if (CHARSETS[name]) {
      updateSettings({ charset: CHARSETS[name] });
    }
  };
  
  const handleSort = () => {
    const sorted = sortCharsByDensity(charset);
    updateSettings({ charset: sorted });
  };

  return (
    <aside className="border-r border-neutral-800 bg-black/60 p-4 flex flex-col gap-4 overflow-y-auto h-full backdrop-blur-md w-80 shrink-0">
      
      {/* Dimensions */}
      <ControlSection title="Geometry" icon={Grid}>
        <div className="space-y-3">
          <div className="flex justify-between text-xs text-neutral-400 font-medium">
            <span>Width Detection</span>
            <span className="text-white">{columns} ch</span>
          </div>
          <input 
            type="range" 
            min="20" 
            max="3000" 
            step="10"
            value={columns} 
            onChange={(e) => updateSettings({ columns: parseInt(e.target.value) })}
            className="w-full h-2 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
          />
          <p className="text-[10px] text-neutral-600">Higher resolution = more CPU usage.</p>
        </div>
      </ControlSection>

      {/* Characters */}
      <ControlSection title="Typography" icon={Type}>
        <div className="space-y-3">
           {/* Preset Selector */}
           <div className="flex flex-wrap gap-2">
             {Object.keys(CHARSETS).map(name => (
                <button
                  key={name}
                  onClick={() => handlePresetChange(name)}
                  className={`text-[10px] px-2 py-1 rounded border transition-all ${charset === CHARSETS[name] ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : 'bg-neutral-800 text-neutral-400 border-transparent hover:border-neutral-700'}`}
                >
                  {name}
                </button>
             ))}
           </div>
           
           {/* Custom Input */}
           <div className="space-y-1">
             <div className="flex justify-between text-xs text-neutral-400">
               <span>Active Set</span>
               <button onClick={handleSort} className="flex items-center gap-1 hover:text-indigo-400 transition-colors" title="Sort by Density">
                 <ArrowUpDown className="w-3 h-3" /> Sort
               </button>
             </div>
             <textarea 
               value={charset}
               onChange={(e) => updateSettings({ charset: e.target.value })}
               className="w-full bg-neutral-950 border border-neutral-800 text-xs font-mono rounded p-2 text-neutral-300 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-900 min-h-[60px]"
             />
           </div>
           
           <label className="flex items-center gap-2 text-xs text-neutral-400 cursor-pointer select-none">
             <input 
               type="checkbox" 
               checked={isInverted}
               onChange={(e) => updateSettings({ isInverted: e.target.checked })}
               className="rounded bg-neutral-800 border-neutral-700 text-indigo-500 focus:ring-offset-neutral-900"
             />
             <span className="flex items-center gap-2">
               Invert Output 
               <span className="text-[10px] text-neutral-600">(Dark Background Friendly)</span>
             </span>
           </label>
        </div>
      </ControlSection>

      {/* Enhancements */}
      <ControlSection title="Processing" icon={Sliders}>
        <div className="space-y-5">
          {/* Brightness */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-neutral-400">
              <span className="flex items-center gap-1"><Sun className="w-3 h-3"/> Brightness</span>
              <span className="text-white">{brightness.toFixed(1)}</span>
            </div>
            <input 
              type="range" min="0" max="2" step="0.1"
              value={brightness} 
              onChange={(e) => updateSettings({ brightness: parseFloat(e.target.value) })}
              className="w-full h-2 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400"
            />
          </div>

          {/* Contrast */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-neutral-400">
              <span className="flex items-center gap-1"><Moon className="w-3 h-3"/> Contrast</span>
              <span className="text-white">{contrast.toFixed(1)}</span>
            </div>
            <input 
              type="range" min="0" max="3" step="0.1"
              value={contrast} 
              onChange={(e) => updateSettings({ contrast: parseFloat(e.target.value) })}
              className="w-full h-2 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400"
            />
          </div>
          
          {/* Dither */}
           <div className="space-y-2 pt-2 border-t border-neutral-800">
             <div className="flex justify-between text-xs text-neutral-400">
               <span className="flex items-center gap-1"><Droplet className="w-3 h-3"/> Dithering</span>
             </div>
             <div className="grid grid-cols-3 gap-2">
                {(['none', 'bayer', 'floyd'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => updateSettings({ dither: mode })}
                    className={`px-2 py-1.5 text-[10px] font-medium rounded border transition-all uppercase tracking-wide ${dither === mode ? 'bg-pink-500/20 text-pink-300 border-pink-500/40' : 'bg-neutral-900 text-neutral-500 border-neutral-800 hover:border-neutral-700'}`}
                  >
                    {mode}
                  </button>
                ))}
             </div>
             <p className="text-[10px] text-neutral-600 mt-1">
               {dither === 'floyd' && "Error diffusion. High quality, organic noise."}
               {dither === 'bayer' && "Ordered matrix. Retro computer look."}
               {dither === 'none' && "Standard quantization."}
             </p>
           </div>
        </div>
      </ControlSection>

    </aside>
  );
};
