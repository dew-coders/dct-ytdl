"use strict";

const axios = require("axios");
const cleanYoutubeUrl = require("./cleanurl");

let jsonCache = null;

const GATEWAY_DOMAIN = Buffer.from("ZXRhY2xvdWQub3Jn", "base64").toString();
const MAX_POLL_SECONDS = parseInt(process.env.YT2MATE_MAX_POLL_SECONDS || "180", 10);
const HEADERS = {
  origin: "https://v1.y2mate.nu",
  referer: "https://v1.y2mate.nu/",
  "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36",
  accept: "*/*"
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ts() {
  return Math.floor(Date.now() / 1000);
}

function extractVideoId(url) {
  const canonicalUrl = cleanYoutubeUrl(url);
  const parsedUrl = new URL(canonicalUrl);
  const videoId = parsedUrl.searchParams.get("v");

  if (!videoId) {
    throw new Error("Invalid YouTube URL.");
  }

  return videoId;
}

async function getjson() {
  if (jsonCache) {
    return jsonCache;
  }

  const response = await axios.get("https://v1.y2mate.nu");
  const html = response.data;
  const match = /var json = JSON\.parse\('([^']+)'\)/.exec(html);

  if (!match || !match[1]) {
    throw new Error("Could not extract y2mate configuration.");
  }

  jsonCache = JSON.parse(match[1]);
  return jsonCache;
}

function authorization(json) {
  let encoded = "";

  for (let index = 0; index < json[0].length; index += 1) {
    encoded += String.fromCharCode(
      json[0][index] - json[2][json[2].length - (index + 1)]
    );
  }

  if (json[1]) {
    encoded = encoded.split("").reverse().join("");
  }

  return encoded.length > 32 ? encoded.slice(0, 32) : encoded;
}

async function init(json) {
  const key = String.fromCharCode(json[6]);
  const url = `https://eta.${GATEWAY_DOMAIN}/api/v1/init?${key}=${authorization(json)}&t=${ts()}`;
  const response = await axios.get(url, { headers: HEADERS });

  if (response.data.error && response.data.error !== 0 && response.data.error !== "0") {
    throw new Error(response.data.message || "y2mate init failed.");
  }

  return response.data;
}

async function yt2mate(videoUrl, format = "mp3") {
  try {
    const json = await getjson();
    const videoId = extractVideoId(videoUrl);
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const initResponse = await init(json);

    let response = await axios.get(
      `${initResponse.convertURL}&v=${encodeURIComponent(youtubeUrl)}&f=${encodeURIComponent(format)}&t=${ts()}&_=${Math.random()}`,
      { headers: HEADERS }
    );

    let data = response.data;

    if (data.error && data.error !== 0 && data.error !== "0") {
      throw new Error(data.message || "y2mate convert request failed.");
    }

    if (data.redirect === 1 && data.redirectURL) {
      response = await axios.get(`${data.redirectURL}&t=${ts()}`, {
        headers: HEADERS
      });
      data = response.data;
    }

    if (data.downloadURL && !data.progressURL) {
      return {
        status: true,
        result: {
          id: videoId,
          title: data.title || "",
          format,
          url: data.downloadURL
        }
      };
    }

    if (!data.progressURL) {
      throw new Error("y2mate did not return a progress URL.");
    }

    const deadline = Date.now() + (MAX_POLL_SECONDS * 1000);

    for (;;) {
      await sleep(3000);

      if (Date.now() > deadline) {
        throw new Error("Timed out waiting for y2mate conversion to finish.");
      }

      const progressResponse = await axios.get(`${data.progressURL}&t=${ts()}`, {
        headers: HEADERS
      });

      const progress = progressResponse.data;

      if (progress.error && progress.error !== 0 && progress.error !== "0") {
        throw new Error(progress.message || "y2mate progress request failed.");
      }

      if (progress.progress === 3) {
        return {
          status: true,
          result: {
            id: videoId,
            title: progress.title || data.title || "",
            format,
            url: data.downloadURL
          }
        };
      }
    }
  } catch (err) {
    return {
      status: false,
      message: "Failed to process yt2mate download request.",
      error: err.message
    };
  }
}

module.exports = yt2mate;
