# MKWKO Score Web v2.4.9

Frontend estático para GitHub Pages, compatible con el estado público del bot existente.

## Diseño
- Sitio web: cuatro tarjetas en una fila fija, con desplazamiento en pantallas estrechas.
- OBS Standard: una columna con cuatro tarjetas, RED / BLUE / YELLOW / GREEN.
- TikTok Horizontal: cuatro tarjetas en una fila.
- TikTok Vertical: dos columnas y dos filas.
- Las tarjetas comparten fondo oscuro, borde ligero y franja superior del color del equipo.
- No se dibuja un contorno alrededor del conjunto de tarjetas.
- La banda del nombre es amarilla, con texto blanco delineado, debajo y a la derecha.
- Solo aparece si `name` contiene texto en el estado público. Sin nombre no reserva espacio.
- El progreso de carreras aparece sobre un panel oscuro propio, con indicadores y conteo N/M.
- Racers Delight se carga localmente en el sitio y en los overlays. El estilo inclinado
  de sus letras pertenece a la fuente proporcionada. No se requiere instalarla en OBS.
- Los nombres muestran hasta 24 caracteres visuales, con reducción de fuente y elipsis.

## Enlaces del bot
Conservar los enlaces que ya devuelve `/mk overlay`:

```text
/?guild=GUILD_ID&channel=CHANNEL_ID
/overlay.html?guild=GUILD_ID&channel=CHANNEL_ID
/overlay-tiktok-horizontal.html?guild=GUILD_ID&channel=CHANNEL_ID
/overlay-tiktok-vertical.html?guild=GUILD_ID&channel=CHANNEL_ID
```

Los enlaces antiguos con `board=` también siguen funcionando.

## Tamaños de referencia de Browser Source
- OBS Standard vertical: **420 × 760** (alternativa 400 × 720).
- TikTok Horizontal: **1920 × 190** (alternativa 1280 × 150).
- TikTok Vertical: **1080 × 1920**.
El encuadre se calcula desde el viewport. Los lienzos completos siguen admitidos.

## Instalación y verificación
Consultar `INSTALACION-v2.4.9.md`, `ARCHIVOS-MODIFICADOS-v2.4.9.md` y
`VALIDATION_REPORT.md`. No se necesita compilar el sitio.
Las guías con v2.4.8 en su nombre corresponden a la versión anterior.

## Datos y bot
Se mantienen el cliente público, los enlaces por canal, las actualizaciones en vivo,
el cálculo de posiciones y los detalles de desempate. `assets/config.js` conserva
`https://mkw-kobot-default-rtdb.firebaseio.com` y `demoMode: false`.
El bot, Cloud Run y Firebase Rules no se modifican.

## Créditos
Fuente **Racers Delight** por **@ImWhoreHay**, según el README suministrado.
Se conserva ese README junto al archivo de fuente en `assets/fonts/`.

Mario Render used in showcase images by [@mario64models](https://ko-fi.com/mario64models)
and [@CashBanacho](https://ko-fi.com/CashBanacho).

Consultar también `CREDITS.md`. Los créditos aparecen en el pie del sitio público.
