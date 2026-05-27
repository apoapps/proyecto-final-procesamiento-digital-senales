import { useMemo, useRef, useState } from 'react';
import { BarChart3, CheckCircle2, Download, FileImage, ImagePlus, Loader2, RefreshCcw, SlidersHorizontal, Trash2, UploadCloud } from 'lucide-react';
import { formatBytes, type ByteMetrics } from './metrics';
import { processImageFile, type ProcessedImage, type ProcessingOptions } from './imageProcessing';

const defaultOptions: ProcessingOptions = {
  quality: 0.72,
  maxDimension: 1280,
  grayscale: false
};

export function App() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [options, setOptions] = useState(defaultOptions);
  const [items, setItems] = useState<ProcessedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totals = useMemo(() => {
    return items.reduce<ByteMetrics>(
      (acc, item) => ({
        originalBytes: acc.originalBytes + item.metrics.originalBytes,
        compressedBytes: acc.compressedBytes + item.metrics.compressedBytes,
        savedBytes: acc.savedBytes + item.metrics.savedBytes,
        savedPercent: 0,
        compressionRatio: 0,
        originalBase64Bytes: acc.originalBase64Bytes + item.metrics.originalBase64Bytes,
        compressedBase64Bytes: acc.compressedBase64Bytes + item.metrics.compressedBase64Bytes,
        estimatedContextUnitsSaved: acc.estimatedContextUnitsSaved + item.metrics.estimatedContextUnitsSaved
      }),
      {
        originalBytes: 0,
        compressedBytes: 0,
        savedBytes: 0,
        savedPercent: 0,
        compressionRatio: 0,
        originalBase64Bytes: 0,
        compressedBase64Bytes: 0,
        estimatedContextUnitsSaved: 0
      }
    );
  }, [items]);
  totals.savedPercent = totals.originalBytes === 0 ? 0 : (totals.savedBytes / totals.originalBytes) * 100;
  totals.compressionRatio = totals.compressedBytes === 0 ? 0 : totals.originalBytes / totals.compressedBytes;

  async function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((file) => file.type.startsWith('image/'));
    if (files.length === 0) {
      setError('Selecciona una imagen compatible con el navegador.');
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      const processed = await Promise.all(files.map((file) => processImageFile(file, options)));
      setItems((current) => [...processed, ...current]);
    } catch (processingError) {
      setError(processingError instanceof Error ? processingError.message : 'No se pudo procesar la imagen.');
    } finally {
      setIsProcessing(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function clearItems() {
    for (const item of items) {
      URL.revokeObjectURL(item.sourceUrl);
      URL.revokeObjectURL(item.outputUrl);
    }
    setItems([]);
  }

  function downloadItem(item: ProcessedImage) {
    const anchor = document.createElement('a');
    const baseName = item.name.replace(/\.[^.]+$/, '');
    anchor.href = item.outputUrl;
    anchor.download = `${baseName}-llm-context.jpg`;
    anchor.click();
  }

  return (
    <main className="min-h-screen bg-chat-bg text-chat-text">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[300px_1fr]">
        <aside className="border-b border-chat-border bg-chat-sidebar p-4 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-chat-border bg-chat-elevated">
              <FileImage className="h-5 w-5 text-chat-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold">Image Context Transformer</p>
              <p className="text-xs text-chat-tertiary">Proyecto Final PDS</p>
            </div>
          </div>

          <section className="mt-6 space-y-5">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <SlidersHorizontal className="h-4 w-4 text-chat-muted" />
                Parametros DSP
              </div>
              <label className="block text-xs text-chat-muted" htmlFor="quality">
                Calidad JPEG: {Math.round(options.quality * 100)}%
              </label>
              <input
                id="quality"
                className="mt-2 w-full accent-chat-accent"
                type="range"
                min="0.35"
                max="0.95"
                step="0.01"
                value={options.quality}
                onChange={(event) => setOptions((current) => ({ ...current, quality: Number(event.target.value) }))}
              />
            </div>

            <div>
              <label className="block text-xs text-chat-muted" htmlFor="maxDimension">
                Dimension maxima: {options.maxDimension}px
              </label>
              <input
                id="maxDimension"
                className="mt-2 w-full accent-chat-accent"
                type="range"
                min="512"
                max="2400"
                step="64"
                value={options.maxDimension}
                onChange={(event) => setOptions((current) => ({ ...current, maxDimension: Number(event.target.value) }))}
              />
            </div>

            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-chat-border bg-chat-elevated px-3 py-2 text-sm">
              <span>Transformada a luminancia</span>
              <input
                type="checkbox"
                className="h-4 w-4 accent-chat-accent"
                checked={options.grayscale}
                onChange={(event) => setOptions((current) => ({ ...current, grayscale: event.target.checked }))}
              />
            </label>
          </section>

          <section className="mt-6 grid grid-cols-2 gap-2">
            <Metric label="Original" value={formatBytes(totals.originalBytes)} />
            <Metric label="Salida JPG" value={formatBytes(totals.compressedBytes)} />
            <Metric label="Ahorro" value={`${totals.savedPercent.toFixed(1)}%`} />
            <Metric label="Contexto" value={`${totals.estimatedContextUnitsSaved.toLocaleString()} u.`} />
          </section>
        </aside>

        <section className="flex min-h-0 flex-col">
          <header className="border-b border-chat-border px-4 py-3">
            <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-xl font-semibold tracking-normal">Compresor JPG previo a servidor</h1>
                <p className="text-sm text-chat-muted">
                  Convierte formatos comunes a JPG, remuestrea la senal visual y estima ahorro para cargas de chat LLM.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button className="icon-button" type="button" title="Reiniciar parametros" onClick={() => setOptions(defaultOptions)}>
                  <RefreshCcw className="h-4 w-4" />
                </button>
                <button className="icon-button" type="button" title="Limpiar imagenes" onClick={clearItems} disabled={items.length === 0}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </header>

          <div className="mx-auto grid w-full max-w-6xl flex-1 gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              <DropZone inputRef={inputRef} isProcessing={isProcessing} onFiles={handleFiles} />
              {error ? <div className="rounded-lg border border-chat-danger/40 bg-chat-danger/10 px-3 py-2 text-sm text-red-100">{error}</div> : null}
              <ImageGrid items={items} onDownload={downloadItem} />
            </div>

            <aside className="space-y-4">
              <Panel title="Modelo de ahorro" icon={<BarChart3 className="h-4 w-4" />}>
                <dl className="space-y-3 text-sm">
                  <Row label="Relacion de compresion" value={totals.compressionRatio ? `${totals.compressionRatio.toFixed(2)}x` : '0x'} />
                  <Row label="Base64 evitado" value={formatBytes(Math.max(0, totals.originalBase64Bytes - totals.compressedBase64Bytes))} />
                  <Row label="Memoria liberada" value={formatBytes(totals.savedBytes)} />
                  <Row label="Imagenes procesadas" value={String(items.length)} />
                </dl>
              </Panel>
              <Panel title="Cadena DSP" icon={<CheckCircle2 className="h-4 w-4" />}>
                <ol className="space-y-2 text-sm text-chat-muted">
                  <li>1. Adquisicion local de senal visual.</li>
                  <li>2. Remuestreo bilineal a dimension maxima.</li>
                  <li>3. Transformacion RGB a luminancia opcional.</li>
                  <li>4. Cuantizacion y codificacion JPEG.</li>
                  <li>5. Evaluacion con MSE, PSNR y bytes.</li>
                </ol>
              </Panel>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

type DropZoneProps = {
  inputRef: React.MutableRefObject<HTMLInputElement | null>;
  isProcessing: boolean;
  onFiles: (files: FileList | File[]) => void;
};

function DropZone({ inputRef, isProcessing, onFiles }: DropZoneProps) {
  return (
    <label
      className="flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-chat-border bg-chat-elevated px-6 py-8 text-center shadow-composer transition hover:border-chat-muted hover:bg-chat-hover"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        onFiles(event.dataTransfer.files);
      }}
    >
      <input ref={inputRef} className="sr-only" type="file" accept="image/*" multiple onChange={(event) => event.target.files && onFiles(event.target.files)} />
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-chat-border bg-chat-bg">
        {isProcessing ? <Loader2 className="h-7 w-7 animate-spin text-chat-accent" /> : <UploadCloud className="h-7 w-7 text-chat-accent" />}
      </div>
      <p className="text-base font-medium">Arrastra imagenes o selecciona archivos</p>
      <p className="mt-2 max-w-xl text-sm text-chat-muted">
        El navegador decodifica PNG, JPEG, WebP, BMP o GIF cuando el motor lo soporte. La salida siempre se entrega como JPG comprimido.
      </p>
    </label>
  );
}

function ImageGrid({ items, onDownload }: { items: ProcessedImage[]; onDownload: (item: ProcessedImage) => void }) {
  if (items.length === 0) {
    return (
      <div className="grid min-h-64 place-items-center rounded-lg border border-chat-border bg-chat-elevated/40 p-8 text-center">
        <div>
          <ImagePlus className="mx-auto h-8 w-8 text-chat-tertiary" />
          <p className="mt-3 text-sm text-chat-muted">Aun no hay imagenes procesadas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 xl:grid-cols-2">
      {items.map((item) => (
        <article key={item.id} className="overflow-hidden rounded-lg border border-chat-border bg-chat-elevated">
          <div className="grid grid-cols-2 border-b border-chat-border">
            <Preview label="Entrada" src={item.sourceUrl} />
            <Preview label="JPG" src={item.outputUrl} />
          </div>
          <div className="space-y-3 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-medium">{item.name}</h2>
                <p className="text-xs text-chat-tertiary">
                  {item.width}x{item.height} a {item.outputWidth}x{item.outputHeight}
                </p>
              </div>
              <button className="icon-button shrink-0" type="button" title="Descargar JPG" onClick={() => onDownload(item)}>
                <Download className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <Metric label="Original" value={formatBytes(item.metrics.originalBytes)} />
              <Metric label="JPG" value={formatBytes(item.metrics.compressedBytes)} />
              <Metric label="Ahorro" value={`${item.metrics.savedPercent.toFixed(1)}%`} />
              <Metric label="PSNR" value={Number.isFinite(item.psnr) ? `${item.psnr.toFixed(1)} dB` : 'inf'} />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function Preview({ label, src }: { label: string; src: string }) {
  return (
    <figure className="relative aspect-[4/3] overflow-hidden bg-chat-bg">
      <img className="h-full w-full object-contain" src={src} alt={label} />
      <figcaption className="absolute left-2 top-2 rounded-md border border-chat-border bg-chat-sidebar/80 px-2 py-1 text-[11px] text-chat-muted">{label}</figcaption>
    </figure>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-chat-border bg-chat-elevated p-4">
      <div className="mb-4 flex items-center gap-2 text-sm font-medium text-chat-text">
        <span className="text-chat-accent">{icon}</span>
        {title}
      </div>
      {children}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-chat-border bg-chat-bg px-2 py-2">
      <p className="truncate text-[11px] text-chat-tertiary">{label}</p>
      <p className="truncate text-sm font-semibold text-chat-text">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-chat-muted">{label}</dt>
      <dd className="font-medium text-chat-text">{value}</dd>
    </div>
  );
}
