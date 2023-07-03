/* eslint-disable no-undef */
load_plugin();
function load_plugin() {
	const pluginsFolder = path.join(app.getAppPath(), "plugins");
	const pluginList = storage.getItem("plugin_list") ?? [];
	const pluginInfo = {
		trem: {
			version: app.getVersion(),
		},
	};

	for (const pluginName of pluginList)
		try {
			if (fs.existsSync(path.join(pluginsFolder, pluginName, "index.js"))) {
				const f = reload(path.join(pluginsFolder, pluginName, "index.js"));
				const info = JSON.parse(fs.readFileSync(path.join(pluginsFolder, pluginName, "trem.json"), { encoding: "utf-8" }));
				const config = JSON.parse(fs.readFileSync(path.join(pluginsFolder, pluginName, "config.json"), { encoding: "utf-8" }));

				if (ver_string_to_int(app.getVersion()) < ver_string_to_int(info.dependencies?.trem ?? "0.0.0")) {
					log(`Plugin failed to load (${pluginName})`, 2, "plugin", "load_plugin");
				} else {
					if (f && typeof f.start == "function") f.start();

					log(`Plugin loaded successfully (${pluginName})`, 1, "plugin", "load_plugin");
				}

				pluginInfo[pluginName] = {
					f,
					version      : info.version ?? "0.0.0",
					description  : info.description ?? "作者未添加說明",
					author       : info.author ?? ["TREM"],
					dependencies : info.dependencies ?? {},
					link         : info.link ?? "https://github.com/ExpTechTW/TREM-Lite",
					config,
				};
			} else {
				log(`Plugin file not found (${pluginName})`, 2, "plugin", "load_plugin");
			}
		} catch (err) {
			log(`Unable to load plugin (${pluginName}) >> ${err}`, 3, "plugin", "load_plugin");
		}

	plugin.emit("loaded", pluginInfo);
}