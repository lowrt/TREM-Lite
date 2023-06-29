/* eslint-disable no-undef */
const city = document.getElementById("city");
const town = document.getElementById("town");
const input_lat = document.getElementById("lat");
const input_lon = document.getElementById("lon");
const site = document.getElementById("site");
const key = document.getElementById("key");
const rts_station = document.getElementById("rts_station");

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
	fetch("https://exptech.com.tw/api/v1/file?path=/resource/station.json", { signal: controller.signal })
		.then((ans) => ans.json())
		.then((ans) => {
			rts_list_data = ans;
			rts_list();
		})
		.catch((err) => {
			console.log(err);
			setTimeout(() => fetch_rts_station(), 3000);
		});
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
			if (uuid == (storage.getItem("rts_station") ?? "H-711-11334880-12")) o.selected = true;
			g.appendChild(o);
		}
		rts_station.appendChild(g);
	}
}

function search_near_rts(lon, lat) {
	let min = 0;
	let name = "";
	for (let i = 0; i < Object.keys(rts_list_data).length; i++) {
		const id = Object.keys(rts_list_data)[i];
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

if (!storage.getItem("city")) storage.setItem("city", "臺南市");
if (!storage.getItem("town")) storage.setItem("town", "歸仁區");

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
				storage.setItem("site", region[storage.getItem("city")][_town].site);
			}

			site.disabled = true;
			town.appendChild(o);
		}

		input_lat.value = "";
		input_lon.value = "";
	} else {town.replaceChildren(UnselectedOption);}

	updateSiteField();
};

// init
for (const _city in region) {
	const o = document.createElement("option");
	o.value = _city;
	o.innerText = _city;

	if (_city == (storage.getItem("city")))
		o.selected = true;

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
	storage.setItem("site", region[city.value][town.value].site);
	search_near_rts(region[city.value][town.value].lon, region[city.value][town.value].lat);
	storage.setItem("reset", true);
	storage.removeItem("lat");
	storage.removeItem("lon");
	updateSiteField();
};

const setCoords = () => {
	if (input_lon.value) {storage.setItem("lon", input_lon.value);} else {
		storage.setItem("lon", 122);
		input_lon.value = "122";
	}

	if (input_lat.value) {storage.setItem("lat", input_lat.value);} else {
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

input_lat.onchange = () => { setCoords();};
input_lon.onchange = () => { setCoords();};

site.onchange = () => { storage.setItem("site", site.value);};

key.value = storage.getItem("key") ?? "";
key.onchange = () => {
	storage.setItem("key", key.value);
	storage.setItem("reset", true);
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

const openURL = url => {
	shell.openExternal(url);
};

for (const list of document.querySelectorAll(".list"))
	list.onmousemove = e => {
		for (const item of document.getElementsByClassName("item")) {
			const rect = item.getBoundingClientRect(),
				x = e.clientX - rect.left,
				y = e.clientY - rect.top;

			item.style.setProperty("--mouse-x", `${x}px`);
			item.style.setProperty("--mouse-y", `${y}px`);
		}
	};

const map_style = document.getElementById("map-style");
map_style.onchange = () => {
	storage.setItem("map_style", map_style.value);
};

const eew_audio_type = document.getElementById("eew-audio-type");
eew_audio_type.onchange = () => {
	storage.setItem("eew_audio_type", eew_audio_type.value);
};

const Path = path.join(app.getAppPath(), "./plugins/");
const plugin_list = fs.readdirSync(Path);
for (const i of plugin_list)
	try {
		const info = JSON.parse(fs.readFileSync(Path + i + "/trem.json").toString());

		const item = document.createElement("div");
		item.className = "item";
		const item_border = document.createElement("div");
		item_border.className = "item-border";
		const item_content = document.createElement("div");
		item_content.className = "item-content";
		const item_title = document.createElement("div");
		item_title.className = "item-title";
		item_title.textContent = i;
		const item_author = document.createElement("div");
		item_author.className = "item-description";
		item_author.textContent = info.author.toString().replace(",", "、");

		const item_description = document.createElement("div");
		item_description.className = "item-description";
		item_description.textContent = info.description[localStorage.lang] ?? info.description.zh_Hant ?? "作者未添加說明";

		const item_options = document.createElement("div");
		item_options.className = "item-options";

		const item_option = document.createElement("div");
		item_option.className = "item-option";

		const checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		if ((storage.getItem("plugin_list") ?? []).includes(i)) checkbox.checked = true;
		checkbox.onclick = () => {
			const list = storage.getItem("plugin_list") ?? [];
			if (checkbox.checked) {
				if (!list.includes(i)) list.push(i);
			} else if (list.includes(i)) {list.splice(list.indexOf(i), 1);}
			storage.setItem("plugin_list", list);
		};

		const label = document.createElement("label");
		label.textContent = "啟用";

		item_option.appendChild(checkbox);
		item_option.appendChild(label);

		item_options.appendChild(item_option);

		item_content.appendChild(item_title);
		item_content.appendChild(item_author);
		item_content.appendChild(item_description);
		item_content.appendChild(item_options);

		item.appendChild(item_border);
		item.appendChild(item_content);
		plugin.appendChild(item);
	} catch (err) {
		log(`Unable to read plugin (${i}) >> ${err}`, 3, "main", "setting");
	}