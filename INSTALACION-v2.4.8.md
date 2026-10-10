# Instalación de MKWKO Score Web v2.4.8

## Sustituir el frontend
1. Descargar y descomprimir `MKWKO-score-web-v2.4.8-complete.zip`.
2. Guardar una copia de la versión actual del repositorio web para poder volver atrás.
3. En `marior-mkw/MKWKO-score-web`, sustituir el contenido de la carpeta desde la
   que publica GitHub Pages con TODOS los archivos extraídos. El ZIP tiene los
   archivos directamente en la raíz: `index.html`, los tres overlays, `assets/`,
   `test/`, `package.json`, documentación y `.nojekyll`.
4. No subir el ZIP ni una carpeta exterior. Si se trabaja con un clon local,
   conservar `.git/` y la configuración de despliegue propia del repositorio.
   Asegurarse de incluir `.nojekyll`, que puede estar oculto en el explorador.
5. Confirmar los cambios en la rama que ya usa GitHub Pages (actualmente `main`).
   No hace falta instalar dependencias ni ejecutar una compilación.
6. Esperar a que el despliegue `pages build and deployment` termine correctamente.
7. Recargar el sitio con Ctrl+F5. En cada Browser Source de OBS abrir Properties
   y pulsar `Refresh cache of current page`. Mantener las mismas URL y parámetros
   `guild`, `channel` o `board` que ya devolvía `/mk overlay`.

## Comprobar la versión publicada
- Abrir uno de los overlays. El título de la página contiene `MKWKO 2.4.8`.
- Su código fuente debe cargar `assets/overlay-v2.4.8.css` y
  `assets/overlay-v2.4.8.js`; el HTML declara `data-overlay-build="2.4.8"`.
- Con un encuentro cuyo estado público tenga `name`, aparecen contorno y placa.
- Si `name` falta, está vacío o contiene solo espacios, no aparece ninguno.
- Cambiar resultados mediante el flujo habitual: solo cambian los valores,
  manteniendo RED / BLUE / YELLOW / GREEN en su lugar.
- Standard y Vertical mantienen 2×2; Horizontal mantiene cuatro tarjetas en fila.

## Tamaños de referencia
- Standard: 960 × 320.
- TikTok Horizontal: 1920 × 190, 1600 × 160 o 1280 × 150; también admite lienzo completo.
- TikTok Vertical: 1080 × 1920.
El marco se ajusta al mismo espacio disponible, con una pequeña banda para la placa.
Viewports extremadamente pequeños limitan inevitablemente la lectura del texto.

## Bot y configuración
No modificar ni volver a desplegar el bot, Cloud Run, Secret Manager o Firebase Rules.
`assets/config.js` se conserva byte por byte, con la URL pública existente y
`demoMode: false`. El nombre proviene exclusivamente de `name` en la proyección
pública existente. No se agrega un nombre por URL ni un formulario independiente.

## Volver atrás
Restaurar la copia previa del frontend, esperar su despliegue y refrescar la caché de OBS.
