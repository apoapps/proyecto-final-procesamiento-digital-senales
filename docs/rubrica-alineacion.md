# Cumplimiento de rubricas 24ICE04 y 24ICE05

Proyecto: transformador web de imagenes para comprimir y convertir a JPG antes de subirlas a una aplicacion de chat LLM.

## 24ICE04: investigacion de problemas de ingenieria complejos

| Criterio | Como se cumple en el proyecto | Evidencia |
| --- | --- | --- |
| Definicion clara del problema | Se define el costo tecnico de subir imagenes crudas a un chat LLM: ancho de banda, memoria, base64 y contexto. | Reporte: Introduccion y Enunciado. UI: story "Entrada pesada". |
| Justificacion de relevancia | El problema se conecta con aplicaciones reales de IA multimodal y uso de servidores. | Reporte: Introduccion. |
| Preguntas de investigacion | Se formulan preguntas sobre ahorro, base64 evitado y perdida numerica por compresion. | Reporte: Enunciado del proyecto. |
| Seleccion de metodo | Se selecciona remuestreo espacial, luminancia opcional, JPEG, MSE y PSNR. | `src/imageProcessing.ts`; Reporte: Marco teorico. |
| Justificacion del metodo | Cada tecnica se justifica como operacion DSP sobre una senal visual discreta. | Reporte: Marco teorico y Desarrollo. |
| Aplicacion efectiva | El navegador procesa imagenes reales y genera JPG descargable. | App Vite desplegada; prueba con `fixture-1.png`. |
| Diseno experimental | Variables controlables: calidad JPEG, dimension maxima, luminancia. Variables respuesta: bytes, PSNR, base64. | UI de parametros; Reporte: Desarrollo. |
| Analisis e interpretacion | Se reportan ahorro porcentual, relacion de compresion, PSNR y contexto estimado. | UI: Telemetria; Reporte: Resultados. |
| Identificacion de patrones | Se interpreta el balance entre ahorro y degradacion. | Reporte: Resultados y Conclusion. |
| Conclusiones validas | Se recomienda configuracion inicial y se explican condiciones donde debe ajustarse. | Reporte: Conclusion. |
| Limitaciones | Se reconocen limites de JPEG, compatibilidad de formatos y PSNR semantico. | Reporte: Alineacion y Conclusion. |

## 24ICE05: herramientas modernas de ingenieria y TI

| Criterio | Como se cumple en el proyecto | Evidencia |
| --- | --- | --- |
| Crear herramienta moderna | Se crea una app web publicable con React, Vite, TypeScript y Tailwind. | `package.json`, `src/`, despliegue Vercel. |
| Seleccionar herramienta moderna | Se eligio navegador/Canvas para comprimir antes del servidor y evitar transferencia innecesaria. | Reporte: Desarrollo. |
| Aplicar y evaluar herramientas | La app procesa imagenes, mide resultados y permite descargar la salida. | UI funcional; `npm run build`; verificacion Playwright. |
| Metodologia apropiada | Flujo reproducible: adquirir, remuestrear, codificar, decodificar, medir, reportar. | `src/imageProcessing.ts`; Reporte: Desarrollo. |
| Identificar limitaciones tecnicas | Se documentan transparencia, animacion, compatibilidad del navegador y limite de PSNR. | Reporte: Alineacion y Conclusion. |
| Comprender impacto de limitaciones | Se explica cuando bajar calidad puede afectar texto pequeno o detalles finos. | Reporte: Resultados y Conclusion. |
| Proponer mejoras | OCR, SSIM y pruebas con modelos multimodales reales. | Reporte: Conclusion. |
| Prediccion/modelizacion | Se modela base64 como expansion 4/3 y unidades de contexto aproximadas. | `src/metrics.ts`; UI: Telemetria. |
| Interpretacion del modelo | El modelo se usa para comparar escenarios, no como conteo propietario definitivo. | Reporte: Desarrollo. |

## Verificaciones realizadas

- `npm run verify`
- `npm run fixtures`
- `npm run build`
- `tectonic latex/reporte.tex`
- Prueba de navegador con imagen fixture.
- Deploy de produccion en Vercel.
