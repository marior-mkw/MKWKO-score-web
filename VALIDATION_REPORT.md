# Verificación de MKWKO Score Web v2.4.9

Fecha: 2026-10-10. Base: frontend v2.4.8 preparado sobre v2.4.7.

- 21 pruebas automatizadas aprobadas, 0 fallidas.
- Sintaxis JavaScript comprobada en todos los archivos del paquete.
- 73 escenarios en Microsoft Edge: tres overlays, cuatro tamaños
  por variante, nombre ausente/vacío/normal/largo/texto con apariencia HTML,
  cambios de nombre/puntos/estado y borrado del nombre mediante polling simulado.
- Sitio público: fuente local, tarjetas y enlaces de créditos comprobados.
- OBS 1×4, Horizontal 4×1, Vertical 2×2; orden de equipos conservado.
- Nombre dentro del viewport, fondo transparente fuera de tarjetas, ausencia de
  SVG/contorno exterior, panel de carreras visible y contador N/M.
- Ajuste de TAG y puntuaciones: sin recorte en los escenarios comprobados.
- Fuente cargada en navegador; se revisaron visualmente capturas de todos los layouts.
- Configuración pública conservada byte por byte; no se modifica el bot.
- Integridad del ZIP comprobada contra la carpeta de salida.

Las respuestas de Firebase se simularon sin escribir en la base. No se ha publicado
en GitHub Pages ni probado dentro de OBS. Los pasos para comprobar publicación
están en `INSTALACION-v2.4.9.md`.
