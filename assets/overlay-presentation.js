/* MKWKO overlay-only presentation helpers. No storage or score mutations. */
(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MKOverlayPresentation = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";
  const VERSION = "2.4.1";
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function ordinal(rank) {
    if (!Number.isInteger(rank) || rank < 1) return "\u2014";
    const lastTwo = rank % 100;
    const suffix = lastTwo >= 11 && lastTwo <= 13 ? "th"
      : ({ 1: "st", 2: "nd", 3: "rd" }[rank % 10] || "th");
    return `${rank}${suffix}`;
  }

  function getPodium(state, standings) {
    const highlights = new Map();
    // A numeric race count alone is not authority to declare the match final.
    if (state?.status !== "finished" || !Array.isArray(state.races) || !state.races.length) {
      return highlights;
    }
    const eligible = state.maxRaces === 5 ? [1, 2] : [1];
    for (const team of standings) {
      if (!eligible.includes(team.rank)) continue;
      const shared = standings.filter(other => other.rank === team.rank).length > 1;
      highlights.set(team.tag, {
        kind: team.rank === 1 ? "first" : "second",
        shared,
        label: `${shared ? "Tied " : ""}${ordinal(team.rank)} place`
      });
    }
    return highlights;
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
    const maxByHeight = (rowHeight - padding * 2) / 2.36;
    const primary = Math.max(1, Math.min(maxByTag, maxByTotal, maxByHeight));
    return {
      primary, pts: Math.max(1, primary * 0.31), tieFont, marker, markerGap, header, tieHeight,
      padding, reserve, gap: primary * 0.17,
      stroke: clamp(primary * 0.03, 0.5, 2), radius: clamp(22 * scale, 8, 30),
      lane: clamp(4 * scale, 2, 6),
      small: primary < 20
    };
  }

  return Object.freeze({ VERSION, ordinal, getPodium, compactTiebreak, getFrame, getTypography });
});
