# MKWKO Score Web v2.4.8 — Verificación

Fecha: 2026-10-10. Base: v2.4.7 del repositorio público,
commit `d2a7dc0fe53450eb15e073cfbb1d6c2d0b105bf5`.

- Pruebas del proyecto: 21 aprobadas, 0 fallidas (18 existentes + 3 de nombre).
- Sintaxis: todos los archivos JavaScript del paquete comprobados con Node.
- Navegador real: Microsoft Edge sin interfaz, 72 escenarios aprobados.
- Tres variantes y cuatro tamaños por variante: 1920×1080, 1920×190,
  1280×150 y 1080×1920.
- Nombre ausente, espacios, nombre normal, nombre largo con emoji y texto que
  parece HTML: se mantiene texto literal, sin crear elementos HTML.
- Nombre y marcador dentro del viewport, transparencia del documento, ajuste
  completo de TAG y puntos y disposición 2×2 / 4×1 / 2×2.
- Cambios por el cliente de polling real usando respuestas Firebase simuladas:
  nombre nuevo, puntos actualizados, estado terminado y nombre borrado sin cambiar URL.
- Geometría exterior idéntica antes/después de cambiar puntos y estado.
- Configuración pública y todos los archivos originales no enumerados como
  modificados se verificaron por SHA-256 contra la base.
- ZIP completo comprobado contra la carpeta de salida; sin modificación del bot.

Las pruebas usan datos controlados y no escriben en Firebase. Se inspeccionaron
capturas de las tres variantes. No se realizó un despliegue en GitHub Pages ni
una prueba dentro de OBS; la verificación de publicación corresponde al paso
de instalación.
