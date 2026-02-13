import { create } from 'zustand';

export type MediaType = 'image' | 'video' | 'gif';

/** Tunable settings that can be saved/loaded as presets */
export interface Settings {
  columns: number;
  charset: string;
  mode: 'standard' | 'sobel' | 'prewitt' | 'laplacian' | 'canny';
  dither: 'none' | 'bayer' | 'floyd' | 'atkinson' | 'stucki' | 'sierra';
  isInverted: boolean;
  brightness: number;
  contrast: number;
  saturation: number;
  gamma: number;
  colorMode: boolean;
  fgColor: string;
  bgColor: string;
}

export interface Preset {
  name: string;
  settings: Settings;
  builtIn?: boolean;
}

export interface PostProcessing {
  scanlines: boolean;
  scanlinesOpacity: number;
  scanlinesSpacing: number;
  vignette: boolean;
  vignetteIntensity: number;
  crtCurve: boolean;
  crtAmount: number;
  bloom: boolean;
  bloomIntensity: number;
  grain: boolean;
  grainIntensity: number;
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

  // Post-processing (visual only, not in presets)
  postProcessing: PostProcessing;

  // Presets
  presets: Preset[];

  // Actions
  setFile: (file: File | null) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  updatePostProcessing: (pp: Partial<PostProcessing>) => void;
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
  { name: 'Photo', builtIn: true, settings: { columns: 120, charset: '@%#*+=-:. ', mode: 'standard', dither: 'none', isInverted: false, brightness: 1.0, contrast: 1.0, saturation: 1.0, gamma: 1.0, colorMode: false, fgColor: '#ffffff', bgColor: '#000000' }},
  { name: 'Retro', builtIn: true, settings: { columns: 80, charset: '█▓▒░ ', mode: 'standard', dither: 'bayer', isInverted: false, brightness: 1.0, contrast: 1.2, saturation: 1.0, gamma: 1.0, colorMode: false, fgColor: '#33ff33', bgColor: '#0a0a0a' }},
  { name: 'Minimal', builtIn: true, settings: { columns: 100, charset: '#+-. ', mode: 'standard', dither: 'none', isInverted: false, brightness: 1.0, contrast: 1.0, saturation: 1.0, gamma: 1.0, colorMode: false, fgColor: '#ffffff', bgColor: '#000000' }},
  { name: 'Matrix', builtIn: true, settings: { columns: 150, charset: '0123456789abcdef', mode: 'standard', dither: 'floyd', isInverted: true, brightness: 0.8, contrast: 1.3, saturation: 1.0, gamma: 1.0, colorMode: true, fgColor: '#00ff41', bgColor: '#0d0208' }},
  { name: 'Amber CRT', builtIn: true, settings: { columns: 100, charset: '@%#*+=-:. ', mode: 'standard', dither: 'none', isInverted: false, brightness: 1.1, contrast: 1.2, saturation: 1.0, gamma: 0.9, colorMode: false, fgColor: '#ffb000', bgColor: '#1a0800' }},
  { name: 'High Detail', builtIn: true, settings: { columns: 200, charset: " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$", mode: 'standard', dither: 'floyd', isInverted: false, brightness: 1.0, contrast: 1.1, saturation: 1.2, gamma: 1.0, colorMode: false, fgColor: '#ffffff', bgColor: '#000000' }},
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
  saturation: 1.0,
  gamma: 1.0,
  colorMode: false,
  fgColor: '#ffffff',
  bgColor: '#000000',
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

  postProcessing: {
    scanlines: false,
    scanlinesOpacity: 0.15,
    scanlinesSpacing: 3,
    vignette: false,
    vignetteIntensity: 0.6,
    crtCurve: false,
    crtAmount: 0.03,
    bloom: false,
    bloomIntensity: 0.4,
    grain: false,
    grainIntensity: 0.15,
  },

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
  
  updatePostProcessing: (pp) => set((state) => ({
    postProcessing: { ...state.postProcessing, ...pp }
  })),
  
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
      saturation: state.saturation,
      gamma: state.gamma,
      colorMode: state.colorMode,
      fgColor: state.fgColor,
      bgColor: state.bgColor,
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
