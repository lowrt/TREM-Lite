/* eslint-disable prefer-const */
/* eslint-disable no-undef */
const tw_geojson = JSON.parse(fs.readFileSync(path.resolve(app.getAppPath(), "./resource/maps/tw_town.json")).toString());
const tsunami_map_en = JSON.parse(fs.readFileSync(path.resolve(app.getAppPath(), "./resource/maps/area_en.json")).toString());
const tsunami_map_e = JSON.parse(fs.readFileSync(path.resolve(app.getAppPath(), "./resource/maps/area_e.json")).toString());
const tsunami_map_es = JSON.parse(fs.readFileSync(path.resolve(app.getAppPath(), "./resource/maps/area_es.json")).toString());
const tsunami_map_n = JSON.parse(fs.readFileSync(path.resolve(app.getAppPath(), "./resource/maps/area_n.json")).toString());
const tsunami_map_w = JSON.parse(fs.readFileSync(path.resolve(app.getAppPath(), "./resource/maps/area_w.json")).toString());
const tsunami_map_ws = JSON.parse(fs.readFileSync(path.resolve(app.getAppPath(), "./resource/maps/area_ws.json")).toString());

let eew_cache = [];
const tsunami_map = {};
const data_cache = [];

let type_list = [];

function get_data(data, type = "websocket") {
	if (data.type != "trem-rts") {
		if (type_list.length > 5) type_list.shift();
		type_list.push(type);
		log(`type {${data.type}} from {${type}}`, 1, "event", "get_data");
	}
	if (data.timestamp) {
		if (Now().getTime() - data.timestamp > 10000) return;
		if (data_cache.includes(data.timestamp)) return;
		else data_cache.push(data.timestamp);
	}
	if (data.type == "trem-eew" && storage.getItem("trem_eew")) data.type = "eew-trem";
	if (data.type == "trem-rts") {
		if (!rts_replay_time) on_rts_data(data.raw);
	} else if (data.type == "palert") {
		show_screen("palert");
		if (TREM.palert_report_time == 0) TREM.audio.minor.push("palert");
		TREM.palert_report_time = Date.now();
		refresh_report_list(false, data);
		on_palert(data);
		screenshot_id = `palert_${Date.now()}`;
		if (data.final) {
			let city_list = [];
			let intensity_list = {};
			for (let i = 0; i < data.intensity.length; i++) {
				const loc = data.intensity[i].loc.split(" ")[0];
				const intensity = data.intensity[i].intensity;
				if (!city_list.includes(loc)) city_list.push(loc);
				else continue;
				if (!intensity_list[intensity]) intensity_list[intensity] = [];
				if (!intensity_list[intensity].includes(loc)) intensity_list[intensity].push(loc);
			}
			let text = "";
			for (let i = 9; i > 0; i--) {
				if (!intensity_list[i]) continue;
				const _intensity = `${int_to_intensity(i)}級`;
				text += `最大震度${_intensity.replace("⁻級", "弱").replace("⁺級", "強")}地區，`;
				for (let _i = 0; _i < intensity_list[i].length; _i++)
					text += `${intensity_list[i][_i]},`;
			}
			if (speecd_use) speech.speak({ text: `震度速報，${text}` });
		}
	} else if (data.type == "replay") {
		if (rts_replay_time) rts_replay_time = data.replay_timestamp;
	} else if (data.type == "report") {
		let report_scale = data.scale.toString();
		if (report_scale.length == 1)
			report_scale = report_scale + ".0";
		const loc = data.raw.location.substring(data.raw.location.indexOf("(") + 1, data.raw.location.indexOf(")")).replace("位於", "");
		if (data.location.startsWith("地震資訊"))
			if (storage.getItem("show_reportInfo") ?? false) {
				show_screen("report");
				const text = `${data.raw.originTime}\n${loc} 發生 M${report_scale} 地震`;
				if (speecd_use) speech.speak({ text: `地震資訊，${text.replace("M", "規模").replace(".", "點")}` });
				new Notification("⚠️ 地震資訊", {
					body : text,
					icon : "../TREM.ico",
				});
			} else return;
		else {
			let I = int_to_intensity(data.raw.data[0]?.areaIntensity ?? 0);
			if (I.includes("+")) {
				I += "強";
				I.replace("+", "");
			} else if (I.includes("-")) {
				I += "弱";
				I.replace("-", "");
			} else I += "級";
			const text = `${data.raw.originTime}\n${loc} 發生 M${report_scale} 地震\n最大震度 ${data.raw.data[0].areaName} ${data.raw.data[0].eqStation[0].stationName} ${I}`;
			if (speecd_use) speech.speak({ text: `地震報告，${text.replace("M", "規模").replace(".", "點")}` });
			new Notification("⚠️ 地震報告", {
				body : text,
				icon : "../TREM.ico",
			});
			show_screen("report");
		}
		TREM.audio.minor.push("Report");
		TREM.palert_report_time = 0;
		TREM.report_time = Date.now();
		refresh_report_list(false, data);
		screenshot_id = `report_${Date.now()}`;
	} else if (data.type == "eew-report" || data.type == "eew-trem" || data.type == "eew-cwb" || data.type == "eew-scdzj" || data.type == "eew-kma" || data.type == "eew-jma" || data.type == "eew-nied") {
		if ((data.type == "eew-jma" || data.type == "eew-nied") && data.location == "台湾付近") return;
		if (data.type == "eew-jma" && !(storage.getItem("jma") ?? true)) return;
		if (data.type == "eew-kma" && !(storage.getItem("kma") ?? true)) return;
		if (data.type == "eew-nied" && !(storage.getItem("nied") ?? true)) return;
		if (data.type == "eew-scdzj" && !(storage.getItem("scdzj") ?? true)) return;
		if (Now().getTime() - data.time > 240_000 && !data.replay_timestamp) return;
		if (replay_stop_state) return;
		if (rts_replay_time && type != "websocket") return;
		if (rts_replay_time && data.replay_timestamp) rts_replay_time = data.replay_timestamp;
		if (!rts_replay_timestamp && data.replay_timestamp) return;
		on_eew(data, type);
		screenshot_id = `${data.type}_${Date.now()}`;
	} else if (data.type == "tsunami") {
		show_screen("tsunami");
		on_tsunami(data, type);
		screenshot_id = `tsunami_${Date.now()}`;
	} else if (data.type == "trem-eew") {
		if (Now().getTime() - data.time > 240_000) return;
		if (!rts_replay_timestamp && data.replay_timestamp) return;
		if (data.max < 2) return;
		on_trem(data, type);
	}
}

