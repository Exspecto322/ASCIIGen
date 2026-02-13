import { useRef, useState, useCallback, useEffect } from 'react';
import { useStore } from '../../state/store';
import { useShallow } from 'zustand/react/shallow';
import { convertToAscii } from '../ascii/asciiEngine';
import { getCharset } from '../ascii/charsets';
import type { ColorAsciiResult } from '../ascii/asciiEngine';

/**
 * useWebcam hook — call with refs from the parent component
 * to avoid ESLint "cannot access refs during render" errors.
 */
export const useWebcam = (
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
) => {
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { columns, charset, mode, dither, isInverted, brightness, contrast, saturation, gamma, colorMode } = useStore(
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
    }))
  );

  const setAscii = useStore(s => s.setAscii);
  const setColorHtml = useStore(s => s.setColorHtml);

  // Use a ref to hold the latest processing function to avoid self-referencing
  const processFrameRef = useRef<() => void>(() => {});

  useEffect(() => {
    processFrameRef.current = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.paused || video.ended) return;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = convertToAscii(imageData, {
        columns,
        charset: getCharset(charset),
        mode,
        dither,
        isInverted,
        brightness,
        contrast,
        saturation,
        gamma,
        colorMode,
      });

      if (typeof result === 'string') {
        setAscii(result);
        setColorHtml('');
      } else {
        setAscii((result as ColorAsciiResult).text);
        setColorHtml((result as ColorAsciiResult).html);
      }

      rafRef.current = requestAnimationFrame(() => processFrameRef.current());
    };
  }, [videoRef, canvasRef, columns, charset, mode, dither, isInverted, brightness, contrast, saturation, gamma, colorMode, setAscii, setColorHtml]);

  const startWebcam = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.play();
        setIsActive(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not access webcam');
      setIsActive(false);
    }
  }, [videoRef]);

  const stopWebcam = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }
    setIsActive(false);
  }, [videoRef]);

  // Start processing when webcam is active
  useEffect(() => {
    if (!isActive) return;
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => {
      rafRef.current = requestAnimationFrame(() => processFrameRef.current());
    };
    video.addEventListener('playing', onPlay);
    if (!video.paused) {
      rafRef.current = requestAnimationFrame(() => processFrameRef.current());
    }
    return () => {
      video.removeEventListener('playing', onPlay);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, videoRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  return { isActive, error, startWebcam, stopWebcam };
};
