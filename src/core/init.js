/* eslint-disable no-undef */
document.getElementById("eew_max_intensity").innerHTML = get_lang_string("eew.max.intensity");
document.getElementById("max_intensity_text").innerHTML = get_lang_string("rts.max.intensity");
document.getElementById("max_pga_text").innerHTML = get_lang_string("rts.max.pga");
const ver_text = document.getElementById("version");
ver_text.innerHTML = app.getVersion();
ver_text.addEventListener("click", () => shell.openExternal("https://github.com/ExpTechTW/TREM-Lite/releases/latest"));

if (!(storage.getItem("tos_1.0.0") ?? false)) {
	const tos = document.getElementById("tos");
	tos.style.display = "";
	document.getElementById("tos_button").addEventListener("click", () => {
		tos.style.display = "none";
		storage.setItem("tos_1.0.0", true);
	});
}

const intensity_text = ["1級", "2級", "3級", "4級", "5弱", "5強", "6弱", "6強", "7級"];
const intensity_list = ["0", "1", "2", "3", "4", "5⁻", "5⁺", "6⁻", "6⁺", "7"];

const icon_intensity_box = document.getElementById("icon_intensity_box");
for (let i = 9; i >= 1; i--) {
	const div = document.createElement("div");
	div.id = `i_level_${i}`;
	div.style.display = "none";
	div.className = "icon_text_box";
	div.innerHTML = `<span class="dot intensity_${i} icon_padding" style="border:0.5px solid black;">${intensity_list[i]}</span>${intensity_text[i - 1]}`;
	icon_intensity_box.appendChild(div);
}

const icon_map_box = document.getElementById("icon_map_box");
for (let i = 9; i >= 1; i--) {
	const div = document.createElement("div");
	div.id = `m_level_${i}`;
	div.style.display = "none";
	div.className = "icon_text_box";
	div.innerHTML = `<span class="square intensity_${i} icon_padding">&nbsp;</span>${intensity_text[i - 1]}`;
	icon_map_box.appendChild(div);
}