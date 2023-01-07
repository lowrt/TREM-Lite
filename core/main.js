/* eslint-disable no-undef */
require("leaflet");
require("leaflet-edgebuffer");
require("leaflet-geojson-vt");
refresh_report_list();

const path = require("path");

const TREM = {
	Maps: {
		main: null,
	},
	EQ_list : {},
	Timers  : {},
	setting : {
		rts_station: "H-711-11334880-12",
	},
	audio: {
		main  : [],
		minor : [],
	},
	rts_audio: {
		intensity : 0,
		pga       : 0,
	},
};

TREM.Maps.main = L.map("map", {
	edgeBufferTiles    : 1,
	attributionControl : false,
	closePopupOnClick  : false,
	maxBounds          : [[60, 50], [10, 180]],
	preferCanvas       : true,
	zoomSnap           : 0.25,
	zoomDelta          : 0.5,
	doubleClickZoom    : false,
	zoomControl        : false,
})
	.setView([23.7, 120.4], 7.8)
	.on("contextmenu", () => {
		TREM.Maps.main.setView([23.7, 120.4], 7.8);
	});

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
}).addTo(TREM.Maps.main);

setInterval(() => {
	if (!IsGetData) return;
	get_data(Data);
	IsGetData = false;
}, 0);

setTimeout(() => {
	on_eew({
		"Function"      : "earthquake",
		"Type"          : "data",
		"Time"          : Date.now() - 30000,
		"EastLongitude" : "120.51",
		"NorthLatitude" : "22.66",
		"Depth"         : 10,
		"Scale"         : 4,
		"FormatVersion" : 1,
		"TimeStamp"     : Date.now(),
		"UTC+8"         : "2022-11-01 16:30:14",
		"Version"       : 1,
		"APITimeStamp"  : "",
		"ID"            : "1110295",
		"Location"      : "屏東縣",
		"Cancel"        : false,
		"Unit"          : "交通部中央氣象局",
		"Test"          : true,
	});
}, 3000);

// setTimeout(() => {
// 	on_eew({
// 		"Function"      : "earthquake",
// 		"Type"          : "data",
// 		"Time"          : Date.now() - 30000,
// 		"EastLongitude" : "120.51",
// 		"NorthLatitude" : "24.66",
// 		"Depth"         : 10,
// 		"Scale"         : 5,
// 		"FormatVersion" : 1,
// 		"TimeStamp"     : Date.now(),
// 		"UTC+8"         : "2022-11-01 16:30:14",
// 		"Version"       : 10,
// 		"APITimeStamp"  : "",
// 		"ID"            : "11102951",
// 		"Location"      : "臺北市",
// 		"Cancel"        : false,
// 		"Unit"          : "交通部中央氣象局",
// 		"Test"          : true,
// 	});
// }, 5500);