/*
  storage.js
  ----------
  A tiny wrapper around localStorage. Browser storage is kept here so saved
  liked songs, boost weights, recently played songs, and settings do not leak
  throughout the codebase.
*/

const WaveifyStorage = (() => {
  const keys = {
    favourites: "waveify:favourites",
    recent: "waveify:recent",
    boosts: "waveify:boosts",
    listeningStats: "waveify:listeningStats",
    settings: "waveify:settings"
  };

  function read(key, fallback) {
    try {
      const savedValue = localStorage.getItem(key);
      return savedValue ? JSON.parse(savedValue) : fallback;
    } catch (error) {
      console.warn("Waveify could not read local storage:", error);
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn("Waveify could not save local storage:", error);
    }
  }

  return {
    getFavourites: () => read(keys.favourites, []),
    saveFavourites: (songIds) => write(keys.favourites, songIds),
    getRecent: () => read(keys.recent, []),
    saveRecent: (songIds) => write(keys.recent, songIds.slice(0, 30)),
    getBoosts: () => read(keys.boosts, {}),
    saveBoosts: (boosts) => write(keys.boosts, boosts),
    getListeningStats: () => read(keys.listeningStats, {}),
    saveListeningStats: (stats) => write(keys.listeningStats, stats),
    getSettings: () => read(keys.settings, { volume: 0.8, theme: "default" }),
    saveSettings: (settings) => write(keys.settings, settings)
  };
})();
