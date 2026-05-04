(function () {
  // ── State ──────────────────────────────────────────────────────────────────

  // groupPreds[groupName][teamName] = { gd: 0, pts: 0 }
  const groupPreds = {};
  for (const g of GROUPS) {
    groupPreds[g.name] = {};
    for (const t of g.teams) groupPreds[g.name][t.name] = { gd: 0, pts: 0 };
  }

  // picks[round][idx] = teamName | null
  const picks = {
    r32:   new Array(16).fill(null),
    r16:   new Array(8).fill(null),
    qf:    new Array(4).fill(null),
    sf:    new Array(2).fill(null),
    final: new Array(1).fill(null),
    third: new Array(1).fill(null),
  };

  // Cached qualifiers snapshot, refreshed before any bracket render
  let _q = computeQualifiers();

  // ── Derived: qualifiers ────────────────────────────────────────────────────

  function sortedGroup(gName) {
    const preds = groupPreds[gName];
    return [...GROUPS.find(g => g.name === gName).teams].sort((a, b) => {
      const pa = preds[a.name], pb = preds[b.name];
      return pb.pts !== pa.pts ? pb.pts - pa.pts : pb.gd - pa.gd;
    });
  }

  function computeQualifiers() {
    const firsts = {}, seconds = {};
    const thirds = [];
    for (const g of GROUPS) {
      const [t1, t2, t3] = sortedGroup(g.name);
      firsts[g.name] = t1;
      seconds[g.name] = t2;
      const p = groupPreds[g.name][t3.name];
      thirds.push({ team: t3, pts: p.pts, gd: p.gd });
    }
    thirds.sort((a, b) => b.pts !== a.pts ? b.pts - a.pts : b.gd - a.gd);
    return { firsts, seconds, bestThirds: thirds.slice(0, 8).map(x => x.team) };
  }

  // ── Derived: bracket participants ──────────────────────────────────────────

  function resolveLabel(label, best3rdSlot) {
    if (label.startsWith("1st ")) return _q.firsts[label.slice(4)] ?? null;
    if (label.startsWith("2nd ")) return _q.seconds[label.slice(4)] ?? null;
    if (label === "Best 3rd")     return _q.bestThirds[best3rdSlot] ?? null;
    return null;
  }

  // Returns { home, away } team objects (or null) for any bracket match
  function matchTeams(round, idx) {
    if (round === "r32") {
      const m = KNOCKOUT.r32[idx];
      return {
        home: resolveLabel(m.home, -1),
        away: resolveLabel(m.away, m.best3rdSlot),
      };
    }
    if (round === "r16") {
      return { home: winnerOf("r32", idx * 2), away: winnerOf("r32", idx * 2 + 1) };
    }
    if (round === "qf")    return { home: winnerOf("r16", idx * 2),  away: winnerOf("r16", idx * 2 + 1) };
    if (round === "sf")    return { home: winnerOf("qf",  idx * 2),  away: winnerOf("qf",  idx * 2 + 1) };
    if (round === "final") return { home: winnerOf("sf", 0),         away: winnerOf("sf", 1) };
    if (round === "third") return { home: loserOf("sf", 0),          away: loserOf("sf", 1) };
    return { home: null, away: null };
  }

  function winnerOf(round, idx) {
    const name = picks[round][idx];
    if (!name) return null;
    const { home, away } = matchTeams(round, idx);
    if (home?.name === name) return home;
    if (away?.name === name) return away;
    return null; // stale pick — treat as no selection
  }

  function loserOf(round, idx) {
    const name = picks[round][idx];
    if (!name) return null;
    const { home, away } = matchTeams(round, idx);
    if (home?.name === name) return away;
    if (away?.name === name) return home;
    return null;
  }

  // ── Tab switching ──────────────────────────────────────────────────────────

  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b === btn));
      document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === btn.dataset.tab + "-view"));
    });
  });

  // ── Group stage rendering ──────────────────────────────────────────────────

  function renderGroups() {
    const view = document.getElementById("groups-view");
    view.innerHTML = "";

    const legend = document.createElement("div");
    legend.className = "legend";
    legend.innerHTML = `
      <span class="legend-item"><span class="legend-dot qualify"></span>Advances (1st / 2nd)</span>
      <span class="legend-item"><span class="legend-dot maybe"></span>Potential qualifier (Best 3rd)</span>
    `;
    view.appendChild(legend);

    const grid = document.createElement("div");
    grid.className = "groups-grid";
    for (const g of GROUPS) grid.appendChild(buildGroupCard(g));
    view.appendChild(grid);
  }

  function buildGroupCard(group) {
    const sorted = sortedGroup(group.name);
    const bestThirdSet = new Set(_q.bestThirds.map(t => t.name));

    const card = document.createElement("div");
    card.className = "group-card";
    card.dataset.group = group.name;

    const h2 = document.createElement("h2");
    h2.textContent = `Group ${group.name}`;
    card.appendChild(h2);

    const table = document.createElement("table");
    table.className = "standings";
    table.innerHTML = `<thead><tr>
      <th class="team-col">Team</th>
      <th title="Goal Difference">GD</th>
      <th title="Points">Pts</th>
    </tr></thead>`;

    const tbody = document.createElement("tbody");
    sorted.forEach((team, i) => {
      const isBestThird = i === 2 && bestThirdSet.has(team.name);
      const tr = document.createElement("tr");
      tr.dataset.team = team.name;
      tr.className = i < 2 ? "row-qualify" : (isBestThird ? "row-maybe" : "");

      const tdTeam = document.createElement("td");
      tdTeam.className = "team-col";
      tdTeam.innerHTML = `<span class="team-name"><span class="flag">${team.flag}</span>${esc(team.name)}</span>`;

      const tdGd = document.createElement("td");
      tdGd.appendChild(makeInput("gd", group.name, team.name));

      const tdPts = document.createElement("td");
      tdPts.appendChild(makeInput("pts", group.name, team.name));

      tr.append(tdTeam, tdGd, tdPts);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    card.appendChild(table);
    return card;
  }

  function makeInput(field, groupName, teamName) {
    const input = document.createElement("input");
    input.type = "number";
    input.className = "pred-input";
    input.dataset.field = field;
    input.dataset.team = teamName;
    input.dataset.group = groupName;
    input.value = groupPreds[groupName][teamName][field];
    if (field === "pts") input.min = "0";

    input.addEventListener("input", () => {
      let v = parseInt(input.value, 10);
      if (isNaN(v)) v = 0;
      if (field === "pts") v = Math.max(0, v);
      groupPreds[groupName][teamName][field] = v;
      onGroupChange();
    });

    return input;
  }

  function onGroupChange() {
    _q = computeQualifiers();

    // Reset all bracket picks since group participants changed
    for (const key of Object.keys(picks)) picks[key].fill(null);

    // Update group highlights + row order in place (preserves input focus)
    reorderAndRehighlight();

    // Rebuild bracket
    renderBracket();
    saveState();
  }

  function reorderAndRehighlight() {
    const bestThirdSet = new Set(_q.bestThirds.map(t => t.name));

    for (const g of GROUPS) {
      const sorted = sortedGroup(g.name);
      const card = document.querySelector(`.group-card[data-group="${g.name}"]`);
      if (!card) continue;
      const tbody = card.querySelector("tbody");

      // Move rows to end of tbody in sorted order (preserves DOM nodes + input state)
      for (const team of sorted) {
        const row = tbody.querySelector(`tr[data-team="${CSS.escape(team.name)}"]`);
        if (row) tbody.appendChild(row);
      }

      // Update highlight classes
      sorted.forEach((team, i) => {
        const row = tbody.querySelector(`tr[data-team="${CSS.escape(team.name)}"]`);
        if (!row) return;
        const isBestThird = i === 2 && bestThirdSet.has(team.name);
        row.className = i < 2 ? "row-qualify" : (isBestThird ? "row-maybe" : "");
      });
    }
  }

  // ── Bracket rendering ──────────────────────────────────────────────────────

  const ROUND_DEFS = [
    { round: "r32",   label: "Round of 32",   count: 16 },
    { round: "r16",   label: "Round of 16",   count: 8  },
    { round: "qf",    label: "Quarterfinals", count: 4  },
    { round: "sf",    label: "Semifinals",    count: 2  },
    { round: "final", label: "Final",         count: 1  },
  ];

  function renderBracket() {
    const view = document.getElementById("bracket-view");
    view.innerHTML = "";

    const scroll = document.createElement("div");
    scroll.className = "bracket-scroll";

    const bracket = document.createElement("div");
    bracket.className = "bracket";

    for (const { round, label, count } of ROUND_DEFS) {
      const col = document.createElement("div");
      col.className = "bracket-col" + (round === "final" ? " final-col" : "");

      const heading = document.createElement("div");
      heading.className = "round-label";
      heading.textContent = label;
      col.appendChild(heading);

      const list = document.createElement("div");
      list.className = "round-matches";

      if (count === 1) {
        list.appendChild(buildMatchCard(round, 0));
      } else {
        for (let i = 0; i < count; i += 2) {
          const pair = document.createElement("div");
          pair.className = "match-pair";
          pair.appendChild(buildMatchCard(round, i));
          pair.appendChild(buildMatchCard(round, i + 1));
          list.appendChild(pair);
        }
      }

      col.appendChild(list);
      bracket.appendChild(col);
    }

    scroll.appendChild(bracket);
    view.appendChild(scroll);

    const thirdSec = document.createElement("div");
    thirdSec.className = "third-place-section";
    thirdSec.innerHTML = "<h3>Third Place</h3>";
    thirdSec.appendChild(buildMatchCard("third", 0));
    view.appendChild(thirdSec);
  }

  function buildMatchCard(round, idx) {
    const { home, away } = matchTeams(round, idx);
    const picked = picks[round][idx];
    const card = document.createElement("div");
    card.className = "match-card";
    card.appendChild(buildTeamRow(home, round, idx, picked));
    card.appendChild(buildTeamRow(away, round, idx, picked));
    return card;
  }

  function buildTeamRow(team, round, idx, picked) {
    const row = document.createElement("div");
    const name = team?.name;
    const flag = team?.flag ?? "";
    const tbd = !team;
    const isWinner = picked && name === picked;
    const isLoser  = picked && !tbd && name !== picked;

    row.className = ["match-team", isWinner ? "winner" : "", isLoser ? "loser" : ""]
      .filter(Boolean).join(" ");

    const nameEl = document.createElement("span");
    nameEl.className = "match-team-name" + (tbd ? " tbd" : "");
    nameEl.innerHTML = tbd ? "TBD" : `<span class="flag">${flag}</span> ${esc(name)}`;
    row.appendChild(nameEl);

    if (!tbd) {
      row.classList.add("clickable");
      row.addEventListener("click", () => onPick(round, idx, name));
    }

    return row;
  }

  // ── Bracket picks ──────────────────────────────────────────────────────────

  function onPick(round, idx, teamName) {
    picks[round][idx] = picks[round][idx] === teamName ? null : teamName;
    clearDownstream(round, idx);
    _q = computeQualifiers();
    renderBracket();
    saveState();
  }

  // Precisely clears only the match(es) downstream of the changed pick
  function clearDownstream(round, idx) {
    if (round === "r32") {
      const r16i = Math.floor(idx / 2);
      picks.r16[r16i] = null;
      clearDownstream("r16", r16i);
    } else if (round === "r16") {
      const qfi = Math.floor(idx / 2);
      picks.qf[qfi] = null;
      clearDownstream("qf", qfi);
    } else if (round === "qf") {
      const sfi = Math.floor(idx / 2);
      picks.sf[sfi] = null;
      clearDownstream("sf", sfi);
    } else if (round === "sf") {
      picks.final[0] = null;
      picks.third[0] = null;
    }
  }

  // ── Persistence ───────────────────────────────────────────────────────────

  const STORAGE_KEY = "wc2026_preds";

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ groupPreds, picks }));
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const { groupPreds: gp, picks: pk } = JSON.parse(raw);
      for (const g of GROUPS) {
        for (const t of g.teams) {
          if (gp?.[g.name]?.[t.name]) groupPreds[g.name][t.name] = gp[g.name][t.name];
        }
      }
      for (const key of Object.keys(picks)) {
        if (Array.isArray(pk?.[key])) pk[key].forEach((v, i) => { picks[key][i] = v; });
      }
    } catch (e) { /* ignore corrupt data */ }
  }

  // ── Utility ────────────────────────────────────────────────────────────────

  function esc(str) {
    return String(str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  loadState();
  _q = computeQualifiers();
  renderGroups();
  renderBracket();
})();
