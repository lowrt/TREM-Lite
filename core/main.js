/* eslint-disable no-undef */
require("leaflet");
require("leaflet-edgebuffer");
require("leaflet-geojson-vt");
refresh_report_list(true);
fetch_eew();

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
		intensity : -1,
		pga       : 0,
	},
	alert              : false,
	palert_report_time : 0,
	dist               : 0,
	rts_bounds         : L.latLngBounds(),
	eew_bounds         : L.latLngBounds(),
	all_bounds         : L.latLngBounds(),
	Report             : {
		_markers      : [],
		_markersGroup : null,
	},
};

TREM.Maps.main = L.map("map", {
	edgeBufferTiles    : 1,
	attributionControl : false,
	closePopupOnClick  : false,
	maxBounds          : [[60, 50], [10, 180]],
	preferCanvas       : true,
	zoomSnap           : 0.1,
	zoomDelta          : 0.25,
	doubleClickZoom    : false,
	zoomControl        : false,
})
	.setView([23.7, 120.4], 7.8);

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

// on_eew({
// 	"type"      : "eew-cwb",
// 	"time"      : Date.now() - 20000,
// 	"lon"       : 121.53,
// 	"lat"       : 24.01,
// 	"depth"     : 20,
// 	"scale"     : 4.5,
// 	"timestamp" : Date.now(),
// 	"number"    : 1,
// 	"id"        : "1120328",
// 	"location"  : "花蓮縣 秀林鄉",
// 	"cancel"    : false,
// });