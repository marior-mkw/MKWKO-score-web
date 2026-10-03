# MKWKO Score Web v2.4.6 — Validation Report

Validated on 2026-10-03.

## Requested behavior
- Public website renders the four configured teams in one horizontal row.
- Public website renders cards in `state.teams` setup order, never in live standings order.
- Rank and points update in place without moving team cards.
- Website team labels remain upright and are not duplicated.
- Narrow browsers keep one horizontal lane row using horizontal scrolling rather than stacking/reordering cards.
- TikTok Horizontal overlay alone uses one row with four fixed team lanes.
- Standard OBS remains 2 x 2.
- TikTok Vertical remains 2 x 2.
- All overlays keep fixed setup order while rank/points update.
- Firebase URL remains `https://mkw-kobot-default-rtdb.firebaseio.com` and demo mode remains disabled.

## Automated checks
`npm test`: 18 passed, 0 failed.

JavaScript syntax checks passed for:
- `assets/scoreboard.js`
- `assets/overlay-v2.4.6.js`

## Cache/version isolation
- Website assets use `?v=2.4.6`.
- All overlay entry points load `overlay-v2.4.6.css` and `overlay-v2.4.6.js`.
