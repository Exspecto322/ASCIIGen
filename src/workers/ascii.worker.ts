import { convertToAscii } from '../features/ascii/asciiEngine';
import type { AsciiOptions } from '../features/ascii/asciiEngine';

self.onmessage = (e: MessageEvent<{ imageData: ImageData, options: AsciiOptions }>) => {
  const { imageData, options } = e.data;
  try {
    const text = convertToAscii(imageData, options);
    self.postMessage({ text });
  } catch (err: unknown) {
    if (err instanceof Error) {
      self.postMessage({ error: err.message });
    } else {
      self.postMessage({ error: String(err) });
    }
  }
};
