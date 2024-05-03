/* eslint-disable no-undef */
const city = document.getElementById("city");
const town = document.getElementById("town");
const input_lat = document.getElementById("lat");
const input_lon = document.getElementById("lon");
const site = document.getElementById("site");
const rts_station = document.getElementById("rts_station");
const user_email = document.getElementById("email");
const user_pass = document.getElementById("password");
const login_btn = document.getElementById("login");
const logout_btn = document.getElementById("logout");
const register_btn = document.getElementById("register");

let rts_list_data = {};

rts.onchange = (e) => {
	storage.setItem("rts-level", rts.value);
};
eew.onchange = (e) => {
	storage.setItem("eew-level", eew.value);
};
rts_station.onchange = (e) => {
	storage.setItem("rts_station", rts_station.value);
	storage.setItem("reset", true);
};

fetch_rts_station();
function fetch_rts_station() {
	const controller = new AbortController();
	setTimeout(() => {
		controller.abort();
	}, 1500);
	fetch("https://cdn.jsdelivr.net/gh/ExpTechTW/API@master/resource/station.json", { signal: controller.signal })
		.then((ans) => ans.json())
		.then((ans) => {
			rts_list_data = station_v1(ans);
			rts_list();
		})
		.catch((err) => {
			console.log(err);
			setTimeout(() => fetch_rts_station(), 3000);
		});
}
function station_v1(station_data) {
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
		stations[station_new_id] = { uuid: station_new_id, Lat, Long, Loc, area };
	}
	return stations;
}

function rts_list() {
	const locations = {};

	for (const uuid in rts_list_data) {
		const loc = rts_list_data[uuid];
		const [ c, t ] = loc.Loc.split(" ");
		locations[c] ??= {};
		locations[c][uuid] = t;
	}

	for (const c in locations) {
		const g = document.createElement("optgroup");
		g.label = c;
		for (const uuid in locations[c]) {
			const t = locations[c][uuid];
			const o = document.createElement("option");
			o.value = uuid;
			o.textContent = `${uuid} ${c} ${t}`;
			if (uuid == (storage.getItem("rts_station") ?? "H-711-11334880")) {
				o.selected = true;
			}
			g.appendChild(o);
		}
		rts_station.appendChild(g);
	}
}

function search_near_rts(lon, lat) {
	let min = 0;
	let name = "";
	for (const id of Object.keys(rts_list_data)) {
		const dist_surface = Math.sqrt(pow((lat - rts_list_data[id].Lat) * 111) + pow((lon - rts_list_data[id].Long) * 101));
		if (!min || min > dist_surface) {
			min = dist_surface;
			name = id;
		}
	}
	storage.setItem("rts_station", name);
	rts_list();
}

const UnselectedOption = (() => {
	const el = document.createElement("option");
	el.selected = true;
	el.hidden = true;
	el.disabled = true;
	el.innerText = "(未設定)";
	return el;
})();

if (!storage.getItem("city")) {
	storage.setItem("city", "臺南市");
}
if (!storage.getItem("town")) {
	storage.setItem("town", "歸仁區");
}

const shouldUseCoords = () => Boolean(storage.getItem("lat") || storage.getItem("lon"));

const updateSiteField = () => site.value = storage.getItem("site") ?? 1.751;

const updateTownSelect = () => {
	if (!shouldUseCoords()) {
		town.replaceChildren();
		let isTownInvalid = !Object.keys(region[storage.getItem("city")]).includes(storage.getItem("town"));
		for (const _town in region[storage.getItem("city")]) {
			if (isTownInvalid) {
				storage.setItem("town", _town);
				isTownInvalid = false;
			}

			const o = document.createElement("option");

			o.value = _town;
			o.innerText = _town;

			if (_town == (storage.getItem("town"))) {
				o.selected = true;
				storage.setItem("site", region[storage.getItem("city")][_town].site ?? 1);
			}

			site.disabled = true;
			town.appendChild(o);
		}

		input_lat.value = "";
		input_lon.value = "";
	} else {
		town.replaceChildren(UnselectedOption);
	}

	updateSiteField();
};

login_display();
function login_display(){
	user_email.disabled = storage.getItem("key") ? true : false;
	user_pass.disabled = storage.getItem("key") ? true : false;

	login_btn.style.display = storage.getItem("key") ? "none" : "";
	logout_btn.style.display = storage.getItem("key") ? "" : "none";
	register_btn.style.display = storage.getItem("key") ? "none" : "";
}

