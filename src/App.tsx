import { useMemo, useRef, useState } from 'react';
import { Download, FileImage, ImagePlus, Loader2, RefreshCcw, SlidersHorizontal, Trash2, Upload } from 'lucide-react';
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
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totals = useMemo(() => {
    const aggregate = items.reduce<ByteMetrics>(
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

    return {
      ...aggregate,
      savedPercent: aggregate.originalBytes === 0 ? 0 : (aggregate.savedBytes / aggregate.originalBytes) * 100,
      compressionRatio: aggregate.compressedBytes === 0 ? 0 : aggregate.originalBytes / aggregate.compressedBytes
    };
  }, [items]);

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
      setIsDragActive(false);
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
      <Header onReset={() => setOptions(defaultOptions)} onClear={clearItems} hasItems={items.length > 0} />

      <section className="mx-auto grid w-full max-w-6xl gap-4 px-4 pb-8 pt-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="stack">
          <Hero />
          <UploadBox
            inputRef={inputRef}
            isDragActive={isDragActive}
            isProcessing={isProcessing}
            onDragActive={setIsDragActive}
            onFiles={handleFiles}
          />
          {error ? <div className="error-strip">{error}</div> : null}
          <ImageResults items={items} onDownload={downloadItem} />
        </div>

        <aside className="stack lg:sticky lg:top-[76px] lg:max-h-[calc(100dvh-92px)] lg:overflow-y-auto">
          <Settings options={options} setOptions={setOptions} />
          <Summary totals={totals} count={items.length} />
          <ComplianceSummary />
        </aside>
      </section>
    </main>
  );
}

function Header({ onReset, onClear, hasItems }: { onReset: () => void; onClear: () => void; hasItems: boolean }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/92 backdrop-blur-xl">
      <div className="mx-auto flex h-[64px] max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="brand-mark">
            <FileImage className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-lg leading-none">Transformador DSP</p>
            <p className="truncate font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Apodaca / Calderon
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <IconButton title="Restablecer ajustes" aria-label="Restablecer ajustes" onClick={onReset}>
            <RefreshCcw className="h-4 w-4" />
          </IconButton>
          <IconButton title="Limpiar resultados" aria-label="Limpiar resultados" onClick={onClear} disabled={!hasItems}>
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero-panel reveal">
      <div className="hero-grid">
        <div>
          <p className="eyebrow">Procesamiento digital de senales</p>
          <h1 className="display-title">
            De imagen pesada a contexto util.
          </h1>
        </div>
        <div className="hero-copy">
          <StoryStep number="1" title="Entra una imagen" body="La foto se toma como una senal digital." />
          <StoryStep number="2" title="Se transforma" body="Se remuestrea y se codifica como JPEG." />
          <StoryStep number="3" title="Se mide el ahorro" body="Compara bytes, base64, MSE y PSNR." />
        </div>
      </div>
    </section>
  );
}

function StoryStep({ number, title, body }: { number: string; title: string; body: string }) {
  return (
    <div className="story-step">
      <span>{number}</span>
      <div>
        <strong>{title}</strong>
        <p>{body}</p>
      </div>
    </div>
  );
}

