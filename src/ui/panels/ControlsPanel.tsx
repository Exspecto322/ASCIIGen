import React, { useState } from 'react';
import { useStore } from '../../state/store';
import { useShallow } from 'zustand/react/shallow';
import { CHARSETS, sortCharsByDensity } from '../../features/ascii/charsets';
import { Sliders, Type, Grid, Sun, Moon, Droplet, ChevronDown, ChevronRight, ArrowUpDown, RotateCcw, Palette, Contrast, Gauge, Sparkles, Monitor, Scan, CircleDot, Aperture } from 'lucide-react';

interface ControlSectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const ControlSection = ({ title, icon: Icon, children, defaultOpen = true }: ControlSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-white/5 bg-white/[0.02] rounded-xl shrink-0">
       <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between p-3 hover:bg-white/[0.03] transition-colors ${!isOpen ? 'rounded-xl' : 'rounded-t-xl'}`}
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
  const { columns, charset, mode, dither, isInverted, brightness, contrast, saturation, gamma, colorMode, fgColor, bgColor } = useStore(
    useShallow(s => ({
      columns: s.columns,
      charset: s.charset,
      mode: s.mode,
      dither: s.dither,
      isInverted: s.isInverted,
      brightness: s.brightness,
      contrast: s.contrast,
      saturation: s.saturation,
      gamma: s.gamma,
      colorMode: s.colorMode,
      fgColor: s.fgColor,
      bgColor: s.bgColor,
    }))
  );

  const updateSettings = useStore(s => s.updateSettings);

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
    <aside className="bg-neutral-950/80 p-3 flex flex-col gap-3 backdrop-blur-md w-full">
      
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

      <ControlSection title="Edge Detection" icon={Contrast} defaultOpen={false}>
        <div className="space-y-3 pt-3">
          <div className="flex flex-wrap gap-1.5">
            {(['standard', 'sobel', 'prewitt', 'laplacian', 'canny'] as const).map(m => (
              <button
                key={m}
                onClick={() => updateSettings({ mode: m })}
                className={`text-[10px] px-2.5 py-1 rounded-full border transition-all font-medium capitalize ${mode === m ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' : 'bg-white/[0.03] text-neutral-500 border-transparent hover:border-white/10 hover:text-neutral-300'}`}
              >
                {m}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-neutral-600 leading-relaxed">
            {mode === 'standard' && "No edge detection — standard brightness mapping"}
            {mode === 'sobel' && "Sobel — strong edges, directional gradients"}
            {mode === 'prewitt' && "Prewitt — uniform weighting, smoother edges"}
            {mode === 'laplacian' && "Laplacian — second-derivative, fine detail"}
            {mode === 'canny' && "Canny — thin edges with non-max suppression"}
          </p>
        </div>
      </ControlSection>

      <ControlSection title="Typography" icon={Type}>
        <div className="space-y-3 pt-3">
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
           
           <div className="flex flex-col gap-2">
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
        </div>
      </ControlSection>

      <ControlSection title="Color" icon={Palette}>
        <div className="space-y-3 pt-3">
          <label className="flex items-center justify-between text-xs text-neutral-400 cursor-pointer select-none py-1">
            <div className="flex items-center gap-2">
              <span>Color Mode</span>
              {colorMode && (
                <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider">On</span>
              )}
            </div>
            <input 
              type="checkbox" 
              checked={colorMode}
              onChange={(e) => updateSettings({ colorMode: e.target.checked })}
              className="toggle-switch"
            />
          </label>
          <p className="text-[10px] text-neutral-600 leading-relaxed">
            {colorMode 
              ? "Preserves original colors from source image" 
              : "Standard monochrome ASCII output"
            }
          </p>

          {!colorMode && (
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">Foreground</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-neutral-400">{fgColor}</span>
                  <input 
                    type="color" 
                    value={fgColor}
                    onChange={(e) => updateSettings({ fgColor: e.target.value })}
                    className="w-6 h-6 rounded border border-white/10 bg-transparent cursor-pointer"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">Background</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-neutral-400">{bgColor}</span>
                  <input 
                    type="color" 
                    value={bgColor}
                    onChange={(e) => updateSettings({ bgColor: e.target.value })}
                    className="w-6 h-6 rounded border border-white/10 bg-transparent cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </ControlSection>

      <ControlSection title="Processing" icon={Sliders}>
        <div className="space-y-4 pt-3">
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

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-neutral-500">
              <span className="flex items-center gap-1.5"><Contrast className="w-3 h-3"/> Saturation</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-neutral-300 tabular-nums">{saturation.toFixed(1)}</span>
                {saturation !== 1.0 && (
                  <button 
                    onClick={() => updateSettings({ saturation: 1.0 })}
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
                value={saturation} 
                onChange={(e) => updateSettings({ saturation: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            <p className="text-[10px] text-neutral-600">Only affects color mode output</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-neutral-500">
              <span className="flex items-center gap-1.5"><Gauge className="w-3 h-3"/> Gamma</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-neutral-300 tabular-nums">{gamma.toFixed(1)}</span>
                {gamma !== 1.0 && (
                  <button 
                    onClick={() => updateSettings({ gamma: 1.0 })}
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
                type="range" min="0.3" max="3.0" step="0.1"
                value={gamma} 
                onChange={(e) => updateSettings({ gamma: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            <p className="text-[10px] text-neutral-600">&lt;1.0 brightens shadows · &gt;1.0 deepens shadows</p>
          </div>
          
          <div className="space-y-2 pt-2 border-t border-white/5">
            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
              <Droplet className="w-3 h-3"/> Dithering
            </div>
            <div className="grid grid-cols-3 gap-1.5">
               {(['none', 'bayer', 'floyd', 'atkinson', 'stucki', 'sierra'] as const).map(mode => (
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
              {dither === 'floyd' && "Floyd-Steinberg — organic, high detail"}
              {dither === 'bayer' && "Ordered matrix — retro, patterned"}
              {dither === 'atkinson' && "Atkinson — sharp, preserves detail"}
              {dither === 'stucki' && "Stucki — smooth gradients, wide diffusion"}
              {dither === 'sierra' && "Sierra — balanced detail & smoothness"}
              {dither === 'none' && "Standard quantization"}
            </p>
          </div>
        </div>
      </ControlSection>

      <EffectsSection />

    </aside>
  );
};

/* ====== Effects Section (uses separate postProcessing state) ====== */
const EffectToggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex items-center justify-between text-xs text-neutral-400 cursor-pointer select-none py-0.5">
    <span>{label}</span>
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="toggle-switch"
    />
  </label>
);

const EffectsSection: React.FC = () => {
  const pp = useStore(
    useShallow(s => s.postProcessing)
  );
  const updatePP = useStore(s => s.updatePostProcessing);

  return (
    <ControlSection title="Effects" icon={Sparkles} defaultOpen={false}>
      <div className="space-y-4 pt-3">

        {/* Scanlines */}
        <div className="space-y-2">
          <EffectToggle label="Scanlines" checked={pp.scanlines} onChange={v => updatePP({ scanlines: v })} />
          {pp.scanlines && (
            <div className="space-y-2 pl-1">
              <div className="flex justify-between text-[10px] text-neutral-500">
                <span className="flex items-center gap-1"><Scan className="w-3 h-3"/> Opacity</span>
                <span className="font-mono text-neutral-400">{pp.scanlinesOpacity.toFixed(2)}</span>
              </div>
              <div className="accent-amber">
                <input type="range" min="0.02" max="0.5" step="0.02" value={pp.scanlinesOpacity}
                  onChange={e => updatePP({ scanlinesOpacity: parseFloat(e.target.value) })} className="w-full" />
              </div>
              <div className="flex justify-between text-[10px] text-neutral-500">
                <span>Spacing</span>
                <span className="font-mono text-neutral-400">{pp.scanlinesSpacing}px</span>
              </div>
              <div className="accent-amber">
                <input type="range" min="1" max="8" step="1" value={pp.scanlinesSpacing}
                  onChange={e => updatePP({ scanlinesSpacing: parseInt(e.target.value) })} className="w-full" />
              </div>
            </div>
          )}
        </div>

        {/* Vignette */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <EffectToggle label="Vignette" checked={pp.vignette} onChange={v => updatePP({ vignette: v })} />
          {pp.vignette && (
            <div className="pl-1">
              <div className="flex justify-between text-[10px] text-neutral-500">
                <span className="flex items-center gap-1"><CircleDot className="w-3 h-3"/> Intensity</span>
                <span className="font-mono text-neutral-400">{pp.vignetteIntensity.toFixed(1)}</span>
              </div>
              <div className="accent-amber">
                <input type="range" min="0.1" max="1.0" step="0.1" value={pp.vignetteIntensity}
                  onChange={e => updatePP({ vignetteIntensity: parseFloat(e.target.value) })} className="w-full" />
              </div>
            </div>
          )}
        </div>

        {/* CRT Curve */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <EffectToggle label="CRT Curve" checked={pp.crtCurve} onChange={v => updatePP({ crtCurve: v })} />
          {pp.crtCurve && (
            <div className="pl-1">
              <div className="flex justify-between text-[10px] text-neutral-500">
                <span className="flex items-center gap-1"><Monitor className="w-3 h-3"/> Curvature</span>
                <span className="font-mono text-neutral-400">{pp.crtAmount.toFixed(2)}</span>
              </div>
              <div className="accent-amber">
                <input type="range" min="0.01" max="0.1" step="0.005" value={pp.crtAmount}
                  onChange={e => updatePP({ crtAmount: parseFloat(e.target.value) })} className="w-full" />
              </div>
            </div>
          )}
        </div>

        {/* Bloom */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <EffectToggle label="Bloom / Glow" checked={pp.bloom} onChange={v => updatePP({ bloom: v })} />
          {pp.bloom && (
            <div className="pl-1">
              <div className="flex justify-between text-[10px] text-neutral-500">
                <span className="flex items-center gap-1"><Aperture className="w-3 h-3"/> Intensity</span>
                <span className="font-mono text-neutral-400">{pp.bloomIntensity.toFixed(1)}</span>
              </div>
              <div className="accent-amber">
                <input type="range" min="0.1" max="2.0" step="0.1" value={pp.bloomIntensity}
                  onChange={e => updatePP({ bloomIntensity: parseFloat(e.target.value) })} className="w-full" />
              </div>
            </div>
          )}
        </div>

        {/* Grain */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <EffectToggle label="Film Grain" checked={pp.grain} onChange={v => updatePP({ grain: v })} />
          {pp.grain && (
            <div className="pl-1">
              <div className="flex justify-between text-[10px] text-neutral-500">
                <span>Intensity</span>
                <span className="font-mono text-neutral-400">{pp.grainIntensity.toFixed(2)}</span>
              </div>
              <div className="accent-amber">
                <input type="range" min="0.02" max="0.5" step="0.02" value={pp.grainIntensity}
                  onChange={e => updatePP({ grainIntensity: parseFloat(e.target.value) })} className="w-full" />
              </div>
            </div>
          )}
        </div>

      </div>
    </ControlSection>
  );
};
