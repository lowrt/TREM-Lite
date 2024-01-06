/* eslint-disable no-undef */
require("leaflet");
require("leaflet-edgebuffer");
require("leaflet-geojson-vt");
const { app } = require("@electron/remote");
const { ipcRenderer } = require("electron");
const path = require("path");

const winston = require("winston");
require("winston-daily-rotate-file");

const fs = require("fs-extra");
const yaml = require("js-yaml");
const crypto = require("crypto");

constant.REGION = require(path.join(__dirname, "../resource/data", "region.json"));
constant.BOX_GEOJSON = require(path.join(__dirname, "../resource/map", "box.json"));
constant.BOX_GEOJSON.features.forEach(feature => feature.properties = {
	id: feature.id,
});