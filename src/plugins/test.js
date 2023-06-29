const info = {
	version     : "1.0.0",
	description : {
		"zh_tw": "自動加載",
	},
	author: [
		"whes1015",
	],
	dependencies: {
		"trem": "1.7.0",
	},
	link: "https://github.com/ExpTechTW/TREM-Lite",
};

function start() {
	// eslint-disable-next-line no-undef
	plugin.on("ready", () => console.log("Hello this is a test plugin!"));
}

module.exports = {
	start,
	info,
};