import React, { useState } from 'react';
import { useStore } from '../../state/store';
import { copyToClipboard, downloadTxt, downloadPng } from '../../features/ascii/exportUtils';
import { useVideoWorker } from '../../features/video/useVideoWorker';
import { Copy, FileText, Image as ImageIcon, Check, Film, Loader2 } from 'lucide-react';

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

export const PresetsPanel: React.FC = () => {
  const { asciiText, mediaType, isProcessing, videoProgress, gifUrl } = useStore();
  const [copied, setCopied] = useState(false);
  const { convertVideo } = useVideoWorker();

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

  return (
    <aside className="bg-neutral-950/80 p-4 flex flex-col gap-6 overflow-y-auto backdrop-blur-md h-full w-full custom-scrollbar">
      
      {/* Export Section */}
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

          {/* Video Export */}
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

      {/* Info */}
      <div className="mt-auto pt-4 border-t border-white/5">
        <div className="text-[10px] text-neutral-700 space-y-1 leading-relaxed">
          <p>ASCII art generated client-side.</p>
          <p>No data leaves your browser.</p>
        </div>
      </div>
    </aside>
  );
};
