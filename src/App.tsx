import { useMemo, useRef, useState } from 'react';
import { Download, FileImage, ImagePlus, Loader2, RefreshCcw, Trash2, Upload } from 'lucide-react';
import { DataRow, MetricCell, Panel, PrimaryAction, RangeField, SectionHeader, SwitchField, ToolbarButton } from './design-system';
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
    <main className="h-dvh overflow-hidden bg-background text-foreground">
      <div className="mx-auto grid h-full max-w-7xl grid-rows-[56px_1fr]">
        <header className="flex items-center justify-between border-b border-border px-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-8 w-8 place-items-center bg-foreground text-background">
              <FileImage className="h-4 w-4" />
            </div>
            <div className="min-w-0 max-w-[240px] sm:max-w-none">
              <p className="truncate text-sm font-semibold">Transformador de imagenes para contexto LLM</p>
              <p className="truncate text-xs text-muted-foreground">Procesamiento Digital de Senales · Proyecto final</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
              <ToolbarButton title="Reiniciar parametros" aria-label="Reiniciar parametros" onClick={() => setOptions(defaultOptions)}>
                <RefreshCcw className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton title="Limpiar imagenes" aria-label="Limpiar imagenes" onClick={clearItems} disabled={items.length === 0}>
                <Trash2 className="h-4 w-4" />
              </ToolbarButton>
          </div>
        </header>

        <div className="grid min-h-0 grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="order-2 min-h-0 overflow-y-auto border-t border-border bg-[#f5f5f7] p-4 lg:order-1 lg:border-r lg:border-t-0">
            <SectionHeader>Configuracion</SectionHeader>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Estos controles cambian el experimento. Si no sabes que mover, deja los valores recomendados.</p>
            <div className="mt-4 space-y-5">
              <RangeField
                label="Calidad JPEG"
                valueLabel={`${Math.round(options.quality * 100)}%`}
                min="0.35"
                max="0.95"
                step="0.01"
                value={options.quality}
                onChange={(event) => setOptions((current) => ({ ...current, quality: Number(event.currentTarget.value) }))}
              />
              <RangeField
                label="Dimension maxima"
                valueLabel={`${options.maxDimension}px`}
                min="512"
                max="2400"
                step="64"
                value={options.maxDimension}
                onChange={(event) => setOptions((current) => ({ ...current, maxDimension: Number(event.currentTarget.value) }))}
              />
              <SwitchField label="Convertir a luminancia" checked={options.grayscale} onChange={(checked) => setOptions((current) => ({ ...current, grayscale: checked }))} />
            </div>

          <SectionHeader className="mt-8">Resultado total</SectionHeader>
            <Panel className="mt-4 grid grid-cols-2">
              <MetricCell label="Original" value={formatBytes(totals.originalBytes)} />
              <MetricCell label="JPG" value={formatBytes(totals.compressedBytes)} />
              <MetricCell label="Ahorro" value={`${totals.savedPercent.toFixed(1)}%`} />
              <MetricCell label="Contexto" value={`${totals.estimatedContextUnitsSaved.toLocaleString()} u.`} />
            </Panel>

            <Panel className="mt-4 divide-y divide-border">
              <DataRow label="Compresion" value={totals.compressionRatio ? `${totals.compressionRatio.toFixed(2)}x` : '0x'} />
              <DataRow label="Base64 evitado" value={formatBytes(Math.max(0, totals.originalBase64Bytes - totals.compressedBase64Bytes))} />
              <DataRow label="Archivos listos" value={String(items.length)} />
            </Panel>
          </aside>

          <section className="order-1 min-h-0 overflow-y-auto p-4 lg:order-2">
            <div className="mx-auto flex min-h-full max-w-5xl flex-col gap-5">
              <Story onFiles={handleFiles} inputRef={inputRef} isProcessing={isProcessing} />
              {error ? <div className="border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div> : null}
              <ImageResults items={items} onDownload={downloadItem} />
              <ComplianceSummary />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function ComplianceSummary() {
  return (
    <section className="border border-border bg-background">
      <div className="border-b border-border p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Por que cumple</p>
        <h2 className="mt-2 text-base font-semibold">Adquiere, transforma, analiza y justifica una senal real.</h2>
      </div>
      <div className="grid md:grid-cols-2">
        <RubricPoint title="Procesamiento Digital de Senales" body="La imagen se usa como senal discreta 2D: remuestreo, luminancia opcional, cuantizacion JPEG, MSE y PSNR." />
        <RubricPoint title="Herramienta moderna" body="Es una app web publicable con React, TypeScript, Tailwind y Vercel. Comprime antes de subir al servidor." />
        <RubricPoint title="Analisis de datos" body="Mide bytes originales, JPG, ahorro, base64 evitado, relacion de compresion y PSNR." />
        <RubricPoint title="Limitaciones" body="Explica que JPEG pierde transparencia, PSNR no mide significado y algunos formatos dependen del navegador." />
      </div>
    </section>
  );
}

function RubricPoint({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-b border-border p-4 last:border-b-0 md:border-r md:[&:nth-child(even)]:border-r-0">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}

function Story({ inputRef, isProcessing, onFiles }: { inputRef: React.MutableRefObject<HTMLInputElement | null>; isProcessing: boolean; onFiles: (files: FileList | File[]) => void }) {
  return (
    <section className="border border-border bg-background">
      <div className="border-b border-border p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Story del sistema</p>
        <h1 className="mt-2 max-w-3xl text-2xl font-semibold tracking-tight">Convierte una imagen pesada en un JPG ligero antes de subirla a un chat LLM.</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          Esta pagina demuestra el proyecto final: toma una imagen real, la trata como senal digital, la transforma en el navegador y muestra si el ahorro vale la pena.
        </p>
      </div>

      <div className="grid border-b border-border md:grid-cols-3">
        <StoryStep number="01" title="Sube una imagen" body="Puede ser PNG, JPG, WebP, BMP o GIF si tu navegador lo soporta." />
        <StoryStep number="02" title="Se procesa localmente" body="El sistema remuestrea pixeles, puede usar luminancia y codifica JPEG." />
        <StoryStep number="03" title="Compara resultados" body="Ves bytes, ahorro, PSNR y descargas el JPG final." />
      </div>

      <label
        className="grid min-h-44 cursor-pointer place-items-center p-6 text-center transition-colors hover:bg-muted"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          onFiles(event.dataTransfer.files);
        }}
      >
        <input ref={inputRef} className="sr-only" type="file" accept="image/*" multiple onChange={(event) => event.target.files && onFiles(event.target.files)} />
        <div>
          <div className="mx-auto mb-4 grid h-10 w-10 place-items-center bg-foreground text-background">{isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}</div>
          <p className="font-medium">Seleccionar imagenes</p>
          <p className="mt-2 text-sm text-muted-foreground">Tambien puedes arrastrarlas aqui. Nada se sube al servidor para comprimir.</p>
        </div>
      </label>
    </section>
  );
}

function StoryStep({ number, title, body }: { number: string; title: string; body: string }) {
  return (
    <div className="border-b border-border p-4 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
      <p className="font-mono text-xs text-muted-foreground">{number}</p>
      <h2 className="mt-2 text-sm font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}

function ImageResults({ items, onDownload }: { items: ProcessedImage[]; onDownload: (item: ProcessedImage) => void }) {
  if (items.length === 0) {
    return (
      <div className="grid flex-1 place-items-center border border-border bg-[#f5f5f7] p-8 text-center">
        <div>
          <ImagePlus className="mx-auto h-8 w-8" />
          <p className="mt-3 text-sm text-muted-foreground">Procesa una imagen para ver antes, despues y metricas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <article key={item.id} className="border border-border bg-background">
          <div className="grid md:grid-cols-[1fr_1fr_220px]">
            <Preview label="Entrada" src={item.sourceUrl} />
            <Preview label="JPG comprimido" src={item.outputUrl} />
            <div className="border-t border-border p-3 md:border-l md:border-t-0">
              <h2 className="truncate text-sm font-semibold">{item.name}</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.width}x{item.height} a {item.outputWidth}x{item.outputHeight}
              </p>
              <Panel className="mt-3 grid grid-cols-2">
                <MetricCell label="Original" value={formatBytes(item.metrics.originalBytes)} />
                <MetricCell label="JPG" value={formatBytes(item.metrics.compressedBytes)} />
                <MetricCell label="Ahorro" value={`${item.metrics.savedPercent.toFixed(1)}%`} />
                <MetricCell label="PSNR" value={Number.isFinite(item.psnr) ? `${item.psnr.toFixed(1)} dB` : 'inf'} />
              </Panel>
              <PrimaryAction className="mt-3 w-full" title="Descargar JPG comprimido" aria-label={`Descargar JPG comprimido de ${item.name}`} onClick={() => onDownload(item)}>
                <Download className="h-4 w-4" />
                Descargar JPG comprimido
              </PrimaryAction>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function Preview({ label, src }: { label: string; src: string }) {
  return (
    <figure className="relative aspect-[4/3] overflow-hidden border-b border-border bg-muted md:border-b-0 md:border-r">
      <img className="h-full w-full object-contain" src={src} alt={label} />
      <figcaption className="absolute left-2 top-2 bg-background px-2 py-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{label}</figcaption>
    </figure>
  );
}
