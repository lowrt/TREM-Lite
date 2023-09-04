/* eslint-disable prefer-const */
/* eslint-disable no-undef */
const tw_geojson = JSON.parse(fs.readFileSync(path.resolve(app.getAppPath(), "./resource/maps/tw_town.json")).toString());
const tsunami = JSON.parse(fs.readFileSync(path.resolve(app.getAppPath(), "./resource/maps/tw_tsunami_area.json")).toString());

let eew_cache = [];
let tsunami_map = null;
let data_cache = [];

let type_list = {
	time      : 0,
	http      : 0,
	p2p       : 0,
	fcm       : 0,
	websocket : 0,
};

function get_data(data, type = "websocket") {
	if (data.type != "trem-rts") {
		type_list.time = now_time();
		if (type == "p2p") type_list.p2p = now_time();
		else if (type == "fcm") type_list.fcm = now_time();
		else if (type == "websocket") type_list.websocket = now_time();
		else if (type == "http") type_list.http = now_time();
		log(`type {${data.type}} from {${type}}`, 1, "event", "get_data");
	}
	if (data.replay_timestamp) {
		if (data_cache.includes(data.replay_timestamp)) return;
		else data_cache.push(data.replay_timestamp);
	} else if (data.timestamp) {
		if (data_cache.includes(data.timestamp)) return;
		else data_cache.push(data.timestamp);
		if (Now().getTime() - data.timestamp > 10000) return;
	}
	if (data.id && data.number) {
		if (data_cache.includes(`${data.type}-${data.id}-${data.number}`)) return;
		data_cache.push(`${data.type}-${data.id}-${data.number}`);
	}
	if (data_cache.length > 15) data_cache.splice(0, 1);
	if (data.type == "trem-eew" && (storage.getItem("key") ?? "") == "") return;
	if (data.type == "trem-eew" && !(storage.getItem("eew_trem") ?? false)) return;
	if (data.type == "trem-eew" && storage.getItem("trem_eew") && data.model == "eew") data.type = "eew-trem";
	if (data.type == "trem-rts") {
		if (!rts_replay_time) on_rts_data(data.raw);
	} else if (data.type == "replay") {
		if (rts_replay_time) rts_replay_time = data.replay_timestamp;
	} else if (data.type == "report") {
		palert_time = 0;
		let report_scale = data.scale.toString();
		if (report_scale.length == 1)
			report_scale = report_scale + ".0";
		const loc = data.raw.location.substring(data.raw.location.indexOf("(") + 1, data.raw.location.indexOf(")")).replace("位於", "");
		if (data.location.startsWith("地震資訊")) {
			if (storage.getItem("show_reportInfo") ?? false) {
				show_screen("report");
				const text = `${data.raw.originTime}\n${loc} 發生 M${report_scale} 地震`;
				if (speecd_use) speech.speak({ text: `地震資訊，${text.replace("M", "規模").replace(".", "點")}` });
				const notification = new Notification("⚠️ 地震資訊", {
					body : text,
					icon : "../TREM.ico",
				});
				notification.addEventListener("click", () => {
					MainWindow.focus();
				});
			} else {return;}
		} else {
			let I = int_to_intensity(data.raw.data[0]?.areaIntensity ?? 0);
			if (I.includes("+")) {
				I += "強";
				I.replace("+", "");
			} else if (I.includes("-")) {
				I += "弱";
				I.replace("-", "");
			} else {I += "級";}
			const text = `${data.raw.originTime}\n${loc} 發生 M${report_scale} 地震\n最大震度 ${data.raw.data[0].areaName} ${data.raw.data[0].eqStation[0].stationName} ${I}`;
			if (speecd_use) speech.speak({ text: `地震報告，${text.replace("M", "規模").replace(".", "點")}` });
			const notification = new Notification("⚠️ 地震報告", {
				body : text,
				icon : "../TREM.ico",
			});
			notification.addEventListener("click", () => {
				MainWindow.focus();
			});
			show_screen("report");
		}
		if (rts_replay_timestamp) return;
		if (storage.getItem("audio.Report") ?? true) TREM.audio.push("Report");
		TREM.report_time = now_time();
		refresh_report_list(false, data);
		screenshot_id = `report_${now_time()}`;
		plugin.emit("report", data);
	} else if (data.type == "eew-report" || data.type == "eew-trem" || data.type == "eew-cwb" || data.type == "eew-scdzj" || data.type == "eew-kma" || data.type == "eew-jma" || data.type == "eew-nied") {
		if ((data.type == "eew-jma" || data.type == "eew-nied") && data.location == "台湾付近") return;
		if (data.type == "eew-jma" && !(storage.getItem("jma") ?? true)) return;
		if (data.type == "eew-kma" && !(storage.getItem("kma") ?? true)) return;
		if (data.type == "eew-nied" && !(storage.getItem("nied") ?? true)) return;
		if (data.type == "eew-scdzj" && !(storage.getItem("scdzj") ?? true)) return;
		if (data.type == "eew-cwb" && !(storage.getItem("cwb") ?? true)) return;
		if (Now().getTime() - data.time > 240_000 && !data.replay_timestamp) return;
		if (rts_replay_timestamp && !data.replay_timestamp) return;
		on_eew(data, type);
		screenshot_id = `${data.type}_${now_time()}`;
		plugin.emit("eew", data);
	} else if (data.type == "tsunami") {
		show_screen("tsunami");
		on_tsunami(data, type);
		screenshot_id = `tsunami_${now_time()}`;
		plugin.emit("tsunami", data);
	} else if (data.type == "trem-eew") {
		if (Now().getTime() - data.time > 240_000 && !data.replay_timestamp) return;
		if (rts_replay_timestamp && !data.replay_timestamp) return;
		on_trem(data, type);
	}
}

