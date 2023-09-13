/* eslint-disable no-global-assign */
const ver = "1.0.0";

const storage = {
	init: () => {
		try {
			let json = JSON.parse(localStorage.Config);
			if (json.ver != ver) {
				json = { ver };
			}
			localStorage.Config = JSON.stringify(json);
			return json;
		} catch (err) {
			localStorage.Config = JSON.stringify({});
			return false;
		}
	},
	getItem: (key) => {
		try {
			const json = JSON.parse(localStorage.Config);
			return json[key];
		} catch (err) {
			return false;
		}
	},
	setItem: (key, value) => {
		try {
			const json = JSON.parse(localStorage.Config);
			json[key] = value;
			localStorage.Config = JSON.stringify(json);
			return true;
		} catch (err) {
			return false;
		}
	},
	getAll: () => {
		try {
			const json = JSON.parse(localStorage.Config);
			return json;
		} catch (err) {
			return false;
		}
	},
	removeItem: (key) => {
		try {
			const json = JSON.parse(localStorage.Config);
			delete json[key];
			localStorage.Config = JSON.stringify(json);
			return true;
		} catch (err) {
			return false;
		}
	},
	clear: () => {
		try {
			localStorage.Config = JSON.stringify({});
			return true;
		} catch (err) {
			return false;
		}
	},
};