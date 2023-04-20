/* eslint-disable no-undef */
require("expose-gc");
let player_1 = false;
let player_2 = false;
let drawer_lock = false;
let focus_lock = false;
let Zoom = false;
let Zoom_timestamp = 0;
// eslint-disable-next-line prefer-const
let rts_replay_timestamp = 0;
let rts_replay_time = 0;
let screenshot_id = "";
let reciprocal = 0;
let arrive_count = 0;
let disable_autoZoom = false;
let audio_intensity = false;
let audio_second = false;
let audio_reciprocal = -1;
const source_data = {};

const source_list = ["1/intensity-strong", "1/intensity-weak", "1/intensity", "1/second", "1/ding", "1/arrive",
	"1/9x", "1/8x", "1/7x", "1/6x", "1/5x", "1/4x", "1/3x", "1/2x",
	"1/x9", "1/x8", "1/x7", "1/x6", "1/x5", "1/x4", "1/x3", "1/x2", "1/x1",
	"1/x0", "1/10", "1/9", "1/8", "1/7", "1/6", "1/5", "1/4", "1/3", "1/2", "1/1", "1/0",
	"Note", "Alert", "EEW", "EEW2", "palert", "PGA1", "PGA2", "Report", "Shindo0", "Shindo1", "Shindo2", "Update", "Water"];
if (storage.getItem("audio_cache") ?? true)
	for (let i = 0; i < source_list.length; i++)
		source_data[source_list[i]] = fs.readFileSync(path.resolve(app.getAppPath(), `./resource/audios/${source_list[i]}.wav`)).buffer;

const time = document.getElementById("time");
const _status = document.getElementById("status");
const _get_data = document.getElementById("get_data");

document.getElementById("map").addEventListener("mousedown", () => {
	Zoom = false;
	focus_lock = true;
	const location_button = document.getElementById("location_button");
	location_button.style.color = "white";
	location_button.style.border = "1px solid red";
});

time.addEventListener("click", () => {
	if (rts_replay_timestamp) replay_stop();
	if (TREM.report_epicenterIcon) report_off();
	refresh_report_list();
});

setInterval(() => {
	setTimeout(() => {
		const now = (rts_replay_time) ? new Date(rts_replay_time).getTime() : Now().getTime();
		if (WS) time.innerHTML = `<b>${time_to_string(now)}</b>`;
		else if (replay) time.innerText = `${new Date(replay + (NOW.getTime() - replayT)).format("YYYY/MM/DD HH:mm:ss")}`;
		if (screenshot_id != "") {
			const _screenshot_id = screenshot_id;
			screenshot_id = "";
			setTimeout(() => {
				ipcRenderer.send("screenshot_auto", {
					id: _screenshot_id,
				});
			}, 1000);
		}
		if (Object.keys(TREM.EQ_list).length) {
			$(".flash").css("visibility", "hidden");
			setTimeout(() => {
				$(".flash").css("visibility", "visible");
			}, 500);
		}
		if (Object.keys(detection_box).length) {
			for (let i = 0; i < Object.keys(detection_box).length; i++) {
				const key = Object.keys(detection_box)[i];
				detection_box[key].options.color = "transparent";
				detection_box[key].redraw();
			}
			setTimeout(() => {
				for (let i = 0; i < Object.keys(detection_box).length; i++) {
					const key = Object.keys(detection_box)[i];
					detection_box[key].options.color = detection_box[key].options._color;
					detection_box[key].redraw();
				}
			}, 500);
		}
		if (!sleep_state) {
			let _status_text = "";
			if (rts_replay_time) _status_text = "🔁 重播資料";
			else if (rts_lag < 1500) _status_text = `⚡ 即時資料 ${(rts_lag / 1000).toFixed(1)}s`;
			else if (rts_lag < 7500) _status_text = `📶 延遲較高 ${(rts_lag / 1000).toFixed(1)}s`;
			else _status_text = `⚠️ 延遲資料 ${(rts_lag / 1000).toFixed(1)}s`;
			let error = "";
			if (!WS) error += "2";
			if (!service_status.websocket.status) error += "1";
			if (!FCM) error += "3";
			if (!service_status.p2p.status) error += "4";
			_status.innerHTML = _status_text + ((error == "") ? "" : ` | 📛 ${error}`);
			_get_data.innerHTML = "";
			if (type_list.length) {
				if (type_list.includes("http")) {
					const div = document.createElement("div");
					div.innerHTML = "🟩 Http";
					_get_data.append(div);
				}
				if (type_list.includes("p2p")) {
					const div = document.createElement("div");
					div.innerHTML = "🟦 P2P";
					_get_data.append(div);
				}
				if (type_list.includes("websocket")) {
					const div = document.createElement("div");
					div.innerHTML = "⬜ Websocket";
					_get_data.append(div);
				}
				if (type_list.includes("fcm")) {
					const div = document.createElement("div");
					div.innerHTML = "🟥 FCM";
					_get_data.append(div);
				}
				type_list = [];
			}
		}
	}, 1000 - Now().getMilliseconds());
}, 1_000);

