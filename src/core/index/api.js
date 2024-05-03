/* eslint-disable no-undef */
let report_data = {};
let report_now_id = 0;
let start = false;
let eew_last = '';

const info_list = [];
const item_disable_geojson_vt = storage.getItem("disable_geojson_vt") ?? false;
const item_show_eew = storage.getItem("show_eew") ?? true;
const item_show_report = storage.getItem("show_report") ?? true;
const item_show_palert = storage.getItem("show_palert") ?? true;
const item_show_trem = storage.getItem("show_trem") ?? true;

let click_report_id = -1;

win.on("show", () => sleep(false));
win.on("hide", () => sleep(true));
win.on("minimize", () => sleep(true));
win.on("restore", () => sleep(false));

function int_to_string(max) {
	return (max == 5) ? "5弱" : (max == 6) ? "5強" : (max == 7) ? "6弱" : (max == 8) ? "6強" : (max == 9) ? "7級" : `${max}級`;
}

function int_to_intensity(int) {
	return intensity_list[int];
}

function intensity_float_to_int(float) {
	return (float < 0) ? 0 : (float < 4.5) ? Math.round(float) : (float < 5) ? 5 : (float < 5.5) ? 6 : (float < 6) ? 7 : (float < 6.5) ? 8 : 9;
}

function fetch_eew() {
	const controller = new AbortController();
	setTimeout(() => controller.abort(), 1000);
	fetch(`https://${api_domain}/api/v1/eq/eew?type=cwa`, { signal: controller.signal })
		.then((ans) => ans.json())
		.then((ans) => {
			if (!start) {
				refresh_report_list(true);
			}
			const _now = Now().getTime();
			last_get_eew_time = _now;
			type_list.time = now_time();
			type_list.http = now_time();
			if (ans.length == 0) return;
			const eew = ans[ans.length - 1];
			if (eew.id === eew_last) {
				return;
			}
			eew_last = eew.id;
			eew.time = _now;
			eew.type = "eew-cwb";
			get_data(eew, "http");
		})
		.catch((err) => {
			if(err.type == "aborted") return;
			if (now_time() - disconnect_info > 60_000) {
				disconnect_info = now_time();
				add_info("fa-solid fa-satellite-dish fa-2x info_icon", "#FF0000", "網路異常", "#00BB00", "無法取得速報資訊<br>請檢查網路狀態或稍後重試", 30000);
			}
			if(err.type == "system") return;
			log(err, 3, "api", "fetch_eew");
		});
}

function fetch_rts() {
	if(rts_replay_time) return;
	const controller = new AbortController();
	setTimeout(() => controller.abort(), 2500);
	fetch(`https://${api_domain}/api/v1/trem/rts`, { signal: controller.signal })
		.then(async (ans) => {
			ans = await ans.json();
			on_rts_data(ans);
		})
		.catch((err) => {
			if(err.type == "aborted" || err.type == "system") return;
			log(err, 3, "loop", "fetch_rts");
		});
}

async function fetch_trem_eq(id) {
	if (!id) {
		return null;
	}
	const controller = new AbortController();
	setTimeout(() => controller.abort(), 2500);
	return await new Promise((c) => {
		fetch(`https://${api_domain}/api/v2/eq/report/${id}`, { signal: controller.signal })
			.then((ans) => ans.json())
			.then((ans) => {
				c(ans);
			})
			.catch((err) => {
				log(err, 3, "api", "fetch_trem_eq");
				c(null);
			});
	});
}

async function fetch_report() {
	return await new Promise((c) => {
		const controller = new AbortController();
		setTimeout(() => controller.abort(), 2500);
		let _report_data = [];
		_report_data = storage.getItem("report_data");
		if (typeof _report_data != "object") {
			_report_data = [];
		}
		fetch(`https://${api_domain}/api/v2/eq/report?limit=50${(storage.getItem("show_reportInfo") ?? false) ? (storage.getItem("key") ?? false) ? `&key=${storage.getItem("key")}` : "" : ""}`, {
			signal: controller.signal,
		})
			.then(async (ans) => {
				ans = await ans.json();
				for (let i = 0; i < ans.length; i++) {
					const id = ans[i].id;
					for (let _i = 0; _i < _report_data.length; _i++) {
						if (_report_data[_i].id == id) {
							_report_data.splice(_i, 1);
							break;
						}
					}
				}
				for (let i = 0; i < ans.length; i++) {
					_report_data.push(ans[i]);
				}
				for (let i = 0; i < _report_data.length - 1; i++) {
					for (let _i = 0; _i < _report_data.length - 1; _i++) {
						if (_report_data[_i].time < _report_data[_i + 1].time) {
							const temp = _report_data[_i + 1];
							_report_data[_i + 1] = _report_data[_i];
							_report_data[_i] = temp;
						}
					}
				}
				_report_data = _report_data.slice(0, 500);
				storage.setItem("report_data", _report_data);
				fs.writeFile(path.join(app.getPath("userData"), "report.db"), JSON.stringify(_report_data), () => void 0);
				report_data = _report_data;
				c(true);
			})
			.catch((err) => {
				log(err, 3, "api", "fetch_report");
				c(false);
			});
	});
}

