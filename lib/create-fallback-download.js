"use strict";

const yt2mate = require("./yt2mate");
const youtubedl = require("./youtubedl");

function hasUsableResult(response) {
  return Boolean(
    response
      && response.status === true
      && response.result
      && typeof response.result.url === "string"
      && response.result.url
  );
}

function normalizeFallbackResult(primaryResponse, fallbackResponse) {
  const primaryResult = primaryResponse && primaryResponse.result ? primaryResponse.result : {};
  const fallbackResult = fallbackResponse.result || {};

  return {
    status: true,
    result: {
      url: fallbackResult.url,
      title: fallbackResult.title || primaryResult.title || "",
      thumbnail: primaryResult.thumbnail || null,
      duration: primaryResult.duration || null
    }
  };
}

function createFallbackDownload(format, label) {
  return async function fallbackDownload(url) {
    const primaryResponse = await youtubedl(url, format);
    if (hasUsableResult(primaryResponse)) {
      return primaryResponse;
    }

    const fallbackResponse = await yt2mate(url, format);
    if (hasUsableResult(fallbackResponse)) {
      return normalizeFallbackResult(primaryResponse, fallbackResponse);
    }

    return {
      status: false,
      message: `Failed to process ${label} download request.`,
      error: [
        primaryResponse && primaryResponse.error ? `youtubedl: ${primaryResponse.error}` : "",
        fallbackResponse && fallbackResponse.error ? `yt2mate: ${fallbackResponse.error}` : ""
      ].filter(Boolean).join(" | ") || "Unknown error"
    };
  };
}

module.exports = createFallbackDownload;
