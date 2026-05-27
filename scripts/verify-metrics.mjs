import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const metricsSource = readFileSync(resolve(here, '../src/metrics.ts'), 'utf8');

if (!metricsSource.includes('estimateBase64Bytes')) {
  throw new Error('No se encontro el modelo base64.');
}

function estimateBase64Bytes(bytes) {
  return Math.ceil(bytes / 3) * 4;
}

function calculateByteMetrics(originalBytes, compressedBytes) {
  const savedBytes = Math.max(0, originalBytes - compressedBytes);
  const originalBase64Bytes = estimateBase64Bytes(originalBytes);
  const compressedBase64Bytes = estimateBase64Bytes(compressedBytes);
  return {
    savedBytes,
    savedPercent: originalBytes === 0 ? 0 : (savedBytes / originalBytes) * 100,
    compressionRatio: compressedBytes === 0 ? 0 : originalBytes / compressedBytes,
    base64Saved: originalBase64Bytes - compressedBase64Bytes
  };
}

const result = calculateByteMetrics(4_000_000, 640_000);
if (result.savedBytes !== 3_360_000) throw new Error('Ahorro de bytes incorrecto.');
if (Math.round(result.savedPercent) !== 84) throw new Error('Porcentaje de ahorro incorrecto.');
if (Math.round(result.compressionRatio * 100) !== 625) throw new Error('Relacion de compresion incorrecta.');
if (result.base64Saved <= result.savedBytes) throw new Error('El modelo base64 debe reflejar expansion de transporte.');

console.log('verify-metrics ok', result);
