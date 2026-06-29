(function () {
  // ── State ──────────────────────────────────────────────────────────────────

  // picks[round][idx] = teamName | null
  const picks = {
    r32:   new Array(16).fill(null),
    r16:   new Array(8).fill(null),
    qf:    new Array(4).fill(null),
    sf:    new Array(2).fill(null),
    final: new Array(1).fill(null),
    third: new Array(1).fill(null),
  };

  // ── Derived: bracket participants ──────────────────────────────────────────

  // Returns { home, away } team objects (or null) for any bracket match
  function matchTeams(round, idx) {
    if (round === "r32") {
      const m = KNOCKOUT.r32[idx];
      return { home: m.home, away: m.away };
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

    // Everything inside captureRoot is what gets exported as an image.
    const captureRoot = document.createElement("div");
    captureRoot.id = "capture-root";

    const captureTitle = document.createElement("div");
    captureTitle.className = "capture-title";
    captureTitle.textContent = "2026 FIFA World Cup · Knockout Bracket";
    captureRoot.appendChild(captureTitle);

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
    captureRoot.appendChild(scroll);

    const thirdSec = document.createElement("div");
    thirdSec.className = "third-place-section";
    thirdSec.innerHTML = "<h3>Third Place</h3>";
    thirdSec.appendChild(buildMatchCard("third", 0));
    captureRoot.appendChild(thirdSec);

    view.appendChild(captureRoot);
    view.appendChild(buildShareBar());
  }

  // ── Share / export ─────────────────────────────────────────────────────────

  function buildShareBar() {
    const bar = document.createElement("div");
    bar.className = "share-bar";

    const btn = document.createElement("button");
    btn.className = "share-btn";
    btn.type = "button";
    btn.textContent = "📷  Download bracket as image";
    btn.addEventListener("click", () => downloadBracketImage(btn));

    bar.appendChild(btn);
    return bar;
  }

  async function downloadBracketImage(btn) {
    const root = document.getElementById("capture-root");
    if (!root) return;

    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Rendering…";

    const fail = (msg) => {
      btn.disabled = false;
      btn.textContent = original;
      alert(msg);
    };

    try {
      // Temporarily expand the scrollable bracket so html2canvas captures its
      // full width, not just the visible portion.
      const scrollEl = root.querySelector(".bracket-scroll");
      const prevOverflow = scrollEl ? scrollEl.style.overflow : "";
      if (scrollEl) scrollEl.style.overflow = "visible";

      const fullW = root.scrollWidth;
      const fullH = root.scrollHeight;

      // html2canvas renders the live DOM directly — no SVG foreignObject, no
      // canvas taint. useCORS lets it fetch the flag images cross-origin.
      const canvas = await html2canvas(root, {
        scale: 2,
        backgroundColor: "#0d1a0e",
        useCORS: true,
        logging: false,
        width: fullW,
        height: fullH,
        scrollX: 0,
        scrollY: 0,
        windowWidth: Math.max(fullW, 1024),
      });

      if (scrollEl) scrollEl.style.overflow = prevOverflow;

      canvas.toBlob((blob) => {
        if (!blob) return fail("Sorry, something went wrong creating the image.");
        const link = document.createElement("a");
        link.download = "world-cup-2026-bracket.png";
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
        btn.disabled = false;
        btn.textContent = original;
      }, "image/png");
    } catch (e) {
      fail("Sorry, something went wrong creating the image.");
    }
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
    if (tbd) {
      nameEl.textContent = "TBD";
    } else {
      const flagImg = document.createElement("img");
      flagImg.className = "flag";
      flagImg.width = 20;
      flagImg.height = 15;
      flagImg.alt = "";
      flagImg.crossOrigin = "anonymous";
      flagImg.src = `https://flagcdn.com/20x15/${flag}.png`;
      nameEl.appendChild(flagImg);
      nameEl.appendChild(document.createTextNode(" " + name));
    }
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ picks }));
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const { picks: pk } = JSON.parse(raw);
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
  renderBracket();
})();
