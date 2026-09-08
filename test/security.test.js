"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
const overlayHtml = fs.readFileSync(path.join(root, "overlay.html"), "utf8");
const commonSource = fs.readFileSync(path.join(root, "assets/common.js"), "utf8");
const scoreboardSource = fs.readFileSync(path.join(root, "assets/scoreboard.js"), "utf8");
const overlaySource = fs.readFileSync(path.join(root, "assets/overlay.js"), "utf8");
const configSource = fs.readFileSync(path.join(root, "assets/config.js"), "utf8");

test("both public pages define a restrictive CSP and no-referrer policy", () => {
  for (const html of [indexHtml, overlayHtml]) {
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
