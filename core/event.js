/* eslint-disable no-undef */
const tw_geojson = JSON.parse(fs.readFileSync(path.resolve(app.getAppPath(), "./resource/data/tw_town.json")).toString());

const eew_cache = [];

function get_data(data, type = "websocket") {
	if (data.type == "trem-rts")
		on_rts_data(data);
	else if (data.type == "palert") {
		win.flashFrame(true);
		win.setAlwaysOnTop(true);
		win.show();
		win.setAlwaysOnTop(false);
		if (TREM.palert_report_time == 0) TREM.audio.minor.push("palert");
		TREM.palert_report_time = Date.now();
		refresh_report_list(false, data);
	} else if (data.Function == "Replay") {
		if (NOW.getTime() - replayT > 180_000) {
			replay = 0;
			return;
		}
		replay = data.timestamp;
		replayT = NOW.getTime();
		on_eew(data, type);
	} else if (data.type == "report") {
		win.flashFrame(true);
		win.setAlwaysOnTop(true);
		win.show();
		win.setAlwaysOnTop(false);
		TREM.audio.minor.push("Report");
		TREM.palert_report_time = 0;
		TREM.report_time = Date.now();
		refresh_report_list(false, data);
	} else if (data.type == "eew-cwb") {
		if (Now().getTime() - data.time > 240_000) return;
		on_eew(data, type);
	} else console.log(data);
}

function on_eew(data, type) {
	data._time = data.time;
	if (!Object.keys(TREM.EQ_list).length) {
		document.getElementById("detection_location_1").innerHTML = "";
		document.getElementById("detection_location_2").innerHTML = "";
	}
	const _distance = [];
	for (let index = 0; index < 1002; index++)
		_distance[index] = _speed(data.depth, index);
	if (!TREM.EQ_list[data.id]) {
		win.flashFrame(true);
		win.setAlwaysOnTop(true);
		win.show();
		win.setAlwaysOnTop(false);
		TREM.EQ_list[data.id] = {
			data,
			eew   : {},
			alert : false,
			wave  : _distance,
		};
		if (!eew_cache.includes(data.id + data.number)) {
			eew_cache.push(data.id + data.number);
			TREM.audio.main.push("EEW");
		}
	} else {
		TREM.EQ_list[data.id].data = data;
		TREM.EQ_list[data.id].wave = _distance;
		TREM.EQ_list[data.id].p_wave.setLatLng([data.lat, data.lon]);
		TREM.EQ_list[data.id].s_wave.setLatLng([data.lat, data.lon]);
		if (!eew_cache.includes(data.id + data.number)) {
			eew_cache.push(data.id + data.number);
			TREM.audio.minor.push("Update");
		}
	}
	if (data.cancel) {
		TREM.EQ_list[data.id].data._time = Now().getTime() - 210_000;
		if (TREM.EQ_list[data.id].p_wave) TREM.EQ_list[data.id].p_wave.remove();
		if (TREM.EQ_list[data.id].s_wave) TREM.EQ_list[data.id].s_wave.remove();
	}
	TREM.EQ_list[data.id].data.lat = Number(TREM.EQ_list[data.id].data.lat);
	TREM.EQ_list[data.id].data.lon = Number(TREM.EQ_list[data.id].data.lon);
	eew_timestamp = 0;

	let epicenterIcon;
	if (Object.keys(TREM.EQ_list).length > 1) {
		const cursor = Object.keys(TREM.EQ_list);
		for (let i = 0; i < cursor.length; i++) {
			const num = i + 1;
			const _data = TREM.EQ_list[cursor[i]].data;
			epicenterIcon = L.icon({
				iconUrl   : `../resource/images/cross${num}.png`,
				iconSize  : [40, 40],
				className : (_data.Cancel) ? "" : "flash",
			});
			let offsetX = 0;
			let offsetY = 0;
			if (num == 1) offsetY = 0.03;
			else if (num == 2) offsetX = 0.03;
			else if (num == 3) offsetY = -0.03;
			else if (num == 4) offsetX = -0.03;
			if (TREM.EQ_list[_data.id].epicenterIcon && _data.cancel) {
				TREM.EQ_list[_data.id].epicenterIcon.remove();
				delete TREM.EQ_list[_data.id].epicenterIcon;
			}
			if (TREM.EQ_list[_data.id].epicenterIcon) {
				TREM.EQ_list[_data.id].epicenterIcon.setIcon(epicenterIcon);
				TREM.EQ_list[_data.id].epicenterIcon.setLatLng([_data.lat + offsetY, _data.lon + offsetX]);
			} else
				TREM.EQ_list[_data.id].epicenterIcon = L.marker([_data.lat + offsetY, _data.lon + offsetX], { icon: epicenterIcon, zIndexOffset: 6000 }).addTo(TREM.Maps.main);
		}
	} else
	if (TREM.EQ_list[data.id].epicenterIcon && data.cancel) {
		TREM.EQ_list[data.id].epicenterIcon.remove();
		delete TREM.EQ_list[data.id].epicenterIcon;
	}
	if (TREM.EQ_list[data.id].epicenterIcon)
		TREM.EQ_list[data.id].epicenterIcon.setLatLng([data.lat, data.lon ]);
	else {
		epicenterIcon = L.icon({
			iconUrl   : "../resource/images/cross.png",
			iconSize  : [30, 30],
			className : (data.cancel) ? "" : "flash",
		});
		TREM.EQ_list[data.id].epicenterIcon = L.marker([data.lat, data.lon], { icon: epicenterIcon, zIndexOffset: 6000 }).addTo(TREM.Maps.main);
	}

	draw_intensity();
}


