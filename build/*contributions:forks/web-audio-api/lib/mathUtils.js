"use strict";

exports.fixNANs = function (x) {
  return Number.isFinite(x) ? x : 0;
};

exports.rad2deg = function (r) {
  return r * 180.0 / Math.PI;
};

exports.clampTo = function (value, min, max) {
  return Math.min(Math.max(min, value), max);
};