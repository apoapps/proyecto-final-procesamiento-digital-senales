# Cumplimiento de rúbricas 24ICE04 y 24ICE05

Proyecto: transformador web de imágenes para comprimir y convertir a JPG antes de subirlas a una aplicación de chat LLM.

Integrantes:

- Alejandro Apodaca Cordova, m041852
- Gael Calderon Robles, m042449

Rúbricas revisadas y guardadas en este repositorio:

- `docs/rubricas/24ICE04.docx`
- `docs/rubricas/24ICE05.docx`

## 24ICE04: investigación de problemas de ingeniería complejos

| Criterio | Como se cumple en el proyecto | Evidencia |
| --- | --- | --- |
| Definición clara del problema | Se define el costo técnico de subir imágenes crudas a un chat LLM: ancho de banda, memoria, base64 y contexto. | Reporte: Introducción y Enunciado. UI: story "Entrada pesada". |
| Justificación de relevancia | El problema se conecta con aplicaciónes reales de IA multimodal y uso de servidores. | Reporte: Introducción. |
| Preguntas de investigación | Se formulan preguntas sobre ahorro, base64 evitado y pérdida numerica por compresión. | Reporte: Enunciado del proyecto. |
| Selección de método | Se selecciona remuestreo espacial, luminancia opcional, JPEG, MSE y PSNR. | `src/imageProcessing.ts`; Reporte: Marco teórico. |
| Justificación del método | Cada técnica se justifica como operación DSP sobre una señal visual discreta. | Reporte: Marco teórico y Desarrollo. |
| Aplicación efectiva | El navegador procesa imágenes reales y genera JPG descargable. | App Vite desplegada; prueba con `fixture-1.png`. |
| Diseño experimental | Variables controlables: calidad JPEG, dimensión máxima, luminancia. Variables respuesta: bytes, PSNR, base64. | UI de parámetros; Reporte: Desarrollo. |
| Análisis e interpretación | Se reportan ahorro porcentual, relación de compresión, PSNR y contexto estimado. | UI: Telemetría; Reporte: Resultados. |
| Identificacion de patrones | Se interpreta el balance entre ahorro y degradacion. | Reporte: Resultados y Conclusión. |
| Conclusiónes validas | Se recomienda configuracion inicial y se explican condiciones donde debe ajustarse. | Reporte: Conclusión. |
| Limitaciones | Se reconocen límites de JPEG, compatibilidad de formatos y PSNR semantico. | Reporte: Alineacion y Conclusión. |

## 24ICE05: herramientas modernas de ingeniería y TI

| Criterio | Como se cumple en el proyecto | Evidencia |
| --- | --- | --- |
| Crear herramienta moderna | Se crea una app web publicable con React, Vite, TypeScript y Tailwind. | `package.json`, `src/`, despliegue Vercel. |
| Selecciónar herramienta moderna | Se eligio navegador/Canvas para comprimir antes del servidor y evitar transferencia innecesaria. | Reporte: Desarrollo. |
| Aplicar y evaluar herramientas | La app procesa imágenes, mide resultados y permite descargar la salida. | UI funcional; `npm run build`; verificación Playwright. |
| Metodologia apropiada | Flujo reproducible: adquirir, remuestrear, codificar, decodificar, medir, reportar. | `src/imageProcessing.ts`; Reporte: Desarrollo. |
| Identificar limitaciones técnicas | Se documentan transparencia, animación, compatibilidad del navegador y límite de PSNR. | Reporte: Alineacion y Conclusión. |
| Comprender impacto de limitaciones | Se explica cuando bajar calidad puede afectar texto pequeno o detalles finos. | Reporte: Resultados y Conclusión. |
| Proponer mejoras | OCR, SSIM y pruebas con modelos multimodales reales. | Reporte: Conclusión. |
| Prediccion/modelizacion | Se modela base64 como expansion 4/3 y unidades de contexto aproximadas. | `src/metrics.ts`; UI: Telemetría. |
| Interpretacion del modelo | El modelo se usa para comparar escenarios, no como conteo propietario definitivo. | Reporte: Desarrollo. |

## Verificaciones realizadas

- `npm run verify`
- `npm run fixtures`
- `npm run build`
- `tectonic latex/reporte.tex`
- Prueba de navegador con imagen fixture.
- Deploy de produccion en Vercel.
