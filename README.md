# MKWKO Score Web v2.2.0 — Fixed OBS Color Layout

Public GitHub Pages frontend for MKWKO Score Bot v2.5.0.

## OBS behavior

The OBS Browser Source follows Mario Kart World's fixed team-color lane order:

```text
Red | Blue | Yellow | Green
```

Cards never reorder when points or rankings change. The rank badge may change, but each team's color position stays fixed.

The OBS overlay displays only the configured **TAG** once, plus current rank and adjusted point total. It no longer repeats the same value as both tag and team name.

## Permanent per-user URL

Run:

```text
/mk overlay
```

The bot returns a permanent URL for that Discord account in that Discord server, for example:

```text
https://YOUR-USERNAME.github.io/MKWKO-score-web/overlay.html?guild=123456789012345678&board=u1234567890abcdef1234
```

The same OBS Browser Source can be reused for later matches. When no active match exists, it waits for the next setup.

## Firebase configuration

Edit `assets/config.js` and set only the public Realtime Database URL:

```javascript
window.MK_SCORE_CONFIG = {
  databaseURL: "https://mkw-kobot-default-rtdb.firebaseio.com",
  defaultGuildId: "",
  defaultBoardId: "",
  pollIntervalMs: 5000,
  demoMode: false
};
```

Never add a Discord token, Firebase Admin credential, private key, `.env`, or service-account JSON to this public repository.

## GitHub Pages

Publish from:

```text
Branch: main
Folder: / (root)
```

After replacing an older frontend release, wait for GitHub Pages deployment to finish and refresh the OBS Browser Source cache once.

## Public data boundary

The browser reads only:

```text
guilds/{guildId}/boards/{boardId}/public
```

Browser writes remain disabled by Firebase rules.
