/* eslint-disable no-undef */
require("expose-gc");

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
const disable_autoZoom = false;
let audio_intensity = false;
let audio_second = false;
let audio_reciprocal = -1;
const source_data = {};
const detection_box = {};

const source_list = ["1/intensity-strong", "1/intensity-weak", "1/intensity", "1/second", "1/ding", "1/arrive",
	"1/9x", "1/8x", "1/7x", "1/6x", "1/5x", "1/4x", "1/3x", "1/2x",
	"1/x9", "1/x8", "1/x7", "1/x6", "1/x5", "1/x4", "1/x3", "1/x2", "1/x1",
	"1/x0", "1/10", "1/9", "1/8", "1/7", "1/6", "1/5", "1/4", "1/3", "1/2", "1/1", "1/0",
	"Note", "EEW", "EEW2", "palert", "PGA1", "PGA2", "Report", "Shindo0", "Shindo1", "Shindo2", "Water", "Warn", "update"];
if (storage.getItem("audio_cache") ?? true) {
	for (let i = 0; i < source_list.length; i++) {
		source_data[source_list[i]] = fs.readFileSync(path.resolve(app.getAppPath(), `./resource/audios/${source_list[i]}.wav`)).buffer;
	}
}

const item_audio_ding = storage.getItem("audio.1/ding") ?? true;
const eew_audio_type = storage.getItem("eew_audio_type") ?? "1";

const time = document.getElementById("time");
const _status = document.getElementById("status");
const _get_data = document.getElementById("get_data");
const map = document.getElementById("map");

const icon_server = document.getElementById("icon-server");
const icon_p2p = document.getElementById("icon-p2p");
const icon_fcm = document.getElementById("icon-fcm");
const icon_lag = document.getElementById("icon-lag");
const replay_icon = document.getElementById("replay-icon");

const _reciprocal_intensity = document.getElementById("reciprocal_intensity");

_get_data.style.display = "none";

let last_map_time = 0;
let check_file_replay = false;

map.onmousedown = () => {
	last_map_time = Date.now();
	Zoom = false;
	focus_lock = true;
	const location_button = document.getElementById("location_button");
	location_button.style.color = "white";
	location_button.style.border = "1px solid red";
};

map.onwheel = () => {
	last_map_time = Date.now();
	focus_lock = true;
	const location_button = document.getElementById("location_button");
	location_button.style.color = "white";
	location_button.style.border = "1px solid red";
};

time.onclick = () => {
	if (rts_replay_time) {
		replay_stop();
	}
	if (TREM.report_time) {
		report_off();
	}
	refresh_report_list();
	time.style.cursor = "";
};

