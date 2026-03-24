<div align="center">
  <h1>DCT YTDL</h1>
  <p>A youtube downloader written in Javascript. Created By Dew Coders Group Of Company</p>
  
  [![npm version](https://img.shields.io/npm/v/dct-ytdl.svg)](https://www.npmjs.com/package/dct-ytdl)
  [![npm downloads](https://img.shields.io/npm/dm/dct-ytdl.svg)](https://www.npmjs.com/package/dct-ytdl)
  [![License](https://img.shields.io/npm/l/dct-ytdl.svg)](https://github.com/dew-coders/dct-ytdl/blob/main/LICENSE)
  
  ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white&labelColor=0D1117)
  ![Youtube](https://img.shields.io/badge/YouTube-F7DF1E?style=for-the-badge&logo=youtube&logoColor=white&labelColor=0D1117)
  ![NPM](https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white&labelColor=0D1117)
</div>

## Install

```bash
npm install dct-ytdl
```

## Usage

```js
const youtubedl = require("dct-ytdl");

async function run() {
  const result = await youtubedl("https://www.youtube.com/watch?v=dQw4w9WgXcQ", 720);

  if (!result.status) {
    console.error(result.error);
    return;
  }

  console.log(result.result);
}

run();
```

Dedicated MP3 helper:

```js
const { mp3 } = require("dct-ytdl");

async function run() {
  const result = await mp3("https://youtu.be/a3Ue-LN5B9U?si=iHxGf_4MwNwY5CFw");
  console.log(result);
}

run();
```

Dedicated MP4 helper:

```js
const { mp4 } = require("dct-ytdl");

async function run() {
  const result = await mp4("https://youtu.be/a3Ue-LN5B9U?si=iHxGf_4MwNwY5CFw");
  console.log(result);
}

run();
```

YouTube search helper:

```js
const { yts } = require("dct-ytdl");

async function run() {
  const result = await yts("lofi hip hop");
  console.log(result);
}

run();
```

Alternative converter helper:

```js
const { yt2mate } = require("dct-ytdl");

async function run() {
  const result = await yt2mate("https://youtu.be/a3Ue-LN5B9U?si=iHxGf_4MwNwY5CFw", "mp3");
  console.log(result);
}

run();
```

## Response shape

Successful response:

```js
{
  status: true,
  result: {
    url: "https://...",
    title: "Video title",
    thumbnail: "https://...",
    duration: "03:32"
  }
}
```

Failed response:

```js
{
  status: false,
  message: "Failed to process YouTube download request.",
  error: "Reason here"
}
```

## API

### `youtubedl(url, format)`

- `url`: YouTube video URL
- `format`: one of `144`, `240`, `360`, `480`, `720`, `1080`, `1440`, `4k`, `mp4`, `mp3`, `m4a`, `aac`, `flac`, `opus`, `ogg`, `wav`

Returns a promise that resolves to an object with `status`, and either `result` or `error`.

### `SUPPORTED_FORMATS`

```js
const { SUPPORTED_FORMATS } = require("dct-ytdl");
console.log(SUPPORTED_FORMATS);
```

### `cleanYoutubeUrl(url)`

```js
const { cleanYoutubeUrl } = require("dct-ytdl");

console.log(
  cleanYoutubeUrl("https://youtu.be/a3Ue-LN5B9U?si=iHxGf_4MwNwY5CFw")
);
// https://www.youtube.com/watch?v=a3Ue-LN5B9U
```

You can also import the standalone utility file directly:

```js
const cleanYoutubeUrl = require("dct-ytdl/cleanurl");
```

### `mp3(url)`

Shortcut for:

```js
youtubedl(url, "mp3");
```

You can also import it directly:

```js
const mp3 = require("dct-ytdl/mp3");
```

### `mp4(url)`

Shortcut for:

```js
youtubedl(url, "mp4");
```

If `youtubedl` fails, it automatically falls back to `yt2mate(url, "mp4")` and keeps the same result shape.

You can also import it directly:

```js
const mp4 = require("dct-ytdl/mp4");
```

### `yts(query)`

Searches YouTube, cleans the query, and returns normalized full-detail video results.

```js
const { yts } = require("dct-ytdl");

const result = await yts("  lofi   hip hop  ");
console.log(result.result.query);
// lofi hip hop
```

Each item includes:

- `id`
- `title`
- `url`
- `thumbnail`
- `thumbnails`
- `channel.name`
- `channel.id`
- `channel.url`
- `duration`
- `views`
- `published`
- `description`

You can also import it directly:

```js
const yts = require("dct-ytdl/yts");
```

### `yt2mate(url, format = "mp3")`

Uses an alternate conversion flow and returns a direct download URL.

```js
const { yt2mate } = require("dct-ytdl");

const result = await yt2mate("https://youtu.be/a3Ue-LN5B9U?si=iHxGf_4MwNwY5CFw", "mp3");
console.log(result);
```

You can also import it directly:

```js
const yt2mate = require("dct-ytdl/yt2mate");
```

### `cleanYoutubeSearch(query)`

```js
const { cleanYoutubeSearch } = require("dct-ytdl");

console.log(cleanYoutubeSearch("  tamil   songs  "));
// tamil songs
```

## Notes

- This package depends on a third-party web service and may stop working if that service changes.
- The package does not download the file itself. It resolves a downloadable URL.
- Use it only where you have the right to access and download the media.
