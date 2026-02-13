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

/**
 * Render monochrome ASCII text to a canvas PNG with custom fg/bg colors.
 */
export const generatePngBlob = (
  text: string,
  fgColor = '#ffffff',
  bgColor = '#000000',
  font = '12px monospace'
): Promise<Blob | null> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(null);
      return;
    }

    const lines = text.split('\n').filter(l => l.length > 0);
    if (lines.length === 0) { resolve(null); return; }

    ctx.font = font;
    const metrics = ctx.measureText('M');
    const charWidth = metrics.width;
    const lh = parseFloat(font) * 1.15;

    const width = lines[0].length * charWidth;
    const height = lines.length * lh;

    canvas.width = Math.ceil(width + 20);
    canvas.height = Math.ceil(height + 20);

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Text
    ctx.fillStyle = fgColor;
    ctx.font = font;
    ctx.textBaseline = 'top';

    lines.forEach((line, i) => {
      ctx.fillText(line, 10, 10 + i * lh);
    });

    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/png');
  });
};

/**
 * Render COLOR ASCII art to a canvas PNG by parsing the colorHtml spans.
 * Each <span style="color:rgb(r,g,b)">chars</span> is drawn with its color.
 */
export const generateColorPngBlob = (
  colorHtml: string,
  bgColor = '#000000',
  font = '12px monospace'
): Promise<Blob | null> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) { resolve(null); return; }

    // Parse HTML lines
    const htmlLines = colorHtml.split('\n').filter(l => l.length > 0);
    if (htmlLines.length === 0) { resolve(null); return; }

    ctx.font = font;
    const charWidth = ctx.measureText('M').width;
    const lh = parseFloat(font) * 1.15;

    // Estimate width from first line char count
    const firstLineChars = htmlLines[0].replace(/<[^>]*>/g, '').length;
    const width = firstLineChars * charWidth;
    const height = htmlLines.length * lh;

    canvas.width = Math.ceil(width + 20);
    canvas.height = Math.ceil(height + 20);

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = font;
    ctx.textBaseline = 'top';

    // Parse and render each line
    const spanRegex = /<span style="color:rgb\((\d+),(\d+),(\d+)\)">(.*?)<\/span>/g;

    htmlLines.forEach((line, lineIndex) => {
      let xPos = 10;
      const yPos = 10 + lineIndex * lh;
      let match;
      spanRegex.lastIndex = 0;

      while ((match = spanRegex.exec(line)) !== null) {
        const r = match[1];
        const g = match[2];
        const b = match[3];
        const chars = match[4]
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&');

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        for (const ch of chars) {
          ctx.fillText(ch, xPos, yPos);
          xPos += charWidth;
        }
      }
    });

    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/png');
  });
};

const saveBlobAs = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadPng = async (
  text: string,
  fgColor = '#ffffff',
  bgColor = '#000000',
  filename = 'ascii-art.png'
) => {
  const blob = await generatePngBlob(text, fgColor, bgColor);
  if (blob) saveBlobAs(blob, filename);
};

export const downloadColorPng = async (
  colorHtml: string,
  bgColor = '#000000',
  filename = 'ascii-art-color.png'
) => {
  const blob = await generateColorPngBlob(colorHtml, bgColor);
  if (blob) saveBlobAs(blob, filename);
};
