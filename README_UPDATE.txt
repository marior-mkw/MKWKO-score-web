MKWKO public website v2.4.5 - fixed team lanes

Replace only these files in the public GitHub Pages repository:
- index.html
- assets/styles.css
- assets/scoreboard.js

Changes:
- Four teams stay in one horizontal row.
- Card order follows configured team/color order and never changes with standings.
- Rank changes inside each fixed card.
- Public cards use the upright, in-game-inspired visual style from the OBS overlay.
- No duplicated team tag.
- No italics; tag text is not ellipsized.
- Narrow browsers preserve the one-row layout with horizontal scrolling.

No bot, Firebase, Cloud Run or Discord command changes are required.