async function fetch_report_single(i, id) {
	return await new Promise((c) => {
		const controller = new AbortController();
		setTimeout(() => controller.abort(), 2500);
		fetch(`https://${api_domain}/api/v2/eq/report/${id}`, {
			signal: controller.signal,
		})
			.then(async (ans) => {
				ans = await ans.json();

				let Max_Level = 0;
				let Max_Level_areaName = "";
				let Max_Level_stationName = "";
				let Max_Level_distance = Number.POSITIVE_INFINITY;

				if (ans.list) {
					for (let index = 0, keys = Object.keys(ans.list), n = keys.length; index < n; index++) {
						const areaName = keys[index];

						if (Max_Level < ans.list[areaName].int) {
							Max_Level = ans.list[areaName].int;
							Max_Level_areaName = areaName;
							Max_Level_distance = Number.POSITIVE_INFINITY;
						}

						for (let station_index = 0, station_keys = Object.keys(ans.list[areaName].town), o = station_keys.length; station_index < o; station_index++) {
							const station_name = station_keys[station_index];
							const station = ans.list[areaName].town[station_name];
							const distance = dis(ans.lat, ans.lon, station.lat, station.lon).toFixed(2);
							ans.list[areaName].town[station_name].distance = distance;

							if (Max_Level_distance > parseFloat(distance))
								if (Max_Level_areaName === areaName) {
									if (Max_Level === station.int) {
										Max_Level_stationName = station_name;
										Max_Level_distance = parseFloat(distance);
									}
								} else if (Max_Level === station.int) {
									Max_Level_areaName = areaName;
									Max_Level_stationName = station_name;
									Max_Level_distance = parseFloat(distance);
								}

						}
					}

					ans.Max_Level = Max_Level;
					ans.Max_Level_areaName = Max_Level_areaName;
					ans.Max_Level_stationName = Max_Level_stationName;
				}
				report_report(i, ans);
			})
			.catch((err) => {
				log(err, 3, "api", "fetch_report");
				c(false);
			});
	});
}

