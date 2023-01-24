/* eslint-disable no-undef */
document.getElementById("setting_message").innerHTML = get_lang_string("setting.general");
// document.getElementById("setting_graphics").innerHTML = get_lang_string("setting.graphics");
// document.getElementById("setting_sound_effects").innerHTML = get_lang_string("setting.sound-effects");
// document.getElementById("setting_language").innerHTML = get_lang_string("setting.language");
// document.getElementById("setting_plug_in").innerHTML = get_lang_string("setting.plug-in");
// document.getElementById("setting_about").innerHTML = get_lang_string("setting.about");
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
				if (_station == (get_config().user_location?.rts_station ?? "H-711-11334880-12")) opt_station.selected = true;
				rts_station.appendChild(opt_station);
			}
			rts_station.addEventListener("change", (e) => {
				const config = get_config();
				config.user_location.rts_station = rts_station.value;
				config.user_location.reset = true;
				save_config(config);
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
	if (_city == (get_config().user_location?.city ?? "臺南市")) opt_city.selected = true;
	city.appendChild(opt_city);
	if (_city == (get_config().user_location.city ?? "臺南市")) {
		const config = get_config();
		for (let _i = 0; _i < Object.keys(region[_city]).length; _i++) {
			const _town = Object.keys(region[_city])[_i];
			const opt_town = document.createElement("option");
			opt_town.value = _town;
			opt_town.innerHTML = _town;
			if (_town == (get_config().user_location?.town ?? "歸仁區")) {
				opt_town.selected = true;
				save_config(config);
			}
			town.appendChild(opt_town);
		}
	}
	show_site();
}
city.addEventListener("change", (e) => {
	town.innerHTML = "";
	const config = get_config();
	for (let _i = 0; _i < Object.keys(region[city.value]).length; _i++) {
		const _town = Object.keys(region[city.value])[_i];
		const opt_town = document.createElement("option");
		opt_town.value = _town;
		opt_town.innerHTML = _town;
		if (_i == 0 && config.user_location.city != city.value) {
			opt_town.selected = true;
			config.user_location.site = region[city.value][_town].site;
		}
		town.appendChild(opt_town);
	}
	config.user_location.city = city.value;
	config.user_location.town = town.value;
	config.user_location.reset = true;
	reset_lat_long(config);
	save_config(config);
	show_site();
});

town.addEventListener("change", (e) => {
	const config = get_config();
	config.user_location.town = town.value;
	config.user_location.site = region[city.value][town.value].site;
	config.user_location.reset = true;
	reset_lat_long(config);
	save_config(config);
	show_site();
});
reset_location(true);

input_lat.addEventListener("change", () => {
	reset_location();
});
input_lon.addEventListener("change", () => {
	reset_location();
});

site.addEventListener("change", () => {
	const config = get_config();
	config.user_location.site = site.value;
	save_config(config);
});

function reset_location(init = false) {
	const config = get_config();
	if (input_lon.value != "") config.user_location.lon = input_lon.value;
	if (input_lat.value != "") config.user_location.lat = input_lat.value;
	save_config(config);
	if (get_config().user_location.lat && get_config().user_location.lon) {
		input_lat.value = get_config().user_location.lat;
		input_lon.value = get_config().user_location.lon;
	} else {
		if (!get_config().user_location.lat) input_lat.value = "未設定";
		if (!get_config().user_location.lon) input_lon.value = "未設定";
	}
	if (isNaN(Number(input_lon.value)) || isNaN(Number(input_lat.value))) return;
	city.value = "";
	town.value = "";
	config.user_location.reset = true;
	if (!init) config.user_location.site = 1;
	save_config(config);
	show_site();
}

function reset_lat_long(config) {
	delete config.user_location.lat;
	delete config.user_location.lon;
	input_lat.value = "未設定";
	input_lon.value = "未設定";
}

function show_site() {
	site.value = get_config().user_location?.site ?? 1.751;
}