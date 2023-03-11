/* eslint-disable no-undef */
document.getElementById("setting_message").innerHTML = get_lang_string("setting.general");
document.getElementById("client-version").innerHTML = app.getVersion();
document.getElementById("client-uuid").title = `${localStorage.UUID}`;
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
const rts_station = document.getElementById("rts_station");

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
			for (let i = 0; i < Object.keys(ans).length; i++) {
				const _station = Object.keys(ans)[i];
				const opt_station = document.createElement("option");
				opt_station.value = _station;
				opt_station.innerHTML = `${_station} ${ans[_station].Loc.replace(" ", "")}`;
				if (_station == (storage.getItem("rts_station") ?? "H-711-11334880-12")) opt_station.selected = true;
				rts_station.appendChild(opt_station);
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

for (let i = 0; i < Object.keys(region).length; i++) {
	const _city = Object.keys(region)[i];
	const opt_city = document.createElement("option");
	opt_city.value = _city;
	opt_city.innerHTML = _city;
	if (!storage.getItem("city")) storage.setItem("city", "臺南市");
	if (!storage.getItem("town")) storage.setItem("town", "歸仁區");
	if (_city == (storage.getItem("city"))) opt_city.selected = true;
	city.appendChild(opt_city);
	if (_city == (storage.getItem("city")))
		for (let _i = 0; _i < Object.keys(region[_city]).length; _i++) {
			const _town = Object.keys(region[_city])[_i];
			const opt_town = document.createElement("option");
			opt_town.value = _town;
			opt_town.innerHTML = _town;
			if (_town == (storage.getItem("town")))
				opt_town.selected = true;
			town.appendChild(opt_town);
		}
	show_site();
}
city.addEventListener("change", (e) => {
	town.innerHTML = "";
	for (let _i = 0; _i < Object.keys(region[city.value]).length; _i++) {
		const _town = Object.keys(region[city.value])[_i];
		const opt_town = document.createElement("option");
		opt_town.value = _town;
		opt_town.innerHTML = _town;
		if (_i == 0 && storage.getItem("city") != city.value) {
			opt_town.selected = true;
			storage.setItem("site", region[city.value][_town].site);
		}
		town.appendChild(opt_town);
	}
	storage.setItem("city", city.value);
	storage.setItem("town", town.value);
	storage.setItem("reset", true);
	reset_lat_long();
	show_site();
});

town.addEventListener("change", (e) => {
	storage.setItem("town", town.value);
	storage.setItem("site", region[city.value][town.value].site);
	storage.setItem("reset", true);
	reset_lat_long();
	show_site();
});
reset_location(true);

input_lat.addEventListener("change", () => reset_location());
input_lon.addEventListener("change", () => reset_location());
site.addEventListener("change", () => storage.setItem("site", site.value));

function reset_location(init = false) {
	if (input_lon.value != "") storage.setItem("lon", input_lon.value);
	if (input_lat.value != "") storage.setItem("lat", input_lat.value);
	if (storage.getItem("lat") && storage.getItem("lon")) {
		input_lat.value = storage.getItem("lat");
		input_lon.value = storage.getItem("lon");
	} else {
		if (!storage.getItem("lat")) input_lat.value = "未設定";
		if (!storage.getItem("lon")) input_lon.value = "未設定";
	}
	if (isNaN(Number(input_lon.value)) || isNaN(Number(input_lat.value))) return;
	city.value = "";
	town.value = "";
	storage.setItem("reset", true);
	if (!init) storage.setItem("site", 1);
	show_site();
}

function reset_lat_long() {
	storage.removeItem("lat");
	storage.removeItem("lon");
	input_lat.value = "未設定";
	input_lon.value = "未設定";
}

function show_site() {site.value = storage.getItem("site") ?? 1.751;}

function _onclick(id) {storage.setItem(id, document.getElementById(id).checked);}