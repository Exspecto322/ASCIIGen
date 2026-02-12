export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy', err);
    return false;
  }
};

export const downloadTxt = (text: string, filename = 'ascii-art.txt') => {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const generatePngBlob = (text: string, font = '12px monospace'): Promise<Blob | null> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(null);
      return;
    }

    const lines = text.split('\n');
    
    // Measure char width
    ctx.font = font;
    const metrics = ctx.measureText('M');
    const charWidth = metrics.width;

    // const lineHeight = parseFloat(font) * lineHeightRatio; 
    // Wait, lineHeightRatio passed is heuristic. 
    // If font is 10px, line-height 6px is very tight (0.6).
    // Let's use simpler logic: 
    // Standard terminal line height is usually slightly more than font size if we want readability,
    // BUT for ASCII art to look like image, line height should be ~0.5-0.6 of width.
    // charWidth is width of 1 char. Line height should be charWidth * 2 (approx) if chars are 1:2.
    // Actually most fonts are.
    // Let's stick to simple passed ratio or fixed value.
    // The PreviewPanel uses line-height: 0.6em.
    
    // We'll use 12px font.
    // Line height = 12 * 0.6 = 7.2px.
    // Char width approx 7.2px for monospace? No, usually ~0.6 of size. 12 * 0.6 = 7.2.
    // So roughly square grid.
    
    // Canvas dimensions
    const width = lines[0].length * charWidth; // Assuming rectangular
    const height = lines.length * (parseFloat(font) * 0.6); // Match ratio

    canvas.width = Math.ceil(width + 20); // Padding
    canvas.height = Math.ceil(height + 20);

    // Draw
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = font;
    ctx.textBaseline = 'top';
    
    const lh = parseFloat(font) * 0.6;
    
    lines.forEach((line, i) => {
      ctx.fillText(line, 10, 10 + i * lh);
    });

    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/png');
  });
};

export const downloadPng = async (text: string, filename = 'ascii-art.png') => {
  const blob = await generatePngBlob(text);
  if (blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};
