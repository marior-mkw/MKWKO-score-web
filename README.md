# MKWKO Score Web v2.4.0

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
- TikTok Horizontal 2 x 2: **1920 x 1080**
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