async function login() {
	try {
		const client_name = localStorage.UUID.split(":")[0];
		const client_ver = app.getVersion();
		const email = user_email.value;
		const pass = user_pass.value;
		const resp = await fetch("https://api.exptech.com.tw/api/v3/et/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: email, pass: pass, name: `TREM-Lite Client [${client_name}]/TREM-Lite/${client_ver}/0.0.0` }),
		});
		const ans = await resp.text();
		if (!resp.ok){
			alert(ans);
			throw new Error(`${resp.status} ${ans}`);
			return false;
		}
		storage.setItem("key", ans);
		storage.setItem("reset", true);
		login_display();
		return true;
	} catch (err) {
		log(`Login failed: ${err}`, 3, "setting", "logout");
	}
}

async function logout() {
	try {
		const api_key = storage.getItem("key");
		const resp = await fetch(`https://api.exptech.com.tw/api/v3/et/logout`, {
			method: "DELETE",
			headers: { Authorization: `Basic ${api_key}` },
		});
		const ans = await resp.text();
		if (!resp.ok){
			alert(ans);
			throw new Error(`${resp.status} ${ans}`);
			return false;
		}
		storage.setItem("key", "");
		storage.setItem("reset", true);
		login_display();
		return true;
	} catch (err) {
		log(`Logout failed: ${err}`, 3, "setting", "logout");
	}
}

// init
for (const _city in region) {
	const o = document.createElement("option");
	o.value = _city;
	o.innerText = _city;

	if (_city == (storage.getItem("city"))) {
		o.selected = true;
	}

	city.appendChild(o);
}
updateTownSelect();

if (shouldUseCoords()) {
	city.value = "(未設定)";
	town.value = "(未設定)";
	input_lat.value = storage.getItem("lat");
	input_lon.value = storage.getItem("lon");
}

city.onchange = (e) => {
	storage.setItem("city", city.value);
	storage.removeItem("lat");
	storage.removeItem("lon");
	const t = Object.keys(region[city.value])[0];
	search_near_rts(region[city.value][t].lon, region[city.value][t].lat);
	updateTownSelect();
};

town.onchange = (e) => {
	storage.setItem("town", town.value);
	storage.setItem("site", region[city.value][town.value].site ?? 1);
	search_near_rts(region[city.value][town.value].lon, region[city.value][town.value].lat);
	storage.setItem("reset", true);
	storage.removeItem("lat");
	storage.removeItem("lon");
	updateSiteField();
};

const setCoords = () => {
	if (input_lon.value) {
		storage.setItem("lon", input_lon.value);
	} else {
		storage.setItem("lon", 122);
		input_lon.value = "122";
	}

	if (input_lat.value) {
		storage.setItem("lat", input_lat.value);
	} else {
		storage.setItem("lat", 23);
		input_lat.value = "23";
	}
	site.disabled = false;
	city.value = "(未設定)";
	town.value = "(未設定)";
	search_near_rts(storage.getItem("lon"), storage.getItem("lat"));
	storage.setItem("site", 1);
	storage.setItem("reset", true);
	updateTownSelect();
};

input_lat.onchange = () => {
	setCoords();
};
input_lon.onchange = () => {
	setCoords();
};

site.onchange = () => {
	storage.setItem("site", site.value);
};

function _onclick(id) {
	const state = document.getElementById(id).checked;
	storage.setItem(id, state);
	if (id.startsWith("audio") && state) {
		const audioContext = new AudioContext();
		const source_data = fs.readFileSync(path.resolve(app.getAppPath(), `./resource/audios/${id.replace("audio.", "")}.wav`)).buffer;
		audioContext.decodeAudioData(source_data, (buffer) => {
			const source = audioContext.createBufferSource();
			source.buffer = buffer;
			source.connect(audioContext.destination);
			source.playbackRate = 1.1;
			source.start();
			source.onended = () => {
				source.disconnect();
			};
		});
	}
}

function _onchange(id) {
	const value = document.getElementById(id).value;
	if (value != "") {
		storage.setItem(id, value);
	} else {
		storage.removeItem(id);
	}
}

const openURL = url => {
	shell.openExternal(`https://${url}`);
};

for (const list of document.querySelectorAll(".list")) {
	list.onmousemove = e => {
		for (const item of document.getElementsByClassName("item")) {
			const rect = item.getBoundingClientRect(),
				x = e.clientX - rect.left,
				y = e.clientY - rect.top;

			item.style.setProperty("--mouse-x", `${x}px`);
			item.style.setProperty("--mouse-y", `${y}px`);
		}
	};
}

const map_style = document.getElementById("map-style");
map_style.onchange = () => {
	storage.setItem("map_style", map_style.value);
};

const eew_audio_type = document.getElementById("eew-audio-type");
eew_audio_type.onchange = () => {
	storage.setItem("eew_audio_type", eew_audio_type.value);
};

