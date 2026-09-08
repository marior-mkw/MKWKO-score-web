(() => {
  "use strict";

  const nameEl = document.querySelector("#tournament-name");
  const statusEl = document.querySelector("#connection-status");
  const statusTextEl = document.querySelector("#status-text");
  const updatedEl = document.querySelector("#updated-at");
  const boardLabelEl = document.querySelector("#board-label");
  const gridEl = document.querySelector("#summary-grid");
  const progressEl = document.querySelector("#race-progress");
  const headEl = document.querySelector("#score-head");
  const bodyEl = document.querySelector("#score-body");
  const emptyEl = document.querySelector("#empty-state");
  const winnerEl = document.querySelector("#winner");
  const winnerNameEl = document.querySelector("#winner-name");
  const winnerPointsEl = document.querySelector("#winner-points");
  const scoringNameEl = document.querySelector("#scoring-name");
  const pointsListEl = document.querySelector("#points-list");
  const pointsTotalEl = document.querySelector("#points-total");

  function createElement(tagName, className = "", text = "") {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text !== "") element.textContent = String(text);
    return element;
  }

  function renderStatus(state, message) {
    statusEl.dataset.state = state;
    statusTextEl.textContent = message;
  }

  function ordinal(value) {
    const mod100 = value % 100;
    if (mod100 >= 11 && mod100 <= 13) return `${value}th`;
    switch (value % 10) {
      case 1: return `${value}st`;
      case 2: return `${value}nd`;
      case 3: return `${value}rd`;
      default: return `${value}th`;
    }
  }

  function renderTeamCards(standings) {
    const fragment = document.createDocumentFragment();
    for (const team of standings) {
      const article = createElement("article", "team-card");
      article.style.setProperty("--team-color", team.color);
      article.append(
        createElement("div", "team-rank", team.rank),
        createElement("div", "team-tag", team.tag)
      );
      const teamName = createElement("div", "team-name", team.name);
      teamName.title = team.name;
      article.append(teamName);

      const total = createElement("div", "team-total", team.total);
      total.append(createElement("small", "", "PTS"));
      article.append(total);
      fragment.append(article);
    }
    gridEl.replaceChildren(fragment);
  }

  function renderProgress(maxRaces, completed) {
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < maxRaces; index += 1) {
      const dot = createElement("span", "progress-dot", index + 1);
      if (index < completed) dot.classList.add("done");
      fragment.append(dot);
    }
    progressEl.replaceChildren(fragment);
  }

  function renderTable(state) {
    const headRow = document.createElement("tr");
    const teamHeader = createElement("th", "", "Team");
    teamHeader.scope = "col";
    headRow.append(teamHeader);
    for (let index = 0; index < state.maxRaces; index += 1) {
      const raceHeader = createElement("th", "", `R${index + 1}`);
      raceHeader.scope = "col";
      headRow.append(raceHeader);
    }
    const totalHeader = createElement("th", "", "Total");
    totalHeader.scope = "col";
    headRow.append(totalHeader);
    headEl.replaceChildren(headRow);

    const bodyFragment = document.createDocumentFragment();
    for (const team of state.teams) {
      const row = document.createElement("tr");
      const nameCell = document.createElement("td");
      const teamWrap = createElement("div", "table-team");
      teamWrap.style.setProperty("--team-color", team.color);
      const swatch = createElement("span", "table-swatch");
      swatch.setAttribute("aria-hidden", "true");
      const label = createElement("span", "", `${team.name} `);
      label.append(createElement("span", "table-tag", team.tag));
      teamWrap.append(swatch, label);
      nameCell.append(teamWrap);
      row.append(nameCell);

      for (let index = 0; index < state.maxRaces; index += 1) {
        const value = state.races[index]?.teamPoints?.[team.tag];
        const number = Number(value);
        row.append(createElement("td", "", Number.isFinite(number) ? number : "-"));
      }

      row.append(createElement(
        "td",
        "table-total",
        Number(state.totals?.[team.tag] || 0)
      ));
      bodyFragment.append(row);
    }
    bodyEl.replaceChildren(bodyFragment);
  }

  function render(state, meta = {}) {
    if (boardLabelEl) {
      boardLabelEl.textContent = meta.boardId ? `Board: ${meta.boardId}` : "";
    }

    if (!state) {
      gridEl.replaceChildren();
      progressEl.replaceChildren();
      headEl.replaceChildren();
      bodyEl.replaceChildren();
      emptyEl.hidden = false;
      winnerEl.classList.remove("visible");
      return;
    }

    const standings = window.MKScore.getStandings(state);
    const completed = state.races.length;
    const finished = completed >= state.maxRaces || state.status === "finished";

    nameEl.textContent = state.name;
    updatedEl.textContent = `Updated: ${window.MKScore.formatDate(state.updatedAt)}`;

    const scoring = window.MKScore.getScoringPreset(state.scoringSystem);
    scoringNameEl.textContent = scoring.label;
    pointsListEl.textContent = scoring.points
      .map((points, index) => `${ordinal(index + 1)} ${points}`)
      .join(", ");
    pointsTotalEl.textContent = `Each race awards exactly ${scoring.total} points.`;

    renderTeamCards(standings);
    renderProgress(state.maxRaces, completed);
    renderTable(state);

    emptyEl.hidden = completed > 0;
    winnerEl.classList.toggle("visible", finished && standings.length > 0);
    if (finished && standings.length > 0) {
      const leaders = standings.filter(team => team.rank === 1);
      const winnerWasResolvedByCountback = leaders.length === 1
        && standings.length > 1
        && standings[1].total === standings[0].total;
      winnerNameEl.textContent = leaders.length > 1
        ? `Tie: ${leaders.map(team => team.name).join(" / ")}`
        : leaders[0].name;
      winnerPointsEl.textContent = `${standings[0].total} pts${winnerWasResolvedByCountback ? " · countback" : ""}`;
    }
  }

  window.MKScore.createTournamentClient({
    onData: render,
    onStatus: renderStatus
  });
})();
