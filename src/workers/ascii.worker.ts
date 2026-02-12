import { convertToAscii } from '../features/ascii/asciiEngine';
import type { AsciiOptions, ColorAsciiResult } from '../features/ascii/asciiEngine';

self.onmessage = (e: MessageEvent<{ imageData: ImageData, options: AsciiOptions }>) => {
  const { imageData, options } = e.data;
  try {
    const result = convertToAscii(imageData, options);
    if (typeof result === 'string') {
      self.postMessage({ text: result });
    } else {
      const colorResult = result as ColorAsciiResult;
      self.postMessage({ text: colorResult.text, html: colorResult.html });
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      self.postMessage({ error: err.message });
    } else {
      self.postMessage({ error: String(err) });
    }
  }
};
