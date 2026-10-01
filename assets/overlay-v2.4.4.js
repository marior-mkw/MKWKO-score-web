/* MKWKO OBS overlay release 2.4.4 - self-contained recovery bundle.
 * Includes the public read-only client, layout helpers and renderer.
 * Does NOT require common.js, overlay.js or overlay-presentation.js.
 * Only the existing assets/config.js supplies the public Firebase URL.
 * No podium highlighting. No credentials. No database writes.
 */
(() => {
  "use strict";
  let scoreApi;
(() => {
  "use strict";

  const DEFAULT_SCORING_SYSTEM = "MKCENTRAL";
  const TEAM_SIZE = 6;
  const TOTAL_PLACEMENTS = 24;
  const MAX_RACES = 20;
  const MAX_PUBLIC_SCORE = 1_000_000;
  const MAX_PUBLIC_REVISION = 1_000_000_000;
  const MAX_PUBLIC_TIMESTAMP = 4_102_444_800_000;
  const MAX_RESPONSE_BYTES = 512 * 1024;
  const FETCH_TIMEOUT_MS = 10000;
  const CONTROL_OR_BIDI_PATTERN = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060\u2066-\u2069\uFEFF]/gu;

  const SCORING_PRESETS = Object.freeze({
    MKCENTRAL: Object.freeze({
      key: "MKCENTRAL",
      label: "MKCentral",
      points: Object.freeze([
        30, 26, 23, 21, 20, 19, 18, 17, 16, 15, 14, 13,
        12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1
      ]),
      total: 310
    }),
    INGAME: Object.freeze({
      key: "INGAME",
      label: "Ingame",
      points: Object.freeze([
        50, 40, 35, 30, 20, 18, 16, 14, 12, 10, 9, 8,
        7, 6, 5, 4, 3, 3, 2, 2, 1, 1, 1, 1
      ]),
      total: 298
    })
  });

  const POINTS = SCORING_PRESETS[DEFAULT_SCORING_SYSTEM].points;
  const DEFAULT_COLORS = Object.freeze([
    "#ff4655",
    "#00a8ff",
    "#ffa502",
    "#2ed573"
  ]);

  const DEMO_STATE = Object.freeze({
    name: "Mario Kart World - Team Knockout",
    status: "active",
    maxRaces: 5,
    scoringSystem: "MKCENTRAL",
    updatedAt: Date.now(),
    revision: 1,
    guildId: "demo-guild",
    boardId: "demo",
    teams: [
      { tag: "R", name: "Red", color: "#ff4655" },
      { tag: "B", name: "Blue", color: "#00a8ff" },
      { tag: "Y", name: "Yellow", color: "#ffa502" },
      { tag: "G", name: "Green", color: "#2ed573" }
    ],
    races: [
      {
        number: 1,
        positions: [
          "R", "B", "Y", "G", "R", "B", "Y", "G",
          "R", "B", "Y", "G", "R", "B", "Y", "G",
          "R", "B", "Y", "G", "R", "B", "Y", "G"
        ],
        teamPoints: { R: 90, B: 81, Y: 73, G: 66 }
      },
      {
        number: 2,
        positions: [
          "B", "R", "Y", "G", "B", "R", "Y", "G",
          "B", "R", "Y", "G", "B", "R", "Y", "G",
          "B", "R", "Y", "G", "B", "R", "Y", "G"
        ],
        teamPoints: { R: 81, B: 90, Y: 73, G: 66 }
      }
    ],
    totals: { R: 171, B: 171, Y: 146, G: 132 }
  });

  function safeNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function safeInteger(value, fallback, min, max) {
    const number = Math.trunc(safeNumber(value, fallback));
    return Math.min(max, Math.max(min, number));
  }

  function clampNumber(value, fallback, min, max) {
    return Math.min(max, Math.max(min, safeNumber(value, fallback)));
  }

  function sanitizeDisplayText(value, maxLength, fallback) {
    const text = String(value ?? "")
      .normalize("NFKC")
      .replace(CONTROL_OR_BIDI_PATTERN, "")
      .trim();
    return (text || fallback).slice(0, maxLength);
  }

  function sanitizeColor(value, fallback) {
    const color = String(value || "");
    return /^#[0-9a-f]{6}$/i.test(color) ? color.toLowerCase() : fallback;
  }

  function normalizeScoringSystem(value = DEFAULT_SCORING_SYSTEM) {
    const normalized = String(value || DEFAULT_SCORING_SYSTEM)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
    return SCORING_PRESETS[normalized] ? normalized : DEFAULT_SCORING_SYSTEM;
  }

  function getScoringPreset(value = DEFAULT_SCORING_SYSTEM) {
    return SCORING_PRESETS[normalizeScoringSystem(value)];
  }

  function normalizeTournament(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;

    const maxRaces = safeInteger(raw.maxRaces, 5, 1, MAX_RACES);
    const teams = Array.isArray(raw.teams)
      ? raw.teams.slice(0, 4).map((team, index) => {
          const rawTag = String(team?.tag || "").toUpperCase();
          return {
            tag: /^[A-Z][A-Z_-]{0,7}$/.test(rawTag) ? rawTag : ["AA", "BB", "CC", "DD"][index],
            name: sanitizeDisplayText(team?.name, 32, `Team ${index + 1}`),
            color: DEFAULT_COLORS[index]
          };
        })
      : [];

    const validTags = new Set(teams.map(team => team.tag));
    const races = Array.isArray(raw.races)
      ? raw.races.filter(Boolean).slice(0, maxRaces).map((race, index) => ({
          number: safeInteger(race?.number, index + 1, 1, MAX_RACES),
          positions: Array.isArray(race?.positions)
            ? race.positions.slice(0, TOTAL_PLACEMENTS).map(value => {
                const tag = String(value || "").toUpperCase();
                return validTags.has(tag) ? tag : "";
              })
            : [],
          teamPoints: Object.fromEntries(
            teams.map(team => [
              team.tag,
              clampNumber(race?.teamPoints?.[team.tag], 0, 0, MAX_PUBLIC_SCORE)
            ])
          )
        }))
      : [];

    const totals = Object.fromEntries(
      teams.map(team => [
        team.tag,
        clampNumber(raw?.totals?.[team.tag], 0, -MAX_PUBLIC_SCORE, MAX_PUBLIC_SCORE)
      ])
    );
    const scoringSystem = normalizeScoringSystem(raw.scoringSystem);
    const scoringPreset = getScoringPreset(scoringSystem);

    return {
      schemaVersion: safeInteger(raw.schemaVersion, 2, 1, 100),
      guildId: String(raw.guildId || "").slice(0, 25),
      channelId: String(raw.channelId || "").slice(0, 25),
      boardId: sanitizeDisplayText(raw.boardId, 32, ""),
      name: sanitizeDisplayText(
        raw.name,
        80,
        "Mario Kart World - Team Knockout"
      ),
      status: raw.status === "finished" ? "finished" : "active",
      maxRaces,
      scoringSystem,
      scoringLabel: scoringPreset.label,
      pointsPerPlacement: scoringPreset.points,
      pointsPerRace: scoringPreset.total,
      updatedAt: clampNumber(
        raw.updatedAt,
        Date.now(),
        0,
        MAX_PUBLIC_TIMESTAMP
      ),
      revision: safeInteger(
        raw.revision,
        0,
        0,
        MAX_PUBLIC_REVISION
      ),
      teams,
      races,
      totals
    };
  }

  function hasCompletePlacementData(races, teams) {
    if (!Array.isArray(races) || races.length === 0) return false;
    const validTags = new Set(teams.map(team => team.tag));

    return races.every(race => {
      if (!Array.isArray(race?.positions) || race.positions.length !== TOTAL_PLACEMENTS) {
        return false;
      }
      const counts = Object.fromEntries(teams.map(team => [team.tag, 0]));
      for (const rawTag of race.positions) {
        const tag = String(rawTag || "").toUpperCase();
        if (!validTags.has(tag)) return false;
        counts[tag] += 1;
      }
      return teams.every(team => counts[team.tag] === TEAM_SIZE);
    });
  }

  function calculatePlacementCounts(races, teams) {
    const counts = Object.fromEntries(
      teams.map(team => [team.tag, Array(TOTAL_PLACEMENTS).fill(0)])
    );
    for (const race of races) {
      race.positions.forEach((rawTag, index) => {
        const tag = String(rawTag || "").toUpperCase();
        if (counts[tag]) counts[tag][index] += 1;
      });
    }
    return counts;
  }

  function comparePlacementCounts(a, b) {
    for (let index = 0; index < TOTAL_PLACEMENTS; index += 1) {
      const difference = safeNumber(b[index]) - safeNumber(a[index]);
      if (difference !== 0) return difference;
    }
    return 0;
  }

  function getStandings(state) {
    const finished = state.races.length >= state.maxRaces || state.status === "finished";
    const tiebreakAvailable = finished && hasCompletePlacementData(state.races, state.teams);
    const placementCounts = tiebreakAvailable
      ? calculatePlacementCounts(state.races, state.teams)
      : Object.fromEntries(
          state.teams.map(team => [team.tag, Array(TOTAL_PLACEMENTS).fill(0)])
        );

    const sorted = state.teams
      .map((team, index) => ({
        ...team,
        originalIndex: index,
        total: safeNumber(state.totals?.[team.tag], 0),
        placementCounts: placementCounts[team.tag],
        tiebreakAvailable
      }))
      .sort((a, b) => {
        const pointsDifference = b.total - a.total;
        if (pointsDifference !== 0) return pointsDifference;
        if (tiebreakAvailable) {
          const placementDifference = comparePlacementCounts(
            a.placementCounts,
            b.placementCounts
          );
          if (placementDifference !== 0) return placementDifference;
        }
        return a.originalIndex - b.originalIndex;
      });

    let lastRank = 0;
    return sorted.map((team, index, array) => {
      const previous = array[index - 1];
      const sharesRank = index > 0
        && team.total === previous.total
        && (!tiebreakAvailable
          || comparePlacementCounts(team.placementCounts, previous.placementCounts) === 0);
      if (!sharesRank) lastRank = index + 1;
      return { ...team, rank: lastRank };
    });
  }

  function ordinal(value) {
    const mod100 = value % 100;
    if (mod100 >= 11 && mod100 <= 13) return `${value}th`;
    if (value % 10 === 1) return `${value}st`;
    if (value % 10 === 2) return `${value}nd`;
    if (value % 10 === 3) return `${value}rd`;
    return `${value}th`;
  }

  function getTiebreakDetails(state, standings = getStandings(state)) {
    const finished = state.races.length >= state.maxRaces || state.status === "finished";
    if (!finished) return [];

    const details = [];
    for (let index = 1; index < standings.length; index += 1) {
      const higher = standings[index - 1];
      const lower = standings[index];
      if (higher.total !== lower.total) continue;

      const total = higher.total;
      const tags = [higher.tag, lower.tag];
      if (!higher.tiebreakAvailable || !lower.tiebreakAvailable) {
        details.push({
          total, tags, resolved: false, placement: null,
          text: `${tags.join(" / ")} tied on ${total} pts; placement countback is unavailable, so their tie remains.`
        });
        continue;
      }

      let decidingIndex = -1;
      for (let placementIndex = 0; placementIndex < TOTAL_PLACEMENTS; placementIndex += 1) {
        const a = safeNumber(higher.placementCounts?.[placementIndex], 0);
        const b = safeNumber(lower.placementCounts?.[placementIndex], 0);
        if (a !== b) {
          decidingIndex = placementIndex;
          break;
        }
      }

      if (decidingIndex < 0) {
        details.push({
          total, tags, resolved: false, placement: null,
          text: `${tags.join(" / ")} tied on ${total} pts and have identical countback through 24th place; their tie remains.`
        });
        continue;
      }

      const criterion = ordinal(decidingIndex + 1);
      const counts = [
        { tag: higher.tag, count: safeNumber(higher.placementCounts?.[decidingIndex], 0) },
        { tag: lower.tag, count: safeNumber(lower.placementCounts?.[decidingIndex], 0) }
      ];
      const prior = decidingIndex === 0
        ? ""
        : ` after equal countback through ${ordinal(decidingIndex)} place`;
      details.push({
        total, tags, resolved: true, placement: decidingIndex + 1, counts,
        text: `${tags.join(" / ")} tied on ${total} pts;${prior} ${criterion}-place finishes decided the order: ${counts.map(item => `${item.tag} ${item.count}`).join(", ")}.`
      });
    }
    return details;
  }

  function normalizeBoardId(value) {
    const boardId = String(value || "").trim().toLowerCase();
    return /^[a-z0-9][a-z0-9_-]{0,31}$/.test(boardId) ? boardId : "";
  }

  function normalizeGuildId(value) {
    const guildId = String(value || "").trim();
    return /^\d{5,25}$/.test(guildId) ? guildId : "";
  }

  function normalizeChannelId(value) {
    const channelId = String(value || "").trim();
    return /^\d{5,25}$/.test(channelId) ? channelId : "";
  }

  function getBoardLocation() {
    const params = new URLSearchParams(window.location.search);
    const guildId = normalizeGuildId(
      params.get("guild") || params.get("g") || window.MK_SCORE_CONFIG?.defaultGuildId
    );
    const channelId = normalizeChannelId(params.get("channel") || params.get("ch"));
    const explicitBoardId = normalizeBoardId(
      params.get("board") || params.get("b") || window.MK_SCORE_CONFIG?.defaultBoardId
    );
    const boardId = channelId ? normalizeBoardId(`c${channelId}`) : explicitBoardId;
    return guildId && boardId ? { guildId, channelId, boardId } : null;
  }

  function formatDate(timestamp) {
    if (!timestamp) return "Not updated";
    try {
      return new Intl.DateTimeFormat("en-US", {
        dateStyle: "short",
        timeStyle: "medium"
      }).format(new Date(timestamp));
    } catch {
      return "Not updated";
    }
  }

  function getConfiguredDatabaseUrl() {
    const raw = String(window.MK_SCORE_CONFIG?.databaseURL || "").trim();
    if (raw.includes("YOUR-PROJECT")) return "";
    try {
      const url = new URL(raw);
      if (url.protocol !== "https:") return "";
      if (!/(?:^|\.)(?:firebaseio\.com|firebasedatabase\.app)$/i.test(url.hostname)) {
        return "";
      }
      if (url.username || url.password || url.search || url.hash) return "";
      if (url.pathname !== "/" && url.pathname !== "") return "";
      return `${url.protocol}//${url.host}`;
    } catch {
      return "";
    }
  }

  async function readResponseTextWithLimit(response) {
    const declaredLength = Number(response.headers?.get?.("content-length") || 0);
    if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) {
      throw new Error("Scoreboard response is too large");
    }

    const reader = response.body?.getReader?.();
    if (!reader) {
      const text = await response.text();
      const byteLength = typeof TextEncoder === "function"
        ? new TextEncoder().encode(text).byteLength
        : text.length;
      if (byteLength > MAX_RESPONSE_BYTES) {
        throw new Error("Scoreboard response is too large");
      }
      return text;
    }

    const chunks = [];
    let totalBytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = value instanceof Uint8Array ? value : new Uint8Array(value || []);
      totalBytes += chunk.byteLength;
      if (totalBytes > MAX_RESPONSE_BYTES) {
        await reader.cancel().catch(() => undefined);
        throw new Error("Scoreboard response is too large");
      }
      chunks.push(chunk);
    }

    const body = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return new TextDecoder("utf-8", { fatal: false }).decode(body);
  }

  function createTournamentClient({ onData, onStatus }) {
    const databaseUrl = getConfiguredDatabaseUrl();
    const location = getBoardLocation();
    const demoMode = window.MK_SCORE_CONFIG?.demoMode === true;
    const pollInterval = safeInteger(
      window.MK_SCORE_CONFIG?.pollIntervalMs,
      5000,
      2000,
      60000
    );

    let timer = null;
    let stopped = false;
    let inFlight = false;
    let lastSerialized = "";
    let eventSource = null;
    let liveConnected = false;
    let liveReloadTimer = null;

    const meta = {
      demo: false,
      guildId: location?.guildId || "",
      channelId: location?.channelId || "",
      boardId: location?.boardId || ""
    };

    const endpoint = databaseUrl && location
      ? `${databaseUrl}/guilds/${encodeURIComponent(location.guildId)}/boards/${encodeURIComponent(location.boardId)}/public.json`
      : "";

    function statusOnline() {
      const label = location?.channelId ? `channel ${location.channelId}` : location?.boardId;
      onStatus?.("online", liveConnected ? `Live · ${label}` : `Connected · ${label}`);
    }

    async function load() {
      if (stopped || inFlight) return;
      inFlight = true;
      try {
        if (!databaseUrl) {
          if (demoMode) {
            onStatus?.("demo", "Demo mode is explicitly enabled");
            onData?.(normalizeTournament(DEMO_STATE), {
              demo: true,
              guildId: "demo-guild",
              channelId: "",
              boardId: "demo"
            });
          } else {
            onData?.(null, meta);
            onStatus?.(
              "error",
              "Scoreboard configuration unavailable. Contact the bot operator."
            );
          }
          return;
        }

        if (!location) {
          onData?.(null, meta);
          onStatus?.(
            "empty",
            "No channel scoreboard selected. Use the exact URL returned by /mk overlay."
          );
          return;
        }

        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        let response;
        try {
          response = await fetch(endpoint, {
            cache: "no-store",
            credentials: "omit",
            redirect: "error",
            referrerPolicy: "no-referrer",
            signal: controller.signal,
            headers: { "Cache-Control": "no-cache" }
          });
        } finally {
          window.clearTimeout(timeout);
        }

        if (!response.ok) throw new Error("Scoreboard request failed");
        const body = await readResponseTextWithLimit(response);

        let raw;
        try {
          raw = JSON.parse(body);
        } catch {
          throw new Error("Scoreboard response is invalid");
        }
        const normalized = normalizeTournament(raw);

        if (!normalized) {
          lastSerialized = "";
          onData?.(null, meta);
          onStatus?.("empty", "Waiting for the next match in this Discord channel. Start one with /mk setup.");
          return;
        }

        const serialized = JSON.stringify(normalized);
        if (serialized !== lastSerialized) {
          lastSerialized = serialized;
          onData?.(normalized, meta);
        }
        statusOnline();
      } catch {
        onStatus?.("error", "Scoreboard temporarily unavailable; retrying automatically");
      } finally {
        inFlight = false;
      }
    }

    function queueLiveReload() {
      if (stopped || liveReloadTimer) return;
      liveReloadTimer = window.setTimeout(() => {
        liveReloadTimer = null;
        void load();
      }, 50);
    }

    function startLiveStream() {
      if (!endpoint || typeof window.EventSource !== "function") return;
      try {
        eventSource = new window.EventSource(endpoint, { withCredentials: false });
        eventSource.addEventListener("open", () => {
          liveConnected = true;
          statusOnline();
        });
        for (const eventName of ["put", "patch"]) {
          eventSource.addEventListener(eventName, queueLiveReload);
        }
        eventSource.addEventListener("cancel", () => {
          liveConnected = false;
          onStatus?.("error", "Live scoreboard stream was cancelled; polling fallback remains active");
        });
        eventSource.addEventListener("auth_revoked", () => {
          liveConnected = false;
          onStatus?.("error", "Live scoreboard authorization was revoked; polling fallback remains active");
        });
        eventSource.addEventListener("error", () => {
          liveConnected = false;
        });
      } catch {
        liveConnected = false;
      }
    }

    async function scheduleNext() {
      await load();
      if (!stopped) timer = window.setTimeout(scheduleNext, pollInterval);
    }

    startLiveStream();
    void scheduleNext();

    return {
      stop() {
        stopped = true;
        if (timer) window.clearTimeout(timer);
        if (liveReloadTimer) window.clearTimeout(liveReloadTimer);
        eventSource?.close?.();
      },
      reload: load
    };
  }

  scoreApi = Object.freeze({
    POINTS,
    SCORING_PRESETS,
    DEFAULT_SCORING_SYSTEM,
    getScoringPreset,
    DEFAULT_COLORS,
    normalizeTournament,
    getStandings,
    getTiebreakDetails,
    getBoardLocation,
    formatDate,
    createTournamentClient
  });
})();

  const presentation = (() => {
  const VERSION = "2.4.4";
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function ordinal(rank) {
    if (!Number.isInteger(rank) || rank < 1) return "\u2014";
    const lastTwo = rank % 100;
    const suffix = lastTwo >= 11 && lastTwo <= 13 ? "th"
      : ({ 1: "st", 2: "nd", 3: "rd" }[rank % 10] || "th");
    return `${rank}${suffix}`;
  }

  function compactTiebreak(detail) {
    const tags = Array.isArray(detail?.tags) ? detail.tags : [];
    if (detail?.resolved && Array.isArray(detail.counts)) {
      const values = detail.counts.map(item => item.count).join("\u2013");
      return `${tags.join(" > ")} \u00b7 ${detail.total} PTS tied \u00b7 ${ordinal(detail.placement)}-place finishes ${values}`;
    }
    const cause = /unavailable/.test(String(detail?.text))
      ? "countback unavailable" : "identical countback";
    return `${tags.join(" = ")} \u00b7 ${detail?.total ?? 0} PTS \u00b7 ${cause}; tie remains`;
  }

  function getFrame(width, height, variant = "standard") {
    const w = Math.max(1, Number(width) || 1);
    const h = Math.max(1, Number(height) || 1);
    const compact = h < 600 || w / h > 2.2;
    const gutter = compact ? clamp(w * 0.0125, 4, 18) : clamp(w * 0.025, 16, 40);
    let left = Math.min(gutter, w / 8);
    let top = Math.min(gutter, h / 8);
    let panelWidth = w - left * 2;
    let panelHeight = h - top * 2;
    if (!compact) {
      const portrait = variant === "vertical" || w < h;
      // Full-canvas legacy sources retain a top-left panel, not a stretched screen-size box.
      panelWidth = Math.min(w - left * 2, w * (portrait ? 0.9 : 0.52));
      panelHeight = Math.min(h - top * 2, panelWidth * (portrait ? 0.4 : 0.29));
      if (portrait) top = Math.min(h * 0.08, Math.max(gutter, h - panelHeight - gutter));
    }
    return { left, top, width: Math.max(1, panelWidth), height: Math.max(1, panelHeight), compact };
  }

  function getTypography(width, height, raceCount = 5, tiebreakRows = 0, teams = []) {
    const w = Math.max(1, width);
    const h = Math.max(1, height);
    const scale = Math.min(w / 936, h / 246);
    const markerGap = clamp(5 * scale, 2, 9);
    const markerCount = clamp(Math.trunc(raceCount) || 5, 1, 20);
    const marker = Math.max(1, Math.min(clamp(10 * scale, 5, 16), (w - 24 - markerGap * (markerCount - 1)) / markerCount));
    const header = Math.max(marker + 6 * scale, 12 * scale);
    const tieFont = clamp(13 * scale, 7, 24);
    const lineBudget = tiebreakRows ? tiebreakRows * (w < 620 ? 2.35 : 1.4) : 0;
    const tieHeight = tiebreakRows ? Math.min(h * 0.32, lineBudget * tieFont + 10 * scale) : 0;
    const rowHeight = Math.max(1, (h - header - tieHeight) / 2);
    const padding = Math.max(1, Math.min(14 * scale, rowHeight * 0.13));
    const cardWidth = w / 2;
    const reserve = Math.min(cardWidth * 0.18, Math.max(8, cardWidth * 0.12));
    const contentWidth = Math.max(1, cardWidth - padding * 2 - reserve);
    const longestTag = Math.max(2, ...teams.map(team => String(team.tag).length));
    const longestTotal = Math.max(1, ...teams.map(team => String(team.total ?? 0).length));
    const maxByTag = contentWidth / (2.15 + 0.79 * longestTag + 0.28);
    const maxByTotal = contentWidth / (0.68 * longestTotal + 0.9);
    const maxByHeight = (rowHeight - padding * 2) / 2.70;
    const primary = Math.max(1, Math.min(maxByTag, maxByTotal, maxByHeight));
    return {
      primary, pts: Math.max(1, primary * 0.31), tieFont, marker, markerGap, header, tieHeight,
      padding, reserve, gap: primary * 0.17,
      stroke: clamp(primary * 0.03, 0.5, 2), radius: clamp(22 * scale, 8, 30),
      lane: clamp(4 * scale, 2, 6),
      small: primary < 20
    };
  }

  return Object.freeze({ VERSION, ordinal, compactTiebreak, getFrame, getTypography });
  })();
