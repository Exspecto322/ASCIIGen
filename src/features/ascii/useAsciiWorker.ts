import { useEffect, useRef } from 'react';
import { useStore } from '../../state/store';
import { CHARSETS } from './charsets';
import AsciiWorker from '../../workers/ascii.worker?worker';

const getCharsetString = (name: string) =>
  CHARSETS[name] || (name.length > 0 ? name : CHARSETS['Standard']);

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
    }, 250);

    return () => clearTimeout(timer);
    
  }, [fileUrl, columns, charset, dither, isInverted, brightness, contrast, setProcessing]);
};
