/*
  Waveify music library
  ---------------------
  This is the only file you edit when adding or removing songs.

  To add a song:
  1. Copy the MP3 into the /music folder.
  2. Copy the cover image into the /images folder.
  3. Duplicate one song object below.
  4. Change the values to match your song.
  5. Refresh index.html in your browser.

  Optional fields:
  - artistImage: image shown on generated artist pages.
  - lyrics: path to a plain text lyrics file, for example "lyrics/song-name.txt".

  Copy/paste template:
  {
    title: "Song Name",
    artist: "Artist Name",
    album: "Album Name",
    genre: "Genre",
    year: 2026,
    duration: "3:20",
    file: "music/song-file-name.mp3",
    cover: "images/cover-file-name.jpg",
    artistImage: "images/artist-file-name.jpg",
    lyrics: ""
  },
*/

const library = [
  {
  title: "CORACAO TEU - SUPER SLOWED",
  artist: "tvoy, fenekot",
  album: "CORACAO TEU",
  genre: "Brazilian Funk / Phonk",
  year: 2026,
  duration: "5:20",
  file: "music/CORACAO TEU - SUPER SLOWED.mp3",
  cover: "images/CORACAO TEU - SUPER SLOWED.jpg",
  artistImage: "images/waveify-demo.jpg",
  lyrics: ""
},
{
  title: "TE PIENSO - Slowed",
  artist: "bxkq",
  album: "TE PIENSO",
  genre: "Brazilian Funk / Phonk",
  year: 2026,
  duration: "2:24",
  file: "music/TE PIENSO - Slowed.mp3",
  cover: "images/TE PIENSO Slowed.jpg",
  artistImage: "images/waveify-demo.jpg",
  lyrics: ""
},
{
  title: "FUNK LEVAR",
  artist: "Habazane, Yb Wasg'ood, vultury",
  album: "FUNK LEVAR",
  genre: "Brazilian Funk / Phonk",
  year: 2026,
  duration: "2:10",
  file: "music/FUNK LEVAR.mp3",
  cover: "images/FUNK LEVAR.jpg",
  artistImage: "images/waveify-demo.jpg",
  lyrics: ""
},
{
  title: "REBOLA - Super Slowed",
  artist: "QMIIR, SXYGX",
  album: "REBOLA",
  genre: "Brazilian Funk / Phonk",
  year: 2025,
  duration: "2:45",
  file: "music/REBOLA - Super Slowed.mp3",
  cover: "images/REBOLA - Super Slowed.jpg",
  artistImage: "images/waveify-demo.jpg",
  lyrics: ""
},
{
  title: "PERTO",
  artist: "SXYGX",
  album: "PERTO",
  genre: "Brazilian Funk / Phonk",
  year: 2025,
  duration: "2:18",
  file: "music/PERTO.mp3",
  cover: "images/PERTO.jpg",
  artistImage: "images/waveify-demo.jpg",
  lyrics: ""
},
{
  title: "SABE QUEBRAR - Ultra Slowed",
  artist: "bxkq, axeos",
  album: "SABE QUEBRAR",
  genre: "Brazilian Funk / Phonk",
  year: 2025,
  duration: "2:31",
  file: "music/SABE QUEBRAR - Ultra Slowed.mp3",
  cover: "images/SABE QUEBRAR - Ultra Slowed.jpg",
  artistImage: "images/waveify-demo.jpg",
  lyrics: ""
},
{
  title: "PASSO MARCADO",
  artist: "SXYGX",
  album: "PASSO MARCADO",
  genre: "Brazilian Funk / Phonk",
  year: 2025,
  duration: "2:12",
  file: "music/PASSO MARCADO.mp3",
  cover: "images/PASSO MARCADO.jpg",
  artistImage: "images/waveify-demo.jpg",
  lyrics: ""
},
{
  title: "PERDIDO - Super Slowed",
  artist: "SXYGX",
  album: "PERDIDO",
  genre: "Brazilian Funk / Phonk",
  year: 2025,
  duration: "2:34",
  file: "music/PERDIDO - Super Slowed.mp3",
  cover: "images/PERDIDO - Super Slowed.jpg",
  artistImage: "images/waveify-demo.jpg",
  lyrics: ""
},
{
  title: "AASHA",
  artist: "FEXTINGUISHER",
  album: "AASHA",
  genre: "Phonk",
  year: 2024,
  duration: "2:07",
  file: "music/AASHA.mp3",
  cover: "images/AASHA.jpg",
  artistImage: "images/waveify-demo.jpg",
  lyrics: ""
},
{
  title: "FUNK AVANZAR - Slowed",
  artist: "Nulteex, ZIMXN",
  album: "FUNK AVANZAR",
  genre: "Brazilian Funk / Phonk",
  year: 2025,
  duration: "2:28",
  file: "music/FUNK AVANZAR - Slowed.mp3",
  cover: "images/FUNK AVANZAR - Slowed.jpg",
  artistImage: "images/waveify-demo.jpg",
  lyrics: ""
},
{
  title: "PASSO MARCADO - Super Slowed",
  artist: "SXYGX",
  album: "PASSO MARCADO",
  genre: "Brazilian Funk / Phonk",
  year: 2025,
  duration: "2:41",
  file: "music/PASSO MARCADO - Super Slowed.mp3",
  cover: "images/PASSO MARCADO - Super Slowed.jpg",
  artistImage: "images/waveify-demo.jpg",
  lyrics: ""
},
{
  title: "SOM DO SOLAR - SUPER SLOWED",
  artist: "SNAX!",
  album: "SOM DO SOLAR",
  genre: "Brazilian Funk / Phonk",
  year: 2025,
  duration: "2:36",
  file: "music/SOM DO SOLAR - SUPER SLOWED.mp3",
  cover: "images/SOM DO SOLAR - SUPER SLOWED.jpg",
  artistImage: "images/waveify-demo.jpg",
  lyrics: ""
},
{
  title: "ANGEL - SLOWED",
  artist: "SHIPU, CLOUD ZERO",
  album: "ANGEL",
  genre: "Phonk",
  year: 2025,
  duration: "2:29",
  file: "music/ANGEL - SLOWED.mp3",
  cover: "images/ANGEL - SLOWED.jpg",
  artistImage: "images/waveify-demo.jpg",
  lyrics: ""
},
{
  title: "SCREAMS! - Super Slowed",
  artist: "M4GN",
  album: "SCREAMS!",
  genre: "Phonk",
  year: 2025,
  duration: "2:33",
  file: "music/SCREAMS! - Super Slowed.mp3",
  cover: "images/SCREAMS! - Super Slowed.jpg",
  artistImage: "images/waveify-demo.jpg",
  lyrics: ""
},
{
  title: "SIENTE DANCE - Ultra Slowed",
  artist: "Lowx",
  album: "SIENTE DANCE",
  genre: "Brazilian Funk / Phonk",
  year: 2025,
  duration: "2:42",
  file: "music/SIENTE DANCE - Ultra Slowed.mp3",
  cover: "images/SIENTE DANCE - Ultra Slowed.jpg",
  artistImage: "images/waveify-demo.jpg",
  lyrics: ""
},
{
  title: "BAJO LA LUNA - Slowed",
  artist: "Yb Wasg'ood, TheFloudy",
  album: "BAJO LA LUNA",
  genre: "Brazilian Funk / Phonk",
  year: 2025,
  duration: "2:37",
  file: "music/BAJO LA LUNA - Slowed.mp3",
  cover: "images/BAJO LA LUNA - Slowed.jpg",
  artistImage: "images/waveify-demo.jpg",
  lyrics: ""
},
{
  title: "me pierdo - Ultra Slowed",
  artist: "vamplug",
  album: "me pierdo",
  genre: "Brazilian Funk / Phonk",
  year: 2025,
  duration: "2:40",
  file: "music/me pierdo - Ultra Slowed.mp3",
  cover: "images/me pierdo - Ultra Slowed.jpg",
  artistImage: "images/waveify-demo.jpg",
  lyrics: ""
},
{
  title: "NO CORAÇÃO - Super Slowed",
  artist: "Pxlish Beatz, Auren",
  album: "NO CORAÇÃO",
  genre: "Brazilian Funk / Phonk",
  year: 2025,
  duration: "2:46",
  file: "music/NO CORAÇÃO - Super Slowed.mp3",
  cover: "images/NO CORAÇÃO - Super Slowed.jpg",
  artistImage: "images/waveify-demo.jpg",
  lyrics: ""
},
{
  title: "MISTÉRIO - Super Slowed",
  artist: "Flame Runner, RVNGE, Dj Samir",
  album: "MISTÉRIO",
  genre: "Brazilian Funk / Phonk",
  year: 2025,
  duration: "2:51",
  file: "music/MISTÉRIO - Super Slowed.mp3",
  cover: "images/MISTÉRIO - Super Slowed.jpg",
  artistImage: "images/waveify-demo.jpg",
  lyrics: ""
},
{
  title: "LUZ ROJA - Alt Version - Ultra Slowed",
  artist: "bxkq",
  album: "LUZ ROJA",
  genre: "Brazilian Funk / Phonk",
  year: 2025,
  duration: "2:43",
  file: "music/LUZ ROJA - Alt Version - Ultra Slowed.mp3",
  cover: "images/LUZ ROJA - Alt Version - Ultra Slowed.jpg",
  artistImage: "images/waveify-demo.jpg",
  lyrics: ""
},
{
  title: "TAKI RUMBA - Super Slowed",
  artist: "NVRVYN, 0ketaminxe",
  album: "TAKI RUMBA",
  genre: "Brazilian Funk / Phonk",
  year: 2025,
  duration: "2:47",
  file: "music/TAKI RUMBA - Super Slowed.mp3",
  cover: "images/TAKI RUMBA - Super Slowed.jpg",
  artistImage: "images/waveify-demo.jpg",
  lyrics: ""
},
{
  title: "ATOMIC FUNK - SLOWED",
  artist: "SYNN",
  album: "ATOMIC FUNK",
  genre: "Brazilian Funk / Phonk",
  year: 2025,
  duration: "1:43",
  file: "music/ATOMIC FUNK - SLOWED.mp3",
  cover: "images/ATOMIC FUNK - SLOWED.jpg",
  artistImage: "images/waveify-demo.jpg",
  lyrics: ""
},
{
  title: "PODER MASSIVA - Slowed",
  artist: "nulled., SIZI, Habazane",
  album: "PODER MASSIVA",
  genre: "Brazilian Funk / Phonk",
  year: 2025,
  duration: "2:21",
  file: "music/PODER MASSIVA - Slowed.mp3",
  cover: "images/PODER MASSIVA - Slowed.jpg",
  artistImage: "images/waveify-demo.jpg",
  lyrics: ""
},
];
