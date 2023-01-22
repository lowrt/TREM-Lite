/* eslint-disable no-undef */
document.getElementById("setting_message").innerHTML = get_lang_string("setting.general");
document.getElementById("setting_graphics").innerHTML = get_lang_string("setting.graphics");
document.getElementById("setting_sound_effects").innerHTML = get_lang_string("setting.sound-effects");
document.getElementById("setting_language").innerHTML = get_lang_string("setting.language");
document.getElementById("setting_plug_in").innerHTML = get_lang_string("setting.plug-in");
document.getElementById("setting_about").innerHTML = get_lang_string("setting.about");
document.getElementById("client-version").innerHTML = app.getVersion();
document.getElementById("client-uuid").title = `${localStorage.UUID}`;
document.getElementById("client-uuid").addEventListener("click", () => {
	navigator.clipboard.writeText(localStorage.UUID).then(() => {
		console.log(localStorage.UUID);
		console.log("複製成功");
	});
});

const input_lat = document.getElementById("lat");
const input_lon = document.getElementById("lon");
const _config = get_config();
input_lat.value = _config.user_location.lat ?? "未設定";
input_lon.value = _config.user_location.lon ?? "未設定";
input_lat.addEventListener("change", () => {
	if (isNaN(Number(input_lat.value))) return;
	const config = get_config();
	config.user_location.lat = Number(input_lat.value);
	save_config(_config);
});
input_lon.addEventListener("change", () => {
	if (isNaN(Number(input_lon.value))) return;
	const config = get_config();
	config.user_location.lon = Number(input_lon.value);
	save_config(_config);
});