setInterval(async () => {
	try {
		if (!rts_replay_time) return;
		if (rts_replay_time - rts_replay_timestamp > 240_000) {
			replay_stop();
			return;
		}
		const controller = new AbortController();
		setTimeout(() => {
			controller.abort();
		}, 1500);
		let ans = await fetch(`https://exptech.com.tw/api/v2/trem/rts?time=${rts_replay_time}`, { signal: controller.signal })
			.catch((err) => void 0);
		if (!rts_replay_time) return;
		rts_replay_time += 1000;
		if (controller.signal.aborted || ans == undefined) return;
		ans = await ans.json();
		on_rts_data(ans);
	} catch (err) {
		void 0;
	}
}, 1_000);

setInterval(() => {
	if (TREM.palert.time && Date.now() - TREM.palert.time > 300_000) {
		TREM.palert.time = 0;
		if (TREM.palert.geojson) {
			TREM.palert.geojson.remove();
			delete TREM.palert.geojson;
		}
		refresh_report_list();
	}
	if (Date.now() - TREM.palert_report_time > 600_000 && TREM.palert_report_time) {
		TREM.palert_report_time = 0;
		refresh_report_list();
	}
	if (Date.now() - TREM.report_time > 30_000 && TREM.report_time) {
		TREM.report_time = 0;
		click_report_id = -1;
		report_off();
	}
	for (let i = 0; i < info_list.length; i++)
		if (Date.now() > info_list[i]) {
			const info_box = document.getElementById("info_box");
			info_box.removeChild(info_box.children[i]);
			info_list.splice(i, 1);
			break;
		}
	if (!sleep_state) {
		if (storage.getItem("reset")) {
			storage.removeItem("reset");
			set_user_location();
			sleep();
		}
		disable_autoZoom = storage.getItem("disable_autoZoom") ?? false;
	}
}, 3000);

setInterval(() => {
	if (Now().getMinutes() % 10 == 0) {
		get_station_info();
		storage.setItem("report_data", []);
		refresh_report_list(true);
		check_update();
	}
}, 60_000);
const audioContext = new AudioContext();
const audioContext1 = new AudioContext();
setInterval(() => {
	if (TREM.audio.main.length) {
		if (player_1) return;
		player_1 = true;
		const nextAudioPath = TREM.audio.main.shift();
		if (!source_data[nextAudioPath]) source_data[nextAudioPath] = fs.readFileSync(path.resolve(app.getAppPath(), `./resource/audios/${nextAudioPath}.wav`)).buffer;
		audioContext.decodeAudioData(source_data[nextAudioPath], (buffer) => {
			delete source_data[nextAudioPath];
			const source = audioContext.createBufferSource();
			source.buffer = buffer;
			source.connect(audioContext.destination);
			source.playbackRate = 1.1;
			source.start();
			source.onended = () => {
				source.disconnect();
				player_1 = false;
				fs.readFile(path.resolve(app.getAppPath(), `./resource/audios/${nextAudioPath}.wav`), (err, data) => {
					source_data[nextAudioPath] = data.buffer;
				});
			};
		});
	}
	if (TREM.audio.minor.length) {
		if (player_2) return;
		player_2 = true;
		const nextAudioPath = TREM.audio.minor.shift();
		if (!source_data[nextAudioPath]) source_data[nextAudioPath] = fs.readFileSync(path.resolve(app.getAppPath(), `./resource/audios/${nextAudioPath}.wav`)).buffer;
		audioContext1.decodeAudioData(source_data[nextAudioPath], (buffer) => {
			delete source_data[nextAudioPath];
			const source = audioContext1.createBufferSource();
			source.buffer = buffer;
			source.connect(audioContext1.destination);
			source.playbackRate = 1.1;
			source.start();
			source.onended = () => {
				source.disconnect();
				player_2 = false;
				fs.readFile(path.resolve(app.getAppPath(), `./resource/audios/${nextAudioPath}.wav`), (err, data) => {
					source_data[nextAudioPath] = data.buffer;
				});
			};
		});
	}
}, 0);

