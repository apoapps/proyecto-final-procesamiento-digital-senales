import { calculateByteMetrics, calculatePsnr, type ByteMetrics } from './metrics';

export type ProcessingOptions = {
  quality: number;
  maxDimension: number;
  grayscale: boolean;
  removeChroma: boolean;
  compress: boolean;
  chromaColor?: string;
  chromaMode: 'remove' | 'replace';
  backgroundColor: string;
};

export type ProcessedImage = {
  id: string;
  name: string;
  sourceUrl: string;
  outputUrl: string;
  width: number;
  height: number;
  outputWidth: number;
  outputHeight: number;
  originalType: string;
  outputType: string;
  chroma: ChromaResult;
  mse: number;
  psnr: number;
  metrics: ByteMetrics;
  blob: Blob;
};

export type ChromaResult = {
  detected: boolean;
  applied: boolean;
  color: string;
  mode: 'remove' | 'replace';
  backgroundColor: string;
  removedPixels: number;
  removedPercent: number;
};

type LoadedBitmap = {
  bitmap: ImageBitmap | HTMLImageElement;
  width: number;
  height: number;
  close?: () => void;
};

export async function processImageFile(file: File, options: ProcessingOptions): Promise<ProcessedImage> {
  const sourceUrl = URL.createObjectURL(file);
  const loaded = await loadBitmap(file);
  const dimensions = options.compress ? fitWithin(loaded.width, loaded.height, options.maxDimension) : { width: loaded.width, height: loaded.height };
  const workingCanvas = document.createElement('canvas');
  workingCanvas.width = dimensions.width;
  workingCanvas.height = dimensions.height;
  const workingContext = require2d(workingCanvas);

  workingContext.fillStyle = '#ffffff';
  workingContext.fillRect(0, 0, dimensions.width, dimensions.height);
  workingContext.drawImage(loaded.bitmap, 0, 0, dimensions.width, dimensions.height);

  if (options.grayscale) {
    applyLumaTransform(workingContext, dimensions.width, dimensions.height);
  }

  const chroma = transformChromaIfPresent(workingContext, dimensions.width, dimensions.height, options);

  const reference = workingContext.getImageData(0, 0, dimensions.width, dimensions.height);
  const outputType = chooseOutputType(file, options, chroma);
  const blob = outputType === 'source/original' ? file : await canvasToBlob(workingCanvas, outputType, options.compress ? options.quality : undefined);
  const outputUrl = URL.createObjectURL(blob);
  const decoded = await loadBitmap(blob);
  const decodedCanvas = document.createElement('canvas');
  decodedCanvas.width = dimensions.width;
  decodedCanvas.height = dimensions.height;
  const decodedContext = require2d(decodedCanvas);
  decodedContext.drawImage(decoded.bitmap, 0, 0, dimensions.width, dimensions.height);
  const reconstructed = decodedContext.getImageData(0, 0, dimensions.width, dimensions.height);
  const mse = calculateMse(reference.data, reconstructed.data);

  loaded.close?.();
  decoded.close?.();

  return {
    id: `${file.name}-${file.lastModified}-${file.size}-${crypto.randomUUID()}`,
    name: file.name,
    sourceUrl,
    outputUrl,
    width: loaded.width,
    height: loaded.height,
    outputWidth: dimensions.width,
    outputHeight: dimensions.height,
    originalType: file.type || 'desconocido',
    outputType: outputType === 'source/original' ? file.type || 'application/octet-stream' : outputType,
    chroma,
    mse,
    psnr: calculatePsnr(mse),
    metrics: calculateByteMetrics(file.size, blob.size),
    blob
  };
}

function fitWithin(width: number, height: number, maxDimension: number) {
  const maxSide = Math.max(width, height);
  if (maxSide <= maxDimension) return { width, height };
  const scale = maxDimension / maxSide;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale))
  };
}

async function loadBitmap(source: Blob): Promise<LoadedBitmap> {
  if ('createImageBitmap' in window) {
    const bitmap = await createImageBitmap(source);
    return {
      bitmap,
      width: bitmap.width,
      height: bitmap.height,
      close: () => bitmap.close()
    };
  }

  const url = URL.createObjectURL(source);
  const image = new Image();
  image.decoding = 'async';
  image.src = url;
  await image.decode();
  URL.revokeObjectURL(url);
  return { bitmap: image, width: image.naturalWidth, height: image.naturalHeight };
}

function applyLumaTransform(context: CanvasRenderingContext2D, width: number, height: number) {
  const imageData = context.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  for (let index = 0; index < pixels.length; index += 4) {
    const luma = Math.round(0.299 * pixels[index] + 0.587 * pixels[index + 1] + 0.114 * pixels[index + 2]);
    pixels[index] = luma;
    pixels[index + 1] = luma;
    pixels[index + 2] = luma;
  }
  context.putImageData(imageData, 0, 0);
}