function UploadBox({
  inputRef,
  isDragActive,
  isProcessing,
  onDragActive,
  onFiles
}: {
  inputRef: React.MutableRefObject<HTMLInputElement | null>;
  isDragActive: boolean;
  isProcessing: boolean;
  onDragActive: (active: boolean) => void;
  onFiles: (files: FileList | File[]) => void;
}) {
  return (
    <label
      className={`dropzone reveal d1 ${isDragActive ? 'is-dragging' : ''}`}
      onDragEnter={(event) => {
        event.preventDefault();
        onDragActive(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        onDragActive(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        if (event.currentTarget === event.target) onDragActive(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        onFiles(event.dataTransfer.files);
      }}
    >
      <input ref={inputRef} className="sr-only" type="file" accept="image/*" multiple onChange={(event) => event.target.files && onFiles(event.target.files)} />
      <div className="scanline" />
      <div className="dropzone-content">
        <div className="upload-glyph">{isProcessing ? <Loader2 className="h-7 w-7 animate-spin" /> : <Upload className="h-7 w-7" />}</div>
        <div>
          <p className="font-display text-2xl leading-none md:text-3xl">{isDragActive ? 'Suelta la imagen' : 'Empieza aqui'}</p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Sube una imagen y la pagina cuenta la historia completa: original, transformacion y ahorro.
          </p>
        </div>
      </div>
    </label>
  );
}

function Settings({ options, setOptions }: { options: ProcessingOptions; setOptions: React.Dispatch<React.SetStateAction<ProcessingOptions>> }) {
  return (
    <section className="instrument-panel reveal d2">
      <PanelHeader icon={<SlidersHorizontal className="h-4 w-4" />} eyebrow="Ajustes" title="Parametros" />
      <div className="mt-5 grid gap-5">
        <RangeField
          label="Calidad JPEG"
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
          label="Dimension maxima"
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
        <SwitchField label="Transformada de luminancia" checked={options.grayscale} onChange={(checked) => setOptions((current) => ({ ...current, grayscale: checked }))} />
      </div>
    </section>
  );
}

function Summary({ totals, count }: { totals: ByteMetrics; count: number }) {
  const base64Saved = Math.max(0, totals.originalBase64Bytes - totals.compressedBase64Bytes);

  return (
    <section className="instrument-panel reveal d3">
      <PanelHeader eyebrow="Resumen" title="Metricas" />
      <div className="metric-board mt-5">
        <Metric label="Original" value={formatBytes(totals.originalBytes)} />
        <Metric label="JPEG" value={formatBytes(totals.compressedBytes)} />
        <Metric label="Ahorro" value={`${totals.savedPercent.toFixed(1)}%`} strong />
        <Metric label="Ratio" value={totals.compressionRatio ? `${totals.compressionRatio.toFixed(2)}x` : '0x'} />
        <Metric label="Base64 evitado" value={formatBytes(base64Saved)} />
        <Metric label="Unidades contexto" value={totals.estimatedContextUnitsSaved.toLocaleString('es-MX')} />
        <Metric label="Muestras" value={String(count)} />
      </div>
    </section>
  );
}

function ImageResults({ items, onDownload }: { items: ProcessedImage[]; onDownload: (item: ProcessedImage) => void }) {
  if (items.length === 0) {
    return (
      <section className="empty-state reveal d4">
        <ImagePlus className="h-8 w-8" />
        <div>
          <p className="font-display text-2xl">Aun no hay imagen.</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Procesa una imagen para ver la comparacion y sus metricas.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="stack">
      {items.map((item, index) => (
        <article key={item.id} className="result-card reveal" style={{ animationDelay: `${Math.min(index, 5) * 80}ms` }}>
          <div className="result-main">
            <Preview label="Entrada" src={item.sourceUrl} />
            <Preview label="JPEG procesado" src={item.outputUrl} />
          </div>
          <div className="result-inspector">
            <p className="eyebrow">Muestra procesada</p>
            <h2 className="mt-2 truncate font-display text-3xl leading-none">{item.name}</h2>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
              {item.width}x{item.height} a {item.outputWidth}x{item.outputHeight} / {item.outputType}
            </p>
            <div className="metric-board mt-5">
              <Metric label="Original" value={formatBytes(item.metrics.originalBytes)} />
              <Metric label="JPEG" value={formatBytes(item.metrics.compressedBytes)} />
              <Metric label="Ahorro" value={`${item.metrics.savedPercent.toFixed(1)}%`} strong />
              <Metric label="PSNR" value={Number.isFinite(item.psnr) ? `${item.psnr.toFixed(1)} dB` : 'inf'} />
              <Metric label="MSE" value={item.mse.toFixed(2)} />
              <Metric label="Contexto" value={item.metrics.estimatedContextUnitsSaved.toLocaleString('es-MX')} />
            </div>
            <button className="primary-action mt-5 w-full" type="button" onClick={() => onDownload(item)}>
              <Download className="h-4 w-4" />
              Descargar JPG
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}

function Preview({ label, src }: { label: string; src: string }) {
  return (
    <figure className="preview-frame">
      <img src={src} alt={label} />
      <figcaption>{label}</figcaption>
    </figure>
  );
}

function ComplianceSummary() {
  return (
    <section className="instrument-panel reveal d4">
      <PanelHeader eyebrow="Academico" title="Evidencia" />
      <ul className="mt-5 space-y-3 text-sm leading-6 text-muted-foreground">
        <li><strong>Entrada:</strong> imagen cargada por el usuario.</li>
        <li><strong>Proceso:</strong> remuestreo, luminancia opcional y JPEG.</li>
        <li><strong>Salida:</strong> comparacion visual y metricas.</li>
      </ul>
    </section>
  );
}

function PanelHeader({ icon, eyebrow, title }: { icon?: React.ReactNode; eyebrow: string; title: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-2 font-display text-3xl leading-none">{title}</h2>
      </div>
      {icon ? <div className="panel-icon">{icon}</div> : null}
    </div>
  );
}

function RangeField({
  label,
  valueLabel,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  valueLabel: string;
}) {
  return (
    <label className="control-block">
      <span className="flex items-center justify-between gap-4">
        <span>{label}</span>
        <span className="font-mono text-xs text-muted-foreground">{valueLabel}</span>
      </span>
      <input type="range" {...props} />
    </label>
  );
}

function SwitchField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="switch-field">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

function Metric({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={strong ? 'metric-cell is-strong' : 'metric-cell'}>
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

function IconButton({ children, className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`icon-button ${className}`} type="button" {...props}>
      {children}
    </button>
  );
}