function on_eew(data, type) {
	TREM.eew = true;
	let skip = false;
	if ((storage.getItem("eew-level") ?? -1) != -1)
		if (storage.getItem("eew-level") > pga_to_intensity(eew_location_info(data).pga)) skip = true;
	if (TREM.report_time) report_off();
	data._time = data.time;
	if (!Object.keys(TREM.EQ_list).length) {
		document.getElementById("detection_location_1").innerHTML = "";
		document.getElementById("detection_location_2").innerHTML = "";
	}
	const _distance = [];
	for (let index = 0; index < 1002; index++)
		_distance[index] = _speed(data.depth, index);
	const unit = (data.type == "eew-jma") ? "気象庁(JMA)" : (data.type == "eew-nied") ? "防災科学技術研究所" : (data.type == "eew-kma") ? "기상청(KMA)" : (data.type == "eew-scdzj") ? "四川省地震局" : (data.type == "eew-cwb") ? "交通部中央氣象局" : "TREM";
	if (!TREM.EQ_list[data.id]) {
		if (!skip) show_screen("eew");
		TREM.EQ_list[data.id] = {
			data,
			eew   : 0,
			alert : false,
			wave  : _distance,
		};
		if (!eew_cache.includes(data.id + data.number)) {
			eew_cache.push(data.id + data.number);
			if (!skip && (storage.getItem("audio.EEW") ?? true)) TREM.audio.push("EEW");
		}
	} else {
		if (!data.location) data.location = TREM.EQ_list[data.id].data.location;
		if (!data.lat) data.lat = TREM.EQ_list[data.id].data.lat;
		if (!data.lon) data.lon = TREM.EQ_list[data.id].data.lon;
		TREM.EQ_list[data.id].data = data;
		TREM.EQ_list[data.id].wave = _distance;
		if (data.cancel) {
			TREM.EQ_list[data.id].eew = 0;
			TREM.EQ_list[data.id].data._time = Now().getTime() - 225_000;
			if (TREM.EQ_list[data.id].p_wave) TREM.EQ_list[data.id].p_wave.remove();
			if (TREM.EQ_list[data.id].s_wave) TREM.EQ_list[data.id].s_wave.remove();
			if (TREM.EQ_list[data.id].progress) TREM.EQ_list[data.id].progress.remove();
		} else {
			if (TREM.EQ_list[data.id].p_wave) TREM.EQ_list[data.id].p_wave.setLatLng([data.lat, data.lon]);
			if (TREM.EQ_list[data.id].s_wave) TREM.EQ_list[data.id].s_wave.setLatLng([data.lat, data.lon]);
			if (TREM.EQ_list[data.id].s_wave_back) TREM.EQ_list[data.id].s_wave_back.setLatLng([data.lat, data.lon]);
		}
	}
	if (data.type == "eew-trem" && TREM.EQ_list[data.id].trem) {
		if (!skip && (storage.getItem("audio.EEW") ?? true)) TREM.audio.push("EEW");
		delete	TREM.EQ_list[data.id].trem;
		TREM.EQ_list[data.id].epicenterIcon.remove();
		delete TREM.EQ_list[data.id].epicenterIcon;
	}
	if (data.type == "eew-cwb" && data.location.includes("海") && Number(data.depth) <= 35)
		if (Number(data.scale) >= 7) {
			if (!TREM.EQ_list[data.id].alert_tsunami) {
				TREM.EQ_list[data.id].alert_tsunami = true;
				if (!skip && speecd_use) setTimeout(() => speech.speak({ text: "震源位置及規模表明，可能發生海嘯，沿岸地區應慎防海水位突變，並留意中央氣象局是否發布，海嘯警報" }), 15000);
				add_info("fa-solid fa-house-tsunami fa-2x info_icon", "#0072E3", "注意海嘯", "#FF5809", "震源位置及規模表明<br>可能發生海嘯<br>沿岸地區應慎防海水位突變<br>並留意 中央氣象局(CWB)<br>是否發布 [ 海嘯警報 ]");
			}
		} else if (Number(data.scale) >= 6) {
			if (!TREM.EQ_list[data.id].alert_sea) {
				TREM.EQ_list[data.id].alert_sea = true;
				if (!skip && speecd_use) setTimeout(() => speech.speak({ text: "震源位置及規模表明，海水位可能突變，沿岸地區應慎防海水位突變" }), 15000);
				add_info("fa-solid fa-water fa-2x info_icon", "#00EC00", "水位突變", "#FF0080", "震源位置及規模表明<br>海水位可能突變<br>沿岸地區應慎防海水位突變");
			}
		}
	const notification = new Notification(`🚨 地震預警 第${data.number}報 | ${unit}`, {
		body : `${time_to_string((data.replay_time) ? data.replay_time : data.time)}\n${data.location} ${(data.cancel) ? "取消" : `發生 M${data.scale.toFixed(1)} 地震`}`,
		icon : "../TREM.ico",
	});
	notification.addEventListener("click", () => {
		MainWindow.focus();
	});
	const text = `${data.location}，${(data.cancel) ? "取消" : `發生規模${data.scale.toFixed(1).replace(".", "點")}地震`}`;
	if (TREM.EQ_list[data.id].text != text) {
		TREM.EQ_list[data.id].text = text;
		if (!skip && speecd_use) speech.speak({ text });
	}

	eew_timestamp = 0;

	let epicenterIcon;
	const eq_list = [];
	for (let i = 0; i < Object.keys(TREM.EQ_list).length; i++) {
		const key = Object.keys(TREM.EQ_list)[i];
		if (!TREM.EQ_list[key].trem) eq_list.push(key);
	}
	if (eq_list.length > 1) {
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
			} else {TREM.EQ_list[_data.id].epicenterIcon = L.marker([_data.lat + offsetY, _data.lon + offsetX], { icon: epicenterIcon, zIndexOffset: 6000 }).addTo(TREM.Maps.main);}
		}
	} else if (TREM.EQ_list[data.id].epicenterIcon) {TREM.EQ_list[data.id].epicenterIcon.setLatLng([data.lat, data.lon ]);} else {
		epicenterIcon = L.icon({
			iconUrl   : "../resource/images/cross.png",
			iconSize  : [40 + TREM.size * 3, 40 + TREM.size * 3],
			className : "flash",
		});
		TREM.EQ_list[data.id].epicenterIcon = L.marker([data.lat, data.lon], { icon: epicenterIcon, zIndexOffset: 6000 })
			.bindTooltip("", { opacity: 1, permanent: true, direction: "right", offset: [10, 0], className: "progress-tooltip" })
			.addTo(TREM.Maps.main);
	}

	draw_intensity(skip);
}

