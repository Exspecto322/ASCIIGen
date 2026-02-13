import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { convertToAscii } from '../features/ascii/asciiEngine';
import type { AsciiOptions } from '../features/ascii/asciiEngine';

// Constants
const CORE_VERSION = '0.12.6'; // Safe version
const BASE_URL = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/esm`;

let ffmpeg: FFmpeg | null = null;

// Helper to draw text to OffscreenCanvas and return bytes
// (Unused helper removed)

// Async helper
const blobToUint8Array = async (blob: Blob): Promise<Uint8Array> => {
  const buf = await blob.arrayBuffer();
  return new Uint8Array(buf);
};

self.onmessage = async (e) => {
  const { type, data } = e.data;

  try {
    if (type === 'init') {
      if (!ffmpeg) {
        ffmpeg = new FFmpeg();
        ffmpeg.on('log', ({ message }) => {
          self.postMessage({ type: 'log', message });
        });
        
        await ffmpeg.load({
          coreURL: await toBlobURL(`${BASE_URL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${BASE_URL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
      }
      self.postMessage({ type: 'ready' });
    }
    else if (type === 'process') {
      if (!ffmpeg) throw new Error('FFmpeg not initialized');
      
      const { file, options } = data as { file: File, options: AsciiOptions };
      const { name } = file;

      
      self.postMessage({ type: 'status', status: 'Writing file...' });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await ffmpeg.writeFile(name, new Uint8Array(await file.arrayBuffer()) as any);
      
      // 1. Extract frames
      // Limit to 5-10s, 10fps.
      // ffmpeg -i input -t 10 -vf fps=10 frames%03d.png
      self.postMessage({ type: 'status', status: 'Extracting frames...' });
      await ffmpeg.exec([
        '-i', name,
        '-t', '10',
        '-vf', 'fps=10,scale=320:-1', // Scale down input to efficient size for ASCII analysis
        'frame%03d.png'
      ]);
      
      // 2. Read frames and Convert
      const files = await ffmpeg.listDir('.');
      const frameFiles = files.filter(f => f.name.startsWith('frame') && f.name.endsWith('.png')).sort((a,b) => a.name.localeCompare(b.name));
      
      const asciiFrames: string[] = [];
      
      self.postMessage({ type: 'status', status: 'Converting to ASCII...' });
      
      // We need to re-encode to GIF from the ASCII output.
      // To do that, we need to render ASCII to image, write back to memfs.
      
      let frameIndex = 0;
      for (const f of frameFiles) {
        // Read file
        const data = await ffmpeg.readFile(f.name);
        // Create bitmap to get ImageData? 
        // In worker, we can use ImageBitmap
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const blob = new Blob([data as any], { type: 'image/png' });
        const bmp = await createImageBitmap(blob);
        
        // Draw to offscreen canvas to get pixel data
        const canvas = new OffscreenCanvas(bmp.width, bmp.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        ctx.drawImage(bmp, 0, 0);
        const imageData = ctx.getImageData(0, 0, bmp.width, bmp.height);
        
        // Convert to ASCII
        const result = convertToAscii(imageData, { ...options, colorMode: false });
        const ascii = typeof result === 'string' ? result : result.text;
        asciiFrames.push(ascii);
        
        // Render ASCII to PNG for GIF
        const fontSize = 10;
        const lineHeight = 12; // 1.15em of fontSize 10
        const lines = ascii.split('\n');
        // Uniform width...
        const charWidth = 6; // Approx
        const width = lines[0].length * charWidth;
        const height = lines.length * lineHeight;
        
        const outCanvas = new OffscreenCanvas(width, height);
        const outCtx = outCanvas.getContext('2d');
        if (!outCtx) continue;
        
        outCtx.fillStyle = '#000000';
        outCtx.fillRect(0, 0, width, height);
        outCtx.fillStyle = '#ffffff';
        outCtx.font = `${fontSize}px monospace`; // Standard font
        outCtx.textBaseline = 'top';
        lines.forEach((line: string, i: number) => outCtx.fillText(line, 0, i * lineHeight));
        
        const outBlob = await outCanvas.convertToBlob({ type: 'image/png' });
        const outData = await blobToUint8Array(outBlob);
        
        // Write back as input for GIF encoding
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await ffmpeg.writeFile(`out${String(frameIndex).padStart(3, '0')}.png`, outData as any);
        
        frameIndex++;
        self.postMessage({ type: 'progress', progress: (frameIndex / frameFiles.length) * 0.5 }); // 50% done
      }
      
      // 3. Encode GIF
      self.postMessage({ type: 'status', status: 'Encoding GIF...' });
      await ffmpeg.exec([
        '-framerate', '10',
        '-i', 'out%03d.png',
        '-c:v', 'gif', // default encoder
        'output.gif'
      ]);
      
      // Read GIF
      const gifData = await ffmpeg.readFile('output.gif');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gifBlob = new Blob([gifData as any], { type: 'image/gif' });
      
      self.postMessage({ 
        type: 'done', 
        asciiFrames, 
        gifUrl: URL.createObjectURL(gifBlob) 
      });
      
      // Cleanup
      for (const f of frameFiles) await ffmpeg.deleteFile(f.name);
      for (let i = 0; i < frameIndex; i++) await ffmpeg.deleteFile(`out${String(i).padStart(3, '0')}.png`);
      await ffmpeg.deleteFile('output.gif');
      await ffmpeg.deleteFile(name);
      
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      self.postMessage({ type: 'error', message: error.message });
    } else {
      self.postMessage({ type: 'error', message: String(error) });
    }
  }
};
