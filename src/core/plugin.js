/* eslint-disable no-undef */
load_plugin();
function load_plugin() {
	let error = false;
	const pluginsFolder = path.join(app.getPath("userData"), "plugins");
	if (!fs.existsSync(pluginsFolder)) {
		fs.mkdirSync(pluginsFolder);
	}

	let pluginList = storage.getItem("plugin_list");
	const pluginInfo = {
		trem: {
			version: app.getVersion(),
		},
	};
	if (!pluginList) {
		pluginList = [];
	}
	for (const pluginName of pluginList) {
		try {
			if (!fs.existsSync(path.join(pluginsFolder, pluginName))) {
				continue;
			}
			if (fs.existsSync(path.join(pluginsFolder, pluginName, "index.js"))) {
				const f = reload(path.join(pluginsFolder, pluginName, "index.js"));
				let info = {};

				try {
					info = JSON.parse(fs.readFileSync(path.join(pluginsFolder, pluginName, "trem.json"), { encoding: "utf-8" }));
				} catch (err) {
					error = true;
					log(`Plugin failed to load (${pluginName}) >> Info file failed to load`, 3, "plugin", "load_plugin");
					continue;
				}

				let config = {};

				try {
					config = JSON.parse(fs.readFileSync(path.join(pluginsFolder, pluginName, "config.json"), { encoding: "utf-8" }));
				} catch (err) {
					log(`Plugin loading warning (${pluginName}) >> Config failed to load`, 2, "plugin", "load_plugin");
				}

				pluginInfo[pluginName] = {
					f,
					version      : info.version ?? "0.0.0",
					description  : info.description ?? "作者未添加說明",
					author       : info.author ?? ["TREM"],
					dependencies : info.dependencies ?? {},
					link         : info.link ?? "https://github.com/ExpTechTW/TREM-Lite",
					config,
					function     : {},
					path         : path.join(pluginsFolder, pluginName),
				};
			} else {
				error = true;
				log(`Plugin failed to load (${pluginName}) >> Plugin file not found`, 3, "plugin", "load_plugin");
			}
		} catch (err) {
			error = true;
			log(`Plugin failed to load (${pluginName}) >> Unable to load plugin: ${err}`, 3, "plugin", "load_plugin");
		}
	}

	for (const pluginName of Object.keys(pluginInfo)) {
		if (pluginName == "trem") {
			continue;
		}
		const dependencies = pluginInfo[pluginName].dependencies;
		if (ver_string_to_int(app.getVersion()) < ver_string_to_int(dependencies?.trem ?? "0.0.0")) {
			error = true;
			log(`Plugin failed to load (${pluginName}) >> dependencies (TREM) too old (${app.getVersion()} => ^${dependencies.trem})`, 3, "plugin", "load_plugin");
		} else {
			let skip = false;
			for (const name of Object.keys(dependencies)) {
				if (!pluginInfo[name]) {
					error = true;
					skip = true;
					log(`Plugin failed to load (${pluginName}) >> dependencies (${name}) not found`, 3, "plugin", "load_plugin");
				} else if (ver_string_to_int(pluginInfo[name].version) < ver_string_to_int(dependencies[name])) {
					error = true;
					skip = true;
					log(`Plugin failed to load (${pluginName}) >> dependencies (${name}) too old (${pluginInfo[name].version} => ^${dependencies[name]})`, 3, "plugin", "load_plugin");
				}
			}
			if (!skip) {
				const f = pluginInfo[pluginName].f;
				if (f && typeof f.start == "function") {
					f.start(plugin, { storage, info: pluginInfo[pluginName], pluginInfo });
				}
				log(`Plugin loaded successfully (${pluginName})`, 1, "plugin", "load_plugin");
			}
		}
	}

	if (!error) {
		document.getElementById("icon-plugin").style.display = "none";
	}

	log(`Plugin loaded successfully list [${Object.keys(pluginInfo)}]`, 1, "plugin", "load_plugin");

	plugin.emit("trem.plugin.loaded", pluginInfo);
}