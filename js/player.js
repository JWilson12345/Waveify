/*
  player.js
  ---------
  Spotify-style player with Waveify's smart weighted shuffle and a simple,
  reliable crossfade. Two audio elements are used so the next song can fade in
  while the current song fades out.
*/

const WaveifyPlayer = (() => {
  const CROSSFADE_MODES = {
    off: { seconds: 0, label: "Off" },
    short: { seconds: 2, label: "Short" },
    normal: { seconds: 4, label: "Normal" },
    aggressive: { seconds: 7, label: "Aggressive" }
  };

  let songs = [];
  let songMap = new Map();
  let currentSong = null;
  let currentIndex = -1;
  let shuffleEnabled = false;
  let shufflePoolIds = null;
  let repeatEnabled = false;
  let lastProgressTime = 0;
  let callbacks = {};
  let crossfadeMode = "normal";
  let masterVolume = 0.8;
  let isTransitioning = false;
  let activeAudio = null;
  let standbyAudio = null;
  let monitorTimer = null;
  let failedSongIds = new Set();
  let handlingFailureForSongId = null;
  let lastMediaPositionUpdate = 0;

  const primaryAudio = document.getElementById("audioPlayer");
  const secondaryAudio = new Audio();
  secondaryAudio.preload = "metadata";

  const elements = {
    shell: document.getElementById("appShell"),
    cover: document.getElementById("playerCover"),
    title: document.getElementById("playerTitle"),
    artist: document.getElementById("playerArtist"),
    favourite: document.getElementById("playerFavouriteButton"),
    playPause: document.getElementById("playPauseButton"),
    previous: document.getElementById("previousButton"),
    next: document.getElementById("nextButton"),
    shuffle: document.getElementById("shuffleButton"),
    repeat: document.getElementById("repeatButton"),
    boostDown: document.getElementById("playerBoostDownButton"),
    boostUp: document.getElementById("playerBoostUpButton"),
    boostPill: document.getElementById("playerBoostPill"),
    progress: document.getElementById("progressSlider"),
    currentTime: document.getElementById("currentTime"),
    totalTime: document.getElementById("totalTime"),
    volume: document.getElementById("volumeSlider"),
    crossfadeMode: document.getElementById("crossfadeMode"),
    fullscreenButton: document.getElementById("fullscreenButton"),
    fullscreen: document.getElementById("fullscreenPlayer"),
    closeFullscreen: document.getElementById("closeFullscreenButton"),
    fullscreenCover: document.getElementById("fullscreenCover"),
    fullscreenTitle: document.getElementById("fullscreenTitle"),
    fullscreenArtist: document.getElementById("fullscreenArtist"),
    lyrics: document.getElementById("lyricsPanel")
  };

  function init(options) {
    songs = options.songs;
    callbacks = options.callbacks || {};
    songMap = new Map(songs.map((song) => [song.id, song]));

    const settings = WaveifyStorage.getSettings();
    masterVolume = settings.volume ?? 0.8;
    crossfadeMode = settings.crossfadeMode || "normal";
    elements.volume.value = masterVolume;
    if (elements.crossfadeMode) elements.crossfadeMode.value = crossfadeMode;

    activeAudio = primaryAudio;
    standbyAudio = secondaryAudio;
    activeAudio.volume = masterVolume;
    standbyAudio.volume = 0;

    bindEvents();
    setupMediaSession();
    updatePlayerUI();
  }

  function bindEvents() {
    elements.playPause.addEventListener("click", togglePlay);
    elements.previous.addEventListener("click", playPrevious);
    elements.next.addEventListener("click", playNext);
    elements.shuffle.addEventListener("click", toggleShuffle);
    elements.repeat.addEventListener("click", toggleRepeat);
    elements.boostDown.addEventListener("click", () => currentSong && callbacks.changeBoost?.(currentSong.id, -1));
    elements.boostUp.addEventListener("click", () => currentSong && callbacks.changeBoost?.(currentSong.id, 1));
    elements.favourite.addEventListener("click", () => currentSong && callbacks.toggleFavourite?.(currentSong.id));
    elements.progress.addEventListener("input", seek);
    elements.volume.addEventListener("input", updateVolume);
    elements.crossfadeMode?.addEventListener("change", updateCrossfadeMode);
    elements.fullscreenButton.addEventListener("click", openFullscreen);
    elements.closeFullscreen.addEventListener("click", closeFullscreen);

    [primaryAudio, secondaryAudio].forEach((audio) => {
      audio.addEventListener("loadedmetadata", () => audio === activeAudio && updateTimeDisplay());
      audio.addEventListener("timeupdate", () => audio === activeAudio && updateTimeDisplay());
      audio.addEventListener("play", () => audio === activeAudio && setPlayingState(true));
      audio.addEventListener("pause", () => audio === activeAudio && !isTransitioning && setPlayingState(false));
      audio.addEventListener("ended", () => audio === activeAudio && handleSongEnd());
      audio.addEventListener("error", () => handleAudioError(audio));
    });

    document.addEventListener("keydown", handleKeyboardShortcuts);
    monitorTimer = window.setInterval(monitorCrossfadeStart, 250);
  }

  function playSong(songId) {
    const song = songMap.get(songId);
    if (!song) return;
    activateSongImmediately(song);
  }

  function activateSongImmediately(song) {
    isTransitioning = false;
    pauseAndReset(standbyAudio);
    activeAudio.pause();
    activeAudio.volume = masterVolume;
    standbyAudio.volume = 0;
    currentSong = song;
    currentIndex = songs.findIndex((candidate) => candidate.id === song.id);
    lastProgressTime = 0;
    activeAudio.src = song.file;
    activeAudio.waveifySongId = song.id;
    updateMediaSessionMetadata(song);
    updateMediaSessionPlaybackState("paused");
    activeAudio.play()
      .then(() => {
        failedSongIds.delete(song.id);
        callbacks.onSongPlayed?.(song.id);
      })
      .catch((error) => handlePlayRejection(activeAudio, song, error));

    updatePlayerUI();
    loadLyrics(song);
  }

  function togglePlay() {
    if (!currentSong && songs[0]) {
      playSong(songs[0].id);
      return;
    }

    if (activeAudio.paused) {
      resumePlayback();
    } else {
      pausePlayback();
    }
  }

  function resumePlayback() {
    if (!currentSong && songs[0]) {
      playSong(songs[0].id);
      return;
    }

    activeAudio.play().catch((error) => {
      if (currentSong) {
        handlePlayRejection(activeAudio, currentSong, error);
      } else {
        WaveifyUI.toast("Choose a song first.");
      }
    });
    if (isTransitioning && standbyAudio.src) standbyAudio.play().catch(() => {});
  }

  function pausePlayback() {
    activeAudio.pause();
    standbyAudio.pause();
    setPlayingState(false);
  }

  function playNext() {
    const nextSong = getNextSong();
    if (!nextSong) return;

    activateSongImmediately(nextSong);
  }

  function getNextSong() {
    if (shuffleEnabled && songs.length > 1) return pickSmartShuffleSong();
    if (!songs.length) return null;

    const startIndex = currentIndex + 1 >= songs.length ? 0 : currentIndex + 1;
    for (let offset = 0; offset < songs.length; offset += 1) {
      const candidate = songs[(startIndex + offset) % songs.length];
      if (!failedSongIds.has(candidate.id)) return candidate;
    }

    return null;
  }

  function playPrevious() {
    const previousSong = getPreviousSong();
    if (previousSong) activateSongImmediately(previousSong);
  }

  function getPreviousSong() {
    if (!songs.length) return null;

    const startIndex = currentIndex <= 0 ? songs.length - 1 : currentIndex - 1;
    for (let offset = 0; offset < songs.length; offset += 1) {
      const candidateIndex = (startIndex - offset + songs.length) % songs.length;
      const candidate = songs[candidateIndex];
      if (!failedSongIds.has(candidate.id)) return candidate;
    }

    return null;
  }

  function pickSmartShuffleSong() {
    const recentIds = callbacks.getRecentSongIds?.() || [];
    const pool = shufflePoolIds ? songs.filter((song) => shufflePoolIds.has(song.id)) : songs;
    const weightedSongs = pool
      .filter((song) => song.id !== currentSong?.id)
      .filter((song) => !failedSongIds.has(song.id))
      .map((song) => {
        let weight = callbacks.getSongWeight?.(song) || 1;
        const recentIndex = recentIds.indexOf(song.id);
        if (recentIndex >= 0) weight *= Math.max(0.18, 0.35 + recentIndex * 0.08);
        return { song, weight: Math.max(0.05, weight) };
      });

    const totalWeight = weightedSongs.reduce((sum, item) => sum + item.weight, 0);
    let pointer = Math.random() * totalWeight;

    for (const item of weightedSongs) {
      pointer -= item.weight;
      if (pointer <= 0) return item.song;
    }

    return weightedSongs[0]?.song || null;
  }

  function monitorCrossfadeStart() {
    const crossfadeSeconds = getCrossfadeSeconds();
    if (!currentSong || repeatEnabled || isTransitioning || activeAudio.paused || crossfadeSeconds <= 0) return;
    if (!Number.isFinite(activeAudio.duration) || activeAudio.duration <= 0) return;

    const remaining = activeAudio.duration - activeAudio.currentTime;
    if (remaining > 0 && remaining <= crossfadeSeconds) {
      const nextSong = getNextSong();
      if (nextSong) startCrossfade(nextSong, Math.min(crossfadeSeconds, remaining));
    }
  }

  function startCrossfade(nextSong, duration) {
    if (isTransitioning || !nextSong || nextSong.id === currentSong?.id) return;
    isTransitioning = true;

    const outgoingAudio = activeAudio;
    const incomingAudio = standbyAudio;
    incomingAudio.src = nextSong.file;
    incomingAudio.currentTime = 0;
    incomingAudio.volume = 0;
    incomingAudio.waveifySongId = nextSong.id;
    updateMediaSessionMetadata(nextSong);

    incomingAudio.play().then(() => {
      failedSongIds.delete(nextSong.id);
      animateCrossfade(outgoingAudio, incomingAudio, nextSong, Math.max(0.4, duration));
    }).catch((error) => handlePlayRejection(incomingAudio, nextSong, error));
  }

  function animateCrossfade(outgoingAudio, incomingAudio, nextSong, duration) {
    const start = performance.now();
    const total = duration * 1000;

    function step(now) {
      const progress = clamp((now - start) / total, 0, 1);
      const eased = progress * progress * (3 - 2 * progress);
      outgoingAudio.volume = masterVolume * (1 - eased);
      incomingAudio.volume = masterVolume * eased;

      if (progress < 1 && isTransitioning) {
        requestAnimationFrame(step);
        return;
      }

      outgoingAudio.pause();
      outgoingAudio.currentTime = 0;
      outgoingAudio.volume = 0;
      [activeAudio, standbyAudio] = [standbyAudio, activeAudio];
      activeAudio.volume = masterVolume;
      standbyAudio.volume = 0;
      currentSong = nextSong;
      currentIndex = songs.findIndex((candidate) => candidate.id === nextSong.id);
      lastProgressTime = activeAudio.currentTime || 0;
      isTransitioning = false;
      callbacks.onSongPlayed?.(nextSong.id);
      updatePlayerUI();
      loadLyrics(nextSong);
      setPlayingState(!activeAudio.paused);
    }

    requestAnimationFrame(step);
  }

  function handleSongEnd() {
    if (isTransitioning) return;
    if (repeatEnabled) {
      if (currentSong) callbacks.onSongRepeated?.(currentSong.id);
      activeAudio.currentTime = 0;
      activeAudio.play();
      return;
    }
    playNext();
  }

  function handleAudioError(audio) {
    const song = audio === activeAudio ? currentSong : songMap.get(audio.waveifySongId);
    if (!song) return;
    handlePlaybackFailure(audio, song);
  }

  function handlePlayRejection(audio, song, error) {
    if (error?.name === "NotAllowedError") {
      setPlayingState(false);
      WaveifyUI.toast("Press play to start playback.");
      return;
    }

    handlePlaybackFailure(audio, song);
  }

  function handlePlaybackFailure(audio, song) {
    if (!song || handlingFailureForSongId === song.id) return;

    handlingFailureForSongId = song.id;
    window.setTimeout(() => {
      if (handlingFailureForSongId === song.id) handlingFailureForSongId = null;
    }, 1000);

    failedSongIds.add(song.id);
    WaveifyUI.toast(`Skipping ${song.title}. File could not be played.`);

    if (audio === standbyAudio && isTransitioning) {
      pauseAndReset(standbyAudio);
      isTransitioning = false;
      activeAudio.volume = masterVolume;
      const fallbackSong = getNextSong();
      if (fallbackSong) {
        startCrossfade(fallbackSong, Math.min(getCrossfadeSeconds() || 2, 2));
      } else {
        stopPlaybackAfterFailure();
      }
      return;
    }

    if (audio !== activeAudio) return;

    isTransitioning = false;
    pauseAndReset(standbyAudio);
    const nextSong = getNextSong();
    if (nextSong) {
      activateSongImmediately(nextSong);
    } else {
      stopPlaybackAfterFailure();
    }
  }

  function stopPlaybackAfterFailure() {
    pauseAndReset(activeAudio);
    pauseAndReset(standbyAudio);
    setPlayingState(false);
    elements.progress.value = 0;
    elements.currentTime.textContent = "0:00";
    elements.totalTime.textContent = currentSong?.duration || "0:00";
    WaveifyUI.toast("No playable songs found. Check your music file paths.");
  }

  function toggleShuffle() {
    shuffleEnabled = !shuffleEnabled;
    if (!shuffleEnabled) shufflePoolIds = null;
    elements.shuffle.classList.toggle("active", shuffleEnabled);
    WaveifyUI.toast(shuffleEnabled ? "Smart shuffle on" : "Shuffle off");
  }

  function startSmartShuffle(songIds) {
    shufflePoolIds = new Set(songIds || songs.map((song) => song.id));
    shuffleEnabled = true;
    elements.shuffle.classList.add("active");
    const nextSong = pickSmartShuffleSong();
    if (nextSong) activateSongImmediately(nextSong);
  }

  function toggleRepeat() {
    repeatEnabled = !repeatEnabled;
    elements.repeat.classList.toggle("active", repeatEnabled);
    WaveifyUI.toast(repeatEnabled ? "Repeat on" : "Repeat off");
  }

  function updatePlayerUI() {
    const favourite = currentSong && callbacks.isFavourite?.(currentSong.id);
    elements.cover.src = currentSong ? WaveifyUI.cover(currentSong.cover) : WaveifyUI.defaultCover;
    elements.title.textContent = currentSong ? currentSong.title : "Choose a song";
    elements.artist.textContent = currentSong ? currentSong.artist : "Waveify is ready";
    elements.favourite.textContent = favourite ? "♥" : "♡";
    elements.favourite.classList.toggle("active", Boolean(favourite));
    elements.fullscreenCover.src = currentSong ? WaveifyUI.cover(currentSong.cover) : WaveifyUI.defaultCover;
    elements.fullscreenTitle.textContent = currentSong ? currentSong.title : "Choose a song";
    elements.fullscreenArtist.textContent = currentSong ? currentSong.artist : "Waveify is ready";
    updateMediaSessionMetadata(currentSong);
    updateBoostControls();
    highlightCurrentTrack();
  }

  function refreshFavouriteState() {
    updatePlayerUI();
  }

  function updateBoostControls() {
    const boostValue = currentSong ? Number(callbacks.getBoostValue?.(currentSong.id) || 1) : 1;
    if (elements.boostPill) {
      elements.boostPill.textContent = `×${boostValue.toFixed(1)}`;
      elements.boostPill.classList.toggle("positive", boostValue > 1);
      elements.boostPill.classList.toggle("negative", boostValue < 1);
    }
    elements.boostDown.disabled = !currentSong;
    elements.boostUp.disabled = !currentSong;
  }

  function updateTimeDisplay() {
    const duration = Number.isFinite(activeAudio.duration) ? activeAudio.duration : 0;
    if (currentSong && activeAudio.currentTime >= lastProgressTime) {
      const delta = activeAudio.currentTime - lastProgressTime;
      if (delta > 0 && delta < 4) callbacks.onListeningProgress?.(currentSong.id, delta);
    }
    lastProgressTime = activeAudio.currentTime || 0;
    elements.currentTime.textContent = WaveifyUI.formatSeconds(activeAudio.currentTime);
    elements.totalTime.textContent = duration ? WaveifyUI.formatSeconds(duration) : (currentSong?.duration || "0:00");
    elements.progress.value = duration ? (activeAudio.currentTime / duration) * 100 : 0;
    updateMediaSessionPosition();
  }

  function seek() {
    if (!Number.isFinite(activeAudio.duration)) return;
    activeAudio.currentTime = (Number(elements.progress.value) / 100) * activeAudio.duration;
  }

  function updateVolume() {
    masterVolume = Number(elements.volume.value);
    const settings = WaveifyStorage.getSettings();
    WaveifyStorage.saveSettings({ ...settings, volume: masterVolume });
    if (!isTransitioning) activeAudio.volume = masterVolume;
  }

  function updateCrossfadeMode() {
    crossfadeMode = elements.crossfadeMode.value;
    const settings = WaveifyStorage.getSettings();
    WaveifyStorage.saveSettings({ ...settings, crossfadeMode });
    WaveifyUI.toast(`Crossfade: ${getCrossfadeMode().label}`);
  }

  function setPlayingState(isPlaying) {
    elements.shell.classList.toggle("is-playing", isPlaying);
    elements.playPause.textContent = isPlaying ? "Ⅱ" : "▶";
    updateMediaSessionPlaybackState(isPlaying ? "playing" : "paused");
    updateMediaSessionPosition(true);
    highlightCurrentTrack();
  }

  function highlightCurrentTrack() {
    document.querySelectorAll(".track-row.playing").forEach((row) => row.classList.remove("playing"));
    if (!currentSong) return;
    document.querySelectorAll(`.track-row[data-song-id="${CSS.escape(currentSong.id)}"]`).forEach((row) => row.classList.add("playing"));
  }

  function openFullscreen() {
    elements.fullscreen.classList.add("open");
    elements.fullscreen.setAttribute("aria-hidden", "false");
  }

  function closeFullscreen() {
    elements.fullscreen.classList.remove("open");
    elements.fullscreen.setAttribute("aria-hidden", "true");
  }

  function setupMediaSession() {
    if (!supportsMediaSession()) return;

    safeSetMediaSessionHandler("play", resumePlayback);
    safeSetMediaSessionHandler("pause", pausePlayback);
    safeSetMediaSessionHandler("previoustrack", playPrevious);
    safeSetMediaSessionHandler("nexttrack", playNext);
    safeSetMediaSessionHandler("seekbackward", null);
    safeSetMediaSessionHandler("seekforward", null);
    updateMediaSessionMetadata(currentSong);
    updateMediaSessionPlaybackState("none");
  }

  function supportsMediaSession() {
    return "mediaSession" in navigator;
  }

  function safeSetMediaSessionHandler(action, handler) {
    try {
      navigator.mediaSession.setActionHandler(action, handler);
    } catch (error) {
      console.debug(`Media Session action not supported: ${action}`, error);
    }
  }

  function updateMediaSessionMetadata(song) {
    if (!supportsMediaSession() || typeof window.MediaMetadata !== "function") return;

    const artworkSrc = mediaUrl(song?.cover || WaveifyUI.defaultCover);
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: song?.title || "Choose a song",
      artist: song?.artist || "Waveify",
      album: song?.album || "Personal stream",
      artwork: [
        { src: artworkSrc, sizes: "96x96", type: imageMimeType(artworkSrc) },
        { src: artworkSrc, sizes: "128x128", type: imageMimeType(artworkSrc) },
        { src: artworkSrc, sizes: "192x192", type: imageMimeType(artworkSrc) },
        { src: artworkSrc, sizes: "256x256", type: imageMimeType(artworkSrc) },
        { src: artworkSrc, sizes: "512x512", type: imageMimeType(artworkSrc) },
        { src: artworkSrc, sizes: "1024x1024", type: imageMimeType(artworkSrc) }
      ]
    });
  }

  function updateMediaSessionPlaybackState(state) {
    if (!supportsMediaSession()) return;
    try {
      navigator.mediaSession.playbackState = state;
    } catch (error) {
      console.debug("Media Session playback state could not be updated.", error);
    }
  }

  function updateMediaSessionPosition(force = false) {
    if (!supportsMediaSession() || typeof navigator.mediaSession.setPositionState !== "function") return;
    if (!currentSong || !Number.isFinite(activeAudio.duration) || activeAudio.duration <= 0) return;

    const now = Date.now();
    if (!force && now - lastMediaPositionUpdate < 1000) return;
    lastMediaPositionUpdate = now;

    try {
      navigator.mediaSession.setPositionState({
        duration: activeAudio.duration,
        playbackRate: activeAudio.playbackRate || 1,
        position: Math.min(activeAudio.currentTime || 0, activeAudio.duration)
      });
    } catch (error) {
      console.debug("Media Session position state could not be updated.", error);
    }
  }

  function mediaUrl(path) {
    try {
      return new URL(path, window.location.href).href;
    } catch (error) {
      return path;
    }
  }

  function imageMimeType(src) {
    const cleanSrc = String(src || "").split("?")[0].toLowerCase();
    if (cleanSrc.endsWith(".jpg") || cleanSrc.endsWith(".jpeg")) return "image/jpeg";
    if (cleanSrc.endsWith(".webp")) return "image/webp";
    if (cleanSrc.endsWith(".svg")) return "image/svg+xml";
    return "image/png";
  }

  async function loadLyrics(song) {
    elements.lyrics.textContent = "";
    if (!song.lyrics) return;

    try {
      const response = await fetch(song.lyrics);
      if (!response.ok) return;
      elements.lyrics.textContent = await response.text();
    } catch (error) {
      console.warn("Lyrics could not be loaded:", error);
    }
  }

  function handleKeyboardShortcuts(event) {
    const tag = event.target.tagName.toLowerCase();
    if (["input", "textarea", "select"].includes(tag)) return;

    if (event.code === "Space") {
      event.preventDefault();
      togglePlay();
    }
    if (event.code === "ArrowRight") playNext();
    if (event.code === "ArrowLeft") playPrevious();
    if (event.key.toLowerCase() === "f" && currentSong) callbacks.toggleFavourite?.(currentSong.id);
  }

  function getCrossfadeMode() {
    return CROSSFADE_MODES[crossfadeMode] || CROSSFADE_MODES.normal;
  }

  function getCrossfadeSeconds() {
    return getCrossfadeMode().seconds;
  }

  function pauseAndReset(audio) {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  return { init, playSong, playNext, playPrevious, startSmartShuffle, refreshFavouriteState, updateBoostControls };
})();
