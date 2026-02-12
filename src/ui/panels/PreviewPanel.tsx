import React, { useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useStore } from '../../state/store';
import { useAsciiWorker } from '../../features/ascii/useAsciiWorker';
import { Upload, Play } from 'lucide-react';
import { convertToAscii } from '../../features/ascii/asciiEngine';
import { getCharset } from '../../features/ascii/charsets';

export const PreviewPanel: React.FC = () => {
  const { 
    fileUrl, asciiText, setFile, isProcessing, 
    mediaType, gifUrl,
    columns, charset, dither, isInverted, brightness, contrast,
    setAscii
  } = useStore();
  
  // Worker for Image
  useAsciiWorker();

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

  // Video Preview Logic
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null); // Offscreen canvas for sampling
  const rafRef = useRef<number>(null);

  useEffect(() => {
    if (mediaType !== 'video' && mediaType !== 'gif') {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    
    // Video Loop
    const loop = () => {
      if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
        // Draw frame to canvas
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!canvas) { 
           rafRef.current = requestAnimationFrame(loop);
           return; 
        } // Wait for ref?
        
        // We create canvas if null? No, just render hidden canvas in JSX
      
        const ctx = canvas.getContext('2d');
        if (ctx && video.videoWidth > 0) {
           canvas.width = video.videoWidth;
           canvas.height = video.videoHeight;
           ctx.drawImage(video, 0, 0);
           const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
           
           // Convert sync for preview (fast enough for small resolutions)
           // If columns > 200, might lag.
           // We can use a separate worker for this loop if needed, but main thread is easiest for sync with video.
           // Let's try main thread.
           
           const text = convertToAscii(imageData, {
             columns,
             charset: getCharset(charset),
             dither,
             isInverted,
             brightness,
             contrast
           });
           
           setAscii(text);
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    
    rafRef.current = requestAnimationFrame(loop);
    
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [mediaType, columns, charset, dither, isInverted, brightness, contrast, setAscii]);

  // Handle Paste
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



  const [zoom, setZoom] = React.useState(1);
  const [zoomMode, setZoomMode] = React.useState<'fit' | 'manual'>('fit');
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-zoom to fit
  useEffect(() => {
    if (zoomMode === 'fit' && containerRef.current && asciiText) {
       // Heuristic: 
       // approximate char width ~0.6em (6px at 10px font? No, font size is 8px? 6px?)
       // We use 8px font. Char width ~4.8px.
       // Lines = text.split('\n').length
       // Cols = text.split('\n')[0].length
       
       const lines = asciiText.split('\n');
       if (lines.length === 0) return;
       const textCols = lines[0].length;
       const textRows = lines.length;
       
       const containerW = containerRef.current.clientWidth;
       const containerH = containerRef.current.clientHeight;
       
       // Char dims at scale 1 (font 8px, lh 0.6em = 4.8px)
       // CW ~ 8 * 0.6 = 4.8px
       // CH = 4.8px
       const CW = 4.8;
       const CH = 4.8;
       
       const contentW = textCols * CW;
       const contentH = textRows * CH;
       
       const scaleX = (containerW - 40) / contentW; // 40px padding
       const scaleY = (containerH - 40) / contentH;
       
       const scale = Math.min(scaleX, scaleY, 1.0); // Don't zoom in automatically above 1
       setZoom(Math.max(0.1, scale));
    }
  }, [asciiText, zoomMode, columns]); // Recalc on text change

  const handleZoomIn = () => {
    setZoomMode('manual');
    setZoom(z => Math.min(z * 1.2, 5));
  };
  
  const handleZoomOut = () => {
     setZoomMode('manual');
     setZoom(z => Math.max(z / 1.2, 0.1));
  };

  return (
    <section className="flex flex-col relative bg-neutral-950 overflow-hidden h-full">
         {!fileUrl ? (
           // Dropzone UI (unchanged)
           <div {...getRootProps()} className={`flex-1 flex items-center justify-center p-8 border-2 border-dashed m-4 rounded-xl transition-colors ${isDragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-neutral-800 hover:border-neutral-700'}`}>
             <input {...getInputProps()} />
             <div className="text-center space-y-4 cursor-pointer">
               <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto shadow-lg shadow-black/50">
                 <Upload className="w-8 h-8 text-indigo-500" />
               </div>
               <div>
                 <h2 className="text-lg font-medium text-neutral-300">Drop Media Here</h2>
                 <p className="text-sm text-neutral-500 mt-1">Image, Video, or GIF</p>
                 <p className="text-xs text-neutral-600 mt-4">Ctrl+V to Paste</p>
               </div>
             </div>
           </div>
        ) : (
          <div className="flex-1 overflow-hidden bg-neutral-950 flex flex-col items-center justify-center relative">
             
             {/* Toolbar */}
             <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-neutral-900/80 p-1.5 rounded-full border border-neutral-800 backdrop-blur-md">
                <button onClick={handleZoomOut} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors text-lg" title="Zoom Out">-</button>
                <div 
                   onClick={() => setZoomMode('fit')}
                   className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${zoomMode === 'fit' ? 'bg-indigo-500/20 text-indigo-300' : 'text-neutral-400 hover:text-white'}`}
                   title="Reset to Fit"
                >
                  {Math.round(zoom * 100)}%
                </div>
                <button onClick={handleZoomIn} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors text-lg" title="Zoom In">+</button>
             </div>

             {/* Hidden Video Element for sampling */}
             {(mediaType === 'video' || mediaType === 'gif') && (
               <>
                 <video 
                   ref={videoRef}
                   src={fileUrl}
                   className="hidden" // hidden, we use ascii output
                   // controls
                   loop
                   muted
                   playsInline
                   autoPlay
                 />
                 <canvas ref={canvasRef} className="hidden" />
                 
                 {/* Floating Controls for Video */}
                 <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-neutral-900/80 p-2 rounded-full backdrop-blur z-20 border border-neutral-700/50">
                    <button 
                      onClick={() => {
                        if (videoRef.current) {
                          if (videoRef.current.paused) videoRef.current.play();
                          else videoRef.current.pause();
                        }
                      }}
                      className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
                    >
                      {/* Toggle Icon */}
                      <Play className="w-4 h-4 fill-white" />
                    </button>
                    {/* Could add scrubber here */}
                 </div>
               </>
             )}

             {/* ASCII Output */}
             <div ref={containerRef} className="w-full h-full flex items-center justify-center overflow-auto p-4 cursor-grab active:cursor-grabbing">
                <div 
                  className="bg-black origin-center transition-transform duration-200 ease-out shadow-2xl"
                  style={{ 
                    transform: `scale(${zoom})`,
                  }}
                >
                  <pre 
                    className="font-mono text-[8px] leading-[8px] whitespace-pre text-white select-text"
                    style={{ 
                      fontFamily: '"Cascadia Code", "Consolas", "Courier New", monospace',
                      lineHeight: '0.6em',
                    }}
                  >
                    {asciiText}
                  </pre>
                </div>
             </div>
                
                {isProcessing && mediaType === 'image' && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm z-40">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                
                {gifUrl && (
                  <div className="absolute top-4 left-4 bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-xs font-medium border border-green-500/30 backdrop-blur-md z-30">
                    GIF Ready
                  </div>
                )}
          
             <button 
               onClick={() => setFile(null)} 
               className="absolute top-4 right-4 bg-neutral-900/80 p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white backdrop-blur-md border border-neutral-700/50 z-30"
             >
               ×
             </button>
          </div>
        )}
    </section>
  );
};