function transformChromaIfPresent(context: CanvasRenderingContext2D, width: number, height: number, options: ProcessingOptions): ChromaResult {
  const imageData = context.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  const chroma = options.chromaColor ? hexToRgb(options.chromaColor) : detectChromaColor(pixels, width, height);
  const background = hexToRgb(options.backgroundColor) ?? { r: 255, g: 255, b: 255 };

  if (!chroma) {
    return { detected: false, applied: false, color: '#ffffff', mode: options.chromaMode, backgroundColor: rgbToHex(background.r, background.g, background.b), removedPixels: 0, removedPercent: 0 };
  }

  if (!options.removeChroma) {
    return {
      detected: true,
      applied: false,
      color: rgbToHex(chroma.r, chroma.g, chroma.b),
      mode: options.chromaMode,
      backgroundColor: rgbToHex(background.r, background.g, background.b),
      removedPixels: 0,
      removedPercent: 0
    };
  }

  let removedPixels = 0;
  for (let index = 0; index < pixels.length; index += 4) {
    const distance = colorDistance(pixels[index], pixels[index + 1], pixels[index + 2], chroma.r, chroma.g, chroma.b);
    if (distance < 58) {
      if (options.chromaMode === 'replace') {
        pixels[index] = background.r;
        pixels[index + 1] = background.g;
        pixels[index + 2] = background.b;
        pixels[index + 3] = 255;
      } else {
        pixels[index + 3] = 0;
      }
      removedPixels += 1;
    } else if (distance < 92) {
      const keep = (distance - 58) / 34;
      if (options.chromaMode === 'replace') {
        pixels[index] = Math.round(background.r * (1 - keep) + pixels[index] * keep);
        pixels[index + 1] = Math.round(background.g * (1 - keep) + pixels[index + 1] * keep);
        pixels[index + 2] = Math.round(background.b * (1 - keep) + pixels[index + 2] * keep);
        pixels[index + 3] = 255;
      } else {
        pixels[index + 3] = Math.min(pixels[index + 3], Math.round(keep * 255));
      }
    }
  }

  const removedPercent = (removedPixels / Math.max(1, width * height)) * 100;
  const detected = Boolean(options.chromaColor) || removedPercent >= 2.5;
  if (detected) {
    context.putImageData(imageData, 0, 0);
  }

  return {
    detected,
    applied: detected,
    color: rgbToHex(chroma.r, chroma.g, chroma.b),
    mode: options.chromaMode,
    backgroundColor: rgbToHex(background.r, background.g, background.b),
    removedPixels: detected ? removedPixels : 0,
    removedPercent: detected ? removedPercent : 0
  };
}

function chooseOutputType(file: File, options: ProcessingOptions, chroma: ChromaResult) {
  if (!options.compress && !chroma.applied) return 'source/original';
  if (chroma.applied && chroma.mode === 'remove') return 'image/png';
  return options.compress ? 'image/jpeg' : 'image/png';
}

function detectChromaColor(pixels: Uint8ClampedArray, width: number, height: number) {
  const samples: Array<{ r: number; g: number; b: number }> = [];
  const stepX = Math.max(1, Math.floor(width / 24));
  const stepY = Math.max(1, Math.floor(height / 24));
  const edgeDepth = Math.max(3, Math.round(Math.min(width, height) * 0.08));

  for (let y = 0; y < height; y += stepY) {
    for (let x = 0; x < width; x += stepX) {
      if (x > edgeDepth && x < width - edgeDepth && y > edgeDepth && y < height - edgeDepth) continue;
      const index = (y * width + x) * 4;
      const r = pixels[index];
      const g = pixels[index + 1];
      const b = pixels[index + 2];
      const saturation = Math.max(r, g, b) - Math.min(r, g, b);
      const greenDominant = g - Math.max(r, b);
      const blueDominant = b - Math.max(r, g);
      if (saturation > 52 && (greenDominant > 28 || blueDominant > 28)) {
        samples.push({ r, g, b });
      }
    }
  }

  if (samples.length < 10) return null;

  const color = medianColor(samples);
  const matches = samples.filter((sample) => colorDistance(sample.r, sample.g, sample.b, color.r, color.g, color.b) < 70);
  if (matches.length / samples.length < 0.48) return null;
  return color;
}

function medianColor(samples: Array<{ r: number; g: number; b: number }>) {
  return {
    r: median(samples.map((sample) => sample.r)),
    g: median(samples.map((sample) => sample.g)),
    b: median(samples.map((sample) => sample.b))
  };
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) {
  const rMean = (r1 + r2) / 2;
  const deltaR = r1 - r2;
  const deltaG = g1 - g2;
  const deltaB = b1 - b2;
  return Math.sqrt((2 + rMean / 256) * deltaR * deltaR + 4 * deltaG * deltaG + (2 + (255 - rMean) / 256) * deltaB * deltaB);
}

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '').trim();
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return null;
  const value = Number.parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function calculateMse(reference: Uint8ClampedArray, reconstructed: Uint8ClampedArray) {
  let total = 0;
  let samples = 0;
  for (let index = 0; index < reference.length; index += 4) {
    for (let channel = 0; channel < 3; channel += 1) {
      const delta = reference[index + channel] - reconstructed[index + channel];
      total += delta * delta;
      samples += 1;
    }
  }
  return samples === 0 ? 0 : total / samples;
}

function require2d(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('No se pudo crear el contexto 2D de Canvas.');
  return context;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('No se pudo codificar la imagen.'));
        else resolve(blob);
      },
      type,
      quality
    );
  });
}
