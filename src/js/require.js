require("leaflet");
require("leaflet-edgebuffer");
require("leaflet-geojson-vt");
const { app } = require("@electron/remote");
const { ipcRenderer } = require("electron");
const path = require("path");

const box_geojson = require(path.join(__dirname, "../resource/map", "box.json"));

const winston = require("winston");
require("winston-daily-rotate-file");

const fs = require("fs-extra");
const yaml = require("js-yaml");
const crypto = require("crypto");