async function refresh_report_list(_fetch = false, data = {}) {
	if (_fetch) {
		const ans = await fetch_report();
		if (!ans) {
			setTimeout(() => refresh_report_list(true), 3000);
			return;
		}
	}
	if (data.type == "report") {
		report_data.unshift(data.raw);
		if (TREM.report_time != 0) {
			const epicenterIcon = L.icon({
				iconUrl  : "../resource/images/cross.png",
				iconSize : [30, 30],
			});
			const intensity = data.raw.data[0]?.areaIntensity ?? 0;
			const intensity_level = (intensity == 0) ? "--" : int_to_intensity(intensity);
			if (TREM.report_epicenterIcon) {
				TREM.report_epicenterIcon.remove();
			}
			TREM.report_epicenterIcon = L.marker([data.lat, data.lon],
				{ icon: epicenterIcon, zIndexOffset: 6000 }).addTo(TREM.Maps.main);
			TREM.report_bounds.extend([data.lat, data.lon]);
			if (!data.location.startsWith("地震資訊")) {
				for (let _i = 0; _i < data.raw.data.length; _i++) {
					const station_data = data.raw.data[_i].eqStation;
					for (let i = 0; i < station_data.length; i++) {
						const station_Intensity = station_data[i].stationIntensity;
						const icon = L.divIcon({
							className : `dot intensity_${station_Intensity}`,
							html      : `<span>${int_to_intensity(station_Intensity)}</span>`,
							iconSize  : [30, 30],
						});
						TREM.report_icon_list[`${station_data[i].stationName}-${Date.now()}`] = L.marker([station_data[i].stationLat, station_data[i].stationLon], { icon: icon, zIndexOffset: station_Intensity * 10 })
							.bindTooltip(`<div class='report_station_box'><div>站名: ${data.raw.data[_i].areaName} ${station_data[i].stationName}</div><div>位置: ${station_data[i].stationLat} °N  ${station_data[i].stationLon} °E</div><div>距離: ${station_data[i].distance} km</div><div>震度: ${int_to_intensity(station_Intensity)}</div></div>`, { opacity: 1 })
							.addTo(TREM.Maps.main);
						TREM.report_bounds.extend([station_data[i].stationLat, station_data[i].stationLon]);
					}
				}
			}
			Zoom = true;
			TREM.Maps.main.setView(TREM.report_bounds.getCenter(), TREM.Maps.main.getBoundsZoom(TREM.report_bounds) - 0.5);
			show_icon(true);
			document.getElementById("report_title_text").textContent = `${get_lang_string("report.title").replace("${type}", (data.location.startsWith("地震資訊")) ? get_lang_string("report.title.Local") : ((data.raw.earthquakeNo % 1000) ? data.raw.earthquakeNo : get_lang_string("report.title.Small")))}`;
			document.getElementById("report_max_intensity").textContent = (data.location.startsWith("地震資訊")) ? "最大震度" : `${data.raw.data[0].areaName} ${data.raw.data[0].eqStation[0].stationName}`;
			const eew_intensity = document.getElementById("report_intensity");
			eew_intensity.className = `intensity_${intensity} intensity_center`;
			eew_intensity.textContent = intensity_level;
			const report_location = document.getElementById("report_location");
			const loc = data.location.substring(data.location.indexOf("(") + 1, data.location.indexOf(")")).replace("位於", "");
			report_location.style.fontSize = (loc.length > 10) ? "16px" : (loc.length > 7) ? "20px" : "24px";
			report_location.textContent = loc;
			document.getElementById("report_time").textContent = get_lang_string("eew.time").replace("${time}", data.raw.originTime);
			let report_scale = data.scale.toString();
			if (report_scale.length == 1) {
				report_scale = report_scale + ".0";
			}
			document.getElementById("report_scale").textContent = `M ${report_scale}`;
			document.getElementById("report_args").innerHTML = `${get_lang_string("word.depth")}:&nbsp;<b>${data.depth}</b>&nbsp;km`;
			info_box_change();
		}
	}
	const report_list = document.getElementById("report_list");
	report_list.innerHTML = "";
	report_list.scrollTop = 0;
	const IsPalert = (data.type == "palert") ? true : false;
	for (let i = (IsPalert) ? -1 : 0; i < report_data.length; i++) {
		const report = document.createElement("div");
		report.className = "report";
		report.id = i;
		if (i == -1) {
			ts_to_time(data.time)
			const _Now = ts_to_time(data.time);
			const report_text_intensity = document.createElement("div");
			report_text_intensity.className = `report_text report_intensity intensity_${data.i}`;
			report_text_intensity.style = `font-size: ${(data.i > 4 && data.i != 7) ? "50" : "60"}px;`;
			report_text_intensity.textContent = `${int_to_intensity(data.i)}`;
			const report_text_box = document.createElement("div");
			report_text_box.className = "report_text_box";
			const report_text = document.createElement("div");
			report_text.className = "report_text";
			report_text.style = "font-size: 22px;";
			report_text.innerHTML = "<b>震源 調查中</b>";
			const report_text_time = document.createElement("div");
			report_text_time.className = "report_text";
			report_text_time.style = "font-size: 15px;";
			report_text_time.textContent = `${_Now}`;
			report_text_box.append(report_text, report_text_time);
			report.append(report_text_intensity, report_text_box);
		} else {
			const originTime = new Date(report_data[i].time + 28800);
			if (report_now_id == originTime.getTime()) {
				report.className = "report replay";
			}
			const intensity = report_data[i].int ?? 0;
			const time = ts_to_time(report_data[i].time);
			const cwb_code = "EQ"
				+ report_data[i].id
				+ "-"
				+ (originTime.getMonth() + 1 < 10 ? "0" : "") + (originTime.getMonth() + 1)
				+ (originTime.getDate() < 10 ? "0" : "") + originTime.getDate()
				+ "-"
				+ (originTime.getHours() < 10 ? "0" : "") + originTime.getHours()
				+ (originTime.getMinutes() < 10 ? "0" : "") + originTime.getMinutes()
				+ (originTime.getSeconds() < 10 ? "0" : "") + originTime.getSeconds();
			let loc = report_data[i].loc;
			loc = loc.substring(loc.indexOf("(") + 3, loc.indexOf(")"));
			const resize = (intensity > 4 && intensity != 7) ? true : false;
			const intensity_level = (intensity == 0) ? "--" : int_to_intensity(intensity);
			if (i == 0 && !IsPalert) {
				const report_info = document.createElement("div");
				report_info.className = "report_item";
				report_info.id = `${originTime.getTime()}_info`;
				const report_text = document.createElement("div");
				report_text.className = `report_text report_intensity intensity_${intensity}`;
				report_text.style = `font-size: ${(resize) ? "50" : "60"}px;`;
				report_text.textContent = `${intensity_level}`;
				const report_text_box = document.createElement("div");
				report_text_box.className = "report_text_box";
				const report_text_loc = document.createElement("div");
				report_text_loc.className = "report_text";
				report_text_loc.style = (loc.length > 12) ? "font-size: 14px;" : (loc.length > 7) ? "font-size: 16px;" : "font-size: 22px;";
				report_text_loc.innerHTML = `<b>${loc}</b>`;
				const report_text_time = document.createElement("div");
				report_text_time.className = "report_text";
				report_text_time.style = "font-size: 15px;";
				report_text_time.textContent = `${time}`;
				const report_text_magnitudeValue_depth = document.createElement("div");
				report_text_magnitudeValue_depth.style = "display: flex;";
				const report_text_magnitudeValue = document.createElement("div");
				report_text_magnitudeValue.className = "report_text";
				report_text_magnitudeValue.style.color = (report_data[i].id.includes("000")) ? "white" : "goldenrod";
				report_text_magnitudeValue.innerHTML = `<b>M&nbsp;${report_data[i].mag.toFixed(1)}</b>`;
				const report_text_depth = document.createElement("div");
				report_text_depth.className = "report_text report_scale";
				report_text_depth.style = "width: 100%;text-align: right;";
				report_text_depth.innerHTML = `${get_lang_string("word.depth")}:&nbsp;<b>${report_data[i].depth}</b>&nbsp;km`;
				report_text_magnitudeValue_depth.append(report_text_magnitudeValue, report_text_depth);
				report_text_box.append(report_text_loc, report_text_time, report_text_magnitudeValue_depth);
				report_info.append(report_text, report_text_box);
				const report_click_box = document.createElement("div");
				report_click_box.className = "report_click hide";
				report_click_box.id = `${originTime.getTime()}_click_box`;
				const report_click_report = document.createElement("i");
				report_click_report.className = "report_click_text fa fa-circle-info fa-2x";
				report_click_report.id = `${originTime.getTime()}_click_report`;
				report_click_report.onclick = () => {
					report_report(i);
				};
				const report_click_replay = document.createElement("i");
				report_click_replay.className = "report_click_text fa-regular fa-circle-play fa-2x";
				if (report_now_id == originTime.getTime()) {
					report_click_replay.className = "report_click_text fa-regular fa-square fa-2x";
				}
				report_click_replay.id = `${originTime.getTime()}_click_replay`;
				report_click_replay.onclick = () => {
					if (rts_replay_timestamp) {
						const skip = (report_now_id == originTime.getTime()) ? true : false;
						replay_stop();
						report.className = "report";
						report.style.border = "";
						report_click_replay.className = "report_click_text fa-regular fa-circle-play fa-2x";
						if (skip) {
							return;
						}
					}
					report.className = "report replay";
					report_click_replay.className = "report_click_text fa-regular fa-square fa-2x";
					report_now_id = originTime.getTime();
					rts_replay_timestamp = originTime.getTime();
					rts_replay_time = originTime.getTime() - 3000;
					replay_run();
					if (storage.getItem("report_eew")) {
						const _now = Now().getTime();
						get_data({
							"originTime"       : originTime.getTime(),
							"type"             : "eew-report",
							"time"             : _now + 3000,
							"lon"              : report_data[i].lon,
							"lat"              : report_data[i].lat,
							"depth"            : Math.round(report_data[i].depth),
							"scale"            : Number(report_data[i].mag.toFixed(1)),
							"timestamp"        : _now,
							"number"           : 1,
							"id"               : report_data[i].id + "R",
							"location"         : loc,
							"cancel"           : false,
							"replay_timestamp" : Date.now(),
						});
					}
				};
				const report_click_web = document.createElement("i");
				report_click_web.className = "report_click_text fa fa-globe fa-2x";
				report_click_web.id = `${originTime.getTime()}_click_web`;
				if (report_data[i].trem || !report_data[i].loc.startsWith("地震資訊")) {
					report_click_web.onclick = () => {
						shell.openExternal((report_data[i].trem) ? `https://exptech.com.tw/file/images/report/${report_data[i].id}.png` : `https://www.cwa.gov.tw/V8/C/E/EQ/${cwb_code}.html`);
					};
				} else {
					report_click_web.style = "color: red;";
				}
				report_click_box.append(report_click_report, report_click_replay, report_click_web);
				report.append(report_info, report_click_box);
			} else {
				const report_info = document.createElement("div");
				report_info.className = "report_item";
				report_info.id = `${originTime.getTime()}_info`;
				const report_text = document.createElement("div");
				report_text.className = `report_text report_intensity intensity_${intensity}`;
				report_text.style = `font-size: ${(resize) ? "35" : "40"}px;max-width: 55px;`;
				report_text.textContent = `${intensity_level}`;
				const report_text_box = document.createElement("div");
				report_text_box.className = "report_text_box";
				const report_text_loc = document.createElement("div");
				report_text_loc.className = "report_text";
				report_text_loc.style = (loc.length > 12) ? "font-size: 12px;" : (loc.length > 7) ? "font-size: 14px;" : "";
				report_text_loc.innerHTML = `<b>${loc}</b>`;
				const report_text_time = document.createElement("div");
				report_text_time.className = "report_text";
				report_text_time.style = "font-size: 15px;";
				report_text_time.textContent = `${time}`;
				const report_text_magnitudeValue = document.createElement("div");
				report_text_magnitudeValue.className = "report_text report_scale";
				report_text_magnitudeValue.style.color = (report_data[i].id.includes("000")) ? "white" : "goldenrod";
				report_text_magnitudeValue.innerHTML = `<b>M&nbsp;${report_data[i].mag.toFixed(1)}</b>`;
				report_text_box.append(report_text_loc, report_text_time);
				report_info.append(report_text, report_text_box, report_text_magnitudeValue);
				const report_click_box = document.createElement("div");
				report_click_box.className = "report_click hide";
				report_click_box.id = `${originTime.getTime()}_click_box`;
				const report_click_report = document.createElement("i");
				report_click_report.className = "report_click_text fa fa-circle-info fa-2x";
				report_click_report.id = `${originTime.getTime()}_click_report`;
				report_click_report.onclick = () => {
					report_report(i);
				};
				const report_click_replay = document.createElement("i");
				report_click_replay.className = "report_click_text fa-regular fa-circle-play fa-2x";
				if (report_now_id == originTime.getTime()) {
					report_click_replay.className = "report_click_text fa-regular fa-square fa-2x";
				}
				report_click_replay.id = `${originTime.getTime()}_click_replay`;
				report_click_replay.onclick = () => {
					if (rts_replay_timestamp) {
						const skip = (report_now_id == originTime.getTime()) ? true : false;
						replay_stop();
						report.className = "report";
						report.style.border = "";
						report_click_replay.className = "report_click_text fa-regular fa-circle-play fa-2x";
						if (skip) {
							return;
						}
					}
					report.className = "report replay";
					report_click_replay.className = "report_click_text fa-regular fa-square fa-2x";
					report_now_id = originTime.getTime();
					rts_replay_timestamp = originTime.getTime();
					rts_replay_time = originTime.getTime() - 3000;
					replay_run();
					if (storage.getItem("report_eew")) {
						const _now = Now().getTime();
						get_data({
							"originTime"       : originTime.getTime(),
							"type"             : "eew-report",
							"time"             : _now + 3000,
							"lon"              : report_data[i].lon,
							"lat"              : report_data[i].lat,
							"depth"            : Math.round(report_data[i].depth),
							"scale"            : Number(report_data[i].mag.toFixed(1)),
							"timestamp"        : _now,
							"number"           : 1,
							"id"               : report_data[i].id + "R",
							"location"         : loc,
							"cancel"           : false,
							"replay_timestamp" : Date.now(),
						});
					}
				};
				const report_click_web = document.createElement("i");
				report_click_web.className = "report_click_text fa fa-globe fa-2x";
				report_click_web.id = `${originTime.getTime()}_click_web`;
				if (report_data[i].trem || !report_data[i].loc.startsWith("地震資訊")) {
					report_click_web.onclick = () => {
						shell.openExternal((report_data[i].trem) ? `https://exptech.com.tw/file/images/report/${report_data[i].id}.png` : `https://www.cwa.gov.tw/V8/C/E/EQ/${cwb_code}.html`);
					};
				} else {
					report_click_web.style = "color: red;";
				}
				report_click_box.append(report_click_report, report_click_replay, report_click_web);
				report.append(report_info, report_click_box);
			}
			if (!start) {
				start = true;
				/* if (!Object.keys(TREM.EQ_list).length) {
					report_report(i);
				} */
			}
			report.onmouseenter = () => {
				document.getElementById(`${originTime.getTime()}_click_box`).style.height = document.getElementById(`${originTime.getTime()}_info`).offsetHeight;
				document.getElementById(`${originTime.getTime()}_info`).className = "hide";
				document.getElementById(`${originTime.getTime()}_click_box`).className = "report_click";
			};
			report.onmouseleave = () => {
				document.getElementById(`${originTime.getTime()}_info`).className = "report_item";
				document.getElementById(`${originTime.getTime()}_click_box`).className = "report_click hide";
			};
			report.style.boxSizing = "border-box";
		}
		report_list.appendChild(report);
	}
}

