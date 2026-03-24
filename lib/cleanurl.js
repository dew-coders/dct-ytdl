"use strict";

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be"
]);

function extractVideoId(parsedUrl) {
  if (parsedUrl.hostname === "youtu.be") {
    const shortId = parsedUrl.pathname.split("/").filter(Boolean)[0];
    return shortId || "";
  }

  if (parsedUrl.pathname === "/watch") {
    return parsedUrl.searchParams.get("v") || "";
  }

  const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
  if (pathParts.length >= 2 && (pathParts[0] === "shorts" || pathParts[0] === "embed")) {
    return pathParts[1];
  }

  return "";
}

function cleanYoutubeUrl(url) {
  let parsedUrl;

  try {
    parsedUrl = new URL(url);
  } catch (err) {
    throw new Error("Invalid YouTube URL.");
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.has(hostname)) {
    throw new Error("Unsupported YouTube host.");
  }

  const videoId = extractVideoId(parsedUrl);
  if (!videoId) {
    throw new Error("Could not extract a YouTube video ID.");
  }

  return `https://www.youtube.com/watch?v=${videoId}`;
}

module.exports = cleanYoutubeUrl;
