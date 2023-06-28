/* eslint-disable no-undef */
require("leaflet");
require("leaflet-edgebuffer");
require("leaflet-geojson-vt");
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
	arrive             : false,
	user_alert         : false,
	eew_info_clear     : false,
	palert_report_time : 0,
	dist               : 0,
	rts_bounds         : L.latLngBounds(),
	eew_bounds         : L.latLngBounds(),
	report_bounds      : L.latLngBounds(),
	Report             : {
		_markers      : [],
		_markersGroup : null,
	},
	user: {
		icon : null,
		lat  : 0,
		lon  : 0,
	},
	report_icon_list : {},
	palert           : {
		time: 0,
	},
	size: 0,
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
	minZoom            : 5.5,
	maxZoom            : 10,
	fadeAnimation      : false,
	zoomAnimation      : false,
	renderer           : L.canvas(),
}).setView([23.7, 120.4], 7.8);
TREM.size = (Number(TREM.Maps.main.getZoom().toFixed(1)) - 7.8) * 2;
TREM.Maps.main.on("zoomend", () => {
	TREM.size = (Number(TREM.Maps.main.getZoom().toFixed(1)) - 7.8) * 2;
	for (let i = 0; i < Object.keys(TREM.EQ_list).length; i++) {
		const key = Object.keys(TREM.EQ_list)[i];
		const data = TREM.EQ_list[key].data;
		const icon = TREM.EQ_list[key].epicenterIcon.options.icon;
		if (TREM.EQ_list[key].trem)
			icon.options.iconSize = [10 + TREM.size, 10 + TREM.size];
		else
			icon.options.iconSize = [40 + TREM.size * 3, 40 + TREM.size * 3];
		TREM.EQ_list[key].epicenterIcon.remove();
		TREM.EQ_list[key].epicenterIcon = L.marker([data.lat, data.lon], { icon: icon, zIndexOffset: 6000 }).addTo(TREM.Maps.main);
	}
	for (let i = 0; i < Object.keys(TREM.report_icon_list).length; i++) {
		const key = Object.keys(TREM.report_icon_list)[i];
		const icon_info = TREM.report_icon_list[key];
		const icon = icon_info.options.icon;
		let size = 30 + TREM.size * 3;
		if (size < 14) size = 14;
		icon.options.iconSize = [size, size];
		TREM.report_icon_list[key].remove();
		TREM.report_icon_list[key] = L.marker(icon_info._latlng, { icon: icon, zIndexOffset: icon_info.options.zIndexOffset })
			.bindTooltip(icon_info._tooltip._content, { opacity: 1 })
			.addTo(TREM.Maps.main);
	}
});

const map_list = ["tw.json", "jp.json", "cn.json", "sk.json", "nk.json"];

for (let i = 0; i < map_list.length; i++)
	L.geoJson.vt(require(path.join(__dirname, "../resource/maps", map_list[i])), {
		edgeBufferTiles : 2,
		minZoom         : 5.5,
		maxZoom         : 10,
		tolerance       : 20,
		buffer          : 256,
		debug           : 0,
		style           : {
			weight      : 0.8,
			color       : "#AEB8C0",
			fillColor   : "#3F4045",
			fillOpacity : 0.5,
		},
	}).addTo(TREM.Maps.main);

storage.init();

set_user_location();
function set_user_location() {
	const user_icon = L.divIcon({
		className : "cross",
		html      : "<span></span>",
		iconSize  : [9, 9],
	});
	let _lat = 0;
	let _lon = 0;
	if (storage.getItem("lat") && storage.getItem("lon")) {
		_lat = storage.getItem("lat");
		_lon = storage.getItem("lon");
	} else {
		_lat = region[storage.getItem("city") ?? "臺南市"][storage.getItem("town") ?? "歸仁區"].lat;
		_lon = region[storage.getItem("city") ?? "臺南市"][storage.getItem("town") ?? "歸仁區"].lon;
	}
	TREM.user.lat = _lat;
	TREM.user.lon = _lon;
	TREM.setting.rts_station = storage.getItem("rts_station") ?? "H-711-11334880-12";
	if (TREM.user.icon) TREM.user.icon.remove();
	TREM.user.icon = L.marker([_lat, _lon], { icon: user_icon }).addTo(TREM.Maps.main);
}
check_update();