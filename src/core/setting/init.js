/* eslint-disable no-undef */
const title_general = document.getElementById("title-general");
const title_graphics = document.getElementById("title-graphics");
const title_sound_effects = document.getElementById("title-sound-effects");

title_general.textContent = get_lang_string("setting.general");
title_graphics.textContent = get_lang_string("setting.graphics");
title_sound_effects.textContent = get_lang_string("setting.sound-effects");

const general = document.getElementById("general");
const graphics = document.getElementById("graphics");
const sound_effects = document.getElementById("sound-effects");

title_general.onclick = () => {
	general.style.display = "";
	graphics.style.display = "none";
	sound_effects.style.display = "none";
};
title_graphics.onclick = () => {
	general.style.display = "none";
	graphics.style.display = "";
	sound_effects.style.display = "none";
};
title_sound_effects.onclick = () => {
	general.style.display = "none";
	graphics.style.display = "none";
	sound_effects.style.display = "";
};

document.getElementById("jma").checked = storage.getItem("jma") ?? true;
document.getElementById("nied").checked = storage.getItem("nied") ?? true;
document.getElementById("kma").checked = storage.getItem("kma") ?? true;
document.getElementById("scdzj").checked = storage.getItem("scdzj") ?? true;

document.getElementById("show_eew").checked = storage.getItem("show_eew") ?? true;
document.getElementById("show_report").checked = storage.getItem("show_report") ?? true;
document.getElementById("show_trem").checked = storage.getItem("show_trem") ?? true;
document.getElementById("show_palert").checked = storage.getItem("show_palert") ?? true;

document.getElementById("ota_restart").checked = storage.getItem("ota_restart") ?? false;
document.getElementById("disable_autoZoom").checked = storage.getItem("disable_autoZoom") ?? false;
document.getElementById("speecd_use").checked = storage.getItem("speecd_use") ?? false;

document.getElementById("client-version").textContent = app.getVersion();
document.getElementById("client-uuid").title = `點擊複製 UUID\n${localStorage.UUID}`;
document.getElementById("client-uuid").onclick = () => {
	navigator.clipboard.writeText(localStorage.UUID).then(() => {
		console.log(localStorage.UUID);
		console.log("複製成功");
	});
};