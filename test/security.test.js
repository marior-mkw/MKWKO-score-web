"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
const overlayHtml = fs.readFileSync(path.join(root, "overlay.html"), "utf8");
const tiktokHorizontalHtml = fs.readFileSync(path.join(root, "overlay-tiktok-horizontal.html"), "utf8");
const tiktokVerticalHtml = fs.readFileSync(path.join(root, "overlay-tiktok-vertical.html"), "utf8");
const stylesSource = fs.readFileSync(path.join(root, "assets/styles.css"), "utf8");
const commonSource = fs.readFileSync(path.join(root, "assets/common.js"), "utf8");
const scoreboardSource = fs.readFileSync(path.join(root, "assets/scoreboard.js"), "utf8");
const overlaySource = fs.readFileSync(path.join(root, "assets/overlay-v2.4.6.js"), "utf8");
const overlayStylesSource = fs.readFileSync(path.join(root, "assets/overlay-v2.4.6.css"), "utf8");
const configSource = fs.readFileSync(path.join(root, "assets/config.js"), "utf8");

test("all public pages define a restrictive CSP and no-referrer policy", () => {
  for (const html of [indexHtml, overlayHtml, tiktokHorizontalHtml, tiktokVerticalHtml]) {
    assert.match(html, /Content-Security-Policy/);
    assert.match(html, /default-src 'none'/);
    assert.match(html, /script-src 'self'/);
    assert.match(html, /connect-src https:\/\/\*\.firebaseio\.com https:\/\/\*\.firebasedatabase\.app/);
    assert.match(html, /object-src 'none'/);
    assert.match(html, /name="referrer" content="no-referrer"/);
    assert.match(html, /name="robots" content="noindex,nofollow,noarchive"/);
  }
});

