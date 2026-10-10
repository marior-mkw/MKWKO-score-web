# Changelog

## 2.4.8 — 2026-10-10
- Marco opcional neutral y placa inferior en los tres overlays, a partir de `state.name`.
- Sin nombre real, no se activa el marco ni se reserva espacio.
- Contorno transparente con cortes diagonales, ajustado al viewport.
- Texto seguro, máximo visual de 24 caracteres, reducción de fuente y elipsis.
- Se mantienen distribuciones, orden fijo, progreso y desempates de v2.4.7.
- Nuevos assets 2.4.8; entradas HTML y versión del paquete actualizadas.
- Las pruebas de seguridad ahora comprueban el bundle que carga el HTML.
- Bot, Firebase y configuración pública sin cambios.


## 2.4.7
- Public website keeps all four teams in one horizontal fixed lane row.
- Public website never reorders team cards by live rank; only rank/points change in place.
- Public website keeps upright, unclipped team labels.
- TikTok Horizontal overlay now uses a single four-team row.
- Standard OBS and TikTok Vertical overlays remain 2 x 2.
- Overlay assets are versioned to 2.4.7 to avoid stale-cache mixing.


## 2.4.7
- Reworked TikTok horizontal overlay into a one-row four-card layout closer to the requested in-game style.
- Increased race progress marker size slightly for better readability.
- Preserved fixed team lane order across the web site and overlays.
- Refreshed overlay asset filenames and query strings to reduce stale-cache issues when replacing GitHub Pages files.
