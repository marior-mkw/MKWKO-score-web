(() => {
  "use strict";

  const boardEl = document.querySelector("#overlay-board");
  const progressEl = document.querySelector("#overlay-progress-markers");
  const teamsEl = document.querySelector("#overlay-teams");
  const tiebreakEl = document.querySelector("#overlay-tiebreak");
  const messageEl = document.querySelector("#overlay-message");
  const shellEl = document.querySelector(".overlay-shell");
  const presentation = window.MKOverlayPresentation;
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

  if (!presentation || !window.MKScore) {
    boardEl.hidden = true;
    messageEl.classList.add("visible");
    messageEl.textContent = "Overlay files incomplete. Update all overlay patch files and refresh OBS.";
    return;
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

    // Font metrics differ by host OS. Apply one shared shrink factor only when necessary.
    let factor = 1;
    for (const element of teamsEl.querySelectorAll(".overlay-team-top, .overlay-points")) {
      const childrenWidth = Array.from(element.children).reduce((sum, item) => {
        const style = window.getComputedStyle(item);
        return sum + Math.max(item.scrollWidth, item.getBoundingClientRect().width)
          + (parseFloat(style.marginLeft) || 0) + (parseFloat(style.marginRight) || 0);
      }, 0);
      const gap = parseFloat(window.getComputedStyle(element).columnGap) || 0;
      const needed = childrenWidth + gap * Math.max(0, element.children.length - 1);
      if (needed > element.clientWidth && element.clientWidth > 0) {
        factor = Math.min(factor, element.clientWidth / needed * 0.98);
      }
    }
    if (factor < 1) {
      boardEl.style.setProperty("--primary-size", `${(metrics.primary * factor).toFixed(2)}px`);
      boardEl.style.setProperty("--pts-size", `${(metrics.pts * factor).toFixed(2)}px`);
    }
    boardEl.dataset.smallViewport = String(metrics.primary * factor < 20);
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
    const standings = window.MKScore.getStandings(state);
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
      ? window.MKScore.getTiebreakDetails(state, standings) : [];
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

    const podium = presentation.getPodium(state, standings);
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
      const highlight = podium.get(team.tag);
      if (highlight) {
        article.dataset.podium = highlight.kind;
        article.dataset.sharedRank = String(highlight.shared);
        article.setAttribute("aria-label", `${team.tag}, ${highlight.label}, ${team.total} points`);
      } else {
        article.setAttribute("aria-label", `${team.tag}, ${presentation.ordinal(team.rank)} place, ${team.total} points`);
      }
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
  scheduleLayout();

  window.MKScore.createTournamentClient({
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
