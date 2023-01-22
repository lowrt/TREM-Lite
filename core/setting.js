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
for (let i = 0; i < Object.keys(region).length; i++) {
	const _city = Object.keys(region)[i];
	const opt_city = document.createElement("option");
	opt_city.value = _city;
	opt_city.innerHTML = _city;
	if (_city == (get_config().user_location?.city ?? "臺南市")) opt_city.selected = true;
	city.appendChild(opt_city);
	if (_city == (get_config().user_location.city ?? "臺南市"))
		for (let _i = 0; _i < Object.keys(region[_city]).length; _i++) {
			const _town = Object.keys(region[_city])[_i];
			const opt_town = document.createElement("option");
			opt_town.value = _town;
			opt_town.innerHTML = _town;
			if (_town == (get_config().user_location?.town ?? "歸仁區")) opt_town.selected = true;
			town.appendChild(opt_town);
		}

}
city.addEventListener("change", (e) => {
	town.innerHTML = "";
	for (let _i = 0; _i < Object.keys(region[city.value]).length; _i++) {
		const _town = Object.keys(region[city.value])[_i];
		const opt_town = document.createElement("option");
		opt_town.value = _town;
		opt_town.innerHTML = _town;
		if (_town == (get_config().user_location?.town ?? "歸仁區")) opt_town.selected = true;
		town.appendChild(opt_town);
	}
	const config = get_config();
	config.user_location.city = city.value;
	config.user_location.town = town.value;
	save_config(config);
});

town.addEventListener("change", (e) => {
	const config = get_config();
	config.user_location.town = town.value;
	save_config(config);
});

const input_lat = document.getElementById("lat");
const input_lon = document.getElementById("lon");
input_lat.value = get_config().user_location.lat ?? "未設定";
input_lon.value = get_config().user_location.lon ?? "未設定";
input_lat.addEventListener("change", () => {
	if (isNaN(Number(input_lat.value))) return;
	const config = get_config();
	config.user_location.lat = Number(input_lat.value);
	save_config(config);
});
input_lon.addEventListener("change", () => {
	if (isNaN(Number(input_lon.value))) return;
	const config = get_config();
	config.user_location.lon = Number(input_lon.value);
	save_config(config);
});