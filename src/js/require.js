require("leaflet");
require("leaflet-edgebuffer");
require("leaflet-geojson-vt");
const { ipcRenderer } = require("electron");
const path = require("path");

const box_geojson = require(path.join(__dirname, "../resource/map", "box.json"));