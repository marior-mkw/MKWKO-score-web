# Archivos modificados — v2.4.9

Comparación exacta contra v2.4.8.

## Modificados
- `CHANGELOG.md`
- `README.md`
- `VALIDATION_REPORT.md`
- `assets/styles.css`
- `index.html`
- `overlay-tiktok-horizontal.html`
- `overlay-tiktok-vertical.html`
- `overlay.html`
- `package.json`
- `test/match-name.test.js`
- `test/security.test.js`

## Añadidos
- `ARCHIVOS-MODIFICADOS-v2.4.9.md`
- `CREDITS.md`
- `INSTALACION-v2.4.9.md`
- `assets/fonts-v2.4.9.css`
- `assets/fonts/README.txt`
- `assets/fonts/RacersDelight.otf`
- `assets/overlay-v2.4.9.css`
- `assets/overlay-v2.4.9.js`

## Detalle
- `index.html`: carga de la fuente, versión/caché y créditos visibles.
- Los tres HTML de overlays: eliminan el contorno SVG, agregan el panel del
  progreso con conteo y cargan la fuente y los assets 2.4.9.
- `assets/styles.css`: tipografía y fondo de tarjetas del sitio, y pie de créditos.
- Nuevo CSS de overlays: tarjetas comunes, OBS en columna, título amarillo
  inferior derecho, panel de progreso y transparencia exterior.
- Nuevo JavaScript de overlays: cálculo adaptable de columnas/filas/tipografía,
  conteo de carreras y ajuste del título; mantiene la lectura del estado público.
- `assets/fonts-v2.4.9.css`: fuente local Racers Delight.
- `assets/fonts/`: OTF y README originales del ZIP proporcionado.
- Pruebas: verifican el bundle 2.4.9 y la nueva distribución vertical de OBS.
- Documentación: instalación, créditos, cambios y verificación de esta versión.

## Conservados
`assets/config.js`, `assets/common.js` y `assets/scoreboard.js` conservan exactamente
su contenido de v2.4.8. No se elimina ningún archivo previo. Los bundles anteriores
permanecen como archivos históricos y los HTML activos cargan únicamente 2.4.9.
El bot no se modifica ni se incluye una actualización de su código.
