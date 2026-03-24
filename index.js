"use strict";

const mp3 = require("./lib/mp3");
const mp4 = require("./lib/mp4");
const yt2mate = require("./lib/yt2mate");
const yts = require("./lib/yts");
const youtubedl = require("./lib/youtubedl");

module.exports = youtubedl;
module.exports.mp3 = mp3;
module.exports.mp4 = mp4;
module.exports.yt2mate = yt2mate;
module.exports.yts = yts;
module.exports.youtubedl = youtubedl;
module.exports.SUPPORTED_FORMATS = youtubedl.SUPPORTED_FORMATS;
module.exports.cleanYoutubeUrl = youtubedl.cleanYoutubeUrl;
module.exports.cleanYoutubeSearch = yts.cleanYoutubeSearch;
