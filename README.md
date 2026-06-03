# Proyecto Final PDS: Image Context Transformer

Prototipo web para limpiar y optimizar imágenes antes de subirlas a una aplicación de chat LLM. El procesamiento se ejecuta localmente en el navegador mediante técnicas de DSP: detección de chroma por color dominante, eliminación o reemplazo de fondo, remuestreo espacial, cuantización perceptual, codificación PNG/JPEG y medición de error con MSE/PSNR.

## Integrantes

- Alejandro Apodaca Cordova, m041852
- Gael Calderon Robles, m042449

## Ejecutar

```bash
npm install
npm run dev
```

## Verificar

```bash
npm run verify
npm run build
```

Para generar imágenes de prueba:

```bash
npm run fixtures
```

En macOS el script también convierte los SVG sintéticos a PNG con `sips`, para probar el flujo real de compresión en el navegador.

## Entregables

- `src/`: aplicación React + Vite + Tailwind.
- `docs/rubrica-alineacion.md`: alineación con 24ICE04 y 24ICE05.
- `docs/rubricas/24ICE04.docx` y `docs/rubricas/24ICE05.docx`: rúbricas revisadas para validar el cumplimiento.
- `latex/reporte.tex`: memoria técnica en LaTeX.