function replay_stop() {
	for (const item of document.getElementsByClassName("report_click_text fa-regular fa-circle-play fa-2x")) {
		item.style.display = "";
	}
	eew_replay_stop();
	speech.cancel();
	rts_replay_time = 0;
	alert_timestamp = 0;
	rts_replay_timestamp = 0;
	report_now_id = 0;
	for (const key of Object.keys(TREM.EQ_list)) {
		if (TREM.EQ_list[key].epicenterIcon) {
			TREM.EQ_list[key].epicenterIcon.remove();
		}
		if (TREM.EQ_list[key].p_wave) {
			TREM.EQ_list[key].p_wave.remove();
		}
		if (TREM.EQ_list[key].s_wave) {
			TREM.EQ_list[key].s_wave.remove();
		}
		if (TREM.EQ_list[key].s_wave_back) {
			TREM.EQ_list[key].s_wave_back.remove();
		}
		if (TREM.EQ_list[key].progress) {
			TREM.EQ_list[key].progress.remove();
		}
		delete TREM.EQ_list[key];
	}
	eew_cache = [];
	data_cache = [];
	i_list = {
		data : [],
		time : 0,
	};
	time.style.cursor = "";
	time.style.color = "white";
	setTimeout(() => fetch_eew(), 1500);
	for (let i = 0; i < replay_list.length; i++) {
		fs.rmSync(path.join(app.getPath("userData"), `replay/${replay_list[i]}`));
		replay_list.splice(0, 1);
		i--;
	}
	document.getElementById("replay-icon").style.color = "transparent";
	on_rts_data({});
}