setInterval(() => {
	setTimeout(() => {
		const now = (rts_replay_time) ? rts_replay_time : Now().getTime();
		if (WS) {
			time.innerHTML = `<b>${time_to_string(now)}</b>`;
			if (!check_file_replay) {
				check_file_replay = true;
				if (replay_list.length) {
					rts_replay_time = Number(replay_list[0].split(".")[0] * 1000);
					replay_run();
				}
			}
		}
		for (const item of document.getElementsByClassName("flash")) {
			item.style.visibility = "hidden";
		}
		setTimeout(() => {
			for (const item of document.getElementsByClassName("flash")) {
				item.style.visibility = "visible";
			}
		}, 500);
		const _detection_list = Object.keys(detection_list).sort((a, b) => detection_list[a] - detection_list[b]);
		for (const key of Object.keys(detection_box)) {
			detection_box[key].remove();
			delete detection_box[key];
		}
		if (_detection_list.length) {
			setTimeout(() => {
				for (let i = 0; i < _detection_list.length; i++) {
					const key = _detection_list[i];
					if (!detection_data[key]) {
						continue;
					}
					let passed = false;
					for (const _key of Object.keys(TREM.EQ_list)) {
						const _data = TREM.EQ_list[_key].data;
						let SKIP = 0;
						for (let _i = 0; _i < 4; _i++) {
							const dist = Math.sqrt(pow((detection_data[key][_i][0] - _data.lat) * 111) + pow((detection_data[key][_i][1] - _data.lon) * 101));
							if (TREM.EQ_list[_key].dist / 1000 > dist) {
								SKIP++;
							}
						}
						if (SKIP >= 4) {
							passed = true;
							break;
						}
					}
					if (passed) {
						continue;
					}
					TREM.rts_bounds.extend(detection_data[key]);
					if (!detection_box[key]) {
						detection_box[key] = L.polygon(detection_data[key], {
							fillColor : "transparent",
							color     : (detection_list[key] > 3) ? "#FF0000" : (detection_list[key] > 1) ? "#F9F900" : "#28FF28",
						}).addTo(TREM.Maps.main);
					}
				}
			}, 500);
		}
		if (screenshot_id != "") {
			const _screenshot_id = screenshot_id;
			screenshot_id = "";
			setTimeout(() => {
				ipcRenderer.send("screenshot_auto", { id: _screenshot_id });
			}, 1750);
		}
		if (!sleep_state) {
			let _status_text = "";
			if (rts_replay_time) {
				_status_text = "🔁 重播資料";
			} else if (rts_lag < 100) {
				_status_text = `⚡ 即時資料 ${(rts_lag / 1000).toFixed(1)}s`;
			} else if (rts_lag < 1000) {
				_status_text = `📶 延遲較高 ${(rts_lag / 1000).toFixed(1)}s`;
			} else {
				_status_text = `⚠️ 延遲資料 ${(rts_lag / 1000).toFixed(1)}s`;
			}
			if (rts_lag > 1500 && !rts_replay_time) {
				icon_lag.style.display = "";
			} else {
				icon_lag.style.display = "none";
			}
			if (!WS) {
				icon_server.style.display = "";
			} else {
				icon_server.style.display = "none";
			}
			if (!FCM) {
				icon_fcm.style.display = "";
			} else {
				icon_fcm.style.display = "none";
			}
			if (!info.in.length) {
				icon_p2p.style.display = "";
			} else {
				icon_p2p.style.display = "none";
			}
			_status.innerHTML = _status_text;
			_get_data.innerHTML = "";
			if (now_time() - type_list.time < 1000) {
				_get_data.style.display = "";
				if (now_time() - type_list.http < 1000) {
					const div = document.createElement("div");
					div.innerHTML = "🟩 Http";
					_get_data.append(div);
				}
				if (now_time() - type_list.p2p < 1000) {
					const div = document.createElement("div");
					div.innerHTML = "🟦 P2P";
					_get_data.append(div);
				}
				if (now_time() - type_list.websocket < 1000) {
					const div = document.createElement("div");
					div.innerHTML = "⬜ Websocket";
					_get_data.append(div);
				}
				if (now_time() - type_list.fcm < 1000) {
					const div = document.createElement("div");
					div.innerHTML = "🟥 FCM";
					_get_data.append(div);
				}
			} else {
				_get_data.style.display = "none";
			}
		}
	}, 1000 - Now().getMilliseconds());
}, 1_000);

