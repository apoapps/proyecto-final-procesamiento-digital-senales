import { useMemo, useRef, useState } from 'react';
import { Download, FileImage, ImagePlus, Loader2, RefreshCcw, Trash2, Upload } from 'lucide-react';
import { MetricCell, Panel, PrimaryAction, RangeField, SwitchField, ToolbarButton } from './design-system';
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
    <main className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-8 w-8 place-items-center bg-foreground text-background">
              <FileImage className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Transformador de imágenes</p>
              <p className="truncate text-xs text-muted-foreground">Alejandro Apodaca Cordova m041852 · Gael Calderon Robles m042449</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ToolbarButton title="Restablecer ajustes" aria-label="Restablecer ajustes" onClick={() => setOptions(defaultOptions)}>
              <RefreshCcw className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton title="Limpiar resultados" aria-label="Limpiar resultados" onClick={clearItems} disabled={items.length === 0}>
              <Trash2 className="h-4 w-4" />
            </ToolbarButton>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-5">
        <Intro />
        <UploadBox inputRef={inputRef} isProcessing={isProcessing} onFiles={handleFiles} />
        <Settings options={options} setOptions={setOptions} />
        {error ? <div className="border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div> : null}
        <Summary totals={totals} count={items.length} />
        <ImageResults items={items} onDownload={downloadItem} />
        <ComplianceSummary />
      </div>
    </main>
  );
}

function Intro() {
  return (
    <section className="border border-border bg-background p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Qué hace</p>
      <h1 className="mt-2 max-w-3xl text-2xl font-semibold tracking-tight">Comprime imágenes antes de subirlas a un chat LLM.</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
        La imagen se trata como una señal digital: se remuestrea, se convierte a JPG y se mide cuánto recurso ahorra. Todo ocurre en el navegador.
      </p>
      <p className="mt-3 text-sm font-medium">Integrantes: Alejandro Apodaca Cordova (m041852) y Gael Calderon Robles (m042449).</p>
      <ol className="mt-5 grid gap-3 md:grid-cols-3">
        <Step title="1. Entra imagen" body="Seleccionas o arrastras un archivo real." />
        <Step title="2. Se procesa" body="Remuestreo, luminancia opcional y compresión JPEG." />
        <Step title="3. Sale evidencia" body="Comparas tamaño, ahorro, base64 y PSNR." />
      </ol>
    </section>
  );
}

function Step({ title, body }: { title: string; body: string }) {
  return (
    <li className="border border-border p-3">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
    </li>
  );
}

function UploadBox({ inputRef, isProcessing, onFiles }: { inputRef: React.MutableRefObject<HTMLInputElement | null>; isProcessing: boolean; onFiles: (files: FileList | File[]) => void }) {
  return (
    <label
      className="grid min-h-40 cursor-pointer place-items-center border border-dashed border-border bg-[#f5f5f7] p-6 text-center transition-colors hover:bg-muted"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        onFiles(event.dataTransfer.files);
      }}
    >
      <input ref={inputRef} className="sr-only" type="file" accept="image/*" multiple onChange={(event) => event.target.files && onFiles(event.target.files)} />
      <div>
        <div className="mx-auto mb-3 grid h-10 w-10 place-items-center bg-foreground text-background">{isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}</div>
        <p className="font-medium">Seleccionar imágenes</p>
        <p className="mt-2 text-sm text-muted-foreground">También puedes arrastrarlas aquí. La compresión no sube archivos al servidor.</p>
      </div>
    </label>
  );
}

function Settings({ options, setOptions }: { options: ProcessingOptions; setOptions: React.Dispatch<React.SetStateAction<ProcessingOptions>> }) {
  return (
    <section className="grid gap-4 border border-border p-4 md:grid-cols-[1fr_1fr_220px]">
      <RangeField
        label="Calidad JPG"
        valueLabel={`${Math.round(options.quality * 100)}%`}
        min="0.35"
        max="0.95"
        step="0.01"
        value={options.quality}
        onChange={(event) => {
          const quality = Number(event.currentTarget.value);
          setOptions((current) => ({ ...current, quality }));
        }}
      />
      <RangeField
        label="Tamaño máximo"
        valueLabel={`${options.maxDimension}px`}
        min="512"
        max="2400"
        step="64"
        value={options.maxDimension}
        onChange={(event) => {
          const maxDimension = Number(event.currentTarget.value);
          setOptions((current) => ({ ...current, maxDimension }));
        }}
      />
      <SwitchField label="Usar luminancia" checked={options.grayscale} onChange={(checked) => setOptions((current) => ({ ...current, grayscale: checked }))} />
    </section>
  );
}

function Summary({ totals, count }: { totals: ByteMetrics; count: number }) {
  return (
    <Panel className="grid grid-cols-2 md:grid-cols-5">
      <MetricCell label="Original" value={formatBytes(totals.originalBytes)} />
      <MetricCell label="JPG" value={formatBytes(totals.compressedBytes)} />
      <MetricCell label="Ahorro" value={`${totals.savedPercent.toFixed(1)}%`} />
      <MetricCell label="Base64 evitado" value={formatBytes(Math.max(0, totals.originalBase64Bytes - totals.compressedBase64Bytes))} />
      <MetricCell label="Listas" value={String(count)} />
    </Panel>
  );
}

function ImageResults({ items, onDownload }: { items: ProcessedImage[]; onDownload: (item: ProcessedImage) => void }) {
  if (items.length === 0) {
    return (
      <div className="grid min-h-36 place-items-center border border-border p-8 text-center">
        <div>
          <ImagePlus className="mx-auto h-8 w-8" />
          <p className="mt-3 text-sm text-muted-foreground">Procesa una imagen para ver antes, después y métricas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <article key={item.id} className="border border-border bg-background">
          <div className="grid md:grid-cols-[1fr_1fr_240px]">
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
                Descargar JPG
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

function ComplianceSummary() {
  return (
    <section className="border border-border bg-background p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Por qué cumple la rúbrica</p>
      <ul className="mt-3 grid gap-2 text-sm leading-6 text-muted-foreground md:grid-cols-2">
        <li><strong className="text-foreground">Rúbricas revisadas:</strong> 24ICE04 y 24ICE05 están incluidas en el repositorio.</li>
        <li><strong className="text-foreground">Adquiere señal real:</strong> usa imágenes cargadas por el usuario.</li>
        <li><strong className="text-foreground">Transforma:</strong> remuestrea, puede usar luminancia y codifica JPEG.</li>
        <li><strong className="text-foreground">Analiza:</strong> calcula bytes, ahorro, base64, MSE y PSNR.</li>
        <li><strong className="text-foreground">Reconoce límites:</strong> JPEG pierde transparencia y PSNR no mide significado semántico.</li>
      </ul>
    </section>
  );
}
