# Validation report - web v2.4.5

Validated after the public-site team-lane update.

- `node --check assets/scoreboard.js`: pass
- `node --check assets/common.js`: pass
- `node --check assets/overlay-v2.4.4.js`: pass
- `npm test`: 18 passed, 0 failed

Specific regression checks include:
- Public scoreboard cards iterate `state.teams` (configured order) rather than standings order.
- Four-column public summary layout is preserved.
- Team tags render once and numeric tags remain rejected.
- Current channel-owned Firebase URL behavior remains unchanged.
- Existing v2.4.4 OBS overlay bundle is preserved in the full package.
