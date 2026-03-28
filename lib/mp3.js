"use strict";

const createFallbackDownload = require("./create-fallback-download");

const SUPPORTED_AUDIO_FORMATS = Object.freeze([
  "mp3",
  "m4a",
  "aac",
  "flac",
  "opus",
  "ogg",
  "wav"
]);

function normalizeAudioFormat(format) {
  if (typeof format === "undefined") {
    return "mp3";
  }

  if (typeof format !== "string" || !format.trim()) {
    throw new Error(`An audio format string is required. Supported audio formats: ${SUPPORTED_AUDIO_FORMATS.join(", ")}.`);
  }

  const normalizedFormat = format.trim().toLowerCase();

  if (!SUPPORTED_AUDIO_FORMATS.includes(normalizedFormat)) {
    throw new Error(`Unsupported audio format "${format}". Supported audio formats: ${SUPPORTED_AUDIO_FORMATS.join(", ")}.`);
  }

  return normalizedFormat;
}

const mp3 = createFallbackDownload("mp3", "MP3", {
  resolveFormat: (_url, requestedFormat) => normalizeAudioFormat(requestedFormat),
  resolveLabel: (format) => format.toUpperCase()
});

module.exports = mp3;
module.exports.SUPPORTED_AUDIO_FORMATS = SUPPORTED_AUDIO_FORMATS;