setInterval(() => {
	if (drawer_lock) return;
	drawer_lock = true;
	if (!Object.keys(TREM.EQ_list).length) {
		eew(false);
		if (TREM.geojson) {
			TREM.geojson.remove();
			delete TREM.geojson;
		}
		if (TREM.eew_info_clear) {
			TREM.eew_info_clear = false;
			$(".eew_hide").css("display", "none");
			document.getElementById("detection_location_1").style.display = "";
			document.getElementById("detection_location_2").style.display = "";
			document.getElementById("eew_title_text").innerHTML = "";
			document.getElementById("eew_title_text_number").innerHTML = "";
			document.getElementById("eew_box").style.backgroundColor = "#333439";
			const eew_body = document.getElementById("eew_body");
			eew_body.style.backgroundColor = "#333439";
			eew_body.style.border = "";
			document.getElementById("reciprocal").style.display = "none";
			TREM.eew_bounds = L.latLngBounds();
			global.gc();
		}
		TREM.alert = false;
		TREM.arrive = false;
		TREM.user_alert = false;
		drawer_lock = false;
		audio_intensity = false;
		audio_second = false;
		audio_reciprocal = -1;
		TREM.dist = 0;
		arrive_count = 0;
		return;
	} else {
		eew(true);
		let user_max_intensity = -1;
		let user_p_wave = 0;
		let user_s_wave = 0;
		for (let i = 0; i < Object.keys(TREM.EQ_list).length; i++) {
			const key = Object.keys(TREM.EQ_list)[i];
			const data = TREM.EQ_list[key].data;
			if (TREM.EQ_list[key].trem) {
				if (Now().getTime() - data.timestamp > 90_000) {
					if (TREM.EQ_list[key].epicenterIcon) TREM.EQ_list[key].epicenterIcon.remove();
					delete TREM.EQ_list[key];
				}
				continue;
			}
			const _eew_location_info = eew_location_info(data);
			const tr_time = _speed(data.depth, _eew_location_info.dist);
			const intensity = pga_to_intensity(_eew_location_info.pga);

			if (data.type == "eew-report") data.time = Now().getTime() - (rts_replay_time - data.originTime);
			if (intensity > user_max_intensity) user_max_intensity = intensity;
			if (Now().getTime() - data._time > 240_000) {
				if (TREM.EQ_list[key].p_wave) TREM.EQ_list[key].p_wave.remove();
				if (TREM.EQ_list[key].s_wave) TREM.EQ_list[key].s_wave.remove();
				if (TREM.EQ_list[key].epicenterIcon) TREM.EQ_list[key].epicenterIcon.remove();
				if (TREM.EQ_list[key].progress) TREM.EQ_list[key].progress.remove();
				delete TREM.EQ_list[key];
				draw_intensity();
				break;
			}
			if (data.cancel) continue;
			if (data.time + (tr_time.Ptime * 1000) < user_p_wave || user_p_wave == 0) user_p_wave = data.time + (tr_time.Ptime * 1000);
			if (data.time + (tr_time.Stime * 1000) < user_s_wave || user_s_wave == 0) user_s_wave = data.time + (tr_time.Stime * 1000);
			const wave = { p: 7, s: 4 };
			let p_dist = Math.floor(Math.sqrt(pow((Now().getTime() - data.time) * wave.p) - pow(data.depth * 1000)));
			let s_dist = Math.floor(Math.sqrt(pow((Now().getTime() - data.time) * wave.s) - pow(data.depth * 1000)));
			for (let _i = 1; _i < TREM.EQ_list[key].wave.length; _i++)
				if (TREM.EQ_list[key].wave[_i].Ptime > (Now().getTime() - data.time) / 1000) {
					p_dist = (_i - 1) * 1000;
					if ((_i - 1) / TREM.EQ_list[key].wave[_i - 1].Ptime > wave.p) p_dist = Math.round(Math.sqrt(pow((Now().getTime() - data.time) * wave.p) - pow(data.depth * 1000)));
					break;
				}
			for (let _i = 1; _i < TREM.EQ_list[key].wave.length; _i++)
				if (TREM.EQ_list[key].wave[_i].Stime > (Now().getTime() - data.time) / 1000) {
					s_dist = (_i - 1) * 1000;
					if ((_i - 1) / TREM.EQ_list[key].wave[_i - 1].Stime > wave.s) s_dist = Math.round(Math.sqrt(pow((Now().getTime() - data.time) * wave.s) - pow(data.depth * 1000)));
					break;
				}
			TREM.EQ_list[key].dist = s_dist;
			if (p_dist > data.depth)
				if (!TREM.EQ_list[key].p_wave)
					TREM.EQ_list[key].p_wave = L.circle([data.lat, data.lon], {
						color     : "#00FFFF",
						fillColor : "transparent",
						radius    : p_dist,
						className : "p_wave",
						weight    : 0.5,
					}).addTo(TREM.Maps.main);
				else
					TREM.EQ_list[key].p_wave.setRadius(p_dist);
			if (s_dist < data.depth) {
				const progress = Math.round(((Now().getTime() - data.time) / 1000 / TREM.EQ_list[key].wave[1].Stime) * 100);
				const icon = L.divIcon({
					className : "progress_bar",
					html      : `<div style="background-color: aqua;height: ${progress}%;"></div>`,
					iconSize  : [5, 50],
				});
				if (TREM.EQ_list[key].progress)
					TREM.EQ_list[key].progress.setIcon(icon);
				else
					TREM.EQ_list[key].progress = L.marker([data.lat, data.lon + 0.15], { icon: icon }).addTo(TREM.Maps.main);
			} else {
				if (TREM.EQ_list[key].progress) {
					TREM.EQ_list[key].progress.remove();
					delete TREM.EQ_list[key].progress;
				}
				if (!TREM.EQ_list[key].s_wave)
					TREM.EQ_list[key].s_wave = L.circle([data.lat, data.lon], {
						color     : (data.type == "eew-report") ? "grey" : (data.type == "eew-trem") ? "#73BF00" : (TREM.EQ_list[key].eew > 4) ? "red" : "#FF8000",
						fillColor : "transparent",
						radius    : s_dist,
						className : "s_wave",
						weight    : 2,
					}).addTo(TREM.Maps.main);
				else
					TREM.EQ_list[key].s_wave.setRadius(s_dist);
				if (key == show_eew_id) {
					TREM.eew_bounds = L.latLngBounds();
					TREM.eew_bounds.extend(TREM.EQ_list[key].s_wave.getBounds());
				}
			}
			if (key == show_eew_id) TREM.eew_bounds.extend([data.lat, data.lon]);
		}
		const p_time = Math.floor((user_p_wave - Now().getTime()) / 1000);
		let s_time = Math.floor((user_s_wave - Now().getTime()) / 1000);
		document.getElementById("p_wave").innerHTML = `P波&nbsp;${(!user_p_wave) ? "--秒" : (p_time > 0) ? `${p_time}秒` : "抵達"}`;
		document.getElementById("s_wave").innerHTML = `S波&nbsp;${(!user_s_wave) ? "--秒" : (s_time > 0) ? `${s_time}秒` : "抵達"}`;
		const _reciprocal_intensity = document.getElementById("reciprocal_intensity");
		const _intensity = int_to_intensity(user_max_intensity);
		_reciprocal_intensity.innerHTML = _intensity;
		_reciprocal_intensity.className = `reciprocal_intensity intensity_${user_max_intensity}`;
		if (user_max_intensity > 0) {
			document.getElementById("reciprocal").style.display = "flex";
			if (!TREM.arrive)
				if (!TREM.audio.main.length && s_time < 100 && Date.now() - reciprocal > 950) {
					if (audio_reciprocal == -1) audio_reciprocal = s_time;
					if (audio_reciprocal > s_time) {
						audio_reciprocal = s_time;
						reciprocal = Date.now();
						if (!audio_intensity) {
							audio_intensity = true;
							TREM.audio.main.push(`1/${_intensity.replace("⁻", "").replace("⁺", "")}`);
							if (_intensity.includes("⁺")) TREM.audio.main.push("1/intensity-strong");
							else if (_intensity.includes("⁻")) TREM.audio.main.push("1/intensity-weak");
							else TREM.audio.main.push("1/intensity");
						} else if (!audio_second) {
							audio_second = true;
							s_time -= 2;
							if (s_time < 99 && s_time > 0) {
								if (s_time > 20)
									if (s_time % 10 == 0) {
										TREM.audio.main.push(`1/${s_time.toString().substring(0, 1)}x`);
										TREM.audio.main.push("1/x0");
									} else {
										TREM.audio.main.push(`1/${s_time.toString().substring(0, 1)}x`);
										TREM.audio.main.push(`1/x${s_time.toString().substring(1, 2)}`);
									}
								else if (s_time > 10)
									if (s_time % 10 == 0) TREM.audio.main.push("1/x0");
									else TREM.audio.main.push(`1/x${s_time.toString().substring(1, 2)}`);
								else TREM.audio.main.push(`1/${s_time}`);
								TREM.audio.main.push("1/second");
							}
						} else
						if (s_time <= 0)
							if (arrive_count == 0) {
								TREM.audio.main.push("1/arrive");
								arrive_count++;
							} else if (arrive_count <= 5) {
								TREM.audio.main.push("1/ding");
								arrive_count++;
							} else TREM.arrive = true;
						else if (s_time > 10)
							if (s_time % 10 != 0) TREM.audio.main.push("1/ding");
							else {
								TREM.audio.main.push(`1/${s_time.toString().substring(0, 1)}x`);
								TREM.audio.main.push("1/x0");
							}
						else TREM.audio.main.push(`1/${s_time.toString()}`);
					}
				}
		}
		if (user_max_intensity > 4 && !TREM.user_alert) {
			TREM.user_alert = true;
			add_info("fa-solid fa-house-crack fa-2x info_icon", "#921AFF", "注意掩護", "#FF8000", "根據資料顯示您所在的地區<br>將發生劇烈搖晃<br>請注意自身安全<br>臨震應變 趴下、掩護、穩住");
		}
	}
	drawer_lock = false;
}, 100);

