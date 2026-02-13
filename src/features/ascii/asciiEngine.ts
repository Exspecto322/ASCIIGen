export interface AsciiOptions {
  columns: number;
  charset: string;
  dither: 'none' | 'bayer' | 'floyd' | 'atkinson' | 'stucki' | 'sierra';
  isInverted: boolean;
  brightness: number;
  contrast: number;
  saturation: number;
  gamma: number;
  colorMode?: boolean;
}

export interface ColorAsciiResult {
  text: string;
  html: string;
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

/** Area-average resize preserving RGB channels */
const resizeImageColor = (srcData: ImageData, width: number, height: number): Uint8ClampedArray => {
  const srcW = srcData.width;
  const srcH = srcData.height;
  const dest = new Uint8ClampedArray(width * height * 3);
  
  const xRatio = srcW / width;
  const yRatio = srcH / height;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcXStart = Math.floor(x * xRatio);
      const srcYStart = Math.floor(y * yRatio);
      const srcXEnd = Math.min(Math.ceil((x + 1) * xRatio), srcW);
      const srcYEnd = Math.min(Math.ceil((y + 1) * yRatio), srcH);
      
      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      
      for (let sy = srcYStart; sy < srcYEnd; sy++) {
        for (let sx = srcXStart; sx < srcXEnd; sx++) {
          const off = (sy * srcW + sx) * 4;
          rSum += srcData.data[off];
          gSum += srcData.data[off + 1];
          bSum += srcData.data[off + 2];
          count++;
        }
      }
      
      const dOff = (y * width + x) * 3;
      dest[dOff] = count > 0 ? rSum / count : 0;
      dest[dOff + 1] = count > 0 ? gSum / count : 0;
      dest[dOff + 2] = count > 0 ? bSum / count : 0;
    }
  }
  return dest;
};

/** Apply brightness & contrast adjustment */
const adjustPixel = (gray: number, brightness: number, contrast: number, isInverted: boolean, gamma: number): number => {
  let val = (gray - 128) * contrast + 128 + (brightness - 1.0) * 255;
  if (val < 0) val = 0;
  if (val > 255) val = 255;
  // Gamma correction
  if (gamma !== 1.0) {
    val = 255 * Math.pow(val / 255, 1.0 / gamma);
  }
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

/** Generic error-diffusion dithering.
 *  coefficients = array of [dx, dy, weight] */
const applyErrorDiffusion = (
  buffer: Float32Array, width: number, height: number, levels: number,
  coefficients: number[][]
) => {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const oldVal = buffer[idx];
      const scaled = (oldVal / 255) * (levels - 1);
      const quantized = Math.round(scaled);
      const newVal = (quantized / (levels - 1)) * 255;
      const quantError = oldVal - newVal;
      buffer[idx] = newVal;

      for (const [dx, dy, weight] of coefficients) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          buffer[ny * width + nx] += quantError * weight;
        }
      }
    }
  }
};

