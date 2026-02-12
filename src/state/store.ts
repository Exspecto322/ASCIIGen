import { create } from 'zustand';

export type MediaType = 'image' | 'video' | 'gif';

export interface AppState {
  // Input
  file: File | null;
  fileUrl: string | null;
  mediaType: MediaType | null;

  // Settings
  columns: number;
  charset: string;
  mode: 'standard' | 'edge'; // Edge detection mode
  dither: 'none' | 'bayer' | 'floyd';
  isInverted: boolean;
  brightness: number; // 1.0 is default
  contrast: number; // 1.0 is default
  
  // Output
  asciiText: string;
  isProcessing: boolean;
  
  // Video specific
  videoProgress: number;
  videoFrames: string[]; // ASCII frames
  gifUrl: string | null;
  isPlaying: boolean;
  frameRate: number;

  // Actions
  setFile: (file: File | null) => void;
  updateSettings: (settings: Partial<AppState>) => void;
  setAscii: (text: string) => void;
  setProcessing: (isProcessing: boolean) => void;
  setVideoProgress: (progress: number) => void;
  addVideoFrame: (frame: string) => void;
  reset: () => void;
}

export const useStore = create<AppState>((set) => ({
  file: null,
  fileUrl: null,
  mediaType: null,
  
  columns: 120, // Increased default
  charset: '@%#*+=-:. ', // Standard charset directly
  mode: 'standard',
  dither: 'none',
  isInverted: false,
  brightness: 1.0,
  contrast: 1.0,
  
  asciiText: '',
  isProcessing: false,
  
  videoProgress: 0,
  videoFrames: [],
  gifUrl: null,
  isPlaying: false,
  frameRate: 15,

  setFile: (file) => {
    if (!file) {
      set({ 
        file: null, 
        fileUrl: null, 
        mediaType: null, 
        asciiText: '', 
        videoFrames: [], 
        videoProgress: 0,
        isProcessing: false
      });
      return;
    }
    const url = URL.createObjectURL(file);
    let type: MediaType = 'image';
    if (file.type.startsWith('video')) type = 'video';
    if (file.type === 'image/gif') type = 'gif'; // Treat GIF as video-like logic later or image? Prompt says Video/GIF -> ASCII animation.
    
    set({ 
      file, 
      fileUrl: url, 
      mediaType: type, 
      asciiText: '', 
      videoFrames: [], 
      videoProgress: 0,
      isProcessing: false
    });
  },
  
  updateSettings: (settings) => set((state) => ({ ...state, ...settings })),
  
  setAscii: (text) => set({ asciiText: text }),
  
  setProcessing: (isProcessing) => set({ isProcessing }),
  
  setVideoProgress: (progress) => set({ videoProgress: progress }),
  
  addVideoFrame: (frame) => set((state) => ({ videoFrames: [...state.videoFrames, frame] })),

  reset: () => set({ file: null, fileUrl: null, mediaType: null, asciiText: '', videoFrames: [] })
}));
