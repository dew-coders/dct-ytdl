"use strict";

const createFallbackDownload = require("./create-fallback-download");

const SUPPORTED_VIDEO_FORMATS = Object.freeze([
  "mp4",
  "144",
  "240",
  "360",
  "480",
  "720",
  "1080",
  "1440",
  "4k"
]);

function normalizeVideoFormat(format) {
  if (typeof format === "undefined") {
    return "mp4";
  }

  if (typeof format === "number" && Number.isFinite(format)) {
    format = String(format);
  }

  if (typeof format !== "string" || !format.trim()) {
    throw new Error(`A video format string is required. Supported video formats: ${SUPPORTED_VIDEO_FORMATS.join(", ")}.`);
  }

  const normalizedFormat = format.trim().toLowerCase();

  if (!SUPPORTED_VIDEO_FORMATS.includes(normalizedFormat)) {
    throw new Error(`Unsupported video format "${format}". Supported video formats: ${SUPPORTED_VIDEO_FORMATS.join(", ")}.`);
  }

  return normalizedFormat;
}

const mp4 = createFallbackDownload("mp4", "MP4", {
  resolveFormat: (_url, requestedFormat) => normalizeVideoFormat(requestedFormat),
  resolveLabel: (format) => {
    if (format === "mp4") {
      return "MP4";
    }

    if (format === "4k") {
      return "4K";
    }

    return `${format}p`;
  }
});

module.exports = mp4;
module.exports.SUPPORTED_VIDEO_FORMATS = SUPPORTED_VIDEO_FORMATS;
