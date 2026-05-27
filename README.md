# Proyecto Final PDS: Image Context Transformer

Prototipo web para convertir imagenes de entrada a JPG comprimido antes de subirlas a una aplicacion de chat LLM. El procesamiento se ejecuta localmente en el navegador mediante tecnicas de DSP: remuestreo espacial, cuantizacion perceptual, codificacion JPEG y medicion de error con MSE/PSNR.

## Integrantes

- Gael Calderon Robles
- Alejandro Apodaca Cordova, m041852

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

Para generar imagenes de prueba:

```bash
npm run fixtures
```

En macOS el script tambien convierte los SVG sinteticos a PNG con `sips`, para probar el flujo real de compresion en el navegador.

## Entregables

- `src/`: aplicacion React + Vite + Tailwind.
- `docs/rubrica-alineacion.md`: alineacion con 24ICE04 y 24ICE05.
- `latex/reporte.tex`: memoria tecnica en LaTeX.
