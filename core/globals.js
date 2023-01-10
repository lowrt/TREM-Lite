const { app } = require("@electron/remote");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const region = JSON.parse(fs.readFileSync(path.resolve(app.getAppPath(), "./resource/data/region.json")).toString());
const lang = {};
let tw_lang_data = {};
let lang_data = {};

localStorage.lang = "zh-Hant";

fs.readdirSync(path.join(app.getAppPath(), "./resource/lang/")).forEach((file, i, arr) => {
	try {
		lang[path.parse(file).name] = require(path.join(app.getAppPath(), "./resource/lang/", file));
		console.log(path.parse(file).name);
		if (localStorage.lang == path.parse(file).name) {
			tw_lang_data = JSON.parse(fs.readFileSync(path.resolve(app.getAppPath(), `./resource/lang/${path.parse(file).name}.json`)).toString());
			try {
				lang_data = JSON.parse(fs.readFileSync(path.resolve(app.getAppPath(), `./resource/lang/${path.parse(file).name}.json`)).toString());
			} catch (err) {
				console.log(err);
			}
		}
	} catch (error) {
		console.error(error);
	}
});

function get_lang_string(id) {
	return lang_data[id] ?? tw_lang_data[id] ?? "";
}
