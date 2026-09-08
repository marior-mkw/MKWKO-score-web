# MKWKO Score Web v2.2.0 — Validation Report

Validated in the build environment on 2026-09-08:

- 7 automated web/OBS tests passed; 0 failed.
- All JavaScript files pass `node --check`.
- OBS cards render in the configured Mario Kart World lane order and are not reordered by score.
- Rank badges still reflect the current score/countback ranking while card positions stay fixed.
- The overlay renders each team tag once and does not duplicate the tag as a second team name.
- Public numeric totals support point deductions, including negative adjusted totals.
- Browser requests remain bounded and unauthenticated; public pages retain CSP and no-referrer controls.
- The public Firebase URL is `https://mkw-kobot-default-rtdb.firebaseio.com` and no administrative credential is included.
- Permanent `guild` + `board` overlay URLs remain compatible with bot v2.5.0.
