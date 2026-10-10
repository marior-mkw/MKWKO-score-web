# MKWKO Score Web v2.4.8

Public website and OBS/TikTok overlays for MKWKO.

## Layout
- Website: four teams in one fixed horizontal row (scrollable on narrow screens).
- Standard OBS: fixed 2 x 2.
- TikTok Horizontal: four teams in one fixed horizontal row.
- TikTok Vertical: fixed 2 x 2.
- Team cards never reorder by score/rank; configured lane order remains fixed.


Responsive public scoreboard and OBS overlays for MKWKO Score Bot v2.7.0.

## Channel-owned URLs

Use the exact links returned by `/mk overlay`:

```text
/?guild=GUILD_ID&channel=CHANNEL_ID
/overlay.html?guild=GUILD_ID&channel=CHANNEL_ID
/overlay-tiktok-horizontal.html?guild=GUILD_ID&channel=CHANNEL_ID
/overlay-tiktok-vertical.html?guild=GUILD_ID&channel=CHANNEL_ID
```

The browser derives the internal board ID from the Discord channel. Old explicit `board=` links remain readable for migration, but new links use `channel=`.

## OBS dimensions

- Standard 2 x 2: **960 x 320**
- TikTok Horizontal 4 x 1: **1920 x 190** (or full canvas 1920 x 1080)
- TikTok Vertical 2 x 2: **1080 x 1920**

All overlays keep Red, Blue / Yellow, Green in fixed physical slots.

## Live updates

The client opens a Firebase REST EventSource stream for immediate update signals and keeps normal 5-second polling as a fallback. Asset URLs are versioned to reduce stale OBS browser caching after deployment.

After upgrading the files on GitHub Pages, refresh the OBS Browser Source cache once.

## Website improvements

- Team TAG is rendered once per team.
- Responsive team cards and tables adapt to desktop, tablet and phone widths.
- Final point ties show the exact placement-countback condition used to separate tied teams.
- Invalid external team tags are sanitized before display.

## Firebase configuration

`assets/config.js` must point to:

```text
https://mkw-kobot-default-rtdb.firebaseio.com
```

The website uses only the public sanitized projection and contains no administrative credentials.

## v2.4.8 — Nombre del enfrentamiento

El marco y la placa inferior aparecen únicamente si el estado público contiene
`name` con texto. Sin nombre, no hay marco ni espacio reservado para la placa.
El nombre procede del mismo estado del bot; no se agrega un campo en Discord
ni se modifica el bot. El título genérico del sitio no activa el marco.
Se muestran hasta 24 caracteres visuales; los nombres más largos se truncan con
`...`. La fuente se reduce hasta 10 px y después se aplica elipsis si falta ancho.
El nombre completo normalizado (hasta 80 caracteres, como en v2.4.7) queda en el
atributo accesible y en el título de la placa.

El contorno neutral conserva el fondo transparente fuera de las tarjetas.
El marco cabe en el espacio original de cada variante, incluyendo la placa.
No cambia el orden de equipos ni la geometría exterior al actualizar los puntos.

Consultar `INSTALACION-v2.4.8.md`, `ARCHIVOS-MODIFICADOS-v2.4.8.md` y
`VALIDATION_REPORT.md` para instalación, diferencias y comprobaciones.
