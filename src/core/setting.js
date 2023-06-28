/* eslint-disable no-undef */
document.getElementById("setting_message").textContent = get_lang_string("setting.general");
document.getElementById("client-version").textContent = app.getVersion();
document.getElementById("client-uuid").title = `點擊複製 UUID\n${localStorage.UUID}`;
document.getElementById("client-uuid").addEventListener("click", () => {
	navigator.clipboard.writeText(localStorage.UUID).then(() => {
		console.log(localStorage.UUID);
		console.log("複製成功");
	});
});

const city = document.getElementById("city");
const town = document.getElementById("town");
const input_lat = document.getElementById("lat");
const input_lon = document.getElementById("lon");
const site = document.getElementById("site");
const key = document.getElementById("key");
const rts_station = document.getElementById("rts_station");

const intensity_text = ["0級", "1級", "2級", "3級", "4級", "5弱", "5強", "6弱", "6強", "7級"];
const rts = document.getElementById("rts-level");
const eew = document.getElementById("eew-level");
for (let i = 0; i < intensity_text.length; i++) {
	const o1 = document.createElement("option");
	o1.textContent = intensity_text[i];
	o1.value = i;
	if ((storage.getItem("rts-level") ?? -1) == i) o1.selected = true;
	rts.appendChild(o1);
	const o2 = document.createElement("option");
	o2.textContent = intensity_text[i];
	o2.value = i;
	if ((storage.getItem("eew-level") ?? -1) == i) o2.selected = true;
	eew.appendChild(o2);
}
rts.addEventListener("change", (e) => {
	storage.setItem("rts-level", rts.value);
});
eew.addEventListener("change", (e) => {
	storage.setItem("eew-level", eew.value);
});

init_f();
function init_f() {
	document.getElementById("jma").checked = storage.getItem("jma") ?? true;
	document.getElementById("nied").checked = storage.getItem("nied") ?? true;
	document.getElementById("kma").checked = storage.getItem("kma") ?? true;
	document.getElementById("scdzj").checked = storage.getItem("scdzj") ?? true;

	document.getElementById("show_eew").checked = storage.getItem("show_eew") ?? true;
	document.getElementById("show_report").checked = storage.getItem("show_report") ?? true;
	document.getElementById("show_trem").checked = storage.getItem("show_trem") ?? true;
	document.getElementById("show_palert").checked = storage.getItem("show_palert") ?? true;
}

fetch_rts_station();
function fetch_rts_station() {
	const controller = new AbortController();
	setTimeout(() => {
		controller.abort();
	}, 1500);
	fetch("https://exptech.com.tw/api/v1/file?path=/resource/station.json", { signal: controller.signal })
		.then((ans) => ans.json())
		.then((ans) => {
			const locations = {};

			for (const uuid in ans) {
				const loc = ans[uuid];
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

			rts_station.addEventListener("change", (e) => {
				storage.setItem("rts_station", rts_station.value);
				storage.setItem("reset", true);
			});
		})
		.catch((err) => {
			console.log(err);
			setTimeout(() => fetch_rts_station(), 3000);
		});
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

city.addEventListener("change", (e) => {
	storage.setItem("city", city.value);
	storage.removeItem("lat");
	storage.removeItem("lon");
	updateTownSelect();
});

town.addEventListener("change", (e) => {
	storage.setItem("town", town.value);
	storage.setItem("site", region[city.value][town.value].site);
	storage.setItem("reset", true);
	storage.removeItem("lat");
	storage.removeItem("lon");
	updateSiteField();
});

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
	storage.setItem("site", 1);
	storage.setItem("reset", true);
	updateTownSelect();
};

input_lat.addEventListener("change", () => setCoords());
input_lon.addEventListener("change", () => setCoords());

site.addEventListener("change", () => storage.setItem("site", site.value));

key.value = storage.getItem("key") ?? "";
key.addEventListener("change", () => {
	storage.setItem("key", key.value);
	storage.setItem("reset", true);
});

function _onclick(id) {storage.setItem(id, document.getElementById(id).checked);}

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
