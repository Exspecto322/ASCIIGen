import React, { useState, useMemo } from 'react';
import { useStore } from '../../state/store';
import { useShallow } from 'zustand/react/shallow';
import type { Preset } from '../../state/store';
import { copyToClipboard, downloadTxt, downloadPng } from '../../features/ascii/exportUtils';
import { useVideoWorker } from '../../features/video/useVideoWorker';
import { Copy, FileText, Image as ImageIcon, Check, Film, Loader2, Save, Trash2 } from 'lucide-react';

const ExportButton = ({ 
  onClick, disabled, icon: Icon, iconColor, label 
}: { 
  onClick: () => void; 
  disabled: boolean; 
  icon: React.ElementType; 
  iconColor: string; 
  label: string;
}) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/[0.03] group active:scale-[0.98]"
  >
    <div className={`w-8 h-8 rounded-lg ${iconColor} flex items-center justify-center shrink-0`}>
      <Icon className="w-4 h-4 text-white" />
    </div>
    <span className="text-sm text-neutral-300 group-hover:text-neutral-100 transition-colors">{label}</span>
  </button>
);

const PresetChip = ({ 
  preset, isActive, onLoad, onDelete 
}: { 
  preset: Preset; 
  isActive: boolean;
  onLoad: () => void; 
  onDelete?: () => void;
}) => (
  <div className={`flex items-center gap-1 rounded-lg border transition-all ${isActive ? 'bg-indigo-500/15 border-indigo-500/30' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}>
    <button 
      onClick={onLoad}
      className={`px-3 py-2 text-xs font-medium transition-colors ${isActive ? 'text-indigo-300' : 'text-neutral-400 hover:text-neutral-200'}`}
    >
      {preset.name}
    </button>
    {!preset.builtIn && onDelete && (
      <button 
        onClick={onDelete}
        className="pr-2 text-neutral-600 hover:text-red-400 transition-colors"
        title="Delete"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    )}
  </div>
);

export const PresetsPanel: React.FC = () => {
  const { asciiText, mediaType, isProcessing, videoProgress, gifUrl, presets } = useStore(
    useShallow(s => ({
      asciiText: s.asciiText,
      mediaType: s.mediaType,
      isProcessing: s.isProcessing,
      videoProgress: s.videoProgress,
      gifUrl: s.gifUrl,
      presets: s.presets,
    }))
  );

  const currentSettings = useStore(
    useShallow(s => ({
      columns: s.columns,
      charset: s.charset,
      mode: s.mode,
      dither: s.dither,
      isInverted: s.isInverted,
      brightness: s.brightness,
      contrast: s.contrast,
      colorMode: s.colorMode,
    }))
  );

  const savePreset = useStore(s => s.savePreset);
  const loadPreset = useStore(s => s.loadPreset);
  const deletePreset = useStore(s => s.deletePreset);

  const [copied, setCopied] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);
  const { convertVideo } = useVideoWorker();

  const currentSettingsJson = useMemo(() => JSON.stringify(currentSettings), [currentSettings]);

  const isPresetActive = (preset: Preset) => {
    return JSON.stringify(preset.settings) === currentSettingsJson;
  };

  const handleCopy = async () => {
    if (!asciiText) return;
    const success = await copyToClipboard(asciiText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadTxt = () => {
    if (!asciiText) return;
    downloadTxt(asciiText, `asciigen-${Date.now()}.txt`);
  };

  const handleDownloadPng = () => {
    if (!asciiText) return;
    downloadPng(asciiText, `asciigen-${Date.now()}.png`);
  };

  const handleExportGif = () => {
    if (mediaType !== 'video' && mediaType !== 'gif') return;
    convertVideo();
  };

  const handleDownloadGif = () => {
    if (!gifUrl) return;
    const a = document.createElement('a');
    a.href = gifUrl;
    a.download = `asciigen-${Date.now()}.gif`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSavePreset = () => {
    const name = presetName.trim();
    if (!name) return;
    savePreset(name);
    setPresetName('');
    setShowSaveInput(false);
  };

  return (
    <aside className="bg-neutral-950/80 p-4 flex flex-col gap-6 overflow-y-auto backdrop-blur-md h-full w-full custom-scrollbar">
      
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold text-neutral-600 uppercase tracking-[0.15em]">Export</h3>
        
        <div className="flex flex-col gap-2">
          <ExportButton
            onClick={handleCopy}
            disabled={!asciiText || isProcessing}
            icon={copied ? Check : Copy}
            iconColor={copied ? 'bg-green-500/20' : 'bg-indigo-500/20'}
            label={copied ? 'Copied!' : 'Copy Text'}
          />

          <ExportButton
            onClick={handleDownloadTxt}
            disabled={!asciiText || isProcessing}
            icon={FileText}
            iconColor="bg-blue-500/20"
            label="Save as .TXT"
          />

          <ExportButton
            onClick={handleDownloadPng}
            disabled={!asciiText || isProcessing}
            icon={ImageIcon}
            iconColor="bg-pink-500/20"
            label="Save as .PNG"
          />

          {(mediaType === 'video' || mediaType === 'gif') && (
            <div className="pt-3 border-t border-white/5">
               {!gifUrl ? (
                  <button 
                    onClick={handleExportGif}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-indigo-300 font-medium active:scale-[0.98]"
                  >
                    {isProcessing ? (
                      <>
                       <Loader2 className="w-4 h-4 animate-spin" />
                       <span className="font-mono tabular-nums">{Math.round(videoProgress * 100)}%</span>
                      </>
                    ) : (
                      <>
                       <Film className="w-4 h-4" />
                       <span>Render GIF</span>
                      </>
                    )}
                  </button>
               ) : (
                  <button 
                    onClick={handleDownloadGif}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-green-500/15 hover:bg-green-500/25 border border-green-500/20 transition-all text-green-300 font-medium active:scale-[0.98]"
                  >
                    <Film className="w-4 h-4" />
                    <span>Download GIF</span>
                  </button>
               )}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-bold text-neutral-600 uppercase tracking-[0.15em]">Presets</h3>
          <button 
            onClick={() => setShowSaveInput(!showSaveInput)}
            className="text-neutral-600 hover:text-indigo-400 transition-colors"
            title="Save current as preset"
          >
            <Save className="w-3.5 h-3.5" />
          </button>
        </div>

        {showSaveInput && (
          <div className="flex gap-2">
            <input 
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
              placeholder="Preset name…"
              className="flex-1 bg-black/50 border border-white/10 text-xs rounded-lg px-3 py-2 text-neutral-300 focus:outline-none focus:border-indigo-500/30 placeholder-neutral-700"
              autoFocus
            />
            <button 
              onClick={handleSavePreset}
              disabled={!presetName.trim()}
              className="px-3 py-2 bg-indigo-500/20 text-indigo-300 text-xs rounded-lg border border-indigo-500/20 hover:bg-indigo-500/30 transition-all disabled:opacity-40 font-medium"
            >
              Save
            </button>
          </div>
        )}
        
        <div className="flex flex-wrap gap-1.5">
          {presets.map(preset => (
            <PresetChip
              key={preset.name}
              preset={preset}
              isActive={isPresetActive(preset)}
              onLoad={() => loadPreset(preset)}
              onDelete={!preset.builtIn ? () => deletePreset(preset.name) : undefined}
            />
          ))}
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-white/5">
        <div className="text-[10px] text-neutral-700 space-y-1 leading-relaxed">
          <p>ASCII art generated client-side.</p>
          <p>No data leaves your browser.</p>
        </div>
      </div>
    </aside>
  );
};