function replay_run() {
	for (const item of document.getElementsByClassName("report_click_text fa-regular fa-circle-play fa-2x")) {
		item.style.display = "none";
	}
	for (const key of Object.keys(TREM.EQ_list)) {
		if (TREM.EQ_list[key].epicenterIcon) {
			TREM.EQ_list[key].epicenterIcon.remove();
		}
		if (TREM.EQ_list[key].p_wave) {
			TREM.EQ_list[key].p_wave.remove();
		}
		if (TREM.EQ_list[key].s_wave) {
			TREM.EQ_list[key].s_wave.remove();
		}
		if (TREM.EQ_list[key].s_wave_back) {
			TREM.EQ_list[key].s_wave_back.remove();
		}
		if (TREM.EQ_list[key].progress) {
			TREM.EQ_list[key].progress.remove();
		}
		delete TREM.EQ_list[key];
	}
	eew_cache = [];
	data_cache = [];
	time.style.cursor = "pointer";
	time.style.color = "yellow";
	on_rts_data({});
	report_off();
}

function eew_replay_stop() {
	for (let i = 0; i < info_list.length; i++) {
		const info_box = document.getElementById("info_box");
		info_box.removeChild(info_box.children[i]);
		info_list.splice(i, 1);
		i--;
	}
}

function formatToChineseTime(dateTimeString) {
	const dateTime = new Date(dateTimeString);
	const hours = dateTime.getHours();
	const minutes = dateTime.getMinutes();
	const period = hours < 12 ? "早上" : "晚上";
	const formattedHours = hours <= 12 ? hours : hours - 12;
	const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
	return `${period} ${formattedHours}點${formattedMinutes}分 左右`;
}

