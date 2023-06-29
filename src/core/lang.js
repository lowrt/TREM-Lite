/* eslint-disable no-undef */
const lang = {};
let tw_lang_data = {};
let lang_data = {};

localStorage.lang = "zh-Hant";
localStorage.plugin = "off";

fs.readdirSync(path.join(app.getAppPath(), "./resource/lang/")).forEach((file, i, arr) => {
	try {
		lang[path.parse(file).name] = require(path.join(app.getAppPath(), `./resource/lang/${path.parse(file).name}`, file));
		if (localStorage.lang == path.parse(file).name) {
			tw_lang_data = JSON.parse(fs.readFileSync(path.resolve(app.getAppPath(), `./resource/lang/${path.parse(file).name}/${path.parse(file).name}.json`)).toString());
			try {
				lang_data = JSON.parse(fs.readFileSync(path.resolve(app.getAppPath(), `./resource/lang/${path.parse(file).name}/${path.parse(file).name}.json`)).toString());
				for (let I = 0; I < Object.keys(lang_data).length; I++) {
					const id = Object.keys(lang_data)[I];
					try {
						const item = document.getElementById(id);
						item.textContent = lang_data[id];
					} catch (error) {
						void 0;
					}
				}
			} catch (err) {
				console.log(err);
			}
			// dynamicLoadCss(path.parse(file).name);
		}
	} catch (err) {
		console.error(err);
	}
});

function get_lang_string(id) {
	return lang_data[id] ?? tw_lang_data[id] ?? "";
}

function dynamicLoadCss(url) {
	const currentWindow = BrowserWindow.getFocusedWindow();
	const head = document.getElementsByTagName("head")[0];
	const link = document.createElement("link");
	link.type = "text/css";
	link.rel = "stylesheet";
	if (!currentWindow?.title) {
		if (currentWindow.title == "TREM-Lite")
			link.href = `../resource/lang/${url}/css/main.css`;
		else if (currentWindow.title == "TREM-Lite Setting")
			link.href = `../resource/lang/${url}/css/setting.css`;
	} else {link.href = `../resource/lang/${url}/css/main.css`;}
	head.appendChild(link);
}

const myEventHandler = (e) => {
	console.log(e);
};

plugin.on("scream", myEventHandler);

plugin.emit("scream", 123);