const Path = path.join(app.getPath("userData"), "plugins");
const plugin_list = fs.readdirSync(Path);
for (const i of plugin_list) {
	try {
		const info = JSON.parse(fs.readFileSync(`${Path}/${i}/trem.json`).toString());

		const item = document.createElement("div");
		item.className = "item";
		const item_border = document.createElement("div");
		item_border.className = "item-border";
		const item_content = document.createElement("div");
		item_content.className = "item-content";
		const item_title = document.createElement("div");
		item_title.className = "item-title";
		item_title.textContent = `${info.name ?? "N/A"}`;
		const item_subtitle = document.createElement("div");
		item_subtitle.className = "item-description";
		item_subtitle.textContent = `${i} ${info.version ?? "0.0.0"}`;

		const item_author = document.createElement("div");
		item_author.className = "item-description";
		item_author.style.fontSize = "12px";
		item_author.textContent = (info.author ?? "N/A").toString().replace(",", "、");

		const item_description = document.createElement("div");
		item_description.className = "item-description";
		item_description.innerHTML = (!info.description) ? "作者未添加說明" : info.description[localStorage.lang] ?? info.description["zh-Hant"] ?? "作者未添加說明";

		const item_options = document.createElement("div");
		item_options.className = "item-options";

		const item_option = document.createElement("div");
		item_option.className = "item-option";

		const checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		if ((storage.getItem("plugin_list") ?? []).includes(i)) {
			checkbox.checked = true;
		}
		checkbox.onclick = () => {
			const list = storage.getItem("plugin_list") ?? [];
			if (checkbox.checked) {
				if (!list.includes(i)) {
					list.push(i);
				}
			} else if (list.includes(i)) {
				list.splice(list.indexOf(i), 1);
			}
			storage.setItem("plugin_list", list);
		};

		const label = document.createElement("label");
		label.textContent = "啟用";

		item_option.appendChild(checkbox);
		item_option.appendChild(label);

		item_options.appendChild(item_option);

		item_content.appendChild(item_title);
		item_content.appendChild(item_subtitle);
		item_content.appendChild(item_author);
		item_content.appendChild(item_description);
		item_content.appendChild(item_options);

		const button = document.createElement("button");
		button.type = "button";
		button.onclick = () => {
			shell.showItemInFolder(`${Path}\\${i}\\config.json`);
		};
		button.innerHTML = "<span>Config 配置文件</span><svg class=\"icon\" width=\"16\" height=\"16\" fill=\"none\" viewBox=\"0 0 24 24\"><path d=\"M6.25 4.75a1.5 1.5 0 0 0-1.5 1.5v11.5a1.5 1.5 0 0 0 1.5 1.5h11.5a1.5 1.5 0 0 0 1.5-1.5v-4a1 1 0 1 1 2 0v4a3.5 3.5 0 0 1-3.5 3.5H6.25a3.5 3.5 0 0 1-3.5-3.5V6.25a3.5 3.5 0 0 1 3.5-3.5h4a1 1 0 1 1 0 2h-4Zm6.5-1a1 1 0 0 1 1-1h6.5a1 1 0 0 1 1 1v6.5a1 1 0 1 1-2 0V6.164l-4.793 4.793a1 1 0 1 1-1.414-1.414l4.793-4.793H13.75a1 1 0 0 1-1-1Z\" fill=\"#ffffff\"/></svg>";
		item_content.append(button);

		const link = document.createElement("button");
		link.type = "button";
		link.onclick = () => {
			shell.openExternal(info.link ?? "https://github.com/ExpTechTW/TREM-Lite");
		};
		link.innerHTML = "<span>Link</span><svg class=\"icon\" width=\"16\" height=\"16\" fill=\"none\" viewBox=\"0 0 24 24\"><path d=\"M6.25 4.75a1.5 1.5 0 0 0-1.5 1.5v11.5a1.5 1.5 0 0 0 1.5 1.5h11.5a1.5 1.5 0 0 0 1.5-1.5v-4a1 1 0 1 1 2 0v4a3.5 3.5 0 0 1-3.5 3.5H6.25a3.5 3.5 0 0 1-3.5-3.5V6.25a3.5 3.5 0 0 1 3.5-3.5h4a1 1 0 1 1 0 2h-4Zm6.5-1a1 1 0 0 1 1-1h6.5a1 1 0 0 1 1 1v6.5a1 1 0 1 1-2 0V6.164l-4.793 4.793a1 1 0 1 1-1.414-1.414l4.793-4.793H13.75a1 1 0 0 1-1-1Z\" fill=\"#ffffff\"/></svg>";
		item_content.append(link);

		item.appendChild(item_border);
		item.appendChild(item_content);
		plugin.appendChild(item);
	} catch (err) {
		log(`Unable to read plugin (${i}) >> ${err}`, 3, "main", "setting");
	}
}

function ipc_send(id, args) {
	if (id == "replay_start") {
		args = document.getElementById("timeline").value;
	}
	ipcRenderer.send(id, args);
}