function eew_location_intensity(data, depth) {
	const json = {};
	let eew_max_i = 0;
	for (const city of Object.keys(region)) {
		for (const town of Object.keys(region[city])) {
			const info = region[city][town];
			const dist_surface = dis(data.eq.lat, data.eq.lon, info.lat, info.lon);
			const dist = Math.sqrt(pow(dist_surface) + pow(data.eq.depth));
			const pga = 1.657 * Math.pow(Math.E, (1.533 * data.eq.mag)) * Math.pow(dist, -1.607);
			let i = pga_to_float(pga);
			if (i > 3) {
				i = eew_i([data.eq.lat, data.eq.lon], [info.lat, info.lon], data.eq.depth, data.eq.mag);
			}
			if (i > eew_max_i) {
				eew_max_i = i;
			}
			json[`${city} ${town}`] = {
				dist,
				i,
			};
		}
	}
	json.max_i = eew_max_i;
	return json;
}

function eew_location_info(data) {
	const dist_surface = dis(data.eq.lat, data.eq.lon, TREM.user.lat, TREM.user.lon);
	const dist = Math.sqrt(pow(dist_surface) + pow(data.eq.depth));
	const pga = 1.657 * Math.pow(Math.E, (1.533 * data.eq.mag)) * Math.pow(dist, -1.607) * (storage.getItem("site") ?? 1.751);
	let i = pga_to_float(pga);
	if (i > 3) {
		i = eew_i([data.eq.lat, data.eq.lon], [TREM.user.lat, TREM.user.lon], data.eq.depth, data.eq.mag);
	}
	return {
		dist,
		i,
	};
}

function eew_i(epicenterLocaltion, pointLocaltion, depth, magW) {
	const long = 10 ** (0.5 * magW - 1.85) / 2;
	const epicenterDistance = dis(epicenterLocaltion[0], epicenterLocaltion[1], pointLocaltion[0], pointLocaltion[1]);
	const hypocenterDistance = (depth ** 2 + epicenterDistance ** 2) ** 0.5 - long;
	const x = Math.max(hypocenterDistance, 3);
	const gpv600 = 10 ** (
		0.58 * magW +
      0.0038 * depth - 1.29 -
      Math.log10(x + 0.0028 * (10 ** (0.5 * magW))) -
      0.002 * x
	);
	const arv = 1.0;
	const pgv400 = gpv600 * 1.31;
	const pgv = pgv400 * arv;
	return 2.68 + 1.72 * Math.log10(pgv);
}

function dis(latA, lngA, latB, lngB) {
	latA = latA * Math.PI / 180;
	lngA = lngA * Math.PI / 180;
	latB = latB * Math.PI / 180;
	lngB = lngB * Math.PI / 180;
	const sin_latA = Math.sin(Math.atan(Math.tan(latA)));
	const sin_latB = Math.sin(Math.atan(Math.tan(latB)));
	const cos_latA = Math.cos(Math.atan(Math.tan(latA)));
	const cos_latB = Math.cos(Math.atan(Math.tan(latB)));
	return Math.acos(sin_latA * sin_latB + cos_latA * cos_latB * Math.cos(lngA - lngB)) * 6371.008;
}


function pga_to_float(pga) {
	return 2 * Math.log10(pga) + 0.7;
}

function pga_to_intensity(pga) {
	return intensity_float_to_int(pga_to_float(pga));
}

function int_to_color(int) {
	const list = ["#A6ADAD", "#6B7878", "#1E6EE6", "#32B464", "#FFE05D", "#FFAA13", "#EF700F", "#E60000", "#A00000", "#5D0090"];
	return list[int];
}

function ts_to_time(ts) {
	const now = new Date(ts);
	const YYYY = now.getFullYear();
	const MM = (now.getMonth() + 1).toString().padStart(2, "0");
	const DD = now.getDate().toString().padStart(2, "0");
	const hh = now.getHours().toString().padStart(2, "0");
	const mm = now.getMinutes().toString().padStart(2, "0");
	const ss = now.getSeconds().toString().padStart(2, "0");
	const t = `${YYYY}/${MM}/${DD} ${hh}:${mm}:${ss}`;
	return t;
}

