require("leaflet");
require("leaflet-edgebuffer");
require("leaflet-geojson-vt");
const path = require("path");

const Maps = { main: null };

Maps.main = L.map("map", {
	edgeBufferTiles    : 1,
	attributionControl : false,
	closePopupOnClick  : false,
	maxBounds          : [[60, 50], [10, 180]],
	preferCanvas       : true,
	zoomSnap           : 0.25,
	zoomDelta          : 0.5,
	doubleClickZoom    : false,
	zoomControl        : false,
}).setView([23, 121], 7.5);
L.geoJson.vt(require(path.join(__dirname, "../resource/maps", "tw_county.json")), {
	edgeBufferTiles : 2,
	minZoom         : 4,
	maxZoom         : 12,
	tolerance       : 20,
	buffer          : 256,
	debug           : 0,
	style           : {
		weight      : 0.8,
		color       : "#6A6F75",
		fillColor   : "#3F4045",
		fillOpacity : 0.5,
	},
}).addTo(Maps.main);