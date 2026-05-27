# Alineacion con rubricas 24ICE04 y 24ICE05

## 24ICE04: investigacion y analisis

- Problema: imagenes crudas consumen ancho de banda, almacenamiento y contexto visual/base64 en chats LLM.
- Metodo: disenar experimento de compresion variando calidad JPEG y dimension maxima.
- Datos: medir bytes originales, bytes comprimidos, ahorro porcentual, factor base64, MSE y PSNR.
- Interpretacion: comparar ahorro contra perdida de calidad para seleccionar parametros de uso.
- Conclusiones: reportar configuracion recomendada y limitaciones del metodo.

## 24ICE05: herramientas modernas y limitaciones

- Herramienta TI: prototipo web publicable con Vite, React, TypeScript y Tailwind.
- Aplicacion de ingenieria: procesamiento local previo a carga de servidor.
- Modelizacion: estimacion de carga base64 y unidades aproximadas de contexto.
- Limitaciones: compatibilidad de formatos depende del navegador; JPEG no conserva transparencia; PSNR no sustituye evaluacion semantica.
- Reflexion final: incluir como se seleccionaron herramientas modernas y que restricciones tecnicas se identificaron.
