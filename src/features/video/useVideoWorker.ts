import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../../state/store';
import VideoWorker from '../../workers/video.worker?worker';

export const useVideoWorker = () => {
  const { 
    file, 
    columns, 
    charset, 
    dither, 
    isInverted, 
    brightness, 
    contrast,
    setProcessing,
    setVideoProgress,
  } = useStore();

  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new VideoWorker();
    
    // Init ffmpeg
    workerRef.current.postMessage({ type: 'init' });

    workerRef.current.onmessage = (e) => {
      const { type, status, progress, gifUrl, error } = e.data;
      
      if (type === 'ready') {
        console.log('FFmpeg ready');
      } else if (type === 'status') {
        console.log('Video Worker Status:', status);
      } else if (type === 'progress') {
        setVideoProgress(progress);
      } else if (type === 'done') {
        setProcessing(false);
        setVideoProgress(100);
        // Save gifUrl in store
        // We added gifUrl to state, but not a specific setter. 
        // We can use updateSettings type hack or add it properly.
        // Let's assume useStore was updated with 'setGifUrl' or I can patch it.
        // I'll use a local hack for now:
        useStore.setState({ gifUrl });
      } else if (type === 'error') {
        console.error('Video Worker Error:', error);
        setProcessing(false);
        alert('Video processing failed: ' + error);
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, [setProcessing, setVideoProgress]);

  const convertVideo = useCallback(() => {
    if (!file || !workerRef.current) return;
    
    setProcessing(true);
    setVideoProgress(0);
    useStore.setState({ gifUrl: null }); // Clear previous
    
    workerRef.current.postMessage({
      type: 'process',
      data: {
        file,
        options: {
          columns,
          // asciiEngine helper takes options with 'charset' string.
          // Wait, 'asciiEngine.ts' received 'charset' string.
          // In `useAsciiWorker`, I looked up the string. 
          // Here I need to do the same.
          // I need to import getCharset logic.
          // But charset is just a string in store.
          // I should import CHARSETS helper here.
          charset: getCharsetString(charset),
          dither,
          isInverted,
          brightness,
          contrast
        }
      }
    });
  }, [file, columns, charset, dither, isInverted, brightness, contrast, setProcessing, setVideoProgress]);

  return { convertVideo };
};

// Helper
import { CHARSETS } from '../ascii/charsets';
const getCharsetString = (name: string) => CHARSETS[name] || CHARSETS['Standard'];
