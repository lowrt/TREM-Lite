/* eslint-disable prefer-const */
/* eslint-disable no-undef */
let station = {};
const station_icon = {};

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
const map_style_v = storage.getItem("map_style") ?? "1";
const item_rts_level = storage.getItem("rts-level") ?? -1;
const item_audio_palert = storage.getItem("audio.palert") ?? true;
const item_audio_shindo2 = storage.getItem("audio.Shindo2") ?? true;
const item_audio_shindo1 = storage.getItem("audio.Shindo1") ?? true;
const item_audio_shindo0 = storage.getItem("audio.Shindo0") ?? true;
const item_audio_pga2 = storage.getItem("audio.PGA2") ?? true;
const item_audio_pga1 = storage.getItem("audio.PGA1") ?? true;

let rts_lag = Infinity;
let detection_list = {};
let rts_show = false;
let palert_level = -1;
let palert_time = 0;
let rts_tts = false;

let last_package_lost_time = 0;

const icon_package = document.getElementById("icon-package");

const battery = document.getElementById("battery");
battery.style.display = "none";

const detection_data = JSON.parse(fs.readFileSync(path.resolve(app.getAppPath(), "./resource/data/detection.json")).toString());

get_station_info();
async function get_station_info() {
	try {
		const controller = new AbortController();
		setTimeout(() => {
			controller.abort();
		}, 1500);
		let ans = await fetch("https://cdn.jsdelivr.net/gh/ExpTechTW/API@master/resource/station.json", { signal: controller.signal })
			.catch((err) => void 0);
		if (controller.signal.aborted || !ans) {
			setTimeout(() => get_station_info(), 500);
			return;
		}
		station = station_exec(await ans.json());
	} catch (err) {
		log(err, 3, "rts", "get_station_info");
		setTimeout(() => get_station_info(), 500);
	}
}
function station_exec(station_data) {
	let stations = {};
	for (let k = 0, k_ks = Object.keys(station_data), n = k_ks.length; k < n; k++) {
		const station_id = k_ks[k];
		const station_ = station_data[station_id];
		const station_net = station_.net === "MS-Net" ? "H" : "L";

		let station_new_id = "";
		let station_code = "000";
		let Loc = "";
		let area = "";
		let Lat = 0;
		let Long = 0;

		let latest = station_.info[0];

		if (station_.info.length > 1)
			for (let i = 1; i < station_.info.length; i++) {
				const currentTime = new Date(station_.info[i].time);
				const latestTime = new Date(latest.time);

				if (currentTime > latestTime)
					latest = station_.info[i];
			}

		for (let i = 0, ks = Object.keys(region), j = ks.length; i < j; i++) {
			const reg_id = ks[i];
			const reg = region[reg_id];

			for (let r = 0, r_ks = Object.keys(reg), l = r_ks.length; r < l; r++) {
				const ion_id = r_ks[r];
				const ion = reg[ion_id];

				if (ion.code === latest.code) {
					station_code = latest.code.toString();
					Loc = `${reg_id} ${ion_id}`;
					area = ion.area;
					Lat = latest.lat;
					Long = latest.lon;
				}
			}
		}
		station_new_id = `${station_net}-${station_code}-${station_id}`;

		if (station_code === "000") {
			Lat = latest.lat;
			Long = latest.lon;

			if (station_id === "13379360") {
				Loc = "重庆市 北碚区";
				area = "重庆市中部";
			} else if (station_id === "7735548") {
				Loc = "南楊州市 和道邑";
				area = "南楊州市中部";
			}
		}

		stations[station_id] = { uuid: station_new_id, Lat, Long, Loc, area };
	}
	return stations;
}

