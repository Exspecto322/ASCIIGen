export interface AsciiOptions {
  columns: number;
  charset: string;
  dither: 'none' | 'bayer' | 'floyd';
  isInverted: boolean;
  brightness: number;
  contrast: number;
}

// Helper: Resize image using Area Averaging (better for downscaling)
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
          // Weighted Grayscale: 0.299 R + 0.587 G + 0.114 B
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

// Helper: Apply Brightness/Contrast
const adjustPixel = (gray: number, brightness: number, contrast: number, isInverted: boolean): number => {
  // Contrast/Brightness
  let val = (gray - 128) * contrast + 128 + (brightness - 1.0) * 255;
  if (val < 0) val = 0;
  if (val > 255) val = 255;
  
  if (isInverted) return 255 - val;
  return val;
};

export const convertToAscii = (srcData: ImageData, options: AsciiOptions): string => {
  const { columns, charset, isInverted, brightness, contrast, dither } = options;
  
  const srcW = srcData.width;
  const srcH = srcData.height;
  const aspectRatio = srcW / srcH;
  // Cell ratio 1.0 looks best for our "Square-ish" fonts in preview
  const cellRatio = 1.0; 
  const height = Math.floor(columns / aspectRatio * cellRatio);
  const width = columns;
  
  // 1. Resize & Grayscale to buffer
  const grayBuffer = resizeImage(srcData, width, height);
  
  // 2. Adjust & Dither
  const len = charset.length;
  let output = '';
  
  // We need a mutable buffer for error diffusion
  // Apply adjustments first? No, dither works on final values.
  
  // Create final value buffer
  const finalBuffer = new Float32Array(grayBuffer.length);
  for(let i=0; i<grayBuffer.length; i++) {
    finalBuffer[i] = adjustPixel(grayBuffer[i], brightness, contrast, isInverted);
  }
  
  if (dither === 'floyd') {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const oldVal = finalBuffer[idx];
        
        // Quantize
        // We have 'len' buckets. 0..(len-1)
        // val 0..255.
        // normalized = oldVal / 255
        // scaled = normalized * (len - 1)
        // quantized = round(scaled)
        // newVal = (quantized / (len - 1)) * 255
        
        const scaled = (oldVal / 255) * (len - 1);
        const quantized = Math.round(scaled);
        const newVal = (quantized / (len - 1)) * 255;
        
        const quantError = oldVal - newVal;
        
        finalBuffer[idx] = newVal; // Storing "expected" value for mapping? 
        // Actually we just need the index really. 
        // But for error diffusion we need to propogate error to neighbors.
        
        // Floyd-Steinberg neighbors
        // x+1, y   : 7/16
        // x-1, y+1 : 3/16
        // x,   y+1 : 5/16
        // x+1, y+1 : 1/16
        
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
    // 4x4 Bayer Matrix
    const bayer = [
      [ 0, 8, 2,10],
      [12, 4,14, 6],
      [ 3,11, 1, 9],
      [15, 7,13, 5]
    ];
    // Scale by 1/16 * 255? Or just threshold?
    // Ordered dithering usually compares value + threshold.
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const val = finalBuffer[idx];
        
        // Map 0..15 to 0..255 range partially
        // Adjust val based on map
        // Simple approach: val + (map - 8) * scale
        const mapVal = bayer[y % 4][x % 4];
        const correction = (mapVal / 16 - 0.5) * (255 / (len - 1)); // Scale correction by step size
        
        finalBuffer[idx] = Math.max(0, Math.min(255, val + correction));
      }
    }
  }

  // 3. Map to Chars
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      // Clamp
      let val = finalBuffer[idx];
      if (val < 0) val = 0;
      if (val > 255) val = 255;
      
      // Map to char. 
      // Bright (255) -> Index 0 (@)
      // Dark (0) -> Index Last ( )
      // Formula: (255 - val) / 255 * (len - 1)
      const charIndex = Math.floor(((255 - val) / 255) * (len - 0.01)); // epsilon to avoid overflow
      output += charset[Math.floor(charIndex)];
    }
    output += '\n';
  }

  return output;
};