setInterval(() => {
	if (sleep_state) return;
	if (focus_lock || disable_autoZoom) return;
	let nsspe = true;
	for (let i = 0; i < Object.keys(TREM.EQ_list).length; i++) {
		const key = Object.keys(TREM.EQ_list)[i];
		if (!TREM.EQ_list[key].trem) {
			nsspe = false;
			break;
		}
	}
	if (!TREM.report_epicenterIcon)
		if (!Object.keys(TREM.EQ_list).length || nsspe) {
			if (TREM.rts_bounds._northEast == undefined) {
				if (Zoom && Date.now() - Zoom_timestamp > 2500) {
					Zoom = false;
					TREM.Maps.main.setView([23.7, 120.4], 7.8);
				}
				return;
			}
			Zoom_timestamp = Date.now();
			Zoom = true;
			TREM.Maps.main.setView(TREM.rts_bounds.getCenter(), TREM.Maps.main.getBoundsZoom(TREM.rts_bounds) - 1);
			TREM.rts_bounds = L.latLngBounds();
		} else {
			TREM.rts_bounds = L.latLngBounds();
			const dist_list = [];
			for (let i = 0; i < Object.keys(TREM.EQ_list).length; i++) {
				const key = Object.keys(TREM.EQ_list)[i];
				if (TREM.EQ_list[key].trem) continue;
				dist_list.push(TREM.EQ_list[key].dist ?? 0);
			}
			Zoom_timestamp = Date.now();
			Zoom = true;
			const zoom_now = TREM.Maps.main.getZoom();
			const center_now = TREM.Maps.main.getCenter();
			if (TREM.eew_bounds._northEast == undefined) return;
			const center = TREM.eew_bounds.getCenter();
			let zoom = TREM.Maps.main.getBoundsZoom(TREM.eew_bounds) - 1;
			if (Math.abs(zoom - zoom_now) < 0.6 || Math.min(dist_list) / 1000 - TREM.dist > -45) zoom = zoom_now;
			if (zoom > 9.5) zoom = 9.5;
			const set_center = Math.sqrt(pow((center.lat - center_now.lat) * 111) + pow((center.lng - center_now.lng) * 101));
			TREM.Maps.main.setView((set_center > 5) ? center : center_now, (zoom > 7.5) ? zoom : 7.5);
		}
}, 50);

setInterval(() => {
	if (raw_data.length) {
		const data = raw_data.shift();
		if (data.type == "websocket" || (data.verify || storage.getItem("p2p_focus"))) get_data(data.data, data.type);
	}
}, 0);