function draw_intensity(skip) {
	const location_intensity = {};
	for (let _i = 0; _i < Object.keys(TREM.EQ_list).length; _i++) {
		const _key = Object.keys(TREM.EQ_list)[_i];
		if (TREM.EQ_list[_key].data.cancel || TREM.EQ_list[_key].trem) continue;
		for (let d = 0; d < 1000; d++) {
			const _dist = Math.sqrt(pow(d) + pow(TREM.EQ_list[_key].data.depth));
			if (12.44 * Math.exp(1.33 * TREM.EQ_list[_key].data.scale) * Math.pow(_dist, -1.837) > 0.8) {
				if (d > TREM.dist) TREM.dist = d;
			} else {break;}
		}
		const eew = eew_location_intensity(TREM.EQ_list[_key].data, TREM.EQ_list[_key].data.depth);
		TREM.EQ_list[_key].loc = eew;
		for (let i = 0; i < Object.keys(eew).length; i++) {
			const key = Object.keys(eew)[i];
			if (key != "max_pga") {
				const intensity = pga_to_intensity(eew[key].pga);
				if ((location_intensity[key] ?? 0) < intensity) location_intensity[key] = intensity;
				if (intensity > 0 && TREM.dist < eew[key].dist) TREM.dist = eew[key].dist;
			}
		}
		TREM.EQ_list[_key].eew = pga_to_intensity(eew.max_pga);
		if (TREM.EQ_list[_key].eew > 4) {
			TREM.EQ_list[_key].alert = true;
			if (!TREM.alert) {
				TREM.alert = true;
				if (!skip && (storage.getItem("audio.EEW2") ?? true)) TREM.audio.push("EEW2");
				if (!skip && speecd_use) speech.speak({ text: "注意強震，此地震可能造成災害" });
				add_info("fa-solid fa-bell fa-2x info_icon", "#FF0080", "注意強震", "#00EC00", "此地震可能造成災害");
			}
		}
		show_icon(true);
	}
	if (TREM.geojson) TREM.geojson.remove();
	const map_style_v = storage.getItem("map_style") ?? "1";
	if (map_style_v == "3" || map_style_v == "4") return;
	if (!(Object.keys(TREM.EQ_list).length == 1 && TREM.EQ_list[Object.keys(TREM.EQ_list)[0]].data.cancel))
		TREM.geojson = geoJsonMap(tw_geojson, {
			minZoom   : 4,
			maxZoom   : 12,
			tolerance : 20,
			buffer    : 256,
			debug     : 0,
			zIndex    : 5,
			style     : (args) => {
				if (args.properties) args = args.properties;
				const name = args.COUNTYNAME + " " + args.TOWNNAME;
				const intensity = location_intensity[name];
				const color = (!intensity) ? "#3F4045" : int_to_color(intensity);
				return {
					color       : "#AEB8C0",
					weight      : 0.4,
					fillColor   : color,
					fillOpacity : 1,
				};
			},
		}, TREM.Maps.main);
}

