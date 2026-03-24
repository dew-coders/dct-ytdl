"use strict";

const axios = require("axios");
const cleanYoutubeUrl = require("./cleanurl");

const REQUEST_TIMEOUT_MS = 20000;
const MAX_RETRIES = 3;
const RETRY_BACKOFF_MS = 10;
const MAX_POLL_SECONDS = parseInt(process.env.YTDL_MAX_POLL_SECONDS || "180", 10);
const SUPPORTED_FORMATS = Object.freeze([
  "144",
  "240",
  "360",
  "480",
  "720",
  "1080",
  "1440",
  "4k",
  "mp4",
  "mp3",
  "m4a",
  "aac",
  "flac",
  "opus",
  "ogg",
  "wav"
]);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(err) {
  if (!err) {
    return false;
  }

  const { code } = err;
  if (code === "ETIMEDOUT" || code === "ECONNRESET" || code === "EAI_AGAIN") {
    return true;
  }

  const status = err.response && err.response.status;
  return status === 429 || (status >= 500 && status <= 599);
}

async function getWithRetry(url, config) {
  let attempt = 0;

  while (true) {
    try {
      return await axios.get(url, config);
    } catch (err) {
      attempt += 1;

      if (!isRetryableError(err) || attempt > MAX_RETRIES) {
        throw err;
      }

      await sleep(RETRY_BACKOFF_MS * attempt);
    }
  }
}

function buildHeaders() {
  return {
    Accept: "*/*",
    "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8,si;q=0.7",
    "Cache-Control": "no-cache",
    Origin: "https://loader.fo",
    Pragma: "no-cache",
    Referer: "https://loader.fo/",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
    "sec-ch-ua": "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site"
  };
}

function normalizeFormat(format) {
  let normalizedFormat;

  if (typeof format === "number" && Number.isFinite(format)) {
    normalizedFormat = String(format);
  } else if (typeof format === "string" && format.trim()) {
    normalizedFormat = format.trim().toLowerCase();
  } else {
    throw new Error(`A format value is required. Supported formats: ${SUPPORTED_FORMATS.join(", ")}.`);
  }

  if (!SUPPORTED_FORMATS.includes(normalizedFormat)) {
    throw new Error(`Unsupported format "${format}". Supported formats: ${SUPPORTED_FORMATS.join(", ")}.`);
  }

  return normalizedFormat;
}

function validateInput(url) {
  if (!url || typeof url !== "string") {
    throw new Error("A YouTube URL string is required.");
  }
}

async function youtubedl(url, format) {
  try {
    validateInput(url);

    let lastStatus = "";
    const cleanedUrl = cleanYoutubeUrl(url);
    const normalizedFormat = normalizeFormat(format);
    const headers = buildHeaders();
    const safeUrl = encodeURIComponent(cleanedUrl);
    const requestUrl = `https://p.savenow.to/ajax/download.php?copyright=0&format=${encodeURIComponent(normalizedFormat)}&url=${safeUrl}&api=dfcb6d76f2f6a9894gjkege8a4ab232222`;

    const response = await getWithRetry(requestUrl, {
      headers,
      timeout: REQUEST_TIMEOUT_MS
    });

    if (!response.data || response.data.success !== true) {
      throw new Error(response.data && response.data.message ? response.data.message : "Remote service rejected the download request.");
    }

    const progressUrl = response.data && response.data.progress_url;
    if (!progressUrl) {
      throw new Error("Remote service did not return a progress URL.");
    }

    let progressResponse = await getWithRetry(progressUrl, {
      headers,
      timeout: REQUEST_TIMEOUT_MS
    });

    const deadline = Date.now() + (MAX_POLL_SECONDS * 1000);

    while (progressResponse.data.text !== "Finished") {
      lastStatus = String(progressResponse.data.text || "");

      if (lastStatus.toLowerCase() === "error") {
        throw new Error("Remote service reported an error while processing the download.");
      }

      if (Date.now() > deadline) {
        throw new Error(`Timed out waiting for download to finish. Last status: ${lastStatus || "unknown"}`);
      }

      await sleep(1000);
      progressResponse = await getWithRetry(progressUrl, {
        headers,
        timeout: REQUEST_TIMEOUT_MS
      });
    }

    const downloadUrl = progressResponse.data && progressResponse.data.download_url;
    if (!downloadUrl) {
      throw new Error("Remote service finished without returning a download URL.");
    }

    return {
      status: true,
      result: {
        url: downloadUrl,
        title: response.data.title,
        thumbnail: response.data.info && response.data.info.image,
        duration: response.data.duration
      }
    };
  } catch (err) {
    return {
      status: false,
      message: "Failed to process YouTube download request.",
      error: err.message
    };
  }
}

module.exports = youtubedl;
module.exports.SUPPORTED_FORMATS = SUPPORTED_FORMATS;
module.exports.cleanYoutubeUrl = cleanYoutubeUrl;
