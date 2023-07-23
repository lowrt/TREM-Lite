/* eslint-disable no-undef */
document.onkeydown = (event) => {
	if (event.key == "F11") ipcRenderer.send("toggleFullscreen");
	else if (event.key == "F12") ipcRenderer.send("openDevtool");
	else if (event.ctrlKey && event.shiftKey && event.key.toLocaleLowerCase() == "i") ipcRenderer.send("openDevtool");
	else if (event.ctrlKey && event.key.toLocaleLowerCase() == "r") ipcRenderer.send("reload");
};