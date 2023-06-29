/* eslint-disable no-undef */
const reload = require("require-reload")(require);
const events = require("events");
const plugin = new events.EventEmitter();
console.log();
load_plugin();
function load_plugin() {
	const Path = path.join(app.getAppPath(), "./plugins/");
	const plugin_list = fs.readdirSync(Path);
	const plugin_info = {};
	for (const i of plugin_list)
		try {
			if (i.endsWith(".js")) {
				const f = reload(Path + i);
				if (ver_string_to_int(app.getVersion()) < ver_string_to_int(f.info?.dependencies?.trem ?? "0.0.0")) {log(`Plugin failed to load (${i})`, 2, "plugin", "load_plugin");} else {
					log(`Plugin loaded successfully (${i})`, 1, "plugin", "load_plugin");
					if (f.start) f.start();
				}
				plugin_info[i.replace(".js", "")] = {
					f,
					version      : f.info?.version ?? "0.0.0",
					description  : f.info?.description ?? "作者未添加說明",
					author       : f.info?.author ?? ["TREM"],
					dependencies : f.info?.dependencies ?? {},
					link         : f.info?.link ?? "https://github.com/ExpTechTW/TREM-Lite",
					config       : f.info?.config ?? {},
				};
			} else {
				const f = reload(Path + i + "/index.js");
				const info = JSON.parse(fs.readFileSync(Path + i + "/trem.json").toString());
				if (ver_string_to_int(app.getVersion()) < ver_string_to_int(info.dependencies?.trem ?? "0.0.0")) {log(`Plugin failed to load (${i})`, 2, "plugin", "load_plugin");} else {
					log(`Plugin loaded successfully (${i})`, 1, "plugin", "load_plugin");
					if (f.start) f.start();
				}
				plugin_info[i] = {
					f,
					version      : info.version ?? "0.0.0",
					description  : info.description ?? "作者未添加說明",
					author       : info.author ?? ["TREM"],
					dependencies : info.dependencies ?? {},
					link         : info.link ?? "https://github.com/ExpTechTW/TREM-Lite",
					config       : info.config ?? {},
				};
			}
		} catch (err) {
			log(`Unable to load plugin (${i}) >> ${err}`, 3, "plugin", "load_plugin");
		}
	plugin.emit("loaded", plugin_info);
}