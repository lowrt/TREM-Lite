/* eslint-disable prefer-const */
/* eslint-disable no-undef */
const station = {};
const station_icon = {};

let alert_state = false;
let alert_timestamp = 0;
let pga_up_timestamp = {};
let pga_up_level = {};
let _max_intensity = 0;
let level_list = {};
let eew_alert_state = false;
let i_list = {
	data : [],
	time : 0,
};
let map_style_v = storage.getItem("map_style") ?? "1";

let rts_lag = 0;
let detection_list = {};
let rts_show = false;

const detection_data = JSON.parse(fs.readFileSync(path.resolve(app.getAppPath(), "./resource/data/detection.json")).toString());

get_station_info();
async function get_station_info() {
	try {
		const controller = new AbortController();
		setTimeout(() => {
			controller.abort();
		}, 1500);
		let ans = await fetch("https://exptech.com.tw/api/v1/file/resource/station.json", { signal: controller.signal })
			.catch((err) => void 0);
		if (controller.signal.aborted || !ans) {
			setTimeout(() => get_station_info(), 500);
			return;
		}
		ans = await ans.json();
		for (let i = 0; i < Object.keys(ans).length; i++) {
			const uuid = Object.keys(ans)[i];
			station[uuid.split("-")[2]] = ans[uuid];
		}
	} catch (err) {
		log(err, 3, "rts", "get_station_info");
		setTimeout(() => get_station_info(), 500);
	}
}