(() => {
  "use strict";

  const boardEl = document.querySelector("#overlay-board");
  const progressEl = document.querySelector("#overlay-progress-markers");
  const teamsEl = document.querySelector("#overlay-teams");
  const tiebreakEl = document.querySelector("#overlay-tiebreak");
  const messageEl = document.querySelector("#overlay-message");
  const shellEl = document.querySelector(".overlay-shell");
  if (![boardEl, progressEl, teamsEl, messageEl, shellEl].every(Boolean)) {
    console.error("MKWKO overlay 2.4.4: HTML entry point does not match this bundle.");
    return;
  }
  let currentState = null;
  let currentStandings = [];
  let tiebreakRows = 0;
  let previousTotals = new Map();
  let layoutFrame = 0;

  function createElement(tagName, className = "", text = "") {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text !== "") element.textContent = String(text);
    return element;
  }

  document.documentElement.dataset.overlayVersion = presentation.VERSION;

  function applyLayout() {
    layoutFrame = 0;
    const variant = document.body.classList.contains("overlay-tiktok-vertical") ? "vertical"
      : document.body.classList.contains("overlay-tiktok-horizontal") ? "horizontal" : "standard";
    const frame = presentation.getFrame(window.innerWidth, window.innerHeight, variant);
    for (const [key, value] of Object.entries({ left: frame.left, top: frame.top, width: frame.width, height: frame.height })) {
      shellEl.style.setProperty(`--frame-${key}`, `${value.toFixed(2)}px`);
    }
    document.documentElement.dataset.overlayCanvas = frame.compact ? "compact" : "full";
    if (!currentState) return;

    const metrics = presentation.getTypography(frame.width - 2, frame.height - 2,
      currentState.maxRaces, tiebreakRows, currentStandings);
    const variables = {
      "primary-size": metrics.primary,
      "pts-size": metrics.pts,
      "text-stroke": metrics.stroke,
      "marker-size": metrics.marker,
      "marker-gap": metrics.markerGap,
      "progress-height": metrics.header,
      "tie-height": metrics.tieHeight,
      "tie-size": metrics.tieFont,
      "card-padding": metrics.padding,
      "side-space": metrics.reserve,
      "text-gap": metrics.gap,
      "overlay-radius": metrics.radius,
      "lane-size": metrics.lane
    };
    for (const [key, value] of Object.entries(variables)) {
      boardEl.style.setProperty(`--${key}`, `${value.toFixed(2)}px`);
    }

    // Measure actual, unshrunk DOM runs instead of hiding the final glyph.
    // Fonts vary by host OS. A single shared font size is kept across all teams,
    // ranks, TAGs and scores; PTS stays smaller. No text is truncated.
    function setTypeSize(size) {
      const stroke = Math.max(0.18, Math.min(2, size * 0.03));
      const inset = Math.max(0.4, stroke + size * 0.065);
      boardEl.style.setProperty("--primary-size", `${size.toFixed(3)}px`);
      boardEl.style.setProperty("--pts-size", `${(size * 0.31).toFixed(3)}px`);
      boardEl.style.setProperty("--text-stroke", `${stroke.toFixed(3)}px`);
      boardEl.style.setProperty("--text-gap", `${(size * 0.17).toFixed(3)}px`);
      boardEl.style.setProperty("--glyph-inset", `${inset.toFixed(3)}px`);
      boardEl.style.setProperty("--ink-block", `${Math.max(0.4, stroke + size * 0.07).toFixed(3)}px`);
    }

    function completeTextFits() {
      for (const card of teamsEl.children) {
        const cardBox = card.getBoundingClientRect();
        const style = window.getComputedStyle(card);
        const topLimit = cardBox.top + (parseFloat(style.paddingTop) || 0);
        const bottomLimit = cardBox.bottom - (parseFloat(style.paddingBottom) || 0);
        const rows = card.querySelectorAll(".overlay-team-top, .overlay-points");
        for (const row of rows) {
          const box = row.getBoundingClientRect();
          // Use fractional bounding boxes; integer scrollWidth alone misses
          // small overflows and italic/outlined glyph overhangs.
          if (box.top < topLimit - 0.05 || box.bottom > bottomLimit + 0.05) return false;
          for (const child of row.children) {
            const childBox = child.getBoundingClientRect();
            if (childBox.left < box.left - 0.05 || childBox.right > box.right - 0.20) return false;
            if (childBox.top < topLimit - 0.05 || childBox.bottom > bottomLimit + 0.05) return false;
          }
        }
      }
      return true;
    }

    let fittedSize = metrics.primary;
    setTypeSize(fittedSize);
    if (!completeTextFits()) {
      let low = 0.1;
      let high = fittedSize;
      // Bounded binary search is stable across changing TAGs and viewports.
      for (let attempt = 0; attempt < 13; attempt += 1) {
        const candidate = (low + high) / 2;
        setTypeSize(candidate);
        if (completeTextFits()) low = candidate;
        else high = candidate;
      }
      fittedSize = Math.max(0.1, low * 0.985);
      setTypeSize(fittedSize);
    }
    boardEl.dataset.smallViewport = String(fittedSize < 20);
    boardEl.dataset.textFit = completeTextFits() ? "complete" : "viewport-too-small";

  }

  function scheduleLayout() {
    if (!layoutFrame) layoutFrame = window.requestAnimationFrame(applyLayout);
  }

  function render(state) {
    currentState = state;
    if (!state || state.teams.length !== 4) {
      currentState = null;
      currentStandings = [];
      previousTotals.clear();
      boardEl.hidden = true;
      teamsEl.replaceChildren();
      progressEl.replaceChildren();
      messageEl.classList.add("visible");
      messageEl.textContent = "Waiting for channel match setup";
      if (tiebreakEl) {
        tiebreakEl.hidden = true;
        tiebreakEl.replaceChildren();
      }
      scheduleLayout();
      return;
    }

    boardEl.hidden = false;
    boardEl.dataset.stale = "false";
    boardEl.dataset.status = state.status;
    messageEl.classList.remove("visible");
    const standings = scoreApi.getStandings(state);
    currentStandings = standings;
    const completed = Math.min(state.races.length, state.maxRaces);
    const progressFragment = document.createDocumentFragment();
    for (let raceNumber = 1; raceNumber <= state.maxRaces; raceNumber += 1) {
      const marker = createElement("span", "overlay-race-marker");
      if (raceNumber <= completed) marker.classList.add("completed");
      marker.setAttribute("aria-hidden", "true");
      progressFragment.append(marker);
    }
    progressEl.setAttribute("aria-label", `${completed} of ${state.maxRaces} races completed`);
    progressEl.replaceChildren(progressFragment);

    // Do not declare final tie criteria until the backend marks the match finished.
    const tiebreakDetails = state.status === "finished"
      ? scoreApi.getTiebreakDetails(state, standings) : [];
    tiebreakRows = tiebreakDetails.length;
    if (tiebreakEl) {
      const fragment = document.createDocumentFragment();
      for (const detail of tiebreakDetails) {
        const line = createElement("div", "overlay-tiebreak-line", presentation.compactTiebreak(detail));
        line.title = detail.text;
        line.setAttribute("aria-label", detail.text);
        fragment.append(line);
      }
      tiebreakEl.replaceChildren(fragment);
      tiebreakEl.hidden = !tiebreakDetails.length;
    }

    const standingByTag = new Map(standings.map(team => [team.tag, team]));
    const fragment = document.createDocumentFragment();
    // The canonical lane order is Red / Blue / Yellow / Green; ranks never move cards.
    for (const configuredTeam of state.teams) {
      const team = standingByTag.get(configuredTeam.tag) || {
        ...configuredTeam, total: Number(state.totals?.[configuredTeam.tag] || 0), rank: "-"
      };
      const previous = previousTotals.get(team.tag);
      const article = createElement("article", "overlay-team");
      article.style.setProperty("--team-color", team.color);
      article.dataset.tag = team.tag;
      article.dataset.rank = String(team.rank);
      article.setAttribute("aria-label", `${team.tag}, ${presentation.ordinal(team.rank)} place, ${team.total} points`);
      const top = createElement("div", "overlay-team-top");
      top.append(
        createElement("div", "overlay-rank", presentation.ordinal(team.rank)),
        createElement("div", "overlay-tag", team.tag)
      );
      const points = createElement("div", "overlay-points");
      points.dataset.changed = String(previous !== undefined && previous !== team.total);
      points.append(createElement("span", "overlay-score-value", team.total), createElement("small", "", "PTS"));
      article.append(top, points);
      fragment.append(article);
    }
    teamsEl.replaceChildren(fragment);
    previousTotals = new Map(standings.map(team => [team.tag, team.total]));
    scheduleLayout();
  }

  window.addEventListener("resize", scheduleLayout, { passive: true });
  if (typeof window.ResizeObserver === "function") {
    new window.ResizeObserver(scheduleLayout).observe(document.documentElement);
  }
  document.fonts?.ready?.then(scheduleLayout);
  document.fonts?.addEventListener?.("loadingdone", scheduleLayout);
  window.addEventListener("pageshow", scheduleLayout, { passive: true });
  scheduleLayout();

  scoreApi.createTournamentClient({
    onData: render,
    onStatus(status, message) {
      // Recovery must also work when the next response contains UNCHANGED scores:
      // common.js may skip onData for identical payloads but still call onStatus.
      if ((status === "online" || status === "demo") && currentState) {
        boardEl.hidden = false;
        boardEl.dataset.stale = "false";
        boardEl.title = "";
        messageEl.classList.remove("visible");
      } else if (status === "error" && currentState) {
        boardEl.hidden = false;
        boardEl.dataset.stale = "true";
        boardEl.title = "Connection interrupted. Last received scores shown; retrying automatically.";
        messageEl.classList.remove("visible");
      } else if (status !== "online") {
        boardEl.hidden = true;
        messageEl.classList.add("visible");
        messageEl.textContent = message;
      }
    }
  });
})();

})();
