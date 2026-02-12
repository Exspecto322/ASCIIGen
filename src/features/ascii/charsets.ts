export const CHARSETS: Record<string, string> = {
  Standard: '@%#*+=-:. ',
  Simple: '#+-. ',
  Blocks: '█▓▒░ ',
  Binary: '01 ',
  Matrix: '0123456789abcdef',
  Edges: '/|\\- ',
};

export const getCharset = (name: string): string => {
  return CHARSETS[name] || name;
}; // Return name as is if not found (supports custom)

// Helper: Sort characters by pixel density
export const sortCharsByDensity = (chars: string): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return chars;
  
  const size = 20;
  canvas.width = size;
  canvas.height = size;
  ctx.font = `${size}px monospace`;
  
  const densityMap: { char: string, density: number }[] = [];
  
  // Unique chars
  const uniqueChars = Array.from(new Set(chars.split('')));
  
  uniqueChars.forEach(char => {
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#fff';
    ctx.fillText(char, 2, size - 4);
    
    const data = ctx.getImageData(0, 0, size, size).data;
    let count = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 0) count++;
    }
    densityMap.push({ char, density: count });
  });
  
  // Sort descending (Dense -> Sparse)
  // because engine maps 255 (Bright) to Index 0.
  // We want Bright Pixel = Dense Pixel.
  // So Index 0 should be Dense.
  
  return densityMap.sort((a, b) => b.density - a.density).map(x => x.char).join('');
};
