# MKWKO Score Web v2.2.1 — Standard + TikTok OBS Layouts

Public GitHub Pages frontend for MKWKO Score Bot v2.5.2.

## OBS behavior

The OBS Browser Source follows Mario Kart World's fixed team-color lane order:

```text
Red | Blue | Yellow | Green
```

Cards never reorder when points or rankings change. The rank badge may change, but each team's color position stays fixed.

The OBS overlay displays only the configured **TAG** once, plus current rank and adjusted point total. It no longer repeats the same value as both tag and team name.

## Permanent per-user overlay URLs

Run:

```text
/mk overlay
```

The bot returns three permanent Browser Source URLs for that Discord account in that Discord server. All three follow the same match automatically:

```text
Standard OBS (1920 x 400)
https://YOUR-USERNAME.github.io/MKWKO-score-web/overlay.html?guild=123456789012345678&board=u1234567890abcdef1234

TikTok horizontal / landscape (1920 x 1080)
https://YOUR-USERNAME.github.io/MKWKO-score-web/overlay-tiktok-horizontal.html?guild=123456789012345678&board=u1234567890abcdef1234

TikTok vertical / portrait (1080 x 1920)
https://YOUR-USERNAME.github.io/MKWKO-score-web/overlay-tiktok-vertical.html?guild=123456789012345678&board=u1234567890abcdef1234
```

The standard layout is a compact strip. The TikTok horizontal layout is a full 16:9 transparent canvas with the score positioned near the top safe area. The TikTok vertical layout uses a 9:16 transparent canvas and stacks the four fixed-color teams vertically for mobile readability.

The URLs remain stable between matches. When no active match exists, each layout waits for the next setup.

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

## Compact race progress strip

All OBS layouts intentionally omit the tournament title and textual `Race X / Y · scoring` header.
The top strip contains one small empty square per configured race. A square fills when that race has been stored.
The strip stays narrow so the team score areas keep their original breathing room.

The fixed visual team order remains Red, Blue, Yellow, Green and scores never reorder the lanes.