export const convertToAscii = (srcData: ImageData, options: AsciiOptions): string | ColorAsciiResult => {
  const { columns, charset, isInverted, brightness, contrast, dither, colorMode, saturation, gamma } = options;
  
  const srcW = srcData.width;
  const srcH = srcData.height;
  const aspectRatio = srcW / srcH;
  const cellRatio = 0.5;
  const height = Math.max(1, Math.floor(columns / aspectRatio * cellRatio));
  const width = columns;
  
  // 1. Resize & grayscale
  const grayBuffer = resizeImage(srcData, width, height);
  
  // Color buffer (only if colorMode)
  let colorBuffer: Uint8ClampedArray | null = null;
  if (colorMode) {
    colorBuffer = resizeImageColor(srcData, width, height);
    // Apply saturation adjustment to color buffer
    if (saturation !== undefined && saturation !== 1.0) {
      for (let i = 0; i < width * height; i++) {
        const off = i * 3;
        const r = colorBuffer[off];
        const g = colorBuffer[off + 1];
        const b = colorBuffer[off + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        colorBuffer[off] = Math.max(0, Math.min(255, gray + (r - gray) * saturation));
        colorBuffer[off + 1] = Math.max(0, Math.min(255, gray + (g - gray) * saturation));
        colorBuffer[off + 2] = Math.max(0, Math.min(255, gray + (b - gray) * saturation));
      }
    }
  }
  
  // 2. Adjust brightness/contrast/gamma
  const len = charset.length;
  if (len === 0) return colorMode ? { text: '', html: '' } : '';
  
  const gammaVal = gamma ?? 1.0;
  const finalBuffer = new Float32Array(grayBuffer.length);
  for (let i = 0; i < grayBuffer.length; i++) {
    finalBuffer[i] = adjustPixel(grayBuffer[i], brightness, contrast, isInverted, gammaVal);
  }
  
  // 3. Dithering
  if (dither === 'floyd') {
    applyErrorDiffusion(finalBuffer, width, height, len, [
      [1, 0, 7/16], [-1, 1, 3/16], [0, 1, 5/16], [1, 1, 1/16]
    ]);
  } else if (dither === 'atkinson') {
    applyErrorDiffusion(finalBuffer, width, height, len, [
      [1, 0, 1/8], [2, 0, 1/8], [-1, 1, 1/8], [0, 1, 1/8], [1, 1, 1/8], [0, 2, 1/8]
    ]);
  } else if (dither === 'stucki') {
    applyErrorDiffusion(finalBuffer, width, height, len, [
      [1, 0, 8/42], [2, 0, 4/42],
      [-2, 1, 2/42], [-1, 1, 4/42], [0, 1, 8/42], [1, 1, 4/42], [2, 1, 2/42],
      [-2, 2, 1/42], [-1, 2, 2/42], [0, 2, 4/42], [1, 2, 2/42], [2, 2, 1/42]
    ]);
  } else if (dither === 'sierra') {
    applyErrorDiffusion(finalBuffer, width, height, len, [
      [1, 0, 5/32], [2, 0, 3/32],
      [-2, 1, 2/32], [-1, 1, 4/32], [0, 1, 5/32], [1, 1, 4/32], [2, 1, 2/32],
      [-1, 2, 2/32], [0, 2, 3/32], [1, 2, 2/32]
    ]);
  } else if (dither === 'bayer') {
    const bayer = [
      [ 0, 8, 2, 10], [12, 4, 14, 6],
      [ 3, 11, 1, 9], [15, 7, 13, 5]
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
  let text = '';
  let html = '';
  const buildHtml = colorMode && colorBuffer;
  
  for (let y = 0; y < height; y++) {
    if (buildHtml) {
      let lastR = -1, lastG = -1, lastB = -1;
      let spanOpen = false;
      
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        let val = finalBuffer[idx];
        if (val < 0) val = 0;
        if (val > 255) val = 255;
        
        const charIndex = Math.floor(((255 - val) / 255) * (len - 0.01));
        const ch = charset[Math.floor(charIndex)];
        text += ch;
        
        const cOff = idx * 3;
        const r = colorBuffer![cOff];
        const g = colorBuffer![cOff + 1];
        const b = colorBuffer![cOff + 2];
        
        // Only emit new span when color changes
        if (r !== lastR || g !== lastG || b !== lastB) {
          if (spanOpen) html += '</span>';
          html += `<span style="color:rgb(${r},${g},${b})">`;
          spanOpen = true;
          lastR = r; lastG = g; lastB = b;
        }
        
        // Escape HTML entities
        if (ch === '<') html += '&lt;';
        else if (ch === '>') html += '&gt;';
        else if (ch === '&') html += '&amp;';
        else html += ch;
      }
      if (spanOpen) html += '</span>';
      html += '\n';
    } else {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        let val = finalBuffer[idx];
        if (val < 0) val = 0;
        if (val > 255) val = 255;
        const charIndex = Math.floor(((255 - val) / 255) * (len - 0.01));
        text += charset[Math.floor(charIndex)];
      }
    }
    text += '\n';
  }

  if (colorMode) {
    return { text, html } as ColorAsciiResult;
  }
  return text;
};