function draw_intensity() {
	const location_intensity = {};
	for (let _i = 0; _i < Object.keys(TREM.EQ_list).length; _i++) {
		const _key = Object.keys(TREM.EQ_list)[_i];
		if (TREM.EQ_list[_key].data.cancel) continue;
		const eew = eew_location_intensity(TREM.EQ_list[_key].data);
		for (let i = 0; i < Object.keys(eew).length; i++) {
			const key = Object.keys(eew)[i];
			if (key != "max_pga") {
				const intensity = pga_to_intensity(eew[key].pga);
				if ((location_intensity[key] ?? 0) < intensity) location_intensity[key] = intensity;
				if (intensity > 0 && TREM.dist < eew[key].dist) TREM.dist = eew[key].dist;
			}
		}
		TREM.EQ_list[_key].eew = pga_to_intensity(eew.max_pga);
		if (pga_to_intensity(eew.max_pga) > 4 && !TREM.alert) {
			TREM.alert = true;
			TREM.audio.main.push("EEW2");
		}
	}
	if (TREM.geojson) TREM.geojson.remove();
	if (!(Object.keys(TREM.EQ_list).length == 1 && TREM.EQ_list[Object.keys(TREM.EQ_list)[0]].data.cancel))
		TREM.geojson = L.geoJson.vt(tw_geojson, {
			minZoom   : 4,
			maxZoom   : 12,
			tolerance : 20,
			buffer    : 256,
			debug     : 0,
			zIndex    : 5,
			style     : (args) => {
				const name = args.COUNTYNAME + " " + args.TOWNNAME;
				const intensity = location_intensity[name];
				const color = (!intensity) ? "transparent" : int_to_color(intensity);
				return {
					color       : "#6A6F75",
					weight      : 0.4,
					fillColor   : color,
					fillOpacity : 1,
				};
			},
		}).addTo(TREM.Maps.main);
}

function report_off() {
	TREM.report_time = 0;
	if (TREM.report_epicenterIcon) TREM.report_epicenterIcon.remove();
	// TREM.Report._markersGroup.remove();
	$(".report_box").css("display", "none");
	$(".eew_box").css("display", "inline");
}