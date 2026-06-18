/*
  app.js
  ------
  Waveify's homepage-focused controller. The app keeps the Spotify-like workflow
  focused on Home, Search, Liked Songs, and generated system playlists.
*/

const WaveifyApp = (() => {
  const PLAYLIST_ART = {
    liked: "images/playlists/liked-songs.png",
    onRepeat: "images/playlists/on-repeat.png",
    waveMix: "images/playlists/wavemix.png",
    recentlyPlayed: "images/playlists/recently-played.png",
    recentlyAdded: "images/playlists/recently-added.png",
    mostPlayed: "images/playlists/most-played.png",
    allSongs: "images/playlists/all-songs.png"
  };

  const state = {
    songs: [],
    albums: [],
    favourites: WaveifyStorage.getFavourites(),
    recent: WaveifyStorage.getRecent(),
    boosts: WaveifyStorage.getBoosts(),
    listeningStats: WaveifyStorage.getListeningStats(),
    currentView: "home",
    currentQuery: "",
    rerender: null
  };

  const elements = {
    stage: document.getElementById("viewStage"),
    search: document.getElementById("globalSearch")
  };

  function init() {
    migrateBoostsToWeightModel();
    state.songs = normalizeLibrary(library || []);
    state.albums = normalizeUserAlbums(typeof userAlbums !== "undefined" ? userAlbums : [], state.songs);
    bindEvents();

    WaveifyPlayer.init({
      songs: state.songs,
      callbacks: {
        isFavourite,
        toggleFavourite,
        onSongPlayed: recordPlay,
        onSongRepeated: recordRepeat,
        onListeningProgress: recordListeningTime,
        getRecentSongIds: () => state.recent,
        getSongWeight,
        getBoostValue,
        changeBoost
      }
    });

    renderQuickMixes();
    navigate("home");
  }

  function normalizeLibrary(rawLibrary) {
    return rawLibrary.map((song, index) => ({
      id: WaveifyUI.createSongId(song, index),
      title: song.title || "Untitled Song",
      artist: song.artist || "Unknown Artist",
      album: song.album || "Unknown Album",
      genre: song.genre || "Unknown Genre",
      year: song.year || "",
      duration: song.duration || "0:00",
      file: song.file || "",
      cover: song.cover || WaveifyUI.defaultCover,
      artistImage: song.artistImage || song.cover || WaveifyUI.defaultCover,
      lyrics: song.lyrics || ""
    }));
  }

  function normalizeUserAlbums(rawAlbums, songs) {
    const songsById = new Map(songs.map((song) => [song.id, song]));
    const songsByTitle = new Map(songs.map((song) => [song.title.toLowerCase(), song]));

    return rawAlbums.map((album, index) => {
      const albumSongs = (album.songs || [])
        .map((songReference) => songsById.get(String(songReference)) || songsByTitle.get(String(songReference).toLowerCase()))
        .filter(Boolean);

      return {
        key: WaveifyUI.slug(`${album.title || "album"}-${index + 1}`),
        title: album.title || "Untitled Album",
        artist: album.artist || albumSongs[0]?.artist || "Various Artists",
        year: album.year || albumSongs[0]?.year || "",
        cover: album.cover || albumSongs[0]?.cover || WaveifyUI.defaultCover,
        description: album.description || "",
        songs: albumSongs
      };
    });
  }

  function bindEvents() {
    document.querySelectorAll("[data-view]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        navigate(button.dataset.view);
      });
    });

    elements.search.addEventListener("input", () => {
      state.currentQuery = elements.search.value;
      navigate("search");
    });

    document.addEventListener("click", handleActionClick);
  }

  function handleActionClick(event) {
    const viewButton = event.target.closest("[data-view]");
    if (viewButton && !viewButton.classList.contains("nav-item") && !viewButton.classList.contains("mobile-nav-item")) {
      navigate(viewButton.dataset.view);
      return;
    }

    const button = event.target.closest("[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    const songId = button.dataset.songId;

    if (action === "play") WaveifyPlayer.playSong(songId);
    if (action === "play-list") playSongList(button.dataset.list);
    if (action === "open-playlist") renderSystemPlaylist(button.dataset.playlist);
    if (action === "favourite") toggleFavourite(songId);
    if (action === "boost-up") changeBoost(songId, 1);
    if (action === "boost-down") changeBoost(songId, -1);
    if (action === "album") renderAlbum(button.dataset.albumKey);
  }

  function navigate(view) {
    state.currentView = view;
    setActiveNavigation(view);

    const renderers = {
      home: renderHome,
      search: renderSearch,
      liked: () => renderSystemPlaylist("liked")
    };

    const renderer = renderers[view] || renderHome;
    state.rerender = renderer;
    renderer();
  }

  function setActiveNavigation(view) {
    document.querySelectorAll(".nav-item, .mobile-nav-item").forEach((item) => {
      item.classList.toggle("active", item.dataset.view === view);
    });
  }

  function renderHome() {
    const recentlyPlayed = getRecentlyPlayedSongs().slice(0, 8);
    const recentlyAdded = getRecentlyAddedSongs().slice(0, 8);
    const albums = WaveifySearch.findAlbums(state.albums, "").slice(0, 10);

    elements.stage.innerHTML = `
      <section class="welcome-banner">
        <div>
          <p class="eyebrow">Waveify</p>
          <h1>Good listening.</h1>
          <p>Your personal collection, organised for fast playback.</p>
        </div>
        <div class="hero-actions">
          <button class="primary-button" data-action="play-list" data-list="liked" type="button">▶ Play Liked Songs</button>
          <button class="secondary-button" data-action="play-list" data-list="wavemix" type="button">⇄ WaveMix</button>
        </div>
      </section>

      ${renderPlaylistSection("Your Playlists", [
        getPlaylistMeta("liked"),
        getPlaylistMeta("on-repeat")
      ])}

      ${renderSongSection("Recently Played", recentlyPlayed, "Songs you play will appear here.")}
      ${renderSongSection("Recently Added", recentlyAdded, "Add songs in js/library.js and they appear here.")}
      ${renderAlbumSection("Albums", albums)}
    `;
  }

  function renderSearch() {
    const query = state.currentQuery;
    const songs = WaveifySearch.findSongs(state.songs, query);
    const albums = WaveifySearch.findAlbums(state.albums, query);

    elements.stage.innerHTML = `
      <header class="page-heading compact-heading">
        <h1>Search</h1>
        <p>${query ? `Results for ${WaveifyUI.escapeHTML(query)}` : "Find songs, albums, years, and genres."}</p>
      </header>
      ${renderSongList("Songs", songs, "No songs matched your search.")}
      ${renderAlbumSection("Albums", albums)}
    `;
  }

  function renderSystemPlaylist(type) {
    const meta = getPlaylistMeta(type);
    state.currentView = type === "liked" ? "liked" : "playlist";
    state.rerender = () => renderSystemPlaylist(type);
    setActiveNavigation(type === "liked" ? "liked" : "");

    elements.stage.innerHTML = `
      <section class="playlist-heading">
        <img src="${meta.cover}" alt="${WaveifyUI.escapeHTML(meta.title)} artwork" ${WaveifyUI.imageFallback()}>
        <div>
          <p class="eyebrow">Playlist</p>
          <h1>${WaveifyUI.escapeHTML(meta.title)}</h1>
          <p>${WaveifyUI.escapeHTML(meta.description)}</p>
          <div class="hero-actions">
            <button class="primary-button" data-action="play-list" data-list="${type}" type="button">▶ Play</button>
            <button class="secondary-button" data-action="play-list" data-list="${type}-shuffle" type="button">⇄ Smart Shuffle</button>
          </div>
        </div>
      </section>
      ${renderSongList("Songs", meta.songs, meta.emptyMessage)}
    `;
  }

  function renderAlbum(albumKey) {
    state.currentView = "album";
    state.rerender = () => renderAlbum(albumKey);
    setActiveNavigation("");
    const album = state.albums.find((candidate) => candidate.key === albumKey);
    if (!album) return;

    elements.stage.innerHTML = `
      <section class="entity-heading">
        <img src="${WaveifyUI.cover(album.cover)}" alt="${WaveifyUI.escapeHTML(album.title)} cover" ${WaveifyUI.imageFallback()}>
        <div><p class="eyebrow">Album</p><h1>${WaveifyUI.escapeHTML(album.title)}</h1><p>${getAlbumSubtitle(album)}</p></div>
      </section>
      ${renderSongList("Track List", album.songs)}
    `;
  }

  function renderQuickMixes() {
    const panel = document.getElementById("quickMixesList");
    if (!panel) return;
    panel.innerHTML = [
      getPlaylistMeta("liked"),
      getPlaylistMeta("on-repeat"),
      getPlaylistMeta("wavemix"),
      getPlaylistMeta("recently-added")
    ].map((playlist) => `
      <button class="quick-mix" data-action="open-playlist" data-playlist="${playlist.type}" type="button">
        <img src="${playlist.cover}" alt="" ${WaveifyUI.imageFallback()}>
        <span>${WaveifyUI.escapeHTML(playlist.title)}</span>
      </button>`).join("");
  }

  function renderPlaylistSection(title, playlists) {
    return `<section class="section-block"><div class="section-head"><h2>${WaveifyUI.escapeHTML(title)}</h2></div><div class="playlist-grid">${playlists.map(renderPlaylistCard).join("")}</div></section>`;
  }

  function renderPlaylistCard(playlist) {
    return `
      <article class="playlist-card-large" data-action="open-playlist" data-playlist="${playlist.type}">
        <img src="${playlist.cover}" alt="${WaveifyUI.escapeHTML(playlist.title)} artwork" ${WaveifyUI.imageFallback()}>
        <div>
          <h3>${WaveifyUI.escapeHTML(playlist.title)}</h3>
          <p>${WaveifyUI.escapeHTML(playlist.subtitle)}</p>
        </div>
      </article>`;
  }

  function renderSongSection(title, songs, emptyMessage) {
    return `<section class="section-block"><div class="section-head"><h2>${WaveifyUI.escapeHTML(title)}</h2></div><div class="grid card-grid">${songs.length ? songs.map((song) => WaveifyUI.songCard(song, isFavourite(song.id), getBoostValue(song.id))).join("") : WaveifyUI.emptyState(emptyMessage || "No songs to show.")}</div></section>`;
  }

  function renderSongList(title, songs, emptyMessage) {
    return `<section class="section-block"><div class="section-head"><h2>${WaveifyUI.escapeHTML(title)}</h2></div><div class="track-list">${songs.length ? songs.map((song, index) => WaveifyUI.trackRow(song, index, isFavourite(song.id), { boostValue: getBoostValue(song.id), weight: getSongWeight(song) })).join("") : WaveifyUI.emptyState(emptyMessage || "No songs to show.")}</div></section>`;
  }

  function renderAlbumSection(title, albums) {
    return `<section class="section-block"><div class="section-head"><h2>${WaveifyUI.escapeHTML(title)}</h2></div><div class="grid card-grid">${albums.length ? albums.map((album) => `<article class="media-card" data-action="album" data-album-key="${WaveifyUI.escapeHTML(album.key)}"><img src="${WaveifyUI.cover(album.cover)}" alt="${WaveifyUI.escapeHTML(album.title)} cover" ${WaveifyUI.imageFallback()}><h3>${WaveifyUI.escapeHTML(album.title)}</h3><p>${getAlbumSubtitle(album)}</p></article>`).join("") : WaveifyUI.emptyState("Create albums in js/library.js to show them here.")}</div></section>`;
  }

  function getAlbumSubtitle(album) {
    const parts = [album.artist, album.year, `${album.songs.length} songs`].filter(Boolean);
    return WaveifyUI.escapeHTML(parts.join(" • "));
  }

  function getPlaylistMeta(type) {
    const map = {
      liked: {
        type: "liked",
        title: "Liked Songs",
        cover: PLAYLIST_ART.liked,
        songs: getLikedSongs(),
        emptyMessage: "Like songs to build your main collection."
      },
      "on-repeat": {
        type: "on-repeat",
        title: "On Repeat",
        cover: PLAYLIST_ART.onRepeat,
        songs: getOnRepeatSongs(),
        emptyMessage: "Play songs a few times and your repeats will appear here."
      },
      wavemix: {
        type: "wavemix",
        title: "WaveMix",
        cover: PLAYLIST_ART.waveMix,
        songs: state.songs,
        emptyMessage: "Add songs to your library to start WaveMix."
      },
      "recently-played": {
        type: "recently-played",
        title: "Recently Played",
        cover: PLAYLIST_ART.recentlyPlayed,
        songs: getRecentlyPlayedSongs(),
        emptyMessage: "Songs you play will appear here."
      },
      "recently-added": {
        type: "recently-added",
        title: "Recently Added",
        cover: PLAYLIST_ART.recentlyAdded,
        songs: getRecentlyAddedSongs(),
        emptyMessage: "Newest songs from library.js appear here."
      },
      "most-played": {
        type: "most-played",
        title: "Most Played",
        cover: PLAYLIST_ART.mostPlayed,
        songs: getMostPlayedSongs(),
        emptyMessage: "Play counts will build this playlist over time."
      },
      "all-songs": {
        type: "all-songs",
        title: "All Songs",
        cover: PLAYLIST_ART.allSongs,
        songs: state.songs,
        emptyMessage: "Add songs in js/library.js."
      }
    };
    const playlist = map[type] || map.liked;
    return {
      ...playlist,
      subtitle: `${playlist.songs.length} songs`,
      description: getPlaylistDescription(playlist)
    };
  }

  function getPlaylistDescription(playlist) {
    if (playlist.type === "on-repeat") return `${playlist.songs.length} songs ranked by plays, repeats, listening time, and recent activity.`;
    if (playlist.type === "wavemix") return "Smart weighted shuffle using likes, boosts, and recent listening behaviour.";
    return `${playlist.songs.length} songs in this playlist.`;
  }

  function playSongList(listName) {
    const baseType = listName.replace("-shuffle", "");
    const playlist = getPlaylistMeta(baseType === "all" ? "wavemix" : baseType);
    const targetSongs = playlist.songs.length ? playlist.songs : state.songs;
    if (!targetSongs.length) return;

    if (listName.includes("shuffle") || listName === "wavemix" || listName === "all") {
      WaveifyPlayer.startSmartShuffle(targetSongs.map((song) => song.id));
      return;
    }

    WaveifyPlayer.playSong(targetSongs[0].id);
  }

  function getLikedSongs() {
    return state.songs.filter((song) => isFavourite(song.id));
  }

  function getRecentlyPlayedSongs() {
    return idsToSongs(state.recent);
  }

  function getRecentlyAddedSongs() {
    return state.songs.slice().reverse();
  }

  function getMostPlayedSongs() {
    return state.songs.slice().sort((a, b) => getStats(b.id).playCount - getStats(a.id).playCount);
  }

  function getOnRepeatSongs() {
    return state.songs
      .map((song) => ({ song, score: getRepeatScore(song.id) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.song);
  }

  function getRepeatScore(songId) {
    const stats = getStats(songId);
    const recentIndex = state.recent.indexOf(songId);
    const recentBoost = recentIndex >= 0 ? Math.max(0, 18 - recentIndex * 2) : 0;
    return stats.playCount * 8 + stats.repeatCount * 12 + Math.floor(stats.listenSeconds / 30) + recentBoost;
  }

  function isFavourite(songId) {
    return state.favourites.includes(songId);
  }

  function toggleFavourite(songId) {
    if (!songId) return;
    state.favourites = isFavourite(songId)
      ? state.favourites.filter((id) => id !== songId)
      : [...state.favourites, songId];
    WaveifyStorage.saveFavourites(state.favourites);
    WaveifyPlayer.refreshFavouriteState();
    renderQuickMixes();
    if (state.rerender) state.rerender();
  }

  function migrateBoostsToWeightModel() {
    const settings = WaveifyStorage.getSettings();
    if (settings.boostModelVersion === 2) return;

    state.boosts = Object.fromEntries(
      Object.entries(state.boosts)
        .map(([songId, oldValue]) => [songId, clampBoostWeight(1 + Number(oldValue || 0) * 0.1)])
        .filter(([, weight]) => weight !== 1)
    );

    WaveifyStorage.saveBoosts(state.boosts);
    WaveifyStorage.saveSettings({ ...settings, boostModelVersion: 2 });
  }

  function changeBoost(songId, direction) {
    if (!songId) return;
    const nextValue = clampBoostWeight(getBoostValue(songId) + Math.sign(direction) * 0.1);
    if (nextValue === 1) {
      delete state.boosts[songId];
    } else {
      state.boosts[songId] = nextValue;
    }
    WaveifyStorage.saveBoosts(state.boosts);
    WaveifyPlayer.updateBoostControls();
    if (state.rerender) state.rerender();
  }

  function getBoostValue(songId) {
    return clampBoostWeight(Number(state.boosts[songId] || 1));
  }

  function getSongWeight(song) {
    return getBoostValue(song.id);
  }

  function clampBoostWeight(value) {
    const safeValue = Number.isFinite(value) ? value : 1;
    return Math.round(Math.max(0.1, Math.min(5, safeValue)) * 10) / 10;
  }

  function recordPlay(songId) {
    const stats = getStats(songId);
    stats.playCount += 1;
    stats.lastPlayedAt = Date.now();
    state.listeningStats[songId] = stats;
    WaveifyStorage.saveListeningStats(state.listeningStats);
    state.recent = [songId, ...state.recent.filter((id) => id !== songId)].slice(0, 30);
    WaveifyStorage.saveRecent(state.recent);
  }

  function recordRepeat(songId) {
    const stats = getStats(songId);
    stats.repeatCount += 1;
    state.listeningStats[songId] = stats;
    WaveifyStorage.saveListeningStats(state.listeningStats);
  }

  function recordListeningTime(songId, seconds) {
    if (!songId || seconds <= 0) return;
    const stats = getStats(songId);
    stats.listenSeconds += seconds;
    state.listeningStats[songId] = stats;
    WaveifyStorage.saveListeningStats(state.listeningStats);
  }

  function getStats(songId) {
    return {
      playCount: 0,
      repeatCount: 0,
      listenSeconds: 0,
      lastPlayedAt: 0,
      ...(state.listeningStats[songId] || {})
    };
  }

  function idsToSongs(songIds) {
    const songMap = new Map(state.songs.map((song) => [song.id, song]));
    return songIds.map((songId) => songMap.get(songId)).filter(Boolean);
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", WaveifyApp.init);
