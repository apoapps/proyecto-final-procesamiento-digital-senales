import { useRef, useState } from 'react';
import { Download, FileText, Loader2, Upload } from 'lucide-react';
import { formatBytes } from './metrics';
import { processImageFile, type ProcessedImage, type ProcessingOptions } from './imageProcessing';

const defaultOptions: ProcessingOptions = {
  quality: 0.72,
  maxDimension: 1280,
  grayscale: false
};

export function App() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [image, setImage] = useState<ProcessedImage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(fileList: FileList | File[]) {
    const file = Array.from(fileList).find((entry) => entry.type.startsWith('image/'));
    if (!file) {
      setError('Sube una imagen valida.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      if (image) {
        URL.revokeObjectURL(image.sourceUrl);
        URL.revokeObjectURL(image.outputUrl);
      }
      setImage(await processImageFile(file, defaultOptions));
    } catch (processingError) {
      setError(processingError instanceof Error ? processingError.message : 'No se pudo procesar la imagen.');
    } finally {
      setIsProcessing(false);
      setIsDragActive(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function reset() {
    if (image) {
      URL.revokeObjectURL(image.sourceUrl);
      URL.revokeObjectURL(image.outputUrl);
    }
    setImage(null);
    setError(null);
  }

  function downloadImage() {
    if (!image) return;
    const anchor = document.createElement('a');
    const baseName = image.name.replace(/\.[^.]+$/, '');
    anchor.href = image.outputUrl;
    anchor.download = `${baseName}-mas-liviana.jpg`;
    anchor.click();
  }

  const savedPercent = image ? image.metrics.savedPercent : 0;
  const original = image ? formatBytes(image.metrics.originalBytes) : '0 B';
  const compressed = image ? formatBytes(image.metrics.compressedBytes) : '0 B';

  return (
    <main className="app-screen">
      <header className="topbar">
        <div>
          <p>Transformador de imagenes</p>
          <span>Alejandro Apodaca m041852 / Gael Calderon m042449</span>
        </div>
        <div className="topbar-actions">
          <a href="/reporte.pdf" download="reporte-transformador-imagenes.pdf">
            <FileText className="h-3.5 w-3.5" />
            Reporte
          </a>
          <button type="button" onClick={reset} disabled={!image}>
            Reiniciar
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="message">
          <p className="eyebrow">Idea clave / optimizacion</p>
          <h1>
            La misma imagen,
            <br />
            <em>{image ? `${savedPercent.toFixed(1)}%` : 'mucho'}</em> mas liviana.
          </h1>
          <p className="plain-copy">Misma imagen visual. Menos peso. Mejor para enviarla a un chat o sistema de IA.</p>
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
              <span>La pagina la hace mas ligera automaticamente.</span>
            </div>
          ) : (
            <div className="compare">
              <Preview label="Original" src={image.sourceUrl} size={original} />
              <Preview label="Optimizada" src={image.outputUrl} size={compressed} />
            </div>
          )}
        </label>
      </section>

      <footer className="bottom-bar">
        <Metric label="Original" value={original} />
        <Metric label="Optimizada" value={compressed} />
        <Metric label="Ahorro" value={image ? `${savedPercent.toFixed(1)}%` : '0.0%'} highlight />
        <button type="button" onClick={downloadImage} disabled={!image}>
          <Download className="h-4 w-4" />
          Descargar JPG
        </button>
      </footer>

      {error ? <div className="error-message">{error}</div> : null}
    </main>
  );
}

function Preview({ label, src, size }: { label: string; src: string; size: string }) {
  return (
    <figure className="preview">
      <img src={src} alt={label} />
      <figcaption>
        <span>{label}</span>
        <strong>{size}</strong>
      </figcaption>
    </figure>
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
