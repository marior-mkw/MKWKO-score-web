# Archivos modificados — v2.4.8

Base v2.4.7, commit `d2a7dc0fe53450eb15e073cfbb1d6c2d0b105bf5`.

## Modificados
- `CHANGELOG.md`
- `README.md`
- `VALIDATION_REPORT.md`
- `index.html`
- `overlay-tiktok-horizontal.html`
- `overlay-tiktok-vertical.html`
- `overlay.html`
- `package.json`
- `test/security.test.js`

## Añadidos
- `ARCHIVOS-MODIFICADOS-v2.4.8.md`
- `INSTALACION-v2.4.8.md`
- `assets/overlay-v2.4.8.css`
- `assets/overlay-v2.4.8.js`
- `test/match-name.test.js`

## Qué cambia
- Los tres HTML de overlays incorporan el contenedor, contorno SVG y placa,
  y cargan el nuevo bundle 2.4.8.
- `index.html`: solo se actualizan las referencias de versión/caché.
- `package.json`: versión 2.4.8.
- `test/security.test.js`: se corrigen referencias anteriores a 2.4.6 para
  comprobar los assets 2.4.8 realmente publicados.
- `assets/overlay-v2.4.8.js`: nombre opcional desde `raw.name`, visibilidad,
  encuadre adaptable y texto ajustado. No modifica el cliente de base de datos.
- `assets/overlay-v2.4.8.css`: contorno neutral sin relleno y placa inferior.
- `test/match-name.test.js`: nombre vacío, fuente única, controles y longitud.
- Documentación: instrucciones y resultados actuales.

## Conservados
Todos los demás archivos de la base se incluyen sin cambios, también los assets
antiguos. No hay archivos eliminados. En particular: `assets/config.js`,
`assets/common.js`, `assets/scoreboard.js`, `assets/styles.css` y los bundles
2.4.7 conservan su contenido original. El repositorio es solo frontend; no
contiene una nueva versión del bot y no requiere modificarlo.
