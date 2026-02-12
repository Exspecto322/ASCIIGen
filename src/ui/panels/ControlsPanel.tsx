import React, { useState } from 'react';
import { useStore } from '../../state/store';
import { CHARSETS, sortCharsByDensity } from '../../features/ascii/charsets';
import { Sliders, Type, Grid, Sun, Moon, Droplet, ChevronDown, ChevronRight, ArrowUpDown, RotateCcw } from 'lucide-react';

interface ControlSectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const ControlSection = ({ title, icon: Icon, children, defaultOpen = true }: ControlSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-white/5 bg-white/[0.02] rounded-xl overflow-hidden">
       <button 
         onClick={() => setIsOpen(!isOpen)}
         className="w-full flex items-center justify-between p-3 hover:bg-white/[0.03] transition-colors"
       >
         <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
           <Icon className="w-3.5 h-3.5 text-indigo-400" />
           {title}
         </div>
         {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-neutral-600" /> : <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />}
       </button>
       
       {isOpen && (
         <div className="px-3 pb-4 space-y-4 border-t border-white/5">
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
    <aside className="bg-neutral-950/80 p-3 flex flex-col gap-3 overflow-y-auto h-full backdrop-blur-md w-full custom-scrollbar">
      
      {/* Resolution */}
      <ControlSection title="Geometry" icon={Grid}>
        <div className="space-y-3 pt-3">
          <div className="flex justify-between text-xs text-neutral-500">
            <span>Resolution</span>
            <span className="font-mono text-neutral-300 tabular-nums">{columns} col</span>
          </div>
          <input 
            type="range" 
            min="20" 
            max="3000" 
            step="10"
            value={columns} 
            onChange={(e) => updateSettings({ columns: parseInt(e.target.value) })}
            className="w-full"
          />
          {columns > 500 && (
            <p className="text-[10px] text-amber-500/70">⚡ High resolution — may be CPU intensive</p>
          )}
        </div>
      </ControlSection>

      {/* Characters */}
      <ControlSection title="Typography" icon={Type}>
        <div className="space-y-3 pt-3">
           {/* Preset Selector */}
           <div className="flex flex-wrap gap-1.5">
             {Object.keys(CHARSETS).map(name => (
                <button
                  key={name}
                  onClick={() => handlePresetChange(name)}
                  className={`text-[10px] px-2.5 py-1 rounded-full border transition-all font-medium ${charset === CHARSETS[name] ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' : 'bg-white/[0.03] text-neutral-500 border-transparent hover:border-white/10 hover:text-neutral-300'}`}
                >
                  {name}
                </button>
             ))}
           </div>
           
           {/* Custom Input */}
           <div className="space-y-1.5">
             <div className="flex justify-between text-xs text-neutral-500">
               <span>Active Set</span>
               <button onClick={handleSort} className="flex items-center gap-1 hover:text-indigo-400 transition-colors text-[10px]" title="Sort by Density">
                 <ArrowUpDown className="w-3 h-3" /> Sort
               </button>
             </div>
             <textarea 
               value={charset}
               onChange={(e) => updateSettings({ charset: e.target.value })}
               className="w-full bg-black/50 border border-white/5 text-xs font-mono rounded-lg p-2.5 text-neutral-300 focus:outline-none focus:border-indigo-500/30 focus:ring-1 focus:ring-indigo-500/10 min-h-[56px] resize-none placeholder-neutral-700"
               placeholder="Enter custom characters..."
             />
           </div>
           
           <label className="flex items-center gap-3 text-xs text-neutral-400 cursor-pointer select-none py-1">
             <input 
               type="checkbox" 
               checked={isInverted}
               onChange={(e) => updateSettings({ isInverted: e.target.checked })}
               className="toggle-switch"
             />
             <span>Invert Output</span>
           </label>
        </div>
      </ControlSection>

      {/* Processing */}
      <ControlSection title="Processing" icon={Sliders}>
        <div className="space-y-4 pt-3">
          {/* Brightness */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-neutral-500">
              <span className="flex items-center gap-1.5"><Sun className="w-3 h-3"/> Brightness</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-neutral-300 tabular-nums">{brightness.toFixed(1)}</span>
                {brightness !== 1.0 && (
                  <button 
                    onClick={() => updateSettings({ brightness: 1.0 })}
                    className="text-neutral-600 hover:text-indigo-400 transition-colors"
                    title="Reset"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
            <div className="accent-pink">
              <input 
                type="range" min="0" max="2" step="0.1"
                value={brightness} 
                onChange={(e) => updateSettings({ brightness: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>

          {/* Contrast */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-neutral-500">
              <span className="flex items-center gap-1.5"><Moon className="w-3 h-3"/> Contrast</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-neutral-300 tabular-nums">{contrast.toFixed(1)}</span>
                {contrast !== 1.0 && (
                  <button 
                    onClick={() => updateSettings({ contrast: 1.0 })}
                    className="text-neutral-600 hover:text-indigo-400 transition-colors"
                    title="Reset"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
            <div className="accent-pink">
              <input 
                type="range" min="0" max="3" step="0.1"
                value={contrast} 
                onChange={(e) => updateSettings({ contrast: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
          
          {/* Dither */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
              <Droplet className="w-3 h-3"/> Dithering
            </div>
            <div className="grid grid-cols-3 gap-1.5">
               {(['none', 'bayer', 'floyd'] as const).map(mode => (
                 <button
                   key={mode}
                   onClick={() => updateSettings({ dither: mode })}
                   className={`px-2 py-1.5 text-[10px] font-semibold rounded-lg border transition-all uppercase tracking-wider ${dither === mode ? 'bg-pink-500/15 text-pink-300 border-pink-500/25' : 'bg-white/[0.02] text-neutral-600 border-transparent hover:border-white/10 hover:text-neutral-400'}`}
                 >
                   {mode}
                 </button>
               ))}
            </div>
            <p className="text-[10px] text-neutral-600 leading-relaxed">
              {dither === 'floyd' && "Error diffusion — organic, high detail"}
              {dither === 'bayer' && "Ordered matrix — retro, patterned"}
              {dither === 'none' && "Standard quantization"}
            </p>
          </div>
        </div>
      </ControlSection>

    </aside>
  );
};
