(() => {
  "use strict";

  const boardEl = document.querySelector("#overlay-board");
  const progressEl = document.querySelector("#overlay-progress-markers");
  const teamsEl = document.querySelector("#overlay-teams");
  const tiebreakEl = document.querySelector("#overlay-tiebreak");
  const messageEl = document.querySelector("#overlay-message");

  let previousTotals = new Map();

  function createElement(tagName, className = "", text = "") {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text !== "") element.textContent = String(text);
    return element;
  }

  function render(state) {
    if (!state) {
      boardEl.hidden = true;
      messageEl.classList.add("visible");
      messageEl.textContent = "Waiting for channel match setup";
      if (tiebreakEl) {
        tiebreakEl.hidden = true;
        tiebreakEl.replaceChildren();
      }
      return;
    }

    boardEl.hidden = false;
    messageEl.classList.remove("visible");

    const standings = window.MKScore.getStandings(state);
    const completed = Math.min(state.races.length, state.maxRaces);

    const progressFragment = document.createDocumentFragment();
    for (let raceNumber = 1; raceNumber <= state.maxRaces; raceNumber += 1) {
      const marker = createElement("span", "overlay-race-marker");
      if (raceNumber <= completed) marker.classList.add("completed");
      marker.setAttribute("aria-hidden", "true");
      progressFragment.append(marker);
    }
    progressEl.setAttribute(
      "aria-label",
      `${completed} of ${state.maxRaces} races completed`
    );
    progressEl.replaceChildren(progressFragment);

    const tiebreakDetails = window.MKScore.getTiebreakDetails(state, standings);
    if (tiebreakEl) {
      if (tiebreakDetails.length) {
        const tiebreakFragment = document.createDocumentFragment();
        for (const detail of tiebreakDetails) {
          tiebreakFragment.append(createElement("div", "overlay-tiebreak-line", detail.text));
        }
        tiebreakEl.replaceChildren(tiebreakFragment);
        tiebreakEl.hidden = false;
      } else {
        tiebreakEl.hidden = true;
        tiebreakEl.replaceChildren();
      }
    }

    const standingByTag = new Map(standings.map(team => [team.tag, team]));
    const fragment = document.createDocumentFragment();

    // OBS follows Mario Kart World's fixed team-color lane order.
    // Standings affect only the rank badge; cards never move with score changes.
    for (const configuredTeam of state.teams) {
      const team = standingByTag.get(configuredTeam.tag) || {
        ...configuredTeam,
        total: Number(state.totals?.[configuredTeam.tag] || 0),
        rank: "-"
      };
      const previous = previousTotals.get(team.tag);
      const changed = previous !== undefined && previous !== team.total;
      const article = createElement("article", "overlay-team");
      article.style.setProperty("--team-color", team.color);

      const top = createElement("div", "overlay-team-top");
      top.append(
        createElement("div", "overlay-rank", team.rank),
        createElement("div", "overlay-tag", team.tag)
      );

      const points = createElement("div", "overlay-points", team.total);
      points.dataset.changed = String(changed);
      points.append(createElement("small", "", "PTS"));
      article.append(top, points);
      fragment.append(article);
    }
    teamsEl.replaceChildren(fragment);

    previousTotals = new Map(state.teams.map(team => [
      team.tag,
      Number(state.totals?.[team.tag] || 0)
    ]));
  }

  window.MKScore.createTournamentClient({
    onData: render,
    onStatus(state, message) {
      if (state !== "online") {
        boardEl.hidden = true;
        messageEl.classList.add("visible");
        messageEl.textContent = message;
      }
    }
  });
})();