async function report_report(info, report_detail=null) {
	if (Object.keys(TREM.EQ_list).length) {
		return;
	}
	if (TREM.report_time && !report_detail) {
		report_off();
	}
	if (click_report_id == info && !report_detail) {
		click_report_id = -1;
		return;
	}
	click_report_id = info;
	const data = report_data[info];
	TREM.report_time = now_time();
	const epicenterIcon = L.icon({
		iconUrl  : "../resource/images/cross.png",
		iconSize : [30, 30],
	});
	const intensity = data.int ?? 0;
	const intensity_level = (intensity == 0) ? "--" : int_to_intensity(intensity);
	if (TREM.report_epicenterIcon) {
		TREM.report_epicenterIcon.remove();
	}
	TREM.report_epicenterIcon = L.marker([data.lat, data.lon],
		{ icon: epicenterIcon, zIndexOffset: 6000 }).addTo(TREM.Maps.main);
	TREM.report_bounds.extend([data.lat, data.lon]);
	if(!report_detail){
		fetch_report_single(info, data.id);
	} else {
		for (const city of Object.keys(report_detail.list)) {
			for (const town of Object.keys(report_detail.list[city].town)) {
				const icon = L.divIcon({
					className : `dot intensity_${report_detail.list[city].town[town].int}`,
					html      : `<span>${int_to_intensity(report_detail.list[city].town[town].int)}</span>`,
					iconSize  : [30, 30],
				});
				TREM.report_icon_list[`${city}${town}-${Date.now()}`] = L.marker([report_detail.list[city].town[town].lat, report_detail.list[city].town[town].lon], { icon: icon, zIndexOffset: report_detail.list[city].town[town].int * 10 })
					.bindTooltip(`<div class='report_station_box'><div>地點: ${city} ${town}</div><div>位置: ${report_detail.list[city].town[town].lat} °N  ${report_detail.list[city].town[town].lon} °E</div><div>震度: ${int_to_intensity(report_detail.list[city].town[town].int)}</div></div>`, { opacity: 1 })
					.addTo(TREM.Maps.main);
				TREM.report_bounds.extend([report_detail.list[city].town[town].lat, report_detail.list[city].town[town].lon]);
			}
		}
	}
	Zoom = true;
	TREM.Maps.main.setView(TREM.report_bounds.getCenter(), TREM.Maps.main.getBoundsZoom(TREM.report_bounds) - 0.5);
	show_icon(true);
	document.getElementById("report_title_text").textContent = `${get_lang_string("report.title").replace("${type}", (data.loc.startsWith("地震資訊")) ? get_lang_string("report.title.Local") : get_lang_string("report.title.Small"))}`;
	if(report_detail)
		document.getElementById("report_max_intensity").textContent = (data.loc.startsWith("地震資訊")) ? "最大震度" : `${report_detail.Max_Level_areaName} ${report_detail.Max_Level_stationName}`;
	else
		document.getElementById("report_max_intensity").textContent = (data.loc.startsWith("地震資訊")) ? "最大震度" : "";
	const eew_intensity = document.getElementById("report_intensity");
	eew_intensity.className = `intensity_${intensity} intensity_center`;
	eew_intensity.textContent = intensity_level;
	const report_location = document.getElementById("report_location");
	const loc = data.loc;
	report_location.style.fontSize = (loc.length > 10) ? "16px" : (loc.length > 7) ? "20px" : "24px";
	report_location.textContent = loc;
	document.getElementById("report_time").textContent = get_lang_string("eew.time").replace("${time}", ts_to_time(data.time));
	let report_magnitudeValue = data.mag.toString();
	if (report_magnitudeValue.length == 1) {
		report_magnitudeValue = report_magnitudeValue + ".0";
	}
	document.getElementById("report_scale").textContent = `M ${report_magnitudeValue}`;
	document.getElementById("report_args").innerHTML = `${get_lang_string("word.depth")}:&nbsp;<b>${data.depth}</b>&nbsp;km`;
	info_box_change();
	on_rts_data({});
	if (storage.getItem("report_show_trem") ?? false) {
		const trem_eq = await fetch_trem_eq(data.trem[0]);
		if (!TREM.report_time) {
			return;
		}
		if (trem_eq && Object.keys(station).length) {
			const trem_eq_list = trem_eq.station;
			const epicenterIcon_trem = L.icon({
				iconUrl  : "../resource/images/cross_trem.png",
				iconSize : [30, 30],
			});
			const trem_eew = trem_eq.trem.eew[trem_eq.trem.eew.length - 1];
			if (TREM.report_epicenterIcon_trem) {
				TREM.report_epicenterIcon_trem.remove();
			}
			TREM.report_epicenterIcon_trem = L.marker([trem_eew.lat, trem_eew.lon],
				{ icon: epicenterIcon_trem, zIndexOffset: 6000 })
				.bindTooltip(`<div class='report_station_box'><div>報數: 共 ${trem_eq.trem.eew.length} 報</div><div>位置: ${trem_eew.location} | ${trem_eew.lat}°N  ${trem_eew.lon} °E</div><div>規模: M ${trem_eew.scale}</div><div>深度: ${trem_eew.depth} km</div><div>預估最大震度: ${int_to_intensity(trem_eew.max)}</div></div>`, { opacity: 1 })
				.addTo(TREM.Maps.main);
			if (TREM.report_circle_trem) {
				TREM.report_circle_trem.remove();
			}
			TREM.report_circle_trem = L.circle([data.epicenterLat, data.epicenterLon], {
				color     : "grey",
				fillColor : "transparent",
				radius    : speed_to_dis((trem_eq.alert - new Date(data.originTime.replaceAll("/", "-")).getTime()) / 1000, data.depth),
				className : "s_wave",
				weight    : 1,
			}).addTo(TREM.Maps.main);
			if (TREM.report_circle_cwb) {
				TREM.report_circle_cwb.remove();
			}
			if (trem_eq.eew) {
				TREM.report_circle_cwb = L.circle([data.epicenterLat, data.epicenterLon], {
					color     : "red",
					fillColor : "transparent",
					radius    : speed_to_dis((trem_eq.eew - new Date(data.originTime.replaceAll("/", "-")).getTime()) / 1000, data.depth),
					className : "s_wave",
					weight    : 1,
				}).addTo(TREM.Maps.main);
			}
			for (let i = 0; i < trem_eq_list.length; i++) {
				const uuid = trem_eq_list[i].uuid.split("-")[2];
				if (!station[uuid]) {
					continue;
				}
				const _info = station[uuid];
				const station_Intensity = trem_eq_list[i].intensity;
				const icon = (station_Intensity == 0) ? L.divIcon({
					className : "pga_dot dot_max pga_intensity_0",
					html      : "<span></span>",
					iconSize  : [10 + TREM.size, 10 + TREM.size],
				}) : L.divIcon({
					className : `dot_max intensity_${station_Intensity}`,
					html      : `<span>${int_to_intensity(station_Intensity)}</span>`,
					iconSize  : [30, 30],
				});
				TREM.report_icon_list[`${uuid}-${station_Intensity}-${Date.now()}`] = L.marker([_info.Lat, _info.Long], { icon: icon, zIndexOffset: station_Intensity * 10 })
					.bindTooltip(`<div class='report_station_box'><div>站名: ${uuid} ${trem_eq_list[i].name}</div><div>位置: ${_info.Lat.toFixed(2)} °N  ${_info.Long.toFixed(2)} °E</div><div>PGA: ${trem_eq_list[i].pga} gal</div><div>PGV: ${trem_eq_list[i].pgv} kine</div><div>震度: ${int_to_intensity(station_Intensity)}</div></div>`, { opacity: 1 })
					.addTo(TREM.Maps.main);
				TREM.report_bounds.extend([_info.Lat, _info.Long]);
			}
		}
	}
}

