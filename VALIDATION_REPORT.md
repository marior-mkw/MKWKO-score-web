# MKWKO Score Web v2.2.2 Validation Report

- 9 automated Node tests passed; 0 failed.
- JavaScript syntax checks passed for `assets/overlay.js`, `assets/common.js`, and `assets/scoreboard.js`.
- All three OBS pages use a compact race-progress strip.
- Visible tournament title and textual race/scoring header were removed from OBS layouts.
- One marker is rendered per configured race; completed races receive the `completed` state.
- Team lanes remain fixed in Red, Blue, Yellow, Green setup order and are not reordered by standings.
- Score cards retain minimum vertical space after the header reduction.
- Public Firebase configuration remains `https://mkw-kobot-default-rtdb.firebaseio.com` with demo mode disabled.
