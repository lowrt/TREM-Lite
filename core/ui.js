/* eslint-disable no-undef */
const { ipcRenderer } = require("electron");

document.addEventListener("keydown", (event) => {
	if (event.key == "F11")
		ipcRenderer.send("toggleFullscreen");
	if (event.key == "F12")
		ipcRenderer.send("openDevtool");
	if (event.ctrlKey && event.shiftKey && event.key.toLocaleLowerCase() == "i")
		ipcRenderer.send("openDevtool");
	if (event.ctrlKey && event.key.toLocaleLowerCase() == "r")
		ipcRenderer.send("reloadpage");
});

document.getElementById("eew_max_intensity").innerHTML = get_lang_string("eew.max.intensity");
document.getElementById("max_intensity_text").innerHTML = get_lang_string("rts.max.intensity");
document.getElementById("max_pga_text").innerHTML = get_lang_string("rts.max.pga");
document.getElementById("station_text").innerHTML = get_lang_string("rts.station");