import { create } from 'zustand';

export type MediaType = 'image' | 'video' | 'gif';

/** Tunable settings that can be saved/loaded as presets */
export interface Settings {
  columns: number;
  charset: string;
  mode: 'standard' | 'edge';
  dither: 'none' | 'bayer' | 'floyd';
  isInverted: boolean;
  brightness: number;
  contrast: number;
  colorMode: boolean;
}

export interface Preset {
  name: string;
  settings: Settings;
  builtIn?: boolean;
}

export interface AppState extends Settings {
  // Input
  file: File | null;
  fileUrl: string | null;
  mediaType: MediaType | null;
  
  // Output
  asciiText: string;
  colorHtml: string;
  isProcessing: boolean;
  
  // Video specific
  videoProgress: number;
  videoFrames: string[];
  gifUrl: string | null;
  isPlaying: boolean;
  frameRate: number;

  // Presets
  presets: Preset[];

  // Actions
  setFile: (file: File | null) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  setAscii: (text: string) => void;
  setColorHtml: (html: string) => void;
  setProcessing: (isProcessing: boolean) => void;
  setVideoProgress: (progress: number) => void;
  addVideoFrame: (frame: string) => void;
  savePreset: (name: string) => void;
  loadPreset: (preset: Preset) => void;
  deletePreset: (name: string) => void;
  reset: () => void;
}

const STORAGE_KEY = 'asciigen-presets';

const BUILT_IN_PRESETS: Preset[] = [
  { name: 'Photo', builtIn: true, settings: { columns: 120, charset: '@%#*+=-:. ', mode: 'standard', dither: 'none', isInverted: false, brightness: 1.0, contrast: 1.0, colorMode: false }},
  { name: 'Retro', builtIn: true, settings: { columns: 80, charset: '█▓▒░ ', mode: 'standard', dither: 'bayer', isInverted: false, brightness: 1.0, contrast: 1.2, colorMode: false }},
  { name: 'Minimal', builtIn: true, settings: { columns: 100, charset: '#+-. ', mode: 'standard', dither: 'none', isInverted: false, brightness: 1.0, contrast: 1.0, colorMode: false }},
  { name: 'Matrix', builtIn: true, settings: { columns: 150, charset: '0123456789abcdef', mode: 'standard', dither: 'floyd', isInverted: true, brightness: 0.8, contrast: 1.3, colorMode: true }},
];

const loadPresets = (): Preset[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const userPresets = stored ? JSON.parse(stored) : [];
    return [...BUILT_IN_PRESETS, ...userPresets];
  } catch {
    return [...BUILT_IN_PRESETS];
  }
};

const savePresetsToStorage = (presets: Preset[]) => {
  const userOnly = presets.filter(p => !p.builtIn);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userOnly));
};

const DEFAULT_SETTINGS: Settings = {
  columns: 120,
  charset: '@%#*+=-:. ',
  mode: 'standard',
  dither: 'none',
  isInverted: false,
  brightness: 1.0,
  contrast: 1.0,
  colorMode: false,
};

export const useStore = create<AppState>((set, get) => ({
  file: null,
  fileUrl: null,
  mediaType: null,
  
  ...DEFAULT_SETTINGS,
  
  asciiText: '',
  colorHtml: '',
  isProcessing: false,
  
  videoProgress: 0,
  videoFrames: [],
  gifUrl: null,
  isPlaying: false,
  frameRate: 15,

  presets: loadPresets(),

  setFile: (file) => {
    if (!file) {
      set({ 
        file: null, fileUrl: null, mediaType: null, 
        asciiText: '', colorHtml: '',
        videoFrames: [], videoProgress: 0, isProcessing: false
      });
      return;
    }
    const url = URL.createObjectURL(file);
    let type: MediaType = 'image';
    if (file.type.startsWith('video')) type = 'video';
    if (file.type === 'image/gif') type = 'gif';
    
    set({ 
      file, fileUrl: url, mediaType: type, 
      asciiText: '', colorHtml: '',
      videoFrames: [], videoProgress: 0, isProcessing: false
    });
  },
  
  updateSettings: (settings) => set((state) => ({ ...state, ...settings })),
  
  setAscii: (text) => set({ asciiText: text }),
  setColorHtml: (html) => set({ colorHtml: html }),
  
  setProcessing: (isProcessing) => set({ isProcessing }),
  setVideoProgress: (progress) => set({ videoProgress: progress }),
  addVideoFrame: (frame) => set((state) => ({ videoFrames: [...state.videoFrames, frame] })),

  savePreset: (name: string) => {
    const state = get();
    const settings: Settings = {
      columns: state.columns,
      charset: state.charset,
      mode: state.mode,
      dither: state.dither,
      isInverted: state.isInverted,
      brightness: state.brightness,
      contrast: state.contrast,
      colorMode: state.colorMode,
    };
    const newPreset: Preset = { name, settings };
    const existing = get().presets;
    const filtered = existing.filter(p => p.name !== name || p.builtIn);
    const updated = [...filtered, newPreset];
    savePresetsToStorage(updated);
    set({ presets: updated });
  },

  loadPreset: (preset: Preset) => {
    set({ ...preset.settings });
  },

  deletePreset: (name: string) => {
    const updated = get().presets.filter(p => p.name !== name || p.builtIn);
    savePresetsToStorage(updated);
    set({ presets: updated });
  },

  reset: () => set({ file: null, fileUrl: null, mediaType: null, asciiText: '', colorHtml: '', videoFrames: [] })
}));
