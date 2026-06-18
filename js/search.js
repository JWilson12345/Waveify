/*
  search.js
  ---------
  Fast in-browser search for songs and albums. No APIs and no internet
  requests are used; everything comes from library.js.
*/

const WaveifySearch = (() => {
  function clean(value) {
    return String(value || "").toLowerCase().trim();
  }

  function findSongs(songs, query) {
    const target = clean(query);
    if (!target) return songs;

    return songs.filter((song) => {
      const searchableText = [song.title, song.artist, song.album, song.genre, song.year]
        .map(clean)
        .join(" ");
      return searchableText.includes(target);
    });
  }

  function findAlbums(albums, query) {
    const target = clean(query);

    return albums
      .filter((album) => {
        if (!target) return true;
        const songTitles = album.songs.map((song) => song.title).join(" ");
        return clean(`${album.title} ${album.artist} ${album.year} ${album.description} ${songTitles}`).includes(target);
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  return { findSongs, findAlbums };
})();
