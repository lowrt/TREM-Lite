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
	report_bounds      : L.latLngBounds(),
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
	report_icon_list: {},
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
	if (TREM.user.icon) TREM.user.icon.remove();
	TREM.user.icon = L.marker([_lat, _lon], { icon: user_icon }).addTo(TREM.Maps.main);
}

setTimeout(() => {
	get_data({
		"type"      : "report",
		"time"      : 1674339186000,
		"lon"       : 121.98,
		"lat"       : 24.41,
		"depth"     : 12.4,
		"scale"     : 3.5,
		"timestamp" : 1674339383187,
		"id"        : 112000,
		"location"  : "宜蘭縣政府南南東方 41.7 公里 (位於臺灣東部海域)",
		"cancel"    : false,
		"max"       : 3,
		"raw"       : {
			"identifier"     : "CWB-EQ112000-2023-0122-061306",
			"earthquakeNo"   : 112000,
			"epicenterLon"   : 121.98,
			"epicenterLat"   : 24.41,
			"location"       : "宜蘭縣政府南南東方 41.7 公里 (位於臺灣東部海域)",
			"depth"          : 12.4,
			"magnitudeValue" : 3.5,
			"originTime"     : "2023/01/22 06:13:06",
			"data"           : [
				{
					"areaName"      : "宜蘭縣",
					"areaIntensity" : 3,
					"eqStation"     : [
						{
							"stationName"      : "南澳",
							"stationLon"       : 121.75,
							"stationLat"       : 24.43,
							"distance"         : 23,
							"stationIntensity" : 3,
						},
						{
							"stationName"      : "武塔",
							"stationLon"       : 121.78,
							"stationLat"       : 24.45,
							"distance"         : 20.36,
							"stationIntensity" : 2,
						},
						{
							"stationName"      : "澳花",
							"stationLon"       : 121.74,
							"stationLat"       : 24.33,
							"distance"         : 25.46,
							"stationIntensity" : 1,
						},
					],
				},
				{
					"areaName"      : "花蓮縣",
					"areaIntensity" : 1,
					"eqStation"     : [
						{
							"stationName"      : "和平",
							"stationLon"       : 121.75,
							"stationLat"       : 24.31,
							"distance"         : 25.39,
							"stationIntensity" : 1,
						},
					],
				},
			],
			"ID": [],
		},
	});
}, 3000);