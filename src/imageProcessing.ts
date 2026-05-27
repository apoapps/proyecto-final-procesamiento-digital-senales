import { calculateByteMetrics, calculatePsnr, type ByteMetrics } from './metrics';

export type ProcessingOptions = {
  quality: number;
  maxDimension: number;
  grayscale: boolean;
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
  mse: number;
  psnr: number;
  metrics: ByteMetrics;
  blob: Blob;
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
  const dimensions = fitWithin(loaded.width, loaded.height, options.maxDimension);
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

  const reference = workingContext.getImageData(0, 0, dimensions.width, dimensions.height);
  const blob = await canvasToBlob(workingCanvas, 'image/jpeg', options.quality);
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
    outputType: 'image/jpeg',
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

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
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