function info_box_change() {
	for (const item of document.getElementsByClassName("eew_box")) {
		item.style.display = "none";
	}
	for (const item of document.getElementsByClassName("report_box")) {
		item.style.display = "inline";
	}
	for (const item of document.getElementsByClassName("report_hide")) {
		item.style.display = "inline";
	}
}

function IntensityToClassString(level) {
	const classname = (level == 9) ? "seven"
		: (level == 8) ? "six strong"
			: (level == 7) ? "six"
				: (level == 6) ? "five strong"
					: (level == 5) ? "five"
						: (level == 4) ? "four"
							: (level == 3) ? "three"
								: (level == 2) ? "two"
									: (level == 1) ? "one"
										: "zero";
	return classname;
}

function add_info(icon_class, icon_color, info_title, info_title_color, info_body, time = 240000) {
	const item = document.createElement("div");
	item.className = "info_item";
	const body = document.createElement("div");
	body.className = "info_box_body";
	const icon = document.createElement("i");
	icon.className = icon_class;
	icon.style.color = icon_color;
	const text_body = document.createElement("div");
	const title = document.createElement("div");
	title.className = "info_box_title";
	title.innerHTML = info_title;
	title.style.color = info_title_color;
	const text = document.createElement("div");
	text.innerHTML = info_body;
	text_body.appendChild(title);
	text_body.appendChild(text);
	body.appendChild(icon);
	body.appendChild(text_body);
	item.appendChild(body);
	document.getElementById("info_box").appendChild(item);
	info_list.push(now_time() + time);
}

function show_icon(show = true, max = 1) {
	if (show) {
		document.getElementById("icon-pga").style.display = "none";
		document.getElementById("icon-i").style.display = "";
	} else {
		document.getElementById("icon-pga").style.display = "";
		document.getElementById("icon-i").style.display = "none";
	}
}

function show_screen(type) {
	if (type == "eew" && !item_show_eew) {
		return;
	}
	if (type == "report" && !item_show_report) {
		return;
	}
	if (type == "palert" && !item_show_palert) {
		return;
	}
	if (type == "trem" && !item_show_trem) {
		return;
	}
	if (type == "rts" && !item_show_trem) {
		return;
	}
	if (type == "tsunami" && !item_show_eew) {
		return;
	}
	win.flashFrame(true);
	win.setAlwaysOnTop(true);
	win.show();
	win.setAlwaysOnTop(false);
}

function geoJsonMap(geojson, config, map) {
	if (item_disable_geojson_vt) {
		return L.geoJson(geojson, config).addTo(map);
	} else {
		return L.geoJson.vt(geojson, config).addTo(map);
	}
}

function time_replay(time) {
	replay_run();
	rts_replay_time = new Date(time).getTime();
}

function code_to_town(code) {
	for (const city of Object.keys(region)) {
		for (const town of Object.keys(region[city])) {
			const info = region[city][town];
			if (info.code == code) {
				return {
					city,
					town,
				};
			}
		}
	}
	return null;
}

function speed_to_dis(sec, depth) {
	for (let i = 1; i <= 1000; i++) {
		if (_speed(depth, i).Stime > sec) {
			return i * 1000;
		}
	}
	return 0;
}

function findClosest(arr, target) {
	return arr.reduce((prev, curr) => (Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev));
}