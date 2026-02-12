import { useEffect, useRef } from 'react';
import { useStore } from '../../state/store';
import AsciiWorker from '../../workers/ascii.worker?worker';

export const useAsciiWorker = () => {
  const { 
    fileUrl, 
    columns, 
    charset, 
    dither, 
    isInverted, 
    brightness, 
    contrast,
    setAscii,
    setProcessing
  } = useStore();

  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new AsciiWorker();
    workerRef.current.onmessage = (e) => {
      if (e.data.text) {
        setAscii(e.data.text);
        setProcessing(false);
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, [setAscii, setProcessing]);

  useEffect(() => {
    if (!fileUrl) return;

    const processImage = async () => {
      setProcessing(true);
      
      const img = new Image();
      img.src = fileUrl;
      await new Promise((resolve) => { img.onload = resolve; });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Get charset string from store (assuming name is stored, functionality needs to lookup string)
      // Wait, store stores 'name', we need to pass actual string?
      // Or worker imports charsets? Worker is isolated. 
      // Better to pass string.
      // But we need to import CHARSETS here or in store.
      // Let's import CHARSETS here.
      
      // Wait, I can't import inside useEffect easily if I didn't import at top. I will import at top.
      // BUT `charsets.ts` is in `../features/ascii/charsets.ts`.
      
      workerRef.current?.postMessage({
        imageData,
        options: {
          columns,
          charset: getCharsetString(charset),
          dither,
          isInverted,
          brightness,
          contrast
        }
      });
    };

    const timer = setTimeout(() => {
        processImage();
    }, 100); // 100ms debounce

    return () => clearTimeout(timer);
    
  }, [fileUrl, columns, charset, dither, isInverted, brightness, contrast, setProcessing]);
};

// Helper (or import if possible)
import { CHARSETS } from './charsets';
const getCharsetString = (name: string) => CHARSETS[name] || (name.length > 0 ? name : CHARSETS['Standard']);
