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

  window.MKScore = Object.freeze({
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
