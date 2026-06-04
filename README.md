# Proyecto Final PDS: Image Context Transformer

Prototipo web para limpiar y optimizar imágenes antes de subirlas a una aplicación de chat LLM. El procesamiento se ejecuta localmente en el navegador mediante técnicas de DSP: detección de chroma por color dominante, eliminación de fondo, remuestreo espacial, cuantización perceptual, codificación PNG/JPEG y medición de error con MSE/PSNR.

La interfaz separa dos decisiones:

- `Chroma`: activa o desactiva la limpieza de fondo. En el mismo bloque se elige si la salida queda transparente o con color sólido.
- `Comprimir`: activa o desactiva el remuestreo/codificación para ahorrar espacio. Al activarlo, la salida cambia a fondo blanco porque JPG no puede guardar transparencia.

Si la salida conserva transparencia, la app guarda PNG, apaga la compresión JPG y no muestra la métrica de ahorro. Si se activa `Comprimir`, la app usa fondo blanco de forma idempotente: volver a activarlo deja el mismo estado estable. Si la salida no ahorra espacio y tampoco aplica chroma, la app no ofrece descarga para evitar generar un archivo redundante.

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

## Python opcional

Para comparar el mismo concepto fuera del navegador se incluye un helper con Pillow:

```bash
python3 -m pip install Pillow
python3 scripts/remove-background.py fixtures/chroma-green-demo.png dist/sin-fondo.png --key '#00ff00'
python3 scripts/remove-background.py fixtures/chroma-green-demo.png dist/fondo-blanco.jpg --key '#00ff00' --mode replace --background '#ffffff'
```

## Entregables

- `src/`: aplicación React + Vite + Tailwind.
- `docs/rubrica-alineacion.md`: alineación con 24ICE04 y 24ICE05.
- `docs/rubricas/24ICE04.docx` y `docs/rubricas/24ICE05.docx`: rúbricas revisadas para validar el cumplimiento.
- `latex/reporte.tex`: memoria técnica en LaTeX.