function on_rts_data(data) {
	if (!WS) return;
	let target_count = 0;
	rts_lag = Math.abs(data.Time - Now().getTime());
	let max_pga = 0;
	let max_intensity = 0;
	const detection_location = data.area ?? [];
	for (let i = 0; i < Object.keys(station_icon).length; i++) {
		const key = Object.keys(station_icon)[i];
		if (!data[key] || map_style_v == "3") {
			station_icon[key].remove();
			delete station_icon[key];
			i--;
		}
	}
	let rts_sation_loc = " - - -  - - ";
	let rts_sation_pga = "--";
	let rts_sation_intensity = "--";
	let rts_sation_intensity_number = 0;
	detection_list = data.box ?? {};
	for (let i = 0; i < Object.keys(detection_list).length; i++) {
		const key = Object.keys(detection_list)[i];
		if (max_intensity < detection_list[key]) max_intensity = detection_list[key];
	}

	for (let i = 0; i < Object.keys(data).length; i++) {
		const uuid = Object.keys(data)[i];
		if (!station[uuid]) continue;
		const info = station[uuid];
		const station_data = data[uuid];
		const intensity = intensity_float_to_int(station_data.i);
		if (data.Alert) {
			if (station_data.alert && station_data.v > max_pga) max_pga = station_data.v;
		} else if (station_data.v > max_pga) {max_pga = station_data.v;}
		let icon;
		if (data.Alert && station_data.alert) {
			if ((level_list[uuid] ?? 0) < station_data.v) level_list[uuid] = station_data.v;
			target_count++;
			map_style_v = storage.getItem("map_style") ?? "1";
			if (map_style_v == "2" || map_style_v == "4") {
				let int = 2 * Math.log10(station_data.v) + 0.7;
				int = Number((int).toFixed(1));
				icon = L.divIcon({
					className : `pga_dot pga_${int.toString().replace(".", "_")}`,
					html      : "<span></span>",
					iconSize  : [10 + TREM.size, 10 + TREM.size],
				});
			} else
			if (intensity == 0) {
				icon = L.divIcon({
					className : "pga_dot pga_intensity_0",
					html      : "<span></span>",
					iconSize  : [10 + TREM.size, 10 + TREM.size],
				});
			} else {
				let _up = false;
				if (!pga_up_level[uuid] || pga_up_level[uuid] < station_data.v) {
					pga_up_level[uuid] = station_data.v;
					pga_up_timestamp[uuid] = now_time();
				}
				if (now_time() - (pga_up_timestamp[uuid] ?? 0) < 5000) _up = true;
				icon = L.divIcon({
					className : `${(_up) ? "dot_max" : "dot"} intensity_${intensity}`,
					html      : `<span>${int_to_intensity(intensity)}</span>`,
					iconSize  : [20 + TREM.size, 20 + TREM.size],
				});
			}
		} else {
			icon = L.divIcon({
				className : `pga_dot pga_${station_data.i.toString().replace(".", "_")}`,
				html      : "<span></span>",
				iconSize  : [10 + TREM.size, 10 + TREM.size],
			});
		}
		if (!station_data.alert) delete level_list[uuid];
		const station_info_text = `<div class='report_station_box'><div><span class="tooltip-location">${info.Loc}</span><span class="tooltip-uuid">${uuid}</span></div><div class="tooltip-fields"><div><span class="tooltip-field-name">震度</span><span class="tooltip-field-value">${station_data.i}</span></div><div><span class="tooltip-field-name">PGA</span><span class="tooltip-field-value">${station_data.v} gal</span></div></div></div>`;
		if (map_style_v != "3")
			if (!station_icon[uuid]) {
				station_icon[uuid] = L.marker([info.Lat, info.Long], { icon: icon })
					.bindTooltip(station_info_text, { opacity: 1 })
					.addTo(TREM.Maps.main);
			} else {
				station_icon[uuid].setIcon(icon);
				station_icon[uuid].setTooltipContent(station_info_text);
			}
		if (station_icon[uuid]) {
			if ((Object.keys(TREM.EQ_list).length && !station_data.alert && !(map_style_v == "2" || map_style_v == "4")) || TREM.report_epicenterIcon)station_icon[uuid].getElement().style.visibility = "hidden";
			else station_icon[uuid].getElement().style.visibility = "";
			station_icon[uuid].setZIndexOffset((intensity == 0) ? Math.round(station_data.v + 5) : intensity * 10);
		}
		if (TREM.setting.rts_station.includes(uuid)) {
			rts_sation_loc = info.Loc;
			rts_sation_intensity = station_data.i;
			rts_sation_intensity_number = intensity;
			rts_sation_pga = station_data.v;
		}
	}
	if (!data.Alert) level_list = {};
	document.getElementById("rts_location").innerHTML = rts_sation_loc;
	document.getElementById("rts_pga").innerHTML = `${get_lang_string("word.pga")} ${rts_sation_pga}`;
	document.getElementById("rts_intensity").innerHTML = `${get_lang_string("word.intensity")} ${rts_sation_intensity}`;
	const rts_intensity_level = document.getElementById("rts_intensity_level");
	rts_intensity_level.innerHTML = int_to_intensity(rts_sation_intensity_number);
	rts_intensity_level.className = `intensity_center intensity_${rts_sation_intensity_number}`;
	const max_pga_text = document.getElementById("max_pga");
	const max_intensity_text = document.getElementById("max_intensity");
	const detection_location_1 = document.getElementById("detection_location_1");
	const detection_location_2 = document.getElementById("detection_location_2");
	let skip = false;
	if (max_intensity < (storage.getItem("rts-level") ?? -1)) skip = true;
	if (data.eew) {
		if (!eew_alert_state) {
			eew_alert_state = true;
			TREM.audio.minor.push("Warn");
			add_info("fa-solid fa-bell fa-2x info_icon", "#FF0080", "地震檢測", "#00EC00", "請留意 <b>中央氣象局</b><br>是否發布 <b>地震預警</b>", 15000);
			if (!skip && speecd_use) speech.speak({ text: "地震檢測，請留意中央氣象局是否發布地震預警" });
		}
	} else {eew_alert_state = false;}
	if (data.Alert) {
		if (TREM.report_time) report_off();
		if (!alert_state) {
			alert_state = true;
			plugin.emit("rtsAlert");
			if (alert_timestamp && now_time() - alert_timestamp < 300_000)
				add_info("fa-solid fa-triangle-exclamation fa-2x info_icon", "yellow", "不穩定", "#E800E8", "受到地震的影響<br>即時測站可能不穩定");
		}
		if (!skip && !rts_show) {
			rts_show = true;
			show_screen("rts");
		}
		alert_timestamp = now_time();
		if (max_intensity > TREM.rts_audio.intensity && TREM.rts_audio.intensity != 10) {
			const loc = detection_location[0] ?? "未知區域";
			if (max_intensity > 3) {
				TREM.rts_audio.intensity = 10;
				if (!skip && (storage.getItem("audio.Shindo2") ?? true)) TREM.audio.minor.push("Shindo2");
				if (!skip && speecd_use) speech.speak({ text: `強震檢測，${loc}` });
				new Notification("🟥 強震檢測", {
					body : `${loc}`,
					icon : "../TREM.ico",
				});
				rts_screenshot();
				plugin.emit("rtsDetectionStrong");
			} else if (max_intensity > 1) {
				TREM.rts_audio.intensity = 3;
				if (!skip && (storage.getItem("audio.Shindo1") ?? true)) TREM.audio.minor.push("Shindo1");
				if (!skip && speecd_use) speech.speak({ text: `震動檢測，${loc}` });
				new Notification("🟨 震動檢測", {
					body : `${loc}`,
					icon : "../TREM.ico",
				});
				rts_screenshot();
				plugin.emit("rtsDetectionShake");
			} else {
				TREM.rts_audio.intensity = 1;
				if (!skip && (storage.getItem("audio.Shindo0") ?? true)) TREM.audio.minor.push("Shindo0");
				if (!skip && speecd_use) speech.speak({ text: `弱反應，${loc}` });
				new Notification("🟩 弱反應", {
					body : `${loc}`,
					icon : "../TREM.ico",
				});
				rts_screenshot();
				plugin.emit("rtsDetectionWeak");
			}
		}
		if (max_pga > TREM.rts_audio.pga && TREM.rts_audio.pga <= 200)
			if (max_pga > 200) {
				TREM.rts_audio.pga = 250;
				if (!skip && (storage.getItem("audio.PGA2") ?? true)) TREM.audio.minor.push("PGA2");
				rts_screenshot();
				plugin.emit("rtsPgaHigh");
			} else if (max_pga > 8) {
				TREM.rts_audio.pga = 200;
				if (!skip && (storage.getItem("audio.PGA1") ?? true)) TREM.audio.minor.push("PGA1");
				rts_screenshot();
				plugin.emit("rtsPgaLow");
			}
		if (!Object.keys(TREM.EQ_list).length) {
			document.getElementById("eew_title_text").innerHTML = (max_intensity >= 4) ? get_lang_string("detection.high") : (max_intensity >= 2) ? get_lang_string("detection.middle") : get_lang_string("detection.low");
			document.getElementById("eew_box").style.backgroundColor = (max_intensity >= 4) ? "#E80002" : (max_intensity >= 2) ? "#C79A00" : "#149A4C";
			let _text_1 = "";
			let _text_2 = "";
			let count = 0;
			for (let i = 0; i < detection_location.length; i++) {
				const loc = detection_location[i];
				if (count < 4) _text_1 += `${loc}<br>`;
				else _text_2 += `${loc}<br>`;
				count++;
			}
			detection_location_1.innerHTML = _text_1;
			detection_location_2.innerHTML = _text_2;
			detection_location_1.className = "detection_location_text";
			detection_location_2.className = "detection_location_text";
		} else {clear_eew_box(detection_location_1, detection_location_2);}
	} else {
		_max_intensity = 0;
		pga_up_level = {};
		pga_up_timestamp = {};
		alert_state = false;
		rts_show = false;
		TREM.rts_audio.intensity = -1;
		TREM.rts_audio.pga = 0;
		if (!Object.keys(TREM.EQ_list).length) document.getElementById("eew_title_text").innerHTML = get_lang_string("eew.null");
		max_intensity_text.innerHTML = "";
		max_intensity_text.className = "";
		if (!Object.keys(TREM.EQ_list).length) {
			document.getElementById("eew_box").style.backgroundColor = "#333439";
			clear_eew_box(detection_location_1, detection_location_2);
		}
	}
	if (max_intensity > 0 && data.Alert) {
		if (max_intensity > _max_intensity) {
			_max_intensity = max_intensity;
			const _intensity = `${int_to_intensity(_max_intensity)}級`;
			if (!skip && speecd_use) speech.speak({ text: `觀測最大震度，${_intensity.replace("⁻級", "弱").replace("⁺級", "強")}` });
		}
		max_intensity_text.innerHTML = int_to_intensity(max_intensity);
		max_intensity_text.className = `intensity_center intensity_${max_intensity}`;
	}
	max_pga_text.innerHTML = `${max_pga} gal`;
	max_pga_text.className = `intensity_center intensity_${(!data.Alert || max_pga < 4) ? 0 : (max_pga < 5) ? 1 : pga_to_intensity(max_pga)}`;
	const intensity_list = document.getElementById("intensity_list");
	if (data.I) {
		i_list.data = data.I;
		i_list.time = 0;
	} else if (!i_list.time) {i_list.time = Date.now();}
	if (i_list.time && Date.now() - i_list.time > 60000) {
		if (!Object.keys(TREM.EQ_list).length) i_list.data = [];
		i_list.time = 0;
	}
	if (i_list.data.length) {
		intensity_list.innerHTML = "";
		intensity_list.style.visibility = "visible";
		if (i_list.data.length > 8) {
			const city_I = {};
			for (let i = 0; i < i_list.data.length; i++) {
				let loc = "";
				for (let index = 0; index < Object.keys(station).length; index++) {
					const uuid = Object.keys(station)[index];
					if (i_list.data[i].uuid.includes(uuid)) {
						loc = station[uuid].Loc;
						break;
					}
				}
				if (loc == "") continue;
				const _loc = loc.split(" ")[0];
				if ((city_I[_loc] ?? -1) < i_list.data[i].intensity) city_I[_loc] = i_list.data[i].intensity;
			}
			for (let i = 0; i < Object.keys(city_I).length; i++) {
				if (i > 7) break;
				const city = Object.keys(city_I)[i];
				const intensity_list_item = document.createElement("intensity_list_item");
				intensity_list_item.className = "intensity_list_item";
				intensity_list_item.innerHTML = `<div class="intensity_${city_I[city]} intensity_center" style="font-size: 14px;border-radius: 3px;width: 20%;">${int_to_intensity(city_I[city])}</div><div style="font-size: 14px;display: grid;align-items: center;padding-left: 2px;width: 80%;">${city}</div>`;
				intensity_list.appendChild(intensity_list_item);
			}
		} else {
			for (let i = 0; i < i_list.data.length; i++) {
				if (i > 7) break;
				const intensity_list_item = document.createElement("intensity_list_item");
				intensity_list_item.className = "intensity_list_item";
				let loc = "";
				for (let index = 0; index < Object.keys(station).length; index++) {
					const uuid = Object.keys(station)[index];
					if (i_list.data[i].uuid.includes(uuid)) {
						loc = station[uuid].Loc;
						break;
					}
				}
				if (loc == "") continue;
				intensity_list_item.innerHTML = `<div class="intensity_${i_list.data[i].intensity} intensity_center" style="font-size: 14px;border-radius: 3px;width: 20%;">${int_to_intensity(i_list.data[i].intensity)}</div><div style="font-size: 14px;display: grid;align-items: center;padding-left: 2px;width: 80%;">${loc}</div>`;
				intensity_list.appendChild(intensity_list_item);
			}
		}
	} else {intensity_list.style.visibility = "hidden";}
	if (Object.keys(TREM.EQ_list).length || data.Alert) show_icon(true, max_intensity);
	else if (!TREM.report_time) show_icon(false);
	let level = 0;
	for (let i = 0; i < Object.keys(level_list).length; i++) {
		const uuid = Object.keys(level_list)[i];
		level += level_list[uuid];
	}
	document.getElementById("intensity_level_num").textContent = Math.round(level);
	document.getElementById("intensity_level_station").textContent = target_count;
}

function clear_eew_box(detection_location_1, detection_location_2) {
	detection_location_1.innerHTML = "";
	detection_location_2.innerHTML = "";
	detection_location_1.className = "";
	detection_location_2.className = "";
}

function rts_screenshot() {
	screenshot_id = `rts_${now_time()}`;
}