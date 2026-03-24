"use strict";

const axios = require("axios");
const cleanYoutubeUrl = require("./cleanurl");

const SEARCH_TIMEOUT_MS = 20000;
const SEARCH_HEADERS = {
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  Referer: "https://www.youtube.com/",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36"
};

function cleanYoutubeSearch(query) {
  if (typeof query !== "string") {
    throw new Error("A search query string is required.");
  }

  const cleanedQuery = query.replace(/\s+/g, " ").trim();
  if (!cleanedQuery) {
    throw new Error("Search query cannot be empty.");
  }

  return cleanedQuery;
}

function extractText(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value.runs)) {
    return value.runs.map((item) => item && item.text ? item.text : "").join("").trim();
  }

  if (typeof value.simpleText === "string") {
    return value.simpleText;
  }

  return "";
}

function extractThumbnail(thumbnails) {
  if (!Array.isArray(thumbnails) || thumbnails.length === 0) {
    return "";
  }

  return thumbnails[thumbnails.length - 1].url || thumbnails[0].url || "";
}

function extractJsonAfterMarker(source, marker) {
  const startIndex = source.indexOf(marker);
  if (startIndex === -1) {
    throw new Error("Could not find YouTube initial data.");
  }

  const jsonStart = source.indexOf("{", startIndex);
  if (jsonStart === -1) {
    throw new Error("Could not find YouTube data JSON start.");
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = jsonStart; index < source.length; index += 1) {
    const char = source[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(jsonStart, index + 1);
      }
    }
  }

  throw new Error("Could not parse YouTube initial data JSON.");
}

function walkRenderers(node, key, results) {
  if (!node || typeof node !== "object") {
    return;
  }

  if (Array.isArray(node)) {
    node.forEach((item) => walkRenderers(item, key, results));
    return;
  }

  if (node[key]) {
    results.push(node[key]);
  }

  Object.keys(node).forEach((childKey) => {
    walkRenderers(node[childKey], key, results);
  });
}

function extractVideoResults(initialData) {
  const videoRenderers = [];
  walkRenderers(initialData, "videoRenderer", videoRenderers);

  return videoRenderers
    .filter((renderer) => renderer && renderer.videoId)
    .map((renderer) => {
      const videoId = renderer.videoId;
      const channelRuns = renderer.ownerText && renderer.ownerText.runs ? renderer.ownerText.runs : [];
      const firstChannel = channelRuns[0] || {};
      const channelPath = firstChannel.navigationEndpoint
        && firstChannel.navigationEndpoint.commandMetadata
        && firstChannel.navigationEndpoint.commandMetadata.webCommandMetadata
        ? firstChannel.navigationEndpoint.commandMetadata.webCommandMetadata.url
        : "";
      const cleanUrl = cleanYoutubeUrl(`https://www.youtube.com/watch?v=${videoId}`);

      return {
        id: videoId,
        title: extractText(renderer.title),
        url: cleanUrl,
        thumbnail: extractThumbnail(renderer.thumbnail && renderer.thumbnail.thumbnails),
        channel: {
          name: extractText(renderer.ownerText),
          id: renderer.ownerText && renderer.ownerText.runs && renderer.ownerText.runs[0]
            && renderer.ownerText.runs[0].navigationEndpoint
            && renderer.ownerText.runs[0].navigationEndpoint.browseEndpoint
            ? renderer.ownerText.runs[0].navigationEndpoint.browseEndpoint.browseId || ""
            : "",
          url: channelPath ? `https://www.youtube.com${channelPath}` : ""
        },
        duration: extractText(renderer.lengthText),
        views: extractText(renderer.viewCountText),
        published: extractText(renderer.publishedTimeText),
        description: extractText(renderer.detailedMetadataSnippets && renderer.detailedMetadataSnippets[0] && renderer.detailedMetadataSnippets[0].snippetText)
          || extractText(renderer.descriptionSnippet),
        thumbnails: renderer.thumbnail && Array.isArray(renderer.thumbnail.thumbnails)
          ? renderer.thumbnail.thumbnails.map((item) => item.url).filter(Boolean)
          : []
      };
    });
}

async function yts(query) {
  try {
    const cleanedQuery = cleanYoutubeSearch(query);
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanedQuery)}`;
    const response = await axios.get(searchUrl, {
      headers: SEARCH_HEADERS,
      timeout: SEARCH_TIMEOUT_MS
    });

    const html = typeof response.data === "string" ? response.data : "";
    const initialDataJson = extractJsonAfterMarker(html, "var ytInitialData =");
    const initialData = JSON.parse(initialDataJson);
    const results = extractVideoResults(initialData);

    return {
      status: true,
      result: {
        query: cleanedQuery,
        url: searchUrl,
        total: results.length,
        items: results
      }
    };
  } catch (err) {
    return {
      status: false,
      message: "Failed to search YouTube.",
      error: err.message
    };
  }
}

module.exports = yts;
module.exports.cleanYoutubeSearch = cleanYoutubeSearch;