test("renderers avoid HTML-string injection sinks", () => {
  const combined = `${scoreboardSource}\n${overlaySource}`;
  assert.doesNotMatch(combined, /\.innerHTML\s*=/);
  assert.doesNotMatch(combined, /document\.write/);
  assert.doesNotMatch(combined, /\beval\s*\(/);
  assert.match(combined, /textContent/);
  assert.match(combined, /replaceChildren/);
});

test("the browser fetch omits credentials, rejects redirects, and bounds response size", () => {
  assert.match(commonSource, /credentials:\s*"omit"/);
  assert.match(commonSource, /redirect:\s*"error"/);
  assert.match(commonSource, /referrerPolicy:\s*"no-referrer"/);
  assert.match(commonSource, /MAX_RESPONSE_BYTES/);
  assert.match(commonSource, /response\.body\?\.getReader/);
  assert.match(commonSource, /totalBytes > MAX_RESPONSE_BYTES/);
  assert.match(commonSource, /reader\.cancel/);
  assert.match(commonSource, /AbortController/);
  assert.match(commonSource, /\/public\.json/);
});

test("untrusted Firebase display data is normalized and race totals are capped", () => {
  const context = {
    window: {
      location: { search: "" },
      MK_SCORE_CONFIG: {},
      setTimeout,
      clearTimeout
    },
    URL,
    URLSearchParams,
    Intl,
    Date,
    console,
    fetch: async () => { throw new Error("not called"); },
    AbortController
  };
  vm.createContext(context);
  vm.runInContext(commonSource, context);
  const state = context.window.MKScore.normalizeTournament({
    name: "Final\u202ERound\n",
    maxRaces: 100000,
    teams: [
      { tag: "R", name: "Red\u202E", color: "not-a-color" },
      { tag: "B", name: "Blue", color: "#00A8FF" },
      { tag: "G", name: "Green", color: "#2ED573" },
      { tag: "Y", name: "Yellow", color: "#FFA502" }
    ],
    races: Array.from({ length: 100 }, (_, index) => ({
      number: index + 1,
      teamPoints: { R: Number.MAX_VALUE, B: -10, G: 1, Y: 2 }
    })),
    totals: { R: Number.MAX_VALUE, B: -10, G: 1, Y: 2 },
    revision: Number.MAX_VALUE
  });

  assert.equal(state.maxRaces, 20);
  assert.equal(state.races.length, 20);
  assert.doesNotMatch(state.name, /[\n\u202E]/);
  assert.doesNotMatch(state.teams[0].name, /\u202E/);
  assert.equal(state.teams[0].color, "#ff4655");
  assert.equal(state.teams[1].color, "#00a8ff");
  assert.equal(state.teams[2].color, "#ffa502");
  assert.equal(state.teams[3].color, "#2ed573");
  assert.equal(state.totals.R, 1_000_000);
  assert.equal(state.totals.B, -10);
  assert.equal(state.races[0].teamPoints.R, 1_000_000);
  assert.equal(state.revision, 1_000_000_000);
});

test("missing Firebase configuration fails closed unless demo mode is explicitly enabled", async () => {
  const statusEvents = [];
  const dataEvents = [];
  const context = {
    window: {
      location: { search: "?guild=123456789012345678&board=main" },
      MK_SCORE_CONFIG: {
        databaseURL: "",
        demoMode: false,
        pollIntervalMs: 60000
      },
      setTimeout,
      clearTimeout
    },
    URL,
    URLSearchParams,
    Intl,
    Date,
    console,
    fetch: async () => { throw new Error("fetch must not be called"); },
    AbortController
  };
  vm.createContext(context);
  vm.runInContext(commonSource, context);
  const client = context.window.MKScore.createTournamentClient({
    onData: (data, meta) => dataEvents.push({ data, meta }),
    onStatus: (status, message) => statusEvents.push({ status, message })
  });

  await new Promise(resolve => setTimeout(resolve, 20));
  client.stop();

  assert.equal(dataEvents.length, 1);
  assert.equal(dataEvents[0].data, null);
  assert.equal(dataEvents[0].meta.demo, false);
  assert.equal(statusEvents.at(-1).status, "error");
  assert.match(statusEvents.at(-1).message, /configuration unavailable/i);
  assert.doesNotMatch(statusEvents.at(-1).message, /demo/i);
});

test("the public configuration template contains no administrative credential material", () => {
  assert.doesNotMatch(configSource, /BEGIN PRIVATE KEY/);
  assert.doesNotMatch(configSource, /private_key_id\s*:/i);
  assert.doesNotMatch(configSource, /DISCORD_TOKEN\s*=/);
  assert.doesNotMatch(configSource, /FIREBASE_SERVICE_ACCOUNT_BASE64\s*=/);
  assert.match(configSource, /demoMode:\s*false/);
});


test("OBS overlay keeps fixed setup order and renders each tag only once", () => {
  assert.match(overlaySource, /for \(const configuredTeam of state\.teams\)/);
  assert.match(overlaySource, /standingByTag/);
  assert.doesNotMatch(overlaySource, /createElement\("div", "overlay-name"/);
  assert.doesNotMatch(overlaySource, /for \(const team of standings\)/);
});


test("TikTok overlay variants preserve security and declare dedicated layout classes", () => {
  assert.match(tiktokHorizontalHtml, /overlay-tiktok-horizontal/);
  assert.match(tiktokVerticalHtml, /overlay-tiktok-vertical/);
  assert.match(stylesSource, /body\.overlay-tiktok-horizontal \.overlay-shell/);
  assert.match(stylesSource, /body\.overlay-tiktok-vertical \.overlay-shell/);
  const overlayCss = stylesSource.split("/* OBS overlay")[1] || "";
  assert.doesNotMatch(overlayCss, /grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  const twoByTwoMatches = overlayCss.match(/grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/g) || [];
  assert.ok(twoByTwoMatches.length >= 2);
});


test("OBS overlays use compact race markers instead of title and race text", () => {
  for (const html of [overlayHtml, tiktokHorizontalHtml, tiktokVerticalHtml]) {
    assert.match(html, /id="overlay-progress-markers"/);
    assert.doesNotMatch(html, /id="overlay-title"/);
    assert.doesNotMatch(html, /id="overlay-round"/);
    assert.doesNotMatch(html, /Mario Kart World - Team Knockout/);
    assert.doesNotMatch(html, /Race 0 \/ 5/);
  }
  assert.match(overlaySource, /overlay-race-marker/);
  assert.match(overlaySource, /raceNumber <= completed/);
  assert.match(stylesSource, /\.overlay-progress \{/);
  assert.match(stylesSource, /\.overlay-race-marker\.completed/);
});


test("standard and vertical OBS stay 2 x 2 while TikTok Horizontal is one four-team row", () => {
  assert.match(overlayStylesSource, /body\.overlay-page \.overlay-teams\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)[\s\S]*?grid-template-rows:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(overlayStylesSource, /body\.overlay-tiktok-horizontal \.overlay-teams\s*\{[\s\S]*?grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)[\s\S]*?grid-template-rows:\s*minmax\(0, 1fr\)/);
  assert.match(tiktokHorizontalHtml, /class="overlay-page overlay-tiktok-horizontal"/);
  assert.match(tiktokVerticalHtml, /class="overlay-page overlay-tiktok-vertical"/);
});

test("channel URLs derive a deterministic board while legacy board URLs remain readable", () => {
  const context = {
    window: {
      location: { search: "?guild=123456789012345678&channel=111111111111111111" },
      MK_SCORE_CONFIG: {}, setTimeout, clearTimeout
    },
    URL, URLSearchParams, Intl, Date, console,
    fetch: async () => { throw new Error("not called"); }, AbortController
  };
  vm.createContext(context);
  vm.runInContext(commonSource, context);
  assert.deepEqual(
    JSON.parse(JSON.stringify(context.window.MKScore.getBoardLocation())),
    { guildId: "123456789012345678", channelId: "111111111111111111", boardId: "c111111111111111111" }
  );
});

test("live client uses Firebase EventSource signals plus polling fallback", () => {
  assert.match(commonSource, /new window\.EventSource\(endpoint/);
  assert.match(commonSource, /\["put", "patch"\]/);
  assert.match(commonSource, /queueLiveReload/);
  assert.match(commonSource, /window\.setTimeout\(scheduleNext, pollInterval\)/);
  assert.match(commonSource, /cache:\s*"no-store"/);
});

test("site and overlays expose exact final tiebreak explanations", () => {
  assert.match(indexHtml, /id="tiebreak-detail"/);
  for (const html of [overlayHtml, tiktokHorizontalHtml, tiktokVerticalHtml]) {
    assert.match(html, /id="overlay-tiebreak"/);
  }
  assert.match(scoreboardSource, /getTiebreakDetails/);
  assert.match(overlaySource, /getTiebreakDetails/);
  assert.match(commonSource, /place finishes decided the order/);
});

test("public website renders each team tag once instead of duplicating name and tag", () => {
  assert.doesNotMatch(scoreboardSource, /team\.name/);
  assert.match(scoreboardSource, /createElement\("div", "team-tag", team\.tag\)/);
  assert.match(scoreboardSource, /createElement\("span", "table-tag", team\.tag\)/);
});

test("responsive site and v2.4.6 versioned assets are present", () => {
  assert.match(stylesSource, /grid-template-columns:\s*repeat\(4, minmax/);
  assert.match(stylesSource, /grid-auto-flow:\s*column/);
  assert.match(stylesSource, /@media \(max-width: 480px\)/);
  assert.match(stylesSource, /-webkit-overflow-scrolling: touch/);
  assert.match(indexHtml, /\?v=2\.4\.6/);
  for (const html of [overlayHtml, tiktokHorizontalHtml, tiktokVerticalHtml]) {
    assert.match(html, /overlay-v2\.4\.6/);
  }
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  assert.equal(packageJson.version, "2.4.6");
});

test("public scoreboard keeps configured team order instead of standings order", () => {
  assert.match(scoreboardSource, /configuredLaneOrder = Array\.isArray\(state\.teams\)/);
  assert.match(scoreboardSource, /for \(const configuredTeam of configuredLaneOrder\)/);
  assert.match(scoreboardSource, /standingByTag = new Map\(standings\.map/);
  assert.doesNotMatch(scoreboardSource, /for \(const team of standings\) \{\n\s+const article = createElement\("article", "team-card"\)/);
});

test("numeric team tags are rejected by the public normalizer", () => {
  assert.match(commonSource, /\^\[A-Z\]\[A-Z_-\]\{0,7\}\$/);
  assert.doesNotMatch(commonSource, /`T\$\{index \+ 1\}`/);
});

test("tiebreak detail reports the exact placement criterion that resolves a point tie", () => {
  const context = {
    window: { location: { search: "" }, MK_SCORE_CONFIG: {}, setTimeout, clearTimeout },
    URL, URLSearchParams, Intl, Date, console,
    fetch: async () => { throw new Error("not called"); }, AbortController
  };
  vm.createContext(context);
  vm.runInContext(commonSource, context);
  const state = context.window.MKScore.normalizeTournament({
    status: "finished",
    maxRaces: 1,
    teams: [
      { tag: "AA", name: "AA", color: "#ff4655" },
      { tag: "BB", name: "BB", color: "#00a8ff" },
      { tag: "CC", name: "CC", color: "#ffa502" },
      { tag: "DD", name: "DD", color: "#2ed573" }
    ],
    races: [{
      number: 1,
      positions: [
        "AA", "BB", "BB", "BB", "BB", "BB", "BB",
        "AA", "AA", "AA", "AA", "AA",
        "CC", "CC", "CC", "CC", "CC", "CC",
        "DD", "DD", "DD", "DD", "DD", "DD"
      ],
      teamPoints: { AA: 100, BB: 100, CC: 50, DD: 40 }
    }],
    totals: { AA: 100, BB: 100, CC: 50, DD: 40 }
  });
  const standings = context.window.MKScore.getStandings(state);
  const details = context.window.MKScore.getTiebreakDetails(state, standings);
  assert.equal(details.length, 1);
  assert.match(details[0].text, /1st-place finishes decided the order/);
  assert.match(details[0].text, /AA 1, BB 0/);
});