function on_palert(data) {
	const intensity = {};
	for (let i = 0; i < data.intensity.length; i++)
		intensity[data.intensity[i].loc.split(" ")[1]] = data.intensity[i].intensity;
	if (TREM.palert.geojson) TREM.palert.geojson.remove();
	TREM.palert.geojson = L.geoJson.vt(tw_geojson, {
		minZoom   : 4,
		maxZoom   : 12,
		tolerance : 20,
		buffer    : 256,
		debug     : 0,
		zIndex    : 5,
		style     : (args) => ({
			color       : (!intensity[args.TOWNNAME]) ? "transparent" : int_to_color(intensity[args.TOWNNAME]),
			weight      : 4,
			fillColor   : "transparent",
			fillOpacity : 1,
		}),
	}).addTo(TREM.Maps.main);
	TREM.palert.time = Date.now();
}

function on_eew(data, type) {
	if (TREM.report_time) report_off();
	data._time = data.time;
	if (data.type == "eew-cwb" && data.location.includes("海") && Number(data.depth) <= 35)
		if (Number(data.scale) >= 7) {
			if (speecd_use) speech.speak({ text: "震源位置及規模表明，可能發生海嘯，沿岸地區應慎防海水位突變，並留意中央氣象局是否發布，海嘯警報" });
			add_info("fa-solid fa-house-tsunami fa-2x info_icon", "#0072E3", "注意海嘯", "#FF5809", "震源位置及規模表明<br>可能發生海嘯<br>沿岸地區應慎防海水位突變<br>並留意 中央氣象局(CWB)<br>是否發布 [ 海嘯警報 ]");
		} else if (Number(data.scale) >= 6) {
			if (speecd_use) speech.speak({ text: "沿岸地區應慎防海水位突變" });
			add_info("fa-solid fa-water fa-2x info_icon", "#00EC00", "水位突變", "#FF0080", "沿岸地區應慎防海水位突變");
		}
	if (!Object.keys(TREM.EQ_list).length) {
		document.getElementById("detection_location_1").innerHTML = "";
		document.getElementById("detection_location_2").innerHTML = "";
	}
	const _distance = [];
	for (let index = 0; index < 1002; index++)
		_distance[index] = _speed(data.depth, index);
	const unit = (data.type == "eew-jma") ? "気象庁(JMA)" : (data.type == "eew-nied") ? "防災科学技術研究所" : (data.type == "eew-kma") ? "기상청(KMA)" : (data.type == "eew-scdzj") ? "四川省地震局" : (data.type == "eew-cwb") ? "交通部中央氣象局" : "TREM";
	if (speecd_use) speech.speak({ text: `${data.location}，發生規模${data.scale.toFixed(1).replace(".", "點")}地震` });
	new Notification(`🚨 地震預警 第${data.number}報 | ${unit}`, {
		body : `${time_to_string((data.replay_time) ? data.replay_time : data.time)}\n${data.location} 發生 M${data.scale.toFixed(1)} 地震`,
		icon : "../TREM.ico",
	});
	if (!TREM.EQ_list[data.id]) {
		show_screen("eew");
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
		if (data.cancel) {
			TREM.EQ_list[data.id].data._time = Now().getTime() - 210_000;
			if (TREM.EQ_list[data.id].p_wave) TREM.EQ_list[data.id].p_wave.remove();
			if (TREM.EQ_list[data.id].s_wave) TREM.EQ_list[data.id].s_wave.remove();
			if (TREM.EQ_list[data.id].progress) TREM.EQ_list[data.id].progress.remove();
		} else {
			if (TREM.EQ_list[data.id].p_wave) TREM.EQ_list[data.id].p_wave.setLatLng([data.lat, data.lon]);
			if (TREM.EQ_list[data.id].s_wave) TREM.EQ_list[data.id].s_wave.setLatLng([data.lat, data.lon]);
		}
		if (!eew_cache.includes(data.id + data.number)) {
			eew_cache.push(data.id + data.number);
			if (!TREM.audio.minor.includes("Update")) TREM.audio.minor.push("Update");
		}
	}

	eew_timestamp = 0;

	let epicenterIcon;
	const eq_list = [];
	for (let i = 0; i < Object.keys(TREM.EQ_list).length; i++) {
		const key = Object.keys(TREM.EQ_list)[i];
		if (!TREM.EQ_list[key].trem) eq_list.push(key);
	}
	if (eq_list.length > 1)
		for (let i = 0; i < eq_list.length; i++) {
			const num = i + 1;
			const _data = TREM.EQ_list[eq_list[i]].data;
			epicenterIcon = L.icon({
				iconUrl   : `../resource/images/cross${num}.png`,
				iconSize  : [40 + TREM.size * 3, 40 + TREM.size * 3],
				className : "flash",
			});
			let offsetX = 0;
			let offsetY = 0;
			if (num == 1) offsetY = 0.03;
			else if (num == 2) offsetX = 0.03;
			else if (num == 3) offsetY = -0.03;
			else if (num == 4) offsetX = -0.03;
			if (TREM.EQ_list[_data.id].epicenterIcon) {
				TREM.EQ_list[_data.id].epicenterIcon.setIcon(epicenterIcon);
				TREM.EQ_list[_data.id].epicenterIcon.setLatLng([_data.lat + offsetY, _data.lon + offsetX]);
			} else
				TREM.EQ_list[_data.id].epicenterIcon = L.marker([_data.lat + offsetY, _data.lon + offsetX], { icon: epicenterIcon, zIndexOffset: 6000 }).addTo(TREM.Maps.main);
		}
	else if (TREM.EQ_list[data.id].epicenterIcon)
		TREM.EQ_list[data.id].epicenterIcon.setLatLng([data.lat, data.lon ]);
	else {
		epicenterIcon = L.icon({
			iconUrl   : "../resource/images/cross.png",
			iconSize  : [40 + TREM.size * 3, 40 + TREM.size * 3],
			className : "flash",
		});
		TREM.EQ_list[data.id].epicenterIcon = L.marker([data.lat, data.lon], { icon: epicenterIcon, zIndexOffset: 6000 }).addTo(TREM.Maps.main);
	}

	draw_intensity();
}

