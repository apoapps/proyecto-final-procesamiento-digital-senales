import { useRef, useState } from 'react';
import { Download, Droplet, FileText, Github, Loader2, RefreshCcw, SlidersHorizontal, Upload } from 'lucide-react';
import { formatBytes } from './metrics';
import { processImageFile, type ProcessedImage, type ProcessingOptions } from './imageProcessing';

const defaultOptions: ProcessingOptions = {
  quality: 0.72,
  maxDimension: 1280,
  grayscale: false,
  removeChroma: true,
  compress: false,
  chromaFill: 'transparent',
  backgroundColor: '#ffffff'
};

export function App() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const loadedFileRef = useRef<File | null>(null);
  const [image, setImage] = useState<ProcessedImage | null>(null);
  const [options, setOptions] = useState<ProcessingOptions>(defaultOptions);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function processFile(file: File, nextOptions: ProcessingOptions) {
    setIsProcessing(true);
    setError(null);
    try {
      if (image) {
        URL.revokeObjectURL(image.sourceUrl);
        URL.revokeObjectURL(image.outputUrl);
      }
      const processed = await processImageFile(file, nextOptions);
      setImage(processed);
      setOptions({ ...nextOptions, chromaColor: processed.chroma.detected ? processed.chroma.color : undefined });
    } catch (processingError) {
      setError(processingError instanceof Error ? processingError.message : 'No se pudo procesar la imagen.');
    } finally {
      setIsProcessing(false);
      setIsDragActive(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function handleFiles(fileList: FileList | File[]) {
    const file = Array.from(fileList).find((entry) => entry.type.startsWith('image/'));
    if (!file) {
      setError('Sube una imagen valida.');
      return;
    }

    loadedFileRef.current = file;
    void processFile(file, defaultOptions);
  }

  function updatePickerColor(color: string) {
    const nextOptions = options.chromaFill === 'color' ? { ...options, backgroundColor: color, removeChroma: true } : { ...options, chromaColor: color, removeChroma: true };
    setOptions(nextOptions);
    if (loadedFileRef.current) {
      void processFile(loadedFileRef.current, nextOptions);
    }
  }

  function updateFillMode(chromaFill: ProcessingOptions['chromaFill']) {
    const nextOptions: ProcessingOptions =
      chromaFill === 'transparent'
        ? { ...options, chromaFill, compress: false, removeChroma: true }
        : { ...options, chromaFill, backgroundColor: options.backgroundColor ?? '#ffffff', removeChroma: true };
    setOptions(nextOptions);
    if (loadedFileRef.current) {
      void processFile(loadedFileRef.current, nextOptions);
    }
  }

  function updateBooleanOption(key: 'removeChroma' | 'compress', value: boolean) {
    const nextOptions: ProcessingOptions =
      key === 'compress' && value
        ? { ...options, compress: true, chromaFill: 'color', backgroundColor: '#ffffff' }
        : { ...options, [key]: value };
    setOptions(nextOptions);
    if (loadedFileRef.current) {
      void processFile(loadedFileRef.current, nextOptions);
    }
  }

  function reset() {
    if (image) {
      URL.revokeObjectURL(image.sourceUrl);
      URL.revokeObjectURL(image.outputUrl);
    }
    loadedFileRef.current = null;
    setOptions(defaultOptions);
    setImage(null);
    setError(null);
  }

  function downloadImage() {
    if (!image) return;
    const anchor = document.createElement('a');
    const baseName = image.name.replace(/\.[^.]+$/, '');
    anchor.href = image.outputUrl;
    anchor.download = `${baseName}-procesada.${extensionForOutput(image.outputType, image.name)}`;
    anchor.click();
  }

  const savedPercent = image ? image.metrics.savedPercent : 0;
  const original = image ? formatBytes(image.metrics.originalBytes) : '0 B';
  const compressed = image ? formatBytes(image.metrics.compressedBytes) : '0 B';
  const hasUsefulOutput = Boolean(image && (image.metrics.savedBytes > 0 || image.chroma.applied));
  const keepsTransparency = Boolean(image?.chroma.applied && options.chromaFill === 'transparent');
  const showSavings = options.compress && Boolean(image) && !keepsTransparency;
  const outputLabel = keepsTransparency ? 'Transparente' : image?.chroma.applied ? 'Fondo color' : image && image.metrics.savedBytes > 0 ? 'Comprimida' : 'Sin cambio';
  const heroValue = image && showSavings ? `${savedPercent.toFixed(1)}%` : 'sin';

  return (
    <main className="app-screen">
      <header className="topbar">
        <div>
          <p>Transformador de imagenes</p>
          <span>Alejandro Apodaca m041852 / Gael Calderon m042449</span>
        </div>
        <div className="topbar-actions">
          <a href="https://github.com/apoapps/proyecto-final-procesamiento-digital-senales" target="_blank" rel="noreferrer">
            <Github className="h-3.5 w-3.5" />
            <span>GitHub</span>
          </a>
          <a href="/reporte.pdf" download="reporte-transformador-imagenes.pdf">
            <FileText className="h-3.5 w-3.5 pdf-icon" />
            <Download className="h-3.5 w-3.5 download-icon" />
            <span>PDF</span>
          </a>
          <button type="button" onClick={reset} disabled={!image}>
            <RefreshCcw className="h-3.5 w-3.5" />
            <span>Reiniciar</span>
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="message">
          <p className="eyebrow">Proyecto final - Optimizador de imagenes</p>
          <p className="mobile-credits">Alejandro Apodaca m041852 / Gael Calderon m042449</p>
          <h1>
            Fondo limpio,
            <br />
            <em>{heroValue}</em> estorbo.
          </h1>
          <p className="plain-copy">Chroma quita el fondo. Al comprimir, el fondo pasa a blanco para poder guardar JPG.</p>
          <p className="credits">Alejandro Apodaca m041852 / Gael Calderon m042449</p>
        </div>

        <label
          className={`upload-card ${isDragActive ? 'is-dragging' : ''} ${image ? 'has-image' : ''}`}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragActive(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragActive(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            if (event.currentTarget === event.target) setIsDragActive(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            handleFiles(event.dataTransfer.files);
          }}
        >
          <input ref={inputRef} className="sr-only" type="file" accept="image/*" onChange={(event) => event.target.files && handleFiles(event.target.files)} />
          {!image ? (
            <div className="empty-upload">
              <div className="upload-icon">{isProcessing ? <Loader2 className="h-7 w-7 animate-spin" /> : <Upload className="h-7 w-7" />}</div>
              <strong>{isDragActive ? 'Suelta la imagen' : 'Sube una imagen'}</strong>
              <span>La pagina detecta el color de chroma. Transparente usa PNG; comprimir usa fondo blanco.</span>
            </div>
          ) : (
            <div className="compare">
              <Preview label="Original" src={image.sourceUrl} size={original} />
              <Preview label={outputLabel} src={image.outputUrl} size={compressed} transparent={image.outputType === 'image/png' && image.chroma.applied} />
            </div>
          )}
        </label>
      </section>

      <footer className={showSavings ? 'bottom-bar' : 'bottom-bar without-savings'}>
        <Metric label="Original" value={original} />
        <Metric label={outputLabel === 'Sin cambio' ? 'Salida' : outputLabel} value={compressed} />
        {showSavings ? <Metric label="Ahorro de espacio" value={savedPercent > 0 ? `${savedPercent.toFixed(1)}%` : 'Sin ahorro'} highlight={savedPercent > 0} /> : null}
        <div className={showSavings ? 'chroma-controls' : 'chroma-controls no-savings'} aria-label="Controles de chroma">
          <div className="feature-toggles">
            <ToggleButton active={options.removeChroma} disabled={!image || isProcessing} onClick={() => updateBooleanOption('removeChroma', !options.removeChroma)} label="Chroma" />
            <ToggleButton active={options.compress} disabled={!image || isProcessing} onClick={() => updateBooleanOption('compress', !options.compress)} label="Comprimir" />
          </div>
          <div className="color-field">
            <div className="fill-toggle" aria-label="Salida del chroma">
              <button type="button" className={options.chromaFill === 'transparent' ? 'active' : ''} onClick={() => updateFillMode('transparent')} disabled={!image || isProcessing || !options.removeChroma}>
                Transp.
              </button>
              <button type="button" className={options.chromaFill === 'color' ? 'active' : ''} onClick={() => updateFillMode('color')} disabled={!image || isProcessing || !options.removeChroma}>
                Color
              </button>
            </div>
            <label className="picker-field">
              <span>
                <Droplet className="h-4 w-4" />
                {options.chromaFill === 'color' ? 'Fondo' : 'Chroma'}
              </span>
              <input
                type="color"
                value={options.chromaFill === 'color' ? options.backgroundColor ?? '#ffffff' : options.chromaColor ?? '#00ff00'}
                onChange={(event) => updatePickerColor(event.target.value)}
                disabled={!image || isProcessing || !options.removeChroma}
              />
              <strong>{options.chromaFill === 'color' ? (options.backgroundColor ?? '#ffffff').toUpperCase() : image?.chroma.detected ? image.chroma.color.toUpperCase() : 'No detectado'}</strong>
            </label>
          </div>
        </div>
        <button type="button" onClick={downloadImage} disabled={!hasUsefulOutput}>
          <Download className="h-4 w-4" />
          {hasUsefulOutput ? `Descargar ${image?.outputType === 'image/png' ? 'PNG' : 'JPG'}` : 'Sin descarga'}
        </button>
      </footer>

      {error ? <div className="error-message">{error}</div> : null}
    </main>
  );
}

function Preview({ label, src, size, transparent = false }: { label: string; src: string; size: string; transparent?: boolean }) {
  return (
    <figure className={transparent ? 'preview transparent-preview' : 'preview'}>
      <img src={src} alt={label} />
      <figcaption>
        <span>{label}</span>
        <strong>{size}</strong>
      </figcaption>
    </figure>
  );
}

function ToggleButton({ active, disabled, onClick, label }: { active: boolean; disabled: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" className={active ? 'toggle-button active' : 'toggle-button'} onClick={onClick} disabled={disabled}>
      <SlidersHorizontal className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}

function Metric({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={highlight ? 'metric highlight' : 'metric'}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function extensionForOutput(outputType: string, originalName: string) {
  if (outputType === 'image/png') return 'png';
  if (outputType === 'image/jpeg') return 'jpg';
  const extension = originalName.split('.').pop();
  return extension && extension !== originalName ? extension : 'png';
}
