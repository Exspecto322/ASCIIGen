# ASCIIGen

**ASCIIGen** is a client-side web application that converts images, videos, and GIFs into ASCII art. It runs entirely in your browser using Web Workers and FFmpeg.wasm, ensuring your data never leaves your device.

![ASCIIGen Screenshot](./public/screenshot.png)

## Features

- **Image to ASCII**: Drag & drop images, adjust resolution, charset, contrast, and brightness instantly.
- **Video/GIF to ASCII**: Convert short video clips into animated ASCII GIFs.
- **100% Client-Side**: No backend server; all processing happens in your browser.
- **Export**: Copy text, download as `.txt`, `.png`, or `.gif`.

## Tech Stack

- **React + TypeScript + Vite**: Fast development and optimized static build.
- **Zustand**: Lightweight state management.
- **Tailwind CSS**: Modern styling.
- **FFmpeg.wasm**: Video processing in the browser (Single-Threaded for broad compatibility).
- **Web Workers**: Keeps the UI responsive during heavy ASCII conversion.

## Usage

1. **Import**: Drag and drop a file or click "Import".
2. **Adjust**: Use the controls on the left to tweak columns (resolution) and characters.
3. **Export**: Use the right panel to copy or download the result.

### Video Limitations (MVP)

Since this runs on GitHub Pages without COOP/COEP headers, FFmpeg runs in single-thread mode.
- **Max Duration Recommendation**: < 10 seconds.
- **Processing Speed**: May be slow for high resolutions or framerates.
- **Resolution**: Scaled down automatically for performance.

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Deployment

This project handles deployment to GitHub Pages automatically via GitHub Actions.
Ensure `vite.config.ts` has the correct `base` path matching your repository name.

## License

MIT