function draw_intensity() {
	const location_intensity = {};
	for (let _i = 0; _i < Object.keys(TREM.EQ_list).length; _i++) {
		const _key = Object.keys(TREM.EQ_list)[_i];
		if (TREM.EQ_list[_key].data.cancel || TREM.EQ_list[_key].trem) continue;
		for (let d = 0; d < 1000; d++) {
			const _dist = Math.sqrt(pow(d) + pow(TREM.EQ_list[_key].data.depth));
			if (12.44 * Math.exp(1.33 * TREM.EQ_list[_key].data.scale) * Math.pow(_dist, -1.837) > 0.8) {
				if (d > TREM.dist) TREM.dist = d;
			} else break;
		}
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
		if (TREM.EQ_list[_key].eew > 4 && !TREM.alert) {
			TREM.alert = true;
			TREM.audio.main.push("EEW2");
			if (speecd_use) speech.speak({ text: "注意強震，此地震可能造成災害" });
			add_info("fa-solid fa-bell fa-2x info_icon", "#FF0080", "注意強震", "#00EC00", "此地震可能造成災害");
		}
		show_icon(true, TREM.EQ_list[_key].eew);
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
	if (TREM.report_epicenterIcon) TREM.report_epicenterIcon.remove();
	delete TREM.report_epicenterIcon;
	for (let i = 0; i < Object.keys(TREM.report_icon_list).length; i++) {
		const key = Object.keys(TREM.report_icon_list)[i];
		TREM.report_icon_list[key].remove();
	}
	TREM.report_icon_list = {};
	TREM.report_bounds = L.latLngBounds();
	$(".report_box").css("display", "none");
	$(".eew_box").css("display", "inline");
	show_icon(false);
}

function on_tsunami(data, type) {
	if (!data.cancel) {
		if (speecd_use) speech.speak({ text: "海嘯警報已發布，請迅速疏散至安全場所" });
		if (data.number == 1) TREM.audio.main.push("Water");
		document.getElementById("tsunami_box").style.display = "flex";
		for (let i = 0; i < data.area.length; i++) {
			if (!data.area[i].arrivalTime) continue;
			document.getElementById(`tsunami_${i}`).innerHTML = `${data.area[i].areaName} ${tsunami_time(data.area[i].arrivalTime)}`;
			if (data.area[i].areaName == "東北沿海地區") {
				if (!tsunami_map.en)
					tsunami_map.en = L.geoJson.vt(tsunami_map_en, {
						minZoom   : 4,
						maxZoom   : 12,
						tolerance : 20,
						buffer    : 256,
						debug     : 0,
						zIndex    : 5,
						style     : (args) => ({
							color       : tsunami_color(data.area[i].waveHeight),
							weight      : 6,
							fillColor   : "transparent",
							fillOpacity : 1,
						}),
					}).addTo(TREM.Maps.main);
			} else if (data.area[i].areaName == "東部沿海地區") {
				if (!tsunami_map.e)
					tsunami_map.e = L.geoJson.vt(tsunami_map_e, {
						minZoom   : 4,
						maxZoom   : 12,
						tolerance : 20,
						buffer    : 256,
						debug     : 0,
						zIndex    : 5,
						style     : (args) => ({
							color       : tsunami_color(data.area[i].waveHeight),
							weight      : 6,
							fillColor   : "transparent",
							fillOpacity : 1,
						}),
					}).addTo(TREM.Maps.main);
			} else if (data.area[i].areaName == "東南沿海地區") {
				if (!tsunami_map.es)
					tsunami_map.es = L.geoJson.vt(tsunami_map_es, {
						minZoom   : 4,
						maxZoom   : 12,
						tolerance : 20,
						buffer    : 256,
						debug     : 0,
						zIndex    : 5,
						style     : (args) => ({
							color       : tsunami_color(data.area[i].waveHeight),
							weight      : 6,
							fillColor   : "transparent",
							fillOpacity : 1,
						}),
					}).addTo(TREM.Maps.main);
			} else if (data.area[i].areaName == "北部沿海地區") {
				if (!tsunami_map.n)
					tsunami_map.n = L.geoJson.vt(tsunami_map_n, {
						minZoom   : 4,
						maxZoom   : 12,
						tolerance : 20,
						buffer    : 256,
						debug     : 0,
						zIndex    : 5,
						style     : (args) => ({
							color       : tsunami_color(data.area[i].waveHeight),
							weight      : 6,
							fillColor   : "transparent",
							fillOpacity : 1,
						}),
					}).addTo(TREM.Maps.main);
			} else if (data.area[i].areaName == "海峽沿海地區") {
				if (!tsunami_map.w)
					tsunami_map.w = L.geoJson.vt(tsunami_map_w, {
						minZoom   : 4,
						maxZoom   : 12,
						tolerance : 20,
						buffer    : 256,
						debug     : 0,
						zIndex    : 5,
						style     : (args) => ({
							color       : tsunami_color(data.area[i].waveHeight),
							weight      : 6,
							fillColor   : "transparent",
							fillOpacity : 1,
						}),
					}).addTo(TREM.Maps.main);
			} else if (data.area[i].areaName == "西南沿海地區")
				if (!tsunami_map.ws)
					tsunami_map.ws = L.geoJson.vt(tsunami_map_ws, {
						minZoom   : 4,
						maxZoom   : 12,
						tolerance : 20,
						buffer    : 256,
						debug     : 0,
						zIndex    : 5,
						style     : (args) => ({
							color       : tsunami_color(data.area[i].waveHeight),
							weight      : 6,
							fillColor   : "transparent",
							fillOpacity : 1,
						}),
					}).addTo(TREM.Maps.main);
		}
	} else {
		if (speecd_use) speech.speak({ text: "海嘯警報已解除" });
		if (tsunami_map.en) tsunami_map.en.remove();
		if (tsunami_map.e) tsunami_map.e.remove();
		if (tsunami_map.n) tsunami_map.n.remove();
		if (tsunami_map.es) tsunami_map.es.remove();
		if (tsunami_map.w) tsunami_map.w.remove();
		if (tsunami_map.ws) tsunami_map.ws.remove();
		document.getElementById("tsunami_box").style.display = "none";
	}
}

function tsunami_time(time) {
	const now = new Date(time.replace("T", " ").replace("+08:00", ""));
	return (now.getMonth() + 1) +
        "/" + now.getDate() +
        " " + now.getHours() +
        ":" + now.getMinutes();
}

function tsunami_color(color) {
	return (color == "大於6公尺") ? "#B131FF" : (color == "3至6公尺") ? "red" : (color == "1至3公尺") ? "#FFEF29" : "#5CEE18";
}

function on_trem(data, type) {
	if (!TREM.EQ_list[data.id]) {
		show_screen("trem");
		TREM.EQ_list[data.id] = {
			data,
			eew  : data.max,
			trem : true,
		};
		if (!eew_cache.includes(data.id + data.number)) {
			eew_cache.push(data.id + data.number);
			TREM.audio.main.push("Note");
			show_icon(true, data.max);
			add_info("fa-solid fa-flask fa-2x info_icon", "#FF8000", "實驗功能", "#0072E3", "NSSPE 僅供參考", 30000);
		}
	} else {
		TREM.EQ_list[data.id].data = data;
		TREM.EQ_list[data.id].eew = data.max;
		if (!eew_cache.includes(data.id + data.number)) {
			eew_cache.push(data.id + data.number);
			if (!TREM.audio.minor.includes("Update")) TREM.audio.minor.push("Update");
		}
	}
	const epicenterIcon = L.divIcon({
		html      : "<span></span>",
		iconSize  : [10 + TREM.size, 10 + TREM.size],
		className : `nsspe_dot flash intensity_${data.max}`,
	});
	if (TREM.EQ_list[data.id].epicenterIcon) {
		TREM.EQ_list[data.id].epicenterIcon.setIcon(epicenterIcon);
		TREM.EQ_list[data.id].epicenterIcon.setLatLng([data.lat, data.lon]);
	} else TREM.EQ_list[data.id].epicenterIcon = L.marker([data.lat, data.lon], { icon: epicenterIcon, zIndexOffset: 6000 }).addTo(TREM.Maps.main);
	eew_timestamp = 0;
}