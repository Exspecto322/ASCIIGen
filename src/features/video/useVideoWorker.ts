import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../../state/store';
import { useShallow } from 'zustand/react/shallow';
import { CHARSETS } from '../ascii/charsets';
import VideoWorker from '../../workers/video.worker?worker';

const getCharsetString = (name: string) => CHARSETS[name] || CHARSETS['Standard'];

export const useVideoWorker = () => {
  const { file, columns, charset, dither, isInverted, brightness, contrast, saturation, gamma } = useStore(
    useShallow(s => ({
      file: s.file,
      columns: s.columns,
      charset: s.charset,
      dither: s.dither,
      isInverted: s.isInverted,
      brightness: s.brightness,
      contrast: s.contrast,
      saturation: s.saturation,
      gamma: s.gamma,
    }))
  );

  const setProcessing = useStore(s => s.setProcessing);
  const setVideoProgress = useStore(s => s.setVideoProgress);

  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new VideoWorker();
    
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
        useStore.setState({ gifUrl });
      } else if (type === 'error') {
        console.error('Video Worker Error:', error);
        setProcessing(false);
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
    useStore.setState({ gifUrl: null });
    
    workerRef.current.postMessage({
      type: 'process',
      data: {
        file,
        options: {
          columns,
          charset: getCharsetString(charset),
          dither,
          isInverted,
          brightness,
          contrast,
          saturation,
          gamma
        }
      }
    });
  }, [file, columns, charset, dither, isInverted, brightness, contrast, saturation, gamma, setProcessing, setVideoProgress]);

  return { convertVideo };
};
