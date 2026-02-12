import React, { useState } from 'react';
import { useStore } from '../../state/store';
import { copyToClipboard, downloadTxt, downloadPng } from '../../features/ascii/exportUtils';
import { useVideoWorker } from '../../features/video/useVideoWorker';
import { Copy, FileText, Image as ImageIcon, Check, Film, Loader2 } from 'lucide-react';

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
    <aside className="border-l border-neutral-800 bg-neutral-900/50 p-6 flex flex-col gap-8 overflow-y-auto backdrop-blur-sm h-full">
      
      {/* Export Section */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Export</h3>
        
        <div className="grid grid-cols-1 gap-2">
           {/* Image/Text Exports */}
           <button 
             onClick={handleCopy}
             disabled={!asciiText || isProcessing}
             className="flex items-center justify-between p-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
           >
             <span className="flex items-center gap-2 text-sm text-neutral-300">
               {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-indigo-400" />}
               <span>Copy Text</span>
             </span>
           </button>

           <button 
             onClick={handleDownloadTxt}
             disabled={!asciiText || isProcessing}
             className="flex items-center justify-between p-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
           >
             <span className="flex items-center gap-2 text-sm text-neutral-300">
               <FileText className="w-4 h-4 text-blue-400" />
               <span>Save as .TXT</span>
             </span>
           </button>

           <button 
             onClick={handleDownloadPng}
             disabled={!asciiText || isProcessing}
             className="flex items-center justify-between p-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
           >
             <span className="flex items-center gap-2 text-sm text-neutral-300">
               <ImageIcon className="w-4 h-4 text-pink-400" />
               <span>Save as .PNG</span>
             </span>
           </button>

           {/* Video Export */}
           {(mediaType === 'video' || mediaType === 'gif') && (
             <div className="pt-4 border-t border-neutral-800 space-y-2">
                {!gifUrl ? (
                   <button 
                     onClick={handleExportGif}
                     disabled={isProcessing}
                     className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium shadow-lg shadow-indigo-900/20"
                   >
                     {isProcessing ? (
                       <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{Math.round(videoProgress * 100)}%</span>
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
                     className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-green-600 hover:bg-green-500 transition-colors text-white font-medium shadow-lg shadow-green-900/20"
                   >
                     <Film className="w-4 h-4" />
                     <span>Download GIF</span>
                   </button>
                )}
             </div>
           )}
        </div>
      </div>

      {/* Presets (Placeholder for now) */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Presets</h3>
        <div className="p-4 rounded-lg bg-neutral-800/50 border border-neutral-800 text-center text-sm text-neutral-500 italic">
          Coming Soon
        </div>
      </div>
    </aside>
  );
};
