/* eslint-disable no-undef */
variable.map = L.map("map", {
	maxBounds          : [[60, 50], [10, 180]],
	preferCanvas       : true,
	attributionControl : false,
	zoomSnap           : 0.1,
	zoomDelta          : 0.25,
	doubleClickZoom    : false,
	zoomControl        : false,
	minZoom            : 5.5,
	maxZoom            : 10,
});

variable.map.createPane("circlePane");
variable.map.getPane("circlePane").style.zIndex = 10;

for (const map_name of constant.MAP_LIST)
	L.geoJson.vt(require(path.join(__dirname, "../resource/map", `${map_name}.json`)), {
		edgeBufferTiles : 2,
		minZoom         : 5.5,
		maxZoom         : 10,
		style           : {
			weight      : 0.6,
			color       : (map_name == "TW") ? "white" : "gray",
			fillColor   : "#3F4045",
			fillOpacity : 0.5,
		},
	}).addTo(variable.map);

variable.map.setView([23.6, 120.4], 7.8);
// variable.map.setView([23.6, 121.4], 7.8);