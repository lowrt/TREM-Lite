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
	eew_info_clear     : false,
	info_box_time      : 0,
	palert_report_time : 0,
	dist               : 0,
	rts_bounds         : L.latLngBounds(),
	eew_bounds         : L.latLngBounds(),
	all_bounds         : L.latLngBounds(),
	Report             : {
		_markers      : [],
		_markersGroup : null,
	},
	user: {
		icon : null,
		lat  : 0,
		lon  : 0,
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

set_user_location();
function set_user_location() {
	const user_icon = L.divIcon({
		className : "cross",
		html      : "<span></span>",
		iconSize  : [9, 9],
	});
	let _lat = 0;
	let _lon = 0;
	if (get_config().user_location.lat && get_config().user_location.lon) {
		_lat = get_config().user_location.lat;
		_lon = get_config().user_location.lon;
	} else {
		_lat = region[get_config().user_location?.city ?? "臺南市"][get_config().user_location?.town ?? "歸仁區"].lat;
		_lon = region[get_config().user_location?.city ?? "臺南市"][get_config().user_location?.town ?? "歸仁區"].lon;
	}
	TREM.user.lat = _lat;
	TREM.user.lon = _lon;
	if (TREM.user.icon) TREM.user_icon.remove();
	TREM.user.icon = L.marker([_lat, _lon], { icon: user_icon }).addTo(TREM.Maps.main);
}

setTimeout(() => {
	get_data({
		"type"      : "eew-cwb",
		"format"    : 1,
		"time"      : Date.now() - 20000,
		"lon"       : 122.05,
		"lat"       : 24.15,
		"depth"     : 30,
		"scale"     : 5,
		"timestamp" : Date.now(),
		"number"    : 1,
		"id"        : "1120327",
		"location"  : "花蓮縣 外海",
		"cancel"    : false,
	});
}, 13000);

setTimeout(() => {
	get_data({
		"type"      : "eew-cwb",
		"format"    : 1,
		"time"      : Date.now() - 20000,
		"lon"       : 122.05,
		"lat"       : 22.15,
		"depth"     : 30,
		"scale"     : 7,
		"timestamp" : Date.now(),
		"number"    : 1,
		"id"        : "1120328",
		"location"  : "臺東縣 外海",
		"cancel"    : false,
	});
}, 15000);