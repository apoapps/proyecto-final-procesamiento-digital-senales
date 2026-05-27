export type ByteMetrics = {
  originalBytes: number;
  compressedBytes: number;
  savedBytes: number;
  savedPercent: number;
  compressionRatio: number;
  originalBase64Bytes: number;
  compressedBase64Bytes: number;
  estimatedContextUnitsSaved: number;
};

export function estimateBase64Bytes(bytes: number) {
  return Math.ceil(bytes / 3) * 4;
}

export function estimateContextUnits(base64Bytes: number) {
  return Math.ceil(base64Bytes / 4);
}

export function calculateByteMetrics(originalBytes: number, compressedBytes: number): ByteMetrics {
  const savedBytes = Math.max(0, originalBytes - compressedBytes);
  const originalBase64Bytes = estimateBase64Bytes(originalBytes);
  const compressedBase64Bytes = estimateBase64Bytes(compressedBytes);
  return {
    originalBytes,
    compressedBytes,
    savedBytes,
    savedPercent: originalBytes === 0 ? 0 : (savedBytes / originalBytes) * 100,
    compressionRatio: compressedBytes === 0 ? 0 : originalBytes / compressedBytes,
    originalBase64Bytes,
    compressedBase64Bytes,
    estimatedContextUnitsSaved: Math.max(0, estimateContextUnits(originalBase64Bytes) - estimateContextUnits(compressedBase64Bytes))
  };
}

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes)) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = Math.max(0, bytes);
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

export function calculatePsnr(mse: number) {
  if (mse <= 0) return Number.POSITIVE_INFINITY;
  return 10 * Math.log10((255 * 255) / mse);
}
