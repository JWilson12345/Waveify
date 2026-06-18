/*
  ui.js
  -----
  Shared display helpers. This file avoids repeating small formatting and HTML
  escaping tasks across the app, player, and generated pages.
*/

const WaveifyUI = (() => {
  const defaultCover = "images/playlists/default-cover.png";

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"]/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;"
    }[character]));
  }

  function slug(value) {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function createSongId(song, index) {
    return song.id || `${slug(song.artist)}-${slug(song.album)}-${slug(song.title)}-${index + 1}`;
  }

  function cover(src) {
    return src || defaultCover;
  }

  function imageFallback() {
    return `onerror="this.onerror=null;this.src='${defaultCover}'"`;
  }

  function parseDuration(duration) {
    if (typeof duration === "number") return duration;
    const parts = String(duration || "0:00").split(":").map(Number);
    if (parts.some(Number.isNaN)) return 0;
    return parts.reduce((total, part) => total * 60 + part, 0);
  }

  function formatSeconds(seconds) {
    const safeSeconds = Math.max(0, Math.floor(seconds || 0));
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;
    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  function formatRuntime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }

  function uniqueCount(items, selector) {
    return new Set(items.map(selector).filter(Boolean)).size;
  }

  function stats(songs) {
    const totalSeconds = songs.reduce((sum, song) => sum + parseDuration(song.duration), 0);
    return {
      songs: songs.length,
      artists: uniqueCount(songs, (song) => song.artist),
      albums: uniqueCount(songs, (song) => `${song.album}__${song.artist}`),
      runtime: formatRuntime(totalSeconds)
    };
  }

  function emptyState(message) {
    return `<div class="empty-state"><p>${escapeHTML(message)}</p></div>`;
  }

  function toast(message) {
    const stack = document.getElementById("toastStack");
    if (!stack) return;
    const toastElement = document.createElement("div");
    toastElement.className = "toast";
    toastElement.textContent = message;
    stack.appendChild(toastElement);
    window.setTimeout(() => toastElement.remove(), 3200);
  }

  function boostLabel(boostValue) {
    return `×${Number(boostValue || 1).toFixed(1)}`;
  }

  function songCard(song, isFavourite, boostValue = 0) {
    return `
      <article class="media-card" data-action="play" data-song-id="${song.id}">
        <img src="${cover(song.cover)}" alt="${escapeHTML(song.title)} cover" ${imageFallback()}>
        <div>
          <h3>${escapeHTML(song.title)}</h3>
          <p>${escapeHTML(song.artist)} • ${escapeHTML(song.album)}</p>
          <div class="card-actions">
            <button class="icon-button" data-action="play" data-song-id="${song.id}" type="button" title="Play" aria-label="Play ${escapeHTML(song.title)}">▶</button>
            <button class="icon-button ${isFavourite ? "active" : ""}" data-action="favourite" data-song-id="${song.id}" type="button" title="Favourite" aria-label="Favourite ${escapeHTML(song.title)}">${isFavourite ? "♥" : "♡"}</button>
            ${boostValue !== 1 ? `<span class="boost-pill ${boostValue > 1 ? "positive" : "negative"}">Boost ${boostLabel(boostValue)}</span>` : ""}
          </div>
        </div>
      </article>`;
  }

  function trackRow(song, index, isFavourite, options = {}) {
    const boostValue = Number(options.boostValue || 0);
    const weight = Number(options.weight || 1);

    return `
      <article class="track-row" data-song-id="${song.id}">
        <span class="track-number">${index + 1}</span>
        <div class="track-main" data-action="play" data-song-id="${song.id}">
          <img src="${cover(song.cover)}" alt="${escapeHTML(song.title)} cover" ${imageFallback()}>
          <div>
            <div class="track-title">${escapeHTML(song.title)}</div>
            <div class="track-subtitle">${escapeHTML(song.artist)} • ${escapeHTML(song.album)}</div>
          </div>
        </div>
        <span class="track-duration">${escapeHTML(song.duration || "")}</span>
        <div class="track-actions">
          <button class="icon-button ${isFavourite ? "active" : ""}" data-action="favourite" data-song-id="${song.id}" type="button" title="Favourite" aria-label="Favourite ${escapeHTML(song.title)}">${isFavourite ? "♥" : "♡"}</button>
          <button class="icon-button boost-button" data-action="boost-down" data-song-id="${song.id}" type="button" title="Reduce shuffle weight" aria-label="Reduce ${escapeHTML(song.title)} shuffle weight">−</button>
          <span class="boost-pill ${boostValue > 1 ? "positive" : boostValue < 1 ? "negative" : ""}" title="Smart shuffle weight">×${boostValue.toFixed(1)}</span>
          <button class="icon-button boost-button" data-action="boost-up" data-song-id="${song.id}" type="button" title="Increase shuffle weight" aria-label="Increase ${escapeHTML(song.title)} shuffle weight">＋</button>
        </div>
      </article>`;
  }

  return {
    defaultCover,
    escapeHTML,
    slug,
    createSongId,
    cover,
    imageFallback,
    parseDuration,
    formatSeconds,
    formatRuntime,
    stats,
    emptyState,
    toast,
    songCard,
    trackRow
  };
})();
