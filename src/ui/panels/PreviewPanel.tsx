import React, { useCallback, useRef, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useStore } from '../../state/store';
import { useShallow } from 'zustand/react/shallow';
import { useAsciiWorker } from '../../features/ascii/useAsciiWorker';
import { Upload, Play, Pause, ZoomIn, ZoomOut, Maximize2, X } from 'lucide-react';
import { convertToAscii } from '../../features/ascii/asciiEngine';
import type { ColorAsciiResult } from '../../features/ascii/asciiEngine';
import { getCharset } from '../../features/ascii/charsets';

export const PreviewPanel: React.FC = () => {
  const { fileUrl, asciiText, colorHtml, isProcessing, mediaType, gifUrl, colorMode, columns, charset, dither, isInverted, brightness, contrast } = useStore(
    useShallow(s => ({
      fileUrl: s.fileUrl,
      asciiText: s.asciiText,
      colorHtml: s.colorHtml,
      isProcessing: s.isProcessing,
      mediaType: s.mediaType,
      gifUrl: s.gifUrl,
      colorMode: s.colorMode,
      columns: s.columns,
      charset: s.charset,
      dither: s.dither,
      isInverted: s.isInverted,
      brightness: s.brightness,
      contrast: s.contrast,
    }))
  );

  const setFile = useStore(s => s.setFile);
  const setAscii = useStore(s => s.setAscii);
  const setColorHtml = useStore(s => s.setColorHtml);
  
  useAsciiWorker();

  const [zoom, setZoom] = useState(1);
  const [zoomMode, setZoomMode] = useState<'fit' | 'manual'>('fit');
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, [setFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': [],
      'video/*': [],
      'image/gif': []
    },
    multiple: false
  });

  // Video preview loop
  useEffect(() => {
    if (mediaType !== 'video' && mediaType !== 'gif') {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    
    const loop = () => {
      if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!canvas) { 
          rafRef.current = requestAnimationFrame(loop);
          return; 
        }
        
        const ctx = canvas.getContext('2d');
        if (ctx && video.videoWidth > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          const result = convertToAscii(imageData, {
            columns,
            charset: getCharset(charset),
            dither,
            isInverted,
            brightness,
            contrast,
            colorMode
          });
          
          if (typeof result === 'string') {
            setAscii(result);
            setColorHtml('');
          } else {
            const cr = result as ColorAsciiResult;
            setAscii(cr.text);
            setColorHtml(cr.html);
          }
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    
    rafRef.current = requestAnimationFrame(loop);
    
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [mediaType, columns, charset, dither, isInverted, brightness, contrast, colorMode, setAscii, setColorHtml]);

  // Paste handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            setFile(file);
            e.preventDefault();
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [setFile]);

  // Auto-zoom to fit
  useEffect(() => {
    if (zoomMode === 'fit' && containerRef.current && asciiText) {
      const lines = asciiText.split('\n');
      if (lines.length === 0) return;
      const textCols = lines[0].length;
      const textRows = lines.length;
      
      const containerW = containerRef.current.clientWidth;
      const containerH = containerRef.current.clientHeight;
      
      const CW = 4.8;
      const CH = 4.8;
      
      const contentW = textCols * CW;
      const contentH = textRows * CH;
      
      const scaleX = (containerW - 40) / contentW;
      const scaleY = (containerH - 40) / contentH;
      
      const scale = Math.min(scaleX, scaleY, 1.0);
      setZoom(Math.max(0.05, scale));
    }
  }, [asciiText, zoomMode, columns]);

  const handleZoomIn = () => {
    setZoomMode('manual');
    setZoom(z => Math.min(z * 1.25, 5));
  };
  
  const handleZoomOut = () => {
    setZoomMode('manual');
    setZoom(z => Math.max(z / 1.25, 0.05));
  };

  const handleFitZoom = () => {
    setZoomMode('fit');
  };

  const toggleVideoPlayback = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsVideoPlaying(true);
      } else {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      }
    }
  };

  const fontStyle = {
    fontFamily: '"Cascadia Code", "Consolas", "Courier New", monospace',
    lineHeight: '0.6em',
  };

  return (
    <section className="flex flex-col relative bg-neutral-950 overflow-hidden h-full">
      {!fileUrl ? (
        <div 
          {...getRootProps()} 
          className={`flex-1 flex items-center justify-center p-6 m-4 rounded-2xl transition-all duration-300 cursor-pointer group
            ${isDragActive 
              ? 'bg-indigo-500/10 border-2 border-indigo-500 shadow-[0_0_40px_rgba(99,102,241,0.15)]' 
              : 'border-2 border-dashed border-neutral-800 hover:border-neutral-600 hover:bg-white/[0.02]'
            }`}
        >
          <input {...getInputProps()} />
          <div className="text-center space-y-5">
            <div className={`w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto shadow-lg shadow-black/50 transition-all duration-300 ${isDragActive ? 'scale-110 border-indigo-500/50' : 'group-hover:scale-105 group-hover:border-neutral-700'}`}>
              <Upload className={`w-7 h-7 transition-colors ${isDragActive ? 'text-indigo-400' : 'text-neutral-500 group-hover:text-indigo-400'}`} />
            </div>
            <div>
              <h2 className="text-base font-medium text-neutral-300">Drop Media Here</h2>
              <p className="text-sm text-neutral-600 mt-1">Image, Video, or GIF</p>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <span className="text-[10px] text-neutral-700 bg-neutral-900 px-2 py-0.5 rounded font-mono">Ctrl+V</span>
              <span className="text-[10px] text-neutral-700">to paste</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden bg-neutral-950 flex flex-col items-center justify-center relative">
          
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center bg-black/70 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl">
            <button 
              onClick={() => setFile(null)} 
              className="p-2 hover:bg-white/10 rounded-l-full text-neutral-400 hover:text-white transition-colors"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            
            <div className="w-px h-5 bg-white/10" />
            
            <button onClick={handleZoomOut} className="p-2 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors" title="Zoom Out">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            
            <button
              onClick={handleFitZoom}
              className={`px-2.5 py-1.5 text-[11px] font-mono tabular-nums cursor-pointer transition-colors ${zoomMode === 'fit' ? 'text-indigo-300' : 'text-neutral-400 hover:text-white'}`}
              title="Fit to Screen"
            >
              {Math.round(zoom * 100)}%
            </button>
            
            <button onClick={handleZoomIn} className="p-2 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors" title="Zoom In">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            
            <div className="w-px h-5 bg-white/10" />
            
            <button 
              onClick={handleFitZoom}
              className="p-2 hover:bg-white/10 rounded-r-full text-neutral-400 hover:text-white transition-colors"
              title="Fit"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {(mediaType === 'video' || mediaType === 'gif') && (
            <>
              <video 
                ref={videoRef}
                src={fileUrl}
                className="hidden"
                loop
                muted
                playsInline
                autoPlay
              />
              <canvas ref={canvasRef} className="hidden" />
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/70 px-4 py-2 rounded-full backdrop-blur-xl z-20 border border-white/10">
                <button 
                  onClick={toggleVideoPlayback}
                  className="p-1.5 rounded-full hover:bg-white/10 text-white transition-colors"
                >
                  {isVideoPlaying 
                    ? <Pause className="w-4 h-4 fill-white" /> 
                    : <Play className="w-4 h-4 fill-white" />
                  }
                </button>
              </div>
            </>
          )}

          <div ref={containerRef} className="w-full h-full flex items-center justify-center overflow-auto p-4 cursor-grab active:cursor-grabbing custom-scrollbar">
            <div 
              className="bg-black origin-center transition-transform duration-150 ease-out"
              style={{ transform: `scale(${zoom})` }}
            >
              {colorMode && colorHtml ? (
                <pre 
                  className="font-mono text-[8px] leading-[8px] whitespace-pre select-text"
                  style={fontStyle}
                  dangerouslySetInnerHTML={{ __html: colorHtml }}
                />
              ) : (
                <pre 
                  className="font-mono text-[8px] leading-[8px] whitespace-pre text-white/90 select-text"
                  style={fontStyle}
                >
                  {asciiText}
                </pre>
              )}
            </div>
          </div>
              
          {isProcessing && mediaType === 'image' && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-40">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-neutral-500 font-mono">Processing…</span>
              </div>
            </div>
          )}
              
          {gifUrl && (
            <div className="absolute top-3 right-3 bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-[10px] font-semibold border border-green-500/20 backdrop-blur-xl z-30 uppercase tracking-wider">
              GIF Ready
            </div>
          )}
        </div>
      )}
    </section>
  );
};
