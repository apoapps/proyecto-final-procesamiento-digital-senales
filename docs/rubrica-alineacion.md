# Cumplimiento de rúbricas 24ICE04 y 24ICE05

Proyecto: transformador web de imágenes para quitar o reemplazar chroma y hacerlas más livianas antes de enviarlas a un chat o sistema de IA.

Integrantes:

- Alejandro Apodaca Córdova, m041852
- Gael Calderón Robles, m042449

Rúbricas revisadas:

- `docs/rubricas/24ICE04.docx`
- `docs/rubricas/24ICE05.docx`

## Concepto final

La interfaz final comunica una idea simple: **fondo limpio y archivo optimizado**.

La app no muestra todos los indicadores técnicos para no confundir al usuario. El reporte conserva la explicación de DSP, chroma key, MSE, PSNR, base64 y limitaciones para cumplir la rúbrica.

## 24ICE04: investigación de problemas de ingeniería complejos

| Criterio | Cómo se cumple | Evidencia |
| --- | --- | --- |
| Definición clara del problema | Se define el costo de enviar imágenes pesadas a sistemas de IA. | Reporte: problema de investigación. |
| Justificación de relevancia | El problema afecta ancho de banda, tiempo de carga y tamaño de datos. | Reporte: problema y conclusiones. |
| Preguntas de investigación | Se pregunta cuánto peso se ahorra, cómo comunicarlo y qué límites tiene JPEG. | Reporte: preguntas de investigación. |
| Método apropiado | Se usa detección de chroma, segmentación por distancia de color, remuestreo, PNG/JPEG, medición de bytes, MSE y PSNR. | `src/imageProcessing.ts`; reporte: metodología. |
| Diseño experimental | Se fija calidad 72%, dimensión máxima 1280 px, opción de transparencia/reemplazo y fixture reproducible. | Reporte: diseño experimental. |
| Análisis e interpretación | Se reporta 84.1% de ahorro y relación de compresión 6.31x. | Reporte: resultados. |
| Conclusiones válidas | Se concluye que la optimización local reduce recursos sin complicar la UX. | Reporte: conclusiones. |
| Limitaciones | Se reconocen transparencia, texto pequeño, PSNR y compatibilidad de navegador. | Reporte: limitaciones. |
| Conocimiento basado en literatura | Se citan procesamiento de imágenes, señales discretas, JPEG y Canvas. | Reporte: bibliografía. |

## 24ICE05: herramientas modernas de ingeniería y TI

| Criterio | Cómo se cumple | Evidencia |
| --- | --- | --- |
| Crear herramienta moderna | Se construyó una app web funcional. | `src/`, `package.json`. |
| Seleccionar herramienta adecuada | Se eligió navegador/Canvas para optimizar antes del servidor. | Reporte: herramienta moderna. |
| Aplicar y evaluar herramienta | La app procesa una imagen, muestra ahorro, reporta el color chroma y descarga PNG o JPG según el modo. | UI final; `npm run build`. |
| Metodología de creación | Flujo: adquirir, remuestrear, codificar, medir, reportar. | Reporte: metodología. |
| Limitaciones técnicas | Se describen límites de JPEG, formato y PSNR. | Reporte: limitaciones. |
| Propuestas de mejora | OCR, SSIM y pruebas con modelos multimodales reales. | Reporte: limitaciones y reflexión. |
| Predicción/modelización | Se modela ahorro porcentual y expansión base64. | Reporte: predicción y modelización. |
| Interpretación del modelo | El modelo se usa para comparar ahorro relativo, no como conteo propietario exacto. | Reporte: predicción y modelización. |

## Verificaciones

- `npm run build`
- `tectonic latex/reporte.tex`
- Revisión de rúbricas DOCX por extracción de texto.
- App publicada/actualizable desde el repositorio de GitHub.
