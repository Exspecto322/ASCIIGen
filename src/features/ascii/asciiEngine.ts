export interface AsciiOptions {
  columns: number;
  charset: string;
  dither: 'none' | 'bayer' | 'floyd';
  isInverted: boolean;
  brightness: number;
  contrast: number;
}

/** Area-average resize with integrated grayscale conversion */
const resizeImage = (srcData: ImageData, width: number, height: number): Float32Array => {
  const srcW = srcData.width;
  const srcH = srcData.height;
  const dest = new Float32Array(width * height);
  
  const xRatio = srcW / width;
  const yRatio = srcH / height;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcXStart = Math.floor(x * xRatio);
      const srcYStart = Math.floor(y * yRatio);
      const srcXEnd = Math.min(Math.ceil((x + 1) * xRatio), srcW);
      const srcYEnd = Math.min(Math.ceil((y + 1) * yRatio), srcH);
      
      let sum = 0;
      let count = 0;
      
      for (let sy = srcYStart; sy < srcYEnd; sy++) {
        for (let sx = srcXStart; sx < srcXEnd; sx++) {
          const off = (sy * srcW + sx) * 4;
          const r = srcData.data[off];
          const g = srcData.data[off + 1];
          const b = srcData.data[off + 2];
          sum += (0.299 * r + 0.587 * g + 0.114 * b);
          count++;
        }
      }
      
      dest[y * width + x] = count > 0 ? sum / count : 0;
    }
  }
  return dest;
};

/** Apply brightness & contrast adjustment */
const adjustPixel = (gray: number, brightness: number, contrast: number, isInverted: boolean): number => {
  let val = (gray - 128) * contrast + 128 + (brightness - 1.0) * 255;
  if (val < 0) val = 0;
  if (val > 255) val = 255;
  if (isInverted) return 255 - val;
  return val;
};

/** Sobel edge detection pass */
export const sobelEdge = (buffer: Float32Array, width: number, height: number): Float32Array => {
  const out = new Float32Array(buffer.length);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const tl = buffer[(y - 1) * width + (x - 1)];
      const tc = buffer[(y - 1) * width + x];
      const tr = buffer[(y - 1) * width + (x + 1)];
      const ml = buffer[y * width + (x - 1)];
      const mr = buffer[y * width + (x + 1)];
      const bl = buffer[(y + 1) * width + (x - 1)];
      const bc = buffer[(y + 1) * width + x];
      const br = buffer[(y + 1) * width + (x + 1)];
      
      const gx = -tl + tr - 2 * ml + 2 * mr - bl + br;
      const gy = -tl - 2 * tc - tr + bl + 2 * bc + br;
      
      out[y * width + x] = Math.min(255, Math.sqrt(gx * gx + gy * gy));
    }
  }
  return out;
};

export const convertToAscii = (srcData: ImageData, options: AsciiOptions): string => {
  const { columns, charset, isInverted, brightness, contrast, dither } = options;
  
  const srcW = srcData.width;
  const srcH = srcData.height;
  const aspectRatio = srcW / srcH;
  
  // Monospace chars are roughly 2x taller than wide. 
  // cellRatio ~0.5 compensates so the image maintains its proportions.
  const cellRatio = 0.5;
  const height = Math.max(1, Math.floor(columns / aspectRatio * cellRatio));
  const width = columns;
  
  // 1. Resize & grayscale
  const grayBuffer = resizeImage(srcData, width, height);
  
  // 2. Adjust brightness/contrast
  const len = charset.length;
  if (len === 0) return '';
  
  const finalBuffer = new Float32Array(grayBuffer.length);
  for (let i = 0; i < grayBuffer.length; i++) {
    finalBuffer[i] = adjustPixel(grayBuffer[i], brightness, contrast, isInverted);
  }
  
  // 3. Dithering
  if (dither === 'floyd') {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const oldVal = finalBuffer[idx];
        
        const scaled = (oldVal / 255) * (len - 1);
        const quantized = Math.round(scaled);
        const newVal = (quantized / (len - 1)) * 255;
        const quantError = oldVal - newVal;
        
        finalBuffer[idx] = newVal;
        
        if (x + 1 < width) 
          finalBuffer[y * width + (x + 1)] += quantError * (7 / 16);
        
        if (y + 1 < height) {
          if (x - 1 >= 0) 
            finalBuffer[(y + 1) * width + (x - 1)] += quantError * (3 / 16);
          
          finalBuffer[(y + 1) * width + x] += quantError * (5 / 16);
          
          if (x + 1 < width) 
            finalBuffer[(y + 1) * width + (x + 1)] += quantError * (1 / 16);
        }
      }
    }
  } else if (dither === 'bayer') {
    const bayer = [
      [ 0, 8, 2, 10],
      [12, 4, 14,  6],
      [ 3, 11, 1,  9],
      [15, 7, 13,  5]
    ];
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const val = finalBuffer[idx];
        const mapVal = bayer[y % 4][x % 4];
        const correction = (mapVal / 16 - 0.5) * (255 / (len - 1));
        finalBuffer[idx] = Math.max(0, Math.min(255, val + correction));
      }
    }
  }

  // 4. Map to characters
  let output = '';
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      let val = finalBuffer[idx];
      if (val < 0) val = 0;
      if (val > 255) val = 255;
      
      const charIndex = Math.floor(((255 - val) / 255) * (len - 0.01));
      output += charset[Math.floor(charIndex)];
    }
    output += '\n';
  }

  return output;
};
