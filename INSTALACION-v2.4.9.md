# Instalar MKWKO Score Web v2.4.9

1. Descomprimir `MKWKO-score-web-v2.4.9-complete.zip` y respaldar el frontend actual.
2. Sustituir el contenido de `marior-mkw/MKWKO-score-web` en la carpeta que publica
   GitHub Pages con todos los archivos extraídos. El ZIP contiene el sitio directamente
   en su raíz. Subir el contenido, no el ZIP ni una carpeta exterior.
3. Incluir `assets/fonts/RacersDelight.otf`, `assets/fonts/README.txt`,
   `assets/fonts-v2.4.9.css`, el nuevo bundle de overlays y `.nojekyll`.
   Si se usa un clon local, conservar `.git/` y su configuración de despliegue.
4. Confirmar los cambios en la rama de Pages y esperar que finalice correctamente
   `pages build and deployment`. No hay compilación ni instalación de dependencias.
5. Recargar el sitio con Ctrl+F5. En OBS, abrir Properties de cada Browser Source
   y pulsar `Refresh cache of current page`. Conservar las URL actuales y sus parámetros.
6. Para OBS Standard, ajustar el tamaño a **420 × 760** o **400 × 720** para la nueva
   columna de cuatro tarjetas. Horizontal: **1920 × 190**. Vertical: **1080 × 1920**.

## Comprobar
- El título del overlay identifica `MKWKO 2.4.9`.
- El HTML carga `assets/fonts-v2.4.9.css`, `assets/overlay-v2.4.9.css` y
  `assets/overlay-v2.4.9.js`.
- OBS Standard tiene una columna; Horizontal una fila; Vertical dos filas y dos columnas.
- No existe un contorno exterior que una las tarjetas.
- El progreso tiene un panel oscuro y un conteo N/M.
- Con `name` en el estado público, aparece la banda amarilla abajo a la derecha.
  Sin nombre, la banda desaparece.
- La fuente aparece sin instalación en el sistema operativo; se carga desde el propio sitio.
- El pie del sitio público muestra los créditos de la fuente y de los renders de muestra.

El bot y sus comandos no requieren ningún cambio. No modificar Cloud Run, Firebase Rules
ni Secret Manager. La configuración pública se incluye intacta.

Para volver atrás, restaurar el respaldo del frontend y actualizar la caché de OBS.
