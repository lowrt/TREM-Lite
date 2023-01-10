const { app } = require("@electron/remote");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const region = JSON.parse(fs.readFileSync(path.resolve(app.getAppPath(), "./resource/data/region.json")).toString());

const tw_lang_data = JSON.parse(fs.readFileSync(path.resolve(app.getAppPath(), `./resource/lang/${localStorage.lang ?? "zh-Hant"}.json`)).toString());
let lang_data = {};
try {
	lang_data = JSON.parse(fs.readFileSync(path.resolve(app.getAppPath(), `./resource/lang/${localStorage.lang ?? "zh-Hant"}.json`)).toString());
} catch (err) {
	console.log(err);
}

function get_lang_string(id) {
	return lang_data[id] ?? tw_lang_data[id] ?? "";
}