function report_off() {
	if (TREM.report_epicenterIcon) TREM.report_epicenterIcon.remove();
	if (TREM.report_epicenterIcon_trem) TREM.report_epicenterIcon_trem.remove();
	if (TREM.report_circle_trem) TREM.report_circle_trem.remove();
	if (TREM.report_circle_cwb) TREM.report_circle_cwb.remove();
	delete TREM.report_epicenterIcon;
	delete TREM.report_epicenterIcon_trem;
	for (let i = 0; i < Object.keys(TREM.report_icon_list).length; i++) {
		const key = Object.keys(TREM.report_icon_list)[i];
		TREM.report_icon_list[key].remove();
	}
	TREM.report_icon_list = {};
	TREM.report_bounds = L.latLngBounds();
	for (const item of document.getElementsByClassName("report_box"))
		item.style.display = "none";
	for (const item of document.getElementsByClassName("eew_box"))
		item.style.display = "inline";
	show_icon(false);
	TREM.Maps.main.setView([23.7, 120.4], 7.8);
	TREM.report_time = 0;
}

function on_tsunami(data, type) {
	if (TREM.report_time) report_off();
	if (!data.cancel) {
		if (tsunami_map == null) {
			TREM.audio.push("Water");
			if (speecd_use) speech.speak({ text: "海嘯警報已發布，請迅速疏散至安全場所" });
		}
		document.getElementById("tsunami_box").style.display = "flex";
		document.getElementById("tsunami_warn").style.display = "";
		const tsunami_level = {};
		for (let i = 0; i < data.area.length; i++) {
			if (!data.area[i].arrivalTime) continue;
			document.getElementById(`tsunami_${i}`).innerHTML = `${data.area[i].areaName} ${tsunami_time(data.area[i].arrivalTime)}`;
			tsunami_level[data.area[i].areaName] = tsunami_color(data.area[i].waveHeight);
		}
		if (tsunami_map) tsunami_map.remove();
		tsunami_map = geoJsonMap(tsunami, {
			minZoom   : 4,
			maxZoom   : 12,
			tolerance : 20,
			buffer    : 256,
			debug     : 0,
			zIndex    : 5,
			style     : (args) => {
				if (args.properties) args = args.properties;
				return {
					color       : tsunami_level[args.AREANAME],
					weight      : 3,
					fillColor   : "transparent",
					fillOpacity : 0,
				};
			},
		}, TREM.Maps.main);
	} else {
		if (speecd_use) speech.speak({ text: "海嘯警報已解除" });
		if (tsunami_map) tsunami_map.remove();
		tsunami_map = null;
		document.getElementById("tsunami_box").style.display = "none";
		document.getElementById("tsunami_warn").style.display = "none";
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
	if (TREM.report_time) report_off();
	if (!TREM.EQ_list[data.id]) {
		show_screen("trem");
		TREM.EQ_list[data.id] = {
			data,
			eew  : data.max,
			trem : true,
		};
		if (!eew_cache.includes(data.id + data.number)) {
			eew_cache.push(data.id + data.number);
			TREM.audio.push("Note");
			show_icon(true);
			add_info("fa-solid fa-flask fa-2x info_icon", "#FF8000", "TREM EEW", "#0072E3", "僅供參考(實驗性)", 30000);
		}
	} else {
		TREM.EQ_list[data.id].data = data;
		TREM.EQ_list[data.id].eew = data.max;
	}
	if (TREM.EQ_list[data.id].eew > 4 && !TREM.alert) {
		TREM.alert = true;
		TREM.EQ_list[data.id].alert = true;
		TREM.audio.push("EEW2");
		if (speecd_use) speech.speak({ text: "注意強震，此地震可能造成災害" });
		add_info("fa-solid fa-bell fa-2x info_icon", "#FF0080", "注意強震", "#00EC00", "此地震可能造成災害");
	}
	const epicenterIcon = L.divIcon({
		html      : "<span></span>",
		iconSize  : [10 + TREM.size, 10 + TREM.size],
		className : `nsspe_dot flash intensity_${data.max}`,
	});
	if (TREM.EQ_list[data.id].epicenterIcon) {
		TREM.EQ_list[data.id].epicenterIcon.setIcon(epicenterIcon);
		TREM.EQ_list[data.id].epicenterIcon.setLatLng([data.lat, data.lon]);
	} else {TREM.EQ_list[data.id].epicenterIcon = L.marker([data.lat, data.lon], { icon: epicenterIcon, zIndexOffset: 6000 }).addTo(TREM.Maps.main);}
	eew_timestamp = 0;
	if (data.cancel) TREM.EQ_list[data.id].data.timestamp = Now().getTime() - 75_000;
	if (Object.keys(data.intensity).length) {
		const location_intensity = {};
		for (let i = 0; i < Object.keys(data.intensity).length; i++) {
			const Int = Object.keys(data.intensity)[i];
			for (let I = 0; I < data.intensity[Int].length; I++) {
				const loc = code_to_town(data.intensity[Int][I]);
				if (!loc) continue;
				location_intensity[`${loc.city} ${loc.town}`] = Int;
			}
		}
		const map_style_v = storage.getItem("map_style") ?? "1";
		if (map_style_v == "3" || map_style_v == "4") return;
		if (TREM.geojson) TREM.geojson.remove();
		TREM.geojson = geoJsonMap(tw_geojson, {
			minZoom   : 4,
			maxZoom   : 12,
			tolerance : 20,
			buffer    : 256,
			debug     : 0,
			zIndex    : 5,
			style     : (args) => {
				if (args.properties) args = args.properties;
				const name = `${args.COUNTYNAME} ${args.TOWNNAME}`;
				const intensity = location_intensity[name];
				const color = (!intensity) ? "#3F4045" : int_to_color(intensity);
				return {
					color       : "#AEB8C0",
					weight      : 0.4,
					fillColor   : color,
					fillOpacity : 1,
				};
			},
		}, TREM.Maps.main);
	}
}