function on_rts_data(data) {
	data.Alert = (Object.keys(detection_list).length !== 0); // 測試
	const _now = Date.now();
	if (_now - last_get_rts_time > 10000) {
		last_package_lost_time = _now;
	}
	last_get_rts_time = _now;
	if (!last_package_lost_time) {
		icon_package.style.display = "none";
	} else {
		icon_package.style.display = "";
	}
	if (_now - last_package_lost_time > 30000) {
		last_package_lost_time = 0;
	}
	let target_count = 0;
	rts_lag = Math.abs(data.time - Now().getTime());
	let max_pga = 0;
	let max_intensity = 0;
	const detection_location = data.area ?? [];
	for (const key of Object.keys(station_icon)) {
		if (!data[key] || map_style_v == "3") {
			station_icon[key].remove();
			delete station_icon[key];
		}
	}
	let rts_sation_loc = " - - -  - - ";
	let rts_sation_pga = "--";
	let rts_sation_intensity = "--";
	let rts_sation_intensity_number = 0;
	detection_list = data.box ?? {};
	for (const key of Object.keys(detection_list)) {
		if (max_intensity < detection_list[key]) {
			max_intensity = detection_list[key];
		}
	}

	const list = Object.keys(TREM.EQ_list);

	if (data.station) {
		for (const station_id of Object.keys(data.station)) {
			const icon = L.divIcon({
				className : `pga_dot pga_${data.station[station_id].i.toString().replace(".", "_")}`,
				html      : "<span></span>",
				iconSize  : [10 + TREM.size, 10 + TREM.size],
			});

			if (!station_icon[station_id]) {
				station_icon[station_id] = L.marker([station[station_id].Lat, station[station_id].Long], { icon: icon })
				.bindTooltip("", { opacity: 1 })
					.addTo(TREM.Maps.main);
			} else {
				station_icon[station_id].setIcon(icon);
				station_icon[uuid].setTooltipContent("");
			}
		}

		for (const station_id of Object.keys(data.station)) {
			if (!station[station_id]) {
				continue;
			}
			const info = station[station_id];
			const station_data = data.station[station_id];
			const intensity = intensity_float_to_int(station_data.i);
			if (data.Alert) {
				if (station_data.alert && station_data.pga > max_pga) {
					max_pga = station_data.pga;
				}
			} else if (station_data.pga > max_pga) {
				max_pga = station_data.pga;
			}
			let icon;
			if (data.Alert && station_data.alert) {
				if ((level_list[station_id] ?? 0) < station_data.pga) {
					level_list[station_id] = station_data.pga;
				}
				target_count++;
				if (map_style_v == "2" || map_style_v == "4") {
					let int = 2 * Math.log10(station_data.pga) + 0.7;
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
						if (!pga_up_level[station_id] || pga_up_level[station_id] < station_data.pga) {
							pga_up_level[station_id] = station_data.pga;
							pga_up_timestamp[station_id] = now_time();
						}
						if (now_time() - (pga_up_timestamp[station_id] ?? 0) < 5000) {
							_up = true;
						}
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
			if (!station_data.alert) {
				delete level_list[station_id];
			}
			const station_info_text = `<div class='report_station_box'><div><span class="tooltip-location">${info.Loc}</span><span class="tooltip-uuid">${info.uuid}</span></div><div class="tooltip-fields"><div><span class="tooltip-field-name">加速度</span><span class="tooltip-field-value">${station_data.pga.toFixed(1)}</span></div><div><span class="tooltip-field-name">震度</span><span class="tooltip-field-value">${station_data.i.toFixed(1)}</span></div></div></div>`;
			if (map_style_v != "3") {
				if (!station_icon[station_id]) {
					station_icon[station_id] = L.marker([station_data.Lat, station_data.Long], { icon: icon })
						.bindTooltip(station_info_text, { opacity: 1 })
						.addTo(TREM.Maps.main);
				} else {
					station_icon[station_id].setIcon(icon);
					station_icon[station_id].setTooltipContent(station_info_text);
				}
			}
			if (station_icon[station_id]) {
				if ((list.length && !station_data.alert && !(map_style_v == "2" || map_style_v == "4")) || TREM.report_time) {
					station_icon[station_id].getElement().style.visibility = "hidden";
				} else {
					station_icon[station_id].getElement().style.visibility = "";
				}
				station_icon[station_id].setZIndexOffset((intensity == 0) ? Math.round(station_data.pga + 5) : intensity * 10);
			}
			if (TREM.setting.rts_station.includes(info.uuid)) {
				rts_sation_loc = info.Loc;
				rts_sation_intensity = station_data.i;
				rts_sation_intensity_number = intensity;
				rts_sation_pga = station_data.pga;
			}
		}
	}

	if (!data.Alert) {
		level_list = {};
	}
	document.getElementById("rts_location").textContent = rts_sation_loc;
	document.getElementById("rts_pga").textContent = `${get_lang_string("word.pga")} ${rts_sation_pga}`;
	document.getElementById("rts_intensity").textContent = `${get_lang_string("word.intensity")} ${rts_sation_intensity}`;
	const rts_intensity_level = document.getElementById("rts_intensity_level");
	rts_intensity_level.textContent = int_to_intensity(rts_sation_intensity_number);
	rts_intensity_level.className = `intensity_center intensity_${rts_sation_intensity_number}`;
	const max_pga_text = document.getElementById("max_pga");
	const max_intensity_text = document.getElementById("max_intensity");
	const detection_location_1 = document.getElementById("detection_location_1");
	const detection_location_2 = document.getElementById("detection_location_2");
	let skip = false;
	if (max_intensity < item_rts_level) {
		skip = true;
	}
	if (data.eew) {
		if (!eew_alert_state) {
			eew_alert_state = true;
			TREM.audio.push("Warn");
			add_info("fa-solid fa-bell fa-2x info_icon", "#FF0080", "地震檢測", "#00EC00", "請留意 <b>中央氣象署</b><br>是否發布 <b>地震預警</b>", 15000);
			if (alert_timestamp && now_time() - alert_timestamp < 300_000) {
				add_info("fa-solid fa-triangle-exclamation fa-2x info_icon", "yellow", "不穩定", "#E800E8", "受到地震的影響<br>即時測站可能不穩定");
			}
			alert_timestamp = now_time();
		}
	} else {
		eew_alert_state = false;
	}
	if (data.Alert) {
		if (TREM.report_time) {
			report_off();
		}
		if (!skip && !rts_show) {
			rts_show = true;
			show_screen("rts");
		}
		if (max_intensity > TREM.rts_audio.intensity && TREM.rts_audio.intensity != 10) {
			const loc = detection_location[0] ?? "未知區域";
			if (max_intensity > 3) {
				TREM.rts_audio.intensity = 10;
				if (!skip && item_audio_shindo2) {
					TREM.audio.push("Shindo2");
				}
				const notification = new Notification("🟥 強震檢測", {
					body : `${loc}`,
					icon : "../TREM.ico",
				});
				notification.addEventListener("click", () => {
					MainWindow.focus();
				});
				rts_screenshot();
				plugin.emit("trem.rts.detection-strong");
			} else if (max_intensity > 1) {
				TREM.rts_audio.intensity = 3;
				if (!skip && item_audio_shindo1) {
					TREM.audio.push("Shindo1");
				}
				const notification = new Notification("🟨 震動檢測", {
					body : `${loc}`,
					icon : "../TREM.ico",
				});
				notification.addEventListener("click", () => {
					MainWindow.focus();
				});
				rts_screenshot();
				plugin.emit("trem.rts.detection-shake");
			} else {
				TREM.rts_audio.intensity = 1;
				if (!skip && item_audio_shindo0) {
					TREM.audio.push("Shindo0");
				}
				const notification = new Notification("🟩 弱反應", {
					body : `${loc}`,
					icon : "../TREM.ico",
				});
				notification.addEventListener("click", () => {
					MainWindow.focus();
				});
				rts_screenshot();
				plugin.emit("trem.rts.detection-weak");
			}
			if (!rts_tts) {
				rts_tts = true;
				if (speecd_use) {
					speech.speak({ text: `${loc}，偵測到晃動` });
				}
			}
		}
		if (max_pga > TREM.rts_audio.pga && TREM.rts_audio.pga <= 200) {
			if (max_pga > 200) {
				TREM.rts_audio.pga = 250;
				if (!skip && item_audio_pga2) {
					TREM.audio.push("PGA2");
				}
				rts_screenshot();
				plugin.emit("trem-rts.pga-high");
			} else if (max_pga > 8) {
				TREM.rts_audio.pga = 200;
				if (!skip && item_audio_pga1) {
					TREM.audio.push("PGA1");
				}
				rts_screenshot();
				plugin.emit("trem.rts.pga-low");
			}
		}
		if (!list.length) {
			document.getElementById("eew_title_text").textContent = (max_intensity >= 4) ? get_lang_string("detection.high") : (max_intensity >= 2) ? get_lang_string("detection.middle") : get_lang_string("detection.low");
			document.getElementById("eew_box").style.backgroundColor = (max_intensity >= 4) ? "#E80002" : (max_intensity >= 2) ? "#C79A00" : "#149A4C";
			let _text_1 = "";
			let _text_2 = "";
			let count = 0;
			for (let i = 0; i < detection_location.length; i++) {
				const loc = detection_location[i];
				if (count < 4) {
					_text_1 += `${loc}<br>`;
				} else {
					_text_2 += `${loc}<br>`;
				}
				count++;
			}
			detection_location_1.innerHTML = _text_1;
			detection_location_2.innerHTML = _text_2;
			detection_location_1.className = "detection_location_text";
			detection_location_2.className = "detection_location_text";
		} else {
			clear_eew_box(detection_location_1, detection_location_2);
		}
	} else {
		rts_tts = false;
		_max_intensity = 0;
		pga_up_level = {};
		pga_up_timestamp = {};
		rts_show = false;
		TREM.rts_audio.intensity = -1;
		TREM.rts_audio.pga = 0;
		if (!list.length) {
			document.getElementById("eew_title_text").textContent = get_lang_string("eew.null");
		}
		max_intensity_text.textContent = "";
		max_intensity_text.className = "";
		if (!list.length) {
			document.getElementById("eew_box").style.backgroundColor = "#333439";
			clear_eew_box(detection_location_1, detection_location_2);
		}
	}
	if (max_intensity > 0 && data.Alert) {
		max_intensity_text.textContent = int_to_intensity(max_intensity);
		max_intensity_text.className = `intensity_center intensity_${max_intensity}`;
	}
	max_pga_text.textContent = `${max_pga} gal`;
	max_pga_text.className = `intensity_center intensity_${(!data.Alert || max_pga < 4) ? 0 : (max_pga < 5) ? 1 : pga_to_intensity(max_pga)}`;
	/*const intensity_list = document.getElementById("intensity_list");
	if (data.I) {
		i_list.data = data.I;
		i_list.time = 0;
	} else if (!i_list.time) {
		i_list.time = _now;
	}
	if (i_list.time && _now - i_list.time > 60000) {
		if (!list.length) {
			i_list.data = [];
		}
		i_list.time = 0;
	}
	if (i_list.data.length) {
		intensity_list.innerHTML = "";
		intensity_list.style.visibility = "visible";
		if (i_list.data.length > 8) {
			const city_I = {};
			for (let i = 0; i < i_list.data.length; i++) {
				let loc = "";
				for (const station_id of Object.keys(station)) {
					if (i_list.data[i].uuid.includes(station_id)) {
						loc = station[station_id].Loc;
						break;
					}
				}
				if (loc == "") {
					continue;
				}
				const _loc = loc.split(" ")[0];
				if ((city_I[_loc] ?? -1) < i_list.data[i].intensity) {
					city_I[_loc] = i_list.data[i].intensity;
				}
			}
			const cities = Object.keys(city_I);
			const maxItems = Math.min(8, cities.length);

			for (let i = 0; i < maxItems; i++) {
				const city = cities[i];
				const intensity = int_to_intensity(city_I[city]);
				const intensity_list_item = document.createElement("intensity_list_item");
				intensity_list_item.className = "intensity_list_item";
				intensity_list_item.innerHTML = `<div class="intensity_${city_I[city]} intensity_center" style="font-size: 14px; border-radius: 3px; width: 20%;">${intensity}</div><div style="font-size: 14px; display: grid; align-items: center; padding-left: 2px; width: 80%;">${city}</div>`;
				intensity_list.appendChild(intensity_list_item);
			}
		} else {
			for (let i = 0; i < i_list.data.length; i++) {
				if (i > 7) {
					break;
				}
				const intensity_list_item = document.createElement("intensity_list_item");
				intensity_list_item.className = "intensity_list_item";
				let loc = "";
				for (const station_id of Object.keys(station)) {
					if (i_list.data[i].uuid.includes(station_id)) {
						loc = station[station_id].Loc;
						break;
					}
				}
				if (loc == "") {
					continue;
				}
				intensity_list_item.innerHTML = `<div class="intensity_${i_list.data[i].intensity} intensity_center" style="font-size: 14px;border-radius: 3px;width: 20%;">${int_to_intensity(i_list.data[i].intensity)}</div><div style="font-size: 14px;display: grid;align-items: center;padding-left: 2px;width: 80%;">${loc}</div>`;
				intensity_list.appendChild(intensity_list_item);
			}
		}
	} else {
		intensity_list.style.visibility = "hidden";
	}*/
	if (list.length || data.Alert) {
		show_icon(true);
	} else if (!TREM.report_time) {
		show_icon(false);
	}
	let level = 0;
	for (const station_id of Object.keys(level_list)) {
		level += level_list[station_id];
	}
	// document.getElementById("intensity_level_num").textContent = Math.round(level);
	// document.getElementById("intensity_level_station").textContent = target_count;

	if (!rts_replay_timestamp) {
		if (data.investigate != undefined) {
			if (data.investigate > palert_level) {
				if (item_audio_palert) {
					TREM.audio.push("palert");
				}
				palert_level = data.investigate;
				refresh_report_list(false, {
					type : "palert",
					time : _now,
					i    : palert_level,
				});
				show_screen("palert");
				screenshot_id = `palert_${now_time()}`;
				plugin.emit("trem.palert.on-palert", data);
			}
			palert_time = _now;
		} else {
			palert_level = -1;
			if (palert_time && _now - palert_time > 600000) {
				palert_time = 0;
				refresh_report_list();
			}
		}
	}
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