const storage = require("electron-localstorage");

function delete_config() {
	delete localStorage.Config;
	init_config();
}

function get_config() {
	init_config();
	return JSON.parse(localStorage.Config);
}

function init_config() {
	if (!localStorage.Config)
		localStorage.Config = JSON.stringify({
			user_location: {},
		});
}

function save_config(config) {
	localStorage.Config = JSON.stringify(config);
}