setInterval(() => {
	try {
		if (!rts_replay_time) {
			return;
		}
		if (rts_replay_timestamp && rts_replay_time - rts_replay_timestamp > 600_000) {
			replay_stop();
			return;
		}
		if (replay_list.length) {
			const data = JSON.parse(fs.readFileSync(path.join(app.getPath("userData"), `replay/${replay_list[0]}`)).toString());
			fs.rmSync(path.join(app.getPath("userData"), `replay/${replay_list[0]}`));
			rts_replay_time = Number(replay_list[0].split(".")[0] * 1000);
			const ans_eew = data.eew;
			for (let i = 0; i < ans_eew.eew.length; i++) {
				ans_eew.eew[i].replay_timestamp = ans_eew.eew[i].timestamp;
				ans_eew.eew[i].replay_time = ans_eew.eew[i].time;
				ans_eew.eew[i].time = Now().getTime() - (ans_eew.eew[i].timestamp - ans_eew.eew[i].time);
				ans_eew.eew[i].timestamp = Now().getTime();
				get_data(ans_eew.eew[i], "http");
			}
			on_rts_data(data.rts);
			replay_list.splice(0, 1);
			if (!replay_list.length) {
				replay_stop();
			}
		} else {
			const controller = new AbortController();
			setTimeout(() => controller.abort(), 2500);
			const _replay_time = Math.round(rts_replay_time / 1000);
			rts_replay_time += 1000;
			const now = new Date(_replay_time * 1000);
			const YYYY = now.getFullYear();
			const MM = (now.getMonth() + 1).toString().padStart(2, "0");
			const DD = now.getDate().toString().padStart(2, "0");
			const hh = now.getHours().toString().padStart(2, "0");
			const mm = now.getMinutes().toString().padStart(2, "0");
			const ss = now.getSeconds().toString().padStart(2, "0");
			const t = `${YYYY}${MM}${DD}${hh}${mm}${ss}`;
			fetch(`https://api.exptech.com.tw/api/v1/trem/rts/${t}`, { signal: controller.signal })
				.then(async (ans) => {
					ans = await ans.json();
					if (!rts_replay_time) {
						return;
					}
					on_rts_data(ans);
				})
				.catch((err) => {
					log(err, 3, "loop", "replay_rts");
				});
			fetch(`https://api.exptech.com.tw/api/v1/eq/eew/${t}?type=all`, { signal: controller.signal })
				.then(async (ans_eew) => {
					ans_eew = await ans_eew.json();
					if (!rts_replay_time) {
						return;
					}
					for (const eew of ans_eew.eew) {
						eew.replay_timestamp = eew.timestamp;
						eew.replay_time = eew.time;
						eew.time = Now().getTime() - (_replay_time * 1000 - eew.time);
						eew.timestamp = Now().getTime() - (_replay_time * 1000 - eew.timestamp);
						get_data(eew, "http");
					}
				})
				.catch((err) => {
					log(err, 3, "loop", "replay_eew");
				});
			for (const item of document.getElementsByClassName("report replay")) {
				item.style.border = "2px solid red";
			}
			replay_icon.style.color = "gold";
			setTimeout(() => {
				for (const item of document.getElementsByClassName("report replay")) {
					item.style.border = "2px solid transparent";
				}
				replay_icon.style.color = "transparent";
			}, 500);
		}
	} catch (err) {
		log(err, 3, "loop", "replay");
	}
}, 1_000);

setInterval(() => {
	if (now_time() - TREM.report_time > 90_000 && TREM.report_time) {
		click_report_id = -1;
		report_off();
	}
	for (let i = 0; i < info_list.length; i++) {
		if (now_time() > info_list[i]) {
			const info_box = document.getElementById("info_box");
			info_box.removeChild(info_box.children[i]);
			info_list.splice(i, 1);
			break;
		}
	}
}, 3000);

setInterval(() => {
	get_station_info();
	refresh_report_list(true);
}, 300_000);

setInterval(() => {
	if (TREM.audio.length) {
		const audioContext = new AudioContext();
		const nextAudioPath = TREM.audio.shift();
		if (!source_data[nextAudioPath]) {
			source_data[nextAudioPath] = fs.readFileSync(path.resolve(app.getAppPath(), `./resource/audios/${nextAudioPath}.wav`)).buffer;
		}
		audioContext.decodeAudioData(source_data[nextAudioPath], (buffer) => {
			delete source_data[nextAudioPath];
			const source = audioContext.createBufferSource();
			source.buffer = buffer;
			source.connect(audioContext.destination);
			source.playbackRate = 1.1;
			source.start();
			source.onended = () => {
				source.disconnect();
				fs.readFile(path.resolve(app.getAppPath(), `./resource/audios/${nextAudioPath}.wav`), (err, data) => {
					source_data[nextAudioPath] = data.buffer;
					audioContext.close();
				});
			};
		});
	}
}, 0);

