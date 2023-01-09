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