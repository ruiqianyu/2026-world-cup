(function () {
  // ── Flag image cache ──────────────────────────────────────────────────────

  // Stores ISO code → base64 data URL once preloaded.
  // Using data URLs in the SVG foreignObject export avoids cross-origin restrictions.
  const flagDataCache = new Map();

  function flagSrc(code) {
    return `https://flagcdn.com/20x15/${code}.png`;
  }

  // Fetch the flag via the Fetch API and convert to a data URL via FileReader.
  // This avoids the crossOrigin/canvas-taint approach that can cause Chrome to
  // stall with neither onload nor onerror firing when the image is already cached
  // without CORS headers.
  async function loadFlagDataUrl(code) {
    try {
      const res = await fetch(flagSrc(code));
      if (!res.ok) return;
      const blob = await res.blob();
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      flagDataCache.set(code, dataUrl);
    } catch (_) {
      // Network or CORS error — flag will stay as a CDN URL in the export
    }
  }

  let flagsReadyPromise = null;
  function preloadAllFlags() {
    if (flagsReadyPromise) return flagsReadyPromise;
    const codes = new Set(KNOCKOUT.r32.flatMap(m => [m.home.flag, m.away.flag]));
    flagsReadyPromise = Promise.all([...codes].map(loadFlagDataUrl));
    return flagsReadyPromise;
  }

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

  // Dependency-free PNG export: render the bracket into an <svg><foreignObject>,
  // rasterize it via an <img>, then draw to a canvas and download. No libraries.
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

    // Ensure flag images are preloaded as data URLs so they survive the
    // SVG foreignObject renderer (which does not fetch external resources).
    // The 5 s cap prevents the export from hanging if any fetch stalls.
    await Promise.race([preloadAllFlags(), new Promise(r => setTimeout(r, 5000))]);

    // Fixed export geometry → every user downloads an identically sized image,
    // independent of viewport (which otherwise drives each flex cell's width).
    const PAD = 16;   // matches #capture-root padding
    const COLS = 5;   // R32 → Final columns
    const CELL = 190; // fixed width per bracket column
    const width = COLS * CELL + PAD * 2;

    const clone = root.cloneNode(true);

    // Bake computed styles first — copyComputedStyle now filters out any value
    // containing an external URL, so no CDN ref can sneak in via e.g. `content`.
    inlineComputedStyles(root, clone);
    applyExportLayout(clone, width, CELL);

    // Substitute flag srcs AFTER style baking so this assignment wins over any
    // property that inlineComputedStyles might have written. Every flag must end
    // up with a same-origin data URL — any external URL inside the SVG foreignObject
    // taints the canvas and makes toBlob() throw a SecurityError.
    const blankPng = (() => {
      const cv = document.createElement("canvas");
      cv.width = 20; cv.height = 15;
      return cv.toDataURL("image/png");
    })();
    clone.querySelectorAll("img.flag[data-flag-code]").forEach(img => {
      img.src = flagDataCache.get(img.dataset.flagCode) || blankPng;
      img.style.content = ""; // clear any baked content value that held the CDN URL
    });
    clone.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");

    // Measure the laid-out height off-screen so the canvas is sized exactly.
    clone.style.position = "absolute";
    clone.style.left = "-99999px";
    clone.style.top = "0";
    document.body.appendChild(clone);
    const height = clone.scrollHeight;
    document.body.removeChild(clone);
    clone.style.position = "static";
    clone.style.left = "";
    clone.style.top = "";

    // Connector lines are CSS pseudo-elements (can't be inlined), so inject them.
    const styleEl = document.createElement("style");
    styleEl.textContent = CONNECTOR_CSS;
    clone.insertBefore(styleEl, clone.firstChild);

    const xhtml = new XMLSerializer().serializeToString(clone);
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
        `<foreignObject x="0" y="0" width="100%" height="100%">${xhtml}</foreignObject>` +
      `</svg>`;

    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
    const img = new Image();

    img.onload = () => {
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width  = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext("2d");
      ctx.scale(scale, scale);
      ctx.fillStyle = getComputedStyle(document.body).backgroundColor || "#0d1a0e";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

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
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      fail("Sorry, something went wrong creating the image.");
    };

    img.src = url;
  }

  // Copy resolved computed styles from each source node onto its clone, so the
  // detached clone renders identically without needing the external stylesheet.
  function inlineComputedStyles(src, dst) {
    copyComputedStyle(src, dst);
    const srcNodes = src.querySelectorAll("*");
    const dstNodes = dst.querySelectorAll("*");
    for (let i = 0; i < srcNodes.length; i++) copyComputedStyle(srcNodes[i], dstNodes[i]);
  }

  // Sizing props are intentionally skipped: baking frozen px sizes (measured on
  // the live, possibly-narrow/high-DPI viewport) makes boxes mismatch the fixed
  // export columns and leaves rounding gaps. Layout still reproduces because all
  // the display/flex/padding properties are copied — boxes just size naturally.
  const SKIP_PROPS = new Set([
    "width", "height", "min-width", "min-height", "max-width", "max-height",
    "inline-size", "block-size", "min-inline-size", "min-block-size",
    "max-inline-size", "max-block-size",
  ]);

  function copyComputedStyle(src, dst) {
    const cs = getComputedStyle(src);
    let text = "";
    for (let i = 0; i < cs.length; i++) {
      const p = cs[i];
      if (SKIP_PROPS.has(p)) continue;
      const val = cs.getPropertyValue(p);
      // Skip any value referencing an external URL (e.g. content: url("https://...") on
      // replaced elements like <img>) — these would taint the canvas in the SVG export.
      if (/url\s*\(\s*["']?https?:/.test(val)) continue;
      text += p + ":" + val + ";";
    }
    dst.style.cssText = text;
  }

  // Pin the export to a fixed grid: each column a fixed width, inner boxes fluid
  // within it. Overrides the per-node widths inlined above so the result is the
  // same on any screen. Heights stay as inlined (text never wraps → unaffected).
  function applyExportLayout(clone, width, cell) {
    clone.style.width = width + "px";

    const fill = (sel) => clone.querySelectorAll(sel).forEach(e => {
      e.style.width = "auto"; e.style.minWidth = "0"; e.style.maxWidth = "none";
    });

    clone.querySelectorAll(".bracket-scroll").forEach(e => {
      e.style.overflow = "visible"; e.style.width = "auto";
    });
    fill(".bracket");
    fill(".round-matches");
    fill(".match-pair");
    fill(".round-label");
    clone.querySelectorAll(".bracket-col").forEach(e => {
      e.style.flex = "0 0 " + cell + "px";
      e.style.width = cell + "px";
      e.style.minWidth = cell + "px";
      e.style.maxWidth = cell + "px";
    });
    clone.querySelectorAll(".bracket .match-card").forEach(e => {
      e.style.width = "auto"; e.style.maxWidth = "none";
    });
    // Third-place card isn't inside a column, so size it to match a bracket cell
    // (column width minus the card's 8px left/right margins).
    clone.querySelectorAll(".third-place-section .match-card").forEach(e => {
      e.style.width = (cell - 16) + "px"; e.style.maxWidth = (cell - 16) + "px";
    });
    clone.querySelectorAll(".capture-title").forEach(e => {
      e.style.height = "auto"; e.style.whiteSpace = "nowrap";
    });
  }

  // Bracket connector lines, as pseudo-elements (colour = --border literal).
  const CONNECTOR_CSS =
    ".bracket-col:not(.final-col) .match-pair{position:relative;}" +
    ".bracket-col:not(.final-col) .match-pair::after{content:'';position:absolute;" +
      "right:0;top:25%;bottom:25%;width:2px;background:#1e3d22;}" +
    ".bracket-col:not(.final-col) .match-pair::before{content:'';position:absolute;" +
      "right:-16px;top:50%;width:16px;height:2px;background:#1e3d22;transform:translateY(-1px);}";

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
      flagImg.dataset.flagCode = flag;
      flagImg.width = 20;
      flagImg.height = 15;
      flagImg.alt = "";
      flagImg.src = flagDataCache.get(flag) || flagSrc(flag);
      nameEl.appendChild(flagImg);
      nameEl.appendChild(document.createTextNode("\u00A0" + name));
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

  // Kick off flag preloading in the background so data URLs are ready by the
  // time the user clicks "Download". renderBracket() runs immediately and uses
  // the CDN URLs directly; subsequent renders after picks will use data URLs.
  preloadAllFlags();

  loadState();
  renderBracket();
})();
