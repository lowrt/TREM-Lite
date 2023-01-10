const { BrowserWindow, app, shell } = require("@electron/remote");
const fetch = require("node-fetch");
const fs = require("fs");
const { ipcRenderer } = require("electron");
const path = require("path");
const region = JSON.parse(fs.readFileSync(path.resolve(app.getAppPath(), "./resource/data/region.json")).toString());
const lang = {};

let tw_lang_data = {};
let lang_data = {};

localStorage.lang = "zh-Hant";

fs.readdirSync(path.join(app.getAppPath(), "./resource/lang/")).forEach((file, i, arr) => {
	try {
		lang[path.parse(file).name] = require(path.join(app.getAppPath(), `./resource/lang/${path.parse(file).name}`, file));
		console.log(path.parse(file).name);
		if (localStorage.lang == path.parse(file).name) {
			tw_lang_data = JSON.parse(fs.readFileSync(path.resolve(app.getAppPath(), `./resource/lang/${path.parse(file).name}/${path.parse(file).name}.json`)).toString());
			try {
				lang_data = JSON.parse(fs.readFileSync(path.resolve(app.getAppPath(), `./resource/lang/${path.parse(file).name}/${path.parse(file).name}.json`)).toString());
			} catch (err) {
				console.log(err);
			}
			const currentWindow = BrowserWindow.getFocusedWindow();
			console.log(currentWindow.title);
			const head = document.getElementsByTagName("head")[0];
			const link = document.createElement("link");
			link.type = "text/css";
			link.rel = "stylesheet";
			if (currentWindow.title == "TREM-Lite")
				link.href = `../resource/lang/${path.parse(file).name}/css/main.css`;
			else if (currentWindow.title == "TREM-Lite Setting")
				link.href = `../resource/lang/${path.parse(file).name}/css/setting.css`;
			head.appendChild(link);
		}
	} catch (err) {
		console.error(err);
	}
});

function get_lang_string(id) {
	return lang_data[id] ?? tw_lang_data[id] ?? "";
}