setInterval(() => {
	if (drawer_lock) {
		return;
	}
	const list = Object.keys(TREM.EQ_list);
	drawer_lock = true;
	if (!list.length) {
		eew(false);
		if (TREM.geojson) {
			TREM.geojson.remove();
			delete TREM.geojson;
		}
		if (TREM.eew_info_clear) {
			TREM.eew_info_clear = false;
			for (const item of document.getElementsByClassName("eew_hide")) {
				item.style.display = "none";
			}
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
		TREM.eew = false;
		TREM.arrive = false;
		TREM.user_alert = false;
		drawer_lock = false;
		audio_intensity = false;
		audio_second = false;
		audio_reciprocal = -1;
		TREM.dist = 0;
		arrive_count = 0;
		i_list.data = [];
		return;
	} else {
		eew(true);
		let user_max_intensity = -1;
		let user_p_wave = 0;
		let user_s_wave = 0;
		for (const key of list) {
			const data = TREM.EQ_list[key].data;
			if (TREM.EQ_list[key].trem) {
				if (Now().getTime() - data.time > 240_000) {
					if (TREM.EQ_list[key].epicenterIcon) {
						TREM.EQ_list[key].epicenterIcon.remove();
					}
					delete TREM.EQ_list[key];
				}
				continue;
			}
			const _eew_location_info = eew_location_info(data);
			const tr_time = _speed(data.depth, _eew_location_info.dist);
			const intensity = pga_to_intensity(_eew_location_info.pga);
			if (data.type == "eew-report") {
				data.time = Now().getTime() - (rts_replay_time - data.originTime);
			}
			if (intensity > user_max_intensity) {
				user_max_intensity = intensity;
			}
			if (Now().getTime() - data._time > 240_000) {
				if (TREM.EQ_list[key].p_wave) {
					TREM.EQ_list[key].p_wave.remove();
				}
				if (TREM.EQ_list[key].s_wave) {
					TREM.EQ_list[key].s_wave.remove();
				}
				if (TREM.EQ_list[key].s_wave_back) {
					TREM.EQ_list[key].s_wave_back.remove();
				}
				if (TREM.EQ_list[key].epicenterIcon) {
					TREM.EQ_list[key].epicenterIcon.remove();
				}
				if (TREM.EQ_list[key].progress) {
					TREM.EQ_list[key].progress.remove();
				}
				delete TREM.EQ_list[key];
				draw_intensity();
				break;
			}
			if (data.cancel) {
				continue;
			}
			if (data.time + (tr_time.Ptime * 1000) < user_p_wave || user_p_wave == 0) {
				user_p_wave = data.time + (tr_time.Ptime * 1000);
			}
			if (data.time + (tr_time.Stime * 1000) < user_s_wave || user_s_wave == 0) {
				user_s_wave = data.time + (tr_time.Stime * 1000);
			}
			const wave = { p: 7, s: 4 };
			let p_dist = Math.floor(Math.sqrt(pow((Now().getTime() - data.time) * wave.p) - pow(data.depth * 1000)));
			let s_dist = Math.floor(Math.sqrt(pow((Now().getTime() - data.time) * wave.s) - pow(data.depth * 1000)));
			for (let _i = 1; _i < TREM.EQ_list[key].wave.length; _i++) {
				if (TREM.EQ_list[key].wave[_i].Ptime > (Now().getTime() - data.time) / 1000) {
					p_dist = (_i - 1) * 1000;
					if ((_i - 1) / TREM.EQ_list[key].wave[_i - 1].Ptime > wave.p) {
						p_dist = Math.round(Math.sqrt(pow((Now().getTime() - data.time) * wave.p) - pow(data.depth * 1000)));
					}
					break;
				}
			}
			for (let _i = 1; _i < TREM.EQ_list[key].wave.length; _i++) {
				if (TREM.EQ_list[key].wave[_i].Stime > (Now().getTime() - data.time) / 1000) {
					s_dist = (_i - 1) * 1000;
					if ((_i - 1) / TREM.EQ_list[key].wave[_i - 1].Stime > wave.s) {
						s_dist = Math.round(Math.sqrt(pow((Now().getTime() - data.time) * wave.s) - pow(data.depth * 1000)));
					}
					break;
				}
			}
			TREM.EQ_list[key].dist = s_dist;
			if (p_dist > data.depth) {
				if (!TREM.EQ_list[key].p_wave) {
					TREM.EQ_list[key].p_wave = L.circle([data.lat, data.lon], {
						color     : "#00FFFF",
						fillColor : "transparent",
						radius    : p_dist,
						className : "p_wave",
						weight    : 0.5,
					}).addTo(TREM.Maps.main);
				} else {
					TREM.EQ_list[key].p_wave.setRadius(p_dist);
				}
			}
			if (s_dist < data.depth) {
				if (TREM.EQ_list[key].s_wave) {
					TREM.EQ_list[key].s_wave.remove();
					delete TREM.EQ_list[key].s_wave;
				}
				const progress = Math.round(((Now().getTime() - data.time) / 1000 / TREM.EQ_list[key].wave[1].Stime) * 100);
				const progress_bar = `<div style="border-radius: 5px;background-color: aqua;height: ${progress}%;"></div>`;
				TREM.EQ_list[key].epicenterTooltip = true;
				TREM.EQ_list[key].epicenterIcon.bindTooltip(progress_bar, { opacity: 1, permanent: true, direction: "right", offset: [10, 0], className: "progress-tooltip" });
			} else {
				if (TREM.EQ_list[key].epicenterTooltip) {
					TREM.EQ_list[key].epicenterIcon.unbindTooltip();
					delete TREM.EQ_list[key].epicenterTooltip;
				}
				if (!TREM.EQ_list[key].s_wave) {
					TREM.EQ_list[key].s_wave = L.circle([data.lat, data.lon], {
						color     : (data.type == "eew-report") ? "grey" : (data.type == "eew-trem") ? "#73BF00" : (TREM.EQ_list[key].alert) ? "red" : "#FF8000",
						fillColor : "transparent",
						radius    : s_dist,
						className : "s_wave",
						weight    : 2,
					}).addTo(TREM.Maps.main);
				} else {
					TREM.EQ_list[key].s_wave.setRadius(s_dist);
				}
				if (item_disable_geojson_vt) {
					if (!TREM.EQ_list[key].s_wave_back) {
						TREM.EQ_list[key].s_wave_back = L.circle([data.lat, data.lon], {
							color     : "transparent",
							fillColor : (data.type == "eew-report") ? "grey" : (data.type == "eew-trem") ? "#73BF00" : (TREM.EQ_list[key].alert) ? "red" : "#FF8000",
							radius    : s_dist,
							className : "s_wave",
							weight    : 1,
						}).addTo(TREM.Maps.main);
					} else {
						TREM.EQ_list[key].s_wave_back.setRadius(s_dist);
					}
				}
				if (TREM.EQ_list[key].s_wave) {
					TREM.EQ_list[key].s_wave.bringToFront();
				}
				if (TREM.EQ_list[key].s_wave_back) {
					TREM.EQ_list[key].s_wave_back.bringToBack();
				}
				if (key == show_eew_id) {
					TREM.eew_bounds = L.latLngBounds();
					let _count = 0;
					for (const loc of Object.keys(TREM.EQ_list[key].loc)) {
						if (TREM.EQ_list[key].loc[loc].pga > 0.8 && TREM.EQ_list[key].loc[loc].dist < s_dist / 1000) {
							_count++;
							const Loc = loc.split(" ");
							TREM.eew_bounds.extend([region[Loc[0]][Loc[1]].lat, region[Loc[0]][Loc[1]].lon]);
						}
					}
					if (!_count) {
						TREM.eew_bounds.extend(TREM.EQ_list[key].s_wave.getBounds());
					}
				}
			}
			if (key == show_eew_id) {
				TREM.eew_bounds.extend([data.lat, data.lon]);
			}
		}
		const p_time = Math.floor((user_p_wave - Now().getTime()) / 1000);
		let s_time = Math.floor((user_s_wave - Now().getTime()) / 1000);
		document.getElementById("p_wave").innerHTML = `P波&nbsp;${(!user_p_wave) ? "--秒" : (p_time > 0) ? `${p_time}秒` : "抵達"}`;
		document.getElementById("s_wave").innerHTML = `S波&nbsp;${(!user_s_wave) ? "--秒" : (s_time > 0) ? `${s_time}秒` : "抵達"}`;
		if (user_max_intensity == -1) {
			document.getElementById("reciprocal").style.display = "none";
		} else {
			const _intensity = int_to_intensity(user_max_intensity);
			_reciprocal_intensity.innerHTML = _intensity;
			_reciprocal_intensity.className = `reciprocal_intensity intensity_${user_max_intensity}`;
			if (user_max_intensity > 0 && item_eew_level <= user_max_intensity && eew_audio_type != "3") {
				document.getElementById("reciprocal").style.display = "flex";
				if (!TREM.arrive) {
					if (s_time < 100 && now_time() - reciprocal > 950) {
						if (audio_reciprocal == -1) {
							audio_reciprocal = s_time;
						}
						if (audio_reciprocal > s_time) {
							audio_reciprocal = s_time;
							reciprocal = now_time();
							if (!audio_intensity) {
								audio_intensity = true;
								TREM.audio.push(`1/${_intensity.replace("⁻", "").replace("⁺", "")}`);
								if (_intensity.includes("⁺")) {
									TREM.audio.push("1/intensity-strong");
								} else if (_intensity.includes("⁻")) {
									TREM.audio.push("1/intensity-weak");
								} else {
									TREM.audio.push("1/intensity");
								}
							} else if (eew_audio_type == "2") {
								void 0;
							} else if (!audio_second) {
								audio_second = true;
								s_time -= 2;
								if (s_time < 99 && s_time > 0) {
									if (s_time > 20) {
										if (s_time % 10 == 0) {
											TREM.audio.push(`1/${s_time.toString().substring(0, 1)}x`);
											TREM.audio.push("1/x0");
										} else {
											TREM.audio.push(`1/${s_time.toString().substring(0, 1)}x`);
											TREM.audio.push(`1/x${s_time.toString().substring(1, 2)}`);
										}
									} else if (s_time > 10) {
										if (s_time % 10 == 0) {
											TREM.audio.push("1/x0");
										} else {
											TREM.audio.push(`1/x${s_time.toString().substring(1, 2)}`);
										}
									} else {
										TREM.audio.push(`1/${s_time}`);
									}
									TREM.audio.push("1/second");
								}
							} else
								if (s_time <= 0) {
									if (arrive_count == 0) {
										TREM.audio.push("1/arrive");
										arrive_count++;
									} else if (arrive_count <= 5) {
										if (item_audio_ding) {
											TREM.audio.push("1/ding");
										}
										arrive_count++;
									} else {
										TREM.arrive = true;
									}
								} else if (s_time > 10) {
									if (s_time % 10 != 0) {
										if (item_audio_ding) {
											TREM.audio.push("1/ding");
										}
									} else {
										TREM.audio.push(`1/${s_time.toString().substring(0, 1)}x`);
										TREM.audio.push("1/x0");
									}
								} else {
									TREM.audio.push(`1/${s_time.toString()}`);
								}
						}
					}
				}
			}
			if (user_max_intensity >= 4 && !TREM.user_alert) {
				TREM.user_alert = true;
				add_info("fa-solid fa-house-crack fa-2x info_icon", "#921AFF", "注意掩護", "#FF8000", "根據資料顯示您所在的地區<br>將發生劇烈搖晃<br>請注意自身安全<br>臨震應變 趴下、掩護、穩住");
			}
		}
	}
	drawer_lock = false;
}, 0);

setInterval(() => {
	if (sleep_state || disable_autoZoom) {
		return;
	}
	if (focus_lock && Date.now() - last_map_time < 60000) {
		return;
	}
	const list = Object.keys(TREM.EQ_list);
	if (last_map_time) {
		last_map_time = 0;
		location_button.style.color = "grey";
		location_button.style.border = "1px solid white";
		focus_lock = false;
		TREM.Maps.main.setView([23.6, 120.4], 7.8);
		refresh_report_list();
	}
	let nsspe = true;
	for (const key of list) {
		if (!TREM.EQ_list[key].trem) {
			nsspe = false;
			break;
		}
	}
	if (!TREM.report_time) {
		if (!list.length || nsspe) {
			if (TREM.rts_bounds._northEast == undefined) {
				if (Zoom && now_time() - Zoom_timestamp > 2500) {
					Zoom = false;
					TREM.Maps.main.setView([23.6, 120.4], 7.8);
				}
				return;
			}
			Zoom_timestamp = now_time();
			Zoom = true;
			TREM.Maps.main.setView(TREM.rts_bounds.getCenter(), TREM.Maps.main.getBoundsZoom(TREM.rts_bounds) - 0.6);
			TREM.rts_bounds = L.latLngBounds();
		} else {
			TREM.rts_bounds = L.latLngBounds();
			const dist_list = [];
			for (const key of list) {
				if (TREM.EQ_list[key].trem) {
					continue;
				}
				dist_list.push(TREM.EQ_list[key].dist ?? 0);
			}
			Zoom_timestamp = now_time();
			Zoom = true;
			const zoom_now = TREM.Maps.main.getZoom();
			const center_now = TREM.Maps.main.getCenter();
			if (TREM.eew_bounds._northEast == undefined) {
				return;
			}
			const center = TREM.eew_bounds.getCenter();
			let zoom = TREM.Maps.main.getBoundsZoom(TREM.eew_bounds) - 0.7;
			if (Math.abs(zoom - zoom_now) < 0.2 || Math.min(dist_list) / 1000 - TREM.dist > -45) {
				zoom = zoom_now;
			}
			const set_center = Math.sqrt(pow((center.lat - center_now.lat) * 111) + pow((center.lng - center_now.lng) * 101));
			TREM.Maps.main.setView((set_center > 10) ? center : center_now, zoom);
		}
	}
}, 50);