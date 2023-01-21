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

setTimeout(() => {
	get_data({
		"type"      : "tsunami",
		"format"    : 1,
		"time"      : 1364407980000,
		"lon"       : "146.800",
		"lat"       : "20.200",
		"depth"     : "30.0",
		"scale"     : "8.3",
		"timestamp" : 1673798176877,
		"number"    : "1",
		"id"        : "102001",
		"location"  : "馬里亞那群島",
		"cancel"    : false,
		"area"      : [
			{
				"areaDesc"    : "臺東縣成功鎮至屏東縣滿州鄉沿岸",
				"areaName"    : "東南沿海地區",
				"waveHeight"  : "小於1公尺",
				"arrivalTime" : "2013-03-28T05:11:00+08:00",
				"areaColor"   : "黃色",
				"infoStatus"  : "predict",
			},
			{
				"areaDesc"    : "宜蘭縣南澳鄉至臺東縣長濱鄉沿岸",
				"areaName"    : "東部沿海地區",
				"waveHeight"  : "小於1公尺",
				"arrivalTime" : "2013-03-28T05:12:00+08:00",
				"areaColor"   : "黃色",
				"infoStatus"  : "predict",
			},
			{
				"areaDesc"    : "宜蘭縣頭城鎮至蘇澳鎮沿岸",
				"areaName"    : "東北沿海地區",
				"waveHeight"  : "小於1公尺",
				"arrivalTime" : "2013-03-28T05:24:00+08:00",
				"areaColor"   : "黃色",
				"infoStatus"  : "predict",
			},
			{
				"areaDesc"    : "臺南市至屏東縣恆春鎮沿岸",
				"areaName"    : "西南沿海地區",
				"waveHeight"  : "小於1公尺",
				"arrivalTime" : "2013-03-28T05:32:00+08:00",
				"areaColor"   : "黃色",
				"infoStatus"  : "predict",
			},
			{
				"areaDesc"    : "新北市及基隆市沿岸",
				"areaName"    : "北部沿海地區",
				"waveHeight"  : "小於1公尺",
				"arrivalTime" : "2013-03-28T05:37:00+08:00",
				"areaColor"   : "黃色",
				"infoStatus"  : "predict",
			},
			{
				"areaDesc"    : "桃園縣至嘉義縣沿岸，以及澎湖縣、金門縣與連江縣等離島區域",
				"areaName"    : "海峽沿海地區",
				"waveHeight"  : "小於1公尺",
				"arrivalTime" : "2013-03-28T06:30:00+08:00",
				"areaColor"   : "黃色",
				"infoStatus"  : "predict",
			},
			{
				"areaDesc"   : "預估海嘯波高小於1公尺地區",
				"areaName"   : "東南沿海地區、東部沿海地區、東北沿海地區、西南沿海地區、北部沿海地區、海峽沿海地區",
				"waveHeight" : "小於1公尺",
				"areaColor"  : "黃色",
				"infoStatus" : "predict",
			},
		],
	});